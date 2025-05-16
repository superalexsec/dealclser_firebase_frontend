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
import apiClient, { 
    WhatsappConfig, 
    WhatsappConfigUpdate,
    fetchWhatsappConfig,
    updateWhatsappConfig,
    fetchMercadoPagoConfig,
    updateMercadoPagoConfig,
    MercadoPagoConfig,
    fetchPaymentConfig,
    updatePaymentConfig,
    PaymentConfig,
    TenantCalendarInfo,
    FrontendTenantCalendarSettingsCreate,
    WorkingPeriod,
    getTenantCalendarInfo,
    createOrUpdateTenantCalendarSettings,
} from '../lib/api';
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

const PixInstallmentsConfig: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pixDiscount, setPixDiscount] = useState<number | ''>('');
  const [maxInstallments, setMaxInstallments] = useState<number | ''>('');
  const [initial, setInitial] = useState<{ pix_discount: number; max_installments: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchPaymentConfig(token)
      .then((data) => {
        setPixDiscount(data.pix_discount);
        setMaxInstallments(data.max_installments);
        setInitial({ pix_discount: data.pix_discount, max_installments: data.max_installments });
        setError(null);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError('Pix Discount & Max Installments configuration is not available (404). Please contact the backend team.');
        } else {
          setError(err.message || 'Failed to load payment config.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await updatePaymentConfig({
        pix_discount: pixDiscount === '' ? undefined : pixDiscount,
        max_installments: maxInstallments === '' ? undefined : maxInstallments,
      }, token);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setInitial({ pix_discount: Number(pixDiscount), max_installments: Number(maxInstallments) });
    } catch (err: any) {
      setError(err.message || 'Failed to update payment config.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
      <TextField
        label="Pix Discount (%)"
        type="number"
        value={pixDiscount}
        onChange={e => setPixDiscount(e.target.value === '' ? '' : Number(e.target.value))}
        helperText="Discount percentage for Pix payments (pix_discount)"
        inputProps={{ min: 0, max: 100, step: 0.1 }}
        sx={{ minWidth: 200 }}
      />
      <TextField
        label="Max Installments"
        type="number"
        value={maxInstallments}
        onChange={e => setMaxInstallments(e.target.value === '' ? '' : Number(e.target.value))}
        helperText="Maximum number of installments allowed (max_installments)"
        inputProps={{ min: 1, max: 36, step: 1 }}
        sx={{ minWidth: 200 }}
      />
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={loading || (pixDiscount === initial?.pix_discount && maxInstallments === initial?.max_installments)}
      >
        {loading ? 'Saving...' : 'Save'}
      </Button>
      {success && <Alert severity="success">Pix Discount / Max Installments updated!</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
};

const DayAbbreviations: { [key: number]: string } = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

const CalendarSettingsTab: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<Partial<FrontendTenantCalendarSettingsCreate>>({});
  const [workingPeriods, setWorkingPeriods] = useState<Partial<WorkingPeriod>[]>([]);
  
  // To store the full fetched config for display-only fields
  const [fullCalendarConfig, setFullCalendarConfig] = useState<TenantCalendarInfo | null>(null);


  const { data: currentCalendarSettings, isLoading: isLoadingCalendarSettings, error: fetchCalendarError } = useQuery<TenantCalendarInfo, Error>({
    queryKey: ['tenantCalendarSettings', token],
    queryFn: () => getTenantCalendarInfo(token),
    enabled: !!token,
  }, queryClient);

  // Effect to handle successful data fetching for calendar settings
  useEffect(() => {
    if (currentCalendarSettings) {
      setFormState({
        calendar_name: currentCalendarSettings.calendar_name || '',
        max_concurrent_events: currentCalendarSettings.max_concurrent_events,
        timezone: currentCalendarSettings.timezone,
        appointment_duration_minutes: currentCalendarSettings.appointment_duration_minutes,
      });
      // Added type for wp
      setWorkingPeriods(currentCalendarSettings.working_periods.map((wp: WorkingPeriod) => ({...wp})));
      setFullCalendarConfig(currentCalendarSettings);
    }
  }, [currentCalendarSettings]);

  const updateCalendarSettingsMutation = useMutation<any, Error, FrontendTenantCalendarSettingsCreate>({
    mutationFn: (settings) => createOrUpdateTenantCalendarSettings(settings, token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenantCalendarSettings', token] });
      // Optionally show a success message
      alert('Calendar settings updated successfully!');
    },
    onError: (error) => {
      // Optionally show an error message
      alert(`Failed to update calendar settings: ${error.message}`);
    }
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkingPeriodChange = (index: number, field: keyof WorkingPeriod, value: string | boolean | number) => {
    setWorkingPeriods(prevPeriods => {
      const newPeriods = [...prevPeriods];
      const periodToUpdate = { ...newPeriods[index] }; // Create a shallow copy of the period object
  
      if (field === 'is_active' && typeof value === 'boolean') {
        periodToUpdate.is_active = value;
      } else if ((field === 'start_time' || field === 'end_time') && typeof value === 'string') {
        // Ensure time format is HH:MM, then append :00 for HH:MM:SS if needed
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (timeRegex.test(value)) {
          (periodToUpdate as any)[field] = `${value}:00`;
        } else {
          (periodToUpdate as any)[field] = value; // Store intermediate input
        }
      } else if (field === 'day_of_week' && typeof value === 'number') {
          periodToUpdate.day_of_week = value;
      }
      newPeriods[index] = periodToUpdate;
      return newPeriods;
    });
  };
  
  const addWorkingPeriod = () => {
    setWorkingPeriods(prev => [...prev, { day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', is_active: true }]);
  };

  const removeWorkingPeriod = (index: number) => {
    setWorkingPeriods(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const payload: FrontendTenantCalendarSettingsCreate = {
      calendar_name: formState.calendar_name || 'Default Calendar Name', // Provide a default if empty
      max_concurrent_events: formState.max_concurrent_events,
      timezone: formState.timezone,
      appointment_duration_minutes: formState.appointment_duration_minutes,
      working_periods: workingPeriods.map(wp => ({
        day_of_week: wp.day_of_week || 0,
        start_time: wp.start_time || "00:00:00",
        end_time: wp.end_time || "00:00:00",
        is_active: wp.is_active === undefined ? true : wp.is_active, // Ensure is_active has a default
        // id is not part of create/update payload, so it's omitted
      })).filter(wp => wp.start_time && wp.end_time) // Filter out potentially incomplete new entries
    };
    updateCalendarSettingsMutation.mutate(payload);
  };
  
  if (isLoadingCalendarSettings) return <CircularProgress />;
  if (fetchCalendarError) return <Alert severity="error">Error loading calendar settings: {fetchCalendarError.message}</Alert>;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Calendar Configuration</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Calendar Name"
            name="calendar_name"
            value={formState.calendar_name || ''}
            onChange={handleInputChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Timezone"
            name="timezone"
            value={formState.timezone || ''}
            onChange={handleInputChange} // Allow edit as per POST schema
            // InputProps={{ readOnly: true }} // Made editable based on POST request body
            // helperText="Timezone configured in the Calendar Service."
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Max Concurrent Events"
            name="max_concurrent_events"
            value={formState.max_concurrent_events || ''}
            onChange={e => setFormState(prev => ({ ...prev, max_concurrent_events: parseInt(e.target.value, 10) || undefined }))} // Allow edit
            // InputProps={{ readOnly: true }} // Made editable
            // helperText="Max concurrent events allowed by Calendar Service."
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Appointment Duration (minutes)"
            name="appointment_duration_minutes"
            value={formState.appointment_duration_minutes || ''}
            onChange={e => setFormState(prev => ({ ...prev, appointment_duration_minutes: parseInt(e.target.value, 10) || undefined }))} // Allow edit
            // InputProps={{ readOnly: true }} // Made editable
            // helperText="Default appointment duration from Calendar Service."
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Working Periods</Typography>
          {workingPeriods.map((period, index) => (
            <Paper key={period.id || index} elevation={1} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Day"
                value={period.day_of_week || 0}
                onChange={(e) => handleWorkingPeriodChange(index, 'day_of_week', parseInt(e.target.value,10))}
                SelectProps={{ native: true }}
                sx={{minWidth: 100}}
              >
                {Object.entries(DayAbbreviations).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </TextField>
              <TextField
                label="Start Time (HH:MM)"
                type="time"
                value={(period.start_time || '').substring(0,5)} // Display HH:MM
                onChange={(e) => handleWorkingPeriodChange(index, 'start_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5 min
                sx={{minWidth: 120}}
              />
              <TextField
                label="End Time (HH:MM)"
                type="time"
                value={(period.end_time || '').substring(0,5)} // Display HH:MM
                onChange={(e) => handleWorkingPeriodChange(index, 'end_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5 min
                sx={{minWidth: 120}}
              />
              <Button 
                variant={period.is_active ? "contained" : "outlined"}
                onClick={() => handleWorkingPeriodChange(index, 'is_active', !period.is_active)}
                sx={{minWidth: 100}}
              >
                {period.is_active ? 'Active' : 'Inactive'}
              </Button>
              <IconButton onClick={() => removeWorkingPeriod(index)} color="error">
                <CancelIcon />
              </IconButton>
            </Paper>
          ))}
          <Button variant="outlined" onClick={addWorkingPeriod} sx={{ mt: 1 }}>
            Add Working Period
          </Button>
        </Grid>

        <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={updateCalendarSettingsMutation.isPending}
          >
            {updateCalendarSettingsMutation.isPending ? <CircularProgress size={24} /> : 'Save Calendar Settings'}
          </Button>
        </Grid>
      </Grid>
       {fullCalendarConfig?.calendar_id && (
        <Typography variant="caption" display="block" sx={{mt: 2}}>
            Calendar Service ID: {fullCalendarConfig.calendar_id} (This is managed by the system)
        </Typography>
        )}
    </Paper>
  );
};

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const { token } = useAuth();
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
    queryFn: () => fetchWhatsappConfig(token),
    enabled: !!token,
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
    mutationFn: (updateData) => updateWhatsappConfig(updateData, token),
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

  // --- Mercado Pago Tab State & Logic ---
  const [isEditingMP, setIsEditingMP] = useState(false);
  const [showMPAccessToken, setShowMPAccessToken] = useState(false);
  const [mpFormState, setMPFormState] = useState<MercadoPagoConfig & {
    webhook_secret?: string;
    mp_user_id?: string;
    mp_application_id?: string;
  }>({
    access_token: '',
    mp_public_key: '',
    webhook_secret: '',
    mp_user_id: '',
    mp_application_id: '',
  });
  const [mpUpdateError, setMPUpdateError] = useState<string | null>(null);
  const [mpUpdateSuccess, setMPUpdateSuccess] = useState<boolean>(false);

  const { data: mpConfig, isLoading: isLoadingMPConfig, error: fetchMPError } = useQuery({
    queryKey: ['mercadoPagoConfig', token],
    queryFn: () => fetchMercadoPagoConfig(token),
    enabled: !!token,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (mpConfig && !isEditingMP) {
      setMPFormState({
        access_token: mpConfig.access_token || '',
        mp_public_key: mpConfig.mp_public_key || '',
        webhook_secret: mpConfig.webhook_secret || '',
        mp_user_id: mpConfig.mp_user_id || '',
        mp_application_id: mpConfig.mp_application_id || '',
      });
    } else if (mpConfig) {
      setMPFormState((prev) => ({
        access_token: prev.access_token ?? mpConfig.access_token,
        mp_public_key: prev.mp_public_key ?? mpConfig.mp_public_key,
        webhook_secret: prev.webhook_secret ?? mpConfig.webhook_secret,
        mp_user_id: prev.mp_user_id ?? mpConfig.mp_user_id,
        mp_application_id: prev.mp_application_id ?? mpConfig.mp_application_id,
      }));
    }
  }, [mpConfig, isEditingMP]);

  const handleMPInputChange = (field: keyof typeof mpFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setMPFormState({ ...mpFormState, [field]: event.target.value });
  };

  const mpMutation = useMutation({
    mutationFn: (updateData: typeof mpFormState) => updateMercadoPagoConfig(updateData, token),
    onSuccess: (data) => {
      queryClient.setQueryData(['mercadoPagoConfig', token], data);
      setIsEditingMP(false);
      setMPUpdateError(null);
      setMPUpdateSuccess(true);
      setTimeout(() => setMPUpdateSuccess(false), 3000);
    },
    onError: (error: any) => {
      setMPUpdateError(error.message || 'Failed to update Mercado Pago settings.');
      setMPUpdateSuccess(false);
    },
  });

  const handleMPSave = () => {
    if (!mpFormState.access_token || !mpFormState.mp_public_key) {
      setMPUpdateError('Both Access Token and Public Key are required.');
      return;
    }
    setMPUpdateError(null);
    mpMutation.mutate(mpFormState);
  };

  const handleMPCancel = () => {
    setIsEditingMP(false);
    setMPUpdateError(null);
    setMPUpdateSuccess(false);
    if (mpConfig) {
      setMPFormState({
        access_token: mpConfig.access_token || '',
        mp_public_key: mpConfig.mp_public_key || '',
        webhook_secret: mpConfig.webhook_secret || '',
        mp_user_id: mpConfig.mp_user_id || '',
        mp_application_id: mpConfig.mp_application_id || '',
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="WhatsApp Business" {...a11yProps(0)} />
          <Tab label="Mercado Pago" {...a11yProps(1)} />
          <Tab label="Calendar" {...a11yProps(2)} /> 
        </Tabs>
      </Paper>

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
        {isLoadingMPConfig ? (
          <CircularProgress />
        ) : fetchMPError ? (
          <Alert severity="error">{fetchMPError?.toString() || ''}</Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Mercado Pago Configuration
                </Typography>
                {mpUpdateError && <Alert severity="error" sx={{ mb: 2 }}>{mpUpdateError}</Alert>}
                {mpUpdateSuccess && <Alert severity="success" sx={{ mb: 2 }}>Settings updated successfully!</Alert>}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Public Key"
                  value={mpFormState.mp_public_key}
                  onChange={handleMPInputChange('mp_public_key')}
                  helperText="Your Mercado Pago public key (mp_public_key)"
                  disabled={!isEditingMP}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Access Token"
                  value={mpFormState.access_token}
                  onChange={handleMPInputChange('access_token')}
                  helperText="Your Mercado Pago access token (access_token)"
                  type={showMPAccessToken ? 'text' : 'password'}
                  disabled={!isEditingMP}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle access token visibility"
                          onClick={() => setShowMPAccessToken(!showMPAccessToken)}
                          edge="end"
                        >
                          {showMPAccessToken ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Webhook Secret"
                  value={mpFormState.webhook_secret}
                  onChange={handleMPInputChange('webhook_secret')}
                  helperText="Optional: Webhook secret for Mercado Pago notifications (webhook_secret)"
                  disabled={!isEditingMP}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="MP User ID"
                  value={mpFormState.mp_user_id}
                  onChange={handleMPInputChange('mp_user_id')}
                  helperText="Mercado Pago user ID (mp_user_id)"
                  disabled={!isEditingMP}
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {isEditingMP ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleMPCancel}
                      disabled={mpMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleMPSave}
                      disabled={mpMutation.isPending}
                    >
                      {mpMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditingMP(true)}
                  >
                    Edit Settings
                  </Button>
                )}
              </Grid>
            </Grid>
            <Box sx={{ mt: 4 }}>
              <PixInstallmentsConfig />
            </Box>
          </>
        )}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <CalendarSettingsTab />
      </TabPanel>
    </Box>
  );
};

export default Settings; 