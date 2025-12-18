import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Loader from './components/common/Loader';

// Layouts
const Layout = lazy(() => import('./components/layout/Layout'));

// Auth Pages
const Login = lazy(() => import('./components/auth/Login'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const TeachersList = lazy(() => import('./pages/Admin/Teachers/List'));
const CreateTeacher = lazy(() => import('./pages/Admin/Teachers/Create'));
const TeacherDetail = lazy(() => import ('./pages/Admin/Teachers/Detail'));
const EditTeacher = lazy(() => import ('./pages/Admin/Teachers/Edit'));
const StudentsList = lazy(() => import('./pages/Admin/Students/List'));
const CreateStudent = lazy(() => import('./pages/Admin/Students/Create'));

// Admin Classes
const ClassesList = lazy(() => import('./pages/Admin/Classes/List'));
const CreateClass = lazy(() => import('./pages/Admin/Classes/Create'));
const ClassDetail = lazy(() => import('./pages/Admin/Classes/Detail'));
const EditClass = lazy(() => import('./pages/Admin/Classes/Edit'));

// Admin Subjects (Modifié pour inclure Detail et Edit)
const SubjectsList = lazy(() => import('./pages/Admin/Subjects/List'));
const CreateSubject = lazy(() => import('./pages/Admin/Subjects/Create'));
const SubjectDetail = lazy(() => import('./pages/Admin/Subjects/Detail'));
const EditSubject = lazy(() => import('./pages/Admin/Subjects/Edit'));

const Publications = lazy(() => import('./pages/Admin/Publications'));
const AdminStats = lazy(() => import('./pages/Admin/Stats'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/Teacher/Dashboard'));
const TeacherClasses = lazy(() => import('./pages/Teacher/Classes'));
const TeacherGrades = lazy(() => import('./pages/Teacher/Grades'));
const PrincipalDashboard = lazy(() => import('./pages/Teacher/Principal/Dashboard'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/Student/Dashboard'));
const StudentGrades = lazy(() => import('./pages/Student/Grades'));
const StudentBulletins = lazy(() => import('./pages/Student/Bulletins'));
const StudentRanking = lazy(() => import('./pages/Student/Ranking'));

// Common Pages
const Profile = lazy(() => import('./pages/Common/Profile'));
const Settings = lazy(() => import('./pages/Common/Settings'));
const NotFound = lazy(() => import('./pages/Common/NotFound'));

const AppContent = () => {
  const { isAuthenticated, user, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <Loader fullScreen />;
  }

  return (
    <Suspense fallback={<Loader fullScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          {/* Redirect based on role */}
          <Route index element={
            user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> :
            user?.role === 'teacher' ? <Navigate to="/teacher/dashboard" /> :
            user?.role === 'student' ? <Navigate to="/student/dashboard" /> :
            <Navigate to="/login" />
          } />
          
          {/* Common Routes */}
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="admin">
            <Route path="dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            
            <Route path="teachers">
              <Route index element={<ProtectedRoute role="admin"><TeachersList /></ProtectedRoute>} />
              <Route path="new" element={<ProtectedRoute role="admin"><CreateTeacher /></ProtectedRoute>} />
              <Route path=":teacherId" element={<ProtectedRoute role="admin"><TeacherDetail /></ProtectedRoute>} />
              <Route path="edit/:teacherId" element={<ProtectedRoute role="admin"><EditTeacher /></ProtectedRoute>} />
            </Route>

            <Route path="students">
              <Route index element={<ProtectedRoute role="admin"><StudentsList /></ProtectedRoute>} />
              <Route path="new" element={<ProtectedRoute role="admin"><CreateStudent /></ProtectedRoute>} />
            </Route>

            <Route path="classes">
              <Route index element={<ProtectedRoute role="admin"><ClassesList /></ProtectedRoute>} />
              <Route path="new" element={<ProtectedRoute role="admin"><CreateClass /></ProtectedRoute>} />
              <Route path=":classId" element={<ProtectedRoute role="admin"><ClassDetail /></ProtectedRoute>} />
              <Route path="edit/:classId" element={<ProtectedRoute role="admin"><EditClass /></ProtectedRoute>} />
            </Route>

            {/* --- SECTION SUBJECTS CORRIGÉE --- */}
            <Route path="subjects">
              <Route index element={<ProtectedRoute role="admin"><SubjectsList /></ProtectedRoute>} />
              <Route path="new" element={<ProtectedRoute role="admin"><CreateSubject /></ProtectedRoute>} />
              <Route path=":subjectId" element={<ProtectedRoute role="admin"><SubjectDetail /></ProtectedRoute>} />
              <Route path="edit/:subjectId" element={<ProtectedRoute role="admin"><EditSubject /></ProtectedRoute>} />
            </Route>
            {/* ---------------------------------- */}

            <Route path="publications" element={<ProtectedRoute role="admin"><Publications /></ProtectedRoute>} />
            <Route path="stats" element={<ProtectedRoute role="admin"><AdminStats /></ProtectedRoute>} />
          </Route>
          
          {/* Teacher Routes */}
          <Route path="teacher">
            <Route path="dashboard" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute role="teacher"><TeacherClasses /></ProtectedRoute>} />
            <Route path="grades" element={<ProtectedRoute role="teacher"><TeacherGrades /></ProtectedRoute>} />
            <Route path="principal">
              <Route path="dashboard" element={<ProtectedRoute role="teacher"><PrincipalDashboard /></ProtectedRoute>} />
            </Route>
          </Route>
          
          {/* Student Routes */}
          <Route path="student">
            <Route path="dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="grades" element={<ProtectedRoute role="student"><StudentGrades /></ProtectedRoute>} />
            <Route path="bulletins" element={<ProtectedRoute role="student"><StudentBulletins /></ProtectedRoute>} />
            <Route path="ranking" element={<ProtectedRoute role="student"><StudentRanking /></ProtectedRoute>} />
            <Route path="news" element={<ProtectedRoute role="student"><div>Actualités</div></ProtectedRoute>} />
          </Route>
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
