import React, { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'initial' | 'follow-up' | 'documentation';
}

const Calendar: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      clientName: 'João Silva',
      date: '2024-04-25',
      time: '14:00',
      status: 'scheduled',
      type: 'initial',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    clientName: '',
    date: '',
    time: '',
    status: 'scheduled',
    type: 'initial',
  });

  const handleAddAppointment = () => {
    setNewAppointment({
      clientName: '',
      date: '',
      time: '',
      status: 'scheduled',
      type: 'initial',
    });
    setOpenDialog(true);
  };

  const handleSaveAppointment = () => {
    const newId = (appointments.length + 1).toString();
    setAppointments([...appointments, { ...newAppointment, id: newId } as Appointment]);
    setOpenDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Calendar</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAppointment}
        >
          New Appointment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {appointments.map((appointment) => (
          <Grid item xs={12} md={6} lg={4} key={appointment.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{appointment.clientName}</Typography>
                </Box>
                <Typography variant="body1">
                  Date: {appointment.date}
                </Typography>
                <Typography variant="body1">
                  Time: {appointment.time}
                </Typography>
                <Typography variant="body1">
                  Type: {appointment.type}
                </Typography>
                <Typography variant="body1" color={appointment.status === 'scheduled' ? 'primary' : 'text.secondary'}>
                  Status: {appointment.status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Appointment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Client Name"
            fullWidth
            value={newAppointment.clientName}
            onChange={(e) => setNewAppointment({ ...newAppointment, clientName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={newAppointment.date}
            onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Time"
            type="time"
            fullWidth
            value={newAppointment.time}
            onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newAppointment.type}
              label="Type"
              onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value as Appointment['type'] })}
            >
              <MenuItem value="initial">Initial</MenuItem>
              <MenuItem value="follow-up">Follow-up</MenuItem>
              <MenuItem value="documentation">Documentation</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAppointment} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar; 