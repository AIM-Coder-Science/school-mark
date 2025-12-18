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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Book as BookIcon,
  Numbers as NumbersIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Loader from '../../../components/common/Loader';
import { adminAPI } from '../../../services/api';
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
      const response = await adminAPI.getAllSubjects();
      // On s'assure de récupérer les données correctement selon la structure de ta réponse API
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement matières:', error);
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
      await adminAPI.deleteSubject(deleteDialog.id);
      toast.success('Matière supprimée avec succès');
      setDeleteDialog(null);
      fetchSubjects();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    return !search || 
      subject.name.toLowerCase().includes(search.toLowerCase()) ||
      subject.code.toLowerCase().includes(search.toLowerCase());
  });

  // Définition des colonnes pour le tableau
  const columns = [
    {
      field: 'name',
      headerName: 'Matière',
      width: 250,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <BookIcon fontSize="small" />
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
 /*   {
      field: 'coefficient',
      headerName: 'Coeff. Base',
      width: 130,
      render: (value) => (
        <Chip
          label={`Coeff. ${value || 1}`} // ✅ Correction : Affiche 1 par défaut si la valeur est nulle
          size="small"
          color="secondary"
          variant="outlined"
          icon={<NumbersIcon sx={{ fontSize: '14px !important' }} />}
        />
      ),
    },*/
    {
      field: 'subjectClasses', // ✅ Alias correspondant à ton fichier index.js
      headerName: 'Classes',
      width: 140,
      render: (value) => (
        <Chip 
          label={`${Array.isArray(value) ? value.length : 0} classe(s)`}
          size="small"
          variant="contained"
          sx={{ bgcolor: 'grey.100' }}
        />
      ),
    },
    {
      field: 'subjectTeachers', // ✅ Alias correspondant à ton fichier index.js
      headerName: 'Enseignants',
      width: 140,
      render: (value) => (
        <Typography variant="body2">
          {Array.isArray(value) ? value.length : 0} prof(s).
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Date Création',
      width: 150,
      render: (value) => (
        <Typography variant="body2" color="textSecondary">
          {value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A'}
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
        <title>Matières | Administration</title>
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
              {subjects.length} matière(s) configurée(s) au total
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/subjects/new')}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Créer une matière
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom ou code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={fetchSubjects} color="primary" title="Actualiser">
                <RefreshIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {filteredSubjects.map((subject) => (
            <Grid item xs={12} key={subject.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                        <BookIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {subject.name}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          CODE: {subject.code}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`Coeff. ${subject.coefficient || 1}`}
                      size="small"
                      color="secondary"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" color="primary">{Array.isArray(subject.subjectClasses) ? subject.subjectClasses.length : 0}</Typography>
                      <Typography variant="caption" color="textSecondary">Classes</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" color="primary">{Array.isArray(subject.subjectTeachers) ? subject.subjectTeachers.length : 0}</Typography>
                      <Typography variant="caption" color="textSecondary">Profs</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      fullWidth 
                      onClick={() => handleView(subject)}
                    >
                      Détails
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      fullWidth 
                      onClick={() => handleEdit(subject)}
                    >
                      Modifier
                    </Button>
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => handleDelete(subject)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredSubjects.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center' }}>
                <Typography color="textSecondary">Aucune matière trouvée</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        <DataTable
          columns={columns}
          data={filteredSubjects}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchable={false} // On utilise notre propre barre de recherche au-dessus
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Supprimer la matière ?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Voulez-vous vraiment supprimer la matière <strong>{deleteDialog?.name}</strong> ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, p: 1, bgcolor: 'error.lighter', borderRadius: 1 }}>
            Attention : Cette action est irréversible et pourrait échouer si des notes sont déjà enregistrées.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Confirmer la suppression
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubjectsList;