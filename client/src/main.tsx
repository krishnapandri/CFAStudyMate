import React from 'react';
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";

// Create a placeholder component to test authentication
const AuthTester = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">CFA Level I Study Platform</h1>
        <p className="text-center text-gray-600 mb-4">Testing auth system...</p>
        <div className="p-4 bg-blue-100 rounded-md text-blue-800 text-center">
          Auth Provider Working!
        </div>
      </div>
      <Toaster />
    </div>
  );
};

// Main render with providers
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthTester />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);