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
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
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
  
  // État pour stocker TOUTES les valeurs du formulaire
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    matricule: '',
    email: '',
    birthDate: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    temporaryPassword: 'Student123!',
  });

  // Schéma de validation
  const schema = yup.object().shape({
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide').nullable(),
    birthDate: yup.string().nullable(),
    classId: yup.mixed().required('La classe est requise'),
    parentName: yup.string().nullable(),
    parentPhone: yup.string().nullable(),
    temporaryPassword: yup.string().required('Le mot de passe temporaire est requis').min(6, 'Minimum 6 caractères'),
  });

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: formValues,
    mode: 'onChange',
  });

  useEffect(() => {
    fetchClasses();
    
    // Initialiser les valeurs du formulaire avec formValues
    Object.keys(formValues).forEach(key => {
      setValue(key, formValues[key]);
    });
  }, []);

  // Mettre à jour formValues quand une valeur change
  const updateFormValue = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    setValue(field, value);
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllClasses();
      console.log('Classes chargées:', response.data.data);
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement classes:', error);
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate = [];
    
    if (activeStep === 0) {
      fieldsToValidate = ['firstName', 'lastName', 'matricule'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['classId'];
    } else if (activeStep === 2) {
      fieldsToValidate = ['temporaryPassword'];
    }
    
    console.log('Validation step', activeStep, 'champs:', fieldsToValidate);
    
    // Vérifier que les champs sont remplis dans formValues
    const areFieldsFilled = fieldsToValidate.every(field => {
      const value = formValues[field];
      console.log(`Champ ${field}:`, value);
      return value && value.toString().trim() !== '';
    });
    
    console.log('Champs remplis?', areFieldsFilled);
    
    if (!areFieldsFilled) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Valider avec Yup
    try {
      await schema.validateAt(fieldsToValidate[0], formValues);
      setActiveStep((prev) => prev + 1);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validateAllFields = async () => {
    try {
      await schema.validate(formValues, { abortEarly: false });
      return { isValid: true, errors: {} };
    } catch (validationErrors) {
      const errors = {};
      if (validationErrors.inner) {
        validationErrors.inner.forEach(error => {
          errors[error.path] = error.message;
        });
      }
      return { isValid: false, errors };
    }
  };

  const onSubmit = async () => {
    console.log('🚀 Début de la soumission avec formValues:', formValues);
    
    // Valider toutes les données
    const validation = await validateAllFields();
    
    if (!validation.isValid) {
      console.error('❌ Formulaire invalide. Erreurs:', validation.errors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    try {
      setLoading(true);
      
      const studentData = {
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        matricule: formValues.matricule.trim(),
        email: formValues.email ? formValues.email.trim() : null,
        birthDate: formValues.birthDate || null,
        classId: parseInt(formValues.classId),
        parentName: formValues.parentName ? formValues.parentName.trim() : null,
        parentPhone: formValues.parentPhone ? formValues.parentPhone.trim() : null,
        temporaryPassword: formValues.temporaryPassword,
      };

      console.log('📤 Données envoyées au serveur:', studentData);

      const response = await adminAPI.createStudent(studentData);
      
      console.log('✅ Réponse du serveur:', response);
      
      toast.success('Apprenant créé avec succès !');
      
      if (response.data.credentials) {
        toast(
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Identifiants créés :
            </Typography>
            <Typography variant="body2">
              <strong>Identifiant:</strong> {response.data.credentials.email}
            </Typography>
            <Typography variant="body2">
              <strong>Mot de passe:</strong> {response.data.credentials.password}
            </Typography>
          </Box>,
          { duration: 10000 }
        );
      }
      
      setTimeout(() => {
        navigate('/admin/students');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      console.error('📡 Réponse erreur:', error.response);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'apprenant');
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
                Remplissez les informations personnelles de l'apprenant. Les champs marqués d'un * sont obligatoires.
              </Alert>
            </Grid>

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
                    value={formValues.firstName}
                    onChange={(e) => updateFormValue('firstName', e.target.value)}
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
                    value={formValues.lastName}
                    onChange={(e) => updateFormValue('lastName', e.target.value)}
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
                    value={formValues.matricule}
                    onChange={(e) => updateFormValue('matricule', e.target.value)}
                    placeholder="Ex: S2024001"
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
                    label="Email (optionnel)"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    value={formValues.email}
                    onChange={(e) => updateFormValue('email', e.target.value)}
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
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date de naissance (optionnel)"
                    type="date"
                    error={!!errors.birthDate}
                    helperText={errors.birthDate?.message}
                    value={formValues.birthDate}
                    onChange={(e) => updateFormValue('birthDate', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
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
                      value={formValues.classId || ''}
                      onChange={(e) => {
                        updateFormValue('classId', e.target.value);
                        console.log("Classe sélectionnée ID:", e.target.value);
                      }}
                    >
                      <MenuItem value="">
                        <em>Sélectionner une classe</em>
                      </MenuItem>
                      {classes.map((classItem) => (
                        <MenuItem key={classItem.id} value={classItem.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography variant="body1">
                              {classItem.name} ({classItem.level})
                            </Typography>
                            {classItem.principalTeacher && (
                              <Typography variant="caption" color="textSecondary">
                                - Prof: {classItem.principalTeacher.firstName} {classItem.principalTeacher.lastName}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.classId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
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
                    label="Nom du parent/tuteur (optionnel)"
                    value={formValues.parentName}
                    onChange={(e) => updateFormValue('parentName', e.target.value)}
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
                    label="Téléphone du parent (optionnel)"
                    value={formValues.parentPhone}
                    onChange={(e) => updateFormValue('parentPhone', e.target.value)}
                    placeholder="Ex: +229 XX XX XX XX"
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
            
            {formValues.classId && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Informations de la classe sélectionnée
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    {(() => {
                      const selectedClass = classes.find(c => c.id === parseInt(formValues.classId));
                      return selectedClass ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Classe:</strong> {selectedClass.name} ({selectedClass.level})
                          </Typography>
                          {selectedClass.principalTeacher && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Professeur principal:</strong> {selectedClass.principalTeacher.firstName} {selectedClass.principalTeacher.lastName}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Nombre d'étudiants:</strong> {Array.isArray(selectedClass.students) ? selectedClass.students.length : 0}
                          </Typography>
                          {Array.isArray(selectedClass.classSubjects) && selectedClass.classSubjects.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Matières ({selectedClass.classSubjects.length}):</strong>
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selectedClass.classSubjects.slice(0, 6).map((subject) => (
                                  <Chip key={subject.id} label={subject.name} size="small" color="primary" variant="outlined" />
                                ))}
                                {selectedClass.classSubjects.length > 6 && (
                                  <Chip label={`+${selectedClass.classSubjects.length - 6}`} size="small" />
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
                    value={formValues.temporaryPassword}
                    onChange={(e) => updateFormValue('temporaryPassword', e.target.value)}
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
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Récapitulatif
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Nom complet:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formValues.firstName} {formValues.lastName}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Matricule:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formValues.matricule}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Email:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formValues.email || 'Non fourni'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Date de naissance:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formValues.birthDate ? new Date(formValues.birthDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </Typography>
                    </Grid>
                    
                    {formValues.classId && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          Classe:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {(() => {
                            const selectedClass = classes.find(c => c.id === parseInt(formValues.classId));
                            return selectedClass ? `${selectedClass.name} (${selectedClass.level})` : 'Non spécifiée';
                          })()}
                        </Typography>
                      </Grid>
                    )}
                    
                    {formValues.parentName && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Parent/Tuteur:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formValues.parentName}
                        </Typography>
                      </Grid>
                    )}
                    
                    {formValues.parentPhone && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          Téléphone parent:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formValues.parentPhone}
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

          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}>
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
                      disabled={loading}
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
                      {loading ? 'Création en cours...' : 'Créer l\'apprenant'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
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