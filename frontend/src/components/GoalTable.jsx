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
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { calculateMuscleMass } from '../utils/calculations';

const GoalTable = ({ 
  goals, 
  loading, 
  onEdit, 
  onDelete, 
  currentWeight, 
  currentFatPercentage, 
  editingGoalId 
}) => {
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

  return (
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
                          onClick={() => onEdit(goal)}
                          disabled={editingGoalId === goal.id}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => onDelete(goal.id)}
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
  );
};

export default GoalTable; 