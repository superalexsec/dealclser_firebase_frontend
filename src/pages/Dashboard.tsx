import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Message as MessageIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface ChartData {
  name: string;
  messages: number;
  clients: number;
  successRate: number;
}

interface ClientDistribution {
  name: string;
  value: number;
}

interface ModuleActivity {
  module: string;
  sent: number;
  delivered: number;
  failed: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const sampleData: ChartData[] = [
  { name: 'Jan', messages: 400, clients: 240, successRate: 85 },
  { name: 'Feb', messages: 300, clients: 139, successRate: 78 },
  { name: 'Mar', messages: 200, clients: 980, successRate: 92 },
  { name: 'Apr', messages: 278, clients: 390, successRate: 88 },
  { name: 'May', messages: 189, clients: 480, successRate: 95 },
  { name: 'Jun', messages: 239, clients: 380, successRate: 90 },
];

const clientDistributionData: ClientDistribution[] = [
  { name: 'Enterprise', value: 35 },
  { name: 'SMB', value: 45 },
  { name: 'Startup', value: 20 },
];

const moduleActivityData: ModuleActivity[] = [
  { module: 'Marketing', sent: 1200, delivered: 1150, failed: 50 },
  { module: 'Support', sent: 800, delivered: 780, failed: 20 },
  { module: 'Sales', sent: 600, delivered: 585, failed: 15 },
  { module: 'Billing', sent: 400, delivered: 395, failed: 5 },
];

const recentActivities: RecentActivity[] = [
  { id: 1, type: 'Message', description: 'Bulk campaign completed', timestamp: '2 hours ago', status: 'success' },
  { id: 2, type: 'Client', description: 'New client onboarded', timestamp: '4 hours ago', status: 'success' },
  { id: 3, type: 'System', description: 'High message volume detected', timestamp: '6 hours ago', status: 'warning' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const stats = [
    { label: 'Total Messages', value: '1,234', icon: <MessageIcon /> },
    { label: 'Active Clients', value: '89', icon: <GroupIcon /> },
    { label: 'Success Rate', value: '92%', icon: <CalendarIcon /> },
    { label: 'Growth Rate', value: '+15%', icon: <TrendingUpIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1 }}>{stat.icon}</Box>
                  <Typography variant="h6">{stat.label}</Typography>
                </Box>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Client Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Client Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Module Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Message Volume by Module
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="module" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                  <Bar dataKey="failed" fill="#ff8042" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Activity Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Overview
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="messages"
                    stroke="#8884d8"
                    name="Messages"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clients"
                    stroke="#82ca9d"
                    name="Clients"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="successRate"
                    stroke="#ffc658"
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {activity.status === 'success' ? (
                        <CheckCircleIcon color="success" />
                      ) : activity.status === 'warning' ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <WarningIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.description}
                      secondary={`${activity.type} • ${activity.timestamp}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 