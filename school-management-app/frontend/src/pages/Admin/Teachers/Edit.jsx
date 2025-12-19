import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Autocomplete,
  Alert,
  Divider,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  LockReset as ResetIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const specialtyOptions = [
  'Mathématiques', 'Physique', 'Chimie', 'Sciences', 'Français', 'Anglais',
  'Histoire-Géographie', 'Philosophie', 'Éducation Physique', 'Informatique',
  'Technologie', 'Arts Plastiques', 'Musique',
];

const EditTeacher = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('Teacher123!');

  const schema = yup.object().shape({
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide').nullable().transform((v) => v === "" ? null : v),
    phone: yup.string().nullable(),
    specialties: yup.array().min(1, 'Au moins une spécialité est requise').required(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      phone: '',
      specialties: [],
    },
  });

  // On surveille les valeurs pour le récapitulatif
  const watchedValues = watch();

  useEffect(() => {
    if (teacherId) {
      fetchTeacherData();
    }
  }, [teacherId]);

  const fetchTeacherData = async () => {
    try {
      setInitialLoading(true);
      const response = await adminAPI.getTeacher(teacherId);
      const teacher = response.data.data;

      setValue('firstName', teacher.firstName || '');
      setValue('lastName', teacher.lastName || '');
      setValue('matricule', teacher.matricule || '');
      setValue('email', teacher.email || '');
      setValue('phone', teacher.phone || '');
      
      // Gestion sécurisée des spécialités (String ou Array)
      let specs = teacher.specialties;
      if (typeof specs === 'string') {
        try { specs = JSON.parse(specs); } catch (e) { specs = []; }
      }
      setValue('specialties', Array.isArray(specs) ? specs : []);
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Impossible de charger les données');
      navigate('/admin/teachers');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await adminAPI.updateTeacher(teacherId, data);
      toast.success('Enseignant mis à jour !');
      navigate('/admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      // Supposons que ton API admin a cette route
      await adminAPI.resetUserPassword(teacherId, { password: newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
      setOpenResetDialog(false);
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Loader />;

  return (
    <>
      <Helmet><title>Modifier Enseignant | Admin</title></Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/teachers')}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Modifier {watchedValues.firstName} {watchedValues.lastName}
            </Typography>
            <Typography variant="body2" color="textSecondary">Matricule : {watchedValues.matricule}</Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Prénom *" error={!!errors.firstName} helperText={errors.firstName?.message} />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Nom *" error={!!errors.lastName} helperText={errors.lastName?.message} />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="matricule"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Matricule *" error={!!errors.matricule} helperText={errors.matricule?.message} />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label="Email" error={!!errors.email} helperText={errors.email?.message} />}
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
                      value={field.value || []}
                      onChange={(_, val) => field.onChange(val)}
                      renderInput={(params) => <TextField {...params} label="Spécialités *" error={!!errors.specialties} helperText={errors.specialties?.message} />}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return <Chip key={key} label={option} size="small" {...tagProps} />;
                        })
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResetIcon fontSize="small" /> Zone de sécurité
                </Typography>
                <Card variant="outlined" sx={{ borderColor: 'error.light', bgcolor: '#fff5f5' }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">Réinitialiser le mot de passe</Typography>
                      <Typography variant="caption" color="textSecondary">L'enseignant devra utiliser le nouveau mot de passe pour se connecter.</Typography>
                    </Box>
                    <Button variant="outlined" color="error" onClick={() => setOpenResetDialog(true)}>Réinitialiser</Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button variant="outlined" onClick={() => navigate('/admin/teachers')}>Annuler</Button>
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading} sx={{ px: 4 }}>
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* Dialogue de réinitialisation */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Nouveau mot de passe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Définissez un mot de passe temporaire pour cet enseignant.</Typography>
          <TextField
            fullWidth
            variant="outlined"
            label="Mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Annuler</Button>
          <Button onClick={handleResetPassword} color="error" variant="contained">Confirmer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditTeacher;