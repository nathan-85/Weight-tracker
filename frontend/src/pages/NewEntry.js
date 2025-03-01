import React, { useState } from 'react';
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
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addEntry } from '../services/api';
import { useNavigate } from 'react-router-dom';

const NewEntry = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState('');
  const [neck, setNeck] = useState('');
  const [belly, setBelly] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      };
      
      await addEntry(entryData);
      setSuccess(true);
      
      // Reset form
      setWeight('');
      setNeck('');
      setBelly('');
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Entry
      </Typography>
      
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
                  slotProps={{ textField: { fullWidth: true } }}
                  renderInput={params => <TextField {...params} fullWidth />}
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
                  helperText="Used for body fat calculation"
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
            <Card>
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
            <Card>
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
            <Card>
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