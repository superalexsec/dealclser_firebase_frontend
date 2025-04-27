import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  // isAuthenticated can be derived from token presence
  const isAuthenticated = !!token;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load check is simpler now, just check for token
    setLoading(false);
  }, []);

  // Function to call the /token endpoint
  const loginWithCredentials = async (credentials: LoginCredentials) => {
    const backendUrl = window.runtimeConfig?.backendUrl;
    if (!backendUrl) {
      throw new Error('Backend URL is not configured');
    }

    // Prepare form data
    const params = new URLSearchParams();
    params.append('username', credentials.email || ''); // Backend expects 'username'
    params.append('password', credentials.password || '');

    try {
      const response = await axios.post(
        `${backendUrl}/token`, 
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
    } catch (error) {
      console.error("Login API call failed:", error);
      // Rethrow or handle specific error messages from backend if available
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.detail || 'Invalid credentials');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  // Simplified login just stores the token
  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
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