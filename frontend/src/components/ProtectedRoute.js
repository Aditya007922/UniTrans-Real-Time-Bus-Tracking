import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    // Redirect to their own dashboard if they try to access another role's page
    if (userRole === 'admin') return <Navigate to="/admin" />;
    if (userRole === 'driver') return <Navigate to="/driver" />;
    return <Navigate to="/passenger" />;
  }

  return children;
}
