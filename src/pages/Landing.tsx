import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  WhatsApp,
  CalendarMonth,
  Payment,
  Business,
  Google as GoogleIcon,
  Apple as AppleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import apiClient from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: 'white',
  padding: theme.spacing(15, 0),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(10, 0),
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const AuthButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5, 4),
}));

const SocialButton = styled(Button)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  justifyContent: 'flex-start',
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(2),
  },
}));

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  isLogin: boolean;
  onModeChange: (isLogin: boolean) => void;
}

interface AuthResponse {
  token: string;
  tenantId: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      message: string;
    };
  };
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, isLogin, onModeChange }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { loginWithCredentials, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithCredentials({ email, password });
        onClose();
        navigate('/profile');
      } else {
        console.warn('Registration attempt via AuthDialog');
        const response = await apiClient.post<AuthResponse>('/api/auth/register', {
          email,
          password,
          name,
          phone,
          address,
        });
        if (response.data.token) {
          login(response.data.token);
          onClose();
          navigate('/profile');
        } else {
          throw new Error('Registration via dialog failed');
        }
      }
    } catch (err: any) {
      console.error("AuthDialog Error:", err);
      setError(err.message || 'Authentication failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>(`/api/auth/${provider}`, { provider });
      login(response.data.token);
      onClose();
      navigate('/profile');
    } catch (err: any) {
      console.error("Social Login Error:", err);
      setError(err.response?.data?.message || 'Social login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isLogin ? 'Login to Your Account' : 'Create New Account'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <SocialButton
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
          >
            Continue with Google
          </SocialButton>
          <SocialButton
            variant="outlined"
            startIcon={<AppleIcon />}
            onClick={() => handleSocialLogin('apple')}
            disabled={loading}
          >
            Continue with iCloud
          </SocialButton>
          
          <Divider sx={{ my: 3 }}>
            <Typography color="textSecondary" variant="body2">
              OR
            </Typography>
          </Divider>

          {!isLogin && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Full Name"
                type="text"
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Phone"
                type="tel"
                fullWidth
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Address"
                type="text"
                fullWidth
                variant="outlined"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
            </>
          )}

          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          {!isLogin && (
            <Alert severity="info" sx={{ mt: 2 }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isLogin ? 'Login' : 'Create Account'
            )}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Typography variant="body2" color="textSecondary">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <Button
            color="primary"
            onClick={() => {
              onClose();
              onModeChange(!isLogin);
            }}
            sx={{ ml: 1 }}
            disabled={loading}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </Button>
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

const Landing: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const navigate = useNavigate();

  const handleAuthClick = (login: boolean) => {
    setIsLoginMode(login);
    setAuthOpen(true);
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
  };

  const features = [
    {
      icon: <WhatsApp fontSize="large" color="primary" />,
      title: 'WhatsApp Integration',
      description: 'Manage all your WhatsApp Business conversations in one place.',
    },
    {
      icon: <CalendarMonth fontSize="large" color="primary" />,
      title: 'Automatic Scheduling',
      description: 'Sync automatically with Google Calendar to manage appointments.',
    },
    {
      icon: <Payment fontSize="large" color="primary" />,
      title: 'Integrated Payments',
      description: 'Receive payments directly through WhatsApp with MercadoPago.',
    },
    {
      icon: <Business fontSize="large" color="primary" />,
      title: 'Multi-tenant',
      description: 'Manage multiple businesses in a single platform.',
    },
  ];

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="md">
          <img
            src="/zap_central.png"
            alt="ZapCentral Logo"
            style={{ width: '200px', marginBottom: '2rem' }}
          />
          <Typography variant="h2" component="h1" gutterBottom>
            Automate Your Business with Smart WhatsApp Flows
          </Typography>
          <Typography variant="h5" component="p" color="rgba(255, 255, 255, 0.8)" gutterBottom>
            Streamline client interactions, scheduling, contracts, and payments - all through WhatsApp.
          </Typography>
          <Link to="/register" style={{ textDecoration: 'none' }}> 
            <AuthButton 
              variant="contained" 
              color="secondary" 
              size="large" 
            >
              Get Started Now
            </AuthButton>
          </Link>
          {/* Add a Login button to trigger the AuthDialog */}
          <AuthButton 
            variant="outlined" 
            color="inherit" // Use inherit color for outlined button on this background
            size="large" 
            onClick={() => handleAuthClick(true)} // Open dialog in login mode
            sx={{ ml: 2 }} // Add some margin
          >
            Login
          </AuthButton>
        </Container>
      </HeroSection>

      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  {feature.icon}
                  <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      <AuthDialog
        open={authOpen}
        onClose={handleAuthClose}
        isLogin={isLoginMode}
        onModeChange={setIsLoginMode}
      />
    </Box>
  );
};

export default Landing; 