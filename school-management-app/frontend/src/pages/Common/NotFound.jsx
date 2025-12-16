import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <>
      <Helmet>
        <title>Page non trouvée - 404</title>
      </Helmet>

      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', md: '10rem' },
              fontWeight: 700,
              color: 'primary.main',
              mb: 2,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary',
            }}
          >
            Page non trouvée
          </Typography>

          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ mb: 4, maxWidth: 500 }}
          >
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            Vérifiez l'URL ou retournez à l'accueil.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              size="large"
            >
              Retour
            </Button>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate(getHomePath())}
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                },
              }}
            >
              Accueil
            </Button>
          </Box>

          <Box
            sx={{
              mt: 6,
              width: '100%',
              maxWidth: 400,
              opacity: 0.3,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 500 400"
              fill="currentColor"
            >
              <circle cx="250" cy="200" r="150" opacity="0.1" />
              <path
                d="M200 150 L300 150 L300 250 L200 250 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.3"
              />
              <circle cx="230" cy="180" r="10" />
              <circle cx="270" cy="180" r="10" />
              <path
                d="M220 220 Q250 240 280 220"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default NotFound;