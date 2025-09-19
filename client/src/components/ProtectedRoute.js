import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <LoadingSpinner 
        size="large" 
        message="Verifying authentication..." 
        fullScreen={true}
      />
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role is specified and user doesn't have the required role, redirect
  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;