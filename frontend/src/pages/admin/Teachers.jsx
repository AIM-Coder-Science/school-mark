// frontend/src/pages/admin/Teachers.jsx
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../../services/api'
import { 
  Plus, Users, Mail, Phone, BookOpen, Loader, Trash2, Edit, ToggleLeft, ToggleRight,
  X, Check, AlertCircle, Building, GraduationCap, Shield, Search, Filter, Download,
  Eye, EyeOff, Key, UserPlus, Calendar, Award, Briefcase, MapPin, Star
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const AdminTeachers = () => {
  // États
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState('all') // 'all', 'active', 'inactive'

  // Données du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialties: [], // Array d'IDs de matières
  })

  const [assignData, setAssignData] = useState({
    class_id: '',
    subject_id: '',
    is_main_teacher: false
  })

  const queryClient = useQueryClient()

  // Récupération des données
  const { data: teachersData, isLoading: loadingTeachers } = useQuery(
    'adminTeachers',
    () => adminAPI.getAllTeachers(),
    { refetchOnWindowFocus: false }
  )

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery(
    'adminSubjects',
    () => adminAPI.getAllSubjects(),
    { refetchOnWindowFocus: false }
  )

  const { data: classesData, isLoading: loadingClasses } = useQuery(
    'adminClasses',
    () => adminAPI.getAllClasses(),
    { refetchOnWindowFocus: false }
  )

  // Mutations
  const createTeacherMutation = useMutation(
    (data) => adminAPI.createTeacher(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
        setShowCreateModal(false)
        resetForm()
        toast.success('Enseignant créé avec succès')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création')
      }
    }
  )

  const deleteTeacherMutation = useMutation(
    (id) => adminAPI.deleteTeacher(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
        toast.success('Enseignant supprimé avec succès')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    }
  )

  const toggleStatusMutation = useMutation(
    ({ userId, is_active }) => adminAPI.toggleUserStatus(userId, { is_active }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
        toast.success('Statut modifié avec succès')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors du changement de statut')
      }
    }
  )

  const assignTeacherMutation = useMutation(
    (data) => adminAPI.assignTeacher(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminTeachers')
        setShowAssignModal(false)
        setAssignData({ class_id: '', subject_id: '', is_main_teacher: false })
        toast.success('Enseignant assigné avec succès')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'assignation')
      }
    }
  )

  // Initialiser les données
  const teachers = teachersData?.teachers || teachersData?.data?.teachers || []
  const subjects = subjectsData?.subjects || subjectsData?.data?.subjects || []
  const classes = classesData?.classes || classesData?.data?.classes || []

  // Filtrage et recherche
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialty?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      filterActive === 'all' || 
      (filterActive === 'active' && teacher.User?.is_active) ||
      (filterActive === 'inactive' && !teacher.User?.is_active)

    return matchesSearch && matchesFilter
  })

  // Fonctions utilitaires
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      specialties: []
    })
  }

  const handleSpecialtyToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(subjectId)
        ? prev.specialties.filter(id => id !== subjectId)
        : [...prev.specialties, subjectId]
    }))
  }

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : 'Inconnu'
  }

  const getClassName = (classId) => {
    const classItem = classes.find(c => c.id === classId)
    return classItem ? classItem.name : 'Inconnue'
  }

  const checkMainTeacherExists = (classId) => {
    // À implémenter : vérifier dans la table TeacherClassSubject
    // si cette classe a déjà un professeur principal
    return false
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    
    // Valider les spécialités
    if (formData.specialties.length === 0) {
      toast.error('Veuillez sélectionner au moins une spécialité')
      return
    }

    // Créer une chaîne de spécialités
    const specialtyString = formData.specialties
      .map(id => getSubjectName(id))
      .join(', ')

    const payload = {
      ...formData,
      specialty: specialtyString
    }

    createTeacherMutation.mutate(payload)
  }

  const handleAssignSubmit = (e) => {
    e.preventDefault()
    
    if (!assignData.class_id || !assignData.subject_id) {
      toast.error('Veuillez sélectionner une classe et une matière')
      return
    }

    // Vérifier le professeur principal si nécessaire
    if (assignData.is_main_teacher && checkMainTeacherExists(assignData.class_id)) {
      toast.error('Cette classe a déjà un professeur principal')
      return
    }

    const payload = {
      teacher_id: selectedTeacher.id,
      ...assignData
    }

    assignTeacherMutation.mutate(payload)
  }

  const handleDeleteTeacher = (teacher) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${teacher.first_name} ${teacher.last_name} ? Cette action est irréversible.`)) {
      deleteTeacherMutation.mutate(teacher.id)
    }
  }

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setFormData({
      email: teacher.email || '',
      password: '',
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      phone: teacher.phone || '',
      specialties: teacher.specialty ? teacher.specialty.split(', ').map(name => {
        const subject = subjects.find(s => s.name === name.trim())
        return subject ? subject.id : null
      }).filter(id => id !== null) : []
    })
    setShowEditModal(true)
  }

  const handleAssignTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setShowAssignModal(true)
  }

  const handleToggleStatus = (teacher) => {
    const newStatus = !teacher.User?.is_active
    const action = newStatus ? 'activer' : 'désactiver'
    
    if (window.confirm(`Voulez-vous ${action} ${teacher.first_name} ${teacher.last_name} ?`)) {
      toggleStatusMutation.mutate({ 
        userId: teacher.User.id, 
        is_active: newStatus 
      })
    }
  }

  // Statistiques
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.User?.is_active).length,
    inactive: teachers.filter(t => !t.User?.is_active).length,
    withPhone: teachers.filter(t => t.phone).length,
    withSpecialty: teachers.filter(t => t.specialty).length
  }

  if (loadingTeachers) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des enseignants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Enseignants</h1>
              <p className="text-gray-600 mt-2">
                Administration complète du corps enseignant
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Nouvel enseignant
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <Download className="h-5 w-5 mr-2 text-gray-600" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactifs</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="text-3xl font-bold text-purple-600">{stats.withPhone}</p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Spécialités</p>
                <p className="text-3xl font-bold text-orange-600">{stats.withSpecialty}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher un enseignant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setFilterActive('all')}
                  className={`px-4 py-2 ${filterActive === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterActive('active')}
                  className={`px-4 py-2 ${filterActive === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Actifs
                </button>
                <button
                  onClick={() => setFilterActive('inactive')}
                  className={`px-4 py-2 ${filterActive === 'inactive' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}
                >
                  Inactifs
                </button>
              </div>
              <Filter className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Liste des enseignants */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enseignant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialités
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {teacher.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.email}</div>
                        {teacher.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-1" />
                            {teacher.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.specialty ? (
                            teacher.specialty.split(', ').map((spec, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                <BookOpen className="h-3 w-3 mr-1" />
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Aucune spécialité</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          teacher.User?.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {teacher.User?.is_active ? (
                            <>
                              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                              Actif
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                              Inactif
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
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
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleEditTeacher(teacher)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleAssignTeacher(teacher)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Assigner à une classe"
                          >
                            <Building className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteTeacher(teacher)}
                            disabled={deleteTeacherMutation.isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'Aucun enseignant trouvé' : 'Aucun enseignant'}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm
                          ? 'Aucun résultat ne correspond à votre recherche'
                          : 'Commencez par ajouter un nouvel enseignant'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Ajouter le premier enseignant
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredTeachers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de <span className="font-medium">1</span> à <span className="font-medium">{filteredTeachers.length}</span> sur{' '}
              <span className="font-medium">{teachers.length}</span> enseignants
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Précédent
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Nouvel Enseignant</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Sélection des spécialités */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spécialités *
                    </label>
                    {loadingSubjects ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {subjects.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => handleSpecialtyToggle(subject.id)}
                            className={`p-3 border rounded-lg flex items-center justify-between transition-colors ${
                              formData.specialties.includes(subject.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-left">
                              <div className="font-medium text-gray-900">{subject.name}</div>
                              <div className="text-xs text-gray-500">Coefficient: {subject.coefficient}</div>
                            </div>
                            {formData.specialties.includes(subject.id) && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {formData.specialties.length === 0 && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Veuillez sélectionner au moins une spécialité
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false)
                        resetForm()
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createTeacherMutation.isLoading || formData.specialties.length === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {createTeacherMutation.isLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Création...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Créer l'enseignant
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Assigner {selectedTeacher.first_name} {selectedTeacher.last_name}
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Classe *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={assignData.class_id}
                      onChange={(e) => setAssignData({ ...assignData, class_id: e.target.value })}
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.name} - {classItem.level} ({classItem.studentCount || 0} étudiants)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matière *
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={assignData.subject_id}
                      onChange={(e) => setAssignData({ ...assignData, subject_id: e.target.value })}
                    >
                      <option value="">Sélectionner une matière</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} (Coefficient: {subject.coefficient})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_main_teacher"
                      checked={assignData.is_main_teacher}
                      onChange={(e) => setAssignData({ ...assignData, is_main_teacher: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_main_teacher" className="ml-2 text-sm text-gray-700">
                      Professeur principal de cette classe
                    </label>
                  </div>

                  {assignData.is_main_teacher && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Attention :</p>
                          <p>Une classe ne peut avoir qu'un seul professeur principal.</p>
                          <p>Cette action remplacera le professeur principal actuel si existant.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={assignTeacherMutation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {assignTeacherMutation.isLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Assignation...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Assigner
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTeachers