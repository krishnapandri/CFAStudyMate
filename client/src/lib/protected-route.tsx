import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useRoute } from "wouter";
import { User } from "@shared/schema";

interface ProtectedRouteProps {
  path: string;
  component: (props: { user: User }) => React.JSX.Element;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  return (
    <Route path={path}>
      {(params) => {
        try {
          const { user, isLoading } = useAuth();

          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            );
          }

          if (!user) {
            return <Redirect to="/auth" />;
          }

          // Special case for admin routes
          if (path.startsWith("/admin") && user.role !== "admin") {
            return <Redirect to="/" />;
          }

          return <Component user={user} />;
        } catch (error) {
          console.error("Auth error in ProtectedRoute:", error);
          return <Redirect to="/auth" />;
        }
      }}
    </Route>
  );
}
