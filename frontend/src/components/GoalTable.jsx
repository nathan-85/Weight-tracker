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
  Typography
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

  // Helper function to display change data
  const showChange = (change, unit) => {
    if (!change) return null;
    
    return (
      <Typography 
        variant="caption" 
        display="block" 
        color={change > 0 ? "success.main" : "error.main"}
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
              
              if (currentWeight && goal.target_weight) {
                const difference = goal.target_weight - currentWeight;
                const weeks = Math.max(daysRemaining / 7, 1);
                weightChange = (difference / weeks).toFixed(1);
              }
              
              if (currentFatPercentage && goal.target_fat_percentage) {
                const difference = goal.target_fat_percentage - currentFatPercentage;
                const weeks = Math.max(daysRemaining / 7, 1);
                fatChange = (difference / weeks).toFixed(1);
              }
              
              // Calculate muscle change
              if (currentWeight && currentFatPercentage && goal.target_muscle_mass) {
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