import React, { createContext, useContext, useState, useEffect } from 'react';
import { GOAL_THRESHOLDS } from '../utils/calculations';

const SettingsContext = createContext();

export const useSettingsContext = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  // Check localStorage for saved settings or use defaults
  const [cautionMultiplier, setCautionMultiplier] = useState(() => {
    const savedValue = localStorage.getItem('cautionMultiplier');
    return savedValue ? parseFloat(savedValue) : GOAL_THRESHOLDS.CAUTION_MULTIPLIER;
  });
  
  const [extremeMultiplier, setExtremeMultiplier] = useState(() => {
    const savedValue = localStorage.getItem('extremeMultiplier');
    return savedValue ? parseFloat(savedValue) : GOAL_THRESHOLDS.EXTREME_MULTIPLIER;
  });

  // Update localStorage when settings change
  useEffect(() => {
    localStorage.setItem('cautionMultiplier', cautionMultiplier);
    // Update the global constants to sync with our context
    GOAL_THRESHOLDS.CAUTION_MULTIPLIER = cautionMultiplier;
  }, [cautionMultiplier]);

  useEffect(() => {
    localStorage.setItem('extremeMultiplier', extremeMultiplier);
    // Update the global constants to sync with our context
    GOAL_THRESHOLDS.EXTREME_MULTIPLIER = extremeMultiplier;
  }, [extremeMultiplier]);

  // Update multiplier settings
  const updateCautionMultiplier = (value) => {
    setCautionMultiplier(parseFloat(value));
  };

  const updateExtremeMultiplier = (value) => {
    setExtremeMultiplier(parseFloat(value));
  };

  const value = {
    cautionMultiplier,
    extremeMultiplier,
    updateCautionMultiplier,
    updateExtremeMultiplier
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 