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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addMonths, differenceInDays } from 'date-fns';
import { getGoals, addGoal, deleteGoal, updateGoal, getUsers } from '../services/api';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [targetDate, setTargetDate] = useState(addMonths(new Date(), 3)); // Default to 3 months from now
  const [targetWeight, setTargetWeight] = useState('');
  const [targetFatPercentage, setTargetFatPercentage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(80); // Default mock value for testing
  const [currentFatPercentage, setCurrentFatPercentage] = useState(20); // Default mock value for testing
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (selectedUserId) {
      fetchGoals(selectedUserId);
      fetchLatestMeasurements(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getUsers();
      setUsers(data);
      
      // If there's only one user, select it automatically
      if (data.length === 1) {
        setSelectedUserId(data[0].id);
      } else if (data.length > 0) {
        // Try to find a user named "Nathan" if available
        const nathan = data.find(user => user.name === "Nathan");
        if (nathan) {
          setSelectedUserId(nathan.id);
        }
      }
      
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLatestMeasurements = async (userId) => {
    try {
      // For testing, using mock values
      // TODO: Replace with actual API call when available
      // const response = await fetch(`/api/entries/user/${userId}/latest`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setCurrentWeight(data.weight);
      //   setCurrentFatPercentage(data.fat_percentage);
      // }
      
      // Using mock data for now to ensure the feature works
      setCurrentWeight(80);
      setCurrentFatPercentage(20);
    } catch (err) {
      console.error('Failed to fetch latest measurements:', err);
    }
  };

  const fetchGoals = async (userId) => {
    try {
      setLoading(true);
      const data = await getGoals(userId);
      setGoals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load goals. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate muscle mass based on weight and fat percentage
  const calculateMuscleMass = (weight, fatPercentage) => {
    if (!weight || !fatPercentage) return null;
    
    const weightNum = parseFloat(weight);
    const fatPercentageNum = parseFloat(fatPercentage);
    
    const fatMass = weightNum * (fatPercentageNum / 100);
    const essentialMass = weightNum * 0.2; // Estimate for bones, organs, etc.
    const muscleMass = weightNum - fatMass - essentialMass;
    
    return Math.max(muscleMass, 0);
  };

  // Calculate the weekly change for display
  const getWeeklyChange = (current, target, date) => {
    if (!current || !target || !date) return null;
    
    const daysRemaining = differenceInDays(date, new Date());
    if (daysRemaining <= 0) return null;
    
    // Calculate daily change and multiply by 7 for weekly
    const dailyChange = (parseFloat(target) - current) / daysRemaining;
    const weeklyChange = dailyChange * 7;
    return weeklyChange.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!targetDate || (!targetWeight && !targetFatPercentage)) {
      setError('Please set at least one target metric and a target date');
      return;
    }
    
    if (!selectedUserId) {
      setError('Please select a user for this goal');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Calculate the target muscle mass if we have both weight and fat percentage
      const targetMuscleMass = calculateMuscleMass(targetWeight, targetFatPercentage);
      
      const goalData = {
        target_date: targetDate.toISOString().split('T')[0],
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        target_fat_percentage: targetFatPercentage ? parseFloat(targetFatPercentage) : null,
        target_muscle_mass: targetMuscleMass,
        user_id: selectedUserId
      };
      
      if (editingGoalId) {
        // Update existing goal
        await updateGoal(editingGoalId, goalData);
        setSuccessMessage('Goal updated successfully!');
      } else {
        // Add new goal
        await addGoal(goalData);
        setSuccessMessage('Goal added successfully!');
      }
      
      await fetchGoals(selectedUserId);
      setSuccess(true);
      
      // Reset form
      resetForm();
      
    } catch (err) {
      setError(`Failed to ${editingGoalId ? 'update' : 'add'} goal. Please try again.`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTargetWeight('');
    setTargetFatPercentage('');
    setTargetDate(addMonths(new Date(), 3));
    setEditingGoalId(null);
  };

  const handleEditGoal = (goal) => {
    setTargetDate(new Date(goal.target_date));
    setTargetWeight(goal.target_weight?.toString() || '');
    setTargetFatPercentage(goal.target_fat_percentage?.toString() || '');
    setEditingGoalId(goal.id);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(id);
      setGoals(goals.filter(goal => goal.id !== id));
      setSuccessMessage('Goal deleted successfully!');
      setSuccess(true);
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
        {editingGoalId ? 'Edit Goal' : 'Set Your Goals'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* User selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth disabled={loadingUsers}>
            <InputLabel id="user-select-label">Select User</InputLabel>
            <Select
              labelId="user-select-label"
              id="user-select"
              value={selectedUserId}
              label="Select User"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map(user => (
                <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {loadingUsers && <CircularProgress size={24} sx={{ mt: 1 }} />}
        </CardContent>
      </Card>
      
      {selectedUserId ? (
        <>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      {editingGoalId ? 'Edit Goal' : 'New Goal'}
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
                      helperText={
                        targetWeight && differenceInDays(targetDate, new Date()) > 0 
                          ? `Weekly change: ${getWeeklyChange(currentWeight, targetWeight, targetDate) > 0 
                              ? '+' + getWeeklyChange(currentWeight, targetWeight, targetDate) 
                              : getWeeklyChange(currentWeight, targetWeight, targetDate)} kg/week` 
                          : ''
                      }
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Target Body Fat %"
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
                      helperText={
                        targetFatPercentage && differenceInDays(targetDate, new Date()) > 0
                          ? `Weekly change: ${getWeeklyChange(currentFatPercentage, targetFatPercentage, targetDate) > 0 
                              ? '+' + getWeeklyChange(currentFatPercentage, targetFatPercentage, targetDate) 
                              : getWeeklyChange(currentFatPercentage, targetFatPercentage, targetDate)} %/week`
                          : ''
                      }
                    />
                  </Grid>
                  
                  {targetWeight && targetFatPercentage && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Calculated Target Muscle Mass"
                        type="number"
                        value={calculateMuscleMass(targetWeight, targetFatPercentage)?.toFixed(1) || ''}
                        disabled
                        fullWidth
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                        helperText={
                          targetWeight && targetFatPercentage && differenceInDays(targetDate, new Date()) > 0 
                            ? (() => {
                                const currentMuscleMass = calculateMuscleMass(currentWeight, currentFatPercentage);
                                const targetMuscleMass = calculateMuscleMass(targetWeight, targetFatPercentage);
                                if (currentMuscleMass && targetMuscleMass) {
                                  const dailyChange = (targetMuscleMass - currentMuscleMass) / differenceInDays(targetDate, new Date());
                                  const weeklyChange = (dailyChange * 7).toFixed(2);
                                  return `Weekly change: ${weeklyChange > 0 ? '+' + weeklyChange : weeklyChange} kg/week`;
                                }
                                return '';
                              })()
                            : ''
                        }
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                      {editingGoalId && (
                        <Button
                          variant="outlined"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} /> : null}
                      >
                        {submitting ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Set Goal'}
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
                    .map((goal) => {
                      const daysRemaining = differenceInDays(new Date(goal.target_date), new Date());
                      
                      // Calculate weekly changes (daily * 7)
                      const weightChangePerWeek = currentWeight && goal.target_weight && daysRemaining > 0 
                        ? (((goal.target_weight - currentWeight) / daysRemaining) * 7).toFixed(2) 
                        : null;
                        
                      const fatChangePerWeek = currentFatPercentage && goal.target_fat_percentage && daysRemaining > 0 
                        ? (((goal.target_fat_percentage - currentFatPercentage) / daysRemaining) * 7).toFixed(2) 
                        : null;
                        
                      const muscleChangePerWeek = (() => {
                        if (currentWeight && currentFatPercentage && goal.target_muscle_mass && daysRemaining > 0) {
                          const currentMuscleMass = calculateMuscleMass(currentWeight, currentFatPercentage);
                          if (currentMuscleMass) {
                            return (((goal.target_muscle_mass - currentMuscleMass) / daysRemaining) * 7).toFixed(2);
                          }
                        }
                        return null;
                      })();
                      
                      return (
                        <TableRow key={goal.id}>
                          <TableCell component="th" scope="row">
                            {format(new Date(goal.target_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell align="right">
                            {goal.target_weight 
                              ? `${goal.target_weight.toFixed(1)} ${weightChangePerWeek 
                                  ? `(${weightChangePerWeek > 0 ? '+' : ''}${weightChangePerWeek}/week)` 
                                  : ''}`
                              : 'Not set'}
                          </TableCell>
                          <TableCell align="right">
                            {goal.target_fat_percentage 
                              ? `${goal.target_fat_percentage.toFixed(1)} ${fatChangePerWeek 
                                  ? `(${fatChangePerWeek > 0 ? '+' : ''}${fatChangePerWeek}/week)` 
                                  : ''}`
                              : 'Not set'}
                          </TableCell>
                          <TableCell align="right">
                            {goal.target_muscle_mass 
                              ? `${goal.target_muscle_mass.toFixed(1)} ${muscleChangePerWeek 
                                  ? `(${muscleChangePerWeek > 0 ? '+' : ''}${muscleChangePerWeek}/week)` 
                                  : ''}`
                              : 'Not set'}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleEditGoal(goal)}
                                  disabled={editingGoalId === goal.id}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                      Muscle Mass
                    </Typography>
                    <Typography variant="body2">
                      • Acvanced: up to 1-1.5 kg per month
                      <br />
                      • Intermediate: 0.5-1 kg per month
                      <br />
                      • Beginners: 0.25-0.5 kg per month
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
              {successMessage}
            </Alert>
          </Snackbar>
        </>
      ) : null}
    </Box>
  );
};

export default Goals; 