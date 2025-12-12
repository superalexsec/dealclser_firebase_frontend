import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api';

// Add type definition for the runtime config if not already global
// (Assuming it might be used elsewhere, making it global is fine)
declare global {
  interface Window {
    runtimeConfig?: {
      backendUrl?: string;
    };
  }
}

interface LoginCredentials {
  email?: string; // Changed from username to email based on sample
  password?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  // Removed tenantId as it's not returned by /token
  loginWithCredentials: (credentials: LoginCredentials) => Promise<void>; // New function
  login: (token: string) => void; // Simplified login
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  // isAuthenticated can be derived from token presence
  const isAuthenticated = !!token;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load check is simpler now, just check for token
    setLoading(false);
  }, []);

  // Function to call the /token endpoint
  const loginWithCredentials = async (credentials: LoginCredentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.email || ''); // Backend expects 'username'
    params.append('password', credentials.password || '');

    try {
      const response = await apiClient.post(
        '/token', 
        params, // Send URLSearchParams
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded' 
          }
        }
      );

      if (response.data.access_token) {
        login(response.data.access_token);
      } else {
        throw new Error('Login failed: No access token received');
      }
    } catch (error: any) {
      console.error("Login API call failed:", error);
      // Rethrow or handle specific error messages from backend if available
      if (error.response && error.response.data && error.response.data.detail) {
        // Check for specific "Email not verified" message
        if (error.response.data.detail === 'Email not verified. Please verify your email first.') {
             // You might want to return this specific error to the UI so it can redirect
             const err: any = new Error(error.response.data.detail);
             err.isUnverified = true;
             throw err;
        }
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  // Simplified login just stores the token
  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    // Optionally redirect to login page or home page
    // window.location.href = '/'; 
  };

  // Include loginWithCredentials in the context value
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, loginWithCredentials, login, logout, loading }}>
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