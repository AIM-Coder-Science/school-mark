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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Loader from '../../../components/common/Loader';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

const StudentsList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        adminAPI.getAllStudents(),
        adminAPI.getAllClasses(),
      ]);
      
      setStudents(studentsRes.data.data || []);
      setClasses(classesRes.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    navigate(`/admin/students/edit/${student.id}`);
  };

  const handleView = (student) => {
    navigate(`/admin/students/${student.id}`);
  };

  const handleDelete = (student) => {
    setDeleteDialog(student);
  };

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteUser(deleteDialog.user?.id || deleteDialog.userId);
      toast.success('Apprenant supprimé avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialog(null);
    }
  };

  const filteredStudents = students.filter(student => {
    // Filtre par recherche
    const searchMatch = !search || 
      student.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      student.matricule?.toLowerCase().includes(search.toLowerCase());

    // Filtre par classe
    const classMatch = selectedClass === 'all' || 
      student.classId?.toString() === selectedClass ||
      student.class?.id?.toString() === selectedClass;

    // Filtre par statut
    const statusMatch = selectedStatus === 'all' || 
      (selectedStatus === 'active' && student.user?.isActive) ||
      (selectedStatus === 'inactive' && !student.user?.isActive);

    return searchMatch && classMatch && statusMatch;
  });

  const getClassName = (student) => {
    if (student.class) {
      return `${student.class.name} (${student.class.level})`;
    }
    
    const classItem = classes.find(c => c.id === student.classId);
    return classItem ? `${classItem.name} (${classItem.level})` : 'Non affecté';
  };

  const columns = [
    {
      field: 'student',
      headerName: 'Apprenant',
      width: 250,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={row.photo}
            sx={{ bgcolor: 'secondary.main' }}
          >
            {row.firstName?.[0]}{row.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.matricule}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'class',
      headerName: 'Classe',
      width: 150,
      render: (value, row) => (
        <Chip
          label={getClassName(row)}
          size="small"
          icon={<SchoolIcon />}
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      width: 250,
      render: (value, row) => (
        <Box>
          {row.parentName && (
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              {row.parentName}
            </Typography>
          )}
          {row.parentPhone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">{row.parentPhone}</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'birthDate',
      headerName: 'Date de naissance',
      width: 150,
      type: 'date',
      render: (value) => (
        <Typography>
          {value ? new Date(value).toLocaleDateString('fr-FR') : '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      render: (value, row) => (
        <Chip
          label={row.user?.isActive ? 'Actif' : 'Inactif'}
          color={row.user?.isActive ? 'success' : 'error'}
          size="small"
          variant="outlined"
        />
      ),
    },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Apprenants - Administration</title>
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
              Gestion des Apprenants
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {students.length} apprenant(s) enregistré(s)
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/students/new')}
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              },
            }}
          >
            Nouvel Apprenant
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher un apprenant..."
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
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrer par classe</InputLabel>
                <Select
                  value={selectedClass}
                  label="Filtrer par classe"
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <MenuItem value="all">Toutes les classes</MenuItem>
                  {classes.map((classItem) => (
                    <MenuItem key={classItem.id} value={classItem.id.toString()}>
                      {classItem.name} ({classItem.level})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrer par statut</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Filtrer par statut"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="active">Actifs seulement</MenuItem>
                  <MenuItem value="inactive">Inactifs seulement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  onClick={fetchData}
                  variant="outlined"
                  fullWidth
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
          {filteredStudents.map((student) => (
            <Grid item xs={12} key={student.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={student.photo} sx={{ bgcolor: 'secondary.main' }}>
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {student.matricule}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={student.user?.isActive ? 'Actif' : 'Inactif'}
                      color={student.user?.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Classe:</strong> {getClassName(student)}
                    </Typography>
                    {student.parentName && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Parent:</strong> {student.parentName}
                      </Typography>
                    )}
                    {student.birthDate && (
                      <Typography variant="body2">
                        <strong>Naissance:</strong> {new Date(student.birthDate).toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleView(student)}
                    >
                      Voir
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(student)}
                      color="primary"
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(student)}
                      color="error"
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
          data={filteredStudents}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchable={false}
          title={`Liste des apprenants (${filteredStudents.length})`}
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
            Êtes-vous sûr de vouloir supprimer l'apprenant{' '}
            <strong>{deleteDialog?.firstName} {deleteDialog?.lastName}</strong> ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Cette action est irréversible. Toutes les données (notes, bulletins) seront supprimées.
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

export default StudentsList;