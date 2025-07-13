import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Chip,
  Divider,
  FormControl,
  Select,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  Grid
} from '@mui/material';
import {
  Save,
  Folder,
  Visibility,
  VisibilityOff,
  Settings,
  GridOn,
  Close,
  Add,
  Delete,
  RestoreFromTrash as Restore,
  DashboardCustomize
} from '@mui/icons-material';
import {
  Responsive, WidthProvider
} from 'react-grid-layout';
import { useCustomTheme } from '../theme/ThemeProvider';

// CSS imports for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import the WidgetWrapper
import WidgetWrapper from './widgets/WidgetWrapper';

const ResponsiveGridLayout = WidthProvider(Responsive);

const LayoutManager = ({ children, onLayoutChange, data = {} }) => {
  const { theme } = useCustomTheme();
  const [layouts, setLayouts] = useState({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [isDraggable, setIsDraggable] = useState(true);
  const [isResizable, setIsResizable] = useState(true);
  const [visibleWidgets, setVisibleWidgets] = useState({});
  const [maximizedWidget, setMaximizedWidget] = useState(null);
  const [originalLayout, setOriginalLayout] = useState(null);
  
  // Helper function to get widget title
  const getWidgetTitle = (widgetId) => {
    const titles = {
      'portfolio-summary': 'Portfolio Summary',
      'interactive-charts': 'Interactive Charts',
      'agent-performance': 'Agent Performance',
      'market-insights': 'Market Insights',
      'tabular-analysis': 'Tabular Analysis',
      'trading-decision-flow': 'Trading Decision Flow',
      'agent-dashboard': 'Agent Dashboard',
      'system-visualizations': 'System Visualizations',
      'news-feed': 'Market News',
      'economic-calendar': 'Economic Calendar'
    };
    return titles[widgetId] || widgetId;
  };

  // Helper function to get widget type for WidgetWrapper
  const getWidgetType = (widgetId) => {
    const types = {
      'portfolio-summary': 'portfolio-summary',
      'interactive-charts': 'interactive-charts',
      'agent-performance': 'agent-performance',
      'market-insights': 'market-insights',
      'tabular-analysis': 'tabular-analysis',
      'trading-decision-flow': 'trading-decision-flow',
      'agent-dashboard': 'agent-dashboard',
      'system-visualizations': 'system-visualizations',
      'news-feed': 'news-feed',
      'economic-calendar': 'economic-calendar'
    };
    return types[widgetId] || 'portfolio-summary';
  };

  // Default widget visibility
  const defaultVisibility = {
    'portfolio-summary': true,
    'interactive-charts': true,
    'agent-performance': true,
    'market-insights': true,
    'tabular-analysis': true,
    'trading-decision-flow': true,
    'agent-dashboard': false,
    'system-visualizations': false,
    'news-feed': false,
    'economic-calendar': false
  };

  // Layout management
  const [layoutMenuAnchor, setLayoutMenuAnchor] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [savedLayouts, setSavedLayouts] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('Default');
  const [tabValue, setTabValue] = useState(0);

  // Layout presets - optimized for full-screen widget viewing
  const layoutPresets = {
    default: {
      name: 'Balanced View',
      description: 'Well-balanced layout showing all components equally',
      layouts: {
        lg: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
          { i: 'interactive-charts', x: 6, y: 0, w: 6, h: 8, minW: 6, minH: 6 },
          { i: 'agent-performance', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
          { i: 'market-insights', x: 0, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
          { i: 'tabular-analysis', x: 6, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
          { i: 'trading-decision-flow', x: 0, y: 12, w: 12, h: 6, minW: 8, minH: 4 }
        ],
        md: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'interactive-charts', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
          { i: 'agent-performance', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 6, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'trading-decision-flow', x: 0, y: 12, w: 12, h: 6, minW: 6, minH: 4 }
        ],
        sm: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'interactive-charts', x: 0, y: 4, w: 6, h: 8, minW: 4, minH: 6 },
          { i: 'agent-performance', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 0, y: 16, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 0, y: 20, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'trading-decision-flow', x: 0, y: 24, w: 6, h: 6, minW: 4, minH: 4 }
        ],
        xs: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'interactive-charts', x: 0, y: 4, w: 4, h: 8, minW: 3, minH: 6 },
          { i: 'agent-performance', x: 0, y: 12, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'market-insights', x: 0, y: 16, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'tabular-analysis', x: 0, y: 20, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'trading-decision-flow', x: 0, y: 24, w: 4, h: 6, minW: 3, minH: 4 }
        ]
      }
    },
    analysis: {
      name: 'Analysis Focused',
      description: 'Charts and analysis tools take center stage',
      layouts: {
        lg: [
          { i: 'interactive-charts', x: 0, y: 0, w: 8, h: 10, minW: 6, minH: 8 },
          { i: 'agent-performance', x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
          { i: 'market-insights', x: 8, y: 5, w: 4, h: 5, minW: 3, minH: 4 },
          { i: 'portfolio-summary', x: 0, y: 10, w: 4, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 4, y: 10, w: 4, h: 4, minW: 3, minH: 3 },
          { i: 'trading-decision-flow', x: 8, y: 10, w: 4, h: 4, minW: 3, minH: 3 }
        ],
        md: [
          { i: 'interactive-charts', x: 0, y: 0, w: 8, h: 8, minW: 5, minH: 6 },
          { i: 'agent-performance', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
          { i: 'portfolio-summary', x: 0, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 4, y: 8, w: 4, h: 4, minW: 3, minH: 3 },
          { i: 'trading-decision-flow', x: 8, y: 8, w: 4, h: 4, minW: 3, minH: 3 }
        ],
        sm: [
          { i: 'interactive-charts', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
          { i: 'agent-performance', x: 0, y: 10, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 0, y: 14, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'portfolio-summary', x: 0, y: 18, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 0, y: 22, w: 6, h: 4, minW: 3, minH: 3 },
          { i: 'trading-decision-flow', x: 0, y: 26, w: 6, h: 6, minW: 4, minH: 4 }
        ],
        xs: [
          { i: 'interactive-charts', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 8 },
          { i: 'agent-performance', x: 0, y: 10, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'market-insights', x: 0, y: 14, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'portfolio-summary', x: 0, y: 18, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'tabular-analysis', x: 0, y: 22, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'trading-decision-flow', x: 0, y: 26, w: 4, h: 6, minW: 3, minH: 4 }
        ]
      }
    },
    monitoring: {
      name: 'Monitoring Dashboard',
      description: 'Summary cards and key metrics for quick overview',
      layouts: {
        lg: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 3, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'agent-performance', x: 6, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'interactive-charts', x: 0, y: 4, w: 12, h: 8, minW: 8, minH: 6 },
          { i: 'trading-decision-flow', x: 0, y: 12, w: 12, h: 6, minW: 8, minH: 4 }
        ],
        md: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 3, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'agent-performance', x: 6, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'interactive-charts', x: 0, y: 4, w: 12, h: 8, minW: 6, minH: 6 },
          { i: 'trading-decision-flow', x: 0, y: 12, w: 12, h: 6, minW: 6, minH: 4 }
        ],
        sm: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'market-insights', x: 3, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'agent-performance', x: 0, y: 4, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'tabular-analysis', x: 3, y: 4, w: 3, h: 4, minW: 3, minH: 3 },
          { i: 'interactive-charts', x: 0, y: 8, w: 6, h: 8, minW: 4, minH: 6 },
          { i: 'trading-decision-flow', x: 0, y: 16, w: 6, h: 6, minW: 4, minH: 4 }
        ],
        xs: [
          { i: 'portfolio-summary', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'market-insights', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'agent-performance', x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'tabular-analysis', x: 0, y: 12, w: 4, h: 4, minW: 2, minH: 3 },
          { i: 'interactive-charts', x: 0, y: 16, w: 4, h: 8, minW: 3, minH: 6 },
          { i: 'trading-decision-flow', x: 0, y: 24, w: 4, h: 6, minW: 3, minH: 4 }
        ]
      }
    }
  };

  // Initialize layouts and visibility from localStorage or defaults
  useEffect(() => {
    const savedLayoutData = localStorage.getItem('dashboardLayout');
    const savedVisibility = localStorage.getItem('widgetVisibility');
    const savedCustomLayouts = localStorage.getItem('savedLayouts');
    
    if (savedLayoutData) {
      try {
        setLayouts(JSON.parse(savedLayoutData));
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
        setLayouts(layoutPresets.default.layouts);
      }
    } else {
      setLayouts(layoutPresets.default.layouts);
    }

    if (savedVisibility) {
      try {
        setVisibleWidgets(JSON.parse(savedVisibility));
      } catch (e) {
        console.error('Failed to parse saved visibility:', e);
        setVisibleWidgets(defaultVisibility);
      }
    } else {
      setVisibleWidgets(defaultVisibility);
    }

    if (savedCustomLayouts) {
      try {
        setSavedLayouts(JSON.parse(savedCustomLayouts));
      } catch (e) {
        console.error('Failed to parse saved custom layouts:', e);
      }
    }
  }, [layoutPresets]);

  // Save current layout to localStorage
  const saveCurrentLayout = () => {
    localStorage.setItem('dashboardLayout', JSON.stringify(layouts));
    localStorage.setItem('widgetVisibility', JSON.stringify(visibleWidgets));
  };

  // Handle layout change
  const handleLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(layout, allLayouts);
    }
    // Auto-save on layout change
    setTimeout(() => {
      localStorage.setItem('dashboardLayout', JSON.stringify(allLayouts));
    }, 1000);
  };

  // Load preset layout
  const loadPreset = useCallback((presetName) => {
    const preset = layoutPresets[presetName];
    if (preset) {
      setLayouts(preset.layouts);
      setSelectedPreset(presetName);
      // Update tab value based on preset name
      const presets = ['default', 'analysis', 'monitoring'];
      const tabIndex = presets.indexOf(presetName);
      if (tabIndex !== -1) {
        setTabValue(tabIndex);
      }
    }
  }, [layoutPresets]);

  // Save custom layout
  const saveCustomLayout = () => {
    if (!layoutName.trim()) return;
    
    const newLayout = {
      id: Date.now(),
      name: layoutName,
      layouts: layouts,
      visibleWidgets: visibleWidgets,
      createdAt: new Date().toISOString()
    };
    
    const updatedSavedLayouts = [...savedLayouts, newLayout];
    setSavedLayouts(updatedSavedLayouts);
    localStorage.setItem('savedLayouts', JSON.stringify(updatedSavedLayouts));
    
    setLayoutName('');
    setSaveDialogOpen(false);
  };

  // Load custom layout
  const loadCustomLayout = (customLayout) => {
    setLayouts(customLayout.layouts);
    setVisibleWidgets(customLayout.visibleWidgets);
    setTimeout(() => {
      localStorage.setItem('dashboardLayout', JSON.stringify(customLayout.layouts));
      localStorage.setItem('widgetVisibility', JSON.stringify(customLayout.visibleWidgets));
    }, 100);
    setLayoutMenuAnchor(null);
  };

  // Toggle widget visibility
  const toggleWidgetVisibility = (widgetId) => {
    const newVisibility = {
      ...visibleWidgets,
      [widgetId]: !visibleWidgets[widgetId]
    };
    setVisibleWidgets(newVisibility);
    localStorage.setItem('widgetVisibility', JSON.stringify(newVisibility));
  };

  // Reset to default layout
  const resetToDefault = () => {
    loadPreset('default');
    setLayoutMenuAnchor(null);
  };

  // Export layout configuration
  const exportLayout = () => {
    const exportData = {
      layouts,
      visibleWidgets,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get current layout for display
  const currentLayout = layouts[currentBreakpoint] || layouts.lg || layoutPresets.default.layouts.lg;

  // Custom drag handle component
  const DragHandleComponent = ({ title, onToggleVisibility, isVisible, widgetId }) => (
    <Box
      className="drag-handle"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        cursor: 'move',
        borderRadius: '4px 4px 0 0',
        userSelect: 'none'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GridOn sx={{ fontSize: 16 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Tooltip title={isVisible ? 'Hide Widget' : 'Show Widget'}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(widgetId);
          }}
          sx={{ color: 'inherit' }}
        >
          {isVisible ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Maximize Widget">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            maximizeWidget(widgetId);
          }}
          sx={{ color: 'inherit' }}
        >
          <Add />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const presets = ['default', 'analysis', 'monitoring'];
    const selectedPresetName = presets[newValue];
    setSelectedPreset(selectedPresetName);
    loadPreset(selectedPresetName);
  };

  // Widget maximize/minimize functions
  const maximizeWidget = (widgetId) => {
    if (maximizedWidget) return; // Already maximized
    
    // Store original layout
    setOriginalLayout(layouts);
    
    // Create full-screen layout for maximized widget
    const fullScreenLayout = {
      lg: [{ i: widgetId, x: 0, y: 0, w: 12, h: 18, minW: 12, minH: 18 }],
      md: [{ i: widgetId, x: 0, y: 0, w: 10, h: 16, minW: 10, minH: 16 }],
      sm: [{ i: widgetId, x: 0, y: 0, w: 6, h: 14, minW: 6, minH: 14 }],
      xs: [{ i: widgetId, x: 0, y: 0, w: 4, h: 12, minW: 4, minH: 12 }]
    };
    
    // Hide all other widgets
    const newVisibleWidgets = Object.keys(defaultVisibility).reduce((acc, key) => {
      acc[key] = key === widgetId;
      return acc;
    }, {});
    
    setVisibleWidgets(newVisibleWidgets);
    setLayouts(fullScreenLayout);
    setMaximizedWidget(widgetId);
    setIsDraggable(false);
    setIsResizable(false);
  };

  const minimizeWidget = () => {
    if (!maximizedWidget || !originalLayout) return;
    
    // Restore original layout and visibility
    setLayouts(originalLayout);
    setVisibleWidgets(Object.keys(defaultVisibility).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));
    
    setMaximizedWidget(null);
    setOriginalLayout(null);
    setIsDraggable(true);
    setIsResizable(true);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100vh',
      overflow: 'auto',
      backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#fafafa',
      '& .react-grid-layout': {
        position: 'relative',
        minHeight: '100%'
      },
      '& .react-grid-item': {
        transition: 'all 200ms ease',
        '&:hover': {
          '& .drag-handle': {
            opacity: 1,
          }
        }
      },
      '& .react-grid-item.react-grid-placeholder': {
        background: theme.palette.primary.main,
        opacity: 0.2,
        borderRadius: 1,
        transition: 'all 200ms ease',
        zIndex: 2,
        userSelect: 'none'
      },
      '& .react-resizable-handle': {
        position: 'absolute',
        width: 20,
        height: 20,
        bottom: 0,
        right: 0,
        background: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyem0wIDVjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyem0wIDVjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyem01LTEwYzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMCA1YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMCA1YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptNS0xMGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTAgNWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTAgNWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTAgNWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6Ii8+Cjwvc3ZnPgo=')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'bottom right',
        padding: '0 3px 3px 0',
        cursor: 'se-resize',
        zIndex: 10
      }
    }}>
      
      {/* Layout Controls */}
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ flexGrow: 1 }}>
            <Tab label="Default" />
            <Tab label="Analysis Focused" />
            <Tab label="Monitoring" />
          </Tabs>
          
          {/* Settings Menu */}
          <IconButton
            color="inherit"
            onClick={(e) => setLayoutMenuAnchor(e.currentTarget)}
            sx={{ ml: 2 }}
          >
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Settings Menu */}
      <Menu
        anchorEl={layoutMenuAnchor}
        open={Boolean(layoutMenuAnchor)}
        onClose={() => setLayoutMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            maxWidth: 320,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[8],
            border: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
            Dashboard Settings
          </Typography>
          
          {/* Control Toggles */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDraggable}
                  onChange={(e) => setIsDraggable(e.target.checked)}
                  size="small"
                />
              }
              label="Enable Dragging"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isResizable}
                  onChange={(e) => setIsResizable(e.target.checked)}
                  size="small"
                />
              }
              label="Enable Resizing"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Widget Visibility */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Widget Visibility
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(defaultVisibility).map(([widgetId, isVisible]) => (
                <Chip
                  key={widgetId}
                  label={getWidgetTitle(widgetId)}
                  variant={visibleWidgets[widgetId] ? "filled" : "outlined"}
                  color={visibleWidgets[widgetId] ? "primary" : "default"}
                  size="small"
                  onClick={() => toggleWidgetVisibility(widgetId)}
                  icon={visibleWidgets[widgetId] ? <Visibility /> : <VisibilityOff />}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<Save />}
              onClick={() => {
                setSaveDialogOpen(true);
                setLayoutMenuAnchor(null);
              }}
              size="small"
              variant="outlined"
              fullWidth
            >
              Save Current Layout
            </Button>
            <Button
              startIcon={<Restore />}
              onClick={() => {
                // Load saved layouts functionality
              }}
              size="small"
              variant="outlined"
              fullWidth
            >
              Load Saved Layout
            </Button>
            <Button
              startIcon={<DashboardCustomize />}
              onClick={() => {
                resetToDefault();
                setLayoutMenuAnchor(null);
              }}
              size="small"
              variant="outlined"
              fullWidth
            >
              Reset to Default
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* Main Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={setCurrentBreakpoint}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isDraggable}
        isResizable={isResizable}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
        margin={[16, 16]}
        containerPadding={[20, 20]}
        style={{
          minHeight: '100vh'
        }}
      >
        {currentLayout.map((widget) => {
          if (!visibleWidgets[widget.i]) return null;
          
          return (
            <Card
              key={widget.i}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.shadows[2],
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <DragHandleComponent
                title={getWidgetTitle(widget.i)}
                onToggleVisibility={() => toggleWidgetVisibility(widget.i)}
                isVisible={visibleWidgets[widget.i]}
                widgetId={widget.i}
              />
              <CardContent sx={{ 
                flex: 1, 
                p: 2, 
                '&:last-child': { pb: 2 },
                overflow: 'auto',
                height: 'calc(100% - 48px)'
              }}>
                <WidgetWrapper
                  widgetType={getWidgetType(widget.i)} 
                  analysisResults={data} 
                  title={getWidgetTitle(widget.i)}
                  onMaximize={() => maximizeWidget(widget.i)}
                  onMinimize={() => minimizeWidget()}
                  isMaximized={maximizedWidget === widget.i}
                  height="100%"
                />
              </CardContent>
            </Card>
          );
        })}
      </ResponsiveGridLayout>
      {maximizedWidget && (
        <Box sx={{ position: 'fixed', top: 0, right: 0, p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={minimizeWidget}
          >
            Minimize
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default LayoutManager;
