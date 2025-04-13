import { useState, useEffect } from 'react';
import { Redirect, Route, Router, Switch } from 'wouter';
import { Loader2 } from 'lucide-react';
import AuthPage from '@/pages/auth-page';
import AdminDashboard from "@/pages/admin-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import ChaptersPage from "@/pages/chapters-page";
import QuizPage from "@/pages/quiz-page";
import PerformancePage from "@/pages/performance-page";
import ManageChapters from "@/pages/admin/manage-chapters";
import ManageTopics from "@/pages/admin/manage-topics";
import ManageQuestions from "@/pages/admin/manage-questions";
import ManageUsers from "@/pages/admin/manage-users";
import NotFound from "@/pages/not-found";
import { User } from '@shared/schema';

export function AuthWrapper() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status !== 401) {
          // Only treat non-401 responses as errors
          throw new Error('Failed to fetch user data');
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUser();
  }, []);

  // Handle login
  const handleLogin = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setUser(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }
      
      const newUser = await response.json();
      setUser(newUser);
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <Switch>
        {/* Auth route */}
        <Route path="/auth">
          {() => (
            user ? <Router><Route path="*"> <Redirect to="/" /></Route></Router>: 
                   <AuthPage onLogin={handleLogin} onRegister={handleRegister} error={error} />
          )}
        </Route>
        
        {/* Protected routes - Only accessible if user is logged in */}
        <Route path="*">
          {() => {
            if (!user) {
              window.location.href = '/auth';
              return null;
            }
            
            return (
              <Switch>
                {/* Dashboard route */}
                <Route path="/">
                  {() => (
                    user.role === "admin" 
                      ? <AdminDashboard /> 
                      : <StudentDashboard />
                  )}
                </Route>
                
                {/* Student routes */}
                <Route path="/chapters" component={ChaptersPage} />
                <Route path="/quiz/:topicId" component={QuizPage} />
                <Route path="/performance" component={PerformancePage} />
                
                {/* Admin routes - Only accessible if user is admin */}
                <Route path="/admin/*">
                  {() => {
                    if (user.role !== "admin") {
                      window.location.href = '/';
                      return null;
                    }
                    
                    return (
                      <Switch>
                        <Route path="/admin/chapters" component={ManageChapters} />
                        <Route path="/admin/topics" component={ManageTopics} />
                        <Route path="/admin/questions" component={ManageQuestions} />
                        <Route path="/admin/users" component={ManageUsers} />
                        <Route component={NotFound} />
                      </Switch>
                    );
                  }}
                </Route>
                
                {/* Fallback to 404 */}
                <Route component={NotFound} />
              </Switch>
            );
          }}
        </Route>
      </Switch>
    </Router>
  );
}