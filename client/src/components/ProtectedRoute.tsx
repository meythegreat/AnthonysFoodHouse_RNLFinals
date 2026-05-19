import { Navigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { showToast } = useToast();
  const location = useLocation();
  
  const token = localStorage.getItem('token');
  const employeeData = localStorage.getItem('employee');

  // 1. If they have no token at all, kick them to the login screen
  if (!token || !employeeData) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const employee = JSON.parse(employeeData);

  // 2. If they are logged in, but their role isn't allowed on this page, bounce them
  if (!allowedRoles.includes(employee.role)) {
    // We use a useEffect to show the toast without disrupting the React render cycle
    useEffect(() => {
      showToast('Security Clearance Denied: You do not have access to this module.', 'error');
    }, []);
    
    // Kick them back to the POS screen (which everyone has access to)
    return <Navigate to="/pos" replace />;
  }

  // 3. If they pass all checks, render the page!
  return <>{children}</>;
}