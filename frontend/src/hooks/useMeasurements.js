import { useState, useEffect } from 'react';

export const useMeasurements = (selectedUserId) => {
  const [currentWeight, setCurrentWeight] = useState(80); // Default mock value
  const [currentFatPercentage, setCurrentFatPercentage] = useState(20); // Default mock value

  const fetchLatestMeasurements = async (userId) => {
    if (!userId) return;
    
    try {
      // For testing, using mock values
      // TODO: Replace with actual API call when available
      // const response = await fetch(`/api/entries/user/${userId}/latest`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setCurrentWeight(data.weight);
      //   setCurrentFatPercentage(data.fat_percentage);
      // }
      
      // Using mock data for now to ensure the feature works
      setCurrentWeight(80);
      setCurrentFatPercentage(20);
    } catch (err) {
      console.error('Failed to fetch latest measurements:', err);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchLatestMeasurements(selectedUserId);
    }
  }, [selectedUserId]);

  return {
    currentWeight,
    currentFatPercentage
  };
}; 