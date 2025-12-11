// frontend/src/pages/admin/Dashboard.jsx - VERSION AMÉLIORÉE
import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { adminAPI } from '../../services/api'
import { 
  Users, BookOpen, GraduationCap, FileText, TrendingUp, AlertCircle, Calendar,
  RefreshCw, Eye, Activity, CheckCircle, XCircle, Clock, Shield, BarChart3,
  UserCheck, BookCheck, TrendingDown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    'adminDashboard',
    () => adminAPI.getDashboard(),
    { 
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000
    }
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  useEffect(() => {
    console.log('📊 Dashboard data:', dashboardData)
  }, [dashboardData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
          <p className="text-sm text-gray-500">Récupération des données depuis la base</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('Erreur dashboard admin:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Erreur de chargement</h3>
          <p className="text-gray-600 text-center max-w-md">
            Impossible de charger le tableau de bord. Vérifiez votre connexion.
          </p>
          <div className="flex space-x-3 mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualiser la page
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Accéder aux données - structure corrigée
  const dashboard = dashboardData?.dashboard || dashboardData?.data?.dashboard || {}
  const statistics = dashboard?.statistics || {}
  const recentStudents = dashboard?.recentStudents || []
  const recentTeachers = dashboard?.recentTeachers || []
  const recentNews = dashboard?.recentNews || []
  const gradesStatistics = dashboard?.gradesStatistics || []

  // Vérification des données
  const hasData = statistics.studentsCount > 0 || statistics.teachersCount > 0 || statistics.classesCount > 0

  // Statistiques principales avec icônes et couleurs
  const mainStats = [
    {
      id: 1,
      label: 'Étudiants',
      value: statistics.studentsCount || 0,
      icon: GraduationCap,
      color: 'blue',
      description: 'Inscrits actifs',
      trend: statistics.studentsCount > 0 ? 'up' : 'stable'
    },
    {
      id: 2,
      label: 'Enseignants',
      value: statistics.teachersCount || 0,
      icon: UserCheck,
      color: 'green',
      description: 'En service',
      trend: statistics.teachersCount > 0 ? 'up' : 'stable'
    },
    {
      id: 3,
      label: 'Classes',
      value: statistics.classesCount || 0,
      icon: BookOpen,
      color: 'purple',
      description: 'Actives',
      trend: statistics.classesCount > 0 ? 'up' : 'stable'
    },
    {
      id: 4,
      label: 'Matières',
      value: statistics.subjectsCount || 0,
      icon: BookCheck,
      color: 'orange',
      description: 'Enseignées',
      trend: statistics.subjectsCount > 0 ? 'up' : 'stable'
    }
  ]

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Formater la date complète
  const formatFullDate = () => {
    return new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Obtenir l'icône de tendance
  const getTrendIcon = (trend) => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Activity;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">Tableau de bord Administrateur</h1>
              <p className="text-gray-300">
                Vue d'ensemble et gestion de l'établissement
              </p>
              <div className="flex items-center mt-4">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                <span>{formatFullDate()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
              <button
                onClick={() => navigate('/admin/all-data')}
                className="flex items-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue analytique
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Avertissement si pas de données */}
        {!hasData && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                Aucune donnée disponible. Commencez par ajouter des utilisateurs et des classes.
              </p>
            </div>
          </div>
        )}

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainStats.map((stat) => {
            const TrendIcon = getTrendIcon(stat.trend);
            const Icon = stat.icon;
            return (
              <div 
                key={stat.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  if (stat.id === 1) navigate('/admin/students');
                  if (stat.id === 2) navigate('/admin/teachers');
                  if (stat.id === 3) navigate('/admin/classes');
                  if (stat.id === 4) navigate('/admin/subjects');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline mt-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <div className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center ${
                        stat.trend === 'up' ? 'bg-green-100 text-green-800' :
                        stat.trend === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <TrendIcon className={`h-3 w-3 mr-1 ${
                          stat.trend === 'up' ? 'text-green-600' :
                          stat.trend === 'down' ? 'text-red-600' :
                          'text-gray-600'
                        }`} />
                        {stat.trend === 'up' ? 'En hausse' : 'Stable'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                    <Icon className={`h-8 w-8 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600 font-medium flex items-center justify-between">
                    <span>Voir les détails</span>
                    <div className={`h-8 w-8 rounded-full bg-${stat.color}-100 flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 text-${stat.color}-600`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Activité récente */}
          <div className="lg:col-span-2 space-y-8">
            {/* Derniers étudiants */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                    Dernières inscriptions
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {recentStudents.length} étudiant{recentStudents.length !== 1 ? 's' : ''} récemment inscrit{recentStudents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/admin/students')}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center"
                >
                  Tout voir
                  <TrendingUp className="h-4 w-4 ml-2" />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentStudents.length > 0 ? (
                  recentStudents.map((student, index) => (
                    <div 
                      key={student.id || index}
                      className="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer hover:border-blue-200"
                      onClick={() => navigate(`/admin/students/${student.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <span className="text-blue-800 font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                            {student.first_name} {student.last_name}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {student.matricule}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                              {student.class?.name || 'Non assigné'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          Inscrit le
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          {formatDate(student.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun étudiant</h3>
                    <p className="text-gray-500 mb-4">Aucun étudiant n'a été inscrit pour le moment.</p>
                    <button 
                      onClick={() => navigate('/admin/students?create=true')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Ajouter le premier étudiant
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Derniers enseignants */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                    Nouveaux enseignants
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {recentTeachers.length} enseignant{recentTeachers.length !== 1 ? 's' : ''} récemment ajouté{recentTeachers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/admin/teachers')}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center"
                >
                  Tout voir
                  <TrendingUp className="h-4 w-4 ml-2" />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentTeachers.length > 0 ? (
                  recentTeachers.map((teacher, index) => (
                    <div 
                      key={teacher.id || index}
                      className="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-all duration-200 cursor-pointer hover:border-green-200"
                      onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors">
                            {teacher.first_name} {teacher.last_name}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium">
                              {teacher.specialty}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{teacher.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          Ajouté le
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          {formatDate(teacher.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun enseignant</h3>
                    <p className="text-gray-500 mb-4">Aucun enseignant n'a été ajouté pour le moment.</p>
                    <button 
                      onClick={() => navigate('/admin/teachers?create=true')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Ajouter le premier enseignant
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite : Statistiques et système */}
          <div className="space-y-8">
            {/* Statistiques système */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                Statistiques système
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Utilisateurs actifs</p>
                      <p className="text-xs text-gray-500">Connectés cette semaine</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{statistics.activeUsers || 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Actualités</p>
                      <p className="text-xs text-gray-500">Publiées</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{statistics.newsCount || 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Moyenne par classe</p>
                      <p className="text-xs text-gray-500">Étudiants/Classe</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {statistics.classesCount > 0 && statistics.studentsCount > 0 
                        ? Math.round(statistics.studentsCount / statistics.classesCount)
                        : '0'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Notes enregistrées</p>
                      <p className="text-xs text-gray-500">Total système</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {gradesStatistics.reduce((sum, stat) => sum + (stat.count || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Tableau analytique complet
                </button>
              </div>
            </div>

            {/* État du système */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
              <h3 className="font-bold text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-400" />
                État du Système
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-3 animate-pulse"></div>
                  <span>Système opérationnel</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                  <span>Base de données connectée</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                  <span>API fonctionnelle</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-3"></div>
                  <span>Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleRefresh}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Actualisation en cours...' : 'Actualiser maintenant'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques des notes */}
        {gradesStatistics.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques des notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {gradesStatistics.map((stat, index) => (
                <div key={index} className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {stat.count || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900 capitalize mb-1">
                    {stat.type || 'Type inconnu'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Moyenne: {stat.average ? parseFloat(stat.average).toFixed(2) : '0.00'}/20
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard