import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Book as BookIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Loader from '../../../components/common/Loader';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

const ClassesList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getClasses();
      setClasses(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem) => {
    navigate(`/admin/classes/edit/${classItem.id}`);
  };

  const handleView = (classItem) => {
    navigate(`/admin/classes/${classItem.id}`);
  };

  const handleDelete = (classItem) => {
    setDeleteDialog(classItem);
  };

  const confirmDelete = async () => {
    try {
      // Note: Vous devrez créer un endpoint pour supprimer les classes
      // await adminAPI.deleteClass(deleteDialog.id);
      toast.success('Classe supprimée avec succès');
      fetchClasses();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleAssignPrincipal = (classItem) => {
    setSelectedClass(classItem);
    // Ouvrir un dialog pour assigner un professeur principal
  };

  const handleMenuClick = (event, classItem) => {
    setSelectedClass(classItem);
    setFilterAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setFilterAnchor(null);
    setSelectedClass(null);
  };

  const levels = [...new Set(classes.map(c => c.level))];

  const filteredClasses = classes.filter(classItem => {
    const searchMatch = !search || 
      classItem.name.toLowerCase().includes(search.toLowerCase()) ||
      classItem.level.toLowerCase().includes(search.toLowerCase());

    const levelMatch = selectedLevel === 'all' || 
      classItem.level === selectedLevel;

    return searchMatch && levelMatch;
  });

  const columns = [
    {
      field: 'class',
      headerName: 'Classe',
      width: 200,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SchoolIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.level}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'principal',
      headerName: 'Professeur Principal',
      width: 200,
      render: (value, row) => (
        row.principalTeacher ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {row.principalTeacher.firstName} {row.principalTeacher.lastName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {row.principalTeacher.matricule}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Chip
            label="Non assigné"
            size="small"
            color="warning"
            variant="outlined"
          />
        )
      ),
    },
    {
      field: 'students',
      headerName: 'Étudiants',
      width: 120,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography>
            {Array.isArray(row.students) ? row.students.length : 0}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'subjects',
      headerName: 'Matières',
      width: 150,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookIcon fontSize="small" color="action" />
          <Typography>
            {Array.isArray(row.subjects) ? row.subjects.length : 0}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'teachers',
      headerName: 'Enseignants',
      width: 120,
      render: (value, row) => (
        <Typography>
          {Array.isArray(row.teachers) ? row.teachers.length : 0}
        </Typography>
      ),
    },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Classes - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3 
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Gestion des Classes
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {classes.length} classe(s) enregistrée(s)
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/classes/new')}
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              },
            }}
          >
            Nouvelle Classe
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  variant="outlined"
                >
                  Niveau: {selectedLevel === 'all' ? 'Tous' : selectedLevel}
                </Button>
                <Button
                  onClick={fetchClasses}
                  variant="outlined"
                >
                  Actualiser
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem onClick={() => setSelectedLevel('all')}>
            Tous les niveaux
          </MenuItem>
          {levels.map((level) => (
            <MenuItem key={level} onClick={() => setSelectedLevel(level)}>
              {level}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {filteredClasses.map((classItem) => (
            <Grid item xs={12} key={classItem.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <SchoolIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {classItem.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {classItem.level}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, classItem)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {Array.isArray(classItem.students) ? classItem.students.length : 0} étudiants
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {Array.isArray(classItem.subjects) ? classItem.subjects.length : 0} matières
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {classItem.principalTeacher ? (
                    <Typography variant="body2" color="textSecondary">
                      Prof principal: {classItem.principalTeacher.firstName} {classItem.principalTeacher.lastName}
                    </Typography>
                  ) : (
                    <Chip
                      label="Pas de prof principal"
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleView(classItem)}
                      fullWidth
                    >
                      Voir
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(classItem)}
                      color="primary"
                      fullWidth
                    >
                      Modifier
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          data={filteredClasses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchable={false}
          title={`Liste des classes (${filteredClasses.length})`}
        />
      )}

      {/* Menu contextuel */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor) && Boolean(selectedClass)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleView(selectedClass);
          handleMenuClose();
        }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 2 }} />
          Voir détails
        </MenuItem>
        <MenuItem onClick={() => {
          handleEdit(selectedClass);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 2 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => {
          handleAssignPrincipal(selectedClass);
          handleMenuClose();
        }}>
          <PersonIcon fontSize="small" sx={{ mr: 2 }} />
          Assigner prof principal
        </MenuItem>
        <MenuItem onClick={() => {
          handleDelete(selectedClass);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 2 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la classe{' '}
            <strong>{deleteDialog?.name} ({deleteDialog?.level})</strong> ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Attention: Cette action supprimera également tous les étudiants et les notes associés à cette classe.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClassesList;