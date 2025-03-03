import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Alert,
  Snackbar,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  Container
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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
      }}
    >
      <Box 
        sx={{ 
          p: 2,
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
        <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
          {goalsError}
        </Alert>
      )}
      
      {measurementsError && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1 }}>
          {measurementsError}
        </Alert>
      )}

      {currentWeight === null && !loadingMeasurements && (
        <Alert severity="info" sx={{ mx: 2, mt: 1 }}>
          No recent measurements found. Add a new entry with your current measurements to see progress calculations.
        </Alert>
      )}

      {/* Main content with form and goal table */}
      <Container 
        maxWidth={false}
        disableGutters
        sx={{ 
          px: 1,
          py: 1,
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1 
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          mb: 2
        }}>
          {/* Goal Form */}
          <Box
            sx={{
              width: isMobile ? '100%' : '380px',
              flexShrink: 5
            }}
          >
            <Paper 
              elevation={2}
              sx={{ 
                p: 0,
                pt: 0,
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

          {/* Goal Table */}
          <Box sx={{ 
            flex: 1, 
            width: '100%'
          }}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 2.5,
                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff',
                height: '100%',
                minHeight: '250px',
                display: 'flex',
                flexDirection: 'column'
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
          </Box>
        </Box>

        {/* Guidelines (outside scrollable area) */}
        <Paper
          elevation={2}
          sx={{
            p: 0,
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fff',
            mt: 0
          }}
        >
          <GoalGuidelines />
        </Paper>
      </Container>

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
        <Box sx={{ p: 0, display: 'flex', justifyContent: 'flex-end' }}>
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