import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { 
  getQueryFn, 
  apiRequest, 
  queryClient, 
  setAuthToken, 
  removeAuthToken 
} from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoginData, RegisterData } from "@/lib/schemas";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ user: User; token: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User; token: string }, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as UseMutationResult<{ user: User; token: string }, Error, LoginData>,
  logoutMutation: {} as UseMutationResult<void, Error, void>,
  registerMutation: {} as UseMutationResult<{ user: User; token: string }, Error, RegisterData>,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Setup a global error handler for 401 responses
  useEffect(() => {
    const handleGlobalFetch = async (event: Event) => {
      const response = (event as any).detail?.response;
      
      if (response && response.status === 401) {
        // Clear any stored token on 401 Unauthorized
        removeAuthToken();
        
        // Force a refetch of the user
        queryClient.setQueryData(["/api/user"], null);
        
        // Show a toast notification
        toast({
          title: "Session expired",
          description: "Please login again",
          variant: "destructive",
        });
      }
    };
    
    // Add event listener for fetch responses
    window.addEventListener("fetchResponse", handleGlobalFetch);
    
    return () => {
      window.removeEventListener("fetchResponse", handleGlobalFetch);
    };
  }, [toast]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: { user: User; token: string }) => {
      // Store the JWT token
      setAuthToken(data.token);
      
      // Update user data in the query cache
      queryClient.setQueryData(["/api/user"], data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      // Clear any stored token
      removeAuthToken();
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // Remove confirmPassword as it's not needed in the API call
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (data: { user: User; token: string }) => {
      // Store the JWT token
      setAuthToken(data.token);
      
      // Update user data in the query cache
      queryClient.setQueryData(["/api/user"], data.user);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      // Remove the JWT token
      removeAuthToken();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}>    
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}