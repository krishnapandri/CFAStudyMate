import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { loginSchema, registerSchema } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LoginData, RegisterData } from "@/lib/schemas";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AuthPage() {
  const { loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  
  // Forgot password schema
  const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" })
  });
  
  // Forgot password form
  const forgotPasswordForm = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    }
  });
  
  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/forgot-password", { email });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate reset link");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.resetUrl) {
        setResetLink(data.resetUrl);
        toast({
          title: "Reset link generated",
          description: "A password reset link has been generated. In a production environment, this would be sent via email.",
        });
      } else {
        toast({
          title: "Reset link generated",
          description: "If an account with that email exists, a password reset link has been generated",
        });
        setShowForgotPassword(false);
        forgotPasswordForm.reset();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle forgot password submit
  function handleForgotPasswordSubmit(values: { email: string }) {
    setResetLink(null);
    forgotPasswordMutation.mutate(values.email);
  }
  
  // Handle reset link dialog close
  function handleResetLinkDialogClose() {
    setResetLink(null);
    setShowForgotPassword(false);
    forgotPasswordForm.reset();
  }
  
  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form using the full RegisterData type
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
    },
  });
  
  function handleLoginSubmit(values: LoginData) {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate("/");
      }
    });
  }
  
  function handleRegisterSubmit(values: RegisterData) {
    registerMutation.mutate(values, {
      onSuccess: () => {
        navigate("/");
      }
    });
  }
  
  return (
    <div>
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
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-6">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <div>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </div>
                          ) : (
                            "Sign in"
                          )}
                        </Button>
                        
                        <div className="text-center mt-2">
                          <Button variant="link" className="text-sm text-primary" onClick={() => setShowForgotPassword(true)}>
                            Forgot your password?
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Choose a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <input type="hidden" {...registerForm.register("role")} value="student" />
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-2" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <div>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </div>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
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

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword && !resetLink} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll generate a password reset link.
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPasswordSubmit)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <div>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    "Generate Reset Link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Reset Link Dialog */}
      <Dialog open={!!resetLink} onOpenChange={(open) => !open && handleResetLinkDialogClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Password Reset Link</DialogTitle>
            <DialogDescription>
              This is your password reset link. In a production environment, this would be sent via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200 overflow-auto">
            <code className="text-sm break-all font-mono">{resetLink}</code>
          </div>
          
          <div className="mt-2 text-sm text-slate-500">
            <p>For development purposes, the link is displayed here. Click it to go to the password reset page.</p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              className="mr-2" 
              variant="outline" 
              onClick={handleResetLinkDialogClose}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                window.open(resetLink!, '_blank');
              }}
            >
              Open Reset Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}