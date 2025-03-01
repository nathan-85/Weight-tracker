import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { format, differenceInDays } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

import { getEntries, getGoals, getProgress } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Progress = () => {
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (goals.length > 0 && !selectedGoal) {
      setSelectedGoal(goals[0].id);
    }
  }, [goals]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesData, goalsData, progressData] = await Promise.all([
        getEntries(),
        getGoals(),
        getProgress()
      ]);
      
      setEntries(entriesData);
      setGoals(goalsData);
      setProgress(progressData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Prepare projection chart data
  const prepareProjectionData = (metric) => {
    if (!entries.length || !goals.length || !selectedGoal) return null;

    const goal = goals.find(g => g.id === selectedGoal);
    if (!goal) return null;

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestEntry = sortedEntries[sortedEntries.length - 1];
    
    // Get the target metric value
    let currentValue, targetValue;
    
    if (metric === 'weight') {
      currentValue = latestEntry.weight;
      targetValue = goal.target_weight;
    } else if (metric === 'fat') {
      currentValue = latestEntry.fat_percentage;
      targetValue = goal.target_fat_percentage;
    } else if (metric === 'muscle') {
      currentValue = latestEntry.muscle_mass;
      targetValue = goal.target_muscle_mass;
    }
    
    if (!currentValue || !targetValue) return null;
    
    // Calculate days between latest entry and goal
    const daysTotal = differenceInDays(new Date(goal.target_date), new Date(latestEntry.date));
    if (daysTotal <= 0) return null;
    
    // Generate projection data points
    const labels = [];
    const actualData = [];
    const requiredProgressData = [];
    
    // Add the latest entry as the starting point
    labels.push(format(new Date(latestEntry.date), 'MMM d'));
    actualData.push(currentValue);
    requiredProgressData.push(currentValue);
    
    // Add the goal date as the end point
    labels.push(format(new Date(goal.target_date), 'MMM d'));
    actualData.push(null); // We don't have actual data for the future
    requiredProgressData.push(targetValue);
    
    return {
      labels,
      datasets: [
        {
          label: 'Actual Progress',
          data: actualData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          pointRadius: 6,
        },
        {
          label: 'Required Progress',
          data: requiredProgressData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
        },
      ],
    };
  };

  const chartOptions = (title, yAxisLabel) => ({
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}${yAxisLabel}`;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
    },
  });

  // Get the selected goal's progress data
  const getSelectedGoalProgress = () => {
    if (!progress.length || !selectedGoal) return null;
    return progress.find(p => p.goal_id === selectedGoal);
  };

  const selectedProgress = getSelectedGoalProgress();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (entries.length === 0 || goals.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Progress Tracking
        </Typography>
        <Alert severity="info">
          You need at least one entry and one goal to track progress. Please add them first.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Progress Tracking
        </Typography>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Progress Tracking
      </Typography>
      
      {/* Goal Selector */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Goal
          </Typography>
          <Grid container spacing={2}>
            {goals
              .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
              .map((goal) => (
                <Grid item key={goal.id}>
                  <Chip
                    label={`Goal for ${format(new Date(goal.target_date), 'MMM d, yyyy')}`}
                    onClick={() => setSelectedGoal(goal.id)}
                    color={selectedGoal === goal.id ? "primary" : "default"}
                    variant={selectedGoal === goal.id ? "filled" : "outlined"}
                  />
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>
      
      {selectedProgress ? (
        <>
          {/* Progress Summary */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress Summary
              </Typography>
              <Typography variant="body1" gutterBottom>
                Target Date: {format(new Date(selectedProgress.target_date), 'MMMM d, yyyy')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Days Remaining: {selectedProgress.days_remaining}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List>
                {selectedProgress.weight.target && (
                  <ListItem>
                    <ListItemText
                      primary="Weight"
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Current: {selectedProgress.weight.current} kg | Target: {selectedProgress.weight.target} kg
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            You need to {selectedProgress.weight.daily_change_needed > 0 ? 'gain' : 'lose'} {Math.abs(selectedProgress.weight.daily_change_needed).toFixed(2)} kg per day
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            That's {Math.abs(selectedProgress.weight.weekly_change_needed).toFixed(2)} kg per week
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                )}
                
                {selectedProgress.fat_percentage.target && selectedProgress.fat_percentage.current && (
                  <ListItem>
                    <ListItemText
                      primary="Body Fat"
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Current: {selectedProgress.fat_percentage.current.toFixed(1)}% | Target: {selectedProgress.fat_percentage.target.toFixed(1)}%
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            You need to {selectedProgress.fat_percentage.daily_change_needed > 0 ? 'gain' : 'lose'} {Math.abs(selectedProgress.fat_percentage.daily_change_needed).toFixed(2)}% per day
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            That's {Math.abs(selectedProgress.fat_percentage.weekly_change_needed).toFixed(2)}% per week
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                )}
                
                {selectedProgress.muscle_mass.target && selectedProgress.muscle_mass.current && (
                  <ListItem>
                    <ListItemText
                      primary="Muscle Mass"
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Current: {selectedProgress.muscle_mass.current.toFixed(1)} kg | Target: {selectedProgress.muscle_mass.target.toFixed(1)} kg
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            You need to {selectedProgress.muscle_mass.daily_change_needed > 0 ? 'gain' : 'lose'} {Math.abs(selectedProgress.muscle_mass.daily_change_needed).toFixed(2)} kg per day
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            That's {Math.abs(selectedProgress.muscle_mass.weekly_change_needed).toFixed(2)} kg per week
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
          
          {/* Projection Charts */}
          <Box sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Weight" disabled={!selectedProgress.weight.target} />
              <Tab label="Body Fat" disabled={!selectedProgress.fat_percentage.target || !selectedProgress.fat_percentage.current} />
              <Tab label="Muscle Mass" disabled={!selectedProgress.muscle_mass.target || !selectedProgress.muscle_mass.current} />
            </Tabs>
          </Box>
          
          <Card>
            <CardContent>
              {activeTab === 0 && selectedProgress.weight.target && (
                <Box sx={{ height: 400 }}>
                  <Line 
                    options={chartOptions('Weight Projection', 'kg')} 
                    data={prepareProjectionData('weight')} 
                  />
                </Box>
              )}
              
              {activeTab === 1 && selectedProgress.fat_percentage.target && selectedProgress.fat_percentage.current && (
                <Box sx={{ height: 400 }}>
                  <Line 
                    options={chartOptions('Body Fat Projection', '%')} 
                    data={prepareProjectionData('fat')} 
                  />
                </Box>
              )}
              
              {activeTab === 2 && selectedProgress.muscle_mass.target && selectedProgress.muscle_mass.current && (
                <Box sx={{ height: 400 }}>
                  <Line 
                    options={chartOptions('Muscle Mass Projection', 'kg')} 
                    data={prepareProjectionData('muscle')} 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert severity="info">
          No progress data available for the selected goal. Make sure you have at least one entry and one goal with a future date.
        </Alert>
      )}
    </Box>
  );
};

export default Progress; 