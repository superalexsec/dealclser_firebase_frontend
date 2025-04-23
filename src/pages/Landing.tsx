import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00A884 30%, #128C7E 90%)',
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

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, isLogin, onModeChange }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Set auth state and redirect to dashboard
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
  };

  const handleSocialLogin = (provider: string) => {
    // Set auth state and redirect to dashboard
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
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
          <SocialButton
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('google')}
          >
            Continue with Google
          </SocialButton>
          <SocialButton
            variant="outlined"
            startIcon={<AppleIcon />}
            onClick={() => handleSocialLogin('apple')}
          >
            Continue with iCloud
          </SocialButton>
          
          <Divider sx={{ my: 3 }}>
            <Typography color="textSecondary" variant="body2">
              OR
            </Typography>
          </Divider>

          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          >
            {isLogin ? 'Login' : 'Create Account'}
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
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </Button>
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

const Landing: React.FC = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuthClick = (login: boolean) => {
    setIsLogin(login);
    setAuthDialogOpen(true);
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
        <Container>
          <img
            src="/zap_central.png"
            alt="ZapCentral Logo"
            style={{ width: '200px', marginBottom: '2rem' }}
          />
          <Typography variant="h2" component="h1" gutterBottom>
            ZapCentral
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
            The complete platform to manage your WhatsApp Business
          </Typography>
          <Box>
            <AuthButton
              variant="contained"
              color="secondary"
              onClick={() => handleAuthClick(false)}
            >
              Get Started Now
            </AuthButton>
            <AuthButton
              variant="outlined"
              color="inherit"
              onClick={() => handleAuthClick(true)}
              sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 2, sm: 0 } }}
            >
              I already have an account
            </AuthButton>
          </Box>
        </Container>
      </HeroSection>

      <Container sx={{ py: 8 }}>
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
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        isLogin={isLogin}
        onModeChange={handleAuthClick}
      />
    </Box>
  );
};

export default Landing; 