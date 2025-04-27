import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TenantData {
  name: string;
  email: string;
  phone: string;
  person_name: string;
  address: string;
  is_active: boolean;
  id: string;
  created_at: string;
  updated_at: string;
}

const fetchTenantData = async (token: string | null, backendUrl: string | undefined): Promise<TenantData> => {
  if (!token) {
    throw new Error('Authentication token not found.');
  }
  if (!backendUrl) {
    throw new Error('Backend URL is not configured.');
  }

  const response = await axios.get<TenantData>(`${backendUrl}/users/me`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    },
  });
  return response.data;
};

const deleteTenant = async (token: string | null, backendUrl: string | undefined): Promise<void> => {
  if (!token) {
    throw new Error('Authentication token not found.');
  }
  if (!backendUrl) {
    throw new Error('Backend URL is not configured.');
  }

  await axios.delete(`${backendUrl}/tenants/me`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    },
  });
};

const Profile = () => {
  const { token, logout } = useAuth();
  const backendUrl = window.runtimeConfig?.backendUrl;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { data: profile, isLoading, isError, error: queryError } = useQuery<TenantData, Error>({
    queryKey: ['tenantData', token],
    queryFn: () => fetchTenantData(token, backendUrl),
    enabled: !!token && !!backendUrl,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation<void, Error>({
    mutationFn: () => deleteTenant(token, backendUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantData'] });
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayError = queryError || deleteMutation.error;
  if (displayError) {
     return (
       <Alert severity="error">
         Error: {displayError?.message || 'An unknown error occurred.'}
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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {profile.person_name ? profile.person_name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
              <Typography variant="h5">{profile.person_name}</Typography>
              <Chip
                label={profile.is_active ? 'Active' : 'Inactive'}
                color={profile.is_active ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Tenant / Company Name"
                  secondary={profile.name}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Login Email"
                  secondary={profile.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={profile.phone}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Address"
                  secondary={profile.address}
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </Button>
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