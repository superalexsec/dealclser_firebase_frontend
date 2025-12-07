import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  ListItemButton,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  ViewModule as ViewModuleIcon,
  People as PeopleIcon,
  CalendarToday as CalendarTodayIcon,
  PictureAsPdf as PDFIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Storefront as StorefrontIcon,
  ShoppingBag as ShoppingBagIcon,
  Description as DescriptionIcon,
  EditNote as EditNoteIcon,
  ListAlt as ListAltIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const logoutTenant = async (token: string | null, backendUrl: string | undefined): Promise<void> => {
  if (!token) {
    console.warn('Logout attempted without a token.');
    return;
  }
  if (!backendUrl) {
    throw new Error('Backend URL is not configured.');
  }
  try {
     await axios.post(`${backendUrl}/logout`, {}, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });
  } catch (error) { 
     console.error('Backend logout failed:', error); 
  }
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: localLogout, token } = useAuth();
  const queryClient = useQueryClient();
  const backendUrl = window.runtimeConfig?.backendUrl;
  const { t, i18n } = useTranslation();
  const [anchorElLang, setAnchorElLang] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMessagingClick = () => {
    setMessagingOpen(!messagingOpen);
  };

  const handleProductsClick = () => {
    setProductsOpen(!productsOpen);
  };

  const handleContractsClick = () => {
    setContractsOpen(!contractsOpen);
  };

  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElLang(event.currentTarget);
  };

  const handleLangMenuClose = () => {
    setAnchorElLang(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleLangMenuClose();
  };

  const getItemOpenState = (itemText: string): boolean => {
    if (itemText === 'Messaging' || itemText === 'Mensagens') {
      return messagingOpen;
    }
    if (itemText === 'Products' || itemText === 'Produtos') {
      return productsOpen;
    }
    if (itemText === 'Contracts' || itemText === 'Contratos') {
      return contractsOpen;
    }
    return false;
  };

  const logoutMutation = useMutation<void, Error>({ 
    mutationFn: () => logoutTenant(token, backendUrl),
    onSuccess: () => {
      localLogout();
      queryClient.clear();
      navigate('/');
    },
    onError: (error) => {
      console.error('Logout mutation error, attempting local logout anyway:', error);
      localLogout(); 
      queryClient.clear();
      navigate('/');
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    { 
      text: t('layout.message_flow'), // 'Messaging' replaced for better translation key match if possible, but structure requires subitems logic
      // Ideally keys should be used directly. For now, we will map text to translation 
      // but to keep logic simple with "text" used for open state, we need consistent keys.
      // Let's keep original keys for logic, and translate display text.
      key: 'Messaging',
      displayText: 'Messaging', // Used for icon logic fallback if needed, but better use key
      icon: <MessageIcon />,
      subItems: [
        { text: t('layout.module_flow'), icon: <ViewModuleIcon />, path: '/module-flow' },
        { text: t('layout.message_flow'), icon: <MessageIcon />, path: '/message-flow' },
      ]
    },
    { text: t('layout.clients'), key: 'Clients', icon: <PeopleIcon />, path: '/client-service' },
    { text: t('layout.calendar'), key: 'Calendar', icon: <CalendarTodayIcon />, path: '/calendar' },
    { 
      text: t('layout.contracts'),
      key: 'Contracts',
      icon: <DescriptionIcon />,
      subItems: [
        { text: t('layout.templates'), icon: <EditNoteIcon />, path: '/contracts/templates' },
        { text: t('layout.client_contracts'), icon: <ListAltIcon />, path: '/contracts/clients' },
      ]
    },
    { 
      text: t('layout.products'), 
      key: 'Products',
      icon: <StorefrontIcon />,
      subItems: [
        { text: t('layout.catalog'), icon: <CategoryIcon />, path: '/products' },
        { text: t('layout.cart'), icon: <ShoppingCartIcon />, path: '/cart' },
      ]
    },
    { text: t('layout.profile'), key: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: t('layout.purchases'), key: 'Purchases', icon: <ShoppingBagIcon />, path: '/purchases' },
    { text: t('layout.settings'), key: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  if (location.pathname === '/') {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DealCloser
          </Typography>
          
          <Button
            color="inherit"
            startIcon={<LanguageIcon />}
            onClick={handleLangMenuOpen}
          >
            {i18n.language === 'pt-BR' ? 'PT' : 'EN'}
          </Button>
          <Menu
            anchorEl={anchorElLang}
            open={Boolean(anchorElLang)}
            onClose={handleLangMenuClose}
          >
            <MenuItem onClick={() => changeLanguage('pt-BR')}>Português (Brasil)</MenuItem>
            <MenuItem onClick={() => changeLanguage('en-US')}>English (US)</MenuItem>
          </Menu>

          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : t('layout.logout')}
          </Button>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
        </DrawerHeader>
        <List>
          {menuItems.map((item) => (
            item.subItems ? (
              <React.Fragment key={item.key}>
                <ListItemButton 
                  onClick={
                    item.key === 'Messaging' ? handleMessagingClick :
                    item.key === 'Products' ? handleProductsClick :
                    item.key === 'Contracts' ? handleContractsClick :
                    undefined 
                  }
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {getItemOpenState(item.key) ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse 
                  in={getItemOpenState(item.key)} 
                  timeout="auto" 
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItem
                        button
                        key={subItem.text}
                        disabled={false}
                        onClick={() => navigate(subItem.path)}
                        selected={location.pathname === subItem.path}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
              <ListItem
                button
                key={item.key}
                onClick={() => item.path && navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            )
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
};

export default Layout;
