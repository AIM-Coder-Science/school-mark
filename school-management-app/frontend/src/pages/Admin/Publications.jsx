import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const AdminPublications = () => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRoles: [],
  });

  const roles = [
    { value: 'teacher', label: 'Enseignants' },
    { value: 'student', label: 'Étudiants' },
  ];

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      // Simuler des publications
      const mockPublications = [
        {
          id: 1,
          title: 'Rentrée scolaire 2024-2025',
          content: 'La rentrée scolaire est fixée au 2 septembre 2024. Tous les enseignants et étudiants sont priés de se présenter à 8h00.',
          targetRoles: ['teacher', 'student'],
          created_at: '2024-08-15',
          authorRole: 'admin',
        },
        {
          id: 2,
          title: 'Conseil de classe',
          content: 'Réunion du conseil de classe pour le premier trimestre le 15 décembre 2024.',
          targetRoles: ['teacher'],
          created_at: '2024-12-01',
          authorRole: 'admin',
        },
      ];
      setPublications(mockPublications);
    } catch (error) {
      toast.error('Erreur lors du chargement des publications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ title: '', content: '', targetRoles: [] });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ title: '', content: '', targetRoles: [] });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || formData.targetRoles.length === 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await adminAPI.createPublication({
        title: formData.title,
        content: formData.content,
        targetRoles: formData.targetRoles,
      });
      
      toast.success('Publication créée avec succès');
      handleCloseDialog();
      fetchPublications();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDelete = (publication) => {
    setDeleteDialog(publication);
  };

  const confirmDelete = async () => {
    try {
      // Implémenter la suppression
      toast.success('Publication supprimée');
      setDeleteDialog(null);
      fetchPublications();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'teacher':
        return 'primary';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'teacher':
        return 'Enseignants';
      case 'student':
        return 'Étudiants';
      default:
        return role;
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Publications - Administration</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Gestion des Publications
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {publications.length} publication(s)
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              },
            }}
          >
            Nouvelle Publication
          </Button>
        </Box>

        <Grid container spacing={3}>
          {publications.map((publication) => (
            <Grid item xs={12} md={6} key={publication.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <NotificationsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {publication.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(publication.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => handleDelete(publication)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {publication.content.length > 150 
                      ? `${publication.content.substring(0, 150)}...` 
                      : publication.content}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {publication.targetRoles.map((role) => (
                      <Chip
                        key={role}
                        label={getRoleLabel(role)}
                        size="small"
                        color={getRoleChipColor(role)}
                        icon={role === 'teacher' ? <PeopleIcon /> : <SchoolIcon />}
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => toast.info('Fonctionnalité en développement')}
                  >
                    Voir détails
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => toast.info('Fonctionnalité en développement')}
                  >
                    Modifier
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {publications.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Aucune publication
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Créez votre première publication pour informer enseignants et étudiants
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Créer une publication
            </Button>
          </Paper>
        )}
      </Box>

      {/* Dialog de création/modification */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nouvelle Publication</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contenu *"
                multiline
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Destinataires *</InputLabel>
                <Select
                  multiple
                  value={formData.targetRoles}
                  onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })}
                  input={<OutlinedInput label="Destinataires *" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={getRoleLabel(value)}
                          size="small"
                          color={getRoleChipColor(value)}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Checkbox checked={formData.targetRoles.indexOf(role.value) > -1} />
                      <ListItemText primary={role.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            Publier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog
        open={Boolean(deleteDialog)}
        onClose={() => setDeleteDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la publication{' '}
            <strong>{deleteDialog?.title}</strong> ?
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

export default AdminPublications;