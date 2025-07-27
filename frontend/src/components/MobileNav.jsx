import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fade,
  useTheme,
  useMediaQuery
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
    console.log('MobileNav: handleChange called with value:', newValue);
    setValue(newValue);
    navigate(newValue);
  };

  // Direct click handler as backup
  const handleDirectClick = (path) => {
    console.log('MobileNav: direct click handler called with path:', path);
    setValue(path);
    navigate(path);
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
          zIndex: theme.zIndex.appBar + 1,
          // Handle iOS safe area insets - all sides
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          // Ensure proper touch events
          touchAction: 'manipulation',
          // Prevent iOS bounce scrolling from interfering
          WebkitOverflowScrolling: 'touch',
          // Ensure no horizontal overflow
          overflow: 'hidden',
        }}
      >
        <BottomNavigation 
          value={value} 
          onChange={handleChange} 
          showLabels
          sx={{
            // Add extra padding for better iOS experience
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
            // Ensure proper touch target size and better spacing
            '& .MuiBottomNavigationAction-root': {
              minHeight: '64px',
              paddingTop: '6px',
              paddingBottom: '8px',
              minWidth: '60px',
              maxWidth: '120px',
              flex: '1 1 auto',
            },
            // Better font sizing for mobile
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              marginTop: '4px',
            },
          }}
        >
          {currentAccount && (
            <>
              <BottomNavigationAction 
                label="Home" 
                value="/" 
                icon={<DashboardIcon />}
                onClick={() => handleDirectClick('/')}
              />
              <BottomNavigationAction 
                label="Add" 
                value="/new-entry" 
                icon={<AddIcon />}
                onClick={() => handleDirectClick('/new-entry')}
              />
              <BottomNavigationAction 
                label="Progress" 
                value="/progress" 
                icon={<ChartIcon />}
                onClick={() => handleDirectClick('/progress')}
              />
              <BottomNavigationAction 
                label="Profile" 
                value="/profile" 
                icon={<PersonIcon />}
                onClick={() => handleDirectClick('/profile')}
              />
            </>
          )}
          {!currentAccount && (
            <>
              <BottomNavigationAction 
                label="Login" 
                value="/login" 
                icon={<LoginIcon />}
                onClick={() => handleDirectClick('/login')}
              />
              <BottomNavigationAction 
                label="Register" 
                value="/register" 
                icon={<PersonAddIcon />}
                onClick={() => handleDirectClick('/register')}
              />
            </>
          )}
        </BottomNavigation>
      </Paper>
    </Fade>
  );
};

export default MobileNav; 