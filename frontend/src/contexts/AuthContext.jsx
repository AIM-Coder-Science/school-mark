import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Commence à true
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Utilisez ce useEffect UNIQUEMENT au premier chargement pour valider la session persistante.
  useEffect(() => {
    // Si un jeton est trouvé au démarrage, essayez de charger le profil
    if (token) {
      getProfile()
    } else {
      // Sinon, il n'y a pas d'utilisateur, le chargement est terminé
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 🛑 Dépendance vide : s'exécute seulement au montage du composant

  const getProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      setUser(response.data.user)
      // Ne pas toucher au token ou au loading ici s'il est utilisé par login
    } catch (error) {
      console.error('Erreur récupération profil:', error)
      logout()
    } finally {
      setLoading(false) // Mettre loading à false SEULEMENT après la vérification
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data
      
      // Mettre à jour les états
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      setLoading(false) // 🛑 CORRECTION CLÉ : Mettre loading à false ici aussi
      
      return { success: true }
    } catch (error) {
      setLoading(false) // 🛑 IMPORTANT : Mettre loading à false en cas d'erreur de connexion
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion' 
      }
    }
  }

  // J'ai supprimé la fonction register pour la clarté (elle devrait aussi appeler setLoading(false) en cas de succès ou d'échec).

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setLoading(false) // Optionnel, mais bonne pratique
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}