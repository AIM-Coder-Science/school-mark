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
  ListItemAvatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const ClassDetail = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getClass(classId);
      setClassData(response.data.data);
    } catch (error) {
      console.error('Erreur chargement classe:', error);
      toast.error('Erreur lors du chargement de la classe');
      navigate('/admin/classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!classData) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{classData.name} - Détails de la classe</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/classes')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {classData.name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Niveau: {classData.level}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/classes/edit/${classId}`)}
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
          {/* Informations générales */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <SchoolIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {classData.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {classData.level}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Professeur Principal
                  </Typography>
                  {classData.principalTeacher ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body1">
                        {classData.principalTeacher.firstName} {classData.principalTeacher.lastName}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip label="Non assigné" size="small" color="warning" variant="outlined" />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {Array.isArray(classData.students) ? classData.students.length : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Étudiants
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {Array.isArray(classData.classSubjects) ? classData.classSubjects.length : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Matières
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Matières */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <BookIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Matières ({Array.isArray(classData.classSubjects) ? classData.classSubjects.length : 0})
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {Array.isArray(classData.classSubjects) && classData.classSubjects.length > 0 ? (
                  <List dense>
                    {classData.classSubjects.map((subject) => (
                      <ListItem key={subject.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <BookIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={subject.name}
                          secondary={`Code: ${subject.code}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                    Aucune matière assignée
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Enseignants */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Enseignants ({Array.isArray(classData.classTeachers) ? classData.classTeachers.length : 0})
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {Array.isArray(classData.classTeachers) && classData.classTeachers.length > 0 ? (
                  <List dense>
                    {classData.classTeachers.map((teacher) => (
                      <ListItem key={teacher.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.light' }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${teacher.firstName} ${teacher.lastName}`}
                          secondary={teacher.matricule}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                    Aucun enseignant assigné
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Étudiants */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Liste des étudiants ({Array.isArray(classData.students) ? classData.students.length : 0})
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {Array.isArray(classData.students) && classData.students.length > 0 ? (
                  <Grid container spacing={2}>
                    {classData.students.map((student) => (
                      <Grid item xs={12} sm={6} md={4} key={student.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'success.light' }}>
                                {student.firstName[0]}{student.lastName[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {student.firstName} {student.lastName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {student.matricule}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Aucun étudiant
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Cette classe ne contient pas encore d'étudiants
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

export default ClassDetail;