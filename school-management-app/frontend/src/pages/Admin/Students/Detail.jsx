import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const StudentDetail = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStudent(studentId);
      console.log('Données étudiant:', response.data.data);
      setStudentData(response.data.data);
    } catch (error) {
      console.error('Erreur chargement étudiant:', error);
      toast.error('Erreur lors du chargement de l\'étudiant');
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!studentData) {
    return null;
  }

  const isActive = studentData.user?.isActive ?? studentData.user?.is_active ?? false;

  return (
    <>
      <Helmet>
        <title>{studentData.firstName} {studentData.lastName} - Détails</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/students')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {studentData.firstName} {studentData.lastName}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Matricule: {studentData.matricule}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/students/edit/${studentId}`)}
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              },
            }}
          >
            Modifier
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Informations personnelles */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: 'secondary.main', 
                      width: 100, 
                      height: 100,
                      fontSize: '2.5rem',
                      mb: 2
                    }}
                  >
                    {studentData.firstName?.[0]}{studentData.lastName?.[0]}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                    {studentData.firstName} {studentData.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {studentData.matricule}
                  </Typography>
                  <Chip
                    label={isActive ? 'Actif' : 'Inactif'}
                    color={isActive ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  {studentData.email && (
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={studentData.email}
                      />
                    </ListItem>
                  )}
                  
                  {studentData.birthDate && (
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Date de naissance"
                        secondary={new Date(studentData.birthDate).toLocaleDateString('fr-FR')}
                      />
                    </ListItem>
                  )}

                  <ListItem>
                    <ListItemIcon>
                      <BadgeIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Matricule"
                      secondary={studentData.matricule}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Classe */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Classe
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {studentData.class ? (
                  <Box>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                          {studentData.class.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Niveau: {studentData.class.level}
                        </Typography>
                        
                        {studentData.class.principalTeacher && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                              Professeur principal:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {studentData.class.principalTeacher.firstName} {studentData.class.principalTeacher.lastName}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    {studentData.class.classSubjects && studentData.class.classSubjects.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Matières ({studentData.class.classSubjects.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {studentData.class.classSubjects.map((subject) => (
                            <Chip
                              key={subject.id}
                              label={subject.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucune classe assignée
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Informations des parents */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Parents/Tuteurs
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {studentData.parentName || studentData.parentPhone ? (
                  <List dense>
                    {studentData.parentName && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Nom du parent"
                          secondary={studentData.parentName}
                        />
                      </ListItem>
                    )}
                    
                    {studentData.parentPhone && (
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Téléphone"
                          secondary={studentData.parentPhone}
                        />
                      </ListItem>
                    )}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucune information parentale enregistrée
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Statistiques */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Statistiques
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                      <Typography variant="h3" color="primary.dark" sx={{ fontWeight: 700 }}>
                        0
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Notes enregistrées
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                      <Typography variant="h3" color="success.dark" sx={{ fontWeight: 700 }}>
                        -
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Moyenne générale
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                      <Typography variant="h3" color="info.dark" sx={{ fontWeight: 700 }}>
                        0
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Bulletins générés
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                      <Typography variant="body1" color="warning.dark" sx={{ fontWeight: 700 }}>
                        {studentData.user?.created_at ? 
                          new Date(studentData.user.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 
                          'N/A'
                        }
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Date d'inscription
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default StudentDetail;