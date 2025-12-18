import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  IconButton,
  Slider,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const EditSubject = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const schema = yup.object().shape({
    name: yup.string().required('Le nom de la matière est requis'),
    code: yup.string()
      .required('Le code est requis')
      .matches(/^[A-Z0-9]{3,10}$/, 'Code invalide (3-10 caractères majuscules/chiffres)'),
    coefficient: yup.number()
      .required('Le coefficient est requis')
      .min(1, 'Minimum 1')
      .max(5, 'Maximum 5'),
    description: yup.string(),
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
      name: '',
      code: '',
      coefficient: 2,
      description: '',
    },
  });

  useEffect(() => {
    fetchSubjectData();
  }, [subjectId]);

  const fetchSubjectData = async () => {
    try {
      setInitialLoading(true);
      const response = await adminAPI.getSubject(subjectId);
      const subject = response.data.data;

      setValue('name', subject.name);
      setValue('code', subject.code);
      setValue('coefficient', subject.coefficient || 2);
      setValue('description', subject.description || '');
    } catch (error) {
      console.error('Erreur chargement matière:', error);
      toast.error('Erreur lors du chargement de la matière');
      navigate('/admin/subjects');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const subjectData = {
        name: data.name,
        code: data.code,
        coefficient: data.coefficient,
        description: data.description,
      };

      await adminAPI.updateSubject(subjectId, subjectData);
      
      toast.success('Matière mise à jour avec succès !');
      navigate('/admin/subjects');
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
        <title>Modifier la matière - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/subjects')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Modifier la matière
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Modifiez les informations de la matière
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nom de la matière *"
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          placeholder="Ex: Mathématiques, Physique, Français..."
                          InputProps={{
                            startAdornment: (
                              <BookIcon color="action" sx={{ mr: 1 }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="code"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Code *"
                          error={!!errors.code}
                          helperText={errors.code?.message}
                          placeholder="Ex: MATH, PHY, FR, ANG..."
                          InputProps={{
                            startAdornment: (
                              <CodeIcon color="action" sx={{ mr: 1 }} />
                            ),
                          }}
                          inputProps={{
                            style: { textTransform: 'uppercase' }
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                      Coefficient: <strong>{watch('coefficient')}</strong>
                    </Typography>
                    <Controller
                      name="coefficient"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          {...field}
                          valueLabelDisplay="auto"
                          step={1}
                          marks
                          min={1}
                          max={5}
                          sx={{ maxWidth: 400 }}
                          onChange={(e, value) => field.onChange(value)}
                        />
                      )}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 400, mt: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Mineur (1)
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Majeur (5)
                      </Typography>
                    </Box>
                    {errors.coefficient && (
                      <Typography color="error" variant="caption">
                        {errors.coefficient.message}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Description"
                          multiline
                          rows={3}
                          error={!!errors.description}
                          helperText={errors.description?.message}
                          placeholder="Description optionnelle de la matière..."
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        Le coefficient détermine l'importance de la matière dans le calcul des moyennes.
                        Les matières avec un coefficient plus élevé ont plus de poids dans la moyenne générale.
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/admin/subjects')}
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
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informations importantes
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      À propos des coefficients:
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Coefficient 1: Matières mineures (EPS, Arts)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Coefficient 2: Matières moyennes (Langues, Sciences)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Coefficient 3: Matières majeures (Maths, Français)
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Récapitulatif:
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Nom:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {watch('name') || 'Non défini'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Code:
                      </Typography>
                      <Chip label={watch('code') || 'N/A'} size="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Coefficient:
                      </Typography>
                      <Chip 
                        label={`Coeff. ${watch('coefficient')}`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
};

export default EditSubject;