import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Email invalide'),
  matricule: yup.string(),
  password: yup.string().required('Mot de passe requis').min(6, 'Minimum 6 caractères'),
}).test('email-or-matricule', 'Email ou matricule requis', (value) => {
  return !!value.email || !!value.matricule;
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'matricule'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      matricule: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    
    // Préparer les données selon la méthode de connexion
    const credentials = {
      password: data.password,
    };
    
    if (loginMethod === 'email') {
      credentials.email = data.email;
    } else {
      credentials.matricule = data.matricule;
    }
    
    const result = await login(credentials);
    setLoading(false);
    
    if (result.success) {
      // Redirection selon le rôle
      const user = JSON.parse(localStorage.getItem('user'));
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      toast.error(result.message || 'Erreur de connexion');
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'matricule' : 'email');
    reset({
      email: '',
      matricule: '',
      password: '',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <SchoolIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, textAlign: 'center' }}>
            Gestion Scolaire
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, textAlign: 'center' }}>
            Connectez-vous à votre espace
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
              Connexion
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Comptes de test:</strong><br />
                • Admin: admin@school.com / Admin123!<br />
                • Enseignant: matricule T001 / Prof123!<br />
                • Étudiant: matricule S001 / Eleve123!
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant={loginMethod === 'email' ? 'contained' : 'outlined'}
                onClick={() => setLoginMethod('email')}
                sx={{ mb: 1 }}
                startIcon={<EmailIcon />}
              >
                Connexion par Email
              </Button>
              <Button
                fullWidth
                variant={loginMethod === 'matricule' ? 'contained' : 'outlined'}
                onClick={() => setLoginMethod('matricule')}
                startIcon={<BadgeIcon />}
              >
                Connexion par Matricule
              </Button>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              {loginMethod === 'email' ? (
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  margin="normal"
                  {...register('email')}
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
              ) : (
                <TextField
                  fullWidth
                  label="Matricule"
                  variant="outlined"
                  margin="normal"
                  {...register('matricule')}
                  error={!!errors.matricule}
                  helperText={errors.matricule?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Link href="#" variant="body2" color="primary">
                  Mot de passe oublié ?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Information
              </Typography>
            </Divider>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note :</strong> Les comptes sont créés par l'administrateur.
                Contactez l'administration si vous n'avez pas de compte.
              </Typography>
            </Alert>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                © 2024 School Management System - Tous droits réservés
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;