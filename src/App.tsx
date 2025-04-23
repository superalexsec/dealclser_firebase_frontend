import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ModuleFlow from './pages/ModuleFlow';
import MessageFlow from './pages/MessageFlow';
import Settings from './pages/Settings';
import ClientService from './pages/ClientService';
import Calendar from './pages/Calendar';
import PDFService from './pages/PDFService';
import Profile from './pages/Profile';
import TenantInfo from './pages/TenantInfo';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/module-flow" element={<ModuleFlow />} />
              <Route path="/message-flow" element={<MessageFlow />} />
              <Route path="/client-service" element={<ClientService />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/pdf-service" element={<PDFService />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tenant-info" element={<TenantInfo />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 