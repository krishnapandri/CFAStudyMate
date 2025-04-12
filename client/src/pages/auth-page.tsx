import { useAuth, registerSchema } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  
  // Redirect if already logged in
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="flex min-h-screen">
      {/* Left column with forms */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">CFA Level I Study Platform</h1>
            <p className="mt-2 text-sm text-gray-600">Sign in to your account or create a new one to start studying</p>
          </div>
          
          <Card className="mt-8">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <CardContent className="pt-4 pb-8">
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
      
      {/* Right column with hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-primary to-blue-700 text-white p-12 flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-4xl font-bold mb-6">Prepare for CFA Level I with Confidence</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Practice with chapter and topic-specific quizzes</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Track your progress with detailed analytics</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Focus on your weak areas with personalized recommendations</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Comprehensive coverage of all CFA Level I topics</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
