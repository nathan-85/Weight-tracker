import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Tooltip,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as TransgenderIcon,
  Height as HeightIcon,
  Cake as CakeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import { deleteUser } from '../services/api';
import { format } from 'date-fns';

const Profile = () => {
  const navigate = useNavigate();
  const { users, currentUser, switchUser, loadUsers } = useUserContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Refresh users list when component mounts
    loadUsers();
  }, []);

  const handleAddProfile = () => {
    navigate('/profile/new');
  };

  const handleEditProfile = (userId) => {
    navigate(`/profile/edit/${userId}`);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await deleteUser(userToDelete.id);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Reload users
      await loadUsers();
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = (userId) => {
    switchUser(userId);
  };

  const formatAustralianDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const getSexIcon = (sex) => {
    if (!sex) return <TransgenderIcon />;
    
    switch(sex.toLowerCase()) {
      case 'male':
        return <MaleIcon color="primary" />;
      case 'female':
        return <FemaleIcon color="secondary" />;
      default:
        return <TransgenderIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profiles
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddProfile}
        >
          Add New Profile
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        {users.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                },
                border: currentUser && currentUser.id === user.id ? 2 : 0,
                borderColor: 'primary.main'
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      bgcolor: currentUser && currentUser.id === user.id ? 'primary.main' : 'grey.400',
                      mr: 2
                    }}
                  >
                    {getUserInitials(user.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="div">
                      {user.name}
                    </Typography>
                    {currentUser && currentUser.id === user.id && (
                      <Chip 
                        label="Current" 
                        size="small" 
                        color="primary" 
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <List dense>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        {getSexIcon(user.sex)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Sex" 
                      secondary={user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : 'Not specified'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        <CakeIcon color="action" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Age" 
                      secondary={user.age ? `${user.age} years` : 'Not specified'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        <HeightIcon color="action" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Height" 
                      secondary={user.height ? `${user.height} cm` : 'Not specified'} 
                    />
                  </ListItem>
                </List>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  {currentUser && currentUser.id !== user.id ? (
                    <Button 
                      variant="outlined" 
                      onClick={() => handleSwitchUser(user.id)}
                      startIcon={<PersonIcon />}
                    >
                      Switch to
                    </Button>
                  ) : (
                    <Box /> // Empty box for spacing
                  )}
                  
                  <Box>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditProfile(user.id)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(user)}
                      disabled={users.length <= 1} // Prevent deleting the last user
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete User Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the profile for {userToDelete?.name}? 
            This will also delete all entries and goals associated with this user.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={loading}
            variant="contained"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 