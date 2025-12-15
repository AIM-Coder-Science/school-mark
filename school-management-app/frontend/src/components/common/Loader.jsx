import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loader = ({ fullScreen = false, message = 'Chargement...' }) => {
  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ mb: 3, color: 'primary.main' }}
        />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress />
    </Box>
  );
};

export default Loader;