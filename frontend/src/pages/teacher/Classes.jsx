import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { teacherAPI, gradeAPI } from '../../services/api'
import { BookOpen, Users, Plus, Save, Loader, AlertCircle, Calculator } from 'lucide-react'

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

  // Récupérer TOUTES les notes pour calculer les moyennes
  const { data: allGradesData } = useQuery(
    ['allClassGrades', selectedClass, selectedSubject],
    () => gradeAPI.getClassGrades(selectedClass, { 
      subject_id: selectedSubject 
    }),
    { 
      enabled: !!selectedClass && !!selectedSubject,
      refetchOnWindowFocus: false 
    }
  )

  // Récupérer les notes existantes pour le type sélectionné
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
        // Invalider toutes les queries concernées
        queryClient.invalidateQueries(['classGrades', selectedClass])
        queryClient.invalidateQueries(['allClassGrades', selectedClass, selectedSubject])
        setGrades({})
        alert('Notes enregistrées avec succès!')
      },
      onError: (error) => {
        alert('Erreur lors de l\'enregistrement: ' + (error.response?.data?.message || error.message))
      }
    }
  )

  const handleGradeChange = (studentId, value) => {
    const numericValue = parseFloat(value)
    if (numericValue < 0 || numericValue > 20) {
      alert('La note doit être comprise entre 0 et 20')
      return
    }
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
      grade: parseFloat(grade),
      semester: 1, // Ajout du semestre
      coefficient: 1 // Coefficient par défaut
    }))

    if (gradesArray.length === 0) {
      alert('Veuillez saisir au moins une note')
      return
    }

    createGradeMutation.mutate({ grades: gradesArray })
  }

  // Fonction pour calculer la moyenne des interrogations (DU CODE 1)
  const calculateInterroAverage = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return 0
    
    // Filtrer uniquement les interrogations
    const interros = studentGrades.filter(g => g.grade_type === 'interro')
    if (interros.length === 0) return 0
    
    // Calculer la moyenne pondérée par les coefficients
    const totalWeighted = interros.reduce((sum, g) => sum + (g.grade * (g.coefficient || 1)), 0)
    const totalCoefficient = interros.reduce((sum, g) => sum + (g.coefficient || 1), 0)
    
    return totalCoefficient > 0 ? (totalWeighted / totalCoefficient).toFixed(2) : 0
  }

  // Fonction pour obtenir la dernière note (DU CODE 1)
  const getLastGrade = (studentGrades, gradeType) => {
    if (!studentGrades || studentGrades.length === 0) return null
    
    // Filtrer par type de note si spécifié
    const filteredGrades = gradeType 
      ? studentGrades.filter(g => g.grade_type === gradeType)
      : studentGrades
    
    // Trier par date décroissante et prendre la plus récente
    const sorted = [...filteredGrades].sort((a, b) => 
      new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
    )
    
    return sorted[0] || null
  }

  // Extraire les données (IMPACT IMPORTANT)
  const assignments = classesData?.data?.assignments || []
  const subjects = subjectsData?.data?.subjects || []
  
  // Ici l'impact des extractions de données :
  // - `allGradesData` contient TOUTES les notes pour calculer les moyennes
  // - `existingGrades` contient seulement les notes du type sélectionné pour l'affichage
  const allStudents = allGradesData?.data?.students || []
  const currentTypeStudents = existingGrades?.data?.students || []
  
  // Fusionner les données : utiliser allStudents comme base et ajouter les notes spécifiques
  const students = allStudents.map(student => {
    // Trouver les données du même étudiant dans currentTypeStudents
    const currentTypeStudent = currentTypeStudents.find(s => s.id === student.id)
    
    // Récupérer toutes les notes de cet étudiant
    const allStudentGrades = student.grades || []
    
    // Calculer la moyenne des interrogations
    const interroAverage = calculateInterroAverage(allStudentGrades)
    
    // Obtenir la dernière note du type actuel
    const lastGradeOfType = getLastGrade(allStudentGrades, gradeType)
    
    return {
      ...student,
      // Ajouter les données calculées
      interro_average: parseFloat(interroAverage),
      last_grade: lastGradeOfType,
      // Garder la note existante du type actuel pour l'input
      existing_current_grade: currentTypeStudent?.grades?.[0]?.grade || null
    }
  })

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
                    {subject.name} (Coeff: {subject.coefficient})
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Liste des apprenants
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {students.length} apprenant(s) dans cette classe
              </p>
            </div>
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
            <div className="space-y-4">
              {/* En-tête du tableau */}
              <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700">Apprenant</div>
                <div className="font-medium text-gray-700 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Calculator className="h-4 w-4" />
                    <span>Moy. Interros</span>
                  </div>
                </div>
                <div className="font-medium text-gray-700 text-center">Dernière Note</div>
                <div className="font-medium text-gray-700 text-center">Note Actuelle</div>
                <div className="font-medium text-gray-700 text-center">Nouvelle Note</div>
              </div>

              {/* Liste des étudiants */}
              {students.map((student) => {
                const existingGrade = student.existing_current_grade
                const lastGrade = student.last_grade
                
                return (
                  <div key={student.id} className="md:grid md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Informations de l'apprenant */}
                    <div className="flex items-center space-x-3 mb-4 md:mb-0">
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

                    {/* Moyenne des interrogations */}
                    <div className="flex md:items-center justify-between md:justify-center mb-3 md:mb-0">
                      <span className="text-sm text-gray-600 md:hidden">Moy. Interros:</span>
                      <div className={`px-3 py-1 rounded-full text-center ${
                        student.interro_average >= 10 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className="font-bold">{student.interro_average || '0.00'}</span>
                        <span className="text-xs ml-1">/20</span>
                      </div>
                    </div>

                    {/* Dernière note (type actuel) */}
                    <div className="flex md:items-center justify-between md:justify-center mb-3 md:mb-0">
                      <span className="text-sm text-gray-600 md:hidden">Dernière note:</span>
                      <span className="text-gray-700 font-medium">
                        {lastGrade ? `${lastGrade.grade}/20` : '-'}
                      </span>
                    </div>

                    {/* Note actuelle */}
                    <div className="flex md:items-center justify-between md:justify-center mb-4 md:mb-0">
                      <span className="text-sm text-gray-600 md:hidden">Note actuelle:</span>
                      <span className="text-gray-700 font-medium">
                        {existingGrade ? `${existingGrade}/20` : '-'}
                      </span>
                    </div>

                    {/* Saisie de nouvelle note */}
                    <div className="flex items-center justify-between md:justify-center">
                      <span className="text-sm text-gray-600 md:hidden">Nouvelle note:</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="0.00"
                        value={grades[student.id] || ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        className="input w-32 text-center"
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

              {/* Statistiques */}
              {Object.keys(grades).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Résumé des saisies</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600">Notes saisies</p>
                      <p className="text-lg font-bold text-blue-700">{Object.keys(grades).length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600">Moyenne saisie</p>
                      <p className="text-lg font-bold text-green-700">
                        {(() => {
                          const values = Object.values(grades).filter(v => v !== '')
                          if (values.length === 0) return '0.00'
                          const sum = values.reduce((acc, val) => acc + parseFloat(val), 0)
                          return (sum / values.length).toFixed(2)
                        })()}/20
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-600">Note min</p>
                      <p className="text-lg font-bold text-purple-700">
                        {(() => {
                          const values = Object.values(grades).filter(v => v !== '')
                          if (values.length === 0) return '-'
                          return Math.min(...values.map(v => parseFloat(v))).toFixed(2)
                        })()}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-xs text-orange-600">Note max</p>
                      <p className="text-lg font-bold text-orange-700">
                        {(() => {
                          const values = Object.values(grades).filter(v => v !== '')
                          if (values.length === 0) return '-'
                          return Math.max(...values.map(v => parseFloat(v))).toFixed(2)
                        })()}
                      </p>
                    </div>
                  </div>
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
                <li>Visualisez les moyennes d'interrogations existantes</li>
                <li>Saisissez les nouvelles notes pour chaque apprenant</li>
                <li>Enregistrez vos notes</li>
              </ol>
              <p className="text-sm text-blue-700 mt-3">
                💡 <strong>Moy. Interros</strong> : Moyenne pondérée des interrogations
                <br/>
                💡 <strong>Dernière note</strong> : Dernière note du type sélectionné
                <br/>
                💡 <strong>Note actuelle</strong> : Note existante du type actuel
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherClasses