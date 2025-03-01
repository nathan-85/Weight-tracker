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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addMonths } from 'date-fns';
import { getGoals, addGoal, deleteGoal } from '../services/api';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [targetDate, setTargetDate] = useState(addMonths(new Date(), 3)); // Default to 3 months from now
  const [targetWeight, setTargetWeight] = useState('');
  const [targetFatPercentage, setTargetFatPercentage] = useState('');
  const [targetMuscleMass, setTargetMuscleMass] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await getGoals();
      setGoals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load goals. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!targetDate || (!targetWeight && !targetFatPercentage && !targetMuscleMass)) {
      setError('Please set at least one target metric and a target date');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const goalData = {
        target_date: targetDate.toISOString().split('T')[0],
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        target_fat_percentage: targetFatPercentage ? parseFloat(targetFatPercentage) : null,
        target_muscle_mass: targetMuscleMass ? parseFloat(targetMuscleMass) : null,
      };
      
      await addGoal(goalData);
      await fetchGoals();
      setSuccess(true);
      
      // Reset form
      setTargetWeight('');
      setTargetFatPercentage('');
      setTargetMuscleMass('');
      setTargetDate(addMonths(new Date(), 3));
      
    } catch (err) {
      setError('Failed to add goal. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(id);
      setGoals(goals.filter(goal => goal.id !== id));
    } catch (err) {
      setError('Failed to delete goal. Please try again.');
      console.error(err);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Set Your Goals
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  New Goal
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Target Date"
                  value={targetDate}
                  onChange={(newDate) => setTargetDate(newDate)}
                  minDate={new Date()}
                  slotProps={{ textField: { fullWidth: true } }}
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Target Weight"
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  fullWidth
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
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Target Body Fat Percentage"
                  type="number"
                  value={targetFatPercentage}
                  onChange={(e) => setTargetFatPercentage(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 3,
                    max: 50,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Target Muscle Mass"
                  type="number"
                  value={targetMuscleMass}
                  onChange={(e) => setTargetMuscleMass(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 10,
                    max: 100,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                  >
                    {submitting ? 'Saving...' : 'Set Goal'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      <Typography variant="h5" gutterBottom>
        Your Goals
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : goals.length === 0 ? (
        <Alert severity="info">
          You haven't set any goals yet. Use the form above to set your first goal.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Target Date</TableCell>
                <TableCell align="right">Target Weight (kg)</TableCell>
                <TableCell align="right">Target Body Fat (%)</TableCell>
                <TableCell align="right">Target Muscle Mass (kg)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...goals]
                .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
                .map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell component="th" scope="row">
                      {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="right">{goal.target_weight || 'Not set'}</TableCell>
                    <TableCell align="right">{goal.target_fat_percentage || 'Not set'}</TableCell>
                    <TableCell align="right">{goal.target_muscle_mass || 'Not set'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Setting Realistic Goals
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weight Loss
                </Typography>
                <Typography variant="body2">
                  • Aim for 0.5-1 kg per week for sustainable weight loss
                  <br />
                  • This equals about 2-4 kg per month
                  <br />
                  • Faster weight loss may be harder to maintain
                  <br />
                  • Consider your starting point and lifestyle
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Body Fat Reduction
                </Typography>
                <Typography variant="body2">
                  • Aim to lose 0.5-1% body fat per month
                  <br />
                  • Healthy ranges: 10-20% for men, 18-28% for women
                  <br />
                  • Athletes may have lower percentages
                  <br />
                  • Body fat loss slows as you get leaner
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Muscle Gain
                </Typography>
                <Typography variant="body2">
                  • Beginners: up to 1-1.5 kg per month
                  <br />
                  • Intermediate: 0.5-1 kg per month
                  <br />
                  • Advanced: 0.25-0.5 kg per month
                  <br />
                  • Requires resistance training and adequate protein
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
          Goal added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Goals; 