import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Slider,
  IconButton,
  Tooltip,
  Chip,
  Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getEntries, updateEntry } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { format } from 'date-fns';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const EditEntry = () => {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const { currentUser } = useUserContext();
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState('');
  const [neck, setNeck] = useState('');
  const [belly, setBelly] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setFetchLoading(true);
        const entries = await getEntries();
        const entry = entries.find(e => e.id === parseInt(entryId));
        
        if (!entry) {
          setError('Entry not found');
          return;
        }
        
        // Set form values
        setDate(new Date(entry.date));
        setWeight(entry.weight.toString());
        setNeck(entry.neck ? entry.neck.toString() : '');
        setBelly(entry.belly ? entry.belly.toString() : '');
      } catch (err) {
        setError('Failed to load entry data');
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchEntry();
  }, [entryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!weight) {
      setError('Weight is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const entryData = {
        date: date.toISOString().split('T')[0],
        weight: parseFloat(weight),
        neck: neck ? parseFloat(neck) : null,
        belly: belly ? parseFloat(belly) : null,
        user_id: currentUser ? currentUser.id : null
      };
      
      await updateEntry(entryId, entryData);
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setError('Failed to update entry. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  const handleWeightSliderChange = (event, newValue) => {
    setWeight(newValue.toString());
  };
  
  const handleNeckSliderChange = (event, newValue) => {
    setNeck(newValue.toString());
  };
  
  const handleBellySliderChange = (event, newValue) => {
    setBelly(newValue.toString());
  };
  
  const formatAustralianDate = (date) => {
    return format(date, 'dd/MM/yyyy');
  };
  
  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
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
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Entry
        </Typography>
        
        {currentUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Editing entry for:
            </Typography>
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getUserInitials(currentUser.name)}
                </Avatar>
              }
              label={currentUser.name}
              variant="outlined"
              size="medium"
            />
          </Box>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  maxDate={new Date()}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      helperText: `Current date: ${formatAustralianDate(date)}`
                    } 
                  }}
                  format="dd/MM/yyyy"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 20,
                    max: 300,
                  }}
                />
                <Slider
                  value={weight ? parseFloat(weight) : 0}
                  onChange={handleWeightSliderChange}
                  min={40}
                  max={150}
                  step={0.1}
                  sx={{ mt: 2 }}
                  valueLabelDisplay="auto"
                  disabled={!weight}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Neck Circumference"
                  type="number"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 20,
                    max: 100,
                  }}
                  helperText="Used for body fat calculation"
                />
                <Slider
                  value={neck ? parseFloat(neck) : 0}
                  onChange={handleNeckSliderChange}
                  min={20}
                  max={60}
                  step={0.1}
                  sx={{ mt: 2 }}
                  valueLabelDisplay="auto"
                  disabled={!neck}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Belly Circumference"
                  type="number"
                  value={belly}
                  onChange={(e) => setBelly(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 40,
                    max: 200,
                  }}
                  helperText="Measured at navel level"
                />
                <Slider
                  value={belly ? parseFloat(belly) : 0}
                  onChange={handleBellySliderChange}
                  min={60}
                  max={150}
                  step={0.1}
                  sx={{ mt: 2 }}
                  valueLabelDisplay="auto"
                  disabled={!belly}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Entry updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditEntry; 