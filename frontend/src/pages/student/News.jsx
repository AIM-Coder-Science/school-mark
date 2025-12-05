// frontend/src/pages/student/News.jsx
import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { newsAPI } from '../../services/api'
import { Bell, Calendar, User, AlertCircle, Loader, Filter } from 'lucide-react'

const StudentNews = () => {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // 'all', 'recent', 'important'
  
  const limit = 10

  const { data: newsData, isLoading, error, refetch } = useQuery(
    ['studentNews', page, filter],
    () => newsAPI.getNews({ 
      page, 
      limit,
      ...(filter === 'recent' && { recent: true }),
      ...(filter === 'important' && { important: true })
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )

  const news = newsData?.news || []
  const pagination = newsData?.pagination || {}

  // Rafraîchir les actualités toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAuthorName = (author) => {
    if (!author) return 'Auteur inconnu'
    
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`
    }
    
    if (author.Teacher?.first_name && author.Teacher?.last_name) {
      return `${author.Teacher.first_name} ${author.Teacher.last_name} (Enseignant)`
    }
    
    if (author.Student?.first_name && author.Student?.last_name) {
      return `${author.Student.first_name} ${author.Student.last_name} (Étudiant)`
    }
    
    return author.email || 'Auteur'
  }

  const isRecent = (dateString) => {
    const newsDate = new Date(dateString)
    const now = new Date()
    const diffHours = (now - newsDate) / (1000 * 60 * 60)
    return diffHours < 24
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="card p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">
            Impossible de charger les actualités. Veuillez réessayer.
          </p>
          <button
            onClick={() => refetch()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Actualités</h1>
              <p className="text-blue-100">
                Restez informé des dernières nouvelles de votre établissement
              </p>
            </div>
            <div className="p-4 bg-white/10 rounded-full">
              <Bell className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filtres et statistiques */}
        <div className="card mb-8 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filtrer :</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilter('recent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'recent'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Récentes
                </button>
                <button
                  onClick={() => setFilter('important')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'important'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Importantes
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">{pagination.totalItems || 0}</span> actualités disponibles
            </div>
          </div>
        </div>

        {/* Liste des actualités */}
        <div className="space-y-6">
          {news.length === 0 ? (
            <div className="card p-12 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune actualité disponible
              </h3>
              <p className="text-gray-600">
                Les actualités seront affichées ici dès qu'elles seront publiées.
              </p>
            </div>
          ) : (
            <>
              {news.map((item) => (
                <div 
                  key={item.id} 
                  className="card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Badge récent */}
                  {isRecent(item.createdAt) && (
                    <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 absolute top-4 right-4 rounded-full z-10">
                      NOUVEAU
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          {item.title}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>{getAuthorName(item.author)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-blue max-w-none mb-4">
                      <p className="text-gray-700 whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {item.target_roles && item.target_roles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {item.target_roles.includes('all') && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Pour tous
                          </span>
                        )}
                        {item.target_roles.includes('student') && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Étudiants
                          </span>
                        )}
                        {item.target_roles.includes('teacher') && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Enseignants
                          </span>
                        )}
                        {item.target_roles.includes('admin') && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Administrateurs
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page <span className="font-medium">{page}</span> sur{' '}
                      <span className="font-medium">{pagination.total}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={page >= pagination.total}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Guide pour les étudiants */}
        <div className="mt-8 card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Bell className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Comment suivre les actualités ?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Consultez régulièrement cette page pour ne rien manquer</li>
                <li>Les actualités marquées "NOUVEAU" ont été publiées dans les dernières 24 heures</li>
                <li>Les actualités "Pour tous" concernent l'ensemble de la communauté</li>
                <li>Les actualités "Étudiants" sont spécifiquement destinées aux apprenants</li>
                <li>En cas d'urgence, des notifications spéciales seront affichées</li>
              </ul>
              <p className="text-sm text-blue-700 mt-3">
                💡 <strong>Astuce</strong> : Cette page se rafraîchit automatiquement toutes les 30 secondes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentNews