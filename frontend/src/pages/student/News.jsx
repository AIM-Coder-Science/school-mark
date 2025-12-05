// frontend/src/pages/student/News.jsx
import React from 'react'
import NewsList from '../../components/NewsList'

const StudentNews = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Actualités</h1>
      <NewsList />
    </div>
  )
}

export default StudentNews