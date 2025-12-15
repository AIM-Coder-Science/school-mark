import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { studentAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StudentGrades = () => {
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchGrades();
  }, [selectedSemester, selectedYear]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyGrades({
        semester: selectedSemester,
        academicYear: selectedYear,
      });
      setGradesData(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 16) return 'success';
    if (grade >= 14) return 'info';
    if (grade >= 12) return 'primary';
    if (grade >= 10) return 'warning';
    return 'error';
  };

  const getGradeLabel = (grade) => {
    if (grade >= 16) return 'Excellent';
    if (grade >= 14) return 'Très Bien';
    if (grade >= 12) return 'Bien';
    if (grade >= 10) return 'Assez Bien';
    if (grade >= 8) return 'Passable';
    if (grade >= 6) return 'Insuffisant';
    return 'Très Insuffisant';
  };

  const calculateSubjectAverage = (subject) => {
    if (subject.recordedAverage !== undefined) {
      return subject.recordedAverage;
    }
    return subject.average || 0;
  };

  if (loading) {
    return <Loader />;
  }

  if (!gradesData) {
    return (
      <Alert severity="info">
        Aucune donnée de notes disponible.
      </Alert>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mes Notes - Étudiant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Mes Notes
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Consultez vos notes et vos moyennes
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semestre</InputLabel>
              <Select
                value={selectedSemester}
                label="Semestre"
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <MenuItem value={1}>Semestre 1</MenuItem>
                <MenuItem value={2}>Semestre 2</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Année</InputLabel>
              <Select
                value={selectedYear}
                label="Année"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value={2023}>2023-2024</MenuItem>
                <MenuItem value={2024}>2024-2025</MenuItem>
                <MenuItem value={2025}>2025-2026</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Télécharger le bulletin">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Imprimer">
              <IconButton>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Informations de l'étudiant et moyenne générale */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {gradesData.student.firstName} {gradesData.student.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Matricule: {gradesData.student.matricule}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Classe: {gradesData.student.class}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  {gradesData.generalAverage && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {gradesData.generalAverage.average.toFixed(2)}/20
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Moyenne Générale
                      </Typography>
                      <Chip
                        label={`Rang: ${gradesData.generalAverage.rank} sur ${gradesData.statistics.totalStudents || '?'}`}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
              
              {gradesData.generalAverage?.appreciation && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Appréciation générale:
                  </Typography>
                  <Typography>{gradesData.generalAverage.appreciation}</Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistiques
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Matières suivies</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {gradesData.statistics.totalSubjects}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Notes totales</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {gradesData.statistics.totalGrades}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Matières validées</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {gradesData.statistics.passingSubjects}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Taux de réussite</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {gradesData.statistics.totalSubjects > 0 
                        ? ((gradesData.statistics.passingSubjects / gradesData.statistics.totalSubjects) * 100).toFixed(1)
                        : 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Notes par matière */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Notes par matière
        </Typography>

        <Grid container spacing={3}>
          {gradesData.gradesBySubject.map((subjectData, index) => {
            const average = calculateSubjectAverage(subjectData);
            
            return (
              <Grid item xs={12} key={index}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {subjectData.subject.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Coefficient: {subjectData.subject.coefficient}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ 
                            fontWeight: 700,
                            color: `${getGradeColor(average)}.main`
                          }}>
                            {average.toFixed(2)}/20
                          </Typography>
                          <Chip
                            label={getGradeLabel(average)}
                            size="small"
                            color={getGradeColor(average)}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    {/* Barre de progression */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Progression: {average.toFixed(1)}/20
                        </Typography>
                        <Typography variant="body2">
                          {(average / 20 * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={average / 20 * 100}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: `${getGradeColor(average)}.main`,
                          },
                        }}
                      />
                    </Box>
                    
                    {/* Tableau des notes */}
                    {subjectData.grades.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                              <TableCell>Type d'examen</TableCell>
                              <TableCell align="center">Date</TableCell>
                              <TableCell align="center">Note</TableCell>
                              <TableCell align="center">Sur</TableCell>
                              <TableCell align="center">Coefficient</TableCell>
                              <TableCell align="center">Note pondérée</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subjectData.grades.map((grade, gradeIndex) => (
                              <TableRow key={gradeIndex}>
                                <TableCell>
                                  <Chip
                                    label={grade.examType}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {new Date(grade.created_at).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell align="center">
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      color: grade.score >= 10 ? 'success.main' : 'error.main'
                                    }}
                                  >
                                    {grade.score}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">{grade.maxScore || 20}</TableCell>
                                <TableCell align="center">{grade.coefficient}</TableCell>
                                <TableCell align="center">
                                  <Typography sx={{ fontWeight: 600 }}>
                                    {(grade.score * grade.coefficient).toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                              <TableCell colSpan={5} align="right">
                                <Typography sx={{ fontWeight: 600 }}>
                                  Moyenne de la matière:
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {average.toFixed(2)}/20
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Alert severity="info">
                        Aucune note enregistrée pour cette matière.
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            );
          })}
        </Grid>

        {gradesData.gradesBySubject.length === 0 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            Aucune note disponible pour le semestre sélectionné.
          </Alert>
        )}

        {/* Résumé */}
        <Paper sx={{ p: 3, borderRadius: 2, mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Résumé du semestre
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {gradesData.statistics.totalSubjects}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Matières suivies
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <AssessmentIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {gradesData.statistics.passingSubjects}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Matières validées
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {gradesData.generalAverage ? gradesData.generalAverage.rank : '-'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rang dans la classe
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700,
                    color: gradesData.generalAverage?.average >= 10 ? 'success.main' : 'error.main'
                  }}>
                    {gradesData.generalAverage ? gradesData.generalAverage.average.toFixed(2) : '0.00'}/20
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Moyenne générale
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => toast.success('Fonctionnalité en développement')}
            >
              Télécharger le bulletin
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Imprimer
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default StudentGrades;