import React from 'react';
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
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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

const Profile = () => {
  const { token } = useAuth();
  const backendUrl = window.runtimeConfig?.backendUrl;

  const { data: profile, isLoading, isError, error } = useQuery<TenantData, Error>({
    queryKey: ['tenantData', token],
    queryFn: () => fetchTenantData(token, backendUrl),
    enabled: !!token && !!backendUrl,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Error loading profile data: {error?.message || 'Unknown error'}
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
        {/* Profile Information */}
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 