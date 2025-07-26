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
  FormControlLabel,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AddCircleOutline as AddIcon,
  Flag as FlagIcon,
  ShowChart as ChartIcon,
  BugReport as DebugIcon,
  Person as PersonIcon,
  Add as AddPersonIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useUserContext } from '../contexts/UserContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
// import { format } from 'date-fns';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { name: 'New Entry', path: '/new-entry', icon: <AddIcon /> },
  { name: 'Goals', path: '/goals', icon: <FlagIcon /> },
  { name: 'Progress', path: '/progress', icon: <ChartIcon /> },
  { name: 'Profile', path: '/profile', icon: <PersonIcon /> },
  { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const Header = ({ isDebugMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [debugAnchorEl, setDebugAnchorEl] = useState(null);
  const [showDebugMode, setShowDebugMode] = useState(localStorage.getItem('debugMode') === 'true');
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const { users, currentUser, switchUser } = useUserContext();
  const { darkMode, toggleDarkMode } = useThemeContext();
  const { signOut, currentAccount } = useContext(AuthContext);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
    window.location.reload();
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleUserSwitch = (userId) => {
    switchUser(userId);
    handleUserMenuClose();
  };

  const handleLogout = async () => {
    await signOut();
    handleUserMenuClose();
    // Optional: navigate('/login') if needed, but ProtectedRoute will handle redirects
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
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // const isActive = (path) => {
  //   return location.pathname === path;
  // };

  // const formatAustralianDate = (date) => {
  //   if (!date) return '';
  //   return format(new Date(date), 'dd/MM/yyyy');
  // };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
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
            sx={{ flexGrow: 0, fontWeight: 600, mr: 2 }}
          >
            Weight Tracker
          </Typography>
          
          {/* User selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 'auto' }}>
            {currentAccount && currentUser && (
              <Tooltip title="Click to change user or manage profile">
                <Button 
                  onClick={handleUserMenuOpen}
                  startIcon={
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: 'primary.main',
                        fontSize: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {getUserInitials(currentUser.name)}
                    </Avatar>
                  }
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    py: 1,
                    px: 2
                  }}
                >
                  {currentUser.name}
                </Button>
              </Tooltip>
            )}
            
            <Menu
              anchorEl={userMenuAnchorEl}
              open={Boolean(userMenuAnchorEl)}
              onClose={handleUserMenuClose}
            >
              {users.map(user => (
                <MenuItem 
                  key={user.id} 
                  onClick={() => handleUserSwitch(user.id)}
                  selected={currentUser && currentUser.id === user.id}
                >
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      mr: 1, 
                      fontSize: '0.75rem',
                      bgcolor: currentUser && currentUser.id === user.id ? 'primary.main' : 'grey.400'
                    }}
                  >
                    {getUserInitials(user.name)}
                  </Avatar>
                  {user.name}
                </MenuItem>
              ))}
              <MenuItem 
                component={RouterLink} 
                to="/profile" 
                onClick={handleUserMenuClose}
                divider
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Manage Profiles
              </MenuItem>
              <MenuItem 
                component={RouterLink} 
                to="/profile/new" 
                onClick={handleUserMenuClose}
              >
                <ListItemIcon>
                  <AddPersonIcon fontSize="small" />
                </ListItemIcon>
                Add New Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {currentAccount && menuItems.map((item) => (
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
          {isDebugMode && (
            <IconButton
              color="inherit"
              aria-label="debug"
              onClick={handleDebugMenuOpen}
            >
              <DebugIcon />
            </IconButton>
          )}
          {isDebugMode && (
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
          )}
          {/* Dark mode toggle */}
          <IconButton sx={{ ml: 1 }} onClick={toggleDarkMode} color="inherit">
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
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