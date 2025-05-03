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
  CardActionArea,
  IconButton,
  DialogContentText,
} from '@mui/material';
import { 
    Add as AddIcon, 
    Person as PersonIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Save as SaveIcon, 
    Cancel as CancelIcon 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { 
    fetchClients, 
    createClient, 
    updateClient, 
    deleteClient, 
    fetchTenantData,
    Client, 
    ClientCreate, 
    ClientUpdate, 
    TenantData
} from '../lib/api';

interface ClientDetailModalProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
    tenantData?: TenantData | null;
    isLoadingTenantData: boolean;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ open, onClose, client, tenantData, isLoadingTenantData }) => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editFormState, setEditFormState] = useState<ClientUpdate>({});
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

    useEffect(() => {
        if (client && open) {
            setIsEditing(false);
            setSaveError(null);
            setEditFormState({
                first_name: client.first_name || '',
                surname: client.surname || '',
                email: client.email || '',
                client_phone_number: client.client_phone_number || '',
                address: client.address || '',
                city: client.city || '',
                state: client.state || '',
                zip_code: client.zip_code || '',
                country: client.country || 'Brasil',
                custom_field: client.custom_field || ''
            });
        } else {
             setIsEditing(false);
             setSaveError(null);
        }
    }, [client, open]);

    const updateMutation = useMutation<Client, Error, ClientUpdate>({
        mutationFn: (updateData) => updateClient(client!.id, updateData, token),
        onSuccess: (updatedClient) => {
            queryClient.invalidateQueries({ queryKey: ['clients', token] });
            setIsEditing(false);
            setSaveError(null);
            setShowSuccessSnackbar(true);
        },
        onError: (error) => {
            setSaveError(error.message || 'Failed to update client.');
        },
    });

    const deleteMutation = useMutation<void, Error>({ 
        mutationFn: () => deleteClient(client!.id, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients', token] });
            setShowSuccessSnackbar(true);
            onClose();
        },
        onError: (error) => {
            setSaveError(error.message || 'Failed to delete client.');
            setOpenDeleteConfirm(false);
        },
    });

    const handleEdit = () => {
        setIsEditing(true);
        setSaveError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSaveError(null);
        if (client) {
            setEditFormState({
                first_name: client.first_name || '',
                surname: client.surname || '',
                email: client.email || '',
                client_phone_number: client.client_phone_number || '',
                address: client.address || '',
                city: client.city || '',
                state: client.state || '',
                zip_code: client.zip_code || '',
                country: client.country || 'Brasil',
                custom_field: client.custom_field || ''
            });
        }
    };

    const handleSaveEdit = () => {
        if (!editFormState.first_name || !editFormState.surname) {
            setSaveError('First Name and Surname are required.');
            return;
        }
        setSaveError(null);
        updateMutation.mutate(editFormState);
    };

    const handleDelete = () => {
        setOpenDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        deleteMutation.mutate();
    };

    const handleCloseDeleteConfirm = () => {
        setOpenDeleteConfirm(false);
    };

    const handleInputChange = (field: keyof ClientUpdate) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditFormState(prev => ({ ...prev, [field]: event.target.value }));
    };
    
    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
        return;
        }
        setShowSuccessSnackbar(false);
    };

    if (!client) return null;

    const customQuestionLabel = tenantData?.client_register_custom_question || 'Custom Field';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? 'Edit Client' : 'Client Details'}
                <Box sx={{ float: 'right' }}>
                     {!isEditing && (
                         <IconButton onClick={handleEdit} color="primary">
                             <EditIcon />
                         </IconButton>
                     )}
                     <IconButton onClick={handleDelete} color="error" sx={{ ml: 1 }} disabled={isEditing || deleteMutation.isPending}>
                         <DeleteIcon />
                     </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="First Name"
                            fullWidth
                            required
                            value={isEditing ? editFormState.first_name : client.first_name || ''}
                            onChange={handleInputChange('first_name')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField
                            label="Surname"
                            fullWidth
                            required
                            value={isEditing ? editFormState.surname : client.surname || ''}
                            onChange={handleInputChange('surname')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                             variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField
                            label="CPF/CNPJ (Client Identification)"
                            fullWidth
                            value={client.client_identification || 'N/A'}
                            InputProps={{ readOnly: true }}
                             variant={"standard"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            value={isEditing ? editFormState.email : client.email || ''}
                            onChange={handleInputChange('email')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                             variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                         <TextField
                            label="Phone"
                            fullWidth
                            value={isEditing ? editFormState.client_phone_number : client.client_phone_number || ''}
                            onChange={handleInputChange('client_phone_number')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                         <TextField
                            label="Address"
                            fullWidth
                            value={isEditing ? editFormState.address : client.address || ''}
                            onChange={handleInputChange('address')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                         <TextField
                            label="City"
                            fullWidth
                            value={isEditing ? editFormState.city : client.city || ''}
                            onChange={handleInputChange('city')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                     <Grid item xs={12} sm={2}>
                         <TextField
                            label="State"
                            fullWidth
                            value={isEditing ? editFormState.state : client.state || ''}
                            onChange={handleInputChange('state')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                     <Grid item xs={12} sm={3}>
                         <TextField
                            label="Zip Code"
                            fullWidth
                            value={isEditing ? editFormState.zip_code : client.zip_code || ''}
                            onChange={handleInputChange('zip_code')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                     <Grid item xs={12} sm={3}>
                         <TextField
                            label="Country"
                            fullWidth
                            value={isEditing ? editFormState.country : client.country || ''}
                            onChange={handleInputChange('country')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                        />
                    </Grid>
                    <Grid item xs={12}>
                         <Typography variant="subtitle2" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                             {isLoadingTenantData
                                 ? "Loading custom question..."
                                 : (tenantData && tenantData.client_register_custom_question)
                                     ? tenantData.client_register_custom_question
                                     : "Custom Field"
                             }
                         </Typography>
                         <TextField
                            placeholder="Client's Response"
                            fullWidth
                            value={isEditing ? editFormState.custom_field : client.custom_field || ''}
                            onChange={handleInputChange('custom_field')}
                            disabled={!isEditing || updateMutation.isPending}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                            multiline
                            rows={2}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                 {isEditing ? (
                    <>
                        <Button onClick={handleCancelEdit} startIcon={<CancelIcon />} disabled={updateMutation.isPending}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveEdit} 
                            variant="contained" 
                            startIcon={<SaveIcon />} 
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose}>Close</Button>
                )}
            </DialogActions>

             <Dialog
                open={openDeleteConfirm}
                onClose={handleCloseDeleteConfirm}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete the client "{client.first_name} {client.surname}"? This action cannot be undone.
                </DialogContentText>
                </DialogContent>
                <DialogActions>
                <Button onClick={handleCloseDeleteConfirm} disabled={deleteMutation.isPending}>Cancel</Button>
                <Button onClick={handleConfirmDelete} color="error" disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
                </DialogActions>
            </Dialog>
            
            <Snackbar
                open={showSuccessSnackbar}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                message={deleteMutation.isSuccess ? "Client deleted successfully!" : "Client updated successfully!"}
            />
        </Dialog>
    );
};

const ClientService: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<ClientCreate>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [], isLoading, error: fetchError } = useQuery<Client[], Error>({
    queryKey: ['clients', token],
    queryFn: () => fetchClients(0, 100, token),
    enabled: !!token,
    refetchOnWindowFocus: false,
  });

  const { data: tenantData, isLoading: isLoadingTenantData, error: tenantDataError } = useQuery<TenantData, Error>({
    queryKey: ['tenantData', token],
    queryFn: () => fetchTenantData(token),
    enabled: !!token,
    staleTime: Infinity,
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

  const handleCardClick = (client: Client) => {
    setSelectedClient(client);
    setOpenDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedClient(null);
    setOpenDetailModal(false);
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

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name || ''} ${client.surname || ''}`.toLowerCase();
    const phone = client.client_phone_number?.toLowerCase() || '';
    const identification = client.client_identification?.toLowerCase() || '';
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return (
      fullName.includes(lowerCaseSearchTerm) ||
      phone.includes(lowerCaseSearchTerm) ||
      identification.includes(lowerCaseSearchTerm)
    );
  });

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

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Clients (Name, Phone, CPF/CNPJ)"
          placeholder="Type to search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
        />
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

      {tenantDataError && (
         <Alert severity="warning" sx={{ mb: 3 }}>
            Could not load tenant details (for custom field label): {tenantDataError.message}
        </Alert>
      )}

      {!isLoading && !fetchError && (
        <Grid container spacing={3}>
          {filteredClients.map((client) => (
            <Grid item xs={12} md={6} lg={4} key={client.id}>
              <CardActionArea onClick={() => handleCardClick(client)} sx={{ height: '100%' }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">{`${client.first_name || ''} ${client.surname || ''}`.trim()}</Typography>
                    </Box>
                    <Typography variant="body1" gutterBottom>
                      CPF/CNPJ: {client.client_identification || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {client.client_phone_number || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </CardActionArea>
            </Grid>
          ))}
          {filteredClients.length === 0 && !isLoading && (
            <Grid item xs={12}>
                <Typography sx={{ textAlign: 'center', mt: 4 }}>
                    {searchTerm ? 'No clients match your search.' : 'No clients found.'}
                </Typography>
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

      <ClientDetailModal 
        open={openDetailModal} 
        onClose={handleCloseDetailModal} 
        client={selectedClient} 
        tenantData={tenantData}
        isLoadingTenantData={isLoadingTenantData}
      />

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