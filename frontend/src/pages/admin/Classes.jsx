import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import { Plus, BookOpen, Users, Calendar, Loader } from 'lucide-react'

const AdminClasses = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    academic_year: '2023-2024',
    teacher_id: ''
  })

  const queryClient = useQueryClient()

  const { data: classesData, isLoading } = useQuery(
    'adminClasses',
    () => adminAPI.getAllClasses(),
    { refetchOnWindowFocus: false }
  )

  const { data: teachersData } = useQuery(
    'adminTeachers',
    () => adminAPI.getAllTeachers(),
    { refetchOnWindowFocus: false }
  )

  const createClassMutation = useMutation(
    (data) => adminAPI.createClass(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminClasses')
        setShowForm(false)
        setFormData({
          name: '',
          level: '',
          academic_year: '2023-2024',
          teacher_id: ''
        })
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createClassMutation.mutate(formData)
  }

  const classes = classesData?.data?.classes || []
  const teachers = teachersData?.data?.teachers || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Classes</h1>
          <p className="text-gray-600">
            {classes.length} classe(s) au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une classe</span>
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvelle classe
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom de la classe
                </label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  placeholder="Ex: Terminale A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Niveau
                </label>
                <select
                  required
                  className="input mt-1"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="">Sélectionner un niveau</option>
                  <option value="Seconde">Seconde</option>
                  <option value="Première">Première</option>
                  <option value="Terminale">Terminale</option>
                  <option value="6ème">6ème</option>
                  <option value="5ème">5ème</option>
                  <option value="4ème">4ème</option>
                  <option value="3ème">3ème</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Année académique
                </label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  placeholder="Ex: 2023-2024"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Professeur principal
                </label>
                <select
                  className="input mt-1"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                >
                  <option value="">Sélectionner un professeur</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createClassMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createClassMutation.isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Créer la classe</span>
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des classes */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Liste des classes
        </h2>
        <div className="space-y-4">
          {classes.map((classItem) => (
            <div key={classItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {classItem.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>Niveau: {classItem.level}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Année: {classItem.academic_year}</span>
                    </div>
                    {classItem.mainTeacher && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Prof principal: {classItem.mainTeacher.first_name} {classItem.mainTeacher.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </div>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune classe créée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminClasses