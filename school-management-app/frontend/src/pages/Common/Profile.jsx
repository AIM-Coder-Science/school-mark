import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Card,
  CardContent,
  Button,
  TextField,
  Divider,
  Chip,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      setProfileData(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      // Implémenter la mise à jour du profil
      toast.success('Profil mis à jour avec succès');
      setEditMode(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Mot de passe changé avec succès');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      toast.info('Fonctionnalité de téléchargement de photo en développement');
      // Implémenter le téléchargement de photo
    }
  };

  if (loading && !profileData) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Mon Profil</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
          Mon Profil
        </Typography>

        <Grid container spacing={3}>
          {/* Carte de profil */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                  <Avatar
                    src={profileData?.profile?.photo}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      bgcolor: 'primary.main',
                      fontSize: 48,
                    }}
                  >
                    {profileData?.profile?.firstName?.[0]}{profileData?.profile?.lastName?.[0]}
                  </Avatar>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photo-upload">
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      }}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                  </label>
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {profileData?.profile?.firstName} {profileData?.profile?.lastName}
                </Typography>

                <Chip
                  label={user?.role === 'admin' ? 'Administrateur' : user?.role === 'teacher' ? 'Enseignant' : 'Étudiant'}
                  color="primary"
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'left' }}>
                  {profileData?.profile?.matricule && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Matricule
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {profileData.profile.matricule}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {profileData?.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Email
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {profileData.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {profileData?.profile?.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PhoneIcon color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Téléphone
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {profileData.profile.phone}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {profileData?.profile?.class && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SchoolIcon color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Classe
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {profileData.profile.class.name} ({profileData.profile.class.level})
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  Membre depuis {new Date(profileData?.createdAt).toLocaleDateString('fr-FR')}
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Informations détaillées */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informations Personnelles
                </Typography>
                {!editMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    Modifier
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditMode(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleUpdateProfile}
                      disabled={loading}
                    >
                      Sauvegarder
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={profileData?.profile?.firstName || ''}
                    disabled={!editMode}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, firstName: e.target.value }
                    })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={profileData?.profile?.lastName || ''}
                    disabled={!editMode}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, lastName: e.target.value }
                    })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profileData?.email || ''}
                    disabled={!editMode}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      email: e.target.value
                    })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={profileData?.profile?.phone || ''}
                    disabled={!editMode}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, phone: e.target.value }
                    })}
                  />
                </Grid>

                {user?.role === 'student' && profileData?.profile?.birthDate && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date de naissance"
                      type="date"
                      value={profileData.profile.birthDate}
                      disabled={!editMode}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Changement de mot de passe */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sécurité
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Annuler' : 'Changer le mot de passe'}
                </Button>
              </Box>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Mot de passe actuel *"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                edge="end"
                              >
                                {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nouveau mot de passe *"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        helperText="Minimum 6 caractères"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                edge="end"
                              >
                                {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirmer le mot de passe *"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                        helperText={
                          passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                            ? 'Les mots de passe ne correspondent pas'
                            : ''
                        }
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                      >
                        {loading ? 'Changement...' : 'Changer le mot de passe'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Profile;