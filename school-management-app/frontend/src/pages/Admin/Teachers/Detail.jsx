import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Avatar, Chip, Divider, Button, Card, CardContent, List, ListItem, ListItemText, ListItemAvatar, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Mail as MailIcon, Phone as PhoneIcon, Badge as BadgeIcon, School as SchoolIcon, Book as BookIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';

const TeacherDetail = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await adminAPI.getTeacher(teacherId);
        setTeacher(response.data.data);
      } catch (error) {
        toast.error("Erreur lors de la récupération des détails");
        navigate('/admin/teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [teacherId]);

  if (loading) return <Loader />;
  if (!teacher) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/admin/teachers')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" fontWeight="700">Profil Enseignant</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/admin/teachers/edit/${teacher.id}`)}>
          Modifier
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '3rem' }}>
              {teacher.firstName[0]}{teacher.lastName[0]}
            </Avatar>
            <Typography variant="h5" fontWeight="600">{teacher.firstName} {teacher.lastName}</Typography>
            <Chip label={teacher.matricule} size="small" sx={{ mt: 1, mb: 2 }} />
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MailIcon color="action" />
                <Typography variant="body2">{teacher.user?.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon color="action" />
                <Typography variant="body2">{teacher.phone || 'Non renseigné'}</Typography>
              </Box>
            </Box>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Spécialités</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {teacher.specialties?.map((s, i) => (
                  <Chip key={i} label={s} color="secondary" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon /> Classes & Matières assignées
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {teacher.assignedClasses?.length > 0 ? (
                <List>
                  {teacher.assignedClasses.map((cls, index) => (
                    <ListItem key={index} divider={index !== teacher.assignedClasses.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.light' }}><BookIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography fontWeight="600">{cls.name}</Typography>}
                        secondary={`Enseigne : ${cls.TeacherClassSubject?.Subject?.name || 'Matière non définie'}`}
                      />
                      <Chip label={`Niveau: ${cls.level}`} size="small" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                  Aucune affectation pour le moment.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDetail;