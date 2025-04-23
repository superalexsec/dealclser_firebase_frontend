import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/Layout';
import Landing from './pages/Landing';
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

// Temporary auth check - replace with proper auth logic later
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/module-flow" element={
              <ProtectedRoute>
                <ModuleFlow />
              </ProtectedRoute>
            } />
            <Route path="/message-flow" element={
              <ProtectedRoute>
                <MessageFlow />
              </ProtectedRoute>
            } />
            <Route path="/client-service" element={
              <ProtectedRoute>
                <ClientService />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } />
            <Route path="/pdf-service" element={
              <ProtectedRoute>
                <PDFService />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/tenant-info" element={
              <ProtectedRoute>
                <TenantInfo />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 