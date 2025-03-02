import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addMonths, differenceInDays } from 'date-fns';
import { calculateMuscleMass, getWeeklyChange } from '../utils/calculations';

const GoalForm = ({ 
  onSubmit,
  submitting,
  editingGoalId,
  editingGoal,
  onCancelEdit,
  currentWeight,
  currentFatPercentage,
  selectedUserId
}) => {
  const [targetDate, setTargetDate] = useState(addMonths(new Date(), 3));
  const [targetWeight, setTargetWeight] = useState('');
  const [targetFatPercentage, setTargetFatPercentage] = useState('');
  const [description, setDescription] = useState('');
  
  // Populate form when editing an existing goal
  useEffect(() => {
    if (editingGoal) {
      if (editingGoal.target_date) {
        setTargetDate(new Date(editingGoal.target_date));
      }
      
      if (editingGoal.target_weight !== null && editingGoal.target_weight !== undefined) {
        setTargetWeight(editingGoal.target_weight.toString());
      }
      
      if (editingGoal.target_fat_percentage !== null && editingGoal.target_fat_percentage !== undefined) {
        setTargetFatPercentage(editingGoal.target_fat_percentage.toString());
      }
      
      if (editingGoal.description !== null && editingGoal.description !== undefined) {
        setDescription(editingGoal.description);
      }
    }
  }, [editingGoal]);

  const resetForm = () => {
    setTargetWeight('');
    setTargetFatPercentage('');
    setTargetDate(addMonths(new Date(), 3));
    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!targetDate || (!targetWeight && !targetFatPercentage)) {
      return false;
    }
    
    if (!selectedUserId) {
      return false;
    }

    // Calculate the target muscle mass if we have both weight and fat percentage
    const targetMuscleMass = calculateMuscleMass(targetWeight, targetFatPercentage);
    
    const goalData = {
      target_date: targetDate.toISOString().split('T')[0],
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      target_fat_percentage: targetFatPercentage ? parseFloat(targetFatPercentage) : null,
      target_muscle_mass: targetMuscleMass,
      description: description,
      user_id: selectedUserId
    };
    
    const success = await onSubmit(editingGoalId, goalData);
    
    if (success) {
      resetForm();
    }
    
    return success;
  };

  const handleCancel = () => {
    resetForm();
    onCancelEdit();
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {editingGoalId ? 'Edit Goal' : 'New Goal'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this goal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Target Date"
                value={targetDate}
                onChange={(newDate) => setTargetDate(newDate)}
                minDate={new Date()}
                slotProps={{ textField: { fullWidth: true } }}
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
                    onClick={handleCancel}
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
  );
};

export default GoalForm; 