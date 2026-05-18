import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>; // Replace with a spinner later
  }

  if (!isAuthenticated) {
    // Not logged in? Kick them back to the login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // Logged in, but wrong role? Send them to the POS menu
    return <Navigate to="/pos" replace />;
  }

  // If they pass the checks, render the requested page
  return <Outlet />;
}