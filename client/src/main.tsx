import React from 'react';
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Create a placeholder component to test authentication
// This one DOESN'T use the useAuth hook
const AuthWrapperComponent = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">CFA Level I Study Platform</h1>
        <p className="text-center text-gray-600 mb-4">Testing auth system with useAuth hook...</p>
        
        {/* This component does use the useAuth hook */}
        <AuthStatusComponent />
      </div>
      <Toaster />
    </div>
  );
};

// This component DOES use the useAuth hook
const AuthStatusComponent = () => {
  const { user, isLoading, loginMutation, logoutMutation } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not logged in
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-100 rounded-md text-yellow-800 text-center">
          Not logged in. You can log in as the admin user.
        </div>
        <Button 
          className="w-full" 
          onClick={() => loginMutation.mutate({ 
            username: "admin", 
            password: "password123" 
          })}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in as Admin"
          )}
        </Button>
      </div>
    );
  }
  
  // If user is logged in
  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-100 rounded-md text-green-800">
        <p className="font-medium">Logged in successfully!</p>
        <p>Username: {user.username}</p>
        <p>Name: {user.name}</p>
        <p>Role: {user.role}</p>
      </div>
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging out...
          </>
        ) : (
          "Log out"
        )}
      </Button>
    </div>
  );
};

// Main render with providers
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthWrapperComponent />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);