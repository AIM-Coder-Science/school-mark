import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  TrendingUp as TrendingUpIcon,
  Class as ClassIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { adminAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const StatCard = ({ title, value, icon, color, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
            {value}
          </Typography>
          {trend && (
            <Chip
              label={`+${trend}%`}
              size="small"
              color="success"
              icon={<TrendingUpIcon />}
            />
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.contrastText` }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const userDistributionData = {
    labels: ['Enseignants', 'Étudiants'],
    datasets: [
      {
        data: [stats?.users?.teacher || 0, stats?.users?.student || 0],
        backgroundColor: ['#1976d2', '#4caf50'],
        borderWidth: 1,
      },
    ],
  };

  const classDistributionData = {
    labels: ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'],
    datasets: [
      {
        label: 'Nombre d\'étudiants',
        data: [45, 52, 48, 50, 42, 38, 35],
        backgroundColor: 'rgba(25, 118, 210, 0.5)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
      },
    ],
  };

  const monthlyEvolutionData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Enseignants',
        data: [12, 15, 18, 20, 22, 25, 25, 26, 28, 28],
        borderColor: 'rgb(25, 118, 210)',
        backgroundColor: 'rgba(25, 118, 210, 0.5)',
      },
      {
        label: 'Étudiants',
        data: [150, 180, 220, 250, 280, 300, 310, 320, 315, 310],
        borderColor: 'rgb(76, 175, 80)',
        backgroundColor: 'rgba(76, 175, 80, 0.5)',
      },
    ],
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Statistiques - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Statistiques et Analyses
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Vue d'ensemble de l'établissement
            </Typography>
          </Box>
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchStats} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Statistiques principales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Enseignants"
              value={stats?.users?.teacher || 0}
              icon={<PeopleIcon />}
              color="primary"
              trend={5}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Étudiants"
              value={stats?.users?.student || 0}
              icon={<SchoolIcon />}
              color="success"
              trend={8}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Classes"
              value={stats?.totals?.classes || 0}
              icon={<ClassIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Matières"
              value={stats?.totals?.subjects || 0}
              icon={<BookIcon />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Graphiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Distribution des Utilisateurs
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={userDistributionData}
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

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Distribution par Niveau
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={classDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
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

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Évolution Mensuelle
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={monthlyEvolutionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Dernières activités */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Derniers Enseignants Ajoutés
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell>Enseignant</TableCell>
                      <TableCell>Matricule</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recentActivities?.teachers?.map((teacher) => (
                      <TableRow key={teacher.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                            </Avatar>
                            <Typography variant="body2">
                              {teacher.firstName} {teacher.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{teacher.matricule}</TableCell>
                        <TableCell>
                          {new Date(teacher.created_at || Date.now()).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Derniers Étudiants Ajoutés
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell>Étudiant</TableCell>
                      <TableCell>Classe</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recentActivities?.students?.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </Avatar>
                            <Typography variant="body2">
                              {student.firstName} {student.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={student.class?.name || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(student.created_at || Date.now()).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default AdminStats;