import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function PublicRoute({ children }) {
  const { user } = useContext(AuthContext);

  // If user is logged in, redirect them to their dashboard
  if (user) {
    // Redirect based on user role
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/farmer'} />;
  }

  // If not logged in, show the public route content
  return children;
}

export default PublicRoute;
