import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ChaptersPage from "@/pages/chapters-page";
import QuizPage from "@/pages/quiz-page";
import PerformancePage from "@/pages/performance-page";
import ManageChapters from "@/pages/admin/manage-chapters";
import ManageTopics from "@/pages/admin/manage-topics";
import ManageQuestions from "@/pages/admin/manage-questions";
import ManageUsers from "@/pages/admin/manage-users";
import { useAuth } from "./hooks/use-auth";

function App() {
  const { user } = useAuth();
  
  return (
    <>
      <Switch>
        {/* Auth route */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Protected routes */}
        <ProtectedRoute 
          path="/" 
          component={user?.role === "admin" ? AdminDashboard : StudentDashboard} 
        />
        
        {/* Student routes */}
        <ProtectedRoute path="/chapters" component={ChaptersPage} />
        <ProtectedRoute path="/quiz/:topicId" component={QuizPage} />
        <ProtectedRoute path="/performance" component={PerformancePage} />
        
        {/* Admin routes */}
        <ProtectedRoute path="/admin/chapters" component={ManageChapters} />
        <ProtectedRoute path="/admin/topics" component={ManageTopics} />
        <ProtectedRoute path="/admin/questions" component={ManageQuestions} />
        <ProtectedRoute path="/admin/users" component={ManageUsers} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
