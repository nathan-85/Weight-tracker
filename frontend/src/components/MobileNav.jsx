import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fade,
  useTheme,
  useMediaQuery,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddCircleOutline as AddIcon,
  Flag as FlagIcon,
  ShowChart as ChartIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

/**
 * MobileNav
 * Responsive bottom navigation bar that shows on small screens (<600px).
 * Provides quick access to the main pages.
 */
const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentAccount } = useContext(AuthContext);

  // Keep track of current tab based on route
  const [value, setValue] = useState(location.pathname);

  // Sync state when location changes (e.g., via header links)
  useEffect(() => {
    setValue(location.pathname);
  }, [location.pathname]);

  // Do not render on non–mobile screens
  if (!isMobile) return null;

  const handleChange = (_, newValue) => {
    setValue(newValue);
    navigate(newValue);
  };

  return (
    <Fade in={isMobile}>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <BottomNavigation value={value} onChange={handleChange} showLabels>
          {currentAccount && (
            <>
              <BottomNavigationAction label="Dashboard" value="/" icon={<DashboardIcon />} />
              <BottomNavigationAction label="New Entry" value="/new-entry" icon={<AddIcon />} />
              <BottomNavigationAction label="Goals" value="/goals" icon={<FlagIcon />} />
              <BottomNavigationAction label="Progress" value="/progress" icon={<ChartIcon />} />
              <BottomNavigationAction label="Profile" value="/profile" icon={<PersonIcon />} />
              <BottomNavigationAction label="Settings" value="/settings" icon={<SettingsIcon />} />
            </>
          )}
          {!currentAccount && (
            <>
              <BottomNavigationAction label="Login" value="/login" icon={<LoginIcon />} />
              <BottomNavigationAction label="Register" value="/register" icon={<PersonAddIcon />} />
            </>
          )}
        </BottomNavigation>
      </Paper>
    </Fade>
  );
};

export default MobileNav; 