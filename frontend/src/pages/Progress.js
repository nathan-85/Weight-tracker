import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  MenuItem,
  useTheme
} from '@mui/material';
import { format, differenceInDays, eachDayOfInterval } from 'date-fns';
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

// JS implementation of the backend's infer_belly_circumference logic
const inferBellyCircumferenceJS = (fatPercentage, neck, height, gender, hip) => {
  if (!fatPercentage || !neck || !height || !gender) {
    // console.warn("Missing required inputs for inferBellyCircumferenceJS.");
    return null;
  }

  // Convert measurements from cm to inches
  const neckInches = neck / 2.54;
  const heightInches = height / 2.54;
  let bellyInches;

  try {
    if (gender.toLowerCase() === 'male') {
      // Reverse male formula: body_fat = 86.010 * log10(belly - neck) - 70.041 * log10(height) + 36.76
      const logArg = (fatPercentage - 36.76 + 70.041 * Math.log10(heightInches)) / 86.010;
      const bellyMinusNeck = 10 ** logArg;
      bellyInches = bellyMinusNeck + neckInches;
    } else { // female
      if (!hip) {
        // console.warn("Hip measurement missing for female belly inference. Using simplified formula.");
        // Reverse simplified female formula: body_fat = 163.205 * log10(belly - neck) - 97.684 * log10(height) - 78.387
        const logArg = (fatPercentage + 78.387 + 97.684 * Math.log10(heightInches)) / 163.205;
        const bellyMinusNeck = 10 ** logArg;
        bellyInches = bellyMinusNeck + neckInches;
      } else {
        const hipInches = hip / 2.54;
        // Reverse full female formula: body_fat = 163.205 * log10(belly + hip - neck) - 97.684 * log10(height) - 104.912
        const logArg = (fatPercentage + 104.912 + 97.684 * Math.log10(heightInches)) / 163.205;
        const bellyPlusHipMinusNeck = 10 ** logArg;
        bellyInches = bellyPlusHipMinusNeck + neckInches - hipInches;
      }
    }

    // Convert back to cm
    const bellyCm = bellyInches * 2.54;

    // Basic sanity check
    if (isNaN(bellyCm) || !isFinite(bellyCm) || bellyCm < neck || bellyCm > 250) {
    //   console.warn(`Inferred belly circumference (${bellyCm}) seems unrealistic or invalid.`);
      return null;
    }

    return parseFloat(bellyCm.toFixed(1)); // Return as number with 1 decimal place

  } catch (e) {
    // console.error("Error calculating inferred belly circumference:", e);
    return null;
  }
};

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

// Utility Functions
const formatAustralianDate = (dateString) => format(new Date(dateString), 'dd/MM/yyyy');

const formatGoalName = (goal) => 
  goal.description ? `${goal.description} - ${formatAustralianDate(goal.target_date)}` : formatAustralianDate(goal.target_date);

const desaturateColor = (colorStr) => {
  if (colorStr.startsWith('rgba')) {
    const matches = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (matches) {
      const [, r, g, b, a] = matches;
      const gray = Math.round(0.299 * parseInt(r) + 0.587 * parseInt(g) + 0.114 * parseInt(b));
      return `rgba(${gray}, ${gray}, ${gray}, ${a})`;
    }
  }
  if (colorStr.startsWith('rgb')) {
    const matches = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (matches) {
      const [, r, g, b] = matches;
      const gray = Math.round(0.299 * parseInt(r) + 0.587 * parseInt(g) + 0.114 * parseInt(b));
      return `rgb(${gray}, ${gray}, ${gray})`;
    }
  }
  return colorStr;
};

// Sub-Components
const GoalSelector = ({ goals, selectedGoal, onSelect }) => (
  <FormControl fullWidth sx={{ mb: 3 }}>
    <InputLabel id="goal-select-label">Select Goal</InputLabel>
    <Select
      labelId="goal-select-label"
      id="goal-select"
      value={selectedGoal}
      label="Select Goal"
      onChange={(e) => onSelect(e.target.value)}
    >
      {goals.map((goal) => (
        <MenuItem key={goal.id} value={goal.id}>
          {formatGoalName(goal)}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const MetricProgress = ({ metric, data }) => {
  const labels = { weight: 'Weight', fat: 'Body Fat', muscle: 'Muscle Mass' };
  const units = { weight: 'kg', fat: '%', muscle: 'kg' };
  const label = labels[metric];
  const unit = units[metric];
  
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{label}</Typography>
          <Typography variant="body2" color="text.primary" gutterBottom>
            Current: {data.current.toFixed(1)} {unit} 
            {metric === 'fat' && data.current_inferred_belly && ` (${data.current_inferred_belly.toFixed(0)} cm)`}
             | Target: {data.target.toFixed(1)} {unit}
            {metric === 'fat' && data.target_inferred_belly && ` (${data.target_inferred_belly.toFixed(0)} cm)`}
          </Typography>
          <Typography variant="body2">
            {data.daily_change_needed !== 0 ? 
              `You need to ${data.daily_change_needed > 0 ? 'gain' : 'lose'} ${Math.abs(data.daily_change_needed).toFixed(2)} ${unit} per day (${Math.abs(data.weekly_change_needed).toFixed(2)} ${unit} per week)` :
              `You are already at your target ${label.toLowerCase()}!`
            }
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};

const ProgressSummary = ({ progress }) => (
  <Card sx={{ mb: 4 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>Progress Summary</Typography>
      <Typography variant="body1" gutterBottom>Target Date: {formatAustralianDate(progress.target_date)}</Typography>
      <Typography variant="body1" gutterBottom>Days Remaining: {progress.days_remaining}</Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        {progress.weight.target && <MetricProgress metric="weight" data={progress.weight} />}
        {progress.fat_percentage.target && progress.fat_percentage.current && <MetricProgress metric="fat" data={progress.fat_percentage} />}
        {progress.muscle_mass.target && progress.muscle_mass.current && <MetricProgress metric="muscle" data={progress.muscle_mass} />}
      </Grid>
    </CardContent>
  </Card>
);

// Chart Data Preparation
const prepareProjectionData = (metric, entries, goals, selectedGoal) => {
  if (!entries.length || !goals.length || !selectedGoal) return null;

  const goal = goals.find((g) => g.id === selectedGoal);
  if (!goal) return null;

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const startDate = goal.start_date ? new Date(goal.start_date) : new Date(latestEntry.date);
  const targetDate = new Date(goal.target_date);
  const relevantEntries = sortedEntries.filter(
    (entry) =>
      new Date(entry.date) >= startDate && new Date(entry.date) <= new Date(latestEntry.date)
  );

  if (relevantEntries.length === 0) return null;

  const metricMap = {
    weight: (entry) => entry.weight,
    fat: (entry) => entry.fat_percentage,
    muscle: (entry) => entry.muscle_mass,
  };
  const getMetricValue = metricMap[metric];
  if (!getMetricValue) return null;

  const targetKeyMap = {
    weight: 'target_weight',
    fat: 'target_fat_percentage',
    muscle: 'target_muscle_mass',
  };
  const targetKey = targetKeyMap[metric];
  if (!targetKey) return null;
  const targetValue = goal[targetKey];
  if (targetValue == null) return null;

  const earliestEntry = relevantEntries[0];
  const startValue = getMetricValue(earliestEntry);

  // Generate daily points for Required Progress
  const requiredDates = eachDayOfInterval({ start: startDate, end: targetDate });
  const requiredData = requiredDates.map((date) => {
    const daysFromStart = differenceInDays(date, startDate);
    const totalDays = differenceInDays(targetDate, startDate);
    const ratio = totalDays > 0 ? daysFromStart / totalDays : 0;
    const y = startValue + ratio * (targetValue - startValue);
    return { x: date, y };
  });

  return {
    datasets: [
      {
        label: 'Actual Progress',
        data: relevantEntries.map((entry) => ({
          x: new Date(entry.date),
          y: getMetricValue(entry),
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        pointRadius: 6,
      },
      {
        label: 'Required Progress',
        data: requiredData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderDash: [5, 5],
        pointRadius: 0, // Hide points, show only the line
      },
    ],
  };
};

const prepareAllProjectionData = (entries, goals, selectedGoal) => {
  if (!entries.length || !goals.length || !selectedGoal) return null;

  const goal = goals.find(g => g.id === selectedGoal);
  if (!goal) return null;

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const startDate = goal.start_date ? new Date(goal.start_date) : new Date(latestEntry.date);
  const targetDate = new Date(goal.target_date);
  const relevantEntries = sortedEntries.filter(entry => new Date(entry.date) >= startDate && new Date(entry.date) <= new Date(latestEntry.date));
  
  if (relevantEntries.length === 0) return null;
  
  const earliestEntry = relevantEntries[0];

  const metrics = [
    { key: 'weight', label: 'Weight (kg)', color: 'rgb(75, 192, 192)', yAxisID: 'y1' },
    { key: 'fat_percentage', label: 'Body Fat (%)', color: 'rgb(255, 99, 132)', yAxisID: 'y2' },
    { key: 'muscle_mass', label: 'Muscle Mass (kg)', color: 'rgb(54, 162, 235)', yAxisID: 'y3' },
  ];

  const datasets = [];
  metrics.forEach(metric => {
    const targetValue = goal[`target_${metric.key}`];
    if (targetValue == null) return;

    const startValue = earliestEntry[metric.key];
    if (startValue == null) return;

    datasets.push({
      label: metric.label,
      data: relevantEntries.map(entry => ({ x: new Date(entry.date), y: entry[metric.key] })),
      borderColor: metric.color,
      backgroundColor: metric.color.replace('rgb', 'rgba').replace(')', ', 0.5)'),
      pointRadius: 6,
      yAxisID: metric.yAxisID,
    });

    datasets.push({
      label: `${metric.label} Target`,
      data: [
        { x: startDate, y: startValue },
        { x: targetDate, y: targetValue },
      ],
      borderColor: metric.color,
      backgroundColor: metric.color.replace('rgb', 'rgba').replace(')', ', 0.5)'),
      borderDash: [5, 5],
      yAxisID: metric.yAxisID,
    });
  });

  return { datasets };
};

// Chart Components
const ProjectionChart = ({ metric, entries, goals, selectedGoal, selectedProgress, currentUser, latestEntry }) => {
  const theme = useTheme();
  const chartData = useMemo(
    () => prepareProjectionData(metric, entries, goals, selectedGoal),
    [metric, entries, goals, selectedGoal]
  );
  const unit = metric === 'fat' ? '%' : 'kg';
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'x',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Projection`,
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y;
              const unit = metric === 'fat' ? '%' : 'kg';
              let displayValue = `${datasetLabel}: ${value.toFixed(1)} ${unit}`;

              // Check if it's the fat metric and necessary data for inference is available
              if (metric === 'fat' && currentUser && latestEntry?.neck && currentUser.height && currentUser.sex) {
                const inferredBelly = inferBellyCircumferenceJS(
                  value, // Use the specific point's fat % value
                  latestEntry.neck,
                  currentUser.height,
                  currentUser.sex,
                  latestEntry.hip // Pass hip, will be null if not applicable/entered
                );

                if (inferredBelly !== null) {
                  displayValue += ` (${inferredBelly.toFixed(1)} cm)`;
                }
              }
              return displayValue;
            },
          },
        },
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 12,
            padding: 20,
            font: { size: 12 },
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const meta = ci.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

            ci.data.datasets.forEach((dataset, i) => {
              const meta = ci.getDatasetMeta(i);
              dataset.originalBorderColor = dataset.originalBorderColor || dataset.borderColor;
              dataset.originalBackgroundColor =
                dataset.originalBackgroundColor || dataset.backgroundColor;
              dataset.borderColor = meta.hidden
                ? desaturateColor(dataset.originalBorderColor)
                : dataset.originalBorderColor;
              dataset.backgroundColor = meta.hidden
                ? desaturateColor(dataset.originalBackgroundColor)
                : dataset.originalBackgroundColor;
            });

            ci.update();
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', displayFormats: { day: 'dd MMM' }, tooltipFormat: 'dd MMM yyyy' },
          title: {
            display: true,
            text: 'Date',
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
        },
        y: {
          title: {
            display: true,
            text: unit,
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
          grid: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
        },
      },
    }),
    [metric, unit, theme, currentUser, latestEntry]
  );

  return chartData ? (
    <Box sx={{ height: 400 }}>
      <Line options={options} data={chartData} />
    </Box>
  ) : (
    <Typography variant="body1" align="center" sx={{ pt: 8 }}>
      Insufficient data to display chart
    </Typography>
  );
};

const AllMetricsChart = ({ entries, goals, selectedGoal, selectedProgress, currentUser, latestEntry }) => {
  const theme = useTheme();
  const chartData = useMemo(() => prepareAllProjectionData(entries, goals, selectedGoal), [entries, goals, selectedGoal]);
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'All Metrics Projection', color: theme.palette.mode === 'dark' ? '#fff' : '#000' },
      tooltip: {
        callbacks: {
          label: context => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            let label = `${datasetLabel}: ${value?.toFixed(1)}`; // Initial label without unit

            // Determine unit and check if dataset is fat-related
            let isFatMetric = false;
            let unit = '';
            if (datasetLabel.includes('Weight')) { unit = 'kg'; }
            else if (datasetLabel.includes('Body Fat')) { unit = '%'; isFatMetric = true; }
            else if (datasetLabel.includes('Muscle Mass')) { unit = 'kg'; }

            if(unit) { label += ` ${unit}`; } // Add unit if determined

            // Check if it's a fat metric and necessary data for inference is available
            if (isFatMetric && currentUser && latestEntry?.neck && currentUser.height && currentUser.sex) {
               const inferredBelly = inferBellyCircumferenceJS(
                  value, // Use the specific point's fat % value
                  latestEntry.neck,
                  currentUser.height,
                  currentUser.sex,
                  latestEntry.hip // Pass hip, will be null if not applicable/entered
                );

               if (inferredBelly !== null) {
                  label += ` (${inferredBelly.toFixed(1)} cm)`;
               }
            }
            return label;
          },
        },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 20,
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          filter: (legendItem) => !legendItem.text.includes('Target'),
        },
        onClick: (e, legendItem, legend) => {
          const ci = legend.chart;
          const index = legendItem.datasetIndex;
          const clickedLabel = legendItem.text; // e.g., "Weight (kg)"

          // Find the index of the corresponding "Target" dataset
          const targetDatasetIndex = ci.data.datasets.findIndex(
            dataset => dataset.label === `${clickedLabel} Target`
          );

          // Toggle visibility for both datasets
          const meta = ci.getDatasetMeta(index);
          const newHidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null; // Determine new hidden state
          meta.hidden = newHidden;

          if (targetDatasetIndex !== -1) {
            const targetMeta = ci.getDatasetMeta(targetDatasetIndex);
            targetMeta.hidden = newHidden; // Apply the same hidden state
          }

          // Update styles for all datasets based on their hidden state
          ci.data.datasets.forEach((dataset, i) => {
            const meta = ci.getDatasetMeta(i);
            dataset.originalBorderColor = dataset.originalBorderColor || dataset.borderColor;
            dataset.originalBackgroundColor = dataset.originalBackgroundColor || dataset.backgroundColor;
            dataset.borderColor = meta.hidden ? desaturateColor(dataset.originalBorderColor) : dataset.originalBorderColor;
            dataset.backgroundColor = meta.hidden ? desaturateColor(dataset.originalBackgroundColor) : dataset.originalBackgroundColor;
          });

          ci.update();
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'day', displayFormats: { day: 'dd MMM' }, tooltipFormat: 'dd MMM yyyy' },
        title: { display: true, text: 'Date', color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
        grid: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
      },
      y1: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Weight (kg)', color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
        grid: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
      },
      y2: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Body Fat (%)', color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
        grid: { drawOnChartArea: false, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
      },
      y3: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Muscle Mass (kg)', color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
        grid: { drawOnChartArea: false, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        ticks: { color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
      },
    },
  }), [theme, currentUser, latestEntry]);

  return chartData ? (
    <Box sx={{ height: 400 }}>
      <Line options={options} data={chartData} />
    </Box>
  ) : (
    <Typography variant="body1" align="center" sx={{ pt: 8 }}>Insufficient data to display chart</Typography>
  );
};

// Main Component
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
        getProgress(currentUser?.id),
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
      const today = new Date();
      const goalWithClosestDate = [...goals].sort((a, b) => 
        Math.abs(new Date(a.target_date) - today) - Math.abs(new Date(b.target_date) - today)
      )[0];
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

  // Derive latest entry for measurement inference
  const latestEntry = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    // Sort by date descending to get the latest
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [entries]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Progress Tracking</Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {goals.length === 0 ? (
        <Alert severity="info">You need to create a goal before you can track progress.</Alert>
      ) : (
        <>
          <GoalSelector goals={goals} selectedGoal={selectedGoal} onSelect={setSelectedGoal} />
          {selectedProgress ? (
            <>
              <ProgressSummary progress={selectedProgress} />
              <Box sx={{ mb: 2 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
                  <Tab label="Weight" disabled={!selectedProgress.weight.target} />
                  <Tab label="Body Fat" disabled={!selectedProgress.fat_percentage.target || !selectedProgress.fat_percentage.current} />
                  <Tab label="Muscle Mass" disabled={!selectedProgress.muscle_mass.target || !selectedProgress.muscle_mass.current} />
                  <Tab label="All" disabled={!selectedProgress.weight.target || !selectedProgress.fat_percentage.target || !selectedProgress.muscle_mass.target} />
                </Tabs>
              </Box>
              <Card>
                <CardContent>
                  {activeTab === 0 && <ProjectionChart metric="weight" entries={entries} goals={goals} selectedGoal={selectedGoal} selectedProgress={selectedProgress} currentUser={currentUser} latestEntry={latestEntry} />}
                  {activeTab === 1 && <ProjectionChart metric="fat" entries={entries} goals={goals} selectedGoal={selectedGoal} selectedProgress={selectedProgress} currentUser={currentUser} latestEntry={latestEntry} />}
                  {activeTab === 2 && <ProjectionChart metric="muscle" entries={entries} goals={goals} selectedGoal={selectedGoal} selectedProgress={selectedProgress} currentUser={currentUser} latestEntry={latestEntry} />}
                  {activeTab === 3 && <AllMetricsChart entries={entries} goals={goals} selectedGoal={selectedGoal} selectedProgress={selectedProgress} currentUser={currentUser} latestEntry={latestEntry} />}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert severity="info">
              No progress data available for the selected goal. Make sure you have at least one entry and one goal with a future date.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default Progress;