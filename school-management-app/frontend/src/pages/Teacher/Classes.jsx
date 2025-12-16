import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getMyClasses();
      setClasses(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = async (classItem) => {
    try {
      setSelectedClass(classItem);
      const response = await teacherAPI.getClassStudents(classItem.id);
      setStudents(response.data.data || []);
      setStudentsDialogOpen(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    }
  };

  const handleAddGrade = (classItem) => {
    navigate('/teacher/grades/new', { 
      state: { classId: classItem.id, className: classItem.name } 
    });
  };

  const filteredClasses = classes.filter(classItem =>
    !search ||
    classItem.name.toLowerCase().includes(search.toLowerCase()) ||
    classItem.level.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Mes Classes - Enseignant</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Mes Classes
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {classes.length} classe(s) assignée(s)
            </Typography>
          </Box>
          
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchClasses} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Barre de recherche */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher une classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Paper>

        {/* Liste des classes */}
        <Grid container spacing={3}>
          {filteredClasses.map((classItem) => (
            <Grid item xs={12} md={6} lg={4} key={classItem.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {classItem.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {classItem.level}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {classItem.studentsCount || 0} étudiant(s)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BookIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {classItem.subjects?.length || 0} matière(s)
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      Matières enseignées:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {classItem.subjects?.map((subject) => (
                        <Chip
                          key={subject.id}
                          label={subject.name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewStudents(classItem)}
                    fullWidth
                  >
                    Voir étudiants
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AssignmentIcon />}
                    onClick={() => handleAddGrade(classItem)}
                    color="primary"
                    variant="contained"
                    fullWidth
                  >
                    Noter
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredClasses.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Aucune classe trouvée
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {search ? 'Essayez de modifier votre recherche' : 'Aucune classe ne vous a été assignée'}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Dialog des étudiants */}
      <Dialog
        open={studentsDialogOpen}
        onClose={() => setStudentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">
                {selectedClass?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {students.length} étudiant(s)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>Étudiant</TableCell>
                  <TableCell>Matricule</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {student.firstName} {student.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{student.matricule}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Voir détails">
                        <IconButton
                          size="small"
                          onClick={() => toast.info('Fonctionnalité en développement')}
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {students.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                Aucun étudiant dans cette classe
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentsDialogOpen(false)}>Fermer</Button>
          <Button
            variant="contained"
            onClick={() => {
              setStudentsDialogOpen(false);
              handleAddGrade(selectedClass);
            }}
          >
            Ajouter une note
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeacherClasses;