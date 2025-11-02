import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import ModuleFlow from './pages/ModuleFlow';
import MessageFlow from './pages/MessageFlow';
import Settings from './pages/Settings';
import ClientService from './pages/ClientService';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProductsCatalogPage from './pages/ProductsCatalogPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import Purchases from './pages/Purchases';
import ContractTemplatePage from './pages/ContractTemplatePage';
import ClientContractsPage from './pages/ClientContractsPage';
import PublicContractSigningPage from './pages/PublicContractSigningPage';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/register" element={<Register />} />
              <Route path="/payments/:sessionId" element={<PaymentPage />} />
              <Route path="/contracts/:tenantId/:clientId/:contractDbId" element={<PublicContractSigningPage />} />
              
              {/* Protected routes */}
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
              <Route path="/products" element={
                <ProtectedRoute>
                  <ProductsCatalogPage />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              } />
              <Route path="/purchases" element={
                <ProtectedRoute>
                  <Purchases />
                </ProtectedRoute>
              } />
              <Route path="/contracts/templates" element={
                <ProtectedRoute>
                  <ContractTemplatePage />
                </ProtectedRoute>
              } />
              <Route path="/contracts/clients" element={
                <ProtectedRoute>
                  <ClientContractsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App; 