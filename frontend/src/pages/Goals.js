import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';

// Import custom hooks
import { useGoals } from '../hooks/useGoals';
import { useMeasurements } from '../hooks/useMeasurements';
import { useUserContext } from '../contexts/UserContext';

// Import components
import GoalForm from '../components/GoalForm';
import GoalTable from '../components/GoalTable';
import GoalGuidelines from '../components/GoalGuidelines';

const Goals = () => {
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  
  // Get current user from context
  const { currentUser } = useUserContext();
  const selectedUserId = currentUser?.id;
  
  // Custom hooks
  const {
    goals,
    loading: loadingGoals,
    submitting,
    error,
    success,
    successMessage,
    addGoal,
    updateGoal,
    deleteGoal,
    clearSuccess
  } = useGoals(selectedUserId);
  
  const {
    currentWeight,
    currentFatPercentage
  } = useMeasurements(selectedUserId);

  const handleSubmit = async (goalId, goalData) => {
    if (goalId) {
      const success = await updateGoal(goalId, goalData);
      if (success) {
        // Reset editing state after successful update
        setEditingGoalId(null);
        setEditingGoal(null);
      }
      return success;
    } else {
      return await addGoal(goalData);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setEditingGoal({
      target_date: goal.target_date,
      target_weight: goal.target_weight,
      target_fat_percentage: goal.target_fat_percentage,
      target_muscle_mass: goal.target_muscle_mass,
      description: goal.description,
      user_id: goal.user_id
    });
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (id) => {
    await deleteGoal(id);
  };

  const handleCloseSnackbar = () => {
    clearSuccess();
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Weight Goals
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <GoalForm 
            onSubmit={handleSubmit}
            editingGoalId={editingGoalId}
            editingGoal={editingGoal}
            onCancelEdit={handleCancelEdit}
            submitting={submitting}
            currentWeight={currentWeight}
            currentFatPercentage={currentFatPercentage}
            selectedUserId={selectedUserId}
          />
          
          <GoalGuidelines />
          
          <GoalTable 
            goals={goals}
            loading={loadingGoals}
            onEdit={handleEditGoal}
            onDelete={handleDeleteGoal}
            editingGoalId={editingGoalId}
            currentWeight={currentWeight}
            currentFatPercentage={currentFatPercentage}
          />
        </Grid>
      </Grid>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Goals; 