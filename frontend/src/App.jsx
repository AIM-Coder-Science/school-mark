import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import StudentDashboard from './pages/student/Dashboard'
import TeacherDashboard from './pages/teacher/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTeachers from './pages/admin/Teachers'
import AdminStudents from './pages/admin/Students'
import AdminClasses from './pages/admin/Classes'
import AdminSubjects from './pages/admin/Subjects'
import AdminNews from './pages/admin/News'
import Layout from './components/Layout'
import Unauthorized from './pages/Unauthorized'
import StudentNews from './pages/student/News'
import TeacherNews from './pages/teacher/News'

function App() {
  const { isAuthenticated, user, loading } = useAuth() // 🛑 Ajout de 'loading' pour plus de robustesse

  // Afficher un écran de chargement global pendant la vérification initiale du token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Chargement de l'application...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Routes publiques - SEULEMENT login */}
        <Route 
          path="/login" 
          element={
            // Si authentifié, rediriger vers la racine (qui gérera la redirection par rôle)
            !isAuthenticated ? <Login /> : <Navigate to="/" replace />
          } 
        />
        
        {/* Routes protégées */}
        <Route path="/" element={
          // Le ProtectedRoute vérifie si l'utilisateur est authentifié
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Redirection selon le rôle (Route index) */}
          <Route 
            index 
            element={
              // 🛑 CORRECTION: S'assurer que le rôle est défini avant de rediriger
              user?.role 
                ? <Navigate to={`/${user.role}/dashboard`} replace /> 
                // Optionnel: si l'utilisateur est authentifié mais le rôle n'est pas encore là (très rare après la correction), on affiche un chargement
                : isAuthenticated 
                  ? <div className="p-4 text-center">Préparation du tableau de bord...</div> 
                  : <Navigate to="/login" replace /> 
            } 
          />
          
          {/* Routes étudiant */}
          <Route path="student/dashboard" element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="teacher/news" element={
            <ProtectedRoute requiredRole="student">
              <StudentNews />
            </ProtectedRoute>
            } />
          
          {/* Routes enseignant */}
          <Route path="teacher/dashboard" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="teacher/news" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherNews />
            </ProtectedRoute>
            } />

          {/* Routes admin */}
          <Route path="admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/teachers" element={
            <ProtectedRoute requiredRole="admin">
              <AdminTeachers />
            </ProtectedRoute>
          } />
          <Route path="admin/students" element={
            <ProtectedRoute requiredRole="admin">
              <AdminStudents />
            </ProtectedRoute>
          } />
          <Route path="admin/classes" element={
            <ProtectedRoute requiredRole="admin">
              <AdminClasses />
            </ProtectedRoute>
          } />
          <Route path="admin/subjects" element={
            <ProtectedRoute requiredRole="admin">
              <AdminSubjects />
            </ProtectedRoute>
          } />
          <Route path="admin/news" element={
            <ProtectedRoute requiredRole="admin">
              <AdminNews />
            </ProtectedRoute>
          } />
        </Route>

        {/* Route non autorisée */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Route 404 (redirige vers la racine) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App