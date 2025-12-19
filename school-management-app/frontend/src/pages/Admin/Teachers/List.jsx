import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Loader from '../../../components/common/Loader';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

const TeachersList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllTeachers();
      setTeachers(response.data.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des enseignants');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    const newStatus = !teacher.user?.isActive;
    
    try {
      await adminAPI.toggleUserStatus(teacher.userId || teacher.user?.id, { 
        isActive: newStatus 
      });
      
      toast.success(`Enseignant ${newStatus ? 'activé' : 'désactivé'}`);
      fetchTeachers();
    } catch (error) {
      console.error('Erreur toggle:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleEdit = (teacher) => {
    navigate(`/admin/teachers/edit/${teacher.id}`);
  };

  const handleView = (teacher) => {
    navigate(`/admin/teachers/${teacher.id}`);
  };

  const handleDelete = (teacher) => {
    setDeleteDialog(teacher);
  };

  const confirmDelete = async () => {
    try {
      await adminAPI.deleteUser(deleteDialog.user?.id || deleteDialog.userId);
      toast.success('Enseignant supprimé avec succès');
      fetchTeachers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    setFilterAnchor(null);
  };

  const filteredTeachers = teachers.filter(teacher => {
    const searchMatch = !search || 
      teacher.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      teacher.matricule?.toLowerCase().includes(search.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(search.toLowerCase());

    const statusMatch = selectedStatus === 'all' || 
      (selectedStatus === 'active' && teacher.user?.isActive) ||
      (selectedStatus === 'inactive' && !teacher.user?.isActive);

    return searchMatch && statusMatch;
  });

  const columns = [
    {
      field: 'teacher',
      headerName: 'Enseignant',
      width: 250,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={row.photo} sx={{ bgcolor: 'primary.main' }}>
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
      field: 'contact',
      headerName: 'Contact',
      width: 220,
      render: (value, row) => (
        <Box>
          {row.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <MailIcon fontSize="small" color="action" />
              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                {row.email}
              </Typography>
            </Box>
          )}
          {row.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">{row.phone}</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'specialties',
      headerName: 'Spécialités',
      width: 200,
      render: (value) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {Array.isArray(value) && value.slice(0, 2).map((spec, index) => (
            <Chip key={index} label={spec} size="small" />
          ))}
          {Array.isArray(value) && value.length > 2 && (
            <Chip label={`+${value.length - 2}`} size="small" variant="outlined" />
          )}
        </Box>
      ),
    },
    {
      field: 'assignedClasses',
      headerName: 'Classes',
      width: 130,
      render: (value) => (
        <Chip 
          icon={<SchoolIcon />}
          label={`${value?.length || 0} classe(s)`} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      render: (value, row) => (
        <Tooltip title={row.user?.isActive ? "Cliquer pour désactiver" : "Cliquer pour activer"}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={row.user?.isActive || false}
              onChange={() => handleToggleStatus(row)}
              color="success"
              size="small"
            />
            <Typography variant="caption" color={row.user?.isActive ? "success.main" : "error.main"}>
              {row.user?.isActive ? 'Actif' : 'Inactif'}
            </Typography>
          </Box>
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Enseignants - Administration</title>
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
              Gestion des Enseignants
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {teachers.length} enseignant(s) • {teachers.filter(t => t.user?.isActive).length} actif(s)
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/teachers/new')}
            size="large"
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              },
            }}
          >
            Nouvel Enseignant
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, matricule ou email..."
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
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  variant="outlined"
                  size="small"
                >
                  {selectedStatus === 'all' ? 'Tous' : selectedStatus === 'active' ? 'Actifs' : 'Inactifs'}
                </Button>
                <Button
                  onClick={fetchTeachers}
                  variant="outlined"
                  size="small"
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
          <MenuItem onClick={() => handleStatusFilter('all')}>
            Tous les enseignants
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilter('active')}>
            Enseignants actifs
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilter('inactive')}>
            Enseignants inactifs
          </MenuItem>
        </Menu>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {filteredTeachers.map((teacher) => (
            <Grid item xs={12} key={teacher.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={teacher.photo} sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                        {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {teacher.firstName} {teacher.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {teacher.matricule}
                        </Typography>
                      </Box>
                    </Box>
                    <Switch
                      checked={teacher.user?.isActive || false}
                      onChange={() => handleToggleStatus(teacher)}
                      color="success"
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Contact:
                    </Typography>
                    {teacher.email && (
                      <Typography variant="body2">{teacher.email}</Typography>
                    )}
                    {teacher.phone && (
                      <Typography variant="body2">{teacher.phone}</Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Spécialités:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {Array.isArray(teacher.specialties) && teacher.specialties.map((spec, index) => (
                        <Chip key={index} label={spec} size="small" />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleView(teacher)}
                      variant="outlined"
                    >
                      Voir
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(teacher)}
                      color="primary"
                      variant="contained"
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
          data={filteredTeachers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchable={false}
          title={`Liste des enseignants (${filteredTeachers.length})`}
        />
      )}

      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'enseignant{' '}
            <strong>{deleteDialog?.firstName} {deleteDialog?.lastName}</strong> ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Cette action est irréversible. Toutes les données associées seront perdues.
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

export default TeachersList;