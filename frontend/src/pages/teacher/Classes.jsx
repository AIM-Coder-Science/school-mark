// frontend/src/pages/teacher/Classes.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { teacherAPI, gradeAPI, systemAPI } from '../../services/api'
import { 
  Users, Calculator, Save, Loader, AlertCircle, 
  Award, TrendingUp, FileText, CheckCircle, RefreshCw
} from 'lucide-react'

const TeacherClasses = () => {
  // selectedClass contient maintenant une clé composite: "classId-subjectId"
  const [selectedClass, setSelectedClass] = useState('') 
  const [selectedPeriod, setSelectedPeriod] = useState(1)
  const [grades, setGrades] = useState({})
  const [systemConfig, setSystemConfig] = useState({ type: 'semestre', maxInterros: 5, maxDevoirs: 3 })
  
  const queryClient = useQueryClient()

  // 1. Récupération Config
  useQuery('systemConfig', () => systemAPI.getConfig(), {
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data?.success) {
        setSystemConfig({
          type: data.data?.system_type || 'semestre',
          maxInterros: data.data?.max_interros || 5,
          maxDevoirs: data.data?.max_devoirs || 3
        })
      }
    }
  })

  // 2. Récupération Classes & Matières (Assignments)
  const { data: classesData, isLoading: loadingClasses, error: classesError } = useQuery(
    'teacherClassesWithSubjects',
    () => teacherAPI.getAssignedClasses(),
    { refetchOnWindowFocus: false }
  )

  // --- LOGIQUE DE TRAITEMENT ---

  // Traitement des classes pour le select (CORRECTION MAJEURE: Robustesse de l'accès aux données)
  const processedClasses = useMemo(() => {
    if (classesError) {
      console.error("Erreur de l'API de classes:", classesError);
      return [];
    }
    if (!classesData) {
      console.log("DEBUG CLASSES: classesData est null/undefined.");
      return [];
    }
    
    // Tente de récupérer la liste des assignations à partir des chemins les plus probables
    // 1. Accès direct (si API retourne { success: true, assignments: [...] })
    let list = classesData.assignments;
    
    // 2. Accès sous 'data' (si API retourne { success: true, data: { assignments: [...] } })
    if (!list && classesData.data) {
      list = classesData.data.assignments || classesData.data.classes;
    }
    
    // 3. Cas spécifique si l'endpoint getAssignedClasses a la même structure que getDashboard
    if (!list && classesData.dashboard) {
      list = classesData.dashboard.assignments;
    }

    if (!Array.isArray(list)) {
        console.log("DEBUG CLASSES: Liste de classes non trouvée ou n'est pas un tableau. Structure de la réponse:", classesData);
        return [];
    }

    console.log(`DEBUG CLASSES: ${list.length} assignations trouvées brutes. Traitement...`);
    
    // IMPORTANT: Filtrer et mapper pour utiliser les alias 'Class' et 'Subject' du backend (Sequelize)
    const validAssignments = list
        .filter(assignment => assignment.Class && assignment.Subject && assignment.Class.id && assignment.Subject.id);

    console.log(`DEBUG CLASSES: ${validAssignments.length} assignations valides (avec Class & Subject).`);
    
    // Si la liste est toujours vide ici, l'erreur vient du backend (les includes ont échoué)
    if (validAssignments.length === 0 && list.length > 0) {
        console.warn("ATTENTION: Les assignations existent, mais Class/Subject sont manquants ou incomplets. Vérifiez teacherController.js includes.");
    }

    return validAssignments.map(assignment => ({
        id: assignment.id, // ID de l'assignation
        class: assignment.Class, // L'objet Class
        subject: assignment.Subject, // L'objet Subject
        // Clé unique (Class ID - Subject ID) pour le state de sélection
        uniqueKey: `${assignment.Class.id}-${assignment.Subject.id}` 
    }));
  }, [classesData, classesError]);

  // Helper pour trouver l'objet d'assignation complet à partir de la clé unique
  const selectedAssignment = useMemo(() => 
    processedClasses.find(c => c.uniqueKey === selectedClass),
    [processedClasses, selectedClass]
  );
  
  // Extraire les IDs pour les appels API
  const classId = selectedAssignment?.class?.id;
  const subjectId = selectedAssignment?.subject?.id;

  // 3. Récupération Notes existantes (Utilise Class ID et Subject ID)
  const { data: classGradesData, isLoading: loadingGrades } = useQuery(
    ['classGradesDetails', classId, subjectId, selectedPeriod],
    () => gradeAPI.getClassGradesDetails(classId, { period: selectedPeriod, subjectId: subjectId }),
    { enabled: !!classId && !!subjectId, refetchOnWindowFocus: false }
  )

  // 4. Récupération Étudiants (Utilise uniquement Class ID)
  const { data: studentsData, isLoading: loadingStudents } = useQuery(
    ['classStudents', classId],
    () => teacherAPI.getClassStudents(classId),
    { enabled: !!classId, refetchOnWindowFocus: false }
  )
  
  // Mutation Sauvegarde
  const saveGradesMutation = useMutation(
    (payload) => gradeAPI.saveGrades(classId, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classGradesDetails', classId, subjectId, selectedPeriod])
        alert('✅ Notes enregistrées avec succès!')
      },
      onError: (error) => {
        alert('❌ Erreur: ' + (error.response?.data?.message || error.message))
      }
    }
  )

  // Initialisation des notes locales lors du chargement
  useEffect(() => {
    if (classGradesData?.success && classGradesData.data?.grades) {
      const gradesData = classGradesData.data.grades;
      const initialGrades = {};
      
      if (Array.isArray(gradesData)) {
        gradesData.forEach(grade => {
          const sId = grade.student_id;
          if (!initialGrades[sId]) initialGrades[sId] = { interros: [], devoirs: [] };
          
          const targetArray = grade.grade_type === 'interro' ? 'interros' : 'devoirs';
          const index = grade.exam_number ? grade.exam_number - 1 : initialGrades[sId][targetArray].length;
          
          if (index < systemConfig.maxInterros || index < systemConfig.maxDevoirs) {
            initialGrades[sId][targetArray][index] = {
              id: grade.id,
              grade: grade.score !== undefined ? grade.score : grade.grade,
              grade_type: grade.grade_type,
            };
          }
        });
      }
      setGrades(initialGrades);
    } else {
      setGrades({});
    }
  }, [classGradesData, systemConfig]);
  
  // Fonctions de validation (ajoutées pour une meilleure robustesse)
  function ArrayOfStudents(data) {
    return Array.isArray(data) && data.every(item => item.id);
  }

  // --- COEUR DU CALCUL (Moyennes + Rangs) --- (Inchangé)
  const processedStudents = useMemo(() => {
    const rawData = studentsData?.data || studentsData;
    const rawStudents = rawData?.students || [];

    if (!ArrayOfStudents(rawStudents) || rawStudents.length === 0) return [];

    const studentsWithAvgs = rawStudents.map(student => {
      const sId = student.id;
      const sGrades = grades[sId] || { interros: [], devoirs: [] };

      const interroValues = sGrades.interros
        .map(g => parseFloat(g.grade))
        .filter(n => !isNaN(n) && n >= 0 && n <= 20);
      
      const devoirValues = sGrades.devoirs
        .map(g => parseFloat(g.grade))
        .filter(n => !isNaN(n) && n >= 0 && n <= 20);

      const moyInterro = interroValues.length 
        ? interroValues.reduce((a, b) => a + b, 0) / interroValues.length 
        : 0;
      
      const moyDevoir = devoirValues.length 
        ? devoirValues.reduce((a, b) => a + b, 0) / devoirValues.length 
        : 0;

      let moyTotale = 0;
      if (interroValues.length > 0 && devoirValues.length > 0) {
        moyTotale = (moyInterro + moyDevoir) / 2; 
      } else if (interroValues.length > 0) {
        moyTotale = moyInterro;
      } else if (devoirValues.length > 0) {
        moyTotale = moyDevoir;
      }

      const has_grades = interroValues.length > 0 || devoirValues.length > 0;

      return {
        ...student,
        interro_notes: sGrades.interros,
        devoir_notes: sGrades.devoirs,
        avg_interro: parseFloat(moyInterro.toFixed(2)),
        avg_devoir: parseFloat(moyDevoir.toFixed(2)),
        avg_total: parseFloat(moyTotale.toFixed(2)),
        has_grades: has_grades
      };
    }).sort((a, b) => {
        const nameA = `${a.last_name} ${a.first_name}`.toUpperCase();
        const nameB = `${b.last_name} ${b.first_name}`.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    const studentsToRank = studentsWithAvgs.filter(s => s.has_grades);
    const sortedByAvg = [...studentsToRank].sort((a, b) => b.avg_total - a.avg_total);
    
    const rankMap = new Map();
    let currentRank = 1;
    
    sortedByAvg.forEach((s, index) => {
        if (index > 0 && s.avg_total === sortedByAvg[index - 1].avg_total) {
            rankMap.set(s.id, rankMap.get(sortedByAvg[index - 1].id));
        } else {
            rankMap.set(s.id, currentRank);
        }
        currentRank++;
    });

    return studentsWithAvgs.map(s => ({
        ...s,
        rank: s.has_grades ? rankMap.get(s.id) : '-' 
    }));

  }, [studentsData, grades, classId]);

  // --- GESTIONNAIRES --- (Inchangés)

  const handleGradeChange = (studentId, type, index, value) => {
    let val = value.trim();
    if (val !== '' && isNaN(parseFloat(val))) return;

    let floatVal = parseFloat(val);
    if (val !== '' && (floatVal < 0 || floatVal > 20)) return;

    setGrades(prev => {
      const newGrades = { ...prev };
      if (!newGrades[studentId]) newGrades[studentId] = { interros: [], devoirs: [] };
      
      const targetArray = type === 'interro' ? 'interros' : 'devoirs';
      
      if (!newGrades[studentId][targetArray]) newGrades[studentId][targetArray] = [];
      
      newGrades[studentId][targetArray][index] = {
        grade: val === '' ? null : floatVal,
        grade_type: type,
        student_id: studentId,
        id: prev[studentId]?.[targetArray]?.[index]?.id 
      };
      
      return newGrades;
    });
  };

const handleSave = () => {
  if (!classId || !subjectId) return alert('Veuillez sélectionner une classe et une matière valides.');
  
  const payload = {
    subjectId: subjectId,
    period: selectedPeriod.toString(), // Convertir en string
    grades: [] // Nom correct attendu par le backend
  };
  
  Object.entries(grades).forEach(([studentId, data]) => {
    // Interrogations
    data.interros.forEach((g, idx) => {
      if (g && g.grade !== null && !isNaN(g.grade)) {
        payload.grades.push({ 
          student_id: parseInt(studentId),
          exam_type: 'interrogation',
          score: parseFloat(g.grade),
          coefficient: 1,
          academic_year: '2023-2024'
        });
      }
    });
    
    // Devoirs
    data.devoirs.forEach((g, idx) => {
      if (g && g.grade !== null && !isNaN(g.grade)) {
        payload.grades.push({ 
          student_id: parseInt(studentId),
          exam_type: 'devoir',
          score: parseFloat(g.grade),
          coefficient: 1,
          academic_year: '2023-2024'
        });
      }
    });
  });

  console.log('📤 Payload à envoyer:', payload); // DEBUG
  
  if (payload.grades.length === 0) return alert('Aucune note valide à enregistrer.');
  saveGradesMutation.mutate(payload); // Envoyer tout l'objet payload
};

  // --- RENDER ---

  if (loadingClasses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Chargement de votre espace...</p>
      </div>
    );
  }
  
  if (classesError) {
    return (
      <div className="min-h-screen bg-red-50 p-6">
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-red-400 border-dashed">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-xl font-bold text-red-700">Erreur de connexion API</h3>
          <p className="text-gray-600 mt-2 text-center max-w-lg">
            Impossible de récupérer la liste des classes assignées. Vérifiez que votre serveur backend est en cours d'exécution.
            <br/> Détail: {classesError.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Élégant */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                Saisie des Notes
              </h1>
              <p className="text-gray-500 mt-1">Gestion académique et calcul automatique</p>
            </div>
            {/* Stats rapides */}
            {selectedClass && (
              <div className="flex gap-4 text-sm">
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  {processedStudents.length} Apprenants
                </div>
                {selectedAssignment && (
                  <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium">
                    Matière: {selectedAssignment.subject?.name || 'N/A'} (Coef: {selectedAssignment.subject?.coefficient || 1})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Barre d'outils de sélection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Classe & Matière
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setGrades({});
                }}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3"
              >
                <option value="">-- Sélectionner une classe & matière --</option>
                {/* La liste des options provient maintenant du useMemo plus robuste */}
                {processedClasses.map((assignment) => (
                  <option key={assignment.uniqueKey} value={assignment.uniqueKey}>
                    {assignment.class.name} • {assignment.subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Période Académique
              </label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {[1, 2, 3].slice(0, systemConfig.type === 'semestre' ? 2 : 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      selectedPeriod === p
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {systemConfig.type === 'semestre' ? 'Semestre' : 'Trimestre'} {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <button
                onClick={handleSave}
                disabled={!selectedClass || saveGradesMutation.isLoading}
                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all transform active:scale-95 ${
                  !selectedClass
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500/30'
                }`}
              >
                {saveGradesMutation.isLoading ? (
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                Enregistrer Tout
              </button>
            </div>
          </div>
        </div>

        {/* Zone de Contenu */}
        {selectedClass ? (
          <>
            {loadingStudents || loadingGrades ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 border-dashed">
                <Loader className="h-10 w-10 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-500">Récupération des données académiques...</p>
              </div>
            ) : processedStudents.length > 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50/80">
                        {/* Colonne Apprenant (Sticky) */}
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          Apprenant
                        </th>
                        
                        {/* Colonnes Interros */}
                        <th colSpan={systemConfig.maxInterros} className="px-4 py-2 text-center text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50/50 border-l border-r border-blue-100">
                          Interrogations (20)
                        </th>
                        
                        {/* Moyenne Interro */}
                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100">
                          Moy. Int.
                        </th>

                        {/* Colonnes Devoirs */}
                        <th colSpan={systemConfig.maxDevoirs} className="px-4 py-2 text-center text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50/50 border-l border-r border-purple-100">
                          Devoirs (20)
                        </th>

                        {/* Moyenne Devoir */}
                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100">
                          Moy. Dev.
                        </th>

                        {/* Résultats Finaux */}
                        <th className="px-4 py-2 text-center text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50">
                          Moy. Gén.
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-orange-700 uppercase tracking-wider bg-orange-50">
                          Rang
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {processedStudents.map((student, idx) => (
                        <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                          
                          {/* Info Élève */}
                          <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50/30 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                                {idx + 1}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {student.last_name} {student.first_name}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  {student.matricule}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Inputs Interros */}
                          {Array.from({ length: systemConfig.maxInterros }).map((_, i) => {
                            const note = student.interro_notes[i]?.grade;
                            return (
                              <td key={`int-${i}`} className="px-1 py-3 text-center border-l border-gray-50">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  placeholder="-"
                                  value={note !== undefined && note !== null ? note : ''}
                                  onChange={(e) => handleGradeChange(student.id, 'interro', i, e.target.value)}
                                  className={`w-12 h-9 text-center text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all
                                    ${note !== undefined && note !== null && parseFloat(note) < 10 ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-800 border-gray-200'}
                                  `}
                                />
                              </td>
                            );
                          })}

                          {/* Moyenne Interro */}
                          <td className="px-4 py-3 text-center bg-gray-50 font-mono text-sm font-medium text-gray-700">
                            {student.avg_interro > 0 ? student.avg_interro.toFixed(2) : '-'}
                          </td>

                          {/* Inputs Devoirs */}
                          {Array.from({ length: systemConfig.maxDevoirs }).map((_, i) => {
                            const note = student.devoir_notes[i]?.grade;
                            return (
                              <td key={`dev-${i}`} className="px-1 py-3 text-center border-l border-gray-50">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  placeholder="-"
                                  value={note !== undefined && note !== null ? note : ''}
                                  onChange={(e) => handleGradeChange(student.id, 'devoir', i, e.target.value)}
                                  className={`w-12 h-9 text-center text-sm border rounded focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all
                                    ${note !== undefined && note !== null && parseFloat(note) < 10 ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-800 border-gray-200'}
                                  `}
                                />
                              </td>
                            );
                          })}

                          {/* Moyenne Devoir */}
                          <td className="px-4 py-3 text-center bg-gray-50 font-mono text-sm font-medium text-gray-700">
                            {student.avg_devoir > 0 ? student.avg_devoir.toFixed(2) : '-'}
                          </td>

                          {/* Moyenne Générale */}
                          <td className="px-4 py-3 text-center bg-green-50/50">
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold
                              ${student.avg_total >= 10 ? 'text-green-700' : 'text-red-600'}
                            `}>
                              {student.avg_total > 0 ? student.avg_total.toFixed(2) : '-'}
                            </span>
                          </td>

                          {/* Rang (Live) */}
                          <td className="px-4 py-3 text-center bg-orange-50/30">
                            {student.rank && student.rank !== '-' ? (
                              <div className="flex items-center justify-center">
                                {student.rank === 1 && <Award className="h-4 w-4 text-yellow-500 mr-1" />}
                                <span className={`font-bold ${student.rank <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                                  {student.rank}<sup>{student.rank === 1 ? 'er' : 'e'}</sup>
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200 border-dashed">
                <Users className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Aucun apprenant trouvé</h3>
                <p className="text-gray-500">
                    {selectedClass 
                        ? "Vérifiez que des élèves sont bien assignés à cette classe."
                        : "Veuillez sélectionner une classe pour afficher les élèves."
                    }
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Espace de saisie des notes</h2>
            <p className="text-gray-500 mt-2 text-center max-w-md">
              Veuillez sélectionner une classe et une matière ci-dessus pour commencer la saisie.
            </p>
            {processedClasses.length === 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                    <span className="font-bold">Problème de chargement:</span> Aucune classe ou matière assignée n'a été trouvée.
                    <br/>Vérifiez si l'enseignant est bien assigné via `TeacherClassSubject`.
                </div>
            )}
          </div>
        )}
        
        {/* Légende/Aides (Inchangé) */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Détails du Calcul
              </h2>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Moyenne Générale</span> : ({selectedAssignment?.subject?.name || 'Matière'}) est calculée comme la moyenne simple des Moyennes Interro et Devoir (MI + MD) / 2.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Award className="h-4 w-4 text-yellow-600 mt-1 mr-2 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Rang</span> : Le classement est mis à jour en <span className="font-bold text-blue-700">temps réel</span>.
                      </span>
                    </li>
                  </ul>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Règles de Saisie
              </h2>
              <div className="p-4 bg-white rounded-lg border border-yellow-300">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-red-600">⚠ Attention :</span> Les notes sont limitées à 0 et 20. Si une note est inférieure à 10, le champ sera mis en évidence en rouge.
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  💡 Maximum autorisé : <span className="font-medium">{systemConfig.maxInterros}</span> interrogations et <span className="font-medium">{systemConfig.maxDevoirs}</span> devoirs.
                </p>
                <p className="text-sm text-gray-700 mt-2">
                   N'oubliez pas de cliquer sur **"Enregistrer Tout"** pour sauvegarder les modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherClasses