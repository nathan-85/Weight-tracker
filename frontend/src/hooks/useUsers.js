import { useState, useEffect } from 'react';
import { getUsers } from '../services/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      
      // If there's only one user, select it automatically
      if (data.length === 1) {
        setSelectedUserId(data[0].id);
      } else if (data.length > 0) {
        // Try to find a user named "Nathan" if available
        const nathan = data.find(user => user.name === "Nathan");
        if (nathan) {
          setSelectedUserId(nathan.id);
        }
      }
      
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    selectedUserId,
    setSelectedUserId,
    loading,
    error
  };
}; 