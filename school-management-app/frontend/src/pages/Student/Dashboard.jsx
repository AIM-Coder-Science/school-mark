import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
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
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Grade as GradeIcon,
  Book as BookIcon,
  Notifications as NotificationsIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { studentAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
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
  </Card>
);

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getStudentStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const gradeDistributionData = {
    labels: ['Excellent (≥16)', 'Très Bien (14-16)', 'Bien (12-14)', 'Assez Bien (10-12)', 'Insuffisant (<10)'],
    datasets: [
      {
        data: [2, 3, 4, 3, 1],
        backgroundColor: [
          '#4caf50',
          '#2196f3',
          '#ff9800',
          '#ffeb3b',
          '#f44336',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Tableau de bord - Étudiant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Tableau de bord Étudiant
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Bienvenue, {stats?.student?.firstName} {stats?.student?.lastName}
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
              title="Moyenne Générale"
              value={stats?.stats?.latestAverage ? `${stats.stats.latestAverage.toFixed(2)}/20` : 'N/A'}
              icon={<TrendingUpIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Rang dans la classe"
              value={stats?.stats?.latestRank || 'N/A'}
              icon={<TrophyIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Matières suivies"
              value={stats?.stats?.subjectsCount || 0}
              icon={<BookIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Notes totales"
              value={stats?.stats?.gradesCount || 0}
              icon={<AssignmentIcon />}
              color="info"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Informations de l'étudiant */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Mes Informations
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Nom complet:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats?.student?.firstName} {stats?.student?.lastName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Matricule:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats?.student?.matricule}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Classe:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats?.student?.class?.name} ({stats?.student?.class?.level})
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Statut:
                  </Typography>
                  <Chip
                    label="Actif"
                    size="small"
                    color="success"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Notes récentes */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Notes Récentes
              </Typography>
              
              <List sx={{ p: 0 }}>
                {stats?.recentActivities?.grades?.map((grade, index) => (
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
                            {grade.subject.name}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="textSecondary">
                              {grade.examType} • {grade.score}/20
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(grade.created_at).toLocaleDateString('fr-FR')}
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
                    {index < stats.recentActivities.grades.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>

              {stats?.recentActivities?.grades?.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>
                  Aucune note récente
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Colonne droite */}
          <Grid item xs={12} md={4}>
            {/* Distribution des notes */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Distribution des Notes
              </Typography>
              <Box sx={{ height: 250 }}>
                <Doughnut 
                  data={gradeDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          font: {
                            size: 10
                          }
                        }
                      },
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* Publications récentes */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Publications Récentes
              </Typography>
              
              <List sx={{ p: 0 }}>
                {stats?.recentActivities?.publications?.map((pub, index) => (
                  <React.Fragment key={pub.id}>
                    <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.light' }}>
                          <NotificationsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {pub.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            {new Date(pub.created_at).toLocaleDateString('fr-FR')}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < stats.recentActivities.publications.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>

              {stats?.recentActivities?.publications?.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                  Aucune publication récente
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default StudentDashboard;