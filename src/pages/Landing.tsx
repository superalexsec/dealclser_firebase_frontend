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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        // Updated to correct endpoint: /register (without /auth prefix)
        const response = await apiClient.post<AuthResponse>('/register', {
          email,
          password,
          name,
          phone,
          address,
        });
        // Registration successful (201). Backend sends email.
        // Redirect to email verification page.
        onClose();
        navigate('/verify-email', { state: { email } });
      }
    } catch (err: any) {
      console.error("AuthDialog Error:", err);
      // Check for unverified email error from Login attempt
      if (err.isUnverified && email) {
          onClose();
          navigate('/verify-email', { state: { email } });
          return;
      }
      
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
        {isLogin ? t('landing.auth.login_title') : t('landing.auth.register_title')}
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
            {t('landing.auth.continue_google')}
          </SocialButton>
          <SocialButton
            variant="outlined"
            startIcon={<AppleIcon />}
            onClick={() => handleSocialLogin('apple')}
            disabled={loading}
          >
            {t('landing.auth.continue_icloud')}
          </SocialButton>
          
          <Divider sx={{ my: 3 }}>
            <Typography color="textSecondary" variant="body2">
              {t('landing.auth.or')}
            </Typography>
          </Divider>

          {!isLogin && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label={t('landing.auth.full_name')}
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
                label={t('landing.auth.phone')}
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
                label={t('landing.auth.address')}
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
            label={t('landing.auth.email')}
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
            label={t('landing.auth.password')}
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          {isLogin && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button 
                color="primary" 
                onClick={() => {
                  onClose();
                  navigate('/forgot-password');
                }}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                {t('landing.auth.forgot_password', 'Esqueceu a senha?')}
              </Button>
            </Box>
          )}

          {!isLogin && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('landing.auth.terms')}
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
              isLogin ? t('landing.auth.submit_login') : t('landing.auth.submit_register')
            )}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Typography variant="body2" color="textSecondary">
          {isLogin ? t('landing.auth.no_account') : t('landing.auth.have_account')}
          <Button
            color="primary"
            onClick={() => {
              onClose();
              onModeChange(!isLogin);
            }}
            sx={{ ml: 1 }}
            disabled={loading}
          >
            {isLogin ? t('landing.auth.signup_link') : t('landing.auth.login_link')}
          </Button>
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

const Landing: React.FC = () => {
  const theme = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      title: t('landing.whatsapp_title'),
      description: t('landing.whatsapp_desc'),
    },
    {
      icon: <CalendarMonth fontSize="large" color="primary" />,
      title: t('landing.schedule_title'),
      description: t('landing.schedule_desc'),
    },
    {
      icon: <Payment fontSize="large" color="primary" />,
      title: t('landing.payments_title'),
      description: t('landing.payments_desc'),
    },
    {
      icon: <Business fontSize="large" color="primary" />,
      title: t('landing.multitenant_title'),
      description: t('landing.multitenant_desc'),
    },
  ];

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="md">
          <img
            src="/3D_Logo.png"
            alt="Próximo Negócio Logo"
            style={{ width: '100%', maxWidth: '300px', marginBottom: '2rem' }}
          />
          <Typography variant={useMediaQuery(theme.breakpoints.down('sm')) ? 'h4' : 'h2'} component="h1" gutterBottom>
            {t('landing.title')}
          </Typography>
          <Typography variant="h5" component="p" color="rgba(255, 255, 255, 0.8)" gutterBottom>
            {t('landing.subtitle')}
          </Typography>

          <Box sx={{
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            maxWidth: '800px',
            width: '100%',
            background: '#000',
            margin: '2rem auto',
            borderRadius: 2,
            boxShadow: 3,
          }}>
            <iframe
              src="https://www.youtube.com/embed/8G7NK9G_1OE"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Próximo Negócio Video"
            />
          </Box>

          <Link to="/register" style={{ textDecoration: 'none' }}> 
            <AuthButton 
              variant="contained" 
              color="secondary" 
              size="large" 
            >
              {t('landing.get_started')}
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
            {t('landing.login')}
          </AuthButton>
        </Container>
      </HeroSection>

      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          {t('landing.features_title')}
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
