import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';
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

import { getEntries, deleteEntry } from '../services/api';

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

const Dashboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await getEntries();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError('Failed to load entries. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await deleteEntry(id);
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (err) {
      setError('Failed to delete entry. Please try again.');
      console.error(err);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!entries.length) return null;

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const labels = sortedEntries.map(entry => format(new Date(entry.date), 'MMM d'));
    
    const weightData = sortedEntries.map(entry => entry.weight);
    const fatData = sortedEntries.map(entry => entry.fat_percentage);
    const muscleData = sortedEntries.map(entry => entry.muscle_mass);

    return {
      labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weightData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y',
        },
        {
          label: 'Body Fat (%)',
          data: fatData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          yAxisID: 'y1',
        },
        {
          label: 'Muscle Mass (kg)',
          data: muscleData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          yAxisID: 'y',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Body Metrics Over Time',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Weight / Muscle Mass (kg)',
        },
      },
      y1: {
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
    },
  };

  // Calculate stats
  const calculateStats = () => {
    if (!entries.length) return null;

    const latestEntry = entries.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    // Find entry from 30 days ago or the oldest if less than 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const entriesSortedByDate = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const oldestEntry = entriesSortedByDate[0];
    
    const comparisonEntry = entries.find(entry => 
      new Date(entry.date) <= thirtyDaysAgo
    ) || oldestEntry;

    // Calculate changes
    const weightChange = latestEntry.weight - comparisonEntry.weight;
    const fatChange = latestEntry.fat_percentage - comparisonEntry.fat_percentage;
    const muscleChange = latestEntry.muscle_mass - comparisonEntry.muscle_mass;

    return {
      current: {
        weight: latestEntry.weight,
        fat: latestEntry.fat_percentage,
        muscle: latestEntry.muscle_mass,
      },
      changes: {
        weight: weightChange,
        fat: fatChange,
        muscle: muscleChange,
      },
      comparisonDate: comparisonEntry.date,
    };
  };

  const stats = !loading && entries.length > 0 ? calculateStats() : null;
  const chartData = !loading && entries.length > 0 ? prepareChartData() : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {entries.length === 0 ? (
        <Alert severity="info">
          No entries yet. Start by adding your first measurement in the "New Entry" tab.
        </Alert>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Current Weight
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.current.weight} kg
                  </Typography>
                  <Typography color={stats.changes.weight < 0 ? "success.main" : "error.main"}>
                    {stats.changes.weight > 0 ? "+" : ""}{stats.changes.weight.toFixed(1)} kg
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    since {format(new Date(stats.comparisonDate), 'MMM d, yyyy')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Body Fat
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.current.fat?.toFixed(1) || 'N/A'}%
                  </Typography>
                  {stats.current.fat && (
                    <>
                      <Typography color={stats.changes.fat < 0 ? "success.main" : "error.main"}>
                        {stats.changes.fat > 0 ? "+" : ""}{stats.changes.fat.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        since {format(new Date(stats.comparisonDate), 'MMM d, yyyy')}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Muscle Mass
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.current.muscle?.toFixed(1) || 'N/A'} kg
                  </Typography>
                  {stats.current.muscle && (
                    <>
                      <Typography color={stats.changes.muscle > 0 ? "success.main" : "error.main"}>
                        {stats.changes.muscle > 0 ? "+" : ""}{stats.changes.muscle.toFixed(1)} kg
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        since {format(new Date(stats.comparisonDate), 'MMM d, yyyy')}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Chart */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ height: 400 }}>
                <Line options={chartOptions} data={chartData} />
              </Box>
            </CardContent>
          </Card>

          {/* Recent Entries Table */}
          <Typography variant="h5" gutterBottom>
            Recent Entries
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Weight (kg)</TableCell>
                  <TableCell align="right">Body Fat (%)</TableCell>
                  <TableCell align="right">Muscle Mass (kg)</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...entries]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell component="th" scope="row">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell align="right">{entry.weight}</TableCell>
                      <TableCell align="right">{entry.fat_percentage?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell align="right">{entry.muscle_mass?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default Dashboard; 