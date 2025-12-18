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
  Book as BookIcon,
  Person as PersonIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const SubjectDetail = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectData();
  }, [subjectId]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSubject(subjectId);
      setSubjectData(response.data.data);
    } catch (error) {
      console.error('Erreur chargement matière:', error);
      toast.error('Erreur lors du chargement de la matière');
      navigate('/admin/subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!subjectData) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{subjectData.name} - Détails de la matière</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/subjects')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {subjectData.name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Code: {subjectData.code}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/subjects/edit/${subjectId}`)}
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
                    <BookIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Informations
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Fiche descriptive
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Nom complet
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {subjectData.name}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Code d'identification
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {subjectData.code}
                  </Typography>
                </Box>

                {subjectData.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {subjectData.description}
                      </Typography>
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {Array.isArray(subjectData.subjectClasses) ? subjectData.subjectClasses.length : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Classes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                        {Array.isArray(subjectData.subjectTeachers) ? subjectData.subjectTeachers.length : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Enseignants
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Classes */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Classes ({Array.isArray(subjectData.subjectClasses) ? subjectData.subjectClasses.length : 0})
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {Array.isArray(subjectData.subjectClasses) && subjectData.subjectClasses.length > 0 ? (
                  <List dense>
                    {subjectData.subjectClasses.map((classItem) => (
                      <ListItem key={classItem.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.light' }}>
                            <SchoolIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={classItem.name}
                          secondary={classItem.level}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                    Aucune classe associée à cette matière
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
                  <PersonIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Enseignants ({Array.isArray(subjectData.subjectTeachers) ? subjectData.subjectTeachers.length : 0})
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {Array.isArray(subjectData.subjectTeachers) && subjectData.subjectTeachers.length > 0 ? (
                  <List dense>
                    {subjectData.subjectTeachers.map((teacher) => (
                      <ListItem key={teacher.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
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
                    Aucun enseignant n'enseigne cette matière
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default SubjectDetail;