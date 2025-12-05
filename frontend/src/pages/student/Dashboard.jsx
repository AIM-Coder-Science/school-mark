import React from 'react'
import { useQuery } from 'react-query'
import { studentAPI } from '../../services/api'
import { BookOpen, TrendingUp, Award, Calendar, AlertCircle } from 'lucide-react'

const StudentDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery(
    'studentDashboard',
    () => studentAPI.getDashboard(),
    { 
      refetchOnWindowFocus: false,
      retry: 1
    }
  )

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
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">
            Impossible de charger votre tableau de bord. Veuillez réessayer.
          </p>
        </div>
      </div>
    )
  }

  const { student, subjectAverages, generalAverage } = dashboardData?.data || {}

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profil non trouvé</h3>
          <p className="text-gray-600">
            Votre profil étudiant n'a pas été trouvé. Contactez l'administration.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">
          Bienvenue, {student?.first_name} {student?.last_name}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Moyenne générale</p>
              <p className="text-2xl font-bold text-gray-900">
                {generalAverage?.toFixed(2) || '0.00'}
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
              <p className="text-sm font-medium text-gray-600">Matières suivies</p>
              <p className="text-2xl font-bold text-gray-900">
                {subjectAverages?.length || 0}
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
              <p className="text-sm font-medium text-gray-600">Classe</p>
              <p className="text-2xl font-bold text-gray-900">
                {student?.class?.name || 'Non assigné'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes par matière */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes par matière</h2>
        <div className="space-y-4">
          {subjectAverages?.map((subject, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{subject.subject.name}</h3>
                <p className="text-sm text-gray-600">
                  Coeff: {subject.subject.coefficient}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {subject.totalAverage.toFixed(2)}/20
                </p>
                <p className="text-sm text-gray-600">
                  Interros: {subject.interroAvg.toFixed(2)} | 
                  Devoir: {subject.dernierDevoir.toFixed(2)} | 
                  Examen: {subject.dernierExamen.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          
          {(!subjectAverages || subjectAverages.length === 0) && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune note disponible pour le moment</p>
              <p className="text-sm text-gray-400 mt-2">
                Vos notes apparaîtront ici une fois saisies par vos enseignants
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Matricule</label>
            <p className="mt-1 text-sm text-gray-900">{student.matricule}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Classe</label>
            <p className="mt-1 text-sm text-gray-900">
              {student.class?.name || 'Non assigné'} - {student.class?.level || ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard