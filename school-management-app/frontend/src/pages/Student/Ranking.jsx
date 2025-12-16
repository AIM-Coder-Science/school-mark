import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { studentAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StudentRanking = () => {
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRanking();
  }, [selectedSemester, selectedYear]);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyRanking({
        semester: selectedSemester,
        academicYear: selectedYear,
      });
      setRankingData(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du classement');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyIcon sx={{ color: 'gold', fontSize: 30 }} />;
    if (rank === 2) return <TrophyIcon sx={{ color: 'silver', fontSize: 28 }} />;
    if (rank === 3) return <TrophyIcon sx={{ color: '#CD7F32', fontSize: 26 }} />;
    return <Typography variant="h6" sx={{ fontWeight: 700 }}>{rank}</Typography>;
  };

  const getRowColor = (rank) => {
    if (rank === 1) return 'rgba(255, 215, 0, 0.1)';
    if (rank === 2) return 'rgba(192, 192, 192, 0.1)';
    if (rank === 3) return 'rgba(205, 127, 50, 0.1)';
    return 'transparent';
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Classement - Étudiant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Classement de la Classe
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Consultez votre position dans la classe
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semestre</InputLabel>
              <Select
                value={selectedSemester}
                label="Semestre"
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <MenuItem value={1}>Semestre 1</MenuItem>
                <MenuItem value={2}>Semestre 2</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Année</InputLabel>
              <Select
                value={selectedYear}
                label="Année"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value={2023}>2023-2024</MenuItem>
                <MenuItem value={2024}>2024-2025</MenuItem>
                <MenuItem value={2025}>2025-2026</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Statistiques personnelles */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', bgcolor: rankingData?.myRank <= 3 ? 'primary.light' : 'background.paper' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 50, color: 'primary.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {rankingData?.myRank || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Mon Rang
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 50, color: 'success.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {rankingData?.myAverage ? rankingData.myAverage.toFixed(2) : 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ma Moyenne
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 50, color: 'info.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {rankingData?.classAverage ? rankingData.classAverage.toFixed(2) : 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Moyenne de Classe
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 50, color: 'warning.main', mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {rankingData?.totalStudents || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Étudiants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Comparaison avec la moyenne */}
        {rankingData?.myAverage && rankingData?.classAverage && (
          <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Comparaison avec la Moyenne de Classe
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Ma performance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {rankingData.myAverage > rankingData.classAverage ? '+' : ''}
                  {(rankingData.myAverage - rankingData.classAverage).toFixed(2)} points
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((rankingData.myAverage / 20) * 100, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: rankingData.myAverage >= rankingData.classAverage ? 'success.main' : 'warning.main',
                  },
                }}
              />
            </Box>
            
            {rankingData.myAverage >= rankingData.classAverage ? (
              <Alert severity="success">
                Félicitations ! Vous êtes au-dessus de la moyenne de classe.
              </Alert>
            ) : (
              <Alert severity="info">
                Continuez vos efforts pour atteindre la moyenne de classe.
              </Alert>
            )}
          </Paper>
        )}

        {/* Top 5 */}
        <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Top 5 de la Classe
          </Typography>
          
          <Grid container spacing={2}>
            {rankingData?.topStudents?.slice(0, 5).map((student, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={student.studentId}>
                <Card 
                  sx={{ 
                    textAlign: 'center',
                    bgcolor: getRowColor(index + 1),
                    border: student.isMe ? '2px solid' : 'none',
                    borderColor: 'primary.main'
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {getRankIcon(index + 1)}
                    </Box>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        mx: 'auto',
                        mb: 1,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {student.studentProfile?.firstName?.[0]}{student.studentProfile?.lastName?.[0]}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {student.studentProfile?.firstName} {student.studentProfile?.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {student.studentProfile?.matricule}
                    </Typography>
                    <Chip
                      label={`${student.average.toFixed(2)}/20`}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                    {student.isMe && (
                      <Chip
                        label="Vous"
                        size="small"
                        color="success"
                        sx={{ mt: 1, ml: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Classement complet */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Classement Complet
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell align="center" width={80}>Rang</TableCell>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Matricule</TableCell>
                  <TableCell align="center">Moyenne</TableCell>
                  <TableCell align="center">Appréciation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankingData?.ranking?.map((student) => (
                  <TableRow 
                    key={student.student.id}
                    hover
                    sx={{
                      bgcolor: student.isMe ? 'primary.light' : getRowColor(student.rank),
                      fontWeight: student.isMe ? 600 : 400,
                    }}
                  >
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {getRankIcon(student.rank)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {student.student.firstName?.[0]}{student.student.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: student.isMe ? 600 : 400 }}>
                            {student.student.firstName} {student.student.lastName}
                          </Typography>
                          {student.isMe && (
                            <Chip label="Vous" size="small" color="success" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{student.student.matricule}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${student.average.toFixed(2)}/20`}
                        size="small"
                        color={student.average >= 10 ? 'success' : 'error'}
                        variant={student.isMe ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          student.average >= 16 ? 'Excellent' :
                          student.average >= 14 ? 'Très Bien' :
                          student.average >= 12 ? 'Bien' :
                          student.average >= 10 ? 'Assez Bien' : 'Insuffisant'
                        }
                        size="small"
                        color={
                          student.average >= 16 ? 'success' :
                          student.average >= 14 ? 'info' :
                          student.average >= 12 ? 'primary' :
                          student.average >= 10 ? 'warning' : 'error'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
};

export default StudentRanking;