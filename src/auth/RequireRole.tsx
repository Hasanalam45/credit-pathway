import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

type Role = "superadmin" | "support";

type Props = {
  allowed: Role[];
  children: React.ReactElement;
};

const RequireRole: React.FC<Props> = ({ allowed, children }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in -> redirect to login
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.adminData.role as Role)) {
    // Logged in but not authorized -> redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireRole;
