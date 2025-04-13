import { pgTable, text, serial, integer, boolean, timestamp, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"),
  lastLogin: timestamp("last_login"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

// Chapters table
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
});

// Topics table
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  chapterId: integer("chapter_id").notNull(),
  order: integer("order").notNull(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctOption: integer("correct_option").notNull(),
  explanation: text("explanation").notNull(),
  topicId: integer("topic_id").notNull(),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at").notNull(),
});

// User progress table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  topicId: integer("topic_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  lastActivity: timestamp("last_activity"),
}, (table) => {
  return {
    userProgressUnique: unique().on(table.userId, table.topicId),
  };
});

// Study sessions table
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  chapterId: integer("chapter_id").notNull(),
  topicId: integer("topic_id"),
  duration: integer("duration").notNull(), // in minutes
  startedAt: timestamp("started_at").notNull(),
});

// Activity log table
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activity: text("activity").notNull(),
  entityType: text("entity_type"), // chapter, topic, quiz
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: json("metadata"),
});

// Define insert schemas using Zod
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  role: true,
});

export const insertChapterSchema = createInsertSchema(chapters).pick({
  title: true,
  description: true,
  order: true,
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  title: true,
  description: true,
  chapterId: true,
  order: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  text: true,
  options: true,
  correctOption: true,
  explanation: true,
  topicId: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true,
  topicId: true,
  score: true,
  totalQuestions: true,
  completedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  chapterId: true,
  topicId: true,
  completed: true,
  progress: true,
  lastActivity: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).pick({
  userId: true,
  chapterId: true,
  topicId: true,
  duration: true,
  startedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).pick({
  userId: true,
  activity: true,
  entityType: true,
  entityId: true,
  metadata: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
