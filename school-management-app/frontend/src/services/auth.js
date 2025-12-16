import { authAPI } from './api';
import toast from 'react-hot-toast';

export const loginUser = async (credentials) => {
  try {
    const response = await authAPI.login(credentials);
    
    if (response.data.success) {
      const { token, user } = response.data;
      
      // Sauvegarder dans localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Connexion réussie !');
      return { success: true, user };
    }
    
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur de connexion' 
    };
  }
};

export const logoutUser = async () => {
  try {
    // Optionnel: appeler l'API pour invalider le token côté serveur
    await authAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Déconnexion réussie');
    window.location.href = '/login';
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user:', error);
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const updateUserProfile = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

export const checkAuth = async () => {
  if (!isAuthenticated()) {
    return { authenticated: false };
  }
  
  try {
    // ✅ Corrigé: utilise getMe au lieu de getProfile
    const response = await authAPI.getMe();
    if (response.data.success) {
      updateUserProfile(response.data.data);
      return { authenticated: true, user: response.data.data };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // ✅ Ajouté: nettoyer le localStorage en cas d'erreur
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  return { authenticated: false };
};