import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  role: string;
  joinDate: string;
  status: 'active' | 'inactive';
  subscriptionPlan: 'basic' | 'pro' | 'enterprise';
  nextBillingDate: string;
  paymentMethod: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  invoiceNumber: string;
}

const samplePayments: PaymentHistory[] = [
  {
    id: '1',
    date: '2024-03-01',
    amount: 99.99,
    status: 'completed',
    invoiceNumber: 'INV-2024-001',
  },
  {
    id: '2',
    date: '2024-02-01',
    amount: 99.99,
    status: 'completed',
    invoiceNumber: 'INV-2024-002',
  },
  {
    id: '3',
    date: '2024-01-01',
    amount: 99.99,
    status: 'completed',
    invoiceNumber: 'INV-2024-003',
  },
];

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+55 11 99999-9999',
    company: 'DealCloser Inc.',
    address: 'São Paulo, SP, Brazil',
    role: 'Administrator',
    joinDate: '2024-01-01',
    status: 'active',
    subscriptionPlan: 'pro',
    nextBillingDate: '2024-04-01',
    paymentMethod: 'Credit Card ending in 4242',
  });

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Implement API call to save profile
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 120, height: 120, mb: 2 }}
                src="/path-to-avatar.jpg"
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5">{profile.name}</Typography>
              <Chip
                label={profile.status}
                color={profile.status === 'active' ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={
                    isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    ) : (
                      profile.email
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={
                    isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    ) : (
                      profile.phone
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Company"
                  secondary={
                    isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      />
                    ) : (
                      profile.company
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Address"
                  secondary={
                    isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      />
                    ) : (
                      profile.address
                    )
                  }
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              {isEditing ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Subscription and Payment Information */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Subscription Info */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Subscription Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PaymentIcon sx={{ mr: 1 }} />
                          <Typography variant="h6">Current Plan</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
                          {profile.subscriptionPlan}
                        </Typography>
                        <Typography color="text.secondary">
                          Next billing: {profile.nextBillingDate}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CreditCardIcon sx={{ mr: 1 }} />
                          <Typography variant="h6">Payment Method</Typography>
                        </Box>
                        <Typography variant="body1">
                          {profile.paymentMethod}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          Update Payment Method
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Payment History */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Payment History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {samplePayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>{payment.invoiceNumber}</TableCell>
                          <TableCell align="right">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status}
                              color={getStatusColor(payment.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              startIcon={<ReceiptIcon />}
                            >
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 