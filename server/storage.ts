import { 
  users, type User, type InsertUser,
  chapters, type Chapter, type InsertChapter,
  topics, type Topic, type InsertTopic,
  questions, type Question, type InsertQuestion,
  quizAttempts, type QuizAttempt, type InsertQuizAttempt,
  userProgress, type UserProgress, type InsertUserProgress,
  studySessions, type StudySession, type InsertStudySession,
  activityLog, type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from 'crypto';
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserLastLogin(id: number): Promise<void>;
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Chapter methods
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  getChapter(id: number): Promise<Chapter | undefined>;
  getAllChapters(): Promise<Chapter[]>;
  updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter>;
  deleteChapter(id: number): Promise<void>;
  
  // Topic methods
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopic(id: number): Promise<Topic | undefined>;
  getAllTopics(): Promise<Topic[]>;
  getTopicsByChapter(chapterId: number): Promise<Topic[]>;
  updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic>;
  deleteTopic(id: number): Promise<void>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: number): Promise<Question | undefined>;
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByTopic(topicId: number): Promise<Question[]>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  
  // Quiz attempt methods
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: number): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]>;
  getQuizAttemptsByTopic(topicId: number): Promise<QuizAttempt[]>;
  
  // User progress methods
  createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgressByUser(userId: number): Promise<UserProgress[]>;
  getUserProgressByChapter(userId: number, chapterId: number): Promise<UserProgress[]>;
  
  // Study session methods
  createStudySession(session: InsertStudySession): Promise<StudySession>;
  getStudySessionsByUser(userId: number): Promise<StudySession[]>;
  getTotalStudyTime(userId: number): Promise<number>;
  
  // Activity log methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivitiesByUser(userId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Stats methods
  getUserStats(userId: number): Promise<{
    questionsAttempted: number;
    accuracy: number;
    studyTime: number;
    overallProgress: number;
    chapterProgress: Array<{ chapterId: number, title: string, progress: number }>;
  }>;
  
  getAdminStats(): Promise<{
    totalStudents: number;
    chapters: number;
    topics: number;
    questions: number;
  }>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return false;
    }
    
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Token valid for 1 hour
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    
    // Update the user with the reset token
    await db.update(users)
      .set({ 
        resetToken,
        resetTokenExpiry
      })
      .where(eq(users.id, user.id));
    
    return true;
  }
  
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Find user with the given token and not expired
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          sql`${users.resetTokenExpiry} > NOW()`
        )
      );
    
    if (!user) {
      return false;
    }
    
    // Update password and clear token
    await db.update(users)
      .set({ 
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(users.id, user.id));
    
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Chapter methods
  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const [newChapter] = await db.insert(chapters).values(chapter).returning();
    return newChapter;
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter;
  }

  async getAllChapters(): Promise<Chapter[]> {
    return await db.select().from(chapters).orderBy(chapters.order);
  }

  async updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter> {
    const [updatedChapter] = await db
      .update(chapters)
      .set(chapter)
      .where(eq(chapters.id, id))
      .returning();
    
    if (!updatedChapter) {
      throw new Error(`Chapter with id ${id} not found`);
    }
    
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<void> {
    // Get topics in this chapter
    const topicsToDelete = await this.getTopicsByChapter(id);
    
    // Delete topics one by one (to trigger cascading deletes properly)
    for (const topic of topicsToDelete) {
      await this.deleteTopic(topic.id);
    }
    
    // Delete the chapter
    await db.delete(chapters).where(eq(chapters.id, id));
  }

  // Topic methods
  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getAllTopics(): Promise<Topic[]> {
    return await db.select().from(topics).orderBy(topics.order);
  }

  async getTopicsByChapter(chapterId: number): Promise<Topic[]> {
    return await db
      .select()
      .from(topics)
      .where(eq(topics.chapterId, chapterId))
      .orderBy(topics.order);
  }

  async updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic> {
    const [updatedTopic] = await db
      .update(topics)
      .set(topic)
      .where(eq(topics.id, id))
      .returning();
    
    if (!updatedTopic) {
      throw new Error(`Topic with id ${id} not found`);
    }
    
    return updatedTopic;
  }

  async deleteTopic(id: number): Promise<void> {
    // Get questions in this topic
    const questionsToDelete = await this.getQuestionsByTopic(id);
    
    // Delete questions one by one
    for (const question of questionsToDelete) {
      await this.deleteQuestion(question.id);
    }
    
    // Delete the topic
    await db.delete(topics).where(eq(topics.id, id));
  }

  // Question methods
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async getQuestionsByTopic(topicId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.topicId, topicId));
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    
    if (!updatedQuestion) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Quiz attempt methods
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttempt(id: number): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getQuizAttemptsByTopic(topicId: number): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.topicId, topicId));
  }

  // User progress methods
  async createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    // Check if progress exists
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, progress.userId),
          eq(userProgress.topicId, progress.topicId)
        )
      );
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(userProgress)
        .set({
          progress: progress.progress,
          completed: progress.completed,
          lastActivity: progress.lastActivity
        })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      
      return updatedProgress;
    } else {
      // Create new progress
      const [newProgress] = await db.insert(userProgress).values(progress).returning();
      return newProgress;
    }
  }

  async getUserProgressByUser(userId: number): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async getUserProgressByChapter(userId: number, chapterId: number): Promise<UserProgress[]> {
    // First get topics for the chapter
    const chapterTopics = await this.getTopicsByChapter(chapterId);
    
    if (chapterTopics.length === 0) {
      return [];
    }
    
    // Then get progress for those topics
    const topicIds = chapterTopics.map(topic => topic.id);
    
    return await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          sql`${userProgress.topicId} IN (${sql.join(topicIds, sql`, `)})`
        )
      );
  }

  // Study session methods
  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const [newSession] = await db.insert(studySessions).values(session).returning();
    return newSession;
  }

  async getStudySessionsByUser(userId: number): Promise<StudySession[]> {
    return await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.startedAt));
  }

  async getTotalStudyTime(userId: number): Promise<number> {
    const result = await db
      .select({ total: sql`SUM(${studySessions.duration})` })
      .from(studySessions)
      .where(eq(studySessions.userId, userId));
    
    return result[0]?.total || 0;
  }

  // Activity log methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const newLog = {
      ...log,
      createdAt: log.createdAt || new Date()
    };
    
    const [createdLog] = await db.insert(activityLog).values(newLog).returning();
    return createdLog;
  }

  async getRecentActivitiesByUser(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  // Stats methods
  async getUserStats(userId: number): Promise<{
    questionsAttempted: number;
    accuracy: number;
    studyTime: number;
    overallProgress: number;
    chapterProgress: Array<{ chapterId: number, title: string, progress: number }>;
  }> {
    // Get quiz attempts for the user
    const attempts = await this.getQuizAttemptsByUser(userId);
    
    // Calculate questions attempted
    const questionsAttempted = attempts.reduce((total, attempt) => total + attempt.totalQuestions, 0);
    
    // Calculate accuracy
    const totalCorrect = attempts.reduce((total, attempt) => total + attempt.score, 0);
    const accuracy = questionsAttempted > 0 
      ? Math.round((totalCorrect / questionsAttempted) * 100) 
      : 0;
    
    // Get study time
    const studyTime = await this.getTotalStudyTime(userId);
    
    // Get all chapters
    const allChapters = await this.getAllChapters();
    
    // Get user progress
    const progress = await this.getUserProgressByUser(userId);
    
    // Calculate chapter progress
    const chapterProgress = [];
    
    for (const chapter of allChapters) {
      const topics = await this.getTopicsByChapter(chapter.id);
      if (topics.length === 0) continue;
      
      let chapterProgressSum = 0;
      let topicsWithProgress = 0;
      
      for (const topic of topics) {
        const topicProgress = progress.find(p => p.topicId === topic.id);
        if (topicProgress) {
          chapterProgressSum += topicProgress.progress;
          topicsWithProgress++;
        }
      }
      
      const avgProgress = topicsWithProgress > 0 
        ? Math.round(chapterProgressSum / topicsWithProgress) 
        : 0;
      
      chapterProgress.push({
        chapterId: chapter.id,
        title: chapter.title,
        progress: avgProgress
      });
    }
    
    // Calculate overall progress
    const overallProgress = chapterProgress.length > 0
      ? Math.round(chapterProgress.reduce((sum, chapter) => sum + chapter.progress, 0) / chapterProgress.length)
      : 0;
    
    return {
      questionsAttempted,
      accuracy,
      studyTime,
      overallProgress,
      chapterProgress
    };
  }

  async getAdminStats(): Promise<{
    totalStudents: number;
    chapters: number;
    topics: number;
    questions: number;
  }> {
    // Count students
    const [studentsResult] = await db
      .select({ count: sql`COUNT(*)` })
      .from(users)
      .where(eq(users.role, 'student'));
    
    // Count chapters
    const [chaptersResult] = await db
      .select({ count: sql`COUNT(*)` })
      .from(chapters);
    
    // Count topics
    const [topicsResult] = await db
      .select({ count: sql`COUNT(*)` })
      .from(topics);
    
    // Count questions
    const [questionsResult] = await db
      .select({ count: sql`COUNT(*)` })
      .from(questions);
      
    return {
      totalStudents: Number(studentsResult?.count || 0),
      chapters: Number(chaptersResult?.count || 0),
      topics: Number(topicsResult?.count || 0),
      questions: Number(questionsResult?.count || 0)
    };
  }
}

export const storage = new DatabaseStorage();
