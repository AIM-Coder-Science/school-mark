import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  DeleteForever as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      grades: true,
      publications: true,
    },
    display: {
      theme: 'light',
      language: 'fr',
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleNotificationChange = (key) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
    toast.success('Paramètre mis à jour');
  };

  const handleDisplayChange = (key, value) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        [key]: value,
      },
    });
    toast.success('Paramètre mis à jour');
  };

  const handlePrivacyChange = (key) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    });
    toast.success('Paramètre mis à jour');
  };

  const handleExportData = () => {
    toast.info('Exportation des données en cours...');
    // Implémenter l'exportation des données
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    toast.error('Fonctionnalité de suppression de compte en développement');
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Paramètres</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
          Paramètres
        </Typography>

        <Grid container spacing={3}>
          {/* Notifications */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <NotificationsIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                  }
                  label="Notifications par email"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                  }
                  label="Notifications push"
                  sx={{ display: 'block', mt: 1 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.grades}
                      onChange={() => handleNotificationChange('grades')}
                    />
                  }
                  label="Alertes pour nouvelles notes"
                  sx={{ display: 'block', mt: 1 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.publications}
                      onChange={() => handleNotificationChange('publications')}
                    />
                  }
                  label="Alertes pour publications"
                  sx={{ display: 'block', mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Affichage */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PaletteIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Affichage
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Thème</InputLabel>
                  <Select
                    value={settings.display.theme}
                    label="Thème"
                    onChange={(e) => handleDisplayChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">Clair</MenuItem>
                    <MenuItem value="dark">Sombre</MenuItem>
                    <MenuItem value="auto">Automatique</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Langue</InputLabel>
                  <Select
                    value={settings.display.language}
                    label="Langue"
                    onChange={(e) => handleDisplayChange('language', e.target.value)}
                    startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Confidentialité */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SecurityIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Confidentialité
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.profileVisible}
                      onChange={() => handlePrivacyChange('profileVisible')}
                    />
                  }
                  label="Profil visible"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showEmail}
                      onChange={() => handlePrivacyChange('showEmail')}
                    />
                  }
                  label="Afficher mon email"
                  sx={{ display: 'block', mt: 1 }}
                />

                <Alert severity="info" sx={{ mt: 3 }}>
                  Vos informations personnelles sont protégées conformément au RGPD.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Données et compte */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <DownloadIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Données et compte
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleExportData}
                  sx={{ mb: 2 }}
                >
                  Exporter mes données
                </Button>

                <Alert severity="warning" sx={{ mb: 2 }}>
                  L'exportation inclut toutes vos notes, bulletins et informations personnelles.
                </Alert>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" color="error" sx={{ mb: 2 }}>
                  Zone dangereuse
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAccount}
                >
                  Supprimer mon compte
                </Button>

                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  Cette action est irréversible et supprimera toutes vos données.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Informations */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                À propos
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Version de l'application
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    1.0.0
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Dernière mise à jour
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date().toLocaleDateString('fr-FR')}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression du compte</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible
            et toutes vos données seront définitivement supprimées.
          </DialogContentText>
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Attention:</strong> Vous perdrez :
            <ul>
              <li>Toutes vos notes et bulletins</li>
              <li>Votre historique de présence</li>
              <li>Vos informations personnelles</li>
              <li>Votre accès à la plateforme</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={confirmDeleteAccount} color="error" variant="contained">
            Supprimer définitivement
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Settings;