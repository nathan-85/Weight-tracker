import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AddCircleOutline as AddIcon,
  Flag as FlagIcon,
  ShowChart as ChartIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { name: 'New Entry', path: '/new-entry', icon: <AddIcon /> },
  { name: 'Goals', path: '/goals', icon: <FlagIcon /> },
  { name: 'Progress', path: '/progress', icon: <ChartIcon /> },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [debugAnchorEl, setDebugAnchorEl] = useState(null);
  const [showDebugMode, setShowDebugMode] = useState(localStorage.getItem('debugMode') === 'true');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setMenuOpen(open);
  };

  const handleDebugMenuOpen = (event) => {
    setDebugAnchorEl(event.currentTarget);
    setDebugMenuOpen(true);
  };

  const handleDebugMenuClose = () => {
    setDebugAnchorEl(null);
    setDebugMenuOpen(false);
  };

  const toggleDebugMode = () => {
    const newValue = !showDebugMode;
    setShowDebugMode(newValue);
    localStorage.setItem('debugMode', newValue);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Weight Tracker
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            component={RouterLink}
            to={item.path}
            key={item.name}
            selected={location.pathname === item.path}
            sx={{
              color: location.pathname === item.path ? 'primary.main' : 'text.primary',
              '&.Mui-selected': {
                backgroundColor: 'rgba(63, 81, 181, 0.08)',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'New Entry', icon: <AddIcon />, path: '/new-entry' },
    { text: 'Goals', icon: <FlagIcon />, path: '/goals' },
    { text: 'Progress', icon: <ChartIcon />, path: '/progress' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            Weight Tracker
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  sx={{
                    mx: 1,
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    '&:hover': {
                      backgroundColor: 'rgba(63, 81, 181, 0.04)',
                    },
                  }}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          <IconButton
            color="inherit"
            aria-label="debug"
            onClick={handleDebugMenuOpen}
          >
            <DebugIcon />
          </IconButton>
          <Menu
            anchorEl={debugAnchorEl}
            open={debugMenuOpen}
            onClose={handleDebugMenuClose}
          >
            <MenuItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={showDebugMode}
                    onChange={toggleDebugMode}
                    name="debugMode"
                    color="primary"
                  />
                }
                label="Debug Mode"
              />
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/debug"
              onClick={handleDebugMenuClose}
            >
              Debug Panel
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header; 