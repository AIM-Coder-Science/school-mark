import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const steps = ['Sélection', 'Saisie des notes', 'Confirmation'];

const TeacherGrades = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);

  const schema = yup.object().shape({
    classId: yup.string().required('La classe est requise'),
    subjectId: yup.string().required('La matière est requise'),
    examType: yup.string().required('Le type d\'examen est requis'),
    semester: yup.number().required('Le semestre est requis'),
    academicYear: yup.number().required('L\'année académique est requise'),
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      classId: location.state?.classId || '',
      subjectId: '',
      examType: 'devoir',
      semester: 1,
      academicYear: new Date().getFullYear(),
    },
  });

  const selectedClassId = watch('classId');
  const selectedSubjectId = watch('subjectId');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
      fetchSubjects(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getMyClasses();
      setClasses(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const response = await teacherAPI.getClassStudents(classId);
      const studentsData = response.data.data || [];
      setStudents(studentsData);
      
      // Initialiser les notes pour chaque étudiant
      setGrades(studentsData.map(student => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        score: '',
        maxScore: 20,
        coefficient: 1,
      })));
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      const selectedClass = classes.find(c => c.id.toString() === classId);
      setSubjects(selectedClass?.subjects || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des matières');
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades(grades.map(grade =>
      grade.studentId === studentId
        ? { ...grade, [field]: value }
        : grade
    ));
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Sauvegarder toutes les notes
      const promises = grades
        .filter(grade => grade.score !== '')
        .map(grade =>
          teacherAPI.addGrade({
            studentId: grade.studentId,
            classId: data.classId,
            subjectId: data.subjectId,
            examType: data.examType,
            score: parseFloat(grade.score),
            maxScore: parseFloat(grade.maxScore),
            coefficient: parseFloat(grade.coefficient),
            semester: data.semester,
            academicYear: data.academicYear,
          })
        );

      await Promise.all(promises);
      
      toast.success(`${promises.length} note(s) ajoutée(s) avec succès !`);
      navigate('/teacher/classes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout des notes');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info">
                Sélectionnez d'abord la classe, la matière et le type d'examen pour commencer la saisie des notes.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="classId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.classId}>
                    <InputLabel>Classe *</InputLabel>
                    <Select {...field} label="Classe *">
                      <MenuItem value="">Sélectionner une classe</MenuItem>
                      {classes.map((classItem) => (
                        <MenuItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name} ({classItem.level})
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.classId && (
                      <Typography variant="caption" color="error">
                        {errors.classId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.subjectId} disabled={!selectedClassId}>
                    <InputLabel>Matière *</InputLabel>
                    <Select {...field} label="Matière *">
                      <MenuItem value="">Sélectionner une matière</MenuItem>
                      {subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.subjectId && (
                      <Typography variant="caption" color="error">
                        {errors.subjectId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="examType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.examType}>
                    <InputLabel>Type d'examen *</InputLabel>
                    <Select {...field} label="Type d'examen *">
                      <MenuItem value="interro">Interrogation</MenuItem>
                      <MenuItem value="devoir">Devoir</MenuItem>
                      <MenuItem value="composition">Composition</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Semestre *</InputLabel>
                    <Select {...field} label="Semestre *">
                      <MenuItem value={1}>Semestre 1</MenuItem>
                      <MenuItem value={2}>Semestre 2</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="academicYear"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Année académique *</InputLabel>
                    <Select {...field} label="Année académique *">
                      <MenuItem value={2023}>2023-2024</MenuItem>
                      <MenuItem value={2024}>2024-2025</MenuItem>
                      <MenuItem value={2025}>2025-2026</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Saisissez les notes pour chaque étudiant. Vous pouvez laisser vide les étudiants absents.
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>Étudiant</TableCell>
                    <TableCell align="center">Note</TableCell>
                    <TableCell align="center">Sur</TableCell>
                    <TableCell align="center">Coefficient</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.studentId}>
                      <TableCell>{grade.studentName}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={grade.score}
                          onChange={(e) => handleGradeChange(grade.studentId, 'score', e.target.value)}
                          inputProps={{ min: 0, max: grade.maxScore, step: 0.25 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={grade.maxScore}
                          onChange={(e) => handleGradeChange(grade.studentId, 'maxScore', e.target.value)}
                          inputProps={{ min: 1, max: 20 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={grade.coefficient}
                          onChange={(e) => handleGradeChange(grade.studentId, 'coefficient', e.target.value)}
                          inputProps={{ min: 0.5, max: 5, step: 0.5 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        const filledGrades = grades.filter(g => g.score !== '');
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Vérifiez les informations avant de valider.
            </Alert>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Récapitulatif
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Classe:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {classes.find(c => c.id.toString() === selectedClassId)?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Matière:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {subjects.find(s => s.id.toString() === selectedSubjectId)?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Type d'examen:
                    </Typography>
                    <Chip
                      label={watch('examType')}
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Notes saisies:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {filledGrades.length} / {grades.length}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="h6" gutterBottom>
              Notes à enregistrer ({filledGrades.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>Étudiant</TableCell>
                    <TableCell align="center">Note</TableCell>
                    <TableCell align="center">Coefficient</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filledGrades.map((grade) => (
                    <TableRow key={grade.studentId}>
                      <TableCell>{grade.studentName}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${grade.score}/${grade.maxScore}`}
                          size="small"
                          color={parseFloat(grade.score) >= 10 ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">{grade.coefficient}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading && classes.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Saisie des Notes - Enseignant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/teacher/classes')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Saisie des Notes
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Ajoutez ou modifiez les notes de vos étudiants
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Retour
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                    },
                  }}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer les notes'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!selectedClassId || !selectedSubjectId}
                >
                  Suivant
                </Button>
              )}
            </Box>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default TeacherGrades;