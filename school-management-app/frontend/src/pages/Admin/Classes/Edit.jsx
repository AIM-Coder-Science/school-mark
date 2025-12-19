import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Alert,
  Divider,
  IconButton,
  Checkbox,
  Badge,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const EditClass = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});

  const schema = yup.object().shape({
    name: yup.string().required('Le nom de la classe est requis'),
    level: yup.string().required('Le niveau est requis'),
    teacherPrincipalId: yup.string().nullable(),
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      level: '',
      teacherPrincipalId: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      
      const [classRes, teachersRes, subjectsRes] = await Promise.all([
        adminAPI.getClass(classId),
        adminAPI.getAllTeachers(),
        adminAPI.getAllSubjects(),
      ]);

      const classData = classRes.data.data;
      
      setValue('name', classData.name);
      setValue('level', classData.level);
      setValue('teacherPrincipalId', classData.teacherPrincipalId || '');

      const subjectsWithCoeffs = {};
      if (Array.isArray(classData.classSubjects)) {
        classData.classSubjects.forEach(subject => {
          const coeff = subject.TeacherClassSubject?.coefficient || 
                       subject.ClassSubject?.coefficient || 
                       1;
          subjectsWithCoeffs[subject.id] = coeff;
        });
      }
      
      setSelectedSubjects(subjectsWithCoeffs);
      setTeachers(teachersRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
      navigate('/admin/classes');
    } finally {
      setInitialLoading(false);
    }
  };

  const levels = [
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale'
  ];

  // Calculer les enseignants disponibles pour être prof principal
  const availableTeachersForPrincipal = useMemo(() => {
    // Obtenir les IDs des matières sélectionnées
    const selectedSubjectIds = Object.keys(selectedSubjects).map(id => parseInt(id));
    
    // Filtrer les enseignants qui enseignent au moins une matière de cette classe
    return teachers.filter(teacher => {
      if (!teacher.assignedClasses || teacher.assignedClasses.length === 0) return false;
      
      // Vérifier si l'enseignant enseigne dans cette classe
      const teachesInClass = teacher.assignedClasses.some(cls => {
        if (cls.id !== parseInt(classId)) return false;
        
        // Vérifier si au moins une matière enseignée correspond
        return cls.subjectsTaught?.some(subject => 
          selectedSubjectIds.includes(subject.id)
        );
      });
      
      return teachesInClass;
    });
  }, [teachers, selectedSubjects, classId]);

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects(prev => {
      const newSelected = { ...prev };
      if (newSelected[subjectId]) {
        delete newSelected[subjectId];
      } else {
        newSelected[subjectId] = 2;
      }
      return newSelected;
    });
  };

  const handleCoefficientChange = (subjectId, change) => {
    setSelectedSubjects(prev => {
      const newSelected = { ...prev };
      const currentCoeff = newSelected[subjectId] || 2;
      const newCoeff = currentCoeff + change;
      
      if (newCoeff >= 1 && newCoeff <= 10) {
        newSelected[subjectId] = newCoeff;
      }
      
      return newSelected;
    });
  };

  const onSubmit = async (data) => {
    if (Object.keys(selectedSubjects).length === 0) {
      toast.error('Veuillez sélectionner au moins une matière');
      return;
    }

    // Vérifier si le prof principal sélectionné est bien dans la liste des disponibles
    if (data.teacherPrincipalId) {
      const isPrincipalAvailable = availableTeachersForPrincipal.some(
        t => t.id.toString() === data.teacherPrincipalId
      );
      
      if (!isPrincipalAvailable) {
        toast.error('Le professeur principal doit enseigner au moins une matière dans cette classe');
        return;
      }
    }

    try {
      setLoading(true);
      
      const classData = {
        name: data.name,
        level: data.level,
        teacherPrincipalId: data.teacherPrincipalId || null,
        subjects: Object.keys(selectedSubjects).map(id => parseInt(id)),
        coefficients: selectedSubjects,
      };

      await adminAPI.updateClass(classId, classData);
      
      toast.success('Classe mise à jour avec succès !');
      navigate('/admin/classes');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Modifier la classe - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/classes')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Modifier la classe
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Modifiez les informations de la classe
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Informations de base */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Informations de base
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nom de la classe *"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      placeholder="Ex: 6ème A, Terminale S"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.level}>
                      <InputLabel>Niveau *</InputLabel>
                      <Select {...field} label="Niveau *">
                        <MenuItem value="">Sélectionner un niveau</MenuItem>
                        {levels.map((level) => (
                          <MenuItem key={level} value={level}>
                            {level}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.level && (
                        <Typography variant="caption" color="error">
                          {errors.level.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Matières */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Matières de la classe *
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Sélectionnez d'abord les matières, puis définissez leur coefficient (1 à 10).
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    {subjects.length === 0 ? (
                      <Alert severity="warning">
                        Aucune matière disponible
                      </Alert>
                    ) : (
                      <Grid container spacing={2}>
                        {subjects.map((subject) => {
                          const isSelected = selectedSubjects[subject.id] !== undefined;
                          const coefficient = selectedSubjects[subject.id] || 2;
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={subject.id}>
                              <Card 
                                variant={isSelected ? "elevation" : "outlined"}
                                elevation={isSelected ? 2 : 0}
                                sx={{ 
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  transition: 'all 0.3s',
                                }}
                              >
                                <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    justifyContent: 'space-between', 
                                    mb: isSelected ? 1 : 0 
                                  }}>
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        cursor: 'pointer',
                                        flex: 1,
                                      }}
                                      onClick={() => handleSubjectToggle(subject.id)}
                                    >
                                      <BookIcon color={isSelected ? "primary" : "action"} />
                                      <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                          {subject.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          {subject.code}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => handleSubjectToggle(subject.id)}
                                      color="primary"
                                    />
                                  </Box>
                                  
                                  {isSelected && (
                                    <Box sx={{ 
                                      mt: 2, 
                                      pt: 2, 
                                      borderTop: 1, 
                                      borderColor: 'divider',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between'
                                    }}>
                                      <Typography variant="body2" color="textSecondary">
                                        Coefficient:
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleCoefficientChange(subject.id, -1)}
                                          disabled={coefficient <= 1}
                                          color="primary"
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>
                                        <Chip
                                          label={coefficient}
                                          color="primary"
                                          size="small"
                                          sx={{ minWidth: 40, fontWeight: 600 }}
                                        />
                                        <IconButton
                                          size="small"
                                          onClick={() => handleCoefficientChange(subject.id, 1)}
                                          disabled={coefficient >= 10}
                                          color="primary"
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}

                    {Object.keys(selectedSubjects).length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Matières sélectionnées ({Object.keys(selectedSubjects).length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(selectedSubjects).map(([subjectId, coeff]) => {
                            const subject = subjects.find(s => s.id === parseInt(subjectId));
                            return subject ? (
                              <Badge
                                key={subject.id}
                                badgeContent={`×${coeff}`}
                                color="primary"
                              >
                                <Chip
                                  label={subject.name}
                                  onDelete={() => handleSubjectToggle(parseInt(subjectId))}
                                  color="primary"
                                  variant="outlined"
                                />
                              </Badge>
                            ) : null;
                          })}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Professeur Principal */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Professeur Principal
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Seuls les enseignants affectés à cette classe peuvent être désignés comme professeur principal.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="teacherPrincipalId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Professeur Principal (Optionnel)</InputLabel>
                      <Select
                        {...field}
                        label="Professeur Principal (Optionnel)"
                        disabled={availableTeachersForPrincipal.length === 0}
                      >
                        <MenuItem value="">Aucun</MenuItem>
                        {availableTeachersForPrincipal.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName} - {teacher.matricule}
                          </MenuItem>
                        ))}
                      </Select>
                      {availableTeachersForPrincipal.length === 0 && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, ml: 2 }}>
                          Aucun enseignant n'enseigne encore dans cette classe
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/classes')}
                    size="large"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading || Object.keys(selectedSubjects).length === 0}
                    size="large"
                    sx={{
                      px: 4,
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                      },
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default EditClass;