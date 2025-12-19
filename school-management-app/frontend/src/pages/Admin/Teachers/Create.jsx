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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const steps = ['Informations personnelles', 'Affectations', 'Identifiants'];

const specialtyOptions = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Sciences',
  'Français',
  'Anglais',
  'Histoire-Géographie',
  'Philosophie',
  'Éducation Physique',
  'Informatique',
  'Technologie',
  'Arts Plastiques',
  'Musique',
];

const CreateTeacher = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const schema = yup.object().shape({
    // Step 1
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide'),
    phone: yup.string(),
    specialties: yup.array().min(1, 'Au moins une spécialité est requise'),
    
    // Step 2
    assignments: yup.array().when('$activeStep', {
      is: 1,
      then: yup.array().min(1, 'Au moins une affectation est requise'),
    }),
    
    // Step 3
    temporaryPassword: yup.string().when('$activeStep', {
      is: 2,
      then: yup.string()
        .required('Le mot de passe temporaire est requis')
        .min(6, 'Minimum 6 caractères'),
    }),
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      phone: '',
      specialties: [],
      assignments: [],
      temporaryPassword: 'Teacher123!',
    },
    context: { activeStep },
  });

  useEffect(() => {
    fetchClassesAndSubjects();
  }, []);

  const fetchClassesAndSubjects = async () => {
    try {
      setLoading(true);
      const [classesRes, subjectsRes] = await Promise.all([
        adminAPI.getAllClasses(),
        // Note: Vous devrez créer un endpoint pour les matières
        adminAPI.getAllSubjects()
      ]);

      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
      
      // Pour l'exemple, simuler des données
      /*setSubjects([
        { id: 1, name: 'Mathématiques', code: 'MATH' },
        { id: 2, name: 'Physique', code: 'PHY' },
        { id: 3, name: 'Chimie', code: 'CHIM' },
        { id: 4, name: 'Français', code: 'FR' },
        { id: 5, name: 'Anglais', code: 'ANG' },
      ]);*/
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const isValid = await trigger();
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddAssignment = () => {
    setAssignments([...assignments, { classId: '', subjectId: '' }]);
  };

  const handleRemoveAssignment = (index) => {
    const newAssignments = [...assignments];
    newAssignments.splice(index, 1);
    setAssignments(newAssignments);
  };

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    
    // Si la classe change, mettre à jour les matières disponibles
    if (field === 'classId') {
      newAssignments[index].subjectId = '';
    }
    
    setAssignments(newAssignments);
    setValue('assignments', newAssignments);
  };
/*
  const getClassSubjects = (classId) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem?.subjects || [];
  };*/

  const getClassSubjects = (classId) => {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem || !Array.isArray(classItem.classSubjects)) {
      return [];
    }
    
    // Filtrer par spécialités de l'enseignant si disponibles
    const teacherSpecialties = watch('specialties') || [];
    
    if (teacherSpecialties.length === 0) {
      return classItem.classSubjects;
    }
    
    // Filtrer les matières qui correspondent aux spécialités
    return classItem.classSubjects.filter(subject => {
      return teacherSpecialties.some(specialty => 
        subject.name.toLowerCase().includes(specialty.toLowerCase()) ||
        specialty.toLowerCase().includes(subject.name.toLowerCase())
      );
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const teacherData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        matricule: data.matricule,
        phone: data.phone,
        specialties: data.specialties,
        classes: data.assignments,
        temporaryPassword: data.temporaryPassword,
      };

      const response = await adminAPI.createTeacher(teacherData);
      
      toast.success('Enseignant créé avec succès !');
      
      // Afficher les identifiants
      if (response.data.credentials) {
        toast(
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Identifiants créés :
            </Typography>
            <Typography variant="body2">
              Email: {response.data.credentials.email}
            </Typography>
            <Typography variant="body2">
              Mot de passe: {response.data.credentials.password}
            </Typography>
          </Box>,
          { duration: 10000 }
        );
      }
      
      navigate('/admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !classes.length) {
    return <Loader />;
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Prénom *"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nom *"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="matricule"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Matricule *"
                    error={!!errors.matricule}
                    helperText={errors.matricule?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Téléphone"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="specialties"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={specialtyOptions}
                    value={field.value}
                    onChange={(event, newValue) => field.onChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Spécialités *"
                        error={!!errors.specialties}
                        helperText={errors.specialties?.message}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          size="small"
                        />
                      ))
                    }
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Assignez l'enseignant à des classes et matières. Il pourra saisir les notes pour ces matières dans les classes assignées.
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddAssignment}
                variant="outlined"
              >
                Ajouter une affectation
              </Button>
            </Box>

            {assignments.map((assignment, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">
                      Affectation {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveAssignment(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Classe *</InputLabel>
                        <Select
                          value={assignment.classId || ''}
                          label="Classe *"
                          onChange={(e) => handleAssignmentChange(index, 'classId', e.target.value)}
                        >
                          <MenuItem value="">Sélectionner une classe</MenuItem>
                          {classes.map((classItem) => (
                            <MenuItem key={classItem.id} value={classItem.id}>
                              {classItem.name} ({classItem.level})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small" disabled={!assignment.classId}>
                        <InputLabel>Matière *</InputLabel>
                        <Select
                          value={assignment.subjectId || ''}
                          label="Matière *"
                          onChange={(e) => handleAssignmentChange(index, 'subjectId', e.target.value)}
                        >
                          <MenuItem value="">Sélectionner une matière</MenuItem>
                          {getClassSubjects(assignment.classId).map((subject) => (
                            <MenuItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            {assignments.length === 0 && (
              <Alert severity="warning">
                Aucune affectation définie. L'enseignant ne pourra pas saisir de notes.
              </Alert>
            )}

            {errors.assignments && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.assignments.message}
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Informations de connexion
                </Typography>
                <Typography variant="body2">
                  Ces identifiants seront communiqués à l'enseignant pour sa première connexion.
                  Il devra changer son mot de passe après la première connexion.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="temporaryPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Mot de passe temporaire *"
                    type={showPassword ? 'text' : 'password'}
                    error={!!errors.temporaryPassword}
                    helperText={errors.temporaryPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Récapitulatif
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Nom complet:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {watch('firstName')} {watch('lastName')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Matricule:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {watch('matricule')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Email:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {watch('email') || 'Aucun'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Spécialités:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {watch('specialties')?.map((spec, index) => (
                          <Chip key={index} label={spec} size="small" />
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        Affectations:
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {assignments.length === 0 ? (
                          <Typography variant="body2" color="error">
                            Aucune affectation
                          </Typography>
                        ) : (
                          assignments.map((assignment, index) => {
                            const classItem = classes.find(c => c.id === assignment.classId);
                            const subject = subjects.find(s => s.id === assignment.subjectId);
                            return (
                              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                                • {classItem?.name} - {subject?.name}
                              </Typography>
                            );
                          })
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Nouvel Enseignant - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/teachers')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Créer un nouvel enseignant
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Ajoutez un nouvel enseignant au système
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

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/admin/teachers')}
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
                      {loading ? 'Création...' : 'Créer l\'enseignant'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Suivant
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default CreateTeacher;