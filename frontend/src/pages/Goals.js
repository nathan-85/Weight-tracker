import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Snackbar,
} from '@mui/material';

// Import custom hooks
import { useUsers } from '../hooks/useUsers';
import { useGoals } from '../hooks/useGoals';
import { useMeasurements } from '../hooks/useMeasurements';

// Import components
import UserSelector from '../components/UserSelector';
import GoalForm from '../components/GoalForm';
import GoalTable from '../components/GoalTable';
import GoalGuidelines from '../components/GoalGuidelines';

const Goals = () => {
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  
  // Custom hooks
  const { 
    users, 
    selectedUserId, 
    setSelectedUserId, 
    loading: loadingUsers 
  } = useUsers();
  
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
            ? `Set Goals for ${users.find(user => user.id === selectedUserId)?.name || '...'}`
            : 'Set Goals'
        }
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* User selection */}
      <UserSelector
        users={users}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        loading={loadingUsers}
      />
      
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
      ) : null}
    </Box>
  );
};

export default Goals; 