// frontend/src/components/NewsList.jsx
import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import api from '../services/api'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const NewsList = () => {
  const [news, setNews] = useState([])

  const { data, isLoading, error } = useQuery(
    'news',
    () => api.get('/news').then(res => res.data),
    {
      onSuccess: (data) => {
        if (data.success) {
          setNews(data.news || [])
        }
      }
    }
  )

  if (isLoading) return <div className="text-center py-8">Chargement des actualités...</div>
  if (error) return <div className="text-center py-8 text-red-600">Erreur: {error.message}</div>

  return (
    <div className="space-y-6">
      {news.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucune actualité disponible pour le moment.
        </div>
      ) : (
        news.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Publié par {item.author?.Teacher?.first_name || item.author?.Student?.first_name || 'Admin'} 
                  le {format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full">
                {item.target_roles?.includes('all') ? 'Tous' : 
                 item.target_roles?.join(', ')}
              </span>
            </div>
            <div className="text-gray-700 whitespace-pre-line">
              {item.content}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default NewsList