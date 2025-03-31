import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon
} from '@mui/icons-material';
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
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { getEntries, deleteEntry } from '../services/api';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const { darkMode } = useThemeContext();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEntries(currentUser?.id);
      setEntries(data);
    } catch (err) {
      setError('Failed to load entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    
    try {
      await deleteEntry(entryToDelete.id);
      setEntries(entries.filter(entry => entry.id !== entryToDelete.id));
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (err) {
      setError('Failed to delete entry');
      console.error(err);
    }
  };

  const handleEditClick = (entry) => {
    navigate(`/edit-entry/${entry.id}`);
  };

  const formatAustralianDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!entries.length) return null;

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const labels = sortedEntries.map(entry => new Date(entry.date));
    
    const weightData = sortedEntries.map(entry => ({
      x: new Date(entry.date),
      y: entry.weight
    }));
    
    const fatData = sortedEntries.map(entry => ({
      x: new Date(entry.date),
      y: entry.fat_percentage
    }));
    
    const muscleData = sortedEntries.map(entry => ({
      x: new Date(entry.date),
      y: entry.muscle_mass
    }));

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
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: 'Body Metrics Over Time',
        color: darkMode ? '#ffffff' : undefined,
      },
      legend: {
        labels: {
          color: darkMode ? '#ffffff' : undefined,
        }
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
          color: darkMode ? '#ffffff' : undefined,
        },
        ticks: {
          color: darkMode ? '#ffffff' : undefined,
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Body Fat (%)',
          color: darkMode ? '#ffffff' : undefined,
        },
        ticks: {
          color: darkMode ? '#ffffff' : undefined,
        },
        grid: {
          drawOnChartArea: false,
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
        },
      },
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
          text: 'Date',
          color: darkMode ? '#ffffff' : undefined,
        },
        ticks: {
          color: darkMode ? '#ffffff' : undefined,
          align: 'start',
          source: 'data',
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0
        },
        bounds: 'data',
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined,
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
                    since {formatAustralianDate(stats.comparisonDate)}
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
                        since {formatAustralianDate(stats.comparisonDate)}
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
                      <Typography color={stats.changes.muscle < 0 ? "error.main" : "success.main"}>
                        {stats.changes.muscle > 0 ? "+" : ""}{stats.changes.muscle.toFixed(1)} kg
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        since {formatAustralianDate(stats.comparisonDate)}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Chart */}
          <Card sx={{ mb: 4, width: '100%' }}>
            <CardContent sx={{ padding: 2, '&:last-child': { paddingBottom: 2 } }}>
              <Box sx={{ height: 400, width: '100%' }}>
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
                        {formatAustralianDate(entry.date)}
                      </TableCell>
                      <TableCell align="right">{entry.weight}</TableCell>
                      <TableCell align="right">{entry.fat_percentage?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell align="right">{entry.muscle_mass?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditClick(entry)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(entry)}
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

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Entry"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this entry?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 