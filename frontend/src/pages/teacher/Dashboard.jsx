import React from 'react'
import { useQuery } from 'react-query'
import { teacherAPI } from '../../services/api'
import { Users, BookOpen, Award, Calendar } from 'lucide-react'

const TeacherDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'teacherDashboard',
    () => teacherAPI.getDashboard(),
    { refetchOnWindowFocus: false }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const { dashboard } = dashboardData?.data || {}
  const { assignments, statistics, mainTeacherClasses } = dashboard || {}

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Enseignant</h1>
        <p className="text-gray-600">
          Vue d'ensemble de vos classes et matières
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
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
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Matières</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.subjectsCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prof principal</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.mainTeacherClasses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assignations</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes assignées */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes classes et matières</h2>
        <div className="space-y-4">
          {assignments?.map((assignment, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  {assignment.Class?.name} - {assignment.Subject?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Niveau: {assignment.Class?.level} | 
                  {assignment.is_main_teacher && (
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Prof principal
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <button className="btn btn-primary text-sm">
                  Saisir les notes
                </button>
              </div>
            </div>
          ))}
          
          {(!assignments || assignments.length === 0) && (
            <p className="text-center text-gray-500 py-8">
              Aucune classe assignée pour le moment
            </p>
          )}
        </div>
      </div>

      {/* Classes où je suis prof principal */}
      {mainTeacherClasses && mainTeacherClasses.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mes classes en tant que professeur principal
          </h2>
          <div className="space-y-2">
            {mainTeacherClasses.map((classItem, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">{classItem.name}</span>
                <span className="text-sm text-blue-700">{classItem.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard