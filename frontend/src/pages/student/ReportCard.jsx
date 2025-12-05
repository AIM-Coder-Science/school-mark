import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { studentAPI } from '../../services/api'
import { FileText, Download, Calendar, Award, TrendingUp, AlertCircle } from 'lucide-react'

const StudentReportCard = () => {
  const [selectedSemester, setSelectedSemester] = useState('1')

  const { data: reportCardData, isLoading, error } = useQuery(
    ['studentReportCard', selectedSemester],
    () => studentAPI.getReportCard(selectedSemester),
    { 
      refetchOnWindowFocus: false,
      enabled: !!selectedSemester
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du bulletin...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">Impossible de charger votre bulletin.</p>
        </div>
      </div>
    )
  }

  const reportCard = reportCardData?.data

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Bulletin</h1>
          <p className="text-gray-600">Consultez vos notes et moyennes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="input"
          >
            <option value="1">Semestre 1</option>
            <option value="2">Semestre 2</option>
          </select>
          
          <button className="btn btn-primary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Télécharger PDF</span>
          </button>
        </div>
      </div>

      {/* Informations générales */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Classe</p>
              <p className="text-lg font-semibold text-gray-900">
                {reportCard?.student?.Class?.name || 'Non assigné'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Moyenne générale</p>
              <p className="text-lg font-semibold text-gray-900">
                {reportCard?.generalAverage?.toFixed(2) || '0.00'}/20
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rang</p>
              <p className="text-lg font-semibold text-gray-900">
                {reportCard?.rank || '-'} / {reportCard?.totalStudents || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des notes */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Détail des notes - Semestre {selectedSemester}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matière
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coeff
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interros
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devoir
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Examen
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Moyenne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appréciation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportCard?.grades?.map((grade, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {grade.subject.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
                      {grade.subject.coefficient}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
                      {grade.interroAverage?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
                      {grade.devoirGrade?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
                      {grade.examenGrade?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-semibold ${
                      grade.totalAverage >= 10 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {grade.totalAverage?.toFixed(2) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 italic">
                      {grade.appreciation || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!reportCard?.grades || reportCard.grades.length === 0) && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune note disponible pour ce semestre</p>
          </div>
        )}
      </div>

      {/* Appréciation générale */}
      {reportCard?.generalAppreciation && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appréciation du professeur principal
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 italic">
              "{reportCard.generalAppreciation}"
            </p>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>
                {reportCard.mainTeacher?.first_name} {reportCard.mainTeacher?.last_name}
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(reportCard.appreciationDate).toLocaleDateString('fr-FR')}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Signature */}
      {reportCard?.isSigned && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bulletin signé par</p>
              <p className="text-lg font-semibold text-gray-900">
                {reportCard.signedBy}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <Award className="h-5 w-5" />
              <span className="text-sm font-medium">Validé</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentReportCard