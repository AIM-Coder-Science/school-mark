import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI, utilsAPI } from '../../services/api'
import { ClipboardCheck, Eye, CheckCircle, Calendar, Award, Loader, Download } from 'lucide-react'

const AdminBulletins = () => {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('1')
  const [viewingStudent, setViewingStudent] = useState(null)

  const queryClient = useQueryClient()

  // Récupérer toutes les classes
  const { data: classesData, isLoading: loadingClasses } = useQuery(
    'adminClasses',
    () => adminAPI.getAllClasses(),
    { refetchOnWindowFocus: false }
  )

  // Récupérer les étudiants de la classe sélectionnée
  const { data: studentsData, isLoading: loadingStudents } = useQuery(
    ['classStudents', selectedClass],
    () => adminAPI.getAllStudents({ class_id: selectedClass }),
    { 
      enabled: !!selectedClass,
      refetchOnWindowFocus: false 
    }
  )

  // Mutation pour signer un bulletin (à adapter selon ton API)
  const signBulletinMutation = useMutation(
    ({ studentId, semester }) => 
      utilsAPI.signBulletin(studentId, semester), // Tu devras créer cette fonction dans api.js
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classStudents', selectedClass])
        alert('Bulletin signé avec succès!')
      },
      onError: (error) => {
        alert('Erreur: ' + (error.response?.data?.message || error.message))
      }
    }
  )

  const classes = classesData?.data?.classes || []
  const students = studentsData?.data?.students || []

  const handleSignBulletin = (studentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir signer ce bulletin ?')) {
      signBulletinMutation.mutate({ studentId, semester: selectedSemester })
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Bulletins</h1>
        <p className="text-gray-600">Consultez et signez les bulletins des apprenants</p>
      </div>

      {/* Filtres */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner une classe
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Toutes les classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semestre
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="input"
            >
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des bulletins */}
      {selectedClass && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bulletins - Semestre {selectedSemester}
          </h2>

          {loadingStudents ? (
            <div className="text-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                // Tu devras adapter cette logique selon la structure de tes données
                const isSigned = student.bulletins?.some(
                  b => b.semester === selectedSemester && b.is_signed
                )

                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        isSigned ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isSigned ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <ClipboardCheck className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Matricule: {student.matricule} | Classe: {student.Class?.name}
                        </p>
                      </div>

                      <div className="text-right mr-4">
                        {isSigned ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Signé</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Non signé</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingStudent(student)}
                        className="btn btn-secondary text-sm flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Voir</span>
                      </button>

                      {!isSigned && (
                        <button
                          onClick={() => handleSignBulletin(student.id)}
                          disabled={signBulletinMutation.isLoading}
                          className="btn btn-primary text-sm flex items-center space-x-1"
                        >
                          {signBulletinMutation.isLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span>Signer</span>
                        </button>
                      )}

                      <button
                        className="btn btn-secondary text-sm flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                )
              })}

              {students.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun apprenant dans cette classe</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistiques */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total bulletins</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Signés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => 
                    s.bulletins?.some(b => b.semester === selectedSemester && b.is_signed)
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => 
                    !s.bulletins?.some(b => b.semester === selectedSemester && b.is_signed)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message d'aide */}
      {!selectedClass && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <ClipboardCheck className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Comment ça marche ?</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Sélectionnez une classe et un semestre</li>
                <li>Consultez les bulletins de chaque apprenant</li>
                <li>Vérifiez les notes et moyennes</li>
                <li>Signez les bulletins validés</li>
                <li>Téléchargez les bulletins au format PDF si nécessaire</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBulletins