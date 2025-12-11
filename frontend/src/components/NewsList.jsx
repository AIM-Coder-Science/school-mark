import React from 'react'
import { useQuery } from 'react-query'
import { newsAPI } from '../services/api'
import { Bell, Calendar, User, AlertCircle, Loader } from 'lucide-react'

const NewsList = () => {
  const { data: newsData, isLoading, error, refetch } = useQuery(
    'news',
    () => newsAPI.getNews(),
    {
      refetchOnWindowFocus: false,
      retry: 2
    }
  )

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des actualités...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Erreur de chargement
        </h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'Impossible de charger les actualités'}
        </p>
        <button
          onClick={() => refetch()}
          className="btn btn-primary"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const news = newsData?.news || []

  return (
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
        news.map((item) => (
          <div 
            key={item.id} 
            className="card overflow-hidden hover:shadow-lg transition-shadow relative"
          >
            {/* Badge récent */}
            {isRecent(item.createdAt) && (
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full z-10">
                NOUVEAU
              </div>
            )}

            <div className="p-6">
              <div className="mb-4">
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
        ))
      )}
    </div>
  )
}

export default NewsList