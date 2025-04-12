import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertChapterSchema, 
  insertTopicSchema, 
  insertQuestionSchema,
  insertQuizAttemptSchema,
  insertUserProgressSchema,
  insertStudySessionSchema,
  insertActivityLogSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes and middlewares
  const { isAuthenticated, isAdmin } = setupAuth(app);

  // ===== CHAPTERS ROUTES =====
  
  // Get all chapters
  app.get("/api/chapters", isAuthenticated, async (req, res) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  // Get chapter by ID
  app.get("/api/chapters/:id", isAuthenticated, async (req, res) => {
    try {
      const chapter = await storage.getChapter(Number(req.params.id));
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });

  // Create chapter (admin only)
  app.post("/api/chapters", isAdmin, async (req, res) => {
    try {
      const chapterData = insertChapterSchema.parse(req.body);
      const chapter = await storage.createChapter(chapterData);
      res.status(201).json(chapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chapter data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chapter" });
    }
  });

  // Update chapter (admin only)
  app.put("/api/chapters/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingChapter = await storage.getChapter(id);
      if (!existingChapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      const chapterData = insertChapterSchema.partial().parse(req.body);
      const updatedChapter = await storage.updateChapter(id, chapterData);
      res.json(updatedChapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chapter data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update chapter" });
    }
  });

  // Delete chapter (admin only)
  app.delete("/api/chapters/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingChapter = await storage.getChapter(id);
      if (!existingChapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      await storage.deleteChapter(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chapter" });
    }
  });

  // ===== TOPICS ROUTES =====
  
  // Get all topics
  app.get("/api/topics", isAuthenticated, async (req, res) => {
    try {
      const topics = await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // Get topics by chapter
  app.get("/api/chapters/:chapterId/topics", isAuthenticated, async (req, res) => {
    try {
      const chapterId = Number(req.params.chapterId);
      const topics = await storage.getTopicsByChapter(chapterId);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // Get topic by ID
  app.get("/api/topics/:id", isAuthenticated, async (req, res) => {
    try {
      const topic = await storage.getTopic(Number(req.params.id));
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Create topic (admin only)
  app.post("/api/topics", isAdmin, async (req, res) => {
    try {
      const topicData = insertTopicSchema.parse(req.body);
      
      // Verify chapter exists
      const chapter = await storage.getChapter(topicData.chapterId);
      if (!chapter) {
        return res.status(400).json({ message: "Chapter not found" });
      }
      
      const topic = await storage.createTopic(topicData);
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create topic" });
    }
  });

  // Update topic (admin only)
  app.put("/api/topics/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingTopic = await storage.getTopic(id);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const topicData = insertTopicSchema.partial().parse(req.body);
      
      // If chapterId is provided, verify chapter exists
      if (topicData.chapterId) {
        const chapter = await storage.getChapter(topicData.chapterId);
        if (!chapter) {
          return res.status(400).json({ message: "Chapter not found" });
        }
      }
      
      const updatedTopic = await storage.updateTopic(id, topicData);
      res.json(updatedTopic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update topic" });
    }
  });

  // Delete topic (admin only)
  app.delete("/api/topics/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingTopic = await storage.getTopic(id);
      if (!existingTopic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      await storage.deleteTopic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete topic" });
    }
  });

  // ===== QUESTIONS ROUTES =====
  
  // Get all questions (admin only)
  app.get("/api/questions", isAdmin, async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get questions by topic
  app.get("/api/topics/:topicId/questions", isAuthenticated, async (req, res) => {
    try {
      const topicId = Number(req.params.topicId);
      const questions = await storage.getQuestionsByTopic(topicId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get question by ID
  app.get("/api/questions/:id", isAuthenticated, async (req, res) => {
    try {
      const question = await storage.getQuestion(Number(req.params.id));
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  // Create question (admin only)
  app.post("/api/questions", isAdmin, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      
      // Verify topic exists
      const topic = await storage.getTopic(questionData.topicId);
      if (!topic) {
        return res.status(400).json({ message: "Topic not found" });
      }
      
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Update question (admin only)
  app.put("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingQuestion = await storage.getQuestion(id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      const questionData = insertQuestionSchema.partial().parse(req.body);
      
      // If topicId is provided, verify topic exists
      if (questionData.topicId) {
        const topic = await storage.getTopic(questionData.topicId);
        if (!topic) {
          return res.status(400).json({ message: "Topic not found" });
        }
      }
      
      const updatedQuestion = await storage.updateQuestion(id, questionData);
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Delete question (admin only)
  app.delete("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingQuestion = await storage.getQuestion(id);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      await storage.deleteQuestion(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // ===== QUIZ ATTEMPTS ROUTES =====
  
  // Submit quiz attempt
  app.post("/api/quiz-attempts", isAuthenticated, async (req, res) => {
    try {
      const attemptData = insertQuizAttemptSchema.parse({
        ...req.body,
        userId: req.user.id,
        completedAt: new Date()
      });
      
      // Verify topic exists
      const topic = await storage.getTopic(attemptData.topicId);
      if (!topic) {
        return res.status(400).json({ message: "Topic not found" });
      }
      
      const attempt = await storage.createQuizAttempt(attemptData);
      
      // Update user progress for this topic
      const chapter = await storage.getChapter(topic.chapterId);
      if (chapter) {
        const questions = await storage.getQuestionsByTopic(topic.id);
        const totalQuestions = questions.length;
        
        // Calculate progress percentage based on score
        const progress = Math.round((attemptData.score / attemptData.totalQuestions) * 100);
        const completed = progress >= 80; // Consider completed if score is 80% or higher
        
        await storage.createOrUpdateUserProgress({
          userId: req.user.id,
          chapterId: chapter.id,
          topicId: topic.id,
          progress,
          completed,
          lastActivity: new Date()
        });
        
        // Log activity
        await storage.createActivityLog({
          userId: req.user.id,
          activity: `Completed quiz on ${topic.title}`,
          entityType: 'topic',
          entityId: topic.id,
          createdAt: new Date(),
          metadata: {
            score: attemptData.score,
            totalQuestions: attemptData.totalQuestions
          }
        });
      }
      
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quiz attempt data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  // Get quiz attempts for current user
  app.get("/api/quiz-attempts", isAuthenticated, async (req, res) => {
    try {
      const attempts = await storage.getQuizAttemptsByUser(req.user.id);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // ===== USER PROGRESS ROUTES =====
  
  // Get progress for current user
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const progress = await storage.getUserProgressByUser(req.user.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get progress for current user by chapter
  app.get("/api/chapters/:chapterId/progress", isAuthenticated, async (req, res) => {
    try {
      const chapterId = Number(req.params.chapterId);
      const progress = await storage.getUserProgressByChapter(req.user.id, chapterId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // ===== STUDY SESSIONS ROUTES =====
  
  // Log study session
  app.post("/api/study-sessions", isAuthenticated, async (req, res) => {
    try {
      const sessionData = insertStudySessionSchema.parse({
        ...req.body,
        userId: req.user.id,
        startedAt: req.body.startedAt || new Date()
      });
      
      // Verify chapter exists
      const chapter = await storage.getChapter(sessionData.chapterId);
      if (!chapter) {
        return res.status(400).json({ message: "Chapter not found" });
      }
      
      // If topicId is provided, verify topic exists
      if (sessionData.topicId) {
        const topic = await storage.getTopic(sessionData.topicId);
        if (!topic) {
          return res.status(400).json({ message: "Topic not found" });
        }
      }
      
      const session = await storage.createStudySession(sessionData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        activity: `Studied ${chapter.title}${sessionData.topicId ? ' topic' : ''}`,
        entityType: 'chapter',
        entityId: chapter.id,
        createdAt: new Date(),
        metadata: {
          duration: sessionData.duration
        }
      });
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid study session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log study session" });
    }
  });

  // Get study sessions for current user
  app.get("/api/study-sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getStudySessionsByUser(req.user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study sessions" });
    }
  });

  // ===== ACTIVITY LOG ROUTES =====
  
  // Get recent activities for current user
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const activities = await storage.getRecentActivitiesByUser(req.user.id, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // ===== USER STATS ROUTES =====
  
  // Get stats for current user
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ===== ADMIN STATS ROUTES =====
  
  // Get admin dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // For security reasons, don't send back passwords
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
