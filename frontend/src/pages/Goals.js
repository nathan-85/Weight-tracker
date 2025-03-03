import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Snackbar,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
  Drawer
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get current user from context
  const { currentUser } = useUserContext();
  const selectedUserId = currentUser?.id;
  
  // Custom hooks
  const {
    goals,
    loading: loadingGoals,
    submitting,
    error: goalsError,
    success,
    successMessage,
    addGoal,
    updateGoal,
    deleteGoal,
    clearSuccess
  } = useGoals(selectedUserId);
  
  const {
    currentWeight,
    currentFatPercentage,
    loading: loadingMeasurements,
    error: measurementsError
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
    <Box 
      sx={{ 
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
      }}
    >
      <Box 
        sx={{ 
          p: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Weight Goals
        </Typography>
      </Box>

      {goalsError && (
        <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
          {goalsError}
        </Alert>
      )}
      
      {measurementsError && (
        <Alert severity="warning" sx={{ mx: 3, mt: 2 }}>
          {measurementsError}
        </Alert>
      )}

      {currentWeight === null && !loadingMeasurements && (
        <Alert severity="info" sx={{ mx: 3, mt: 2 }}>
          No recent measurements found. Add a new entry with your current measurements to see progress calculations.
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden',
        p: 3,
        gap: 3
      }}>
        <Box
          sx={{
            width: isMobile ? '100%' : '400px',
            flexShrink: 0
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%',
              overflow: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
            }}
          >
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
          </Paper>
        </Box>

        {!isMobile && (
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper 
              elevation={3} 
              sx={{ 
                flex: 1,
                overflow: 'auto',
                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
              }}
            >
              <GoalTable 
                goals={goals}
                loading={loadingGoals}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                editingGoalId={editingGoalId}
                currentWeight={currentWeight}
                currentFatPercentage={currentFatPercentage}
              />
            </Paper>

            <Paper
              elevation={3}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
              }}
            >
              <GoalGuidelines />
            </Paper>
          </Box>
        )}

        {isMobile && (
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper
              elevation={3}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
              }}
            >
              <GoalTable 
                goals={goals}
                loading={loadingGoals}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                editingGoalId={editingGoalId}
                currentWeight={currentWeight}
                currentFatPercentage={currentFatPercentage}
              />
            </Paper>

            <Paper
              elevation={3}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff'
              }}
            >
              <GoalGuidelines />
            </Paper>
          </Box>
        )}
      </Box>

      <Drawer
        anchor="right"
        open={guidelinesOpen}
        onClose={() => setGuidelinesOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 400,
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => setGuidelinesOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <GoalGuidelines />
      </Drawer>

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