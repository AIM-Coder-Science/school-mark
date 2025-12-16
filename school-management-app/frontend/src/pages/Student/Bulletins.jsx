import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { studentAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StudentBulletins = () => {
  const [bulletinsData, setBulletinsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState(null);

  useEffect(() => {
    fetchBulletins();
  }, []);

  const fetchBulletins = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyBulletins();
      setBulletinsData(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des bulletins');
    } finally {
      setLoading(false);
    }
  };

  const getAppreciation = (average) => {
    if (average >= 16) return { text: 'Excellent', color: 'success' };
    if (average >= 14) return { text: 'Très Bien', color: 'info' };
    if (average >= 12) return { text: 'Bien', color: 'primary' };
    if (average >= 10) return { text: 'Assez Bien', color: 'warning' };
    return { text: 'Insuffisant', color: 'error' };
  };

  const handleDownload = (bulletinId) => {
    toast.success('Téléchargement en cours...');
    // Implémenter le téléchargement
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader />;
  }

  const filteredAverages = bulletinsData?.averages?.filter(avg => 
    (!selectedYear || avg.academicYear === selectedYear) &&
    (!selectedSemester || avg.semester === selectedSemester)
  );

  return (
    <>
      <Helmet>
        <title>Mes Bulletins - Étudiant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Mes Bulletins
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Consultez vos bulletins et moyennes par semestre
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
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
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semestre</InputLabel>
              <Select
                value={selectedSemester || ''}
                label="Semestre"
                onChange={(e) => setSelectedSemester(e.target.value || null)}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value={1}>Semestre 1</MenuItem>
                <MenuItem value={2}>Semestre 2</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Imprimer">
              <IconButton onClick={handlePrint} color="primary">
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Bulletins disponibles */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {filteredAverages && filteredAverages.length > 0 ? (
            filteredAverages.map((average, index) => {
              const appreciation = getAppreciation(average.generalAverage);
              
              return (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Bulletin - Semestre {average.semester}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Année académique {average.academicYear}-{average.academicYear + 1}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<AssessmentIcon />}
                          label={appreciation.text}
                          color={appreciation.color}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                            <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {average.generalAverage.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Moyenne Générale
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                            <TrophyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {average.rankInClass || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Rang dans la classe
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {average.appreciation && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Appréciation:</strong> {average.appreciation}
                          </Typography>
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<VisibilityIcon />}
                          onClick={() => toast.info('Fonctionnalité en développement')}
                        >
                          Voir détails
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(average.id)}
                        >
                          Télécharger
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                Aucun bulletin disponible pour la période sélectionnée.
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* Documents historiques */}
        {bulletinsData?.bulletins && bulletinsData.bulletins.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Documents Archivés
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>Type de document</TableCell>
                    <TableCell>Semestre</TableCell>
                    <TableCell>Année académique</TableCell>
                    <TableCell>Date de génération</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulletinsData.bulletins.map((bulletin) => (
                    <TableRow key={bulletin.id} hover>
                      <TableCell>
                        <Chip 
                          label={bulletin.documentType} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>Semestre {bulletin.semester}</TableCell>
                      <TableCell>{bulletin.academicYear}-{bulletin.academicYear + 1}</TableCell>
                      <TableCell>
                        {new Date(bulletin.generated_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Télécharger">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleDownload(bulletin.id)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Voir">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => toast.info('Fonctionnalité en développement')}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default StudentBulletins;