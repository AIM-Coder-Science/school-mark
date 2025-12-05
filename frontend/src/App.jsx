import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import StudentDashboard from './pages/student/Dashboard'
import StudentReportCard from './pages/student/ReportCard'
import StudentNews from './pages/student/News'

import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherClasses from './pages/teacher/Classes'
import TeacherAppreciation from './pages/teacher/Appreciation'
import TeacherNews from './pages/teacher/News'

import AdminDashboard from './pages/admin/Dashboard'
import AdminTeachers from './pages/admin/Teachers'
import AdminStudents from './pages/admin/Students'
import AdminClasses from './pages/admin/Classes'
import AdminSubjects from './pages/admin/Subjects'
import AdminNews from './pages/admin/News'
import AdminBulletins from './pages/admin/Bulletins'

import Layout from './components/Layout'
import Unauthorized from './pages/Unauthorized'

function App() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Routes publiques */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
        />
        
        {/* Routes protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Redirection selon le rôle */}
          <Route 
            index 
            element={
              user?.role 
                ? <Navigate to={`/${user.role}/dashboard`} replace /> 
                : <Navigate to="/login" replace /> 
            } 
          />
          
          {/* ============== ROUTES ÉTUDIANT ============== */}
          <Route path="student/dashboard" element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="student/report-card" element={
            <ProtectedRoute requiredRole="student">
              <StudentReportCard />
            </ProtectedRoute>
          } />

          <Route path="student/news" element={
            <ProtectedRoute requiredRole="student">
              <StudentNews />
            </ProtectedRoute>
          } />
          
          {/* ============== ROUTES ENSEIGNANT ============== */}
          <Route path="teacher/dashboard" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="teacher/classes" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherClasses />
            </ProtectedRoute>
          } />

          <Route path="teacher/appreciation" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherAppreciation />
            </ProtectedRoute>
          } />

          <Route path="teacher/news" element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherNews />
            </ProtectedRoute>
          } />

          {/* ============== ROUTES ADMIN ============== */}
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

          <Route path="admin/bulletins" element={
            <ProtectedRoute requiredRole="admin">
              <AdminBulletins />
            </ProtectedRoute>
          } />
        </Route>

        {/* Route non autorisée */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Route 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App