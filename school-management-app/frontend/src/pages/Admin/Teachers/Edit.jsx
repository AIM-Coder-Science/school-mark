
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Autocomplete,
  Alert,
  Divider,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  LockReset as ResetIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { /*Box, Button,*/ useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const specialtyOptions = [
  'Mathématiques', 'Physique', 'Chimie', 'Sciences', 'Français', 'Anglais',
  'Histoire-Géographie', 'Philosophie', 'Éducation Physique', 'Informatique',
  'Technologie', 'Arts Plastiques', 'Musique',
];

const EditTeacher = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('Teacher123!');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const theme = useTheme();

  const schema = yup.object().shape({
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide').nullable().transform((v) => v === "" ? null : v),
    phone: yup.string().nullable(),
    specialties: yup.array().min(1, 'Au moins une spécialité est requise').required(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      phone: '',
      specialties: [],
    },
  });

  const watchedValues = watch();
  const watchedSpecialties = watch('specialties');

  useEffect(() => {
    if (teacherId) {
      fetchInitialData();
    }
  }, [teacherId]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      
      // Charger toutes les données en parallèle
      const [teacherRes, classesRes, subjectsRes] = await Promise.all([
        adminAPI.getTeacher(teacherId),
        adminAPI.getAllClasses(),
        adminAPI.getAllSubjects(),
      ]);

      const teacher = teacherRes.data.data;
      console.log('Données enseignant reçues:', teacher);
      
      // Normaliser les noms de champs
      const normalizedTeacher = {
        ...teacher,
        firstName: teacher.firstName || teacher.first_name || '',
        lastName: teacher.lastName || teacher.last_name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        matricule: teacher.matricule || '',
      };

      setTeacherData(normalizedTeacher);

      // Remplir le formulaire avec les valeurs existantes
      reset({
        firstName: normalizedTeacher.firstName,
        lastName: normalizedTeacher.lastName,
        matricule: normalizedTeacher.matricule,
        email: normalizedTeacher.email,
        phone: normalizedTeacher.phone,
        specialties: Array.isArray(teacher.specialties) 
          ? teacher.specialties 
          : (typeof teacher.specialties === 'string' ? teacher.specialties.split(',').map(s => s.trim()) : []),
      });

      // Définir le statut
      const isActiveValue = teacher.user?.isActive ?? /*teacher.user?.is_active ??*/ true;
      setIsActive(isActiveValue);

      // Charger les classes et matières
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);

      // Charger les affectations existantes
      const existingAssignments = [];
      if (teacher.assignedClasses) {
        for (const classItem of teacher.assignedClasses) {
          if (classItem.subjectsTaught && Array.isArray(classItem.subjectsTaught)) {
            for (const subject of classItem.subjectsTaught) {
              existingAssignments.push({
                classId: classItem.id,
                className: classItem.name,
                subjectId: subject.id,
                subjectName: subject.name,
              });
            }
          }
        }
      }
      
      setAssignments(existingAssignments);
      console.log('Affectations chargées:', existingAssignments);
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Impossible de charger les données');
      navigate('/admin/teachers');
    } finally {
      setInitialLoading(false);
    }
  };

  const filterAssignmentsBySpecialties = () => {
    if (!watchedSpecialties?.length) return;

    const updatedAssignments = assignments.filter(assignment => {
      const subject = subjects.find(s => s.id === assignment.subjectId);
      if (!subject) return false;
      
      return watchedSpecialties.some(spec => 
        subject.name.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(subject.name.toLowerCase())
      );
    });

    if (updatedAssignments.length !== assignments.length) {
      setAssignments(updatedAssignments);
      toast.info('Certaines affectations ont été retirées car incompatibles avec les nouvelles spécialités');
    }
  };

  const handleAddAssignment = () => {
    setAssignments([...assignments, { classId: '', subjectId: '' }]);
  };

  const handleRemoveAssignment = (index) => {
    const newAssignments = [...assignments];
    newAssignments.splice(index, 1);
    setAssignments(newAssignments);
  };

  const handleAssignmentChange = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;
    
    if (field === 'classId') {
      const selectedClass = classes.find(c => c.id === value);
      updated[index].className = selectedClass?.name || '';
    } else if (field === 'subjectId') {
      const selectedSubject = subjects.find(s => s.id === value);
      updated[index].subjectName = selectedSubject?.name || '';
    }
    
    setAssignments(updated);
  };

  const getAvailableSubjectsForSpecialties = () => {
    if (!watchedSpecialties?.length) return [];

    return subjects.filter(subject => {
      return watchedSpecialties.some(spec => 
        subject.name.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(subject.name.toLowerCase())
      );
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Valider les affectations
      const validAssignments = assignments.filter(a => a.classId && a.subjectId);
      
      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        matricule: data.matricule,
        email: data.email || null,
        phone: data.phone || null,
        specialties: data.specialties,
        assignments: validAssignments.map(a => ({
          classId: a.classId,
          subjectId: a.subjectId
        }))
      };

      await adminAPI.updateTeacher(teacherId, updateData);
      
      // Mettre à jour le statut si changé
      if (isActive !== (teacherData?.user?.isActive ?? /*teacherData?.user?.is_active ??*/ true)) {
        const userId = teacherData?.userId || teacherData?.user?.id;
        if (userId) {
          await adminAPI.toggleUserStatus(userId, { isActive });
        }
      }
      
      toast.success('Enseignant mis à jour avec succès !');
      navigate('/admin/teachers');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const userId = teacherData?.userId || teacherData?.user?.id;
      if (!userId) {
        toast.error('ID utilisateur introuvable');
        return;
      }
      
      await adminAPI.resetUserPassword(userId, { password: newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
      setOpenResetDialog(false);
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?')) {
        navigate('/admin/teachers');
      }
    } else {
      navigate('/admin/teachers');
    }
  };

  if (initialLoading) return <Loader />;

  const availableSubjects = getAvailableSubjectsForSpecialties();

  return (
    <>
      <Helmet>
        <title>Modifier Enseignant | Admin</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        {/* En-tête */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: 3
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton onClick={() => navigate('/admin/teachers')} sx={{ color: 'white' }}>
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Modifier l'enseignant
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {watchedValues.firstName} {watchedValues.lastName} • Matricule : {watchedValues.matricule}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    color="default"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    {isActive ? "Actif" : "Inactif"}
                  </Typography>
                }
              />
            </Box>
            
            {loading && <LinearProgress sx={{ mt: 1 }} />}
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 1 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Informations personnelles */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Informations personnelles
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Prénom *"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nom *"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="matricule"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Matricule *"
                      error={!!errors.matricule}
                      helperText={errors.matricule?.message}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Téléphone"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="specialties"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={specialtyOptions}
                      value={field.value || []}
                      onChange={(_, val) => field.onChange(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Spécialités *"
                          error={!!errors.specialties}
                          helperText={errors.specialties?.message}
                          variant="outlined"
                          size="medium"
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option}
                              size="medium"
                              color="primary"
                              {...tagProps}
                              sx={{ fontWeight: 500 }}
                            />
                          );
                        })
                      }
                    />
                  )}
                />
              </Grid>

              {/* Affectations */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon /> Affectations (Classes et Matières)
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddAssignment}
                    variant="contained"
                    size="medium"
                    disabled={!watchedSpecialties?.length}
                    sx={{ 
                      bgcolor: 'secondary.main',
                      '&:hover': { bgcolor: 'secondary.dark' }
                    }}
                  >
                    Ajouter
                  </Button>
                </Box>

                {!watchedSpecialties?.length && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Veuillez d'abord sélectionner au moins une spécialité pour pouvoir ajouter des affectations
                  </Alert>
                )}

                {availableSubjects.length === 0 && watchedSpecialties?.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Aucune matière dans le système ne correspond aux spécialités sélectionnées
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                {assignments.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell width="40%" sx={{ fontWeight: 700 }}>Classe</TableCell>
                          <TableCell width="50%" sx={{ fontWeight: 700 }}>Matière</TableCell>
                          <TableCell width="10%" align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map((assignment, index) => (
                          <TableRow 
                            key={index}
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              '&:last-child td, &:last-child th': { border: 0 }
                            }}
                          >
                            <TableCell>
                              <FormControl fullWidth size="medium">
                                <Select
                                  value={assignment.classId || ''}
                                  onChange={(e) => handleAssignmentChange(index, 'classId', e.target.value)}
                                  displayEmpty
                                  variant="outlined"
                                >
                                  <MenuItem value="">
                                    <em>Sélectionner une classe</em>
                                  </MenuItem>
                                  {classes.map((cls) => (
                                    <MenuItem key={cls.id} value={cls.id}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SchoolIcon fontSize="small" color="action" />
                                        {cls.name} - {cls.level}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <FormControl fullWidth size="medium">
                                <Select
                                  value={assignment.subjectId || ''}
                                  onChange={(e) => handleAssignmentChange(index, 'subjectId', e.target.value)}
                                  displayEmpty
                                  disabled={!assignment.classId || !availableSubjects.length}
                                  variant="outlined"
                                >
                                  <MenuItem value="">
                                    <em>Sélectionner une matière</em>
                                  </MenuItem>
                                  {availableSubjects.map((subject) => (
                                    <MenuItem key={subject.id} value={subject.id}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BookIcon fontSize="small" color="action" />
                                        {subject.name} ({subject.code})
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveAssignment(index)}
                                disabled={assignments.length <= 1}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Card variant="outlined" sx={{ textAlign: 'center', py: 4 }}>
                    <BookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Aucune affectation définie
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Ajoutez des affectations pour permettre à l'enseignant de saisir des notes
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddAssignment}
                      variant="outlined"
                      disabled={!watchedSpecialties?.length}
                    >
                      Ajouter une affectation
                    </Button>
                  </Card>
                )}
              </Grid>

              {/* Zone de sécurité */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }} />
                <Card variant="outlined" sx={{ borderColor: 'error.light', bgcolor: '#fff5f5' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ResetIcon /> Zone de sécurité
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Réinitialiser le mot de passe
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          L'enseignant devra utiliser le nouveau mot de passe pour sa prochaine connexion
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => setOpenResetDialog(true)}
                        startIcon={<ResetIcon />}
                        size="medium"
                      >
                        Réinitialiser
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  gap: 2, 
                  mt: 4,
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    size="large"
                    sx={{ minWidth: 120 }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading || !isDirty}
                    size="large"
                    sx={{
                      minWidth: 200,
                      bgcolor: 'primary.main',
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                      },
                      '&.Mui-disabled': {
                        background: 'grey.300',
                      },
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* Dialog de réinitialisation */}
      <Dialog 
        open={openResetDialog} 
        onClose={() => setOpenResetDialog(false)} 
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
          Réinitialiser le mot de passe
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Définissez un nouveau mot de passe temporaire pour l'enseignant :
            <br />
            <strong>{watchedValues.firstName} {watchedValues.lastName}</strong>
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="text"
            helperText="Le mot de passe doit être communiqué à l'enseignant"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenResetDialog(false)} variant="outlined">
            Annuler
          </Button>
          <Button 
            onClick={handleResetPassword} 
            color="error" 
            variant="contained"
            disabled={loading}
            sx={{ 
              minWidth: 120,
              bgcolor: 'error.main',
              '&:hover': { bgcolor: 'error.dark' }
            }}
          >
            {loading ? 'En cours...' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditTeacher;


/*
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Autocomplete,
  Alert,
  Divider,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  LockReset as ResetIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../../components/common/Loader';

const specialtyOptions = [
  'Mathématiques', 'Physique', 'Chimie', 'Sciences', 'Français', 'Anglais',
  'Histoire-Géographie', 'Philosophie', 'Éducation Physique', 'Informatique',
  'Technologie', 'Arts Plastiques', 'Musique',
];

const EditTeacher = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('Teacher123!');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isActive, setIsActive] = useState(true);

  const schema = yup.object().shape({
    firstName: yup.string().required('Le prénom est requis'),
    lastName: yup.string().required('Le nom est requis'),
    matricule: yup.string().required('Le matricule est requis'),
    email: yup.string().email('Email invalide').nullable().transform((v) => v === "" ? null : v),
    phone: yup.string().nullable(),
    specialties: yup.array().min(1, 'Au moins une spécialité est requise').required(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      matricule: '',
      email: '',
      phone: '',
      specialties: [],
    },
  });

  const watchedValues = watch();
  const watchedSpecialties = watch('specialties');

  useEffect(() => {
    if (teacherId) {
      fetchInitialData();
    }
  }, [teacherId]);

  // Filtrer les affectations quand les spécialités changent
  useEffect(() => {
    if (watchedSpecialties) {
      filterAssignmentsBySpecialties();
    }
  }, [watchedSpecialties]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const [teacherRes, classesRes, subjectsRes] = await Promise.all([
        adminAPI.getTeacher(teacherId),
        adminAPI.getAllClasses(),
        adminAPI.getAllSubjects(),
      ]);

      const teacher = teacherRes.data.data;
      console.log('Données enseignant reçues:', teacher);
      
      // Utiliser les bons noms de champs (snake_case ou camelCase selon votre backend)
      setValue('firstName', teacher.firstName || teacher.first_name || '');
      setValue('lastName', teacher.lastName || teacher.last_name || '');
      setValue('matricule', teacher.matricule || '');
      setValue('email', teacher.email || '');
      setValue('phone', teacher.phone || '');
      
      let specs = teacher.specialties;
      if (typeof specs === 'string') {
        try { specs = JSON.parse(specs); } catch (e) { specs = []; }
      }
      setValue('specialties', Array.isArray(specs) ? specs : []);
      
      // Vérifier le statut avec les différents formats possibles
      const isActiveValue = teacher.user?.isActive ?? teacher.user?.is_active ?? true;
      setIsActive(isActiveValue);
      
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);

      // Charger les affectations existantes
      const existingAssignments = [];
      if (teacher.assignedClasses) {
        for (const classItem of teacher.assignedClasses) {
          const subjectsTaught = classItem.subjectsTaught || [];
          for (const subject of subjectsTaught) {
            existingAssignments.push({
              classId: classItem.id,
              className: classItem.name,
              subjectId: subject.id,
              subjectName: subject.name,
            });
          }
        }
      }
      setAssignments(existingAssignments);
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Impossible de charger les données');
      navigate('/admin/teachers');
    } finally {
      setInitialLoading(false);
    }
  };

  const filterAssignmentsBySpecialties = () => {
    // Retirer les affectations dont la matière n'est plus dans les spécialités
    const updatedAssignments = assignments.filter(assignment => {
      const subject = subjects.find(s => s.id === assignment.subjectId);
      if (!subject) return false;
      
      // Vérifier si la matière correspond à une spécialité
      return watchedSpecialties.some(spec => 
        subject.name.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(subject.name.toLowerCase())
      );
    });

    if (updatedAssignments.length !== assignments.length) {
      setAssignments(updatedAssignments);
      toast.info('Certaines affectations ont été retirées car incompatibles avec les nouvelles spécialités');
    }
  };

  const handleAddAssignment = () => {
    setAssignments([...assignments, { classId: '', subjectId: '' }]);
  };

  const handleRemoveAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleAssignmentChange = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;
    
    if (field === 'classId') {
      const selectedClass = classes.find(c => c.id === value);
      updated[index].className = selectedClass?.name;
    } else if (field === 'subjectId') {
      const selectedSubject = subjects.find(s => s.id === value);
      updated[index].subjectName = selectedSubject?.name;
    }
    
    setAssignments(updated);
  };

  const getAvailableSubjectsForSpecialties = () => {
    return subjects.filter(subject => {
      return watchedSpecialties.some(spec => 
        subject.name.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(subject.name.toLowerCase())
      );
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Valider les affectations
      const validAssignments = assignments.filter(a => a.classId && a.subjectId);
      
      const updateData = {
        ...data,
        assignments: validAssignments.map(a => ({
          classId: a.classId,
          subjectId: a.subjectId
        }))
      };

      await adminAPI.updateTeacher(teacherId, updateData);
      
      // Mettre à jour le statut si changé
      await adminAPI.toggleUserStatus(teacherId, { isActive });
      
      toast.success('Enseignant mis à jour avec succès !');
      navigate('/admin/teachers');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      await adminAPI.resetUserPassword(teacherId, { password: newPassword });
      toast.success('Mot de passe réinitialisé');
      setOpenResetDialog(false);
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <Loader />;

  const availableSubjects = getAvailableSubjectsForSpecialties();

  return (
    <>
      <Helmet><title>Modifier Enseignant | Admin</title></Helmet>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/teachers')}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Modifier {watchedValues.firstName} {watchedValues.lastName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Matricule : {watchedValues.matricule}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="success"
              />
            }
            label={isActive ? "Actif" : "Inactif"}
          />
        </Box>

        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Informations de base }/*
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Informations personnelles
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Prénom *"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nom *"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="matricule"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Matricule *"
                      error={!!errors.matricule}
                      helperText={errors.matricule?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Téléphone"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="specialties"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={specialtyOptions}
                      value={field.value || []}
                      onChange={(_, val) => field.onChange(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Spécialités *"
                          error={!!errors.specialties}
                          helperText={errors.specialties?.message}
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option}
                              size="small"
                              color="primary"
                              {...tagProps}
                            />
                          );
                        })
                      }
                    />
                  )}
                />
              </Grid>

              {/* Affectations }
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Affectations (Classes et Matières)
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddAssignment}
                    variant="outlined"
                    size="small"
                    disabled={!watchedSpecialties?.length || !availableSubjects.length}
                  >
                    Ajouter
                  </Button>
                </Box>

                {!watchedSpecialties?.length && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Veuillez d'abord sélectionner au moins une spécialité
                  </Alert>
                )}

                {availableSubjects.length === 0 && watchedSpecialties?.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Aucune matière ne correspond aux spécialités sélectionnées
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                {assignments.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%">Classe</TableCell>
                          <TableCell width="50%">Matière</TableCell>
                          <TableCell width="10%" align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map((assignment, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={assignment.classId || ''}
                                  onChange={(e) => handleAssignmentChange(index, 'classId', e.target.value)}
                                  displayEmpty
                                >
                                  <MenuItem value="">
                                    <em>Sélectionner une classe</em>
                                  </MenuItem>
                                  {classes.map((cls) => (
                                    <MenuItem key={cls.id} value={cls.id}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SchoolIcon fontSize="small" color="action" />
                                        {cls.name} - {cls.level}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={assignment.subjectId || ''}
                                  onChange={(e) => handleAssignmentChange(index, 'subjectId', e.target.value)}
                                  displayEmpty
                                  disabled={!availableSubjects.length}
                                >
                                  <MenuItem value="">
                                    <em>Sélectionner une matière</em>
                                  </MenuItem>
                                  {availableSubjects.map((subject) => (
                                    <MenuItem key={subject.id} value={subject.id}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BookIcon fontSize="small" color="action" />
                                        {subject.name} ({subject.code})
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveAssignment(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    Aucune affectation. Cliquez sur "Ajouter" pour assigner des classes et matières.
                  </Alert>
                )}
              </Grid>

              {/* Zone de sécurité }/*
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResetIcon fontSize="small" /> Zone de sécurité
                </Typography>
                <Card variant="outlined" sx={{ borderColor: 'error.light', bgcolor: '#fff5f5' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Réinitialiser le mot de passe
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          L'enseignant devra utiliser le nouveau mot de passe pour se connecter
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setOpenResetDialog(true)}
                        startIcon={<ResetIcon />}
                      >
                        Réinitialiser
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions }/*
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/teachers')}
                    size="large"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                    sx={{
                      px: 4,
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                      },
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

      {/* Dialog de réinitialisation }/*
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Définissez un nouveau mot de passe temporaire pour cet enseignant.
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="text"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Annuler</Button>
          <Button onClick={handleResetPassword} color="error" variant="contained" disabled={loading}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditTeacher;
*/