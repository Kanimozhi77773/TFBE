import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useContext(AuthContext);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to ensure auth context is fully loaded
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if user is authenticated
  const isAuthenticated = user && accessToken;

  // Show nothing while checking
  if (isChecking) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;