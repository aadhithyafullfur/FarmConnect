import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function PublicRoute({ children }) {
  const { user, loading, isAuthenticated } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <LoadingSpinner 
        size="large" 
        message="Checking authentication..." 
        fullScreen={true}
      />
    );
  }

  // If user is authenticated, redirect them to their dashboard
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'buyer' ? '/buyer' : '/farmer';
    return <Navigate to={redirectPath} replace />;
  }

  // If not logged in, show the public route content (login/register)
  return children;
}

export default PublicRoute;
