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
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  Grade as GradeIcon,
  Class as ClassIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
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
          {subtitle && (
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
    {onClick && (
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button size="small" endIcon={<ArrowForwardIcon />} color={color}>
          Voir détails
        </Button>
      </CardActions>
    )}
  </Card>
);

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentGrades, setRecentGrades] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, classesResponse] = await Promise.all([
        teacherAPI.getTeacherStats(),
        teacherAPI.getMyClasses(),
      ]);

      setStats(statsResponse.data.data);
      setClasses(classesResponse.data.data || []);

      // Simuler des notes récentes
      setRecentGrades([
        {
          id: 1,
          student: { firstName: 'Marie', lastName: 'Curie' },
          subject: { name: 'Mathématiques' },
          score: 18,
          examType: 'devoir',
          date: new Date().toISOString(),
        },
        {
          id: 2,
          student: { firstName: 'Albert', lastName: 'Einstein' },
          subject: { name: 'Physique' },
          score: 16,
          examType: 'interro',
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 3,
          student: { firstName: 'Isaac', lastName: 'Newton' },
          subject: { name: 'Mathématiques' },
          score: 14,
          examType: 'composition',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const gradeChartData = {
    labels: ['0-5', '6-9', '10-12', '13-15', '16-20'],
    datasets: [
      {
        label: 'Distribution des notes',
        data: [2, 5, 12, 8, 3],
        backgroundColor: [
          '#f44336',
          '#ff9800',
          '#ffeb3b',
          '#4caf50',
          '#2196f3',
        ],
        borderWidth: 1,
      },
    ],
  };

  const performanceData = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    datasets: [
      {
        label: 'Notes ajoutées',
        data: [12, 19, 8, 15, 10, 5],
        backgroundColor: 'rgba(33, 150, 243, 0.5)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Tableau de bord - Enseignant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Tableau de bord Enseignant
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Bienvenue, {stats?.teacher?.firstName} {stats?.teacher?.lastName}
            </Typography>
          </Box>
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Statistiques principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Classes assignées"
              value={stats?.stats?.totalClasses || 0}
              icon={<ClassIcon />}
              color="primary"
              onClick={() => navigate('/teacher/classes')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Étudiants totaux"
              value={stats?.stats?.totalStudents || 0}
              icon={<PeopleIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Score"
              value={stats?.teacher?.score || 0}
              icon={<TrendingUpIcon />}
              color="warning"
              subtitle="étudiants ayant la moyenne"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Notes ajoutées"
              value={stats?.stats?.recentGradesCount || 0}
              icon={<AssignmentIcon />}
              color="info"
              subtitle="ces 7 derniers jours"
              onClick={() => navigate('/teacher/grades')}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Mes classes */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Mes Classes
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/teacher/classes')}
                  endIcon={<ArrowForwardIcon />}
                >
                  Voir toutes
                </Button>
              </Box>

              <Grid container spacing={2}>
                {classes.slice(0, 4).map((classItem) => (
                  <Grid item xs={12} sm={6} key={classItem.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SchoolIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {classItem.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Niveau: {classItem.level}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Étudiants: {classItem.studentsCount}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            Matières enseignées:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {classItem.subjects?.slice(0, 3).map((subject, index) => (
                              <Chip key={index} label={subject.name} size="small" />
                            ))}
                            {classItem.subjects?.length > 3 && (
                              <Chip label={`+${classItem.subjects.length - 3}`} size="small" />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                          fullWidth
                        >
                          Accéder à la classe
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {classes.length === 0 && (
                <Alert severity="info">
                  Aucune classe assignée. Contactez l'administrateur.
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Notes récentes */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Notes récentes
              </Typography>
              
              <List sx={{ p: 0 }}>
                {recentGrades.map((grade, index) => (
                  <React.Fragment key={grade.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: grade.score >= 10 ? 'success.light' : 'error.light',
                          color: grade.score >= 10 ? 'success.contrastText' : 'error.contrastText'
                        }}>
                          <GradeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {grade.student.firstName} {grade.student.lastName}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="textSecondary">
                              {grade.subject.name} • {grade.score}/20
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(grade.date).toLocaleDateString('fr-FR')} • {grade.examType}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Chip
                        label={`${grade.score}/20`}
                        size="small"
                        color={grade.score >= 10 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </ListItem>
                    {index < recentGrades.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>

              {recentGrades.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                  Aucune note ajoutée récemment
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Graphiques */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Distribution des notes
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut 
                  data={gradeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Activité hebdomadaire
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={performanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 5,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Actions rapides */}
        <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Actions rapides
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/teacher/grades/new')}
                sx={{ py: 1.5 }}
              >
                Ajouter une note
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClassIcon />}
                onClick={() => navigate('/teacher/classes')}
                sx={{ py: 1.5 }}
              >
                Voir mes classes
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => navigate('/teacher/publications')}
                sx={{ py: 1.5 }}
              >
                Publications
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalendarIcon />}
                onClick={() => navigate('/teacher/schedule')}
                sx={{ py: 1.5 }}
              >
                Emploi du temps
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
};

export default TeacherDashboard;