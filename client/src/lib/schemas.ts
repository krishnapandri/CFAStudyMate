import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

// Simple login schema
export const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

// Extended schema for registration form validation
export const registerSchema = insertUserSchema.pick({ 
  username: true, 
  email: true,
  password: true, 
  name: true 
}).extend({
  confirmPassword: z.string(),
  role: z.enum(["student", "admin"]).default("student")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;