import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Home } from 'lucide-react'

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Accès non autorisé</h1>
        <p className="mt-2 text-gray-600">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized