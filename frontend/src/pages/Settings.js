import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  FormControlLabel,
  Switch,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeContext } from '../contexts/ThemeContext';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useThemeContext();

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Appearance
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DarkModeIcon sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body1">Dark Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  Switch between light and dark theme
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch 
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  color="primary"
                />
              }
              label=""
            />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Weight Tracker App © {new Date().getFullYear()}
      </Typography>
    </Container>
  );
};

export default Settings; 