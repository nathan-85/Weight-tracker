import { useState, useEffect } from 'react';
import { getGoals, addGoal, deleteGoal, updateGoal } from '../services/api';

export const useGoals = (selectedUserId) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchGoals = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await getGoals(userId);
      setGoals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load goals. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchGoals(selectedUserId);
    }
  }, [selectedUserId]);

  const handleAddGoal = async (goalData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      await addGoal(goalData);
      setSuccessMessage('Goal added successfully!');
      setSuccess(true);
      await fetchGoals(goalData.user_id);
      
      return true;
    } catch (err) {
      setError('Failed to add goal. Please try again.');
      console.error(err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async (goalId, goalData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      await updateGoal(goalId, goalData);
      setSuccessMessage('Goal updated successfully!');
      setSuccess(true);
      await fetchGoals(goalData.user_id);
      
      return true;
    } catch (err) {
      setError('Failed to update goal. Please try again.');
      console.error(err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(id);
      setGoals(goals.filter(goal => goal.id !== id));
      setSuccessMessage('Goal deleted successfully!');
      setSuccess(true);
      return true;
    } catch (err) {
      setError('Failed to delete goal. Please try again.');
      console.error(err);
      return false;
    }
  };

  const clearSuccess = () => setSuccess(false);

  return {
    goals,
    loading,
    submitting,
    error,
    success,
    successMessage,
    addGoal: handleAddGoal,
    updateGoal: handleUpdateGoal,
    deleteGoal: handleDeleteGoal,
    clearSuccess
  };
}; 