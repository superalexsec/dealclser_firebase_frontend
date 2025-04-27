import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  tenantId: string | null;
  login: (token: string, tenantId: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedTenantId = localStorage.getItem('tenantId');

    if (token && storedTenantId) {
      // Verify token validity
      axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setIsAuthenticated(true);
          setTenantId(storedTenantId);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('tenantId');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, tenantId: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tenantId', tenantId);
    setIsAuthenticated(true);
    setTenantId(tenantId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    setIsAuthenticated(false);
    setTenantId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, tenantId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 