import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'teacher': return 'Enseignant';
      case 'student': return 'Apprenant';
      default: return 'Utilisateur';
    }
  };

  const getInitials = () => {
    if (!user?.profile) return 'U';
    const { firstName, lastName } = user.profile;
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: '#333',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={toggleSidebar}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ height: 40, marginRight: 16 }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
              Gestion Scolaire
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              {sidebarOpen ? 'Tableau de bord complet' : 'Tableau de bord'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                cursor: 'pointer',
              }}
              onClick={handleMenuOpen}
            >
              {getInitials()}
            </Avatar>
            
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.profile?.firstName} {user?.profile?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {getRoleName(user?.role)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          <MenuItem onClick={handleProfileClick}>
            <PersonIcon sx={{ mr: 2, fontSize: 20 }} />
            Mon Profil
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
            Paramètres
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
            Déconnexion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;