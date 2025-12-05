import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import { Plus, FileText, Hash, Loader } from 'lucide-react'

const AdminSubjects = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    coefficient: 1,
    description: ''
  })

  const queryClient = useQueryClient()

  const { data: subjectsData, isLoading } = useQuery(
    'adminSubjects',
    () => adminAPI.getAllSubjects(),
    { refetchOnWindowFocus: false }
  )

  const createSubjectMutation = useMutation(
    (data) => adminAPI.createSubject(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSubjects')
        setShowForm(false)
        setFormData({
          name: '',
          coefficient: 1,
          description: ''
        })
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createSubjectMutation.mutate(formData)
  }

  const subjects = subjectsData?.data?.subjects || []

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Matières</h1>
          <p className="text-gray-600">
            {subjects.length} matière(s) au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une matière</span>
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvelle matière
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom de la matière
              </label>
              <input
                type="text"
                required
                className="input mt-1"
                placeholder="Ex: Mathématiques"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Coefficient
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  required
                  className="input mt-1"
                  value={formData.coefficient}
                  onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows={3}
                className="input mt-1"
                placeholder="Description de la matière (optionnel)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createSubjectMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createSubjectMutation.isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Créer la matière</span>
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

      {/* Liste des matières */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Liste des matières
        </h2>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {subject.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Hash className="h-4 w-4" />
                      <span>Coefficient: {subject.coefficient}</span>
                    </div>
                    {subject.description && (
                      <span className="max-w-md truncate">
                        {subject.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </div>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune matière créée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSubjects