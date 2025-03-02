import React from 'react';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';

const UserSelector = ({ users, selectedUserId, setSelectedUserId, loading }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <FormControl fullWidth disabled={loading}>
          <InputLabel id="user-select-label">Select User</InputLabel>
          <Select
            labelId="user-select-label"
            id="user-select"
            value={selectedUserId}
            label="Select User"
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {loading && <CircularProgress size={24} sx={{ mt: 1 }} />}
      </CardContent>
    </Card>
  );
};

export default UserSelector; 