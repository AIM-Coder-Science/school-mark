import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expiré ou invalide
          if (window.location.pathname !== '/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error('Session expirée. Veuillez vous reconnecter.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          toast.error('Accès non autorisé');
          break;
          
        case 404:
          toast.error('Ressource non trouvée');
          break;
          
        case 422:
          // Erreurs de validation
          if (data.errors) {
            Object.values(data.errors).forEach(err => {
              toast.error(err);
            });
          }
          break;
          
        case 500:
          toast.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;
          
        default:
          toast.error(data.message || 'Une erreur est survenue');
      }
    } else if (error.request) {
      toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      toast.error('Erreur de configuration');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;