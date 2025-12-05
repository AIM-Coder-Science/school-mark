import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()

  const getUserDisplayName = () => {
    if (user?.profile) {
      return `${user.profile.first_name} ${user.profile.last_name}`
    }
    return user?.email || 'Utilisateur'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Mark</h1>
          <p className="text-sm text-gray-600">
            {user?.role === 'admin' && 'Administration'}
            {user?.role === 'teacher' && 'Espace Enseignant'}
            {user?.role === 'student' && 'Espace Étudiant'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">{getUserDisplayName()}</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header