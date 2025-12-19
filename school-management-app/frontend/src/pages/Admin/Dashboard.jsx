import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  PersonAdd as PersonAddIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { adminAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon, color, progress, onClick }) => (
  <Card 
    sx={{ 
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': { 
        transform: 'translateY(-4px)',
        cursor: onClick ? 'pointer' : 'default'
      }
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
          {icon}
        </Avatar>
      </Box>
      {progress !== undefined && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: `${color}.light`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: `${color}.main`,
              }
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

const QuickAction = ({ icon, title, description, action, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText`, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1, mb: 2 }}>
        {description}
      </Typography>
      <CardActions sx={{ p: 0 }}>
        <Button 
          size="small" 
          color={color}
          endIcon={<ArrowForwardIcon />}
          onClick={action}
          fullWidth
        >
          Accéder
        </Button>
      </CardActions>
    </CardContent>
  </Card>
);

const RecentActivityItem = ({ icon, title, description, time, color = 'primary' }) => (
  <ListItem sx={{ px: 0 }}>
    <ListItemAvatar>
      <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
        {icon}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={
        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
      }
      secondary={
        <React.Fragment>
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {time}
          </Typography>
        </React.Fragment>
      }
    />
  </ListItem>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, teachersResponse, studentsResponse, classesResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllTeachers(),
        adminAPI.getAllStudents(),
        adminAPI.getAllClasses(),
      ]);

      setStats(statsResponse.data.data);

      // Simuler des activités récentes
      const activities = [
        {
          icon: <PersonAddIcon />,
          title: 'Nouvel enseignant',
          description: 'Jean Dupont a été ajouté',
          time: 'Il y a 2 heures',
          color: 'success',
        },
        {
          icon: <SchoolIcon />,
          title: 'Nouvel apprenant',
          description: 'Marie Curie a été inscrite',
          time: 'Il y a 4 heures',
          color: 'info',
        },
        {
          icon: <ClassIcon />,
          title: 'Nouvelle classe',
          description: 'Classe 6ème A créée',
          time: 'Il y a 1 jour',
          color: 'warning',
        },
        {
          icon: <NotificationsIcon />,
          title: 'Nouvelle publication',
          description: 'Information importante publiée',
          time: 'Il y a 2 jours',
          color: 'primary',
        },
      ];

      setRecentActivities(activities);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: <PersonAddIcon />,
      title: 'Ajouter un enseignant',
      description: 'Créer un nouveau compte enseignant',
      action: () => window.location.href = '/admin/teachers/new',
      color: 'primary',
    },
    {
      icon: <SchoolIcon />,
      title: 'Ajouter un apprenant',
      description: 'Inscrire un nouvel apprenant',
      action: () => window.location.href = '/admin/students/new',
      color: 'success',
    },
    {
      icon: <ClassIcon />,
      title: 'Créer une classe',
      description: 'Ajouter une nouvelle classe',
      action: () => window.location.href = '/admin/classes/new',
      color: 'warning',
    },
    {
      icon: <SubjectIcon />,
      title: 'Ajouter une matière',
      description: 'Créer une nouvelle matière',
      action: () => window.location.href = '/admin/subjects/new',
      color: 'info',
    },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Tableau de bord - Admin</title>
      </Helmet>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            Tableau de bord Administrateur
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Bienvenue dans votre espace d'administration
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={fetchDashboardData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Enseignants"
            value={stats?.users?.teacher || 0}
            icon={<PeopleIcon />}
            color="primary"
            progress={75}
            onClick={() => window.location.href = '/admin/teachers'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Apprenants"
            value={stats?.users?.student || 0}
            icon={<SchoolIcon />}
            color="success"
            progress={60}
            onClick={() => window.location.href = '/admin/students'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Classes"
            value={stats?.totals?.classes || 0}
            icon={<BookIcon />}
            color="warning"
            progress={85}
            onClick={() => window.location.href = '/admin/classes'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Publications"
            value={stats?.totals?.publications || 0}
            icon={<NotificationsIcon />}
            color="info"
            progress={45}
            onClick={() => window.location.href = '/admin/publications'}
          />
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Actions rapides
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <QuickAction {...action} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Activités récentes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Activités récentes
              </Typography>
              <Chip 
                icon={<TrendingUpIcon />} 
                label="Aujourd'hui" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <List sx={{ p: 0 }}>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={index}>
                  <RecentActivityItem {...activity} />
                  {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Vue d'ensemble */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Vue d'ensemble
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Taux d'activité
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={85} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 1 
                }}
              />
              <Typography variant="body2" sx={{ textAlign: 'right' }}>
                85%
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Utilisateurs actifs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                98%
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Performance système
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Excellente
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default AdminDashboard;
