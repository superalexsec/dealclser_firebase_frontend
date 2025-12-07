import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Autocomplete,
  Chip,
  Paper,
  IconButton,
  createFilterOptions,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Calendar as BigCalendar, dateFnsLocalizer, EventProps, View, NavigateAction } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import { ptBR } from 'date-fns/locale/pt-BR';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuth } from '../contexts/AuthContext';
import apiClient, {
  AppointmentResponse,
  AppointmentCreateFrontend,
  CheckSlotAvailabilityRequestFrontend,
  SlotAvailabilityResponse,
  TenantCalendarInfo,
  Client,
  listTenantAppointments,
  createAppointment,
  checkSlotAvailability,
  getTenantCalendarInfo,
  cancelAppointment,
  AppointmentCancelResponse,
  fetchClients,
} from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const locales = {
  'en-US': enUS,
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Helper function to convert UTC date to a date object reflecting Brasília time (-3 hours)
const toBrasiliaTime = (utcDate: Date): Date => {
  // Subtract 3 hours from the UTC date to get Brasília time
  return new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
};

interface CalendarEvent extends AppointmentResponse {
  title: string;
  start: Date;
  end: Date;
}

const brazilianTimezones = [
    { name: 'Brasília (BRT)', offset: -3, id: 'America/Sao_Paulo' },
    { name: 'Noronha (FNT)', offset: -2, id: 'America/Noronha' },
    { name: 'Amazonas (AMT)', offset: -4, id: 'America/Manaus' },
    { name: 'Acre (ACT)', offset: -5, id: 'America/Rio_Branco' },
];

const filterOptions = createFilterOptions<Client>({
    matchFrom: 'any',
    stringify: (option) => 
        `${option.first_name || ''} ${option.surname || ''} ${option.client_phone_number || ''} ${option.client_identification || ''}`,
});

const CalendarPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEvent | null>(null);
  
  const [newAppointmentData, setNewAppointmentData] = useState<Partial<AppointmentCreateFrontend>>({});
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isSlotAvailable, setIsSlotAvailable] = useState<boolean | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [selectedTimezone, setSelectedTimezone] = useState(brazilianTimezones[0]); // Default to Brasília

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const { data: calendarSettings, isLoading: isLoadingCalendarSettings } = useQuery<TenantCalendarInfo, Error>({
    queryKey: ['tenantCalendarSettings', token],
    queryFn: () => getTenantCalendarInfo(token!),
    enabled: !!token,
  });

  const { data: appointments = [], isLoading: isLoadingAppointments, error: fetchAppointmentsError } = useQuery<AppointmentResponse[], Error, CalendarEvent[]>({
    queryKey: ['tenantAppointments', token, calendarSettings?.calendar_id, format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!token || !calendarSettings?.calendar_id) return [];
      const firstDayOfMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const lastDayOfMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      return listTenantAppointments(firstDayOfMonth, lastDayOfMonth, token);
    },
    enabled: !!token && !!calendarSettings?.calendar_id,
    select: (data) => {
        return data.map(app => {
            const utcStart = parseISO(app.start_time);
            const utcEnd = parseISO(app.end_time);

            // To display the correct "wall clock" time, we create a new Date object
            // that is shifted by the selected timezone's offset. The calendar will
            // then render the hours and minutes from this new date object.
            const displayStart = new Date(utcStart.getTime() + (selectedTimezone.offset * 3600 * 1000));
            const displayEnd = new Date(utcEnd.getTime() + (selectedTimezone.offset * 3600 * 1000));

            return {
                ...app,
                title: `${app.client_name} (${app.description || 'Appointment'})`,
                start: displayStart,
                end: displayEnd,
            };
        });
    },
  });

  const { data: allClients, isLoading: isLoadingClients } = useQuery<Client[], Error>({
    queryKey: ['allClientsForCalendarAutocomplete', token],
    queryFn: () => fetchClients(0, 500, token!), 
    enabled: !!token,
  });
  
  const createAppointmentMutation = useMutation<AppointmentResponse, Error, AppointmentCreateFrontend>({
    mutationFn: (data) => createAppointment(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantAppointments'] });
      handleAddDialogClose();
      showSnackbar(t('calendar.success_create'), 'success');
    },
    onError: (error) => {
      setAvailabilityMessage(`${t('calendar.error_create')}: ${error.message}`);
      showSnackbar(`${t('calendar.error_create')}: ${error.message}`, 'error');
    }
  });

  const checkAvailabilityMutation = useMutation<SlotAvailabilityResponse, Error, CheckSlotAvailabilityRequestFrontend>({
    mutationFn: (data) => checkSlotAvailability(data, token),
    onSuccess: (data) => {
      setIsSlotAvailable(data.is_available);
      setAvailabilityMessage(data.message);
    },
    onError: (error) => {
      setIsSlotAvailable(false);
      setAvailabilityMessage(`${t('calendar.error_check')}: ${error.message}`);
    }
  });

  const deleteAppointmentMutation = useMutation<AppointmentCancelResponse, Error, string>({
    mutationFn: (appointmentId) => cancelAppointment(appointmentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tenantAppointments']});
      setOpenDetailDialog(false);
      setSelectedAppointment(null);
      showSnackbar(t('calendar.success_delete'), 'success');
    },
    onError: (error) => {
        showSnackbar(`${t('calendar.error_delete')}: ${error.message}`, 'error');
    }
  });

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    if (!calendarSettings?.appointment_duration_minutes) {
      showSnackbar('Calendar settings not loaded. Cannot determine appointment duration.', 'error');
      return;
    }
    setNewAppointmentData({ start_time: format(start, "yyyy-MM-dd'T'HH:mm:ss") });
    setSelectedClient(null);
    setAvailabilityMessage(null);
    setIsSlotAvailable(null);
    setOpenAddDialog(true);
  }, [calendarSettings, showSnackbar]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event);
    setOpenDetailDialog(true);
  }, []);

  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
    setNewAppointmentData({});
    setSelectedClient(null);
    setAvailabilityMessage(null);
    setIsSlotAvailable(null);
  };

  const handleDateTimeChange = (field: 'date' | 'time', value: string) => {
    setAvailabilityMessage(null);
    setIsSlotAvailable(null);
    let currentStartTime = newAppointmentData.start_time ? new Date(newAppointmentData.start_time.substring(0,19)) : new Date();
    if (field === 'date') {
        const [year, month, day] = value.split('-').map(Number);
        currentStartTime.setFullYear(year, month - 1, day);
    } else if (field === 'time') {
        const [hours, minutes] = value.split(':').map(Number);
        currentStartTime.setHours(hours, minutes, 0, 0);
    }
    setNewAppointmentData(prev => ({ ...prev, start_time: format(currentStartTime, "yyyy-MM-dd'T'HH:mm:ss") }));
  };
  
  const handleCheckAvailability = () => {
    if (!newAppointmentData.start_time || !calendarSettings?.appointment_duration_minutes) {
      setAvailabilityMessage(t('calendar.msg_check_required'));
      return;
    }
    checkAvailabilityMutation.mutate({
      start_datetime: newAppointmentData.start_time,
      duration_minutes: calendarSettings.appointment_duration_minutes,
    });
  };
  
  const handleSaveAppointment = () => {
    if (!selectedClient || !newAppointmentData.start_time || !calendarSettings) {
      setAvailabilityMessage(t('calendar.msg_save_required'));
      return;
    }
    if (isSlotAvailable !== true) {
        setAvailabilityMessage(t('calendar.msg_slot_unavailable'));
        return;
    }
    // The start_time is a naive "yyyy-MM-dd'T'HH:mm:ss" string from the input.
    // We treat this as the "wall clock" time in the selected timezone.
    const naiveDateString = newAppointmentData.start_time;
    
    // Create a Date object from this string as if it were UTC.
    const naiveUTCDate = new Date(naiveDateString + 'Z');

    // To get the true UTC time, we subtract the selected timezone's offset.
    const trueUTCTime = new Date(naiveUTCDate.getTime() - (selectedTimezone.offset * 3600 * 1000));
    
    const endDate = new Date(trueUTCTime.getTime() + calendarSettings.appointment_duration_minutes * 60000);

    createAppointmentMutation.mutate({
      client_phone_number: selectedClient.client_phone_number!,
      start_time: trueUTCTime.toISOString(),
      end_time: endDate.toISOString(),
      description: newAppointmentData.description || '',
    });
  };

  const handleDeleteAppointment = () => {
    if (selectedAppointment) {
        deleteAppointmentMutation.mutate(selectedAppointment.appointment_id);
    }
  };

  const EventComponent: React.FC<EventProps<CalendarEvent>> = ({ event }) => (
    <Box sx={{ fontSize: '0.8em', p: '2px' }}>
      <Typography variant="caption" display="block">{event.title}</Typography>
      <Typography variant="caption" display="block">{format(event.start, 'p')} - {format(event.end, 'p')}</Typography>
    </Box>
  );

  if (isLoadingCalendarSettings) return <CircularProgress />;

  return (
      <Box sx={{ p: 3, height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" mb={2} gap={2}>
          <Typography variant="h4">{t('calendar.title')}</Typography>
          <Box display="flex" alignItems="center" gap={2} flexDirection={isMobile ? 'column' : 'row'} width={isMobile ? '100%' : 'auto'}>
              <FormControl sx={{ minWidth: 220, width: isMobile ? '100%' : 'auto' }} size="small">
                <InputLabel>{t('calendar.timezone')}</InputLabel>
                <Select
                    value={selectedTimezone.id}
                    label={t('calendar.timezone')}
                    onChange={(e) => {
                        const newTz = brazilianTimezones.find(tz => tz.id === e.target.value);
                        if (newTz) setSelectedTimezone(newTz);
                    }}
                >
                    {brazilianTimezones.map(tz => (
                        <MenuItem key={tz.id} value={tz.id}>{tz.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleSelectSlot({start: new Date()})} fullWidth={isMobile}>
              {t('calendar.new_appointment')}
            </Button>
        </Box>
      </Box>

      {fetchAppointmentsError && <Alert severity="error">{t('calendar.error_check')}: {fetchAppointmentsError.message}</Alert>}
      
      <Paper sx={{height: '100%', p: 1}}>
        <BigCalendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            style={{ flexGrow: 1 }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            view={view}
            views={['month', 'week', 'day', 'agenda']}
            onView={(v) => setView(v as 'month' | 'week' | 'day' | 'agenda')}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            culture={i18n.language}
            components={{ event: EventComponent }}
            formats={{ timeGutterFormat: (date, culture, l) => l!.format(date, 'p', culture!), eventTimeRangeFormat: ({ start, end }, culture, l) => `${l!.format(start, 'p', culture!)} — ${l!.format(end, 'p', culture!)}`}}
        />
      </Paper>

      <Dialog open={openAddDialog} onClose={handleAddDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>
            {t('calendar.new_appointment')}
            <IconButton aria-label="close" onClick={handleAddDialogClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2} sx={{pt: 1}}>
                <Grid item xs={12}>
                     <Autocomplete
                        options={allClients || []}
                        getOptionLabel={(option) => `${option.first_name} ${option.surname} (${option.client_identification}) - ${option.client_phone_number}`}
                        value={selectedClient}
                        onChange={(event, newValue) => setSelectedClient(newValue)}
                        loading={isLoadingClients}
                        filterOptions={filterOptions}
                        renderInput={(params) => (
                            <TextField {...params} label={t('calendar.search_client')} variant="outlined" />
                        )}
                        renderOption={(props, option) => <li {...props} key={option.id}>{`${option.first_name} ${option.surname} (${option.client_identification}) - ${option.client_phone_number}`}</li>}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        noOptionsText={isLoadingClients ? t('calendar.loading_clients') : t('calendar.no_clients')}
                    />
                </Grid>
                {selectedClient && <Grid item xs={12}><Chip label={`${t('calendar.selected')}: ${selectedClient.first_name} ${selectedClient.surname}`} onDelete={() => setSelectedClient(null)} /></Grid>}
                <Grid item xs={12} sm={6}>
                    <TextField label={t('calendar.date')} type="date" value={newAppointmentData.start_time?.substring(0, 10) || ''} onChange={(e) => handleDateTimeChange('date', e.target.value)} fullWidth InputLabelProps={{ shrink: true }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label={t('calendar.time')} type="time" value={newAppointmentData.start_time?.substring(11, 16) || ''} onChange={(e) => handleDateTimeChange('time', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ step: (calendarSettings?.appointment_duration_minutes || 30) * 60 }}/>
                </Grid>
                 <Grid item xs={12}>
                    <TextField label={t('calendar.description')} multiline rows={2} fullWidth value={newAppointmentData.description || ''} onChange={(e) => setNewAppointmentData(prev => ({ ...prev, description: e.target.value }))}/>
                </Grid>
                <Grid item xs={12}>
                    <Button onClick={handleCheckAvailability} disabled={!newAppointmentData.start_time || !calendarSettings || checkAvailabilityMutation.isPending} variant="outlined" fullWidth>
                        {checkAvailabilityMutation.isPending ? <CircularProgress size={24}/> : t('calendar.check_availability')}
                    </Button>
                </Grid>
                {availabilityMessage && <Grid item xs={12}><Alert severity={isSlotAvailable === true ? "success" : isSlotAvailable === false ? "error" : "info"}>{availabilityMessage}</Alert></Grid>}
            </Grid>
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button onClick={handleAddDialogClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveAppointment} variant="contained" disabled={isSlotAvailable !== true || createAppointmentMutation.isPending || !selectedClient}>
            {createAppointmentMutation.isPending ? <CircularProgress size={24}/> : t('calendar.save_appointment')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>
            {t('calendar.details')}
            <IconButton aria-label="close" onClick={() => setOpenDetailDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        {selectedAppointment && (
          <DialogContent dividers>
            <Typography variant="h6">{selectedAppointment.client_name}</Typography>
            <Typography variant="body1">{t('common.phone')}: {selectedAppointment.client_phone_number}</Typography>
            <Typography variant="body1">From: {format(selectedAppointment.start, 'Pp')}</Typography>
            <Typography variant="body1">To: {format(selectedAppointment.end, 'Pp')}</Typography>
            <Typography variant="body1">{t('common.status')}: <Chip label={selectedAppointment.status} size="small" /></Typography>
            {selectedAppointment.description && <Typography variant="body1">{t('common.description')}: {selectedAppointment.description}</Typography>}
            {selectedAppointment.client_address && <Typography variant="body1">{t('common.address')}: {selectedAppointment.client_address}</Typography>}
            <Typography variant="caption" display="block" sx={{mt:1}}>Appt ID: {selectedAppointment.appointment_id}</Typography>
            <Typography variant="caption" display="block">Calendar Event ID: {selectedAppointment.calendar_event_id}</Typography>
          </DialogContent>
        )}
        <DialogActions sx={{p: 2, justifyContent: 'space-between'}}>
          <Button onClick={handleDeleteAppointment} color="error" startIcon={<DeleteIcon />} disabled={deleteAppointmentMutation.isPending || !selectedAppointment}>
            {deleteAppointmentMutation.isPending ? <CircularProgress size={20}/> : t('common.delete')}
          </Button>
          <Button onClick={() => setOpenDetailDialog(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalendarPage;
