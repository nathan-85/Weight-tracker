import axios from 'axios';

const API_URL = '/api';

// Set Axios defaults for better error handling
axios.defaults.timeout = 10000; // 10 second timeout

// Add response interceptor for global error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

// User API
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await axios.delete(`${API_URL}/users/${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Entries API
export const getEntries = async (userId = null) => {
  try {
    const url = userId ? `${API_URL}/entries/user/${userId}` : `${API_URL}/entries`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
};

export const addEntry = async (entryData) => {
  try {
    const response = await axios.post(`${API_URL}/entries`, entryData);
    return response.data;
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
};

export const updateEntry = async (entryId, entryData) => {
  try {
    const response = await axios.put(`${API_URL}/entries/${entryId}`, entryData);
    return response.data;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (entryId) => {
  try {
    await axios.delete(`${API_URL}/entries/${entryId}`);
    return true;
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

// Goals API
export const getGoals = async (userId = null) => {
  try {
    const url = userId ? `${API_URL}/goals/user/${userId}` : `${API_URL}/goals`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
};

export const addGoal = async (goalData) => {
  try {
    const response = await axios.post(`${API_URL}/goals`, goalData);
    return response.data;
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (goalId, goalData) => {
  try {
    const response = await axios.put(`${API_URL}/goals/${goalId}`, goalData);
    return response.data;
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId) => {
  try {
    await axios.delete(`${API_URL}/goals/${goalId}`);
    return true;
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// Progress API
export const getProgress = async (userId = null) => {
  try {
    const url = userId ? `${API_URL}/progress/user/${userId}` : `${API_URL}/progress`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

export const register = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/auth/logout`);
    return true;
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async () => {
  try {
    const response = await axios.delete(`${API_URL}/auth/delete-account`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAuthStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/status`);
    return response.data;
  } catch (error) {
    return { authenticated: false };
  }
};

// Debug API
export const getDebugStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/debug/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching debug status:', error);
    return {
      status: 'error',
      error: error.message,
      debug_mode: false
    };
  }
}; 