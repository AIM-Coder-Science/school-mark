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
  LinearProgress,
  Tooltip,
  Stack,
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
  Groups as GroupsIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  People as PeopleIcon,
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
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSubjects: 0,
    principalClasses: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    fetchTeacherData();
  }, [teacherId]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTeacher(teacherId);
      const teacher = response.data.data;
      console.log('Données enseignant reçues:', teacher);
      
      // Normaliser les données
      const normalizedTeacher = {
        ...teacher,
        firstName: teacher.firstName || teacher.first_name || '',
        lastName: teacher.lastName || teacher.last_name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        matricule: teacher.matricule || '',
        specialties: Array.isArray(teacher.specialties) 
          ? teacher.specialties 
          : (typeof teacher.specialties === 'string' ? teacher.specialties.split(',').map(s => s.trim()) : []),
        user: {
          ...teacher.user,
          isActive: teacher.user?.isActive /*?? teacher.user?.is_active ?? false*/,
        }
      };

      setTeacherData(normalizedTeacher);

      // Calculer les statistiques
      const assignedClasses = normalizedTeacher.assignedClasses || [];
      const principalClasses = normalizedTeacher.principalOfClasses || [];
      const teacherSubjects = normalizedTeacher.teacherSubjects || [];

      const totalStudents = assignedClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);

      setStats({
        totalClasses: assignedClasses.length,
        totalSubjects: teacherSubjects.length,
        principalClasses: principalClasses.length,
        totalStudents,
      });

    } catch (error) {
      console.error('Erreur chargement enseignant:', error);
      toast.error('Erreur lors du chargement de l\'enseignant');
      navigate('/admin/teachers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return <Loader />;
  }

  if (!teacherData) {
    return null;
  }

  const { firstName, lastName, matricule, email, phone, specialties, user, assignedClasses } = teacherData;
  const isActive = user?.isActive /*|| false*/;
  const pageTitle = `${firstName} ${lastName} - Détails`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        {/* En-tête avec navigation et actions */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: 3
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <Tooltip title="Retour à la liste">
                <IconButton 
                  onClick={() => navigate('/admin/teachers')} 
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              
              <Avatar
                sx={{ 
                  bgcolor: 'white', 
                  width: 80, 
                  height: 80,
                  fontSize: '2rem',
                  color: 'primary.main',
                  fontWeight: 700,
                  border: '4px solid white',
                  boxShadow: 2
                }}
              >
                {firstName[0]}{lastName[0]}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {firstName} {lastName}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BadgeIcon fontSize="small" />
                  {matricule}
                </Typography>
              </Box>
              
              <Chip
                icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
                label={isActive ? 'ACTIF' : 'INACTIF'}
                color={isActive ? "success" : "error"}
                sx={{ 
                  height: 40,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            </Box>

            <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />

            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
              {email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">{email}</Typography>
                </Box>
              )}
              
              {phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2">{phone}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" />
                <Typography variant="body2">
                  Créé le {formatDate(teacherData.createdAt)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Carte d'information */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Informations personnelles
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Matricule"
                      secondary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{matricule}</Typography>}
                    />
                  </ListItem>
                  
                  {email && (
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={email}
                      />
                    </ListItem>
                  )}
                  
                  {phone && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Téléphone"
                        secondary={phone}
                      />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 3 }} />

                {specialties && specialties.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BookIcon fontSize="small" /> Spécialités
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {specialties.map((spec, index) => (
                        <Chip
                          key={index}
                          label={spec}
                          size="medium"
                          color="primary"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Statistiques */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon /> Statistiques
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      bgcolor: 'primary.light', 
                      borderRadius: 2,
                      boxShadow: 2
                    }}>
                      <Typography variant="h2" color="primary.dark" sx={{ fontWeight: 800 }}>
                        {stats.totalClasses}
                      </Typography>
                      <Typography variant="body2" color="primary.dark" sx={{ mt: 1, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <ClassIcon fontSize="small" /> Classes
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      bgcolor: 'success.light', 
                      borderRadius: 2,
                      boxShadow: 2
                    }}>
                      <Typography variant="h2" color="success.dark" sx={{ fontWeight: 800 }}>
                        {stats.totalSubjects}
                      </Typography>
                      <Typography variant="body2" color="success.dark" sx={{ mt: 1, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <SubjectIcon fontSize="small" /> Matières
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      bgcolor: 'warning.light', 
                      borderRadius: 2,
                      boxShadow: 2
                    }}>
                      <Typography variant="h2" color="warning.dark" sx={{ fontWeight: 800 }}>
                        {stats.principalClasses}
                      </Typography>
                      <Typography variant="body2" color="warning.dark" sx={{ mt: 1, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" /> Classes principales
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      bgcolor: 'info.light', 
                      borderRadius: 2,
                      boxShadow: 2
                    }}>
                      <Typography variant="h2" color="info.dark" sx={{ fontWeight: 800 }}>
                        {stats.totalStudents}
                      </Typography>
                      <Typography variant="body2" color="info.dark" sx={{ mt: 1, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" /> Élèves
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Dernière mise à jour : {formatDate(teacherData.updatedAt)}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/admin/teachers/edit/${teacherId}`)}
                    sx={{
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                      },
                      fontWeight: 600,
                      px: 3
                    }}
                  >
                    Modifier
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Classes principales */}
          {teacherData.principalOfClasses && teacherData.principalOfClasses.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon /> Classes principales
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {teacherData.principalOfClasses.map((classItem) => (
                      <Grid item xs={12} sm={6} md={4} key={classItem.id}>
                        <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                <ClassIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {classItem.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Niveau: {classItem.level}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label="Professeur principal" 
                              color="success" 
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Affectations par classe */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon /> Affectations détaillées
                </Typography>
                
                {assignedClasses && assignedClasses.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Classe</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Niveau</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Matières enseignées</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Effectif</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Professeur principal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignedClasses.map((classItem) => {
                          const isPrincipal = teacherData.principalOfClasses?.some(cls => cls.id === classItem.id);
                          const subjectsTaught = classItem.subjectsTaught || [];

                          return (
                            <TableRow 
                              key={classItem.id}
                              sx={{ 
                                '&:hover': { bgcolor: 'action.hover' },
                                '&:last-child td, &:last-child th': { border: 0 }
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ 
                                    bgcolor: isPrincipal ? 'success.main' : 'primary.main', 
                                    width: 32, 
                                    height: 32,
                                    fontSize: '0.875rem'
                                  }}>
                                    <ClassIcon fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      {classItem.name}
                                    </Typography>
                                    {isPrincipal && (
                                      <Chip 
                                        label="Titulaire" 
                                        size="small" 
                                        color="success" 
                                        sx={{ mt: 0.5, fontWeight: 500 }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={classItem.level} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {subjectsTaught.length > 0 ? (
                                    subjectsTaught.map((subject) => (
                                      <Tooltip key={subject.id} title={subject.name}>
                                        <Chip 
                                          label={subject.name} 
                                          size="small" 
                                          color="secondary"
                                          sx={{ fontWeight: 500 }}
                                        />
                                      </Tooltip>
                                    ))
                                  ) : (
                                    <Typography variant="caption" color="textSecondary">
                                      Aucune matière assignée
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PeopleIcon fontSize="small" color="action" />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {classItem.studentCount || 0} élèves
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {classItem.principalTeacher ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ 
                                      width: 28, 
                                      height: 28, 
                                      fontSize: '0.75rem',
                                      bgcolor: classItem.principalTeacher.id === parseInt(teacherId) ? 'success.main' : 'primary.main'
                                    }}>
                                      {(classItem.principalTeacher.firstName?.[0] || classItem.principalTeacher.first_name?.[0] || '') + 
                                       (classItem.principalTeacher.lastName?.[0] || classItem.principalTeacher.last_name?.[0] || '')}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {classItem.principalTeacher.firstName || classItem.principalTeacher.first_name} {classItem.principalTeacher.lastName || classItem.principalTeacher.last_name}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="textSecondary">
                                    Non défini
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <BookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Aucune affectation de classe
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      Cet enseignant n'est pas encore affecté à des classes
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/admin/teachers/edit/${teacherId}`)}
                    >
                      Ajouter des affectations
                    </Button>
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