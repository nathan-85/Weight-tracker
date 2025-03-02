import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check localStorage for saved preference, default to light mode
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  // Update localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const value = {
    darkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 