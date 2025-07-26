import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUsers, addUser } from '../services/api';
import { AuthContext } from './AuthContext';

// Create context
const UserContext = createContext();

// Hook for using the user context
export const useUserContext = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentAccount } = useContext(AuthContext);

  // Function to clear all user state
  const clearUserState = useCallback(() => {
    setUsers([]);
    setCurrentUser(null);
    setError(null);
    localStorage.removeItem('currentUserId');
  }, []);

  // Function to load users from the API
  const loadUsers = useCallback(async () => {
    if (!currentAccount) {
      clearUserState();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const usersData = await getUsers();
      setUsers(usersData);
      
      // If there are users but no current user is selected, select the first one
      if (usersData.length > 0) {
        // Try to get the last selected user from localStorage
        const lastSelectedUserId = localStorage.getItem('currentUserId');
        
        if (lastSelectedUserId) {
          const foundUser = usersData.find(user => user.id === parseInt(lastSelectedUserId));
          if (foundUser) {
            setCurrentUser(foundUser);
          } else {
            setCurrentUser(usersData[0]);
            localStorage.setItem('currentUserId', usersData[0].id.toString());
          }
        } else {
          setCurrentUser(usersData[0]);
          localStorage.setItem('currentUserId', usersData[0].id.toString());
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUserId');
      }
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentAccount, clearUserState]);

  // Function to switch the current user
  const switchUser = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', userId.toString());
    }
  }, [users]);

  // Function to create a default user if none exist
  const createDefaultUser = useCallback(async () => {
    if (!currentAccount) return;

    try {
      const defaultUser = {
        name: 'Default User',
        age: 30,
        sex: 'male',
        height: 175 // in cm
      };
      
      const newUser = await addUser(defaultUser);
      setUsers([newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('currentUserId', newUser.id.toString());
    } catch (err) {
      setError('Failed to create default user');
      console.error(err);
    }
  }, [currentAccount]);

  // React to authentication changes
  useEffect(() => {
    if (currentAccount) {
      // Account logged in - load users
      loadUsers();
    } else {
      // Account logged out - clear state
      clearUserState();
      setLoading(false);
    }
  }, [currentAccount, loadUsers, clearUserState]);

  // The value provided to consumers of this context
  const value = {
    users,
    currentUser,
    setCurrentUser,
    switchUser,
    loading,
    error,
    loadUsers,
    createDefaultUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 