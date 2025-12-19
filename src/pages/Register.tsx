import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { getRecaptchaToken } from '../lib/recaptcha';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

// Define the structure of the registration data
interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  person_name: string;
  address: string;
}

// Define the structure of the expected response (adjust as needed)
interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  // Add other fields from the response if you need them
}

// Function to perform the API call
const registerTenant = async (data: RegisterData): Promise<RegisterResponse> => {
  // Generate reCAPTCHA token for signup action
  const recaptchaToken = await getRecaptchaToken('signup');

  const response = await apiClient.post<RegisterResponse>('/register', data, {
    headers: {
      'X-Recaptcha-Token': recaptchaToken,
      'X-Recaptcha-Action': 'signup'
    }
  });
  return response.data;
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    person_name: '',
    address: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<RegisterResponse, Error, RegisterData>({
    mutationFn: registerTenant,
    onSuccess: (data) => {
      console.log('Registration successful:', data);
      // Redirect to email verification page, passing the email
      navigate('/verify-email', { state: { email: formData.email } });
    },
    onError: (err) => {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    // Basic validation example (add more robust validation as needed)
    if (!formData.email || !formData.password || !formData.name) {
        setError('Please fill in all required fields.');
        return;
    }
    mutation.mutate(formData);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Register New Tenant
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Tenant Name"
            name="name"
            autoComplete="organization"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="person_name"
            label="Contact Person Name"
            name="person_name"
            autoComplete="name"
            value={formData.person_name}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="address"
            label="Address"
            name="address"
            autoComplete="street-address"
            value={formData.address}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register; 