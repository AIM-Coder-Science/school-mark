// frontend/src/pages/student/News.jsx
import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { studentAPI } from '../../services/api' // CHANGÉ: newsAPI → studentAPI
import { Bell, Calendar, User, AlertCircle, Filter, RefreshCw } from 'lucide-react'

const StudentNews = () => {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const limit = 10

  // CHANGÉ: Utilisation de studentAPI.getNews() au lieu de newsAPI.getNews()
  const { data: newsData, isLoading, error, refetch, isRefetching } = useQuery(
    ['studentNews', page, filter],
    () => studentAPI.getNews({ 
      page, 
      limit
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 secondes
    }
  )

  const news = newsData?.news || newsData?.data?.news || []
  const pagination = newsData?.pagination || newsData?.data?.pagination || {
    current: 1,
    total: 1,
    totalItems: 0,
    hasMore: false
  }

  console.log('📰 Données actualités:', { 
    newsCount: news.length, 
    newsData, 
    pagination 
  })

  // Rafraîchir automatiquement si activé
  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 Rafraîchissement automatique des actualités')
        refetch()
      }, 30000) // 30 secondes
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refetch])

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Erreur formatage date:', error)
      return dateString
    }
  }

  const getAuthorName = (author) => {
    if (!author) return 'Auteur inconnu'
    
    // Si l'auteur a un nom directement
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`
    }
    
    // Si l'auteur a un display name formatté
    if (author.author_display) {
      return author.author_display
    }
    
    // Si c'est un enseignant
    if (author.Teacher?.first_name && author.Teacher?.last_name) {
      return `${author.Teacher.first_name} ${author.Teacher.last_name}`
    }
    
    // Si c'est un étudiant
    if (author.Student?.first_name && author.Student?.last_name) {
      return `${author.Student.first_name} ${author.Student.last_name}`
    }
    
    return author.email || 'Auteur'
  }

  const isRecent = (dateString) => {
    if (!dateString) return false
    try {
      const newsDate = new Date(dateString)
      const now = new Date()
      const diffHours = (now - newsDate) / (1000 * 60 * 60)
      return diffHours < 24
    } catch (error) {
      console.error('Erreur vérification récent:', error)
      return false
    }
  }

  const getTargetRoles = (item) => {
    // Gérer plusieurs formats de données
    return item.target_roles || item.for_student || item.for_teacher || item.for_admin || []
  }

  // Afficher un loading
  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement des actualités...</p>
        </div>
      </div>
    )
  }

  // Gérer les erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="card p-8 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Impossible de charger les actualités.'}
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
              <h1 className="text-3xl font-bold mb-2">Actualités Étudiantes</h1>
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
        {/* Contrôles */}
        <div className="card mb-8 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filtrer :</span>
              </div>
              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span>Rafraîchir</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto-rafraîchissement</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-600">Affichage : </span>
                <span className="font-medium text-gray-900">
                  {news.length} actualité{news.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-500 mx-2">•</span>
                <span className="text-gray-600">Total : </span>
                <span className="font-medium text-gray-900">
                  {pagination.totalItems || 0}
                </span>
              </div>
              {pagination.current && pagination.total > 1 && (
                <div className="text-gray-600">
                  Page <span className="font-medium">{pagination.current}</span> sur{' '}
                  <span className="font-medium">{pagination.total}</span>
                </div>
              )}
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
              <p className="text-gray-600 mb-4">
                Aucune actualité n'a été publiée pour les étudiants pour le moment.
              </p>
              <p className="text-sm text-gray-500">
                Revenez plus tard ou consultez les actualités générales.
              </p>
            </div>
          ) : (
            <>
              {news.map((item) => {
                const targetRoles = getTargetRoles(item)
                const isItemRecent = isRecent(item.createdAt)
                
                return (
                  <div 
                    key={item.id} 
                    className="card overflow-hidden hover:shadow-lg transition-shadow duration-200 relative"
                  >
                    {/* Badge récent */}
                    {isItemRecent && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full animate-pulse">
                          NOUVEAU
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {item.title || 'Sans titre'}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{getAuthorName(item.author)}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="prose prose-blue max-w-none mb-4">
                        <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                          {item.content || 'Aucun contenu disponible'}
                        </div>
                      </div>

                      {/* Tags */}
                      {Array.isArray(targetRoles) && targetRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                          {targetRoles.includes('all') && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Pour tous
                            </span>
                          )}
                          {targetRoles.includes('student') && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Étudiants
                            </span>
                          )}
                          {targetRoles.includes('teacher') && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              Enseignants
                            </span>
                          )}
                          {targetRoles.includes('admin') && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              Administrateurs
                            </span>
                          )}
                          
                          {/* Tags supplémentaires */}
                          {item.is_recent && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                              Récent
                            </span>
                          )}
                          {item.can_edit && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              Modifiable
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Pagination */}
              {pagination.total > 1 && (
                <div className="card p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Affichage de {Math.min(news.length, limit)} sur {pagination.totalItems} actualités
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Précédent
                      </button>
                      <div className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg">
                        {page}
                      </div>
                      <button
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={page >= pagination.total || !pagination.hasMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="mt-8 card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">
                💡 Informations importantes sur les actualités
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Pour les étudiants :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Les actualités marquées <span className="font-medium">"NOUVEAU"</span> sont récentes (moins de 24h)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Les tags indiquent à qui s'adresse chaque actualité</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Consultez régulièrement pour ne rien manquer</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Fonctionnalités :</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Rafraîchissement automatique toutes les 30 secondes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Filtrage des actualités récentes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Navigation par pagination</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-600">
                  <span className="font-medium">Note :</span> Cette page affiche uniquement les actualités destinées aux étudiants. 
                  Certaines actualités peuvent être visibles par plusieurs groupes (étudiants, enseignants, etc.).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug info (à retirer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
            <div className="font-medium text-gray-700 mb-2">Debug Info:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>News count: <span className="font-medium">{news.length}</span></div>
              <div>Total items: <span className="font-medium">{pagination.totalItems}</span></div>
              <div>Page: <span className="font-medium">{page}</span></div>
              <div>Auto-refresh: <span className="font-medium">{autoRefresh ? 'ON' : 'OFF'}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentNews