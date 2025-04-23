import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Message as MessageIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  messages: number;
  clients: number;
  successRate: number;
}

const sampleData: ChartData[] = [
  { name: 'Jan', messages: 400, clients: 240, successRate: 85 },
  { name: 'Feb', messages: 300, clients: 139, successRate: 78 },
  { name: 'Mar', messages: 200, clients: 980, successRate: 92 },
  { name: 'Apr', messages: 278, clients: 390, successRate: 88 },
  { name: 'May', messages: 189, clients: 480, successRate: 95 },
  { name: 'Jun', messages: 239, clients: 380, successRate: 90 },
];

const Dashboard = () => {
  const stats = [
    { label: 'Total Messages', value: '1,234', icon: <MessageIcon /> },
    { label: 'Active Clients', value: '89', icon: <GroupIcon /> },
    { label: 'Success Rate', value: '92%', icon: <CalendarIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
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
      </Grid>
    </Box>
  );
};

export default Dashboard; 