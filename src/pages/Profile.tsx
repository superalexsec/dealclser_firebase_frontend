import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  DeleteForever as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { 
    TenantData, 
    TenantUpdate, 
    fetchTenantData, 
    updateTenantData, 
    logoutTenant, 
    deleteTenant 
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<TenantUpdate>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  const { data: profile, isLoading, error: queryError } = useQuery<TenantData, Error>({
    queryKey: ['tenantData', token],
    queryFn: () => fetchTenantData(token),
    enabled: !!token,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setFormState({
        name: profile.name,
        phone: profile.phone,
        person_name: profile.person_name,
        address: profile.address,
      });
    } else if (profile) {
      setFormState((prev) => ({
        name: prev.name ?? profile.name,
        phone: prev.phone ?? profile.phone,
        person_name: prev.person_name ?? profile.person_name,
        address: prev.address ?? profile.address,
      }));
    }
  }, [profile, isEditing]);

  const updateMutation = useMutation<TenantData, Error, TenantUpdate>({
    mutationFn: (updateData) => updateTenantData(updateData, token),
    onSuccess: (data) => {
      queryClient.setQueryData(['tenantData', token], data);
      setIsEditing(false);
      setUpdateError(null);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    },
    onError: (error) => {
      setUpdateError(error.message || 'Failed to update profile.');
      setUpdateSuccess(false);
    },
  });

  const logoutMutation = useMutation<void, Error>({
    mutationFn: () => logoutTenant(token),
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/');
    },
  });

  const deleteMutation = useMutation<void, Error>({
    mutationFn: () => deleteTenant(token),
    onSuccess: () => {
      queryClient.clear();
      logout();
      navigate('/');
    },
  });

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
    handleCloseDeleteDialog();
  };

  const handleInputChange = (field: keyof TenantUpdate) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [field]: event.target.value,
    });
  };

  const handleSave = () => {
    if (!formState.name || !formState.person_name || !formState.phone || !formState.address) {
      setUpdateError('All fields are required.');
      return;
    }
    setUpdateError(null);
    updateMutation.mutate(formState);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUpdateError(null);
    setUpdateSuccess(false);
    if (profile) {
      setFormState({
        name: profile.name,
        phone: profile.phone,
        person_name: profile.person_name,
        address: profile.address,
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setUpdateSuccess(false);
    setUpdateError(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayError = queryError || deleteMutation.error || updateMutation.error || logoutMutation.error;
  if (displayError && !isEditing) {
     return (
       <Alert severity="error" sx={{ mb: 2}}>
         Error: {displayError instanceof Error ? displayError.message : displayError || 'An unknown error occurred.'}
       </Alert>
     );
  }

  if (!profile) {
    return <Alert severity="warning">Profile data not available.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}
              >
                {formState.person_name ? formState.person_name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
              {isEditing ? (
                 <TextField
                   label="Person Name"
                   variant="outlined"
                   value={formState.person_name ?? ''}
                   onChange={handleInputChange('person_name')}
                   sx={{ mb: 1, width: '80%' }}
                   required
                 />
              ) : (
                 <Typography variant="h5">{profile.person_name}</Typography>
              )}
              <Chip
                label={profile.is_active ? 'Active' : 'Inactive'}
                color={profile.is_active ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            {updateError && isEditing && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}
            {updateSuccess && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully!</Alert>}

            <List>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                {isEditing ? (
                  <TextField fullWidth label="Tenant / Company Name" variant="standard" value={formState.name ?? ''} onChange={handleInputChange('name')} required />
                ) : (
                  <ListItemText primary="Tenant / Company Name" secondary={profile.name} />
                )}
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Login Email"
                  secondary={profile.email}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                {isEditing ? (
                  <TextField fullWidth label="Phone" variant="standard" value={formState.phone ?? ''} onChange={handleInputChange('phone')} required />
                ) : (
                  <ListItemText primary="Phone" secondary={profile.phone} />
                )}
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                 {isEditing ? (
                   <TextField fullWidth label="Address" variant="standard" value={formState.address ?? ''} onChange={handleInputChange('address')} required />
                 ) : (
                   <ListItemText primary="Address" secondary={profile.address} />
                 )}
              </ListItem>
            </List>

            <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                 {isEditing ? (
                     <Box sx={{ display: 'flex', gap: 2 }}>
                         <Button
                             variant="outlined"
                             startIcon={<CancelIcon />}
                             onClick={handleCancel}
                             disabled={updateMutation.isPending}
                         >
                             Cancel
                         </Button>
                         <Button
                             variant="contained"
                             color="primary"
                             startIcon={<SaveIcon />}
                             onClick={handleSave}
                             disabled={updateMutation.isPending}
                         >
                             {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                         </Button>
                     </Box>
                 ) : (
                     <Button
                         variant="contained"
                         startIcon={<EditIcon />}
                         onClick={handleEdit}
                         disabled={logoutMutation.isPending || deleteMutation.isPending}
                     >
                         Edit Profile
                     </Button>
                 )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {!isEditing && (
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<LogoutIcon />}
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending || deleteMutation.isPending}
                        >
                          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                        </Button>
                    )}

                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteClick}
                      disabled={deleteMutation.isPending || isEditing || logoutMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
                    </Button>
                 </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Account Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you absolutely sure you want to delete your account?
            All associated data will be permanently lost.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary" autoFocus>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 