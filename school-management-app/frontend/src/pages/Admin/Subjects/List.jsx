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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Book as BookIcon,
  Numbers as NumbersIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Loader from '../../../components/common/Loader';
// Note: Vous devrez créer cet endpoint
// import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

const SubjectsList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      // Simuler des données pour l'exemple
      const mockSubjects = [
        {
          id: 1,
          name: 'Mathématiques',
          code: 'MATH',
          coefficient: 3,
          createdBy: 1,
          createdAt: '2024-01-15',
          classes: [{ id: 1, name: '6ème A' }, { id: 2, name: '5ème B' }],
          teachers: [{ id: 1, firstName: 'Jean', lastName: 'Dupont' }],
        },
        {
          id: 2,
          name: 'Physique',
          code: 'PHY',
          coefficient: 2,
          createdBy: 1,
          createdAt: '2024-01-15',
          classes: [{ id: 1, name: '6ème A' }, { id: 3, name: '4ème C' }],
          teachers: [{ id: 2, firstName: 'Marie', lastName: 'Curie' }],
        },
        {
          id: 3,
          name: 'Français',
          code: 'FR',
          coefficient: 3,
          createdBy: 1,
          createdAt: '2024-01-16',
          classes: [{ id: 1, name: '6ème A' }, { id: 2, name: '5ème B' }],
          teachers: [{ id: 3, firstName: 'Victor', lastName: 'Hugo' }],
        },
        {
          id: 4,
          name: 'Anglais',
          code: 'ANG',
          coefficient: 2,
          createdBy: 1,
          createdAt: '2024-01-16',
          classes: [{ id: 1, name: '6ème A' }, { id: 4, name: '3ème D' }],
          teachers: [{ id: 4, firstName: 'William', lastName: 'Shakespeare' }],
        },
        {
          id: 5,
          name: 'Histoire-Géographie',
          code: 'HIST',
          coefficient: 2,
          createdBy: 1,
          createdAt: '2024-01-17',
          classes: [{ id: 2, name: '5ème B' }, { id: 3, name: '4ème C' }],
          teachers: [{ id: 5, firstName: 'Napoléon', lastName: 'Bonaparte' }],
        },
        {
          id: 6,
          name: 'Sciences',
          code: 'SCI',
          coefficient: 2,
          createdBy: 1,
          createdAt: '2024-01-18',
          classes: [{ id: 1, name: '6ème A' }, { id: 2, name: '5ème B' }],
          teachers: [{ id: 1, firstName: 'Jean', lastName: 'Dupont' }],
        },
      ];
      
      setSubjects(mockSubjects);
      
      // En production:
      // const response = await adminAPI.getSubjects();
      // setSubjects(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    navigate(`/admin/subjects/edit/${subject.id}`);
  };

  const handleView = (subject) => {
    navigate(`/admin/subjects/${subject.id}`);
  };

  const handleDelete = (subject) => {
    setDeleteDialog(subject);
  };

  const confirmDelete = async () => {
    try {
      // Note: Vous devrez créer un endpoint pour supprimer les matières
      // await adminAPI.deleteSubject(deleteDialog.id);
      toast.success('Matière supprimée avec succès');
      fetchSubjects();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialog(null);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    return !search || 
      subject.name.toLowerCase().includes(search.toLowerCase()) ||
      subject.code.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    {
      field: 'subject',
      headerName: 'Matière',
      width: 250,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <BookIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Code: {row.code}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'coefficient',
      headerName: 'Coefficient',
      width: 120,
      render: (value) => (
        <Chip
          label={`Coeff. ${value}`}
          size="small"
          color="primary"
          icon={<NumbersIcon />}
          variant="outlined"
        />
      ),
    },
    {
      field: 'classes',
      headerName: 'Classes',
      width: 150,
      render: (value) => (
        <Typography>
          {Array.isArray(value) ? value.length : 0} classe(s)
        </Typography>
      ),
    },
    {
      field: 'teachers',
      headerName: 'Enseignants',
      width: 150,
      render: (value) => (
        <Typography>
          {Array.isArray(value) ? value.length : 0} enseignant(s)
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Créée le',
      width: 150,
      type: 'date',
      render: (value) => (
        <Typography variant="body2">
          {new Date(value).toLocaleDateString('fr-FR')}
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
        <title>Matières - Administration</title>
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
              Gestion des Matières
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {subjects.length} matière(s) enregistrée(s)
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/subjects/new')}
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              },
            }}
          >
            Nouvelle Matière
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher une matière..."
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
                  variant="outlined"
                  disabled
                >
                  Filtres
                </Button>
                <Button
                  onClick={fetchSubjects}
                  variant="outlined"
                >
                  Actualiser
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {filteredSubjects.map((subject) => (
            <Grid item xs={12} key={subject.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <BookIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {subject.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Code: {subject.code} • Coeff. {subject.coefficient}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`Coeff. ${subject.coefficient}`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Classes:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {Array.isArray(subject.classes) ? subject.classes.length : 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Enseignants:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {Array.isArray(subject.teachers) ? subject.teachers.length : 0}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleView(subject)}
                      fullWidth
                    >
                      Voir
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(subject)}
                      color="primary"
                      fullWidth
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(subject)}
                      color="error"
                      fullWidth
                    >
                      Supprimer
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
          data={filteredSubjects}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchable={false}
          title={`Liste des matières (${filteredSubjects.length})`}
        />
      )}

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
            Êtes-vous sûr de vouloir supprimer la matière{' '}
            <strong>{deleteDialog?.name}</strong> ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Attention: Cette action affectera toutes les classes et notes associées à cette matière.
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

export default SubjectsList;