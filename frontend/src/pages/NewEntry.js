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
  Chip,
  Avatar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addEntry, getEntries } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { format } from 'date-fns';

const NewEntry = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState('');
  const [neck, setNeck] = useState('');
  const [belly, setBelly] = useState('');
  const [hip, setHip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastNeckMeasurement, setLastNeckMeasurement] = useState(null);
  
  // Determine if we should show the hip field
  const isFemaleMeasurementRequired = currentUser && currentUser.sex === 'female';

  // Fetch the user's most recent entry to get the neck measurement
  useEffect(() => {
    const fetchLastEntry = async () => {
      if (!currentUser) return;
      
      try {
        // Use getEntries instead of getUserEntries and filter by user_id
        const entries = await getEntries();
        const userEntries = entries.filter(entry => entry.user_id === currentUser.id);
        
        if (userEntries && userEntries.length > 0) {
          // Sort entries by date (newest first)
          const sortedEntries = userEntries.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          
          // Get the most recent entry with a neck measurement
          const lastEntryWithNeck = sortedEntries.find(entry => entry.neck);
          
          if (lastEntryWithNeck && lastEntryWithNeck.neck) {
            setLastNeckMeasurement(lastEntryWithNeck.neck);
            setNeck(lastEntryWithNeck.neck.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch last entry:", err);
      }
    };
    
    fetchLastEntry();
  }, [currentUser]);

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
        hip: hip ? parseFloat(hip) : null,
        user_id: currentUser ? currentUser.id : null
      };
      
      await addEntry(entryData);
      setSuccess(true);
      
      // Reset form
      setWeight('');
      setNeck('');
      setBelly('');
      setHip('');
      setDate(new Date());
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err) {
      setError('Failed to add entry. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  const formatAustralianDate = (date) => {
    return format(date, 'dd/MM/yyyy');
  };
  
  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Entry
        </Typography>
        
        {currentUser && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Adding entry for:
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
                  helperText={lastNeckMeasurement ? `Auto-filled from last entry (${lastNeckMeasurement} cm)` : "Used for body fat calculation"}
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
              </Grid>
              
              {isFemaleMeasurementRequired && (
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Hip Circumference"
                    type="number"
                    value={hip}
                    onChange={(e) => setHip(e.target.value)}
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                    }}
                    inputProps={{
                      step: 0.1,
                      min: 60,
                      max: 200,
                    }}
                    helperText="Measured at the widest point of the hips"
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Saving...' : 'Save Entry'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          How to Measure
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weight
                </Typography>
                <Typography variant="body2">
                  • Weigh yourself in the morning before eating or drinking
                  <br />
                  • Use the same scale each time
                  <br />
                  • Wear minimal clothing or none at all
                  <br />
                  • Stand still with weight evenly distributed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Neck Circumference
                </Typography>
                <Typography variant="body2">
                  • Use a flexible measuring tape
                  <br />
                  • Measure around the middle of your neck
                  <br />
                  • Keep the tape horizontal and snug but not tight
                  <br />
                  • For men, measure below the Adam's apple
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Belly Circumference
                </Typography>
                <Typography variant="body2">
                  • Measure at the level of your navel
                  <br />
                  • Stand relaxed, not sucking in or pushing out
                  <br />
                  • Keep the tape horizontal all the way around
                  <br />
                  • Measure at the end of a normal exhale
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {isFemaleMeasurementRequired && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hip Circumference
                  </Typography>
                  <Typography variant="body2">
                    • Measure at the widest part of your hips
                    <br />
                    • Include the fullest part of your buttocks
                    <br />
                    • Keep the tape horizontal all the way around
                    <br />
                    • Stand with feet together for consistency
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
      
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Entry added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewEntry; 