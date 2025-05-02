import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients, createClient, Client, ClientCreate } from '../lib/api';

const ClientService: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [openDialog, setOpenDialog] = useState(false);
  const [newClient, setNewClient] = useState<Partial<ClientCreate>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  const { data: clients = [], isLoading, error: fetchError } = useQuery<Client[], Error>({
    queryKey: ['clients', token],
    queryFn: () => fetchClients(0, 100, token),
    enabled: !!token,
    refetchOnWindowFocus: false,
  });

  const createClientMutation = useMutation<Client, Error, ClientCreate>({
    mutationFn: (clientData) => createClient(clientData, token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients', token] });
      setOpenDialog(false);
      setNewClient({});
      setSaveError(null);
      setShowSuccessSnackbar(true);
      console.log('Client created:', data);
    },
    onError: (error) => {
      console.error("Failed to create client:", error);
      setSaveError(error.message || 'Failed to save client. Please check the details and try again.');
    },
  });

  const handleAddClient = () => {
    setNewClient({});
    setSaveError(null);
    setOpenDialog(true);
  };

  const handleSaveClient = () => {
    if (!newClient.first_name || !newClient.surname || !newClient.client_identification) {
        setSaveError('First Name, Surname, and CPF/CNPJ (Client Identification) are required.');
        return;
    }
    setSaveError(null);

    const payload: ClientCreate = {
      first_name: newClient.first_name,
      surname: newClient.surname,
      client_identification: newClient.client_identification,
      address: newClient.address || null,
      city: newClient.city || null,
      state: newClient.state || null,
      country: newClient.country || 'Brasil',
      client_phone_number: newClient.client_phone_number || null,
      email: newClient.email || null,
      zip_code: newClient.zip_code || null,
    };
    
    createClientMutation.mutate(payload);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewClient({});
    setSaveError(null);
  };

  const handleInputChange = (field: keyof ClientCreate) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    setNewClient(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowSuccessSnackbar(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Client Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClient}
          disabled={isLoading}
        >
          New Client
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {fetchError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load clients: {fetchError.message}
        </Alert>
      )}

      {!isLoading && !fetchError && (
        <Grid container spacing={3}>
          {clients.map((client) => (
            <Grid item xs={12} md={6} lg={4} key={client.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{`${client.first_name || ''} ${client.surname || ''}`.trim()}</Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    CPF/CNPJ: {client.client_identification || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {client.email || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {client.client_phone_number || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Address: {[client.address, client.city, client.state, client.zip_code, client.country].filter(Boolean).join(', ') || 'N/A'}
                  </Typography>
                  {client.custom_field && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Custom Field: {client.custom_field}
                      </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {clients.length === 0 && (
            <Grid item xs={12}>
                <Typography sx={{ textAlign: 'center', mt: 4 }}>No clients found.</Typography>
            </Grid>
           )}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>New Client</DialogTitle>
        <DialogContent>
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="First Name"
            fullWidth
            required
            value={newClient.first_name ?? ''}
            onChange={handleInputChange('first_name')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="Surname"
            fullWidth
            required
            value={newClient.surname ?? ''}
            onChange={handleInputChange('surname')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="CPF/CNPJ (Client Identification)"
            fullWidth
            required
            value={newClient.client_identification ?? ''}
            onChange={handleInputChange('client_identification')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newClient.email ?? ''}
            onChange={handleInputChange('email')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={newClient.client_phone_number ?? ''}
            onChange={handleInputChange('client_phone_number')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={newClient.address ?? ''}
            onChange={handleInputChange('address')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="City"
            fullWidth
            value={newClient.city ?? ''}
            onChange={handleInputChange('city')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="State"
            fullWidth
            value={newClient.state ?? ''}
            onChange={handleInputChange('state')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="Zip Code"
            fullWidth
            value={newClient.zip_code ?? ''}
            onChange={handleInputChange('zip_code')}
            disabled={createClientMutation.isPending}
          />
          <TextField
            margin="dense"
            label="Country"
            fullWidth
            value={newClient.country ?? 'Brasil'}
            onChange={handleInputChange('country')}
            disabled={createClientMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={createClientMutation.isPending}>Cancel</Button>
          <Button 
            onClick={handleSaveClient} 
            variant="contained" 
            disabled={createClientMutation.isPending}
          >
            {createClientMutation.isPending ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message="Client saved successfully!"
      />

    </Box>
  );
};

export default ClientService; 