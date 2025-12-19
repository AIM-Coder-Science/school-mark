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
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const EditStudent = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  const schema = yup.object().shape({
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide').nullable(),
    birthDate: yup.string().nullable(),
    classId: yup.number().required('La classe est requise'),
    parentName: yup.string().nullable(),
    parentPhone: yup.string().nullable(),
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
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      birthDate: '',
      classId: '',
      parentName: '',
      parentPhone: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      
      const [studentRes, classesRes] = await Promise.all([
        adminAPI.getStudent(studentId),
        adminAPI.getAllClasses(),
      ]);

      const student = studentRes.data.data;
      
      // Pré-remplir le formulaire
      setValue('firstName', student.firstName);
      setValue('lastName', student.lastName);
      setValue('matricule', student.matricule);
      setValue('email', student.email || '');
      setValue('birthDate', student.birthDate || '');
      setValue('classId', student.classId);
      setValue('parentName', student.parentName || '');
      setValue('parentPhone', student.parentPhone || '');

      setClasses(classesRes.data.data || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
      navigate('/admin/students');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const studentData = {
        firstName: data.firstName,
        lastName: data.lastName,
        matricule: data.matricule,
        email: data.email || null,
        birthDate: data.birthDate || null,
        classId: parseInt(data.classId),
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
      };

      await adminAPI.updateStudent(studentId, studentData);
      
      toast.success('Apprenant mis à jour avec succès !');
      navigate('/admin/students');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
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
        <title>Modifier l'apprenant - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/students')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Modifier l'apprenant
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Modifiez les informations de l'apprenant
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Informations personnelles */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Informations personnelles
                </Typography>
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
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Date de naissance"
                      type="date"
                      error={!!errors.birthDate}
                      helperText={errors.birthDate?.message}
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

              {/* Classe */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                  Classe
                </Typography>
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

              {/* Parents */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                  Informations des parents/tuteurs
                </Typography>
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
                      
                      {watch('classId') && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Classe:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {(() => {
                              const selectedClass = classes.find(c => c.id === parseInt(watch('classId')));
                              return selectedClass ? `${selectedClass.name} (${selectedClass.level})` : 'Non spécifiée';
                            })()}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
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

export default EditStudent;