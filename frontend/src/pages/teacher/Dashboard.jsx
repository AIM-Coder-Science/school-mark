// frontend/src/pages/teacher/Dashboard.jsx
import React from 'react'
import { useQuery } from 'react-query'
import { teacherAPI } from '../../services/api'
import { 
  Users, BookOpen, GraduationCap, FileText, TrendingUp, 
  Award, Calendar, Clock, Bell, CheckCircle, AlertCircle,
  ChevronRight, Home, BarChart3, UserCheck, BookMarked, RefreshCw
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

const TeacherDashboard = () => {
  const { data: dashboardResponse, isLoading, error, refetch } = useQuery(
    'teacherDashboard',
    () => teacherAPI.getDashboard(),
    { 
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000 // Cache les données pendant 1 minute
    }
  )

  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
          <p className="text-sm text-gray-500">Récupération de vos informations</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error('Erreur dashboard enseignant:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Erreur de chargement</h3>
          <p className="text-gray-600 text-center max-w-md">
            Impossible de charger votre tableau de bord. Vérifiez votre connexion ou réessayez.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // DEBUG: Log pour voir la structure des données
  console.log('📊 Dashboard response:', dashboardResponse);

  // Correction : Vérifier différentes structures possibles
  let dashboard = {};
  
  if (dashboardResponse?.success && dashboardResponse?.dashboard) {
    // Structure: { success: true, dashboard: {...} }
    dashboard = dashboardResponse.dashboard;
  } else if (dashboardResponse?.data?.dashboard) {
    // Structure: { data: { dashboard: {...} } }
    dashboard = dashboardResponse.data.dashboard;
  } else if (dashboardResponse?.dashboard) {
    // Structure: { dashboard: {...} }
    dashboard = dashboardResponse.dashboard;
  } else {
    // Structure directe
    dashboard = dashboardResponse || {};
  }

  console.log('📊 Dashboard data extrait:', dashboard);

  // Extraire les données avec des valeurs par défaut
  const teacher = dashboard?.teacher || {};
  const assignments = Array.isArray(dashboard?.assignments) ? dashboard.assignments : [];
  const statistics = dashboard?.statistics || {};
  const recentGrades = Array.isArray(dashboard?.recentGrades) ? dashboard.recentGrades : [];
  const mainTeacherClasses = Array.isArray(dashboard?.mainTeacherClasses) ? dashboard.mainTeacherClasses : [];

  // Calculer le nombre total d'étudiants dans toutes les classes assignées
  const totalStudentsInClasses = assignments.reduce((total, assignment) => {
    // Essayer différentes structures
    const studentsCount = 
      assignment.class?.Students?.length || 
      assignment.students_count || 
      assignment.studentsCount || 
      0;
    return total + studentsCount;
  }, 0);

  // Statistiques réelles - avec fallback aux données calculées
  const realStats = {
    classesCount: statistics.classesCount || assignments.length,
    subjectsCount: statistics.subjectsCount || new Set(assignments.map(a => a.subject?.id || a.Subject?.id)).size,
    mainTeacherClasses: statistics.mainTeacherClasses || mainTeacherClasses.length,
    totalAssignments: statistics.totalAssignments || assignments.length,
    totalStudents: totalStudentsInClasses
  }

  // Informations de l'enseignant
  const teacherInfo = {
    name: teacher?.first_name && teacher?.last_name 
      ? `${teacher.first_name} ${teacher.last_name}` 
      : teacher?.name || 'Enseignant',
    specialty: teacher?.specialty || 'Non spécifié',
    email: teacher?.email || 'Non disponible',
    phone: teacher?.phone || 'Non disponible'
  }

  // Actions rapides
  const quickActions = [
    {
      id: 1,
      label: 'Saisir des notes',
      description: 'Ajouter des notes pour vos classes',
      onClick: () => navigate('/teacher/classes'),
      icon: FileText,
      color: 'blue',
      badge: assignments.length > 0 ? `${assignments.length} classe(s)` : 'Aucune classe'
    },
    {
      id: 2,
      label: 'Voir mes classes',
      description: 'Consulter vos classes assignées',
      onClick: () => navigate('/teacher/classes'),
      icon: BookOpen,
      color: 'green',
      badge: realStats.classesCount > 0 ? `${realStats.classesCount} classe(s)` : 'Aucune'
    },
    {
      id: 3,
      label: 'Gérer les appréciations',
      description: 'Ajouter des appréciations pour vos étudiants',
      onClick: () => navigate('/teacher/appreciations'),
      icon: Award,
      color: 'purple',
      disabled: realStats.mainTeacherClasses === 0,
      badge: realStats.mainTeacherClasses > 0 ? `${realStats.mainTeacherClasses} classe(s)` : 'Prof principal requis'
    },
    {
      id: 4,
      label: 'Consulter les actualités',
      description: 'Voir les dernières informations',
      onClick: () => navigate('/teacher/news'),
      icon: Bell,
      color: 'orange',
      badge: 'Mises à jour'
    }
  ]

  // Format de date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Format note
  const formatGrade = (grade) => {
    if (grade === null || grade === undefined) return 'N/A';
    return parseFloat(grade).toFixed(2);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec informations personnelles */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Home className="h-5 w-5 mr-2 text-blue-200" />
                <span className="text-blue-200">Tableau de bord</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">Bonjour, {teacherInfo.name}</h1>
              <p className="text-blue-100 mb-4">
                {teacherInfo.specialty} • Bienvenue sur votre espace enseignant
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  <span>{teacherInfo.email}</span>
                </div>
                {teacherInfo.phone && teacherInfo.phone !== 'Non disponible' && (
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    <span>{teacherInfo.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">
                    {realStats.classesCount}
                  </div>
                  <div className="text-blue-200 text-sm">Classes assignées</div>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                title="Rafraîchir les données"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mes Classes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realStats.classesCount}
                </p>
                <div className="flex items-center mt-2">
                  {realStats.classesCount > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Assignées</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">Aucune classe</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Apprenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realStats.totalStudents}
                </p>
                <div className="flex items-center mt-2">
                  {realStats.totalStudents > 0 ? (
                    <>
                      <Users className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Total élèves</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">Aucun élève</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Matières</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realStats.subjectsCount}
                </p>
                <div className="flex items-center mt-2">
                  {realStats.subjectsCount > 0 ? (
                    <>
                      <BookMarked className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="text-sm text-purple-600">Enseignées</span>
                    </>
                  ) : (
                    <>
                      <BookMarked className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">Aucune matière</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookMarked className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prof Principal</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {realStats.mainTeacherClasses}
                </p>
                <div className="flex items-center mt-2">
                  {realStats.mainTeacherClasses > 0 ? (
                    <>
                      <Award className="h-4 w-4 text-orange-500 mr-1" />
                      <span className="text-sm text-orange-600">Classes principales</span>
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">Non prof principal</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Classes assignées */}
          <div className="lg:col-span-2 space-y-8">
            {/* Classes assignées */}
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Mes Classes Assignées
                </h2>
                <Link 
                  to="/teacher/classes" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  Voir toutes
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {assignments.length > 0 ? (
                  assignments.map((assignment, index) => {
                    // Gestion de différentes structures de données
                    const classInfo = assignment.class || assignment.Class || {};
                    const subjectInfo = assignment.subject || assignment.Subject || {};
                    const studentCount = 
                      classInfo.Students?.length || 
                      assignment.students_count || 
                      assignment.studentsCount || 
                      0;
                    
                    return (
                      <div 
                        key={assignment.id || index}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate('/teacher/classes')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {classInfo.name || 'Classe sans nom'}
                              {assignment.is_main_teacher && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <Award className="h-3 w-3 mr-1" />
                                  Prof principal
                                </span>
                              )}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <GraduationCap className="h-4 w-4 mr-1" />
                                <span>{studentCount} apprenant(s)</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <BookMarked className="h-4 w-4 mr-1" />
                                <span>{subjectInfo.name || 'Matière non spécifiée'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>Coefficient: {subjectInfo.coefficient || 1}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune classe assignée pour le moment</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Contactez l'administration pour vous assigner à des classes
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dernières notes ajoutées */}
            {recentGrades.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Dernières Notes Ajoutées
                  </h2>
                  <Link 
                    to="/teacher/classes" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    Saisir des notes
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentGrades.slice(0, 5).map((grade, index) => (
                    <div key={grade.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">
                          {grade.student_name || grade.Student?.name || 'Étudiant'}
                        </p>
                        <div className="flex items-center mt-1 space-x-3 text-sm text-gray-600">
                          <span>{grade.subject || grade.Subject?.name || 'Matière'}</span>
                          <span>•</span>
                          <span>{grade.class || grade.Class?.name || 'Classe'}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            (grade.exam_type || grade.grade_type) === 'interro' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(grade.exam_type || grade.grade_type) === 'interro' ? 'Interro' : 'Devoir'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          parseFloat(grade.score || grade.grade || 0) >= 10 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatGrade(grade.score || grade.grade)}/20
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(grade.date || grade.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite : Actions rapides et infos */}
          <div className="space-y-8">
            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                Actions Rapides
              </h2>

              <div className="space-y-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                      action.disabled
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${action.disabled ? 'bg-gray-100' : `bg-${action.color}-100`}`}>
                          <action.icon className={`h-5 w-5 ${action.disabled ? 'text-gray-500' : `text-${action.color}-600`}`} />
                        </div>
                        <div className="ml-3">
                          <span className={`font-medium block ${action.disabled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {action.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {action.description}
                          </span>
                        </div>
                      </div>
                      {action.badge && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          action.disabled
                            ? 'bg-gray-100 text-gray-600'
                            : `bg-${action.color}-100 text-${action.color}-800`
                        }`}>
                          {action.badge}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Classes où vous êtes prof principal */}
            {mainTeacherClasses.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6 border border-orange-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-orange-600" />
                  Professeur Principal
                </h2>
                
                <div className="space-y-3">
                  {mainTeacherClasses.map((classItem, index) => (
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {classItem.name || classItem.className || 'Classe sans nom'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {classItem.level || ''} • {classItem.subject || 'Toutes matières'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <p className="text-sm text-gray-600">
                    En tant que professeur principal, vous avez accès aux fonctionnalités complètes de gestion de classe.
                  </p>
                </div>
              </div>
            )}

            {/* Guide rapide */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Guide Rapide
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Sélectionnez une classe pour saisir les notes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Les moyennes sont calculées automatiquement</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>N'oubliez pas d'enregistrer vos modifications</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <button
                  onClick={() => refetch()}
                  className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Actualiser les données
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page - seulement si on a des données */}
        {(assignments.length > 0 || recentGrades.length > 0) && (
          <div className="mt-8 bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {realStats.totalAssignments}
                </div>
                <p className="text-sm text-gray-600 mt-1">Total assignations</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {recentGrades.length}
                </div>
                <p className="text-sm text-gray-600 mt-1">Notes ajoutées récemment</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {realStats.mainTeacherClasses}
                </div>
                <p className="text-sm text-gray-600 mt-1">Classes principales</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard