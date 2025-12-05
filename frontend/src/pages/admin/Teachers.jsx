import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import { Plus, Users, Mail, Phone, BookOpen, Loader, Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react'

const AdminTeachers = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    specialty: '',
    phone: ''
  })

  const queryClient = useQueryClient()

  const { data: teachersData, isLoading } = useQuery(
    'adminTeachers',
    () => adminAPI.getAllTeachers(),
    { refetchOnWindowFocus: false }
  )

  const createTeacherMutation = useMutation(
    (data) => adminAPI.createTeacher(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
        setShowForm(false)
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          specialty: '',
          phone: ''
        })
      }
    }
  )

  const deleteTeacherMutation = useMutation(
    (id) => adminAPI.deleteTeacher(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
      }
    }
  )

  const toggleStatusMutation = useMutation(
    ({ userId, is_active }) => adminAPI.toggleUserStatus(userId, { is_active }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createTeacherMutation.mutate(formData)
  }

  const handleDeleteTeacher = (teacherId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      deleteTeacherMutation.mutate(teacherId)
    }
  }

  const handleToggleStatus = (teacher) => {
    const newStatus = !teacher.User.is_active
    toggleStatusMutation.mutate({ 
      userId: teacher.User.id, 
      is_active: newStatus 
    })
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Enseignants</h1>
          <p className="text-gray-600">
            {teachers.length} enseignant(s) au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un enseignant</span>
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvel enseignant
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  className="input mt-1"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="input mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  className="input mt-1"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Spécialité
                </label>
                <input
                  type="text"
                  className="input mt-1"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  type="tel"
                  className="input mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createTeacherMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createTeacherMutation.isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Créer l'enseignant</span>
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

      {/* Liste des enseignants */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Liste des enseignants
        </h2>
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {teacher.first_name} {teacher.last_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{teacher.User?.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                    {teacher.specialty && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{teacher.specialty}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleStatus(teacher)}
                  className={`p-2 rounded-lg transition-colors ${
                    teacher.User?.is_active 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={teacher.User?.is_active ? 'Désactiver' : 'Activer'}
                >
                  {teacher.User?.is_active ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>

                <button 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  disabled={deleteTeacherMutation.isLoading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {teachers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun enseignant enregistré</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminTeachers