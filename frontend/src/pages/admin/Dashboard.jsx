import React from 'react'
import { useQuery } from 'react-query'
import { adminAPI } from '../../services/api'
import { Users, BookOpen, GraduationCap, FileText, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery(
    'adminDashboard',
    () => adminAPI.getDashboard(),
    { refetchOnWindowFocus: false }
  )

  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          Erreur lors du chargement du tableau de bord
        </div>
      </div>
    )
  }

  const { dashboard } = dashboardData?.data || {}
  const { statistics, recentStudents, recentTeachers } = dashboard || {}

  const quickActions = [
    {
      label: 'Ajouter un enseignant',
      onClick: () => navigate('/admin/teachers?create=true'),
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Créer une classe',
      onClick: () => navigate('/admin/classes?create=true'),
      icon: BookOpen,
      color: 'green'
    },
    {
      label: 'Ajouter un étudiant',
      onClick: () => navigate('/admin/students?create=true'),
      icon: GraduationCap,
      color: 'purple'
    },
    {
      label: 'Publier une actualité',
      onClick: () => navigate('/admin/news?create=true'),
      icon: FileText,
      color: 'orange'
    }
  ]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administration</h1>
        <p className="text-gray-600">
          Gestion complète de l'établissement
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Étudiants</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.studentsCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enseignants</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.teachersCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.classesCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Matières</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.subjectsCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers étudiants inscrits */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Derniers étudiants inscrits
          </h2>
          <div className="space-y-3">
            {recentStudents?.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {student.matricule} • {student.Class?.name || 'Non assigné'}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(student.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
            
            {(!recentStudents || recentStudents.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                Aucun étudiant inscrit
              </p>
            )}
          </div>
        </div>

        {/* Derniers enseignants ajoutés */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Derniers enseignants ajoutés
          </h2>
          <div className="space-y-3">
            {recentTeachers?.map((teacher, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {teacher.first_name} {teacher.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {teacher.specialty}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(teacher.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
            
            {(!recentTeachers || recentTeachers.length === 0) && (
              <p className="text-center text-gray-500 py-4">
                Aucun enseignant ajouté
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-2 bg-${action.color}-100 rounded-lg`}>
                <action.icon className={`h-5 w-5 text-${action.color}-600`} />
              </div>
              <span className="font-medium text-gray-900">{action.label}</span>
              <Plus className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard