import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { getEntries, getGoals, getProgress } from '../services/api';
import { useUserContext } from '../contexts/UserContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale
);

// Format date in Australian format (dd/MM/yyyy)
const formatAustralianDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy');
};

// Format goal name for display
const formatGoalName = (goal) => {
  return goal.description ? 
    `${goal.description} - ${formatAustralianDate(goal.target_date)}` : 
    formatAustralianDate(goal.target_date);
};

const Progress = () => {
  const { currentUser } = useUserContext();
  const [entries, setEntries] = useState([]);
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedProgress, setSelectedProgress] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesData, goalsData, progressData] = await Promise.all([
        getEntries(currentUser?.id),
        getGoals(currentUser?.id),
        getProgress(currentUser?.id)
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
  }, [currentUser?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (goals.length > 0) {
      // Reset selectedGoal whenever goals change or user changes
      // Find the goal with target_date closest to the current date
      const today = new Date();
      const goalWithClosestDate = [...goals].sort((a, b) => {
        const dateA = new Date(a.target_date);
        const dateB = new Date(b.target_date);
        // Calculate absolute difference in days from today
        const diffA = Math.abs(dateA - today);
        const diffB = Math.abs(dateB - today);
        return diffA - diffB; // Sort by closest date to today
      })[0];
      
      setSelectedGoal(goalWithClosestDate.id);
    } else {
      setSelectedGoal('');
    }
  }, [goals, currentUser?.id]);

  useEffect(() => {
    if (progress && selectedGoal) {
      setSelectedProgress(progress.find(p => p.goal_id === selectedGoal));
    } else {
      setSelectedProgress(null);
    }
  }, [progress, selectedGoal]);

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
    
    // Use goal start_date as the starting point for the chart
    const startDate = goal.start_date ? new Date(goal.start_date) : new Date(latestEntry.date);
    
    // Calculate days between start date and goal target date
    const daysTotal = differenceInDays(new Date(goal.target_date), startDate);
    if (daysTotal <= 0) return null;
    
    // Generate projection data points
    const labels = [];
    const actualData = [];
    const requiredProgressData = [];
    
    // Add the start date as the starting point
    labels.push(startDate);
    
    // If start date is latestEntry date, use current value, otherwise use null (no actual data)
    if (format(startDate, 'yyyy-MM-dd') === format(new Date(latestEntry.date), 'yyyy-MM-dd')) {
      actualData.push(currentValue);
    } else {
      actualData.push(null); // No actual data for the start date if it's not the latest entry
    }
    
    // For required progress, we need to calculate what the value should have been at start date
    // by extrapolating backward from target to current, or just use current value if start = latest
    const dailyChangeRequired = (targetValue - currentValue) / differenceInDays(new Date(goal.target_date), new Date(latestEntry.date));
    const daysFromStartToLatest = differenceInDays(new Date(latestEntry.date), startDate);
    const startValue = currentValue - (dailyChangeRequired * daysFromStartToLatest);
    
    requiredProgressData.push(startValue);
    
    // Add latest entry as a point if it's not the start date
    if (format(startDate, 'yyyy-MM-dd') !== format(new Date(latestEntry.date), 'yyyy-MM-dd')) {
      labels.push(new Date(latestEntry.date));
      actualData.push(currentValue);
      
      // Calculate what the value should be at latest entry date based on linear progression from start to target
      const daysFromStartToLatest = differenceInDays(new Date(latestEntry.date), startDate);
      const idealValueAtLatest = startValue + (daysFromStartToLatest / daysTotal) * (targetValue - startValue);
      requiredProgressData.push(idealValueAtLatest);
    }
    
    // Add the goal date as the end point
    labels.push(new Date(goal.target_date));
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

  const chartOptions = (title, unit) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(1) + ' ' + unit;
              }
              return label;
            }
          }
        },
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 12,
            padding: 20,
            font: {
              size: 12
            }
          },
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            
            // Toggle visibility
            const meta = ci.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
            
            // Apply desaturation to deselected datasets
            ci.data.datasets.forEach((dataset, i) => {
              const meta = ci.getDatasetMeta(i);
              
              // Store original colors on first encounter if not already stored
              if (!dataset.originalBorderColor) {
                dataset.originalBorderColor = dataset.borderColor;
              }
              if (!dataset.originalBackgroundColor) {
                dataset.originalBackgroundColor = dataset.backgroundColor;
              }
              
              if (meta.hidden) {
                // Desaturate the color if hidden
                dataset.borderColor = desaturateColor(dataset.originalBorderColor);
                dataset.backgroundColor = desaturateColor(dataset.originalBackgroundColor);
              } else {
                // Restore original color if not hidden
                dataset.borderColor = dataset.originalBorderColor;
                dataset.backgroundColor = dataset.originalBackgroundColor;
              }
            });
            
            ci.update();
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'dd MMM'
            },
            tooltipFormat: 'dd MMM yyyy'
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: unit,
          }
        }
      }
    };
  };

  // Function to desaturate a color (convert to grayscale)
  const desaturateColor = (colorStr) => {
    // Handle rgba format
    if (colorStr.startsWith('rgba')) {
      const matches = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (matches) {
        const [r, g, b, a] = matches;
        // Calculate grayscale value (weighted average for proper luminance)
        const gray = Math.round(0.299 * parseInt(r) + 0.587 * parseInt(g) + 0.114 * parseInt(b));
        return `rgba(${gray}, ${gray}, ${gray}, ${a})`;
      }
    }
    // Handle rgb format
    if (colorStr.startsWith('rgb')) {
      const matches = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (matches) {
        const [r, g, b] = matches;
        // Calculate grayscale value (weighted average for proper luminance)
        const gray = Math.round(0.299 * parseInt(r) + 0.587 * parseInt(g) + 0.114 * parseInt(b));
        return `rgb(${gray}, ${gray}, ${gray})`;
      }
    }
    
    return colorStr; // Return original if not in expected format
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Progress Tracking
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {goals.length === 0 ? (
        <Alert severity="info">
          You need to create a goal before you can track progress.
        </Alert>
      ) : (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="goal-select-label">Select Goal</InputLabel>
          <Select
            labelId="goal-select-label"
            id="goal-select"
            value={selectedGoal}
            label="Select Goal"
            onChange={(e) => setSelectedGoal(e.target.value)}
          >
            {goals.map((goal) => (
              <MenuItem key={goal.id} value={goal.id}>
                {formatGoalName(goal)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {selectedProgress ? (
        <>
          {/* Progress Summary */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress Summary
              </Typography>
              <Typography variant="body1" gutterBottom>
                Target Date: {formatAustralianDate(selectedProgress.target_date)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Days Remaining: {selectedProgress.days_remaining}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                {selectedProgress.weight.target && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Weight
                        </Typography>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          Current: {selectedProgress.weight.current} kg | Target: {selectedProgress.weight.target} kg
                        </Typography>
                        <Typography variant="body2">
                          {selectedProgress.weight.daily_change_needed !== 0 ? 
                            `You need to ${selectedProgress.weight.daily_change_needed > 0 ? 'gain' : 'lose'} ${Math.abs(selectedProgress.weight.daily_change_needed).toFixed(2)} kg per day (${Math.abs(selectedProgress.weight.weekly_change_needed).toFixed(2)} kg per week)` :
                            'You are already at your target weight!'
                          }
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {selectedProgress.fat_percentage.target && selectedProgress.fat_percentage.current && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Body Fat
                        </Typography>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          Current: {selectedProgress.fat_percentage.current.toFixed(1)}% | Target: {selectedProgress.fat_percentage.target.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          {selectedProgress.fat_percentage.daily_change_needed !== 0 ? 
                            `You need to ${selectedProgress.fat_percentage.daily_change_needed > 0 ? 'gain' : 'lose'} ${Math.abs(selectedProgress.fat_percentage.daily_change_needed).toFixed(2)}% per day (${Math.abs(selectedProgress.fat_percentage.weekly_change_needed).toFixed(2)}% per week)` :
                            'You are already at your target body fat percentage!'
                          }
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {selectedProgress.muscle_mass.target && selectedProgress.muscle_mass.current && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Muscle Mass
                        </Typography>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          Current: {selectedProgress.muscle_mass.current.toFixed(1)} kg | Target: {selectedProgress.muscle_mass.target.toFixed(1)} kg
                        </Typography>
                        <Typography variant="body2">
                          {selectedProgress.muscle_mass.daily_change_needed !== 0 ? 
                            `You need to ${selectedProgress.muscle_mass.daily_change_needed > 0 ? 'gain' : 'lose'} ${Math.abs(selectedProgress.muscle_mass.daily_change_needed).toFixed(2)} kg per day (${Math.abs(selectedProgress.muscle_mass.weekly_change_needed).toFixed(2)} kg per week)` :
                            'You are already at your target muscle mass!'
                          }
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          {/* Projection Charts */}
          <Box sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Weight" disabled={!selectedProgress.weight.target} />
              <Tab label="Body Fat" disabled={!selectedProgress.fat_percentage.target || !selectedProgress.fat_percentage.current} />
              <Tab label="Muscle Mass" disabled={!selectedProgress.muscle_mass.target || !selectedProgress.muscle_mass.current} />
              <Tab label="All" disabled={!selectedProgress.weight.target || !selectedProgress.fat_percentage.target || !selectedProgress.muscle_mass.target} />
            </Tabs>
          </Box>
          
          <Card>
            <CardContent>
              {activeTab === 0 && selectedProgress.weight.target && (
                <Box sx={{ height: 400 }}>
                  {(() => {
                    const chartData = prepareProjectionData('weight');
                    return chartData ? (
                      <Line 
                        options={chartOptions('Weight Projection', 'kg')} 
                        data={chartData} 
                      />
                    ) : (
                      <Typography variant="body1" align="center" sx={{ pt: 8 }}>
                        Insufficient data to display chart
                      </Typography>
                    );
                  })()}
                </Box>
              )}
              
              {activeTab === 1 && selectedProgress.fat_percentage.target && selectedProgress.fat_percentage.current && (
                <Box sx={{ height: 400 }}>
                  {(() => {
                    const chartData = prepareProjectionData('fat');
                    return chartData ? (
                      <Line 
                        options={chartOptions('Body Fat Projection', '%')} 
                        data={chartData} 
                      />
                    ) : (
                      <Typography variant="body1" align="center" sx={{ pt: 8 }}>
                        Insufficient data to display chart
                      </Typography>
                    );
                  })()}
                </Box>
              )}
              
              {activeTab === 2 && selectedProgress.muscle_mass.target && selectedProgress.muscle_mass.current && (
                <Box sx={{ height: 400 }}>
                  {(() => {
                    const chartData = prepareProjectionData('muscle');
                    return chartData ? (
                      <Line 
                        options={chartOptions('Muscle Mass Projection', 'kg')} 
                        data={chartData} 
                      />
                    ) : (
                      <Typography variant="body1" align="center" sx={{ pt: 8 }}>
                        Insufficient data to display chart
                      </Typography>
                    );
                  })()}
                </Box>
              )}
              
              {activeTab === 3 && selectedProgress.weight.target && selectedProgress.fat_percentage.target && selectedProgress.muscle_mass.target && (
                <Box sx={{ height: 400 }}>
                  {(() => {
                    const weightData = prepareProjectionData('weight');
                    const fatData = prepareProjectionData('fat');
                    const muscleData = prepareProjectionData('muscle');

                    if (!weightData || !fatData || !muscleData) {
                      return (
                        <Typography variant="body1" align="center" sx={{ pt: 8 }}>
                          Insufficient data to display chart
                        </Typography>
                      );
                    }

                    // We need to create a merged set of labels to accommodate all data points
                    const allLabels = [...new Set([
                      ...weightData.labels.map(date => date.toISOString()),
                      ...fatData.labels.map(date => date.toISOString()),
                      ...muscleData.labels.map(date => date.toISOString())
                    ])].sort().map(dateStr => new Date(dateStr));
                    
                    // Helper function to map original data to new label indices
                    const mapDataToLabels = (sourceLabels, sourceData, targetLabels) => {
                      const result = Array(targetLabels.length).fill(null);
                      
                      for (let i = 0; i < sourceLabels.length; i++) {
                        // Find matching date by comparing ISO string formats
                        const sourceDate = sourceLabels[i].toISOString();
                        const targetIndex = targetLabels.findIndex(date => 
                          date.toISOString() === sourceDate
                        );
                        
                        if (targetIndex !== -1) {
                          result[targetIndex] = sourceData[i];
                        }
                      }
                      
                      return result;
                    };
                    
                    const combinedData = {
                      labels: allLabels,
                      datasets: [
                        {
                          label: 'Weight (kg)',
                          data: mapDataToLabels(weightData.labels, weightData.datasets[0].data, allLabels),
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.5)',
                          pointRadius: 6,
                          yAxisID: 'y1',
                        },
                        {
                          label: 'Weight Target',
                          data: mapDataToLabels(weightData.labels, weightData.datasets[1].data, allLabels),
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.5)',
                          borderDash: [5, 5],
                          yAxisID: 'y1',
                        },
                        {
                          label: 'Body Fat (%)',
                          data: mapDataToLabels(fatData.labels, fatData.datasets[0].data, allLabels),
                          borderColor: 'rgb(255, 99, 132)',
                          backgroundColor: 'rgba(255, 99, 132, 0.5)',
                          pointRadius: 6,
                          yAxisID: 'y2',
                        },
                        {
                          label: 'Body Fat Target',
                          data: mapDataToLabels(fatData.labels, fatData.datasets[1].data, allLabels),
                          borderColor: 'rgb(255, 99, 132)',
                          backgroundColor: 'rgba(255, 99, 132, 0.5)',
                          borderDash: [5, 5],
                          yAxisID: 'y2',
                        },
                        {
                          label: 'Muscle Mass (kg)',
                          data: mapDataToLabels(muscleData.labels, muscleData.datasets[0].data, allLabels),
                          borderColor: 'rgb(54, 162, 235)',
                          backgroundColor: 'rgba(54, 162, 235, 0.5)',
                          pointRadius: 6,
                          yAxisID: 'y3',
                        },
                        {
                          label: 'Muscle Mass Target',
                          data: mapDataToLabels(muscleData.labels, muscleData.datasets[1].data, allLabels),
                          borderColor: 'rgb(54, 162, 235)',
                          backgroundColor: 'rgba(54, 162, 235, 0.5)',
                          borderDash: [5, 5],
                          yAxisID: 'y3',
                        },
                      ],
                    };

                    const combinedOptions = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'All Metrics Projection',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(1);
                              }
                              return label;
                            }
                          }
                        },
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            boxWidth: 12,
                            padding: 20,
                            font: {
                              size: 12
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                          },
                          onClick: function(e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const ci = legend.chart;
                            
                            // Toggle visibility
                            const meta = ci.getDatasetMeta(index);
                            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                            
                            // Apply desaturation to deselected datasets
                            ci.data.datasets.forEach((dataset, i) => {
                              const meta = ci.getDatasetMeta(i);
                              
                              // Store original colors on first encounter if not already stored
                              if (!dataset.originalBorderColor) {
                                dataset.originalBorderColor = dataset.borderColor;
                              }
                              if (!dataset.originalBackgroundColor) {
                                dataset.originalBackgroundColor = dataset.backgroundColor;
                              }
                              
                              if (meta.hidden) {
                                // Desaturate the color if hidden
                                dataset.borderColor = desaturateColor(dataset.originalBorderColor);
                                dataset.backgroundColor = desaturateColor(dataset.originalBackgroundColor);
                              } else {
                                // Restore original color if not hidden
                                dataset.borderColor = dataset.originalBorderColor;
                                dataset.backgroundColor = dataset.originalBackgroundColor;
                              }
                            });
                            
                            ci.update();
                          }
                        }
                      },
                      scales: {
                        x: {
                          type: 'time',
                          time: {
                            unit: 'day',
                            displayFormats: {
                              day: 'dd MMM'
                            },
                            tooltipFormat: 'dd MMM yyyy'
                          },
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                            display: true,
                            text: 'Weight (kg)',
                          },
                        },
                        y2: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: 'Body Fat (%)',
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                        y3: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: 'Muscle Mass (kg)',
                          },
                        },
                      },
                    };

                    return <Line options={combinedOptions} data={combinedData} />;
                  })()}
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