import React from 'react';
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
} from '@mui/material';
import { Close as CloseIcon, WhatsApp, CalendarMonth, Payment, Business } from '@mui/icons-material';
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

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  isLogin: boolean;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, isLogin }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isLogin ? 'Entrar' : 'Criar Conta'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="E-mail"
            type="email"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Senha"
            type="password"
            fullWidth
            variant="outlined"
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
            disabled
          >
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            disabled
          >
            <img
              src="/google-icon.png"
              alt="Google"
              style={{ width: 20, height: 20, marginRight: 8 }}
            />
            Continuar com Google
          </Button>
          <Button
            variant="outlined"
            fullWidth
            disabled
          >
            <img
              src="/apple-icon.png"
              alt="Apple"
              style={{ width: 20, height: 20, marginRight: 8 }}
            />
            Continuar com Apple
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Typography variant="body2" color="textSecondary">
          {isLogin ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}
          <Button color="primary" onClick={onClose} sx={{ ml: 1 }}>
            {isLogin ? 'Criar Conta' : 'Entrar'}
          </Button>
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

const Landing: React.FC = () => {
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(true);

  const handleAuthClick = (login: boolean) => {
    setIsLogin(login);
    setAuthDialogOpen(true);
  };

  const features = [
    {
      icon: <WhatsApp fontSize="large" color="primary" />,
      title: 'Integração WhatsApp',
      description: 'Gerencie todas as suas conversas do WhatsApp Business em um só lugar.',
    },
    {
      icon: <CalendarMonth fontSize="large" color="primary" />,
      title: 'Agendamento Automático',
      description: 'Sincronize automaticamente com Google Calendar para gerenciar compromissos.',
    },
    {
      icon: <Payment fontSize="large" color="primary" />,
      title: 'Pagamentos Integrados',
      description: 'Receba pagamentos diretamente pelo WhatsApp com MercadoPago.',
    },
    {
      icon: <Business fontSize="large" color="primary" />,
      title: 'Multi-tenant',
      description: 'Gerencie múltiplos negócios em uma única plataforma.',
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
            A plataforma completa para gerenciar seu WhatsApp Business
          </Typography>
          <Box>
            <AuthButton
              variant="contained"
              color="secondary"
              onClick={() => handleAuthClick(false)}
            >
              Começar Agora
            </AuthButton>
            <AuthButton
              variant="outlined"
              color="inherit"
              onClick={() => handleAuthClick(true)}
              sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 2, sm: 0 } }}
            >
              Já tenho uma conta
            </AuthButton>
          </Box>
        </Container>
      </HeroSection>

      <Container sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Recursos
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
      />
    </Box>
  );
};

export default Landing; 