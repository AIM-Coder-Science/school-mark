import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  Numbers as NumbersIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const CreateSubject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const subjectData = {
        name: data.name,
        code: data.code,
        coefficient: data.coefficient,
        description: data.description,
      };

      const response = await adminAPI.createSubject(subjectData);
      
      toast.success('Matière créée avec succès !');
      navigate('/admin/subjects');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Nouvelle Matière - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/subjects')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Créer une nouvelle matière
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Ajoutez une nouvelle matière au système
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
                      Coefficient: <strong>{control._formValues.coefficient || 2}</strong>
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
                        {loading ? 'Création...' : 'Créer la matière'}
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
                      Exemples de codes:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Chip label="MATH" size="small" sx={{ mb: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip label="PHY" size="small" sx={{ mb: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip label="CHIM" size="small" sx={{ mb: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip label="FR" size="small" sx={{ mb: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip label="ANG" size="small" sx={{ mb: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip label="HG" size="small" sx={{ mb: 1 }} />
                      </Grid>
                    </Grid>
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

export default CreateSubject;