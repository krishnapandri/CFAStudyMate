import { InsertUser } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists, skipping creation.");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await hashPassword("password");
    const adminUser: InsertUser = {
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
    };

    const result = await db.insert(users).values(adminUser).returning();
    console.log("Admin user created successfully:", result[0].id);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();