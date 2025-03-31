import { useState, useEffect } from 'react';
import { getEntries } from '../services/api';

export const useMeasurements = (selectedUserId) => {
  const [currentWeight, setCurrentWeight] = useState(null);
  const [currentFatPercentage, setCurrentFatPercentage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatestMeasurements = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all entries for the user
      const entries = await getEntries(userId);
      
      if (entries && entries.length > 0) {
        // Sort entries by date (newest first)
        const sortedEntries = entries.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        // Get the most recent entry
        const latestEntry = sortedEntries[0];
        
        if (latestEntry) {
          setCurrentWeight(latestEntry.weight);
          setCurrentFatPercentage(latestEntry.fat_percentage);
        } else {
          console.warn('No measurement entries found for this user');
        }
      } else {
        console.warn('No measurement entries found for this user');
      }
    } catch (err) {
      console.error('Failed to fetch latest measurements:', err);
      setError('Failed to load current measurements. Using default values.');
      
      // Fallback to reasonable defaults if no data is available
      setCurrentWeight(80);
      setCurrentFatPercentage(20);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchLatestMeasurements(selectedUserId);
    }
  }, [selectedUserId]);

  return {
    currentWeight,
    currentFatPercentage,
    loading,
    error
  };
}; 