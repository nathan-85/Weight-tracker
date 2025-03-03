import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Typography,
  useTheme
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { calculateMuscleMass, GOAL_THRESHOLDS } from '../utils/calculations';

// Define realistic weekly change guidelines - same as in GoalForm to keep consistency
const REALISTIC_WEEKLY_CHANGES = {
  weight: { min: -1, max: -0.5 }, // 0.5-1 kg loss per week is healthy
  fat: { min: -0.25, max: -0.125 }, // 0.5-1% per month = 0.125-0.25% per week
  muscle: { min: 0.06, max: 0.375 } // 0.25-1.5 kg per month = 0.06-0.375 per week
};

const GoalTable = ({ 
  goals, 
  loading, 
  onEdit, 
  onDelete, 
  currentWeight, 
  currentFatPercentage, 
  editingGoalId 
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (goals.length === 0) {
    return (
      <Alert severity="info">
        You haven't set any goals yet. Use the form above to set your first goal.
      </Alert>
    );
  }

  // Helper function to determine color based on change value and type
  const getChangeColor = (value, type) => {
    if (!value) return theme.palette.text.secondary;
    
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

  // Helper function to display change data
  const showChange = (change, unit) => {
    if (!change) return null;
    
    // Determine the type based on unit and cell context
    let type;
    if (unit === 'kg') {
      // For kg, we need to know if it's weight or muscle
      // In the context of this app, negative kg changes are weight loss, positive muscle changes
      type = parseFloat(change) < 0 ? 'weight' : 'muscle';
    } else if (unit === '%') {
      type = 'fat';
    }
    
    return (
      <Typography 
        variant="caption" 
        display="block" 
        style={{ color: getChangeColor(parseFloat(change), type) }}
      >
        {change > 0 ? "+" : ""}{change}/{unit} per week
      </Typography>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Target Date</TableCell>
            <TableCell align="right">Target Weight (kg)</TableCell>
            <TableCell align="right">Target Body Fat (%)</TableCell>
            <TableCell align="right">Target Muscle Mass (kg)</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...goals]
            .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
            .map((goal) => {
              const daysRemaining = differenceInDays(new Date(goal.target_date), new Date());
              
              // Calculate required weekly changes
              let weightChange = null;
              let fatChange = null;
              let muscleChange = null;
              
              if (currentWeight !== null && currentWeight !== undefined && goal.target_weight) {
                const difference = goal.target_weight - currentWeight;
                const weeks = Math.max(daysRemaining / 7, 1);
                weightChange = (difference / weeks).toFixed(1);
              }
              
              if (currentFatPercentage !== null && currentFatPercentage !== undefined && goal.target_fat_percentage) {
                const difference = goal.target_fat_percentage - currentFatPercentage;
                const weeks = Math.max(daysRemaining / 7, 1);
                fatChange = (difference / weeks).toFixed(1);
              }
              
              // Calculate muscle change
              if (currentWeight !== null && currentWeight !== undefined && 
                  currentFatPercentage !== null && currentFatPercentage !== undefined && 
                  goal.target_muscle_mass) {
                const currentMuscleMass = calculateMuscleMass(currentWeight, currentFatPercentage);
                if (currentMuscleMass) {
                  const difference = goal.target_muscle_mass - currentMuscleMass;
                  const weeks = Math.max(daysRemaining / 7, 1);
                  muscleChange = (difference / weeks).toFixed(1);
                }
              }
              
              return (
                <TableRow key={goal.id} hover selected={editingGoalId === goal.id}>
                  <TableCell>
                    {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    {daysRemaining > 0 && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {daysRemaining} days remaining
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell align="right">
                    {goal.target_weight ? (
                      <>
                        {goal.target_weight.toFixed(1)}
                        {showChange(weightChange, 'kg')}
                      </>
                    ) : 'N/A'}
                  </TableCell>
                  
                  <TableCell align="right">
                    {goal.target_fat_percentage ? (
                      <>
                        {goal.target_fat_percentage.toFixed(1)}%
                        {showChange(fatChange, '%')}
                      </>
                    ) : 'N/A'}
                  </TableCell>
                  
                  <TableCell align="right">
                    {goal.target_muscle_mass ? (
                      <>
                        {goal.target_muscle_mass.toFixed(1)}
                        {showChange(muscleChange, 'kg')}
                      </>
                    ) : 'N/A'}
                  </TableCell>

                  <TableCell>
                    {goal.description || ''}
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton 
                          onClick={() => onEdit(goal)} 
                          size="small"
                          disabled={editingGoalId === goal.id}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          onClick={() => onDelete(goal.id)} 
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
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
  );
};

export default GoalTable; 