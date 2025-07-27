import React, { useState, useContext } from 'react';
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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SpeedIcon from '@mui/icons-material/Speed';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningIcon from '@mui/icons-material/Warning';
import { useThemeContext } from '../contexts/ThemeContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { AuthContext } from '../contexts/AuthContext';
import { deleteAccount } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const { 
    cautionMultiplier, 
    extremeMultiplier, 
    updateCautionMultiplier, 
    updateExtremeMultiplier 
  } = useSettingsContext();
  const { currentAccount } = useContext(AuthContext);
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleCautionChange = (event, newValue) => {
    updateCautionMultiplier(newValue);
  };

  const handleExtremeChange = (event, newValue) => {
    updateExtremeMultiplier(newValue);
  };

  const handleDeleteAccountClick = () => {
    setDeleteDialogOpen(true);
    setDeleteError(null);
    setConfirmationText('');
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setConfirmationText('');
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      await deleteAccount();
      
      // The account is now deleted and user is logged out
      // Redirect to login page
      navigate('/login');
      
    } catch (error) {
      setDeleteError('Failed to delete account. Please try again.');
      console.error('Account deletion error:', error);
    } finally {
      setIsDeleting(false);
    }
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

      {/* Danger Zone */}
      <Card sx={{ mb: 4, border: '2px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h6" component="h2" color="error.main">
              Danger Zone
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
            <Box>
              <Typography variant="body1" color="error.main" fontWeight="bold">
                Delete Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your account and all associated data including profiles, entries, and goals.
                This action cannot be undone.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleDeleteAccountClick}
              sx={{ ml: 2, minWidth: 140 }}
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1 }} />
          Delete Account - Final Warning
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              This action is PERMANENT and IRREVERSIBLE!
            </Typography>
          </Alert>
          
          <DialogContentText sx={{ mb: 2 }}>
            You are about to permanently delete your account <strong>{currentAccount?.username}</strong> and ALL associated data:
          </DialogContentText>
          
          <Box sx={{ mb: 2, pl: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>• All user profiles</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• All weight entries and measurements</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• All goals and progress tracking</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• All personal data and settings</Typography>
          </Box>
          
          <DialogContentText sx={{ mb: 3, fontWeight: 'bold', color: 'error.main' }}>
            This data cannot be recovered once deleted. There is no backup or restore option.
          </DialogContentText>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            To confirm deletion, please type <strong>DELETE MY ACCOUNT</strong> below:
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            error={deleteError !== null}
            helperText={deleteError}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={isDeleting}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting || confirmationText !== 'DELETE MY ACCOUNT'}
            startIcon={<DeleteForeverIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account Forever'}
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Weight Tracker App © {new Date().getFullYear()}
      </Typography>
    </Container>
  );
};

export default Settings; 