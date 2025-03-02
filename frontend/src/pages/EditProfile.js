import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  Slider,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { getUser, updateUser } from '../services/api';

const EditProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { loadUsers } = useUserContext();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetchLoading(true);
        const userData = await getUser(userId);
        
        // Set form values
        setName(userData.name || '');
        setAge(userData.age ? userData.age.toString() : '');
        setSex(userData.sex || '');
        setHeight(userData.height ? userData.height.toString() : '');
      } catch (err) {
        setError('Failed to load user data');
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userData = {
        name,
        age: age ? parseInt(age) : null,
        sex: sex || null,
        height: height ? parseFloat(height) : null
      };
      
      await updateUser(userId, userData);
      setSuccess(true);
      
      // Reload users to update the current user if needed
      await loadUsers();
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
      
    } catch (err) {
      setError('Failed to update user profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  const handleHeightSliderChange = (event, newValue) => {
    setHeight(newValue.toString());
  };

  const handleHeightInputChange = (event) => {
    setHeight(event.target.value === '' ? '' : event.target.value);
  };

  const handleAgeSliderChange = (event, newValue) => {
    setAge(newValue.toString());
  };

  const handleAgeInputChange = (event) => {
    setAge(event.target.value === '' ? '' : event.target.value);
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/profile')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Edit Profile
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                variant="outlined"
                helperText="Enter the user's full name"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="sex-label">Sex</InputLabel>
                <Select
                  labelId="sex-label"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  label="Sex"
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <TextField
                  label="Age"
                  type="number"
                  fullWidth
                  value={age}
                  onChange={handleAgeInputChange}
                  variant="outlined"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                    inputProps: { min: 0, max: 120 }
                  }}
                />
                <Tooltip title="Age is used for more accurate body fat calculations">
                  <IconButton size="small" sx={{ ml: 1, mb: 1 }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Slider
                value={age ? parseInt(age) : 0}
                onChange={handleAgeSliderChange}
                min={0}
                max={120}
                sx={{ mt: 2 }}
                disabled={age === ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <TextField
                  label="Height"
                  type="number"
                  fullWidth
                  value={height}
                  onChange={handleHeightInputChange}
                  variant="outlined"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                    inputProps: { min: 0, max: 250 }
                  }}
                />
                <Tooltip title="Height is used for body fat percentage calculations">
                  <IconButton size="small" sx={{ ml: 1, mb: 1 }}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Slider
                value={height ? parseFloat(height) : 0}
                onChange={handleHeightSliderChange}
                min={0}
                max={250}
                sx={{ mt: 2 }}
                disabled={height === ''}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/profile')}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !name}
                startIcon={<SaveIcon />}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProfile; 