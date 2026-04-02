import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: {user.role}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Hook to check if user has specific role
 */
export const useAdminCheck = () => {
  const { user } = useAuth();
  return user?.role === "admin";
};

/**
 * Hook to check if user is collector
 */
export const useCollectorCheck = () => {
  const { user } = useAuth();
  return ["weekly_collector", "spot_collector"].includes(user?.role || "");
};

/**
 * Hook to check if user is regular user
 */
export const useUserCheck = () => {
  const { user } = useAuth();
  return user?.role === "user";
};
