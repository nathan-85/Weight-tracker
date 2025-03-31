import React from 'react';
import {
  Container,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Divider,
  Card,
  CardContent,
  Slider,
  Tooltip,
  IconButton
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SpeedIcon from '@mui/icons-material/Speed';
import { useThemeContext } from '../contexts/ThemeContext';
import { useSettingsContext } from '../contexts/SettingsContext';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const { 
    cautionMultiplier, 
    extremeMultiplier, 
    updateCautionMultiplier, 
    updateExtremeMultiplier 
  } = useSettingsContext();

  const handleCautionChange = (event, newValue) => {
    updateCautionMultiplier(newValue);
  };

  const handleExtremeChange = (event, newValue) => {
    updateExtremeMultiplier(newValue);
  };

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

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SpeedIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Goal Thresholds
            </Typography>
            <Tooltip title="These settings control when the weekly change indicators turn yellow (caution) or red (extreme)">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* <Alert severity="info" sx={{ mb: 3 }}>
            These values act as multipliers for the recommended maximum rates of change. 
            For example, if the recommended max weight loss is 1kg/week, a multiplier of 1.25 
            will show a yellow warning at 1.25kg/week.
          </Alert> */}

          <Box sx={{ mb: 4 }}>
            <Typography gutterBottom>
              Caution Threshold (Yellow Warning)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={cautionMultiplier}
                onChange={handleCautionChange}
                min={1.0}
                max={2.0}
                step={0.05}
                valueLabelDisplay="auto"
                sx={{ flexGrow: 1 }}
              />
              
            </Box>
            <Typography variant="body2" color="text.secondary">
              Default: 1.25 - Values between 1.0 and 2.0
            </Typography>
          </Box>

          <Box>
            <Typography gutterBottom>
              Extreme Threshold (Red Warning)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={extremeMultiplier}
                onChange={handleExtremeChange}
                min={1.0}
                max={2.0}
                step={0.05}
                valueLabelDisplay="auto"
                sx={{ flexGrow: 1 }}
              />
             
            </Box>
            <Typography variant="body2" color="text.secondary">
              Default: 1.5 - Values between 1.0 and 2.0
            </Typography>
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