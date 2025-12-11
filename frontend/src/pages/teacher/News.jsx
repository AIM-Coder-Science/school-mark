// frontend/src/pages/teacher/News.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { teacherAPI, newsAPI } from '../../services/api'
import { 
  Plus, Bell, Calendar, User, AlertCircle, Filter, RefreshCw, 
  Eye, Edit, Trash2, Send, CheckCircle, Users, BookOpen, 
  Clock, TrendingUp, FileText, CheckSquare, XSquare
} from 'lucide-react'

const TeacherNews = () => {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_roles: ['student', 'teacher']
  })
  const [editingId, setEditingId] = useState(null)
  
  const limit = 10
  const queryClient = useQueryClient()

  // Récupérer les actualités
  const { 
    data: newsData, 
    isLoading, 
    error, 
    refetch, 
    isRefetching 
  } = useQuery(
    ['teacherNews', page],
    () => teacherAPI.getNews({ 
      page, 
      limit
    }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  )

  // Mutation pour créer une actualité
  const createNewsMutation = useMutation(
    (data) => newsAPI.createNews(data),
    {
      onSuccess: (data) => {
        console.log('✅ Actualité créée:', data)
        queryClient.invalidateQueries('teacherNews')
        setShowForm(false)
        setFormData({
          title: '',
          content: '',
          target_roles: ['student', 'teacher']
        })
        setEditingId(null)
      },
      onError: (error) => {
        console.error('❌ Erreur création:', error)
        alert(`Erreur: ${error.response?.data?.message || error.message}`)
      }
    }
  )

  // Mutation pour mettre à jour une actualité
  const updateNewsMutation = useMutation(
    ({ id, data }) => newsAPI.updateNews(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teacherNews')
        setShowForm(false)
        setEditingId(null)
        setFormData({
          title: '',
          content: '',
          target_roles: ['student', 'teacher']
        })
      }
    }
  )

  // Mutation pour supprimer une actualité
  const deleteNewsMutation = useMutation(
    (id) => newsAPI.deleteNews(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teacherNews')
      }
    }
  )

  const allNews = newsData?.news || newsData?.data?.news || []
  const pagination = newsData?.pagination || newsData?.data?.pagination || {
    current: 1,
    total: 1,
    totalItems: 0,
    hasMore: false
  }

  // Filtrer les actualités côté client pour "Mes publications"
  const filteredNews = useMemo(() => {
    if (filter === 'my') {
      // Filtrer pour n'afficher que les publications de l'enseignant actuel
      // On suppose que chaque actualité a un champ author_id ou can_edit
      const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
      return allNews.filter(item => 
        item.can_edit || 
        item.author?.id === currentUserId ||
        item.author_id === currentUserId
      );
    }
    
    if (filter === 'recent') {
      // Filtrer les actualités récentes (moins de 7 jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return allNews.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate > sevenDaysAgo;
      });
    }
    
    return allNews;
  }, [allNews, filter]);

  // Rafraîchir automatiquement si activé
  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch()
      }, 30000)
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
      return dateString
    }
  }

  const getAuthorName = (author) => {
    if (!author) return 'Auteur inconnu'
    
    if (author.author_display) {
      return author.author_display
    }
    
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`
    }
    
    if (author.Teacher?.first_name && author.Teacher?.last_name) {
      return `${author.Teacher.first_name} ${author.Teacher.last_name}`
    }
    
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
    } catch {
      return false
    }
  }

  const canEditNews = (newsItem) => {
    return newsItem.can_edit || false
  }

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }))
  }

  const handleEdit = (newsItem) => {
    setEditingId(newsItem.id)
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      target_roles: newsItem.target_roles || ['student', 'teacher']
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Veuillez remplir le titre et le contenu')
      return
    }

    if (editingId) {
      // Mise à jour
      updateNewsMutation.mutate({
        id: editingId,
        data: formData
      })
    } else {
      // Création
      createNewsMutation.mutate(formData)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      title: '',
      content: '',
      target_roles: ['student', 'teacher']
    })
  }

  const getTargetRoles = (item) => {
    return item.target_roles || item.for_student || item.for_teacher || item.for_admin || []
  }

  // Loading
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

  // Erreur
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Actualités - Enseignant</h1>
              <p className="text-blue-100">
                Publiez et consultez les actualités de l'établissement
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/10 rounded-full">
                <BookOpen className="h-8 w-8" />
              </div>
              {!showForm && !editingId && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Publier une actualité</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Formulaire de publication/édition */}
        {(showForm || editingId) && (
          <div className="card mb-8 p-6 border-2 border-blue-200 bg-blue-50 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Modifier une actualité' : 'Publier une nouvelle actualité'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'actualité *
                </label>
                <input
                  type="text"
                  required
                  className="input w-full"
                  placeholder="Ex: Réunion parents-professeurs"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu *
                </label>
                <textarea
                  rows={6}
                  required
                  className="input w-full"
                  placeholder="Détaillez le contenu de l'actualité..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="inline h-4 w-4 mr-2" />
                  Public cible (qui peut voir cette actualité ?)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'student', label: 'Étudiants', color: 'bg-green-100 text-green-800' },
                    { id: 'teacher', label: 'Enseignants', color: 'bg-purple-100 text-purple-800' },
                    { id: 'admin', label: 'Administrateurs', color: 'bg-red-100 text-red-800' }
                  ].map((role) => (
                    <label 
                      key={role.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.target_roles.includes(role.id)
                          ? `border-blue-500 ${role.color}`
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.target_roles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{role.label}</span>
                      </div>
                      {formData.target_roles.includes(role.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Sélectionnez les groupes qui pourront voir cette actualité
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={createNewsMutation.isLoading || updateNewsMutation.isLoading}
                  className="btn btn-primary flex items-center space-x-2 px-6"
                >
                  {(createNewsMutation.isLoading || updateNewsMutation.isLoading) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : editingId ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      <span>Mettre à jour</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Publier l'actualité</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary px-6 flex items-center space-x-2"
                >
                  <XSquare className="h-4 w-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contrôles et filtres */}
        <div className="card mb-8 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filtrer :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span>Toutes</span>
                </button>
                <button
                  onClick={() => setFilter('my')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    filter === 'my'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Mes publications</span>
                </button>
                <button
                  onClick={() => setFilter('recent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    filter === 'recent'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Récentes</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 border border-blue-200"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span>Rafraîchir</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto-refresh</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center space-x-6">
                <div className="bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-gray-600">Affichage : </span>
                  <span className="font-medium text-gray-900">
                    {filteredNews.length} actualité{filteredNews.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-lg">
                  <span className="text-gray-600">Total : </span>
                  <span className="font-medium text-gray-900">
                    {pagination.totalItems || 0}
                  </span>
                </div>
                <div className="bg-purple-50 px-3 py-1 rounded-lg">
                  <span className="text-gray-600">Page : </span>
                  <span className="font-medium text-gray-900">
                    {pagination.current || 1} / {pagination.total || 1}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  filter === 'my' ? 'bg-green-100 text-green-800' :
                  filter === 'recent' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {filter === 'my' ? 'Filtre: Mes publications' :
                   filter === 'recent' ? 'Filtre: Récentes' :
                   'Filtre: Toutes'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des actualités */}
        <div className="space-y-6">
          {filteredNews.length === 0 ? (
            <div className="card p-12 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'my' 
                  ? "Vous n'avez pas encore publié d'actualité."
                  : filter === 'recent'
                  ? "Aucune actualité récente"
                  : "Aucune actualité disponible"
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'my' 
                  ? "Cliquez sur 'Publier une actualité' pour créer votre première publication."
                  : "Les actualités seront affichées ici dès qu'elles seront publiées."
                }
              </p>
              {filter === 'my' && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Publier votre première actualité</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredNews.map((item) => {
                const targetRoles = getTargetRoles(item)
                const isItemRecent = isRecent(item.createdAt)
                const canEdit = canEditNews(item)
                
                return (
                  <div 
                    key={item.id} 
                    className="card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative border"
                  >
                    {/* En-tête avec badges et actions */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-8">
                          {/* Badges en ligne */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {isItemRecent && (
                              <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full inline-flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>NOUVEAU</span>
                              </span>
                            )}
                            {canEdit && (
                              <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full inline-flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>Moi</span>
                              </span>
                            )}
                          </div>
                          
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
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="capitalize">
                                {targetRoles.map(role => {
                                  if (role === 'student') return 'Étudiants'
                                  if (role === 'teacher') return 'Enseignants'
                                  if (role === 'admin') return 'Admin'
                                  return role
                                }).join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions - position améliorée */}
                        {canEdit && (
                          <div className="flex space-x-1 bg-gray-50 rounded-lg p-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
                                  deleteNewsMutation.mutate(item.id)
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="prose prose-blue max-w-none mb-4">
                        <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border">
                          {item.content || 'Aucun contenu disponible'}
                        </div>
                      </div>

                      {/* Tags */}
                      {Array.isArray(targetRoles) && targetRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                          {targetRoles.includes('all') && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
                              Pour tous
                            </span>
                          )}
                          {targetRoles.includes('student') && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                              Étudiants
                            </span>
                          )}
                          {targetRoles.includes('teacher') && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full border border-purple-200">
                              Enseignants
                            </span>
                          )}
                          {targetRoles.includes('admin') && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
                              Administrateurs
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
                      Page {pagination.current || 1} sur {pagination.total || 1} • 
                      <span className="ml-2 font-medium">{filteredNews.length}</span> résultats
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setPage(prev => prev + 1)}
                        disabled={page >= pagination.total || !pagination.hasMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border"
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

        {/* Guide pour les enseignants */}
        <div className="mt-8 card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">
                📋 Guide de publication pour enseignants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    Publier une actualité
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Utilisez <span className="font-medium">"Publier une actualité"</span> en haut à droite</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Sélectionnez le <span className="font-medium">public cible</span> approprié</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Modifiez ou supprimez vos publications via les icônes <Edit className="inline h-3 w-3" /> et <Trash2 className="inline h-3 w-3" /></span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Utiliser les filtres
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><span className="font-medium">"Mes publications"</span> : affiche uniquement vos publications</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><span className="font-medium">"Récentes"</span> : publications des 7 derniers jours</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Le badge <span className="bg-green-500 text-white px-1 rounded text-xs">NOUVEAU</span> indique les publications de moins de 24h</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-300">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      💡 Bonnes pratiques de communication :
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        <span>Rédigez des titres clairs et informatifs</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        <span>Ciblez précisément votre audience</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        <span>Relisez avant de publier</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        <span>Mettez à jour les informations obsolètes</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherNews