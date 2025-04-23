import React, { useState } from 'react';
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
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

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

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [whatsappSettings, setWhatsappSettings] = useState({
    verifyToken: '',
    accessToken: '',
    phoneNumber: '',
    phoneNumberId: '',
  });
  const [dropboxSignSettings, setDropboxSignSettings] = useState({
    apiKey: '',
    clientId: '',
  });
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleWhatsappChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappSettings({
      ...whatsappSettings,
      [field]: event.target.value,
    });
  };

  const handleDropboxSignChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDropboxSignSettings({
      ...dropboxSignSettings,
      [field]: event.target.value,
    });
  };

  const handleSave = () => {
    // TODO: Implement API call to save settings
    setSaveStatus({
      type: 'success',
      message: 'Settings saved successfully!',
    });
    setTimeout(() => {
      setSaveStatus({ type: null, message: '' });
    }, 3000);
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
            {/* Add more service tabs here */}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                WhatsApp Business API Configuration
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Verify Token"
                value={whatsappSettings.verifyToken}
                onChange={handleWhatsappChange('verifyToken')}
                helperText="Token for webhook verification"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Access Token"
                value={whatsappSettings.accessToken}
                onChange={handleWhatsappChange('accessToken')}
                helperText="Token for sending messages"
                type="password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={whatsappSettings.phoneNumber}
                onChange={handleWhatsappChange('phoneNumber')}
                helperText="Business phone number with country code"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number ID"
                value={whatsappSettings.phoneNumberId}
                onChange={handleWhatsappChange('phoneNumberId')}
                helperText="Phone number ID from WhatsApp Business API"
              />
            </Grid>
          </Grid>
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

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {saveStatus.type && (
            <Alert severity={saveStatus.type} sx={{ flexGrow: 1 }}>
              {saveStatus.message}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings; 