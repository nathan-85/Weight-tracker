import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Snackbar,
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

  const handleSubmit = (goalId, goalData) => {
    if (goalId) {
      return updateGoal(goalId, goalData);
    } else {
      return addGoal(goalData);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setEditingGoal(goal);
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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {editingGoalId 
          ? 'Edit Goal' 
          : selectedUserId 
            ? `Set Goals for ${currentUser?.name || '...'}`
            : 'Set Goals'
        }
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {selectedUserId ? (
        <>
          <GoalForm 
            onSubmit={handleSubmit}
            submitting={submitting}
            editingGoalId={editingGoalId}
            editingGoal={editingGoal}
            onCancelEdit={handleCancelEdit}
            currentWeight={currentWeight}
            currentFatPercentage={currentFatPercentage}
            selectedUserId={selectedUserId}
          />
          
          <Typography variant="h5" gutterBottom>
            Your Goals
          </Typography>
          
          <GoalTable 
            goals={goals}
            loading={loadingGoals}
            onEdit={handleEditGoal}
            onDelete={handleDeleteGoal}
            currentWeight={currentWeight}
            currentFatPercentage={currentFatPercentage}
            editingGoalId={editingGoalId}
          />
          
          <GoalGuidelines />
          
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
      ) : (
        <Alert severity="info">
          Please select a user profile from the top menu to set goals.
        </Alert>
      )}
    </Box>
  );
};

export default Goals; 