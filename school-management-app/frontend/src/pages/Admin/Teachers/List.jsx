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
  Badge,
  Alert,
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
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
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
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllTeachers();
      const teachersData = response.data.data || [];
      
      // Normaliser les données pour assurer la cohérence
      const normalizedTeachers = teachersData.map(teacher => ({
        ...teacher,
        user: {
          ...teacher.user,
          isActive: teacher.user?.isActive /*?? teacher.user?.is_active ?? false*/
        }
      }));
      
      setTeachers(normalizedTeachers);
    } catch (error) {
      console.error('Erreur fetchTeachers:', error);
      toast.error('Erreur lors du chargement des enseignants');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    // Empêcher les clics multiples
    if (processingIds.has(teacher.id)) return;
    
    const userIdToUse = teacher.userId || teacher.user?.id;
    if (!userIdToUse) {
      toast.error('ID utilisateur introuvable');
      return;
    }

    const currentStatus = teacher.user?.isActive /*?? teacher.user?.is_active ?? false;*/;
    const newStatus = !currentStatus;

    try {
      setProcessingIds(prev => new Set([...prev, teacher.id]));
      
      await adminAPI.toggleUserStatus(userIdToUse, { 
        isActive: newStatus 
      });
      
      // Mettre à jour l'état local immédiatement pour un feedback instantané
      setTeachers(prevTeachers => 
        prevTeachers.map(t => 
          t.id === teacher.id 
            ? {
                ...t,
                user: {
                  ...t.user,
                  isActive: newStatus
                }
              }
            : t
        )
      );
      
      toast.success(`Enseignant ${newStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur toggle status:', error);
      toast.error('Erreur lors du changement de statut');
      // Recharger les données pour s'assurer de la cohérence
      fetchTeachers();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(teacher.id);
        return newSet;
      });
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
      (teacher.firstName?.toLowerCase().includes(search.toLowerCase()) ||
       teacher.lastName?.toLowerCase().includes(search.toLowerCase()) ||
       teacher.matricule?.toLowerCase().includes(search.toLowerCase()) ||
       teacher.email?.toLowerCase().includes(search.toLowerCase()));

    const statusMatch = selectedStatus === 'all' || 
      (selectedStatus === 'active' && teacher.user?.isActive) ||
      (selectedStatus === 'inactive' && !teacher.user?.isActive);

    return searchMatch && statusMatch;
  });

  const activeCount = teachers.filter(t => t.user?.isActive).length;
  const inactiveCount = teachers.length - activeCount;

  const columns = [
    {
      field: 'teacher',
      headerName: 'Enseignant',
      width: 280,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            color={row.user?.isActive ? "success" : "error"}
            variant="dot"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <Avatar 
              src={row.photo} 
              sx={{ 
                bgcolor: 'primary.main',
                width: 48,
                height: 48,
                fontSize: '1.2rem',
                fontWeight: 600
              }}
            >
              {row.firstName?.[0]}{row.lastName?.[0]}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BadgeIcon fontSize="inherit" />
              {row.matricule}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      width: 240,
      render: (value, row) => (
        <Box>
          {row.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <MailIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                {row.email}
              </Typography>
            </Box>
          )}
          {row.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="body2">{row.phone}</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'specialties',
      headerName: 'Spécialités',
      width: 220,
      render: (value) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {Array.isArray(value) && value.slice(0, 3).map((spec, index) => (
            <Chip 
              key={index} 
              label={spec} 
              size="small" 
              color="primary"
              sx={{ 
                fontWeight: 500,
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
          {Array.isArray(value) && value.length > 3 && (
            <Chip 
              label={`+${value.length - 3}`} 
              size="small" 
              variant="outlined"
              color="primary"
            />
          )}
        </Box>
      ),
    },
    {
      field: 'assignedClasses',
      headerName: 'Affectations',
      width: 150,
      render: (value) => (
        <Chip 
          icon={<SchoolIcon />}
          label={`${value?.length || 0}`} 
          size="small" 
          color="secondary"
          sx={{ 
            fontWeight: 600,
            bgcolor: 'secondary.light',
            '& .MuiChip-icon': { color: 'secondary.main' }
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 140,
      render: (value, row) => (
        <Tooltip title={row.user?.isActive ? "Désactiver" : "Activer"}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}>
            <Switch
              checked={row.user?.isActive || false}
              onChange={() => handleToggleStatus(row)}
              color="success"
              size="small"
              disabled={processingIds.has(row.id)}
            />
            <Chip 
              label={row.user?.isActive ? 'Actif' : 'Inactif'} 
              size="small"
              color={row.user?.isActive ? "success" : "error"}
              variant="filled"
              sx={{ 
                fontWeight: 600,
                minWidth: 70,
                bgcolor: row.user?.isActive ? 'success.light' : 'error.light',
                color: row.user?.isActive ? 'success.dark' : 'error.dark'
              }}
            />
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      render: (value, row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Voir détails">
            <IconButton 
              size="small"
              onClick={() => handleView(row)}
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light' }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Modifier">
            <IconButton 
              size="small"
              onClick={() => handleEdit(row)}
              sx={{ 
                color: 'info.main',
                '&:hover': { bgcolor: 'info.light' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton 
              size="small"
              onClick={() => handleDelete(row)}
              sx={{ 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.light' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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
        {/* En-tête avec statistiques */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: theme.shadows[4]
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                  Gestion des Enseignants
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {teachers.length} enseignant(s) • {activeCount} actif(s) • {inactiveCount} inactif(s)
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/admin/teachers/new')}
                size="large"
                sx={{ 
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[6]
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Nouvel Enseignant
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Barre de recherche et filtres */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: theme.shadows[1]
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom, matricule ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                size="medium"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  startIcon={<FilterIcon />}
                  onClick={(e) => setFilterAnchor(e.currentTarget)}
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    minWidth: 120,
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }}
                >
                  {selectedStatus === 'all' ? 'Tous' : selectedStatus === 'active' ? 'Actifs' : 'Inactifs'}
                </Button>
                <Button
                  onClick={fetchTeachers}
                  variant="outlined"
                  size="medium"
                  startIcon={<RefreshIcon />}
                >
                  Actualiser
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Menu filtre */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          <MenuItem 
            onClick={() => handleStatusFilter('all')}
            selected={selectedStatus === 'all'}
            sx={{ fontWeight: 600 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon fontSize="small" />
              Tous les enseignants
            </Box>
          </MenuItem>
          <MenuItem 
            onClick={() => handleStatusFilter('active')}
            selected={selectedStatus === 'active'}
            sx={{ color: 'success.main', fontWeight: 600 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label="Actif" size="small" color="success" />
              Enseignants actifs
            </Box>
          </MenuItem>
          <MenuItem 
            onClick={() => handleStatusFilter('inactive')}
            selected={selectedStatus === 'inactive'}
            sx={{ color: 'error.main', fontWeight: 600 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label="Inactif" size="small" color="error" />
              Enseignants inactifs
            </Box>
          </MenuItem>
        </Menu>
      </Box>

      {/* Liste des enseignants */}
      {isMobile ? (
        <Grid container spacing={2}>
          {filteredTeachers.map((teacher) => (
            <Grid item xs={12} key={teacher.id}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                borderLeft: `4px solid ${teacher.user?.isActive ? '#4caf50' : '#f44336'}`
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={teacher.photo} 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          width: 56, 
                          height: 56,
                          fontSize: '1.3rem',
                          fontWeight: 600
                        }}
                      >
                        {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
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
                      disabled={processingIds.has(teacher.id)}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Contact:
                    </Typography>
                    {teacher.email && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MailIcon fontSize="small" />
                        {teacher.email}
                      </Typography>
                    )}
                    {teacher.phone && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" />
                        {teacher.phone}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Spécialités:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {Array.isArray(teacher.specialties) && teacher.specialties.map((spec, index) => (
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

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleView(teacher)}
                      variant="outlined"
                      sx={{ flex: 1 }}
                    >
                      Voir
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(teacher)}
                      variant="contained"
                      color="primary"
                      sx={{ flex: 1 }}
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
          title={`Résultats (${filteredTeachers.length})`}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'error.light', 
          color: 'error.dark',
          fontWeight: 700,
          borderBottom: `1px solid ${theme.palette.error.main}`
        }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main',
                width: 60,
                height: 60,
                fontSize: '1.5rem',
                fontWeight: 600
              }}
            >
              {deleteDialog?.firstName?.[0]}{deleteDialog?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {deleteDialog?.firstName} {deleteDialog?.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {deleteDialog?.matricule}
              </Typography>
            </Box>
          </Box>
          
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Cette action est irréversible ! Toutes les données associées seront définitivement supprimées.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteDialog(null)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            sx={{ 
              minWidth: 100,
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' }
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeachersList;













/*import React, { useState, useEffect } from 'react';
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
    const currentStatus = teacher.user?.isActive ?? teacher.user?.is_active ?? false;
    const newStatus = !currentStatus;
    
    try {
      // Utiliser teacher.userId ou teacher.user.id (l'ID de l'utilisateur, pas du teacher)
      const userIdToUse = teacher.userId || teacher.user?.id;
      
      if (!userIdToUse) {
        toast.error('ID utilisateur introuvable');
        return;
      }
      
      await adminAPI.toggleUserStatus(userIdToUse, { 
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
*/