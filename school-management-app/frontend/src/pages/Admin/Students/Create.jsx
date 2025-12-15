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
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const steps = ['Informations personnelles', 'Classe et parents', 'Identifiants'];

const CreateStudent = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState(null);

  const schema = yup.object().shape({
    // Step 1
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide'),
    birthDate: yup.date().nullable(),
    
    // Step 2
    classId: yup.string().required('La classe est requise'),
    parentName: yup.string(),
    parentPhone: yup.string(),
    
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
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      birthDate: null,
      classId: '',
      parentName: '',
      parentPhone: '',
      temporaryPassword: 'Student123!',
    },
    context: { activeStep },
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getClasses();
      setClasses(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des classes');
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const studentData = {
        firstName: data.firstName,
        lastName: data.lastName,
        matricule: data.matricule,
        email: data.email,
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : null,
        classId: data.classId,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        temporaryPassword: data.temporaryPassword,
      };

      const response = await adminAPI.createStudent(studentData);
      
      toast.success('Apprenant créé avec succès !');
      
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
      
      navigate('/admin/students');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
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
                    placeholder="Ex: S2023001"
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Date de naissance"
                      value={field.value}
                      onChange={field.onChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.birthDate}
                          helperText={errors.birthDate?.message}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Sélectionnez la classe de l'apprenant et renseignez les informations des parents/tuteurs.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="classId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.classId}>
                    <InputLabel>Classe *</InputLabel>
                    <Select
                      {...field}
                      label="Classe *"
                    >
                      <MenuItem value="">Sélectionner une classe</MenuItem>
                      {classes.map((classItem) => (
                        <MenuItem key={classItem.id} value={classItem.id}>
                          {classItem.name} ({classItem.level})
                          {classItem.principalTeacher && (
                            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                              - Prof principal: {classItem.principalTeacher.firstName} {classItem.principalTeacher.lastName}
                            </Typography>
                          )}
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
                name="parentName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nom du parent/tuteur"
                    placeholder="Ex: M. Dupont Jean"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="parentPhone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Téléphone du parent"
                    placeholder="Ex: +243 81 234 5678"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            
            {watch('classId') && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Informations de la classe sélectionnée
                    </Typography>
                    {(() => {
                      const selectedClass = classes.find(c => c.id.toString() === watch('classId'));
                      return selectedClass ? (
                        <Box>
                          <Typography variant="body2">
                            <strong>Classe:</strong> {selectedClass.name} ({selectedClass.level})
                          </Typography>
                          {selectedClass.principalTeacher && (
                            <Typography variant="body2">
                              <strong>Professeur principal:</strong> {selectedClass.principalTeacher.firstName} {selectedClass.principalTeacher.lastName}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            <strong>Nombre d'étudiants:</strong> {Array.isArray(selectedClass.students) ? selectedClass.students.length : 0}
                          </Typography>
                          {Array.isArray(selectedClass.subjects) && selectedClass.subjects.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                <strong>Matières:</strong>
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {selectedClass.subjects.slice(0, 5).map((subject, index) => (
                                  <Chip key={index} label={subject.name} size="small" />
                                ))}
                                {selectedClass.subjects.length > 5 && (
                                  <Chip label={`+${selectedClass.subjects.length - 5}`} size="small" />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
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
                  Ces identifiants seront communiqués à l'apprenant pour sa première connexion.
                  Il pourra se connecter avec son email (si fourni) ou son matricule.
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
                        Date de naissance:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {watch('birthDate') ? new Date(watch('birthDate')).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </Typography>
                    </Grid>
                    
                    {watch('classId') && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          Classe:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {(() => {
                            const selectedClass = classes.find(c => c.id.toString() === watch('classId'));
                            return selectedClass ? `${selectedClass.name} (${selectedClass.level})` : 'Non spécifiée';
                          })()}
                        </Typography>
                      </Grid>
                    )}
                    
                    {watch('parentName') && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Parent/Tuteur:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {watch('parentName')}
                        </Typography>
                      </Grid>
                    )}
                    
                    {watch('parentPhone') && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Téléphone parent:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {watch('parentPhone')}
                        </Typography>
                      </Grid>
                    )}
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

  if (loading && !classes.length) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Nouvel Apprenant - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/students')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Créer un nouvel apprenant
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Ajoutez un nouvel apprenant au système
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
                      onClick={() => navigate('/admin/students')}
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
                      {loading ? 'Création...' : 'Créer l\'apprenant'}
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

export default CreateStudent;