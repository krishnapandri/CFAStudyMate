import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends SelectUser {}
    interface Request {
      user?: SelectUser;
    }
  }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "cfa-level-i-jwt-secret";
const JWT_EXPIRES_IN = "24h"; // Token expires in 24 hours

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes('.')) {
    console.error('Invalid stored password format:', stored ? 'Has value but no salt separator' : 'Is undefined');
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  
  if (!salt) {
    console.error('No salt found in stored password');
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// Generate JWT token
function generateToken(user: SelectUser) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// JWT authentication middleware
const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the token from the Authorization header or from cookies
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // No token, but allow the request to continue to other auth methods
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = await storage.getUser(decoded.id);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // JWT verification failed - but don't send an error, just continue to other auth methods
    next();
  }
};

export function setupAuth(app: Express) {
  // Set up both session and JWT authentication
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'cfa-level-i-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(authenticateJWT); // Apply JWT middleware before Passport

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          await storage.updateUserLastLogin(user.id);
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, name, role = "student" } = req.body;
      
      if (!username || !email || !password || !name) {
        return res.status(400).json({ message: "Username, email, password, and name are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check for existing email
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Only allow admin creation by existing admin users
      const isAdminRequest = role === "admin";
      const isAdminUser = req.user?.role === "admin";
      
      if (isAdminRequest && !isAdminUser) {
        return res.status(403).json({ message: "Unauthorized to create admin users" });
      }

      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
        role,
      });

      // For security reasons, don't send back the password
      const userWithoutPassword = { ...user, password: undefined };

      // Generate a JWT token
      const token = generateToken(user);
      
      // Use both JWT and session for compatibility
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user: userWithoutPassword, token });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      // Generate a JWT token
      const token = generateToken(user);
      
      // Use both JWT and session for compatibility
      req.login(user, (err) => {
        if (err) return next(err);
        
        // For security reasons, don't send back the password
        const userWithoutPassword = { ...user, password: undefined };
        res.status(200).json({ user: userWithoutPassword, token });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    // For security reasons, don't send back the password
    const userWithoutPassword = { ...req.user, password: undefined };
    res.json(userWithoutPassword);
  });
  
  // Forgot password endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Request password reset token (doesn't reveal if email exists for security)
      const success = await storage.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration attacks
      res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent" });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      const success = await storage.resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "An error occurred while resetting your password" });
    }
  });

  // Middleware to check if user is authenticated (supports both JWT and session)
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // User will be set by either JWT middleware or passport session
    if (req.user) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    // User will be set by either JWT middleware or passport session
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Not authorized" });
  };

  return { isAuthenticated, isAdmin };
}
