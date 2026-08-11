import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  /**
   * Admin module permission required to view this page
   * (users | courses | payments | internships | analytics | students).
   * Super admins implicitly hold every permission.
   */
  requiredPermission?: string;
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate portal based on role
    const roleRedirects: Record<UserRole, string> = {
      student: "/portal/student",
      trainer: "/portal/trainer",
      admin: "/portal/admin",
      super_admin: "/portal/super-admin",
      mentor: "/portal/trainer", // Mentors use trainer portal
      client: "/portal/client/applications",
    };

    return <Navigate to={roleRedirects[user.role]} replace />;
  }

  // Permission gate: only enforced for regular admins. Super admins pass.
  if (user && user.role === "admin" && requiredPermission) {
    const hasPermission = (user.permissions || []).includes(requiredPermission);
    if (!hasPermission) {
      return <Navigate to="/portal/admin" replace />;
    }
  }

  return <>{children}</>;
}
