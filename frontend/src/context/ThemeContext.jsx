import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const THEMES = {
  NIGHT: 'theme-night',
  EMERALD: 'theme-emerald',
  SUNSET: 'theme-sunset',
  OCEANIC: 'theme-oceanic',
  SNOW: 'theme-snow'
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartdash-theme') || THEMES.NIGHT;
  });

  useEffect(() => {
    // Remove all theme classes first
    Object.values(THEMES).forEach(t => {
      document.documentElement.classList.remove(t);
    });
    // Add current theme class
    document.documentElement.classList.add(theme);
    localStorage.setItem('smartdash-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
