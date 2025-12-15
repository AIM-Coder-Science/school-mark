import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Loader from '../common/Loader';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { loading } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            md: `calc(100% - ${sidebarOpen ? 260 : 70}px)` 
          },
          marginLeft: {
            xs: 0,
            md: sidebarOpen ? '260px' : '70px'
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginTop: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;