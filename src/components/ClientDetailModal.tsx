import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    TextField,
    IconButton,
    Alert,
    CircularProgress,
    Divider, 
    List, 
    ListItem, 
    ListItemText, 
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { Client, ClientUpdate, TenantData } from '../lib/api';
import { SelectChangeEvent } from '@mui/material';

// Interface definition 
interface ClientDetailModalProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
    tenantData?: TenantData | null;
    isLoadingTenantData: boolean;
    onUpdateClient: (clientId: string, updateData: ClientUpdate) => Promise<Client>; 
    isUpdatingClient: boolean;
    updateClientError: string | null;
    onDeleteClient: (clientId: string) => Promise<void>; 
    isDeletingClient: boolean;
    deleteClientError: string | null;
}


const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
    open,
    onClose,
    client,
    tenantData,
    isLoadingTenantData,
    onUpdateClient,
    isUpdatingClient,
    updateClientError,
    onDeleteClient,
    isDeletingClient,
    deleteClientError,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editFormState, setEditFormState] = useState<ClientUpdate>({});
    const [localError, setLocalError] = useState<string | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

    // Reset form state when client or open status changes
    useEffect(() => {
        if (client && open) {
            setIsEditing(false);
            setLocalError(null);
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
             setLocalError(null);
        }
    }, [client, open]); 

    // --- Edit/Delete Handlers ---
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setLocalError(null); // Clear local errors when toggling
        if (isEditing && client) { // Reset form if cancelling edit
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

    const handleInputChange = (field: keyof ClientUpdate) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditFormState(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSaveEdit = () => {
        if (!editFormState.first_name || !editFormState.surname) {
            setLocalError('First Name and Surname are required.');
            return;
        }
        setLocalError(null);
        if (client) {
            onUpdateClient(client.id, editFormState)
                .then(() => {
                    setIsEditing(false); // Turn off editing on successful save
                })
                .catch(() => {
                    // Error message is shown via updateClientError prop
                });
        }
    };

    const handleDelete = () => {
        setOpenDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (client) {
            onDeleteClient(client.id)
                .then(() => {
                     setOpenDeleteConfirm(false); 
                     // Parent should close modal via query invalidation
                })
                .catch(() => {
                     setOpenDeleteConfirm(false); 
                });
        }
    };

    const handleCloseDeleteConfirm = () => {
        setOpenDeleteConfirm(false);
    };

    if (!client) return null;

    const customQuestionLabel = tenantData?.client_register_custom_question || 'Custom Field';

    // Combine all possible errors for display
    const combinedError = localError || updateClientError || deleteClientError; 
    const isProcessing = isUpdatingClient || isDeletingClient; // Remove isCartMutating

    return (
        <Dialog key={client.id} open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 {isEditing ? 'Edit Client' : 'Client Details'}
                 <Box>
                     {!isEditing && (
                         <IconButton onClick={handleEditToggle} color="primary" disabled={isProcessing}>
                             <EditIcon />
                         </IconButton>
                     )}
                      {isEditing && ( // Show Cancel button only when editing
                         <IconButton onClick={handleEditToggle} disabled={isUpdatingClient}>
                             <CancelIcon />
                         </IconButton>
                     )}
                     <IconButton onClick={handleDelete} color="error" sx={{ ml: 1 }} disabled={isProcessing || isEditing}>
                         <DeleteIcon />
                     </IconButton>
                 </Box>
             </DialogTitle>
            <DialogContent dividers>
                {combinedError && <Alert severity="error" sx={{ mb: 2 }}>{combinedError}</Alert>}

                {/* --- Client Details Form --- */}
                <Grid container spacing={2}>
                    {/* Client Fields */}
                     <Grid item xs={12} sm={6}>
                        <TextField
                            label="First Name"
                            fullWidth
                            required
                            value={isEditing ? editFormState.first_name : client.first_name || ''}
                            onChange={handleInputChange('first_name')}
                            disabled={!isEditing || isUpdatingClient}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                            error={isEditing && !!localError && !editFormState.first_name}
                            helperText={isEditing && !!localError && !editFormState.first_name ? 'First Name is required' : ''}
                        />
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField
                            label="Surname"
                            fullWidth
                            required
                            value={isEditing ? editFormState.surname : client.surname || ''}
                            onChange={handleInputChange('surname')}
                            disabled={!isEditing || isUpdatingClient}
                            InputProps={{ readOnly: !isEditing }}
                             variant={isEditing ? "outlined" : "standard"}
                             error={isEditing && !!localError && !editFormState.surname}
                             helperText={isEditing && !!localError && !editFormState.surname ? 'Surname is required' : ''}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                            disabled={!isEditing || isUpdatingClient}
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
                        {/* Cancel button is now an icon button in the title */}
                        <Button
                            onClick={handleSaveEdit}
                            variant="contained"
                            startIcon={isUpdatingClient ? <CircularProgress size={20}/> : <SaveIcon />}
                            disabled={isUpdatingClient || !editFormState.first_name?.trim() || !editFormState.surname?.trim()} // Also disable if required fields empty
                        >
                            {isUpdatingClient ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose} disabled={isProcessing}>Close</Button>
                )}
            </DialogActions>

             {/* Delete Confirmation Dialog */}
             <Dialog
                open={openDeleteConfirm}
                onClose={handleCloseDeleteConfirm}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                         Are you sure you want to delete the client "{client?.first_name} {client?.surname}"? This action cannot be undone.
                    </Typography>
                    {deleteClientError && <Alert severity="error" sx={{mt: 2}}>{deleteClientError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirm} disabled={isDeletingClient}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" disabled={isDeletingClient}>
                        {isDeletingClient ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Dialog>
    );
};

export default ClientDetailModal;

// Add empty export to ensure it's treated as a module
export {}; 