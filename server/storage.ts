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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserLastLogin(id: number): Promise<void>;
  
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

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private chaptersMap: Map<number, Chapter>;
  private topicsMap: Map<number, Topic>;
  private questionsMap: Map<number, Question>;
  private quizAttemptsMap: Map<number, QuizAttempt>;
  private userProgressMap: Map<number, UserProgress>;
  private studySessionsMap: Map<number, StudySession>;
  private activityLogMap: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private chapterIdCounter: number;
  private topicIdCounter: number;
  private questionIdCounter: number;
  private quizAttemptIdCounter: number;
  private userProgressIdCounter: number;
  private studySessionIdCounter: number;
  private activityLogIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.chaptersMap = new Map();
    this.topicsMap = new Map();
    this.questionsMap = new Map();
    this.quizAttemptsMap = new Map();
    this.userProgressMap = new Map();
    this.studySessionsMap = new Map();
    this.activityLogMap = new Map();
    
    this.userIdCounter = 1;
    this.chapterIdCounter = 1;
    this.topicIdCounter = 1;
    this.questionIdCounter = 1;
    this.quizAttemptIdCounter = 1;
    this.userProgressIdCounter = 1;
    this.studySessionIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "password", // This will be hashed in auth.ts
      name: "Admin User",
      role: "admin",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      lastLogin: null
    };
    this.usersMap.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      user.lastLogin = new Date();
      this.usersMap.set(id, user);
    }
  }

  // Chapter methods
  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const id = this.chapterIdCounter++;
    const newChapter: Chapter = { ...chapter, id };
    this.chaptersMap.set(id, newChapter);
    return newChapter;
  }

  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chaptersMap.get(id);
  }

  async getAllChapters(): Promise<Chapter[]> {
    return Array.from(this.chaptersMap.values())
      .sort((a, b) => a.order - b.order);
  }

  async updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter> {
    const existingChapter = await this.getChapter(id);
    if (!existingChapter) {
      throw new Error(`Chapter with id ${id} not found`);
    }
    
    const updatedChapter: Chapter = {
      ...existingChapter,
      ...chapter,
    };
    
    this.chaptersMap.set(id, updatedChapter);
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<void> {
    this.chaptersMap.delete(id);
    
    // Delete associated topics
    const topicsToDelete = Array.from(this.topicsMap.values())
      .filter(topic => topic.chapterId === id);
    
    for (const topic of topicsToDelete) {
      await this.deleteTopic(topic.id);
    }
  }

  // Topic methods
  async createTopic(topic: InsertTopic): Promise<Topic> {
    const id = this.topicIdCounter++;
    const newTopic: Topic = { ...topic, id };
    this.topicsMap.set(id, newTopic);
    return newTopic;
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topicsMap.get(id);
  }

  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topicsMap.values())
      .sort((a, b) => a.order - b.order);
  }

  async getTopicsByChapter(chapterId: number): Promise<Topic[]> {
    return Array.from(this.topicsMap.values())
      .filter(topic => topic.chapterId === chapterId)
      .sort((a, b) => a.order - b.order);
  }

  async updateTopic(id: number, topic: Partial<InsertTopic>): Promise<Topic> {
    const existingTopic = await this.getTopic(id);
    if (!existingTopic) {
      throw new Error(`Topic with id ${id} not found`);
    }
    
    const updatedTopic: Topic = {
      ...existingTopic,
      ...topic,
    };
    
    this.topicsMap.set(id, updatedTopic);
    return updatedTopic;
  }

  async deleteTopic(id: number): Promise<void> {
    this.topicsMap.delete(id);
    
    // Delete associated questions
    const questionsToDelete = Array.from(this.questionsMap.values())
      .filter(question => question.topicId === id);
    
    for (const question of questionsToDelete) {
      await this.deleteQuestion(question.id);
    }
  }

  // Question methods
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const newQuestion: Question = { ...question, id };
    this.questionsMap.set(id, newQuestion);
    return newQuestion;
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questionsMap.get(id);
  }

  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questionsMap.values());
  }

  async getQuestionsByTopic(topicId: number): Promise<Question[]> {
    return Array.from(this.questionsMap.values())
      .filter(question => question.topicId === topicId);
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question> {
    const existingQuestion = await this.getQuestion(id);
    if (!existingQuestion) {
      throw new Error(`Question with id ${id} not found`);
    }
    
    const updatedQuestion: Question = {
      ...existingQuestion,
      ...question,
    };
    
    this.questionsMap.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<void> {
    this.questionsMap.delete(id);
  }

  // Quiz attempt methods
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = this.quizAttemptIdCounter++;
    const newAttempt: QuizAttempt = { ...attempt, id };
    this.quizAttemptsMap.set(id, newAttempt);
    return newAttempt;
  }

  async getQuizAttempt(id: number): Promise<QuizAttempt | undefined> {
    return this.quizAttemptsMap.get(id);
  }

  async getQuizAttemptsByUser(userId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttemptsMap.values())
      .filter(attempt => attempt.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async getQuizAttemptsByTopic(topicId: number): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttemptsMap.values())
      .filter(attempt => attempt.topicId === topicId);
  }

  // User progress methods
  async createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    // Check if progress for this user-topic combination already exists
    const existingProgress = Array.from(this.userProgressMap.values()).find(
      p => p.userId === progress.userId && p.topicId === progress.topicId
    );
    
    if (existingProgress) {
      const updatedProgress: UserProgress = {
        ...existingProgress,
        progress: progress.progress,
        completed: progress.completed,
        lastActivity: progress.lastActivity,
      };
      
      this.userProgressMap.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      const id = this.userProgressIdCounter++;
      const newProgress: UserProgress = { ...progress, id };
      this.userProgressMap.set(id, newProgress);
      return newProgress;
    }
  }

  async getUserProgressByUser(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressMap.values())
      .filter(progress => progress.userId === userId);
  }

  async getUserProgressByChapter(userId: number, chapterId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressMap.values())
      .filter(progress => progress.userId === userId && progress.chapterId === chapterId);
  }

  // Study session methods
  async createStudySession(session: InsertStudySession): Promise<StudySession> {
    const id = this.studySessionIdCounter++;
    const newSession: StudySession = { ...session, id };
    this.studySessionsMap.set(id, newSession);
    return newSession;
  }

  async getStudySessionsByUser(userId: number): Promise<StudySession[]> {
    return Array.from(this.studySessionsMap.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getTotalStudyTime(userId: number): Promise<number> {
    const sessions = await this.getStudySessionsByUser(userId);
    return sessions.reduce((total, session) => total + session.duration, 0);
  }

  // Activity log methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const newLog: ActivityLog = { 
      ...log, 
      id, 
      createdAt: log.createdAt || new Date() 
    };
    this.activityLogMap.set(id, newLog);
    return newLog;
  }

  async getRecentActivitiesByUser(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    return Array.from(this.activityLogMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
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
    const chapters = await this.getAllChapters();
    
    // Get user progress
    const progress = await this.getUserProgressByUser(userId);
    
    // Calculate chapter progress
    const chapterProgress = [];
    for (const chapter of chapters) {
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
    const students = Array.from(this.usersMap.values())
      .filter(user => user.role === 'student').length;
      
    return {
      totalStudents: students,
      chapters: this.chaptersMap.size,
      topics: this.topicsMap.size,
      questions: this.questionsMap.size
    };
  }
}

export const storage = new MemStorage();
