import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  EmojiEvents as TrophyIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../../services/api';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card 
    sx={{ 
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': { 
        transform: onClick ? 'translateY(-4px)' : 'none',
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
    </CardContent>
  </Card>
);

const TeacherPrincipalDashboard = () => {
  const navigate = useNavigate();
  const [principalClasses, setPrincipalClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getPrincipalClasses();
      setPrincipalClasses(response.data.data || []);
      
      // Calculer les statistiques
      if (response.data.data && response.data.data.length > 0) {
        const totalStudents = response.data.data.reduce((sum, cls) => 
          sum + (cls.students?.length || 0), 0
        );
        
        setClassStats({
          totalClasses: response.data.data.length,
          totalStudents: totalStudents,
          totalSubjects: response.data.data[0]?.subjects?.length || 0,
        });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Tableau de bord - Professeur Principal</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Tableau de bord Professeur Principal
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Gestion de vos classes principales
            </Typography>
          </Box>
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {principalClasses.length === 0 ? (
          <Alert severity="info">
            Vous n'êtes professeur principal d'aucune classe. Contactez l'administrateur si nécessaire.
          </Alert>
        ) : (
          <>
            {/* Statistiques */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Classes principales"
                  value={classStats?.totalClasses || 0}
                  icon={<SchoolIcon />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Total étudiants"
                  value={classStats?.totalStudents || 0}
                  icon={<PeopleIcon />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Matières"
                  value={classStats?.totalSubjects || 0}
                  icon={<AssessmentIcon />}
                  color="info"
                />
              </Grid>
            </Grid>

            {/* Mes classes principales */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Mes Classes Principales
            </Typography>

            <Grid container spacing={3}>
              {principalClasses.map((classItem) => (
                <Grid item xs={12} md={6} key={classItem.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {classItem.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {classItem.level}
                          </Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                            <PeopleIcon color="success" sx={{ fontSize: 30, mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {classItem.students?.length || 0}
                            </Typography>
                            <Typography variant="caption">Étudiants</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                            <AssessmentIcon color="info" sx={{ fontSize: 30, mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {classItem.subjects?.length || 0}
                            </Typography>
                            <Typography variant="caption">Matières</Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PeopleIcon />}
                          onClick={() => toast.info('Voir les étudiants')}
                        >
                          Étudiants
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<GradeIcon />}
                          onClick={() => toast.info('Calculer moyennes')}
                        >
                          Moyennes
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Responsabilités du prof principal */}
            <Paper sx={{ p: 3, borderRadius: 2, mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Vos Responsabilités
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                      <TrophyIcon color="primary" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Calcul des moyennes générales"
                    secondary="Vous pouvez calculer et valider les moyennes générales de tous les étudiants"
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <AssessmentIcon color="success" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Accès aux notes de toutes les matières"
                    secondary="Consultez toutes les notes de votre classe pour un suivi complet"
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.light' }}>
                      <GradeIcon color="info" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Ajout d'appréciations"
                    secondary="Ajoutez des appréciations générales sur les bulletins de vos étudiants"
                  />
                </ListItem>
              </List>
            </Paper>
          </>
        )}
      </Box>
    </>
  );
};

export default TeacherPrincipalDashboard;