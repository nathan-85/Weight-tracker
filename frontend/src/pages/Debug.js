import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Clear as ClearIcon, 
  DownloadForOffline as DownloadIcon 
} from '@mui/icons-material';
import { getDebugStatus } from '../services/api';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debug-tabpanel-${index}`}
      aria-labelledby={`debug-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Debug = () => {
  const [debugStatus, setDebugStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [logs, setLogs] = useState([]);
  const [clientLogs, setClientLogs] = useState([]);
  const refreshIntervalRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    fetchDebugStatus();
    // Capture console logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = function() {
      const args = Array.from(arguments);
      const timestamp = new Date().toISOString();
      setClientLogs(prev => [...prev, { type: 'log', timestamp, message: args.map(arg => String(arg)).join(' ') }]);
      originalConsoleLog.apply(console, args);
    };

    console.error = function() {
      const args = Array.from(arguments);
      const timestamp = new Date().toISOString();
      setClientLogs(prev => [...prev, { type: 'error', timestamp, message: args.map(arg => String(arg)).join(' ') }]);
      originalConsoleError.apply(console, args);
    };

    console.warn = function() {
      const args = Array.from(arguments);
      const timestamp = new Date().toISOString();
      setClientLogs(prev => [...prev, { type: 'warn', timestamp, message: args.map(arg => String(arg)).join(' ') }]);
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDebugStatus();
      }, 5000); // Refresh every 5 seconds
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    // Scroll to bottom of logs when they update
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, clientLogs]);

  const fetchDebugStatus = async () => {
    try {
      setLoading(true);
      const data = await getDebugStatus();
      setDebugStatus(data);
      if (data.logs) {
        setLogs(data.logs);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch debug status. Debug mode may be disabled on the server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClearClientLogs = () => {
    setClientLogs([]);
  };

  const downloadLogs = (logsData, fileName) => {
    const element = document.createElement('a');
    let content = '';
    
    if (Array.isArray(logsData)) {
      if (typeof logsData[0] === 'string') {
        // Server logs
        content = logsData.join('\n');
      } else {
        // Client logs
        content = logsData.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
      }
    } else {
      content = JSON.stringify(logsData, null, 2);
    }
    
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Debug Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {debugStatus && debugStatus.debug_mode === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Debug Mode is Not Enabled on the Server</Typography>
          <Typography variant="body2">
            To enable full debugging capabilities, run the server with:
            <Box component="ul" sx={{ mt: 1, mb: 1 }}>
              <li>macOS/Linux: <code>./run_debug.sh</code></li>
              <li>Windows: <code>run_debug.bat</code></li>
            </Box>
            Or manually set the environment variable: <code>DEBUG_MODE=true</code> before starting the server.
          </Typography>
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Debug Controls</Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={fetchDebugStatus}
                  disabled={loading}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    name="autoRefresh"
                    color="primary"
                  />
                }
                label="Auto Refresh"
              />
            </Box>
          </Box>

          {loading && !debugStatus ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Server Status</Typography>
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {debugStatus ? JSON.stringify(debugStatus, null, 2) : 'No data available'}
                  </pre>
                </Paper>
                {debugStatus && debugStatus.warning && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {debugStatus.warning}
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Environment</Typography>
                <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {`Browser: ${navigator.userAgent}
React: ${React.version}
Window Size: ${window.innerWidth}x${window.innerHeight}
LocalStorage Available: ${typeof localStorage !== 'undefined'}
Debug Mode: ${localStorage.getItem('debugMode') === 'true' ? 'Enabled' : 'Disabled'}`}
                  </pre>
                </Paper>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="debug tabs">
            <Tab label="Server Logs" />
            <Tab label="Client Logs" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => downloadLogs(logs, 'server-logs.txt')}
              disabled={!logs || logs.length === 0}
            >
              Download Logs
            </Button>
          </Box>
          <Paper 
            sx={{ 
              height: 400, 
              maxHeight: 400, 
              overflow: 'auto',
              p: 2, 
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace'
            }}
          >
            {logs && logs.length > 0 ? (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {logs.join('\n')}
                <div ref={logsEndRef} />
              </pre>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                {debugStatus && debugStatus.warning 
                  ? "Server logs are only available when debug mode is enabled" 
                  : "No server logs available. Make sure debug mode is enabled on the server."}
              </Typography>
            )}
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearClientLogs}
              disabled={clientLogs.length === 0}
            >
              Clear Logs
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => downloadLogs(clientLogs, 'client-logs.txt')}
              disabled={clientLogs.length === 0}
            >
              Download Logs
            </Button>
          </Box>
          <Paper 
            sx={{ 
              height: 400, 
              maxHeight: 400, 
              overflow: 'auto',
              backgroundColor: '#f5f5f5'
            }}
          >
            <List dense>
              {clientLogs.length > 0 ? (
                clientLogs.map((log, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Box 
                              component="span" 
                              sx={{ 
                                color: log.type === 'error' ? 'error.main' : log.type === 'warn' ? 'warning.main' : 'text.primary',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {`[${new Date(log.timestamp).toLocaleTimeString()}] [${log.type.toUpperCase()}] ${log.message}`}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < clientLogs.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary" align="center">
                        No client logs yet. Interact with the app to generate logs.
                      </Typography>
                    }
                  />
                </ListItem>
              )}
              <div ref={logsEndRef} />
            </List>
          </Paper>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Debug; 