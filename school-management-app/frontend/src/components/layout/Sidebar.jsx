import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState({});

  const handleMenuClick = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const getAdminMenu = () => [
    { 
      text: 'Tableau de bord', 
      icon: <DashboardIcon />, 
      path: '/admin/dashboard' 
    },
    {
      text: 'Enseignants',
      icon: <PeopleIcon />,
      path: '/admin/teachers',
      submenu: [
        { text: 'Liste des enseignants', path: '/admin/teachers' },
        { text: 'Ajouter un enseignant', path: '/admin/teachers/new' },
      ],
    },
    {
      text: 'Apprenants',
      icon: <SchoolIcon />,
      path: '/admin/students',
      submenu: [
        { text: 'Liste des apprenants', path: '/admin/students' },
        { text: 'Ajouter un apprenant', path: '/admin/students/new' },
      ],
    },
    {
      text: 'Classes',
      icon: <BookIcon />,
      path: '/admin/classes',
      submenu: [
        { text: 'Liste des classes', path: '/admin/classes' },
        { text: 'Ajouter une classe', path: '/admin/classes/new' },
      ],
    },
    {
      text: 'Matières',
      icon: <AssignmentIcon />,
      path: '/admin/subjects',
      submenu: [
        { text: 'Liste des matières', path: '/admin/subjects' },
        { text: 'Ajouter une matière', path: '/admin/subjects/new' },
      ],
    },
    {
      text: 'Publications',
      icon: <NotificationsIcon />,
      path: '/admin/publications',
    },
    {
      text: 'Statistiques',
      icon: <AssessmentIcon />,
      path: '/admin/stats',
    },
  ];

  const getTeacherMenu = () => [
    { 
      text: 'Tableau de bord', 
      icon: <DashboardIcon />, 
      path: '/teacher/dashboard' 
    },
    {
      text: 'Mes Classes',
      icon: <SchoolIcon />,
      path: '/teacher/classes',
    },
    {
      text: 'Notes',
      icon: <AssignmentIcon />,
      path: '/teacher/grades',
    },
    {
      text: 'Publications',
      icon: <NotificationsIcon />,
      path: '/teacher/publications',
    },
    {
      text: 'Professeur Principal',
      icon: <PeopleIcon />,
      path: '/teacher/principal',
      submenu: [
        { text: 'Moyennes générales', path: '/teacher/principal/averages' },
        { text: 'Appréciations', path: '/teacher/principal/appreciations' },
      ],
    },
  ];

  const getStudentMenu = () => [
    { 
      text: 'Tableau de bord', 
      icon: <DashboardIcon />, 
      path: '/student/dashboard' 
    },
    {
      text: 'Mes Notes',
      icon: <AssignmentIcon />,
      path: '/student/grades',
    },
    {
      text: 'Bulletins',
      icon: <AssessmentIcon />,
      path: '/student/bulletins',
    },
    {
      text: 'Actualités',
      icon: <NotificationsIcon />,
      path: '/student/news',
    },
    {
      text: 'Classement',
      icon: <SchoolIcon />,
      path: '/student/ranking',
    },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin': return getAdminMenu();
      case 'teacher': return getTeacherMenu();
      case 'student': return getStudentMenu();
      default: return [];
    }
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item, depth = 0) => {
    const isActive = location.pathname === item.path || 
      (item.submenu && item.submenu.some(sub => location.pathname === sub.path));
    
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openMenus[item.text] || isActive;

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => {
              if (hasSubmenu) {
                handleMenuClick(item.text);
              } else {
                navigate(item.path);
                if (isMobile) onClose();
              }
            }}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              pl: depth > 0 ? 4 + depth * 2 : 2.5,
              backgroundColor: isActive ? 'primary.light' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: isActive ? 'primary.main' : 'action.hover',
              },
              borderRadius: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
                color: isActive ? 'primary.contrastText' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            
            {open && (
              <>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                {hasSubmenu && (
                  isSubmenuOpen ? <ExpandLess /> : <ExpandMore />
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>

        {hasSubmenu && open && (
          <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu.map(subItem => renderMenuItem(subItem, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: open ? 260 : 70,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 260 : 70,
          boxSizing: 'border-box',
          borderRight: 'none',
          backgroundColor: '#ffffff',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        {open ? (
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            SchoolManager
          </Typography>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            SM
          </Typography>
        )}
      </Box>

      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map(item => renderMenuItem(item))}
      </List>

      <Divider sx={{ my: 1 }} />

      <List sx={{ px: 1 }}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => navigate('/settings')}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              borderRadius: 1,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
              }}
            >
              <SettingsIcon />
            </ListItemIcon>
            {open && (
              <ListItemText 
                primary="Paramètres" 
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </List>

      {open && (
        <Box sx={{ 
          p: 2, 
          mt: 'auto',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            © 2024 SchoolManager
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Version 1.0.0
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;