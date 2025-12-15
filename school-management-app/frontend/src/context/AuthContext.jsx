import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, checkAuth } from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsCheckingAuth(true);
      const { authenticated, user: currentUser } = await checkAuth();
      
      if (authenticated) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setIsCheckingAuth(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const { loginUser } = await import('../services/auth');
      const result = await loginUser(credentials);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  };

  const logout = () => {
    const { logoutUser } = require('../services/auth');
    logoutUser();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    const { updateUserProfile } = require('../services/auth');
    updateUserProfile(userData);
  };

  const value = {
    user,
    loading,
    isCheckingAuth,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    getCurrentUser,
    getUserRole: () => user?.role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};