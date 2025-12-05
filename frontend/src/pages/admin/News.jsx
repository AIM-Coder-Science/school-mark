import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { newsAPI } from '../../services/api'
import { Plus, Bell, Eye, Edit, Trash2, Loader, Calendar, User } from 'lucide-react'

const AdminNews = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_roles: ['student', 'teacher', 'admin']
  })

  const queryClient = useQueryClient()

  const { data: newsData, isLoading } = useQuery(
    'adminNews',
    () => newsAPI.getNews(),
    { refetchOnWindowFocus: false }
  )

  const createNewsMutation = useMutation(
    (data) => newsAPI.createNews(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminNews')
        setShowForm(false)
        setFormData({
          title: '',
          content: '',
          target_roles: ['student', 'teacher', 'admin']
        })
      }
    }
  )

  const deleteNewsMutation = useMutation(
    (id) => newsAPI.deleteNews(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminNews')
      }
    }
  )

  // AdminNews.jsx - MODIFIE LA SECTION handleSubmit
const handleSubmit = (e) => {
  e.preventDefault()
  
  // DEBUG: Vérifie ce qui est envoyé
  console.log('📤 Données envoyées:', formData)
  
  createNewsMutation.mutate(formData, {
    onError: (error) => {
      console.error('❌ Erreur création:', error)
      alert(`Erreur: ${error.response?.data?.message || error.message}`)
    },
    onSuccess: (data) => {
      console.log('✅ Réponse API:', data)
      if (data?.success) {
        alert('Actualité créée avec succès!')
      }
    }
  })
}

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }))
  }

  const news = newsData?.data?.news || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Actualités</h1>
          <p className="text-gray-600">
            {news.length} actualité(s) publiée(s)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Publier une actualité</span>
        </button>
      </div>

      {/* Formulaire de publication */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvelle actualité
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titre
              </label>
              <input
                type="text"
                required
                className="input mt-1"
                placeholder="Titre de l'actualité"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contenu
              </label>
              <textarea
                rows={6}
                required
                className="input mt-1"
                placeholder="Contenu de l'actualité..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public cible
              </label>
              <div className="flex space-x-4">
                {['student', 'teacher', 'admin'].map((role) => (
                  <label key={role} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.target_roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {role === 'student' && 'Étudiants'}
                      {role === 'teacher' && 'Enseignants'}
                      {role === 'admin' && 'Administrateurs'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createNewsMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createNewsMutation.isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Publier l'actualité</span>
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des actualités */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actualités publiées
        </h2>
        <div className="space-y-6">
          {news.map((newsItem) => (
            <div key={newsItem.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {newsItem.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>
                        Par {newsItem.author?.Teacher?.first_name || newsItem.author?.Student?.first_name || 'Admin'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(newsItem.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span className="capitalize">
                        {newsItem.target_roles?.map(role => {
                          if (role === 'student') return 'Étudiants'
                          if (role === 'teacher') return 'Enseignants'
                          if (role === 'admin') return 'Admin'
                          return role
                        }).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteNewsMutation.mutate(newsItem.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap">
                {newsItem.content}
              </p>
            </div>
          ))}

          {news.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune actualité publiée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminNews