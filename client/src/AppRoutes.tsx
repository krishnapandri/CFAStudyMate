import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ChaptersPage from "@/pages/chapters-page";
import QuizPage from "@/pages/quiz-page";
import PerformancePage from "@/pages/performance-page";
import ManageChapters from "@/pages/admin/manage-chapters";
import ManageTopics from "@/pages/admin/manage-topics";
import ManageQuestions from "@/pages/admin/manage-questions";
import ManageUsers from "@/pages/admin/manage-users";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Router } from "wouter";
import { Loader2 } from "lucide-react";

export default function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't redirect on reset-password page
  const isPublicRoute = location === "/auth" || location.startsWith("/reset-password");
  
  // If user is not logged in and not on a public page, redirect to auth
  if (!user && !isPublicRoute) {
    navigate("/auth");
    return null;
  }

  // If user is logged in and on auth page, redirect to home
  if (user && location === "/auth") {
    navigate("/");
    return null;
  }

  // If user is not admin and tries to access admin routes
  if (user && user.role !== "admin" && location.startsWith("/admin")) {
    navigate("/");
    return null;
  }
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Dashboard route */}
      <Route path="/">
        {user?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}
      </Route>
      
      {/* Student routes */}
      <Route path="/chapters" component={ChaptersPage} />
      <Route path="/quiz/:topicId" component={QuizPage} />
      <Route path="/performance" component={PerformancePage} />
      
      {/* Admin routes */}
      <Route path="/admin/chapters" component={ManageChapters} />
      <Route path="/admin/topics" component={ManageTopics} />
      <Route path="/admin/questions" component={ManageQuestions} />
      <Route path="/admin/users" component={ManageUsers} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}