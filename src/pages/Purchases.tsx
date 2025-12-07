import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import { Search as SearchIcon, Info as InfoIcon, Close as CloseIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { fetchClients, Client, fetchPaymentSessions, fetchPaymentSessionDetails, PaymentSession, PaymentSessionDetails } from '../lib/api';
import { useTranslation } from 'react-i18next';

function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'confirmed' || s === 'approved') return 'success';
  if (s === 'pending' || s === 'waiting') return 'warning';
  if (s === 'failed' || s === 'cancelled' || s === 'rejected') return 'error';
  if (s === 'in_process' || s === 'processing') return 'info';
  return 'default';
}

const Purchases: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch clients for autocomplete
  const {
    data: clients = [],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery<Client[], Error>({
    queryKey: ['clientsSimple', token],
    queryFn: () => fetchClients(0, 100, token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch payment sessions for selected client
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    error: sessionsError,
    refetch: refetchSessions,
    isFetching: isFetchingSessions,
  } = useQuery<PaymentSession[], Error>({
    queryKey: ['paymentSessions', selectedClient?.client_phone_number, token],
    queryFn: () => selectedClient?.client_phone_number ? fetchPaymentSessions(selectedClient.client_phone_number, token) : Promise.resolve([]),
    enabled: !!token && !!selectedClient?.client_phone_number,
    staleTime: 60 * 1000,
  });

  // Fetch details for a selected session
  const {
    data: sessionDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useQuery<PaymentSessionDetails, Error>({
    queryKey: ['paymentSessionDetails', selectedSessionId, token],
    queryFn: () => selectedSessionId ? fetchPaymentSessionDetails(selectedSessionId, token) : Promise.reject('No session selected'),
    enabled: !!token && !!selectedSessionId && detailsOpen,
    staleTime: 60 * 1000,
  });

  const handleClientChange = (event: any, newValue: Client | null) => {
    setSelectedClient(newValue);
    setSelectedSessionId(null);
    setDetailsOpen(false);
  };

  const handleOpenDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSessionId(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('purchases.title')}
      </Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Autocomplete
          options={clients}
          loading={isLoadingClients}
          getOptionLabel={(option) => `${option.first_name} ${option.surname} (${option.client_phone_number || option.client_identification})`}
          value={selectedClient}
          onChange={handleClientChange}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('cart.search_client')}
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {isLoadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
      </Paper>
      {isLoadingSessions || isFetchingSessions ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : sessionsError ? (
        <Alert severity="error">{sessionsError.message}</Alert>
      ) : sessions.length === 0 && selectedClient ? (
        <Alert severity="info">{t('purchases.no_sessions')}</Alert>
      ) : sessions.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('purchases.session_id')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('purchases.total_amount')}</TableCell>
                <TableCell>{t('purchases.payment_method')}</TableCell>
                <TableCell>{t('common.created_at')}</TableCell>
                <TableCell>{t('purchases.confirmed_at')}</TableCell>
                <TableCell>{t('purchases.details')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>
                    <Chip label={session.status} color={getStatusColor(session.status)} size="small" />
                  </TableCell>
                  <TableCell>{session.total_amount}</TableCell>
                  <TableCell>{session.selected_payment_method}</TableCell>
                  <TableCell>{new Date(session.created_at).toLocaleString()}</TableCell>
                  <TableCell>{session.confirmed_at ? new Date(session.confirmed_at).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDetails(session.id)} size="small" color="primary">
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('purchases.details')}
          <IconButton onClick={handleCloseDetails} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {isLoadingDetails ? (
            <Box sx={{ textAlign: 'center', my: 2 }}><CircularProgress /></Box>
          ) : detailsError ? (
            <Alert severity="error">{detailsError.message}</Alert>
          ) : sessionDetails ? (
            <Box>
              <Typography variant="subtitle1">{t('purchases.session_id')}: {sessionDetails.id}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{t('common.status')}:</Typography>
                <Chip label={sessionDetails.status} color={getStatusColor(sessionDetails.status)} size="small" />
              </Box>
              <Typography>{t('purchases.total_amount')}: {sessionDetails.total_amount}</Typography>
              <Typography>{t('purchases.payment_method')}: {sessionDetails.selected_payment_method}</Typography>
              <Typography>{t('purchases.payment_link')}: {sessionDetails.payment_link}</Typography>
              <Typography>{t('common.created_at')}: {new Date(sessionDetails.created_at).toLocaleString()}</Typography>
              <Typography>{t('common.updated_at')}: {new Date(sessionDetails.updated_at).toLocaleString()}</Typography>
              <Typography>{t('purchases.confirmed_at')}: {sessionDetails.confirmed_at ? new Date(sessionDetails.confirmed_at).toLocaleString() : '-'}</Typography>
              <Typography>{t('client_contracts.client_phone')}: {sessionDetails.client_phone_number}</Typography>
              <Typography>{t('purchases.current_step')}: {sessionDetails.current_step}</Typography>
              <Typography>{t('purchases.external_id')}: {sessionDetails.payment_id_external}</Typography>
              <Typography>{t('purchases.preference_id')}: {sessionDetails.preference_id}</Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases;
