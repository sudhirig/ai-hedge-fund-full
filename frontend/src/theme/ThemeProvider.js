import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Financial color palettes
const financialColors = {
  bullish: {
    primary: '#00C853',
    light: '#5EFC82',
    dark: '#00701A',
    contrastText: '#FFFFFF'
  },
  bearish: {
    primary: '#FF1744',
    light: '#FF6374',
    dark: '#C4001D',
    contrastText: '#FFFFFF'
  },
  neutral: {
    primary: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#000000'
  },
  risk: {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
    critical: '#B71C1C'
  },
  performance: {
    excellent: '#00E676',
    good: '#64DD17',
    average: '#FFD600',
    poor: '#FF6D00',
    loss: '#FF1744'
  }
};

// Create light theme
const createLightTheme = () => createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff'
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    },
    text: {
      primary: '#212121',
      secondary: '#757575'
    },
    divider: '#e0e0e0',
    // Custom financial colors
    financial: financialColors,
    chart: {
      grid: '#f5f5f5',
      text: '#666666',
      axis: '#999999'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem'
    },
    subtitle1: {
      fontWeight: 500
    },
    body1: {
      fontSize: '0.95rem'
    },
    body2: {
      fontSize: '0.875rem'
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6
        }
      }
    }
  }
});

// Create dark theme
const createDarkTheme = () => createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
      contrastText: '#000000'
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#e91e63',
      contrastText: '#000000'
    },
    background: {
      default: '#0a0e27',
      paper: '#1a1d29'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3'
    },
    divider: '#2d3748',
    // Custom financial colors (adjusted for dark mode)
    financial: {
      ...financialColors,
      bullish: {
        ...financialColors.bullish,
        primary: '#4ade80',
        light: '#86efac'
      },
      bearish: {
        ...financialColors.bearish,
        primary: '#f87171',
        light: '#fca5a5'
      },
      neutral: {
        ...financialColors.neutral,
        primary: '#fbbf24',
        light: '#fde047'
      }
    },
    chart: {
      grid: '#374151',
      text: '#d1d5db',
      axis: '#9ca3af'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#ffffff'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#ffffff'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#ffffff'
    },
    subtitle1: {
      fontWeight: 500,
      color: '#e5e7eb'
    },
    body1: {
      fontSize: '0.95rem',
      color: '#d1d5db'
    },
    body2: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#1a1d29',
          border: '1px solid #2d3748',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: '#4a5568',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#374151',
          color: '#d1d5db'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1d29',
          border: '1px solid #2d3748'
        }
      }
    }
  }
});

// Theme context
const ThemeContext = createContext();

export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or default to dark mode for professional trading interface
    const savedTheme = localStorage.getItem('professionalTheme');
    return savedTheme ? JSON.parse(savedTheme) : true;
  });

  const theme = useMemo(() => {
    return isDarkMode ? createDarkTheme() : createLightTheme();
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('professionalTheme', JSON.stringify(newTheme));
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
    financialColors: theme.palette.financial
  };

  useEffect(() => {
    // Update document root for potential CSS variables
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default CustomThemeProvider;
