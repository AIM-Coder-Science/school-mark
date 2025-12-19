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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const TeacherDetail = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, [teacherId]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTeacher(teacherId);
      setTeacherData(response.data.data);
    } catch (error) {
      console.error('Erreur chargement enseignant:', error);
      toast.error('Erreur lors du chargement de l\'enseignant');
      navigate('/admin/teachers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!teacherData) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{teacherData.firstName} {teacherData.lastName} - Détails</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/teachers')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {teacherData.firstName} {teacherData.lastName}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Matricule: {teacherData.matricule}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/teachers/edit/${teacherId}`)}
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
                      bgcolor: 'primary.main', 
                      width: 100, 
                      height: 100,
                      fontSize: '2.5rem',
                      mb: 2
                    }}
                  >
                    {teacherData.firstName[0]}{teacherData.lastName[0]}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                    {teacherData.firstName} {teacherData.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {teacherData.matricule}
                  </Typography>
                  <Chip
                    label={teacherData.user?.isActive ? 'Actif' : 'Inactif'}
                    color={teacherData.user?.isActive ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  {teacherData.email && (
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={teacherData.email}
                      />
                    </ListItem>
                  )}
                  
                  {teacherData.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Téléphone"
                        secondary={teacherData.phone}
                      />
                    </ListItem>
                  )}

                  <ListItem>
                    <ListItemIcon>
                      <BadgeIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Matricule"
                      secondary={teacherData.matricule}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                {teacherData.specialties && teacherData.specialties.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Spécialités:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {teacherData.specialties.map((spec, index) => (
                        <Chip
                          key={index}
                          label={spec}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Classes principales */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Classes principales
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {teacherData.principalOfClasses && teacherData.principalOfClasses.length > 0 ? (
                  <List dense>
                    {teacherData.principalOfClasses.map((classItem) => (
                      <ListItem key={classItem.id}>
                        <ListItemIcon>
                          <SchoolIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={classItem.name}
                          secondary={`Niveau: ${classItem.level}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Aucune classe principale assignée
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Statistiques */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Statistiques
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                        {teacherData.assignedClasses?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Classes
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                        0
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Notes saisies
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Affectations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <BookIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Affectations (Classe - Matière)
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {teacherData.assignedClasses && teacherData.assignedClasses.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Classe</strong></TableCell>
                          <TableCell><strong>Niveau</strong></TableCell>
                          <TableCell><strong>Matières enseignées</strong></TableCell>
                          <TableCell><strong>Effectif</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teacherData.assignedClasses.map((classItem) => (
                          <TableRow key={classItem.id}>
                            <TableCell>{classItem.name}</TableCell>
                            <TableCell>{classItem.level}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {classItem.classSubjects?.map((subject) => (
                                  <Chip
                                    key={subject.id}
                                    label={subject.name}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )) || <Typography variant="body2" color="textSecondary">Aucune</Typography>}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {classItem.students?.length || 0} élèves
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <BookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Aucune affectation
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cet enseignant n'est pas encore affecté à des classes
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default TeacherDetail;