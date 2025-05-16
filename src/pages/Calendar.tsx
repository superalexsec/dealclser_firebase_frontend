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
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
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
  Client, // Assuming Client type is exported from api.ts
  listTenantAppointments,
  createAppointment,
  checkSlotAvailability,
  getTenantCalendarInfo,
  getAppointmentDetails,
  fetchClients, // Assuming fetchClients is available
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
  title: string; // for react-big-calendar
  start: Date;   // for react-big-calendar
  end: Date;     // for react-big-calendar
}

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
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isSlotAvailable, setIsSlotAvailable] = useState<boolean | null>(null);

  // Fetch Tenant Calendar Info (for appointment_duration_minutes)
  const { data: calendarSettings, isLoading: isLoadingCalendarSettings } = useQuery<TenantCalendarInfo, Error>({
    queryKey: ['tenantCalendarSettings', token],
    queryFn: () => getTenantCalendarInfo(token!),
    enabled: !!token,
  });

  // Fetch appointments
  const { data: appointments = [], isLoading: isLoadingAppointments, error: fetchAppointmentsError } = useQuery<AppointmentResponse[], Error, CalendarEvent[]>({
    queryKey: ['tenantAppointments', token, calendarSettings?.calendar_id, format(currentDate, 'yyyy-MM')], // Refetch on month change or if calendar_id changes
    queryFn: async () => {
      if (!token || !calendarSettings?.calendar_id) return [];
      const firstDayOfMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const lastDayOfMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      return listTenantAppointments(firstDayOfMonth, lastDayOfMonth, token);
    },
    enabled: !!token && !!calendarSettings?.calendar_id, // Ensure settings (and thus calendar_id) are loaded
    select: (data: AppointmentResponse[]): CalendarEvent[] =>
      data.map(app => ({
        ...app,
        title: `${app.client_name} (${app.description || 'Appointment'})`,
        start: new Date(app.start_time),
        end: new Date(app.end_time),
      })),
  });

  // Fetch clients for Autocomplete
  const { data: searchedClients, isLoading: isLoadingClients } = useQuery<Client[], Error>({
    queryKey: ['allClientsForAutocomplete', token], // Changed queryKey as we fetch all and filter client-side
    queryFn: () => fetchClients(0, 500, token!), // Fetch a larger list for client-side filtering, removed search term
    enabled: !!token,
  });
  
  const createAppointmentMutation = useMutation<AppointmentResponse, Error, AppointmentCreateFrontend>({
    mutationFn: (data) => createAppointment(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantAppointments'] });
      setOpenAddDialog(false);
      setNewAppointmentData({});
      setSelectedClient(null);
      setAvailabilityMessage('Appointment created successfully!');
      setIsSlotAvailable(null);
    },
    onError: (error) => {
      setAvailabilityMessage(`Failed to create appointment: ${error.message}`);
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

  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
    if (!calendarSettings?.appointment_duration_minutes) {
      alert('Calendar settings not loaded yet. Cannot determine appointment duration.');
      return;
    }
    setNewAppointmentData({ 
      start_time: format(start, "yyyy-MM-dd'T'HH:mm:ss") // Default to naive, backend expects UTC or aware
    });
    setSelectedClient(null); // Reset client
    setClientSearchInput('');
    setAvailabilityMessage(null);
    setIsSlotAvailable(null);
    setOpenAddDialog(true);
  }, [calendarSettings]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event);
    setOpenDetailDialog(true);
  }, []);

  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
    setNewAppointmentData({});
    setSelectedClient(null);
    setClientSearchInput('');
    setAvailabilityMessage(null);
    setIsSlotAvailable(null);
  };

  const handleDateTimeChange = (field: 'date' | 'time', value: string) => {
    setAvailabilityMessage(null);
    setIsSlotAvailable(null);
    let currentStartTime = newAppointmentData.start_time ? new Date(newAppointmentData.start_time.substring(0,19)) : new Date(); // work with local date

    if (field === 'date') {
        const [year, month, day] = value.split('-').map(Number);
        currentStartTime.setFullYear(year, month - 1, day);
    } else if (field === 'time') {
        const [hours, minutes] = value.split(':').map(Number);
        currentStartTime.setHours(hours, minutes, 0, 0); // Set seconds and ms to 0
    }
    setNewAppointmentData(prev => ({ ...prev, start_time: format(currentStartTime, "yyyy-MM-dd'T'HH:mm:ss") }));
  };
  

  const handleCheckAvailability = () => {
    if (!newAppointmentData.start_time || !calendarSettings?.appointment_duration_minutes) {
      setAvailabilityMessage('Please select a start time and ensure calendar settings are loaded.');
      return;
    }
    const payload: CheckSlotAvailabilityRequestFrontend = {
      start_datetime: newAppointmentData.start_time, // Naive datetime
      duration_minutes: calendarSettings.appointment_duration_minutes,
    };
    checkAvailabilityMutation.mutate(payload);
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

    const startDate = new Date(newAppointmentData.start_time); // This is naive
    const endDate = new Date(startDate.getTime() + calendarSettings.appointment_duration_minutes * 60000);

    // Convert to UTC ISO string for backend
    const startUTC = new Date(startDate.valueOf() - startDate.getTimezoneOffset() * 60000).toISOString();
    const endUTC = new Date(endDate.valueOf() - endDate.getTimezoneOffset() * 60000).toISOString();


    const payload: AppointmentCreateFrontend = {
      client_phone_number: selectedClient.client_phone_number!, // Assuming phone number is on client object
      start_time: startUTC,
      end_time: endUTC,
      description: newAppointmentData.description || '',
    };
    createAppointmentMutation.mutate(payload);
  };

  const EventComponent: React.FC<EventProps<CalendarEvent>> = ({ event }) => (
    <Box sx={{ fontSize: '0.8em', p: '2px' }}>
      <Typography variant="caption" display="block">{event.title}</Typography>
      <Typography variant="caption" display="block">
        {format(event.start, 'p')} - {format(event.end, 'p')}
      </Typography>
    </Box>
  );


  if (isLoadingCalendarSettings) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 120px)' /* Adjust height as needed */ }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Calendar</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            if (!calendarSettings?.appointment_duration_minutes) {
                alert('Calendar settings not loaded yet. Cannot determine appointment duration.');
                return;
            }
            setNewAppointmentData({ start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") });
            setSelectedClient(null);
            setClientSearchInput('');
            setAvailabilityMessage(null);
            setIsSlotAvailable(null);
            setOpenAddDialog(true);
          }}
        >
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
            onView={(v: View) => setView(v as 'month' | 'week' | 'day')}
            date={currentDate}
            onNavigate={(newDate: Date, view: View, action: NavigateAction) => setCurrentDate(newDate)}
            components={{
                event: EventComponent,
            }}
            formats={{
                timeGutterFormat: (date: Date, culture, localizer) =>
                    localizer!.format(date, 'p', culture!),
                eventTimeRangeFormat: ({ start, end }, culture, local) =>
                    local!.format(start, 'p', culture!) + ' — ' +
                    local!.format(end, 'p', culture!),
            }}
        />
      </Paper>

      {/* Add/Edit Appointment Dialog */}
      <Dialog open={openAddDialog} onClose={handleAddDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>
            New Appointment
            <IconButton aria-label="close" onClick={handleAddDialogClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                     <Autocomplete
                        options={searchedClients || []}
                        getOptionLabel={(option) => `${option.first_name} ${option.surname} (${option.client_identification})` }
                        value={selectedClient}
                        onInputChange={(event, newInputValue) => {
                            setClientSearchInput(newInputValue);
                        }}
                        onChange={(event, newValue) => {
                            setSelectedClient(newValue);
                        }}
                        loading={isLoadingClients}
                        renderInput={(params) => (
                            <TextField
                            {...params}
                            label="Search Client (by name or CPF/CNPJ)"
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                <>
                                    {isLoadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                                ),
                            }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                                {option.first_name} {option.surname} ({option.client_identification}) - {option.client_phone_number}
                            </li>
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        noOptionsText={clientSearchInput.length > 2 ? "No clients found" : "Type to search clients"}
                    />
                </Grid>
                {selectedClient && (
                    <Grid item xs={12}>
                        <Chip label={`Selected: ${selectedClient.first_name} ${selectedClient.surname} - ${selectedClient.client_phone_number}`} onDelete={() => setSelectedClient(null)} />
                    </Grid>
                )}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Date"
                        type="date"
                        value={newAppointmentData.start_time ? newAppointmentData.start_time.substring(0, 10) : ''}
                        onChange={(e) => handleDateTimeChange('date', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Time"
                        type="time"
                        value={newAppointmentData.start_time ? newAppointmentData.start_time.substring(11, 16) : ''}
                        onChange={(e) => handleDateTimeChange('time', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: (calendarSettings?.appointment_duration_minutes || 30) * 60 }} // Step by duration
                    />
                </Grid>
                 <Grid item xs={12}>
                    <TextField
                        label="Description (Optional)"
                        multiline
                        rows={2}
                        fullWidth
                        value={newAppointmentData.description || ''}
                        onChange={(e) => setNewAppointmentData(prev => ({ ...prev, description: e.target.value }))}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button 
                        onClick={handleCheckAvailability} 
                        disabled={!newAppointmentData.start_time || !calendarSettings || checkAvailabilityMutation.isPending}
                        variant="outlined"
                        fullWidth
                    >
                        {checkAvailabilityMutation.isPending ? <CircularProgress size={24}/> : "Check Availability"}
                    </Button>
                </Grid>
                {availabilityMessage && (
                    <Grid item xs={12}>
                        <Alert severity={isSlotAvailable === true ? "success" : isSlotAvailable === false ? "error" : "info"}>
                            {availabilityMessage}
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button onClick={handleAddDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSaveAppointment} 
            variant="contained"
            disabled={isSlotAvailable !== true || createAppointmentMutation.isPending || !selectedClient}
          >
            {createAppointmentMutation.isPending ? <CircularProgress size={24}/> : "Save Appointment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>
            Appointment Details
            <IconButton aria-label="close" onClick={() => setOpenDetailDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        {selectedAppointment && (
          <DialogContent dividers>
            <Typography variant="h6">{selectedAppointment.client_name}</Typography>
            <Typography variant="body1">Phone: {selectedAppointment.client_phone_number}</Typography>
            <Typography variant="body1">
              From: {format(selectedAppointment.start, 'Pp')}
            </Typography>
            <Typography variant="body1">
              To: {format(selectedAppointment.end, 'Pp')}
            </Typography>
            <Typography variant="body1">Status: <Chip label={selectedAppointment.status} size="small" /></Typography>
            {selectedAppointment.description && (
                <Typography variant="body1">Description: {selectedAppointment.description}</Typography>
            )}
            {selectedAppointment.client_address && (
                <Typography variant="body1">Address: {selectedAppointment.client_address}</Typography>
            )}
            <Typography variant="caption" display="block" sx={{mt:1}}>Appt ID: {selectedAppointment.appointment_id}</Typography>
            <Typography variant="caption" display="block">Calendar Event ID: {selectedAppointment.calendar_event_id}</Typography>
          </DialogContent>
        )}
        <DialogActions sx={{p: 2}}>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
          {/* Add Cancel Appointment Button if needed */}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage; 