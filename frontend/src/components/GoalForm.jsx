import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  InputAdornment,
  useTheme,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addMonths, differenceInDays } from 'date-fns';
import { calculateMuscleMass, getWeeklyChange, GOAL_THRESHOLDS } from '../utils/calculations';

// Define realistic weekly change guidelines
const REALISTIC_WEEKLY_CHANGES = {
  weight: { min: -1, max: -0.5 }, // 0.5-1 kg loss per week is healthy
  fat: { min: -0.25, max: -0.125 }, // 0.5-1% per month = 0.125-0.25% per week
  muscle: { min: 0.06, max: 0.375 } // 0.25-1.5 kg per month = 0.06-0.375 per week
};

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
  const theme = useTheme();
  const [targetDate, setTargetDate] = useState(addMonths(new Date(), 3));
  const [startDate, setStartDate] = useState(new Date());
  const [targetWeight, setTargetWeight] = useState('');
  const [targetFatPercentage, setTargetFatPercentage] = useState('');
  const [description, setDescription] = useState('');
  
  // Populate form when editing an existing goal
  useEffect(() => {
    if (editingGoal) {
      if (editingGoal.target_date) {
        setTargetDate(new Date(editingGoal.target_date));
      }
      
      if (editingGoal.start_date) {
        setStartDate(new Date(editingGoal.start_date));
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
    setStartDate(new Date());
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
    
    console.log("Form submission - Start Date:", startDate);
    console.log("Form submission - Start Date ISO:", startDate.toISOString().split('T')[0]);
    
    const goalData = {
      target_date: targetDate.toISOString().split('T')[0],
      start_date: startDate.toISOString().split('T')[0],
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      target_fat_percentage: targetFatPercentage ? parseFloat(targetFatPercentage) : null,
      target_muscle_mass: targetMuscleMass,
      description: description,
      user_id: selectedUserId
    };
    
    console.log("Submitting goal data:", goalData);
    
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

  // Helper to determine color based on weekly change value and type
  const getWeeklyChangeColor = (value, type) => {
    if (!value) return 'text.secondary';

    // For weight loss (negative values)
    if (type === 'weight' && value < 0) {
      // Extreme: More than extreme multiplier x the recommended max weight loss
      if (value < GOAL_THRESHOLDS.EXTREME_MULTIPLIER * REALISTIC_WEEKLY_CHANGES.weight.min) {
        return theme.palette.error.main;
      }
      // Caution: Between caution and extreme multiplier
      else if (value < GOAL_THRESHOLDS.CAUTION_MULTIPLIER * REALISTIC_WEEKLY_CHANGES.weight.min) {
        return theme.palette.warning.main;
      }
      // Normal range and conservative - all good
      else {
        return theme.palette.success.main;
      }
    }
    // For fat loss (negative values)
    else if (type === 'fat' && value < 0) {
      // Extreme: More than extreme multiplier x the recommended max fat loss
      if (value < GOAL_THRESHOLDS.EXTREME_MULTIPLIER * REALISTIC_WEEKLY_CHANGES.fat.min) {
        return theme.palette.error.main;
      }
      // Caution: Between caution and extreme multiplier
      else if (value < GOAL_THRESHOLDS.CAUTION_MULTIPLIER * REALISTIC_WEEKLY_CHANGES.fat.min) {
        return theme.palette.warning.main;
      }
      // Normal range and conservative - all good
      else {
        return theme.palette.success.main;
      }
    }
    // For muscle gain (positive values)
    else if (type === 'muscle' && value > 0) {
      // Extreme: More than extreme multiplier x the recommended max muscle gain
      if (value > GOAL_THRESHOLDS.EXTREME_MULTIPLIER * REALISTIC_WEEKLY_CHANGES.muscle.max) {
        return theme.palette.error.main;
      }
      // Caution: Between caution and extreme multiplier
      else if (value > GOAL_THRESHOLDS.CAUTION_MULTIPLIER * REALISTIC_WEEKLY_CHANGES.muscle.max) {
        return theme.palette.warning.main;
      }
      // Normal range and conservative - all good
      else {
        return theme.palette.success.main;
      }
    }
    
    // Default case - if trying to gain weight/fat or lose muscle
    return theme.palette.error.main;
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
          fontWeight: 'bold'
        }}
      >
        {editingGoalId ? 'Edit Goal' : 'New Goal'}
      </Typography>

      <Divider />
      
      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's your goal?"
        InputLabelProps={{ shrink: true }}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
          }
        }}
      />
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newDate) => setStartDate(newDate)}
            format="dd/MM/yyyy"
            slotProps={{ 
              textField: { 
                fullWidth: true,
                sx: {
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                  }
                }
              } 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Target Date"
            value={targetDate}
            onChange={(newDate) => setTargetDate(newDate)}
            minDate={startDate}
            format="dd/MM/yyyy"
            slotProps={{ 
              textField: { 
                fullWidth: true,
                sx: {
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                  }
                }
              } 
            }}
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={2} sx={{ '& > .MuiGrid-item': { pb: 0 } }}>
        <Grid item xs={12}>
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
                ? (() => {
                    const weeklyChange = currentWeight !== null && currentWeight !== undefined
                      ? getWeeklyChange(currentWeight, targetWeight, targetDate)
                      : null;
                    
                    return weeklyChange 
                      ? <span style={{ color: getWeeklyChangeColor(weeklyChange, 'weight') }}>
                          Weekly change: {weeklyChange > 0 ? '+' + weeklyChange : weeklyChange} kg/week
                        </span>
                      : <span>Current weight unavailable</span>;
                  })()
                : ' '
            }
            sx={{ 
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
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
                ? (() => {
                    const weeklyChange = currentFatPercentage !== null && currentFatPercentage !== undefined
                      ? getWeeklyChange(currentFatPercentage, targetFatPercentage, targetDate)
                      : null;
                    
                    return weeklyChange 
                      ? <span style={{ color: getWeeklyChangeColor(weeklyChange, 'fat') }}>
                          Weekly change: {weeklyChange > 0 ? '+' + weeklyChange : weeklyChange} %/week
                        </span>
                      : <span>Current body fat % unavailable</span>;
                  })()
                : ' '
            }
            sx={{ 
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
              }
            }}
          />
        </Grid>
        
        {targetWeight && targetFatPercentage && (
          <Grid item xs={12}>
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
                      const currentMuscleMass = currentWeight !== null && currentWeight !== undefined && 
                                              currentFatPercentage !== null && currentFatPercentage !== undefined 
                                              ? calculateMuscleMass(currentWeight, currentFatPercentage)
                                              : null;
                      const targetMuscleMass = calculateMuscleMass(targetWeight, targetFatPercentage);
                      
                      if (currentMuscleMass && targetMuscleMass) {
                        const dailyChange = (targetMuscleMass - currentMuscleMass) / differenceInDays(targetDate, new Date());
                        const weeklyChange = parseFloat((dailyChange * 7).toFixed(2));
                        return <span style={{ color: getWeeklyChangeColor(weeklyChange, 'muscle') }}>
                          Weekly change: {weeklyChange > 0 ? '+' + weeklyChange : weeklyChange} kg/week
                        </span>;
                      }
                      return <span>Cannot calculate change - current measurements unavailable</span>;
                    })()
                  : ' '
              }
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                }
              }}
            />
          </Grid>
        )}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 0 }}>
        {editingGoalId && (
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={submitting}
            sx={{
              borderColor: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
              color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark',
                bgcolor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          color="primary"
        >
          {submitting ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Set Goal'}
        </Button>
      </Box>
    </Box>
  );
};

export default GoalForm; 