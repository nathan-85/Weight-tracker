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

// Entries API
export const getEntries = async () => {
  try {
    const response = await axios.get(`${API_URL}/entries`);
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
export const getGoals = async () => {
  try {
    const response = await axios.get(`${API_URL}/goals`);
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
export const getProgress = async () => {
  try {
    const response = await axios.get(`${API_URL}/progress`);
    return response.data;
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
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