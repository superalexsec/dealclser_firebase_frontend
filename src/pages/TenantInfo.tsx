import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartData {
  name: string;
  active: number;
  inactive: number;
  pending: number;
}

interface PieChartData {
  name: string;
  value: number;
}

interface TenantData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  plan: 'basic' | 'pro' | 'enterprise';
  users: number;
  createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const sampleData: ChartData[] = [
  { name: 'Jan', active: 400, inactive: 240, pending: 100 },
  { name: 'Feb', active: 300, inactive: 139, pending: 200 },
  { name: 'Mar', active: 200, inactive: 980, pending: 300 },
  { name: 'Apr', active: 278, inactive: 390, pending: 400 },
  { name: 'May', active: 189, inactive: 480, pending: 500 },
  { name: 'Jun', active: 239, inactive: 380, pending: 600 },
];

const pieData: PieChartData[] = [
  { name: 'Active', value: 400 },
  { name: 'Inactive', value: 300 },
  { name: 'Pending', value: 200 },
];

const TenantInfo = () => {
  const [tenants, setTenants] = useState<TenantData[]>([
    {
      id: '1',
      name: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '+55 11 99999-9999',
      address: 'São Paulo, SP, Brazil',
      status: 'active',
      plan: 'pro',
      users: 25,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Tech Solutions',
      email: 'info@techsolutions.com',
      phone: '+55 11 88888-8888',
      address: 'Rio de Janeiro, RJ, Brazil',
      status: 'active',
      plan: 'enterprise',
      users: 50,
      createdAt: '2024-02-15',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantData | null>(null);
  const [newTenant, setNewTenant] = useState<Partial<TenantData>>({
    status: 'pending',
    plan: 'basic',
    users: 0,
  });

  const handleSave = () => {
    if (editingTenant) {
      setTenants(tenants.map(t => 
        t.id === editingTenant.id ? { ...newTenant, id: t.id } as TenantData : t
      ));
    } else {
      setTenants([...tenants, { ...newTenant, id: Date.now().toString() } as TenantData]);
    }
    setOpenDialog(false);
  };

  const handleDelete = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tenant Information</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTenant(null);
            setNewTenant({
              status: 'pending',
              plan: 'basic',
              users: 0,
            });
            setOpenDialog(true);
          }}
        >
          Add Tenant
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Tenant List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tenants
            </Typography>
            <List>
              {tenants.map((tenant) => (
                <ListItem
                  key={tenant.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 1,
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={tenant.name}
                    secondary={
                      <Box>
                        <Chip
                          label={tenant.status}
                          color={getStatusColor(tenant.status) as any}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={tenant.plan}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    }
                  />
                  <Box>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingTenant(tenant);
                        setNewTenant(tenant);
                        setOpenDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(tenant.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Statistics and Charts */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Total Tenants</Typography>
                  <Typography variant="h4">{tenants.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Active Tenants</Typography>
                  <Typography variant="h4">
                    {tenants.filter(t => t.status === 'active').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Total Users</Typography>
                  <Typography variant="h4">
                    {tenants.reduce((sum, t) => sum + t.users, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Bar Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tenant Status Over Time
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sampleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="active" fill="#4caf50" name="Active" />
                      <Bar dataKey="inactive" fill="#f44336" name="Inactive" />
                      <Bar dataKey="pending" fill="#ff9800" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Pie Chart */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Current Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) => 
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Add/Edit Tenant Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newTenant.name || ''}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={newTenant.email || ''}
                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newTenant.phone || ''}
                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newTenant.address || ''}
                onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newTenant.status}
                  onChange={(e) => setNewTenant({ ...newTenant, status: e.target.value as TenantData['status'] })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value as TenantData['plan'] })}
                  label="Plan"
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Users"
                type="number"
                value={newTenant.users || 0}
                onChange={(e) => setNewTenant({ ...newTenant, users: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantInfo; 