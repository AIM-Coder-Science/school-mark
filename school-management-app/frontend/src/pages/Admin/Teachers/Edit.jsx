import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, Autocomplete, Chip, IconButton } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { adminAPI } from '../../../services/api';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';

const EditTeacher = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      specialties: []
    }
  });

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const response = await adminAPI.getTeacher(teacherId);
        const t = response.data.data;
        reset({
          firstName: t.firstName,
          lastName: t.lastName,
          phone: t.phone || '',
          specialties: t.specialties || []
        });
      } catch (error) {
        toast.error("Erreur de chargement");
        navigate('/admin/teachers');
      } finally {
        setLoading(false);
      }
    };
    loadTeacher();
  }, [teacherId, reset]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await adminAPI.updateTeacher(teacherId, data);
      toast.success("Enseignant mis à jour !");
      navigate('/admin/teachers');
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/teachers')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" fontWeight="700">Modifier l'enseignant</Typography>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller name="firstName" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Prénom" error={!!errors.firstName} helperText={errors.firstName?.message} />
              )} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller name="lastName" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nom" error={!!errors.lastName} helperText={errors.lastName?.message} />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="phone" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Téléphone" />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="specialties" control={control} render={({ field }) => (
                <Autocomplete
                  multiple
                  options={['Mathématiques', 'Français', 'Physique', 'Anglais', 'SVT', 'Histoire-Géo']}
                  value={field.value}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} color="primary" />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Spécialités" placeholder="Ajouter..." />}
                />
              )} />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" fullWidth size="large" startIcon={<SaveIcon />} disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default EditTeacher;