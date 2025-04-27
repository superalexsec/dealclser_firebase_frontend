import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

// Interfaces for WhatsApp Config
interface WhatsappConfig {
  phone_number_id: string | null;
  phone_number: string | null;
  verification_token: string | null;
  access_token: string | null;
  webhook_url: string | null;
  is_active: boolean;
  webhook_verified: boolean;
  // Other fields from GET response are not needed for display/update here
}

interface WhatsappConfigUpdate {
  phone_number_id?: string | null;
  phone_number?: string | null;
  access_token?: string | null; // Sent on PUT, not received on GET
  verification_token?: string | null;
  // We don't update webhook URL/verified/is_active from this form for now
}

// API call functions
const fetchWhatsappConfig = async (token: string | null, backendUrl: string | undefined): Promise<WhatsappConfig> => {
  if (!token) throw new Error('Authentication token not found.');
  if (!backendUrl) throw new Error('Backend URL is not configured.');

  const response = await axios.get<WhatsappConfig>(`${backendUrl}/tenants/me/whatsapp-config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const updateWhatsappConfig = async (token: string | null, backendUrl: string | undefined, data: WhatsappConfigUpdate): Promise<WhatsappConfig> => {
  if (!token) throw new Error('Authentication token not found.');
  if (!backendUrl) throw new Error('Backend URL is not configured.');

  const response = await axios.put<WhatsappConfig>(`${backendUrl}/tenants/me/whatsapp-config`, data, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
     },
  });
  return response.data;
};

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const { token } = useAuth();
  const backendUrl = window.runtimeConfig?.backendUrl;
  const queryClient = useQueryClient();

  // --- WhatsApp Tab State & Logic ---
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(false);
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [formState, setFormState] = useState<WhatsappConfigUpdate>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // Fetch current config
  const { data: currentConfig, isLoading: isLoadingConfig, error: fetchError } = useQuery<WhatsappConfig, Error>({ 
    queryKey: ['whatsappConfig', token],
    queryFn: () => fetchWhatsappConfig(token, backendUrl),
    enabled: !!token && !!backendUrl,
    staleTime: Infinity, // Keep data fresh until manually invalidated
    refetchOnWindowFocus: false,
    });

  // Effect to populate form when data loads or edit mode changes
  useEffect(() => {
    if (currentConfig && !isEditingWhatsapp) {
      setFormState({
        phone_number_id: currentConfig.phone_number_id,
        phone_number: currentConfig.phone_number,
        verification_token: currentConfig.verification_token,
        access_token: currentConfig.access_token,
      });
    } else if (currentConfig) {
      // Ensure form has values when entering edit mode
      setFormState((prev) => ({
        phone_number_id: prev.phone_number_id ?? currentConfig.phone_number_id,
        phone_number: prev.phone_number ?? currentConfig.phone_number,
        verification_token: prev.verification_token ?? currentConfig.verification_token,
        access_token: prev.access_token ?? currentConfig.access_token,
      }));
    }
  }, [currentConfig, isEditingWhatsapp]);

  // Update mutation
  const mutation = useMutation<WhatsappConfig, Error, WhatsappConfigUpdate>({ 
    mutationFn: (updateData) => updateWhatsappConfig(token, backendUrl, updateData),
    onSuccess: (data) => {
      queryClient.setQueryData(['whatsappConfig', token], data); // Update cache with response
      setIsEditingWhatsapp(false); // Exit edit mode
      setUpdateError(null);
      setUpdateSuccess(true);
      // Clear access token from form state AFTER successful save if it was part of the response
      // This prevents showing the (potentially new) token immediately
      setFormState(prev => ({ ...prev, access_token: data.access_token ?? '' }));
      setTimeout(() => setUpdateSuccess(false), 3000); // Hide success message after 3s
    },
    onError: (error) => {
      setUpdateError(error.message || 'Failed to update settings.');
      setUpdateSuccess(false);
    },
   });

  const handleWhatsappInputChange = (field: keyof WhatsappConfigUpdate) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [field]: event.target.value,
    });
  };

  const handleWhatsappSave = () => {
    // Filter out empty strings for optional fields before sending
    const dataToSend: WhatsappConfigUpdate = {};
    if (formState.phone_number_id) dataToSend.phone_number_id = formState.phone_number_id;
    if (formState.phone_number) dataToSend.phone_number = formState.phone_number;
    if (formState.verification_token) dataToSend.verification_token = formState.verification_token;
    if (formState.access_token) dataToSend.access_token = formState.access_token; // Only send if user entered something

    // Basic validation example (can be enhanced)
    if (!dataToSend.phone_number_id || !dataToSend.phone_number) {
        setUpdateError('Phone Number and Phone Number ID are required.');
        return;
    }

    setUpdateError(null); // Clear previous errors
    mutation.mutate(dataToSend);
  };

  const handleWhatsappCancel = () => {
    setIsEditingWhatsapp(false);
    setUpdateError(null);
    setUpdateSuccess(false);
    // Reset form state from cached query data
    if (currentConfig) {
        setFormState({
            phone_number_id: currentConfig.phone_number_id,
            phone_number: currentConfig.phone_number,
            verification_token: currentConfig.verification_token,
            access_token: currentConfig.access_token,
        });
    }
  };

  // --- Dropbox Sign Tab State (unchanged) ---
  const [dropboxSignSettings, setDropboxSignSettings] = useState({
    apiKey: '',
    clientId: '',
  });
  const handleDropboxSignChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDropboxSignSettings({
      ...dropboxSignSettings,
      [field]: event.target.value,
    });
  };
  // --- End Dropbox Sign ---

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Service Settings
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="service settings tabs">
            <Tab label="WhatsApp Business" {...a11yProps(0)} />
            <Tab label="Dropbox Sign" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {isLoadingConfig ? (
            <CircularProgress />
          ) : fetchError ? (
            <Alert severity="error">Error loading WhatsApp config: {fetchError.message}</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  WhatsApp Business API Configuration
                </Typography>
                 {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}
                 {updateSuccess && <Alert severity="success" sx={{ mb: 2 }}>Settings updated successfully!</Alert>}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number ID"
                  value={formState.phone_number_id ?? ''}
                  onChange={handleWhatsappInputChange('phone_number_id')}
                  helperText="Phone number ID from WhatsApp Business API"
                  disabled={!isEditingWhatsapp}
                />
              </Grid>
               <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number"
                  value={formState.phone_number ?? ''}
                  onChange={handleWhatsappInputChange('phone_number')}
                  helperText="Business phone number with country code (e.g., +15551234567)"
                  disabled={!isEditingWhatsapp}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Verify Token"
                  value={formState.verification_token ?? ''}
                  onChange={handleWhatsappInputChange('verification_token')}
                  helperText="Token for Meta webhook verification (optional for update)"
                  type={showVerifyToken ? 'text' : 'password'}
                  disabled={!isEditingWhatsapp}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle verify token visibility"
                          onClick={() => setShowVerifyToken(!showVerifyToken)}
                          edge="end"
                        >
                          {showVerifyToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Access Token"
                  value={formState.access_token ?? ''}
                  onChange={handleWhatsappInputChange('access_token')}
                  helperText="Token for sending messages (required for updates)"
                  type={showAccessToken ? 'text' : 'password'}
                  disabled={!isEditingWhatsapp}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle access token visibility"
                          onClick={() => setShowAccessToken(!showAccessToken)}
                          edge="end"
                        >
                          {showAccessToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {isEditingWhatsapp ? (
                        <>
                            <Button 
                                variant="outlined" 
                                startIcon={<CancelIcon />} 
                                onClick={handleWhatsappCancel}
                                disabled={mutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                startIcon={<SaveIcon />} 
                                onClick={handleWhatsappSave}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <Button 
                            variant="contained" 
                            startIcon={<EditIcon />} 
                            onClick={() => setIsEditingWhatsapp(true)}
                        >
                            Edit Settings
                        </Button>
                    )}
                </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dropbox Sign Configuration
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                value={dropboxSignSettings.apiKey}
                onChange={handleDropboxSignChange('apiKey')}
                helperText="Dropbox Sign API key"
                type="password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Client ID"
                value={dropboxSignSettings.clientId}
                onChange={handleDropboxSignChange('clientId')}
                helperText="Dropbox Sign client ID"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings; 