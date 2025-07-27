import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { getAdminAccounts, adminDeleteAccount } from '../services/api';

const Admin = () => {
  const { currentAccount } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminAccounts();
      setAccounts(response.accounts);
    } catch (err) {
      setError('Failed to load accounts. Make sure you have admin privileges.');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      
      await adminDeleteAccount(accountToDelete.id);
      
      // Refresh the accounts list
      await loadAccounts();
      
      // Close dialog
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      
    } catch (err) {
      setDeleteError('Failed to delete account. Please try again.');
      console.error('Account deletion error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if current user is admin
  if (!currentAccount?.is_admin) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          Access Denied: Admin privileges required to view this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AdminIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Admin Panel
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAccounts}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Account Management
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {account.username}
                          {account.id === currentAccount.id && (
                            <Chip 
                              label="You" 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {account.is_admin ? (
                          <Chip 
                            icon={<AdminIcon />}
                            label="Admin" 
                            color="secondary" 
                            size="small"
                          />
                        ) : (
                          <Chip 
                            icon={<PersonIcon />}
                            label="User" 
                            variant="outlined" 
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${account.user_count} users`}
                          size="small"
                          variant="outlined"
                          color={account.user_count === 0 ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(account.created_at)}</TableCell>
                      <TableCell align="center">
                        {account.id === currentAccount.id ? (
                          <Tooltip title="Cannot delete your own account">
                            <span>
                              <IconButton disabled>
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Delete account">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(account)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {!loading && accounts.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No accounts found.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Delete Account: {accountToDelete?.username}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to permanently delete the account "{accountToDelete?.username}"?
          </DialogContentText>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              This will permanently delete:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>The account and login credentials</li>
              <li>All user profiles ({accountToDelete?.user_count} users)</li>
              <li>All weight entries and measurements</li>
              <li>All goals and progress data</li>
            </Box>
          </Alert>
          
          <DialogContentText color="error.main" fontWeight="bold">
            This action cannot be undone.
          </DialogContentText>
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admin; 