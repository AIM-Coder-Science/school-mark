import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  Bell,
  GraduationCap
} from 'lucide-react'

const Sidebar = () => {
  const { isAdmin, isTeacher, isStudent } = useAuth()

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/admin/teachers', icon: Users, label: 'Enseignants' },
    { to: '/admin/students', icon: GraduationCap, label: 'Étudiants' },
    { to: '/admin/classes', icon: BookOpen, label: 'Classes' },
    { to: '/admin/subjects', icon: FileText, label: 'Matières' },
    { to: '/admin/news', icon: Bell, label: 'Actualités' },
  ]

  const teacherLinks = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/teacher/classes', icon: BookOpen, label: 'Mes classes' },
  { to: '/teacher/news', icon: Bell, label: 'Actualités' }, // CHANGÉ
  ]

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/student/report-card', icon: FileText, label: 'Bulletin' },
    { to: '/student/news', icon: Bell, label: 'Actualités' },
  ]

  const links = isAdmin ? adminLinks : isTeacher ? teacherLinks : studentLinks

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar