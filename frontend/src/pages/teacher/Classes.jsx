import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { teacherAPI, gradeAPI } from '../../services/api'
import { BookOpen, Users, Plus, Save, Loader, AlertCircle } from 'lucide-react'

const TeacherClasses = () => {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [gradeType, setGradeType] = useState('interro')
  const [grades, setGrades] = useState({})
  
  const queryClient = useQueryClient()

  // Récupérer les classes assignées
  const { data: classesData, isLoading: loadingClasses } = useQuery(
    'teacherClasses',
    () => teacherAPI.getAssignedClasses(),
    { refetchOnWindowFocus: false }
  )

  // Récupérer les matières pour la classe sélectionnée
  const { data: subjectsData } = useQuery(
    ['teacherSubjects', selectedClass],
    () => teacherAPI.getSubjectsByClass(selectedClass),
    { 
      enabled: !!selectedClass,
      refetchOnWindowFocus: false 
    }
  )

  // Récupérer les notes existantes
  const { data: existingGrades, isLoading: loadingGrades } = useQuery(
    ['classGrades', selectedClass, selectedSubject, gradeType],
    () => gradeAPI.getClassGrades(selectedClass, { 
      subject_id: selectedSubject,
      grade_type: gradeType 
    }),
    { 
      enabled: !!selectedClass && !!selectedSubject,
      refetchOnWindowFocus: false 
    }
  )

  // Mutation pour créer/modifier les notes
  const createGradeMutation = useMutation(
    (data) => gradeAPI.createGrade(selectedClass, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classGrades', selectedClass])
        setGrades({})
        alert('Notes enregistrées avec succès!')
      },
      onError: (error) => {
        alert('Erreur lors de l\'enregistrement: ' + (error.response?.data?.message || error.message))
      }
    }
  )

  const handleGradeChange = (studentId, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const gradesArray = Object.entries(grades).map(([studentId, grade]) => ({
      student_id: parseInt(studentId),
      subject_id: parseInt(selectedSubject),
      grade_type: gradeType,
      grade: parseFloat(grade)
    }))

    if (gradesArray.length === 0) {
      alert('Veuillez saisir au moins une note')
      return
    }

    createGradeMutation.mutate({ grades: gradesArray })
  }

  const assignments = classesData?.data?.assignments || []
  const subjects = subjectsData?.data?.subjects || []
  const students = existingGrades?.data?.students || []

  if (loadingClasses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Notes</h1>
        <p className="text-gray-600">Saisissez les notes de vos apprenants</p>
      </div>

      {/* Sélecteurs */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner une classe
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setSelectedSubject('')
                setGrades({})
              }}
              className="input"
            >
              <option value="">Choisir une classe</option>
              {assignments.map((assignment) => (
                <option key={assignment.Class.id} value={assignment.Class.id}>
                  {assignment.Class.name} - {assignment.Class.level}
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une matière
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value)
                  setGrades({})
                }}
                className="input"
              >
                <option value="">Choisir une matière</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSubject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de note
              </label>
              <select
                value={gradeType}
                onChange={(e) => {
                  setGradeType(e.target.value)
                  setGrades({})
                }}
                className="input"
              >
                <option value="interro">Interrogation</option>
                <option value="devoir">Devoir</option>
                <option value="examen">Examen</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Liste des étudiants et saisie des notes */}
      {selectedSubject && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des apprenants
            </h2>
            <button
              onClick={handleSubmit}
              disabled={createGradeMutation.isLoading || Object.keys(grades).length === 0}
              className="btn btn-primary flex items-center space-x-2"
            >
              {createGradeMutation.isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Enregistrer les notes</span>
            </button>
          </div>

          {loadingGrades ? (
            <div className="text-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const existingGrade = student.grades?.find(
                  g => g.grade_type === gradeType && g.subject_id === parseInt(selectedSubject)
                )
                
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Matricule: {student.matricule}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {existingGrade && (
                        <span className="text-sm text-gray-600">
                          Note actuelle: <span className="font-semibold">{existingGrade.grade}/20</span>
                        </span>
                      )}
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="Note /20"
                        value={grades[student.id] || ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        className="input w-32"
                      />
                    </div>
                  </div>
                )
              })}

              {students.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun apprenant dans cette classe</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Message d'aide */}
      {!selectedClass && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Comment ça marche ?</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Sélectionnez une classe parmi celles qui vous sont attribuées</li>
                <li>Choisissez la matière que vous enseignez dans cette classe</li>
                <li>Sélectionnez le type de note (Interrogation, Devoir ou Examen)</li>
                <li>Saisissez les notes pour chaque apprenant</li>
                <li>Enregistrez vos notes</li>
              </ol>
              <p className="text-sm text-blue-700 mt-3">
                💡 Les moyennes d'interrogations et la moyenne générale sont calculées automatiquement
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherClasses