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
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';

interface Client {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  type: 'individual' | 'company';
  status: 'active' | 'inactive';
}

const ClientService: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'João Silva',
      cpf: '123.456.789-00',
      email: 'joao@example.com',
      phone: '(11) 99999-9999',
      address: 'Rua Exemplo, 123',
      type: 'individual',
      status: 'active',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual',
    status: 'active',
  });

  const handleAddClient = () => {
    setNewClient({
      name: '',
      cpf: '',
      email: '',
      phone: '',
      address: '',
      type: 'individual',
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleSaveClient = () => {
    const newId = (clients.length + 1).toString();
    setClients([...clients, { ...newClient, id: newId } as Client]);
    setOpenDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Client Service</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClient}
        >
          New Client
        </Button>
      </Box>

      <Grid container spacing={3}>
        {clients.map((client) => (
          <Grid item xs={12} md={6} lg={4} key={client.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{client.name}</Typography>
                </Box>
                <Typography variant="body1">
                  CPF/CNPJ: {client.cpf}
                </Typography>
                <Typography variant="body1">
                  Email: {client.email}
                </Typography>
                <Typography variant="body1">
                  Phone: {client.phone}
                </Typography>
                <Typography variant="body1">
                  Address: {client.address}
                </Typography>
                <Typography variant="body1">
                  Type: {client.type}
                </Typography>
                <Typography variant="body1" color={client.status === 'active' ? 'primary' : 'text.secondary'}>
                  Status: {client.status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Client</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="CPF/CNPJ"
            fullWidth
            value={newClient.cpf}
            onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={newClient.phone}
            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={newClient.address}
            onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newClient.type}
              label="Type"
              onChange={(e) => setNewClient({ ...newClient, type: e.target.value as Client['type'] })}
            >
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="company">Company</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveClient} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientService; 