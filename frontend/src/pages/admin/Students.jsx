import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import { Plus, GraduationCap, Mail, Phone, Calendar, Loader, Trash2, Edit, ToggleLeft, ToggleRight, User } from 'lucide-react'

const AdminStudents = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    matricule: '',
    class_id: '',
    phone: '',
    birth_date: ''
  })

  const queryClient = useQueryClient()

  const { data: studentsData, isLoading } = useQuery(
    'adminStudents',
    () => adminAPI.getAllStudents(),
    { refetchOnWindowFocus: false }
  )

  const { data: classesData } = useQuery(
    'adminClasses',
    () => adminAPI.getAllClasses(),
    { refetchOnWindowFocus: false }
  )

  const createStudentMutation = useMutation(
    (data) => adminAPI.createStudent(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminStudents')
        setShowForm(false)
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          matricule: '',
          class_id: '',
          phone: '',
          birth_date: ''
        })
      }
    }
  )

  const deleteStudentMutation = useMutation(
    (id) => adminAPI.deleteStudent(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminStudents')
      }
    }
  )

  const toggleStatusMutation = useMutation(
    ({ userId, is_active }) => adminAPI.toggleUserStatus(userId, { is_active }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminStudents')
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createStudentMutation.mutate(formData)
  }

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      deleteStudentMutation.mutate(studentId)
    }
  }

  const handleToggleStatus = (student) => {
    const newStatus = !student.User.is_active
    toggleStatusMutation.mutate({ 
      userId: student.User.id, 
      is_active: newStatus 
    })
  }

  const students = studentsData?.data?.students || []
  const classes = classesData?.data?.classes || []

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Étudiants</h1>
          <p className="text-gray-600">
            {students.length} étudiant(s) au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un étudiant</span>
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvel étudiant
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
                  Matricule
                </label>
                <input
                  type="text"
                  className="input mt-1"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  placeholder="Généré automatiquement si vide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Classe
                </label>
                <select
                  className="input mt-1"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date de naissance
                </label>
                <input
                  type="date"
                  className="input mt-1"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createStudentMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createStudentMutation.isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Créer l'étudiant</span>
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

      {/* Liste des étudiants */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Liste des étudiants
        </h2>
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      student.User?.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.User?.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{student.User?.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{student.matricule}</span>
                    </div>
                    {student.Class && (
                      <div className="flex items-center space-x-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>Classe: {student.Class.name}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {student.birth_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(student.birth_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleStatus(student)}
                  className={`p-2 rounded-lg transition-colors ${
                    student.User?.is_active 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={student.User?.is_active ? 'Désactiver' : 'Activer'}
                >
                  {student.User?.is_active ? (
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
                  onClick={() => handleDeleteStudent(student.id)}
                  disabled={deleteStudentMutation.isLoading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {students.length === 0 && (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun étudiant enregistré</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier étudiant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total étudiants</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Étudiants actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.User?.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avec classe</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.Class).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStudents