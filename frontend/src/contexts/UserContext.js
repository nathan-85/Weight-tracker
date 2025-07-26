import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, addUser } from '../services/api';

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

  // Function to load users from the API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getUsers();
      setUsers(usersData);
      
      // If there are users but no current user is selected, select the first one
      if (usersData.length > 0 && !currentUser) {
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
      }
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to switch the current user
  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', userId.toString());
    }
  };

  // Function to create a default user if none exist
  const createDefaultUser = async () => {
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
  };

  // Load users on initial mount
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
        
        // Only create a default user if no users exist in the database
        if (usersData.length === 0) {
          await createDefaultUser();
        } else if (!currentUser) {
          // If there are users but no current user is selected, select one
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
        }
      } catch (err) {
        setError('Failed to initialize users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    initializeUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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