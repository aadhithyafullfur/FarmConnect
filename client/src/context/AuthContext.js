import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Token validation with retry logic for server startup delays
  const validateTokenWithRetry = React.useCallback(async (maxRetries = 8, delay = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await api.get('/auth/verify');
        console.log('✅ Token validation successful');
        return response; // Success
      } catch (error) {
        console.log(`🔄 Token validation attempt ${i + 1}/${maxRetries}:`, error.message);
        
        // If it's a 401 (unauthorized), don't retry
        if (error.response && error.response.status === 401) {
          throw new Error('401 - Invalid token');
        }
        
        // If this is the last attempt, throw the error
        if (i === maxRetries - 1) {
          console.log('❌ Token validation failed after all retries');
          throw error;
        }
        
        // Wait before next retry with exponential backoff
        const waitTime = delay * (i + 1);
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }, []);

  // Validate token and restore authentication state on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        if (token && storedUser) {
          // Set user data first
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Set user immediately from localStorage to avoid UI flicker
          setIsAuthenticated(true);
          
          try {
            // Try to validate token with retry logic for server startup
            await validateTokenWithRetry();
            
            // If remember me is not set, check if token is recent (less than 24 hours)
            if (!rememberMe) {
              const tokenTimestamp = localStorage.getItem('tokenTimestamp');
              const now = Date.now();
              const tokenAge = now - (tokenTimestamp ? parseInt(tokenTimestamp) : 0);
              const maxAge = 24 * 60 * 60 * 1000; // 24 hours
              
              if (tokenAge > maxAge) {
                // Token is too old, require fresh login
                console.log('🕐 Token expired, requiring fresh login');
                handleLogout();
                return;
              }
            }
            
            console.log('✅ Authentication restored for:', userData.name || userData.email);
          } catch (tokenError) {
            console.log('❌ Token validation failed after retries:', tokenError.message);
            // Only clear auth if it's definitely an invalid token, not a network issue
            if (tokenError.message.includes('401') || tokenError.message.includes('invalid')) {
              handleLogout();
            }
            // If it's a network error, keep the user logged in and let them try again
          }
        } else {
          console.log('🔒 No stored authentication found');
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [validateTokenWithRetry]);

  const login = (data, rememberMe = false) => {
    const timestamp = Date.now().toString();
    
    // Store authentication data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tokenTimestamp', timestamp);
    localStorage.setItem('rememberMe', rememberMe.toString());
    
    // Update state
    setUser(data.user);
    setIsAuthenticated(true);
    
    console.log('✅ Login successful for:', data.user.name || data.user.email);
  };

  const logout = () => {
    handleLogout();
    console.log('👋 Logout successful');
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('rememberMe');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Connection monitoring and auto-refresh token functionality
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Start connection monitor - check every 5 seconds
    const connectionMonitor = setInterval(async () => {
      try {
        await api.get('/health');
        // Server is responding
      } catch (error) {
        console.log('🔌 Server connection lost, will retry authentication...');
        // Try to restore authentication when server comes back
        setTimeout(async () => {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              console.log('🔄 Attempting to restore authentication...');
              await validateTokenWithRetry();
              console.log('✅ Authentication restored after server restart');
            } catch (authError) {
              console.log('⚠️ Could not restore authentication:', authError.message);
            }
          }
        }, 3000);
      }
    }, 5000);

    const refreshInterval = setInterval(() => {
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      if (tokenTimestamp) {
        const now = Date.now();
        const tokenAge = now - parseInt(tokenTimestamp);
        const refreshThreshold = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000; // 7 days or 12 hours
        
        if (tokenAge > refreshThreshold) {
          console.log('🔄 Token refresh needed');
          // In a real app, you would refresh the token here
          // For now, we'll just validate the existing token
          api.get('/auth/verify').catch(() => {
            console.log('❌ Token validation failed, logging out');
            handleLogout();
            window.location.href = '/login';
          });
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearInterval(connectionMonitor);
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, user, validateTokenWithRetry]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}