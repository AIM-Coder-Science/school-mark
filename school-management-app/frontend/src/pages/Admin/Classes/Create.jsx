import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  Card,
  CardContent,
  Alert,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Book as BookIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const CreateClass = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);

  const schema = yup.object().shape({
    name: yup.string().required('Le nom de la classe est requis'),
    level: yup.string().required('Le niveau est requis'),
    teacherPrincipalId: yup.string().nullable(),
    subjects: yup.array().min(1, 'Au moins une matière est requise'),
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
      subjects: [],
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Récupérer les enseignants et matières
      const [teachersRes] = await Promise.all([
        adminAPI.getTeachers(),
        // adminAPI.getSubjects() // À implémenter
      ]);

      setTeachers(teachersRes.data.data || []);
      
      // Simuler des matières pour l'exemple
      const mockSubjects = [
        { id: 1, name: 'Mathématiques', code: 'MATH' },
        { id: 2, name: 'Physique', code: 'PHY' },
        { id: 3, name: 'Chimie', code: 'CHIM' },
        { id: 4, name: 'Français', code: 'FR' },
        { id: 5, name: 'Anglais', code: 'ANG' },
        { id: 6, name: 'Histoire-Géographie', code: 'HIST' },
        { id: 7, name: 'Sciences', code: 'SCI' },
        { id: 8, name: 'Éducation Physique', code: 'EPS' },
      ];
      
      setSubjects(mockSubjects);
      setAvailableTeachers(teachersRes.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale'
  ];

  const handleSubjectToggle = (subjectId) => {
    const newSelectedSubjects = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter(id => id !== subjectId)
      : [...selectedSubjects, subjectId];
    
    setSelectedSubjects(newSelectedSubjects);
    setValue('subjects', newSelectedSubjects);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const classData = {
        name: data.name,
        level: data.level,
        teacherPrincipalId: data.teacherPrincipalId || null,
        subjects: data.subjects,
      };

      const response = await adminAPI.createClass(classData);
      
      toast.success('Classe créée avec succès !');
      
      // Si un professeur principal a été assigné
      if (data.teacherPrincipalId) {
        toast.success('Professeur principal assigné');
      }
      
      navigate('/admin/classes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !teachers.length) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Nouvelle Classe - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/classes')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Créer une nouvelle classe
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Ajoutez une nouvelle classe au système
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
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
                      <Select
                        {...field}
                        label="Niveau *"
                      >
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

              {/* Professeur Principal */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                  Professeur Principal
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Le professeur principal aura accès à toutes les notes de la classe et pourra calculer les moyennes générales.
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
                      >
                        <MenuItem value="">Aucun pour le moment</MenuItem>
                        {availableTeachers.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName} - {teacher.matricule}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Matières de la classe */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                  Matières de la classe *
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Sélectionnez les matières qui seront enseignées dans cette classe.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      {subjects.map((subject) => (
                        <Grid item xs={12} sm={6} md={4} key={subject.id}>
                          <Card 
                            variant={selectedSubjects.includes(subject.id) ? "elevation" : "outlined"}
                            elevation={selectedSubjects.includes(subject.id) ? 2 : 0}
                            sx={{ 
                              cursor: 'pointer',
                              borderColor: selectedSubjects.includes(subject.id) ? 'primary.main' : 'divider',
                              '&:hover': {
                                borderColor: 'primary.main',
                              }
                            }}
                            onClick={() => handleSubjectToggle(subject.id)}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <BookIcon 
                                    color={selectedSubjects.includes(subject.id) ? "primary" : "action"} 
                                  />
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
                                  checked={selectedSubjects.includes(subject.id)}
                                  onChange={() => handleSubjectToggle(subject.id)}
                                  color="primary"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    {errors.subjects && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {errors.subjects.message}
                      </Alert>
                    )}

                    {selectedSubjects.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Matières sélectionnées ({selectedSubjects.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedSubjects.map((subjectId) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <Chip
                                key={subject.id}
                                label={subject.name}
                                onDelete={() => handleSubjectToggle(subject.id)}
                                color="primary"
                                variant="outlined"
                              />
                            ) : null;
                          })}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Récapitulatif */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Récapitulatif
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Nom de la classe:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {watch('name') || 'Non défini'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Niveau:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {watch('level') || 'Non défini'}
                        </Typography>
                      </Grid>
                      
                      {watch('teacherPrincipalId') && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Professeur Principal:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {(() => {
                              const teacher = teachers.find(t => t.id.toString() === watch('teacherPrincipalId'));
                              return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Non défini';
                            })()}
                          </Typography>
                        </Grid>
                      )}
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          Matières ({selectedSubjects.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {selectedSubjects.map((subjectId) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <Chip
                                key={subject.id}
                                label={subject.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : null;
                          })}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/classes')}
                  >
                    Annuler
                  </Button>
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
                    {loading ? 'Création...' : 'Créer la classe'}
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

export default CreateClass;