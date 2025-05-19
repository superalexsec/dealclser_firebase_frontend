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
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Calendar as BigCalendar, dateFnsLocalizer, EventProps, View, NavigateAction } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
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

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent extends AppointmentResponse {
  title: string;
  start: Date;
  end: Date;
}

const filterOptions = createFilterOptions<Client>({
    matchFrom: 'any',
    stringify: (option) => 
        `${option.first_name || ''} ${option.surname || ''} ${option.client_phone_number || ''} ${option.client_identification || ''}`,
});

const CalendarPage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
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

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

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
    select: (data) => data.map(app => ({ ...app, title: `${app.client_name} (${app.description || 'Appointment'})`, start: new Date(app.start_time), end: new Date(app.end_time) })),
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
      showSnackbar('Appointment created successfully!', 'success');
    },
    onError: (error) => {
      setAvailabilityMessage(`Failed to create appointment: ${error.message}`);
      showSnackbar(`Failed to create appointment: ${error.message}`, 'error');
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
      setAvailabilityMessage(`Availability check failed: ${error.message}`);
    }
  });

  const deleteAppointmentMutation = useMutation<AppointmentCancelResponse, Error, string>({
    mutationFn: (appointmentId) => cancelAppointment(appointmentId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['tenantAppointments']});
      setOpenDetailDialog(false);
      setSelectedAppointment(null);
      showSnackbar('Appointment deleted successfully!', 'success');
    },
    onError: (error) => {
        showSnackbar(`Failed to delete appointment: ${error.message}`, 'error');
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
      setAvailabilityMessage('Please select a start time and ensure calendar settings are loaded.');
      return;
    }
    checkAvailabilityMutation.mutate({
      start_datetime: newAppointmentData.start_time,
      duration_minutes: calendarSettings.appointment_duration_minutes,
    });
  };
  
  const handleSaveAppointment = () => {
    if (!selectedClient || !newAppointmentData.start_time || !calendarSettings) {
      setAvailabilityMessage('Client, start time, and calendar settings are required.');
      return;
    }
    if (isSlotAvailable !== true) {
        setAvailabilityMessage('Selected slot is not available or availability not checked.');
        return;
    }
    const startDate = new Date(newAppointmentData.start_time);
    const endDate = new Date(startDate.getTime() + calendarSettings.appointment_duration_minutes * 60000);
    const startUTC = new Date(startDate.valueOf() - startDate.getTimezoneOffset() * 60000).toISOString();
    const endUTC = new Date(endDate.valueOf() - endDate.getTimezoneOffset() * 60000).toISOString();

    createAppointmentMutation.mutate({
      client_phone_number: selectedClient.client_phone_number!,
      start_time: startUTC,
      end_time: endUTC,
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
    <Box sx={{ p: 3, height: 'calc(100vh - 120px)' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Calendar</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleSelectSlot({start: new Date()})}>
          New Appointment
        </Button>
      </Box>

      {fetchAppointmentsError && <Alert severity="error">Failed to load appointments: {fetchAppointmentsError.message}</Alert>}
      
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
            views={['month', 'week', 'day']}
            onView={(v) => setView(v as 'month' | 'week' | 'day')}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            components={{ event: EventComponent }}
            formats={{ timeGutterFormat: (date, culture, l) => l!.format(date, 'p', culture!), eventTimeRangeFormat: ({ start, end }, culture, l) => `${l!.format(start, 'p', culture!)} — ${l!.format(end, 'p', culture!)}`}}
        />
      </Paper>

      <Dialog open={openAddDialog} onClose={handleAddDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>
            New Appointment
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
                            <TextField {...params} label="Search Client (Name, Phone, CPF/CNPJ)" variant="outlined" />
                        )}
                        renderOption={(props, option) => <li {...props} key={option.id}>{`${option.first_name} ${option.surname} (${option.client_identification}) - ${option.client_phone_number}`}</li>}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        noOptionsText={isLoadingClients ? "Loading clients..." : "No clients found or type to search"}
                    />
                </Grid>
                {selectedClient && <Grid item xs={12}><Chip label={`Selected: ${selectedClient.first_name} ${selectedClient.surname}`} onDelete={() => setSelectedClient(null)} /></Grid>}
                <Grid item xs={12} sm={6}>
                    <TextField label="Date" type="date" value={newAppointmentData.start_time?.substring(0, 10) || ''} onChange={(e) => handleDateTimeChange('date', e.target.value)} fullWidth InputLabelProps={{ shrink: true }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Time" type="time" value={newAppointmentData.start_time?.substring(11, 16) || ''} onChange={(e) => handleDateTimeChange('time', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ step: (calendarSettings?.appointment_duration_minutes || 30) * 60 }}/>
                </Grid>
                 <Grid item xs={12}>
                    <TextField label="Description (Optional)" multiline rows={2} fullWidth value={newAppointmentData.description || ''} onChange={(e) => setNewAppointmentData(prev => ({ ...prev, description: e.target.value }))}/>
                </Grid>
                <Grid item xs={12}>
                    <Button onClick={handleCheckAvailability} disabled={!newAppointmentData.start_time || !calendarSettings || checkAvailabilityMutation.isPending} variant="outlined" fullWidth>
                        {checkAvailabilityMutation.isPending ? <CircularProgress size={24}/> : "Check Availability"}
                    </Button>
                </Grid>
                {availabilityMessage && <Grid item xs={12}><Alert severity={isSlotAvailable === true ? "success" : isSlotAvailable === false ? "error" : "info"}>{availabilityMessage}</Alert></Grid>}
            </Grid>
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button onClick={handleAddDialogClose}>Cancel</Button>
          <Button onClick={handleSaveAppointment} variant="contained" disabled={isSlotAvailable !== true || createAppointmentMutation.isPending || !selectedClient}>
            {createAppointmentMutation.isPending ? <CircularProgress size={24}/> : "Save Appointment"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>
            Appointment Details
            <IconButton aria-label="close" onClick={() => setOpenDetailDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        {selectedAppointment && (
          <DialogContent dividers>
            <Typography variant="h6">{selectedAppointment.client_name}</Typography>
            <Typography variant="body1">Phone: {selectedAppointment.client_phone_number}</Typography>
            <Typography variant="body1">From: {format(selectedAppointment.start, 'Pp')}</Typography>
            <Typography variant="body1">To: {format(selectedAppointment.end, 'Pp')}</Typography>
            <Typography variant="body1">Status: <Chip label={selectedAppointment.status} size="small" /></Typography>
            {selectedAppointment.description && <Typography variant="body1">Description: {selectedAppointment.description}</Typography>}
            {selectedAppointment.client_address && <Typography variant="body1">Address: {selectedAppointment.client_address}</Typography>}
            <Typography variant="caption" display="block" sx={{mt:1}}>Appt ID: {selectedAppointment.appointment_id}</Typography>
            <Typography variant="caption" display="block">Calendar Event ID: {selectedAppointment.calendar_event_id}</Typography>
          </DialogContent>
        )}
        <DialogActions sx={{p: 2, justifyContent: 'space-between'}}>
          <Button onClick={handleDeleteAppointment} color="error" startIcon={<DeleteIcon />} disabled={deleteAppointmentMutation.isPending || !selectedAppointment}>
            {deleteAppointmentMutation.isPending ? <CircularProgress size={20}/> : "Delete"}
          </Button>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
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