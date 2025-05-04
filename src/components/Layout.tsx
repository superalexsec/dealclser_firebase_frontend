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
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: localLogout, token } = useAuth();
  const queryClient = useQueryClient();
  const backendUrl = window.runtimeConfig?.backendUrl;

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMessagingClick = () => {
    setMessagingOpen(!messagingOpen);
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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { 
      text: 'Messaging', 
      icon: <MessageIcon />,
      subItems: [
        { text: 'Module Flow', icon: <ViewModuleIcon />, path: '/module-flow' },
        { text: 'Message Flow', icon: <MessageIcon />, path: '/message-flow' },
      ]
    },
    { text: 'Client Service', icon: <PeopleIcon />, path: '/client-service' },
    { text: 'Calendar', icon: <CalendarTodayIcon />, path: '/calendar' },
    { text: 'PDF Service', icon: <PDFIcon />, path: '/pdf-service' },
    { text: 'Product Catalog', icon: <StorefrontIcon />, path: '/products' },
    { text: 'Tenant Info', icon: <BusinessIcon />, path: '/tenant-info' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
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
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
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
              <React.Fragment key={item.text}>
                <ListItemButton onClick={handleMessagingClick}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {messagingOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={messagingOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItem
                        button
                        key={subItem.text}
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
                key={item.text}
                onClick={() => navigate(item.path)}
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