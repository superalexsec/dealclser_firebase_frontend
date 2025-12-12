import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { verifyEmailOtp, requestMfa } from '../lib/api';

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email if passed from registration or login redirect
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyEmailOtp({ email, otp });
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/'); // Redirect to landing/login
      }, 2000);
    } catch (err: any) {
      console.error('Verification failed:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Verification failed. Please check the code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setSuccess('');
    setResendLoading(true);
    try {
      await requestMfa({ email });
      setSuccess('A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('Resend OTP failed:', err);
      if (err.response?.data?.detail) {
          setError(err.response.data.detail);
      } else {
          setError('Failed to resend code. Please try again.');
      }
    } finally {
        setResendLoading(false);
    }
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
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Email Verification
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Please enter the verification code sent to your email.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!(location.state && location.state.email)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="otp"
              label="Verification Code (OTP)"
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Email'}
            </Button>
            <Button
              fullWidth
              variant="text"
              color="secondary"
              onClick={handleResendOtp}
              disabled={resendLoading || loading}
            >
               {resendLoading ? 'Sending...' : 'Resend Code'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;

