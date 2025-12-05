import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { teacherAPI, appreciationAPI, utilsAPI } from '../../services/api'
import { Award, Users, TrendingUp, ChevronDown, ChevronUp, Save, Loader, AlertCircle, Calculator } from 'lucide-react'

const TeacherAppreciation = () => {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [appreciation, setAppreciation] = useState('')
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  
  const queryClient = useQueryClient()

  // Récupérer les classes où je suis prof principal
  const { data: dashboardData } = useQuery(
    'teacherDashboard',
    () => teacherAPI.getDashboard(),
    { refetchOnWindowFocus: false }
  )

  // Récupérer les données de la classe sélectionnée
  const { data: classData, isLoading: loadingClass } = useQuery(
    ['mainTeacherClass', selectedClass],
    () => teacherAPI.getMainTeacherDashboard(selectedClass),
    { 
      enabled: !!selectedClass,
      refetchOnWindowFocus: false 
    }
  )

  // Récupérer la moyenne générale de l'étudiant sélectionné
  const { data: averageData, isLoading: loadingAverage, refetch: refetchAverage } = useQuery(
    ['studentAverage', selectedStudent, selectedClass],
    () => utilsAPI.getGeneralAverage(selectedStudent, '1'), // Semestre 1 par défaut
    { 
      enabled: !!selectedStudent,
      refetchOnWindowFocus: false 
    }
  )

  // Mutation pour enregistrer l'appréciation
  const createAppreciationMutation = useMutation(
    (data) => appreciationAPI.createAppreciation(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mainTeacherClass', selectedClass])
        alert('Appréciation enregistrée avec succès!')
        // Passer à l'étudiant suivant
        handleNextStudent()
      },
      onError: (error) => {
        alert('Erreur: ' + (error.response?.data?.message || error.message))
      }
    }
  )

  const mainTeacherClasses = dashboardData?.data?.dashboard?.mainTeacherClasses || []
  const students = classData?.data?.students || []
  const currentStudent = students[currentStudentIndex]

  const handleCalculateAverage = () => {
    if (!selectedStudent) {
      alert('Veuillez sélectionner un étudiant')
      return
    }
    refetchAverage()
  }

  const handleSaveAppreciation = () => {
    if (!selectedStudent || !appreciation.trim()) {
      alert('Veuillez sélectionner un étudiant et saisir une appréciation')
      return
    }

    createAppreciationMutation.mutate({
      student_id: parseInt(selectedStudent),
      class_id: parseInt(selectedClass),
      semester: '1', // À adapter selon le semestre actuel
      appreciation: appreciation,
      general_average: averageData?.data?.generalAverage || 0
    })
  }

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
      setSelectedStudent(students[currentStudentIndex - 1]?.id.toString())
      setAppreciation('')
    }
  }

  const handleNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
      setSelectedStudent(students[currentStudentIndex + 1]?.id.toString())
      setAppreciation('')
    }
  }

  if (mainTeacherClasses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune classe principale
          </h3>
          <p className="text-gray-600">
            Vous n'êtes pas professeur principal d'une classe
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appréciations des Apprenants</h1>
        <p className="text-gray-600">Évaluez et commentez les performances de vos élèves</p>
      </div>

      {/* Sélection de la classe */}
      <div className="card p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner votre classe principale
        </label>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value)
            setSelectedStudent('')
            setCurrentStudentIndex(0)
            setAppreciation('')
          }}
          className="input max-w-md"
        >
          <option value="">Choisir une classe</option>
          {mainTeacherClasses.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name} - {classItem.level}
            </option>
          ))}
        </select>
      </div>

      {/* Interface d'appréciation */}
      {selectedClass && (
        <>
          {loadingClass ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="h-12 w-12 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              {/* Sélection rapide de l'étudiant */}
              <div className="card p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un apprenant
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value)
                    const index = students.findIndex(s => s.id.toString() === e.target.value)
                    setCurrentStudentIndex(index)
                    setAppreciation('')
                  }}
                  className="input max-w-md"
                >
                  <option value="">Choisir un apprenant</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - {student.matricule}
                    </option>
                  ))}
                </select>
              </div>

              {/* Détails de l'étudiant et notes */}
              {selectedStudent && currentStudent && (
                <div className="space-y-6">
                  {/* Informations de l'étudiant */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {currentStudent.first_name} {currentStudent.last_name}
                          </h2>
                          <p className="text-sm text-gray-600">
                            Matricule: {currentStudent.matricule}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleCalculateAverage}
                        disabled={loadingAverage}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        {loadingAverage ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Calculator className="h-4 w-4" />
                        )}
                        <span>Calculer la moyenne</span>
                      </button>
                    </div>

                    {/* Moyenne générale */}
                    {averageData && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Moyenne générale</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {averageData.data?.generalAverage?.toFixed(2) || '0.00'}/20
                          </p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Award className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">Rang</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            {averageData.data?.rank || '-'} / {averageData.data?.totalStudents || '-'}
                          </p>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Matières</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {averageData.data?.subjectsCount || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tableau des notes */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail des notes</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matière</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Coeff</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Interros</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Devoir</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Examen</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Moyenne</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {averageData?.data?.subjectAverages?.map((subject, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {subject.subject.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                {subject.subject.coefficient}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                {subject.interroAvg?.toFixed(2) || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                {subject.dernierDevoir?.toFixed(2) || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                {subject.dernierExamen?.toFixed(2) || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`text-sm font-semibold ${
                                  subject.totalAverage >= 10 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {subject.totalAverage?.toFixed(2) || '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Zone d'appréciation */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Votre appréciation
                    </h3>
                    <textarea
                      rows={4}
                      value={appreciation}
                      onChange={(e) => setAppreciation(e.target.value)}
                      placeholder="Saisissez votre appréciation générale pour cet apprenant..."
                      className="input"
                    />
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={handlePreviousStudent}
                          disabled={currentStudentIndex === 0}
                          className="btn btn-secondary flex items-center space-x-2"
                        >
                          <ChevronUp className="h-4 w-4" />
                          <span>Précédent</span>
                        </button>
                        <button
                          onClick={handleNextStudent}
                          disabled={currentStudentIndex === students.length - 1}
                          className="btn btn-secondary flex items-center space-x-2"
                        >
                          <span>Suivant</span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={handleSaveAppreciation}
                        disabled={createAppreciationMutation.isLoading || !appreciation.trim()}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        {createAppreciationMutation.isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>Enregistrer l'appréciation</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Apprenant {currentStudentIndex + 1} sur {students.length}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default TeacherAppreciation