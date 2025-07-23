import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Zoom,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  Refresh,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';

// Enhanced error boundary component
class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Widget Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            p: 2 
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" color="error" align="center">
            Widget Failed to Load
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <IconButton 
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ mt: 2 }}
          >
            <Refresh />
          </IconButton>
        </Box>
      );
    }

    return this.props.children;
  }
}

const WidgetWrapper = ({ 
  widgetType, 
  analysisResults, 
  onMaximize, 
  onMinimize, 
  isMaximized = false,
  isDraggable = true,
  title,
  subtitle,
  ...props 
}) => {
  const { theme, isDarkMode } = useCustomTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMobile = useMediaQuery(theme?.breakpoints?.down ? theme.breakpoints.down('sm') : '(max-width:600px)');
  
  // Create safeTheme with fallback to prevent undefined errors
  const safeTheme = useMemo(() => {
    if (!theme) {
      // Fallback theme structure
      return {
        palette: {
          background: {
            paper: '#ffffff',
            default: '#f5f5f5'
          },
          divider: '#e0e0e0',
          primary: {
            main: '#1976d2'
          },
          text: {
            primary: '#000000',
            secondary: '#666666'
          }
        },
        shadows: [
          'none',
          '0px 2px 1px -1px rgba(0,0,0,0.2)',
          '0px 3px 1px -2px rgba(0,0,0,0.2)',
          '0px 3px 3px -2px rgba(0,0,0,0.2)',
          '0px 2px 4px -1px rgba(0,0,0,0.2)',
          ...Array(20).fill('0px 2px 4px -1px rgba(0,0,0,0.2)'),
          '0px 11px 15px -7px rgba(0,0,0,0.2)'
        ]
      };
    }
    return theme;
  }, [theme]);
  
  // Widget component mapping with enhanced error handling
  const widgetMapping = useMemo(() => {
    try {
      return {
        'portfolio-summary': React.lazy(() => 
          import('../professional/ProfessionalPortfolioCard').catch(() => 
            import('../EnhancedSummary').then(module => ({ default: module.PortfolioSummaryCard }))
          )
        ),
        'interactive-charts': React.lazy(() => 
          import('../InteractiveCharts').catch(() => 
            import('../AgentCharts')
          )
        ),
        'agent-performance': React.lazy(() => 
          import('../professional/ProfessionalMarketInsights').catch(() => 
            import('../EnhancedSummary').then(module => ({ default: module.AgentPerformanceCard }))
          )
        ),
        'market-insights': React.lazy(() => 
          import('../professional/ProfessionalMarketInsights').catch(() => 
            import('../EnhancedSummary').then(module => ({ default: module.MarketInsightsCard }))
          )
        ),
        'tabular-analysis': React.lazy(() => 
          import('../professional/ProfessionalTabularView').catch(() => 
            import('../EnhancedSummary')
          )
        ),
        'trading-decision-flow': React.lazy(() => 
          import('../visualizations/TradingDecisionFlow').catch(() => 
            import('../VisualizationDashboard')
          )
        ),
        'agent-dashboard': React.lazy(() => 
          import('../HedgeFundDashboard').catch(() => 
            import('../AgentCharts')
          )
        ),
        'system-visualizations': React.lazy(() => 
          import('../VisualizationDashboard').catch(() => 
            import('../visualizations/SystemArchitecture')
          )
        )
      };
    } catch (error) {
      console.error('Error creating widget mapping:', error);
      return {};
    }
  }, []);

  // Get the appropriate component
  const WidgetComponent = widgetMapping[widgetType];

  // Handle widget refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Enhanced loading fallback
  const LoadingFallback = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        p: 2 
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="body2" color="textSecondary">
        Loading {title || 'Widget'}...
      </Typography>
    </Box>
  );

  // Enhanced error fallback
  const ErrorFallback = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        p: 2 
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h6" color="error" align="center">
        Widget Not Found
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
        Widget type "{widgetType}" is not available
      </Typography>
      <IconButton onClick={handleRefresh} sx={{ mt: 2 }}>
        <Refresh />
      </IconButton>
    </Box>
  );

  if (!WidgetComponent) {
    return <ErrorFallback />;
  }

  return (
    <WidgetErrorBoundary>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: safeTheme.palette.background.paper,
          border: `1px solid ${safeTheme.palette.divider}`,
          borderRadius: 2,
          boxShadow: safeTheme.shadows[1],
          transition: 'all 0.3s ease-in-out',
          cursor: isDraggable ? 'move' : 'default',
          '&:hover': {
            boxShadow: safeTheme.shadows[4],
            borderColor: safeTheme.palette.primary.main,
          },
          ...(isMaximized && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            borderRadius: 0,
            boxShadow: safeTheme.shadows[24],
          })
        }}
        {...props}
      >
        {/* Enhanced Header */}
        <CardHeader
          title={
            <Typography 
              variant={isMaximized ? "h5" : "h6"} 
              component="h2"
              sx={{ 
                fontWeight: 600,
                color: safeTheme.palette.text.primary,
                lineHeight: 1.2
              }}
            >
              {title || `Widget ${widgetType}`}
            </Typography>
          }
          subheader={subtitle && (
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
          action={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Refresh Widget">
                <IconButton 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <Refresh sx={{ 
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={isMaximized ? "Minimize" : "Maximize"}>
                <IconButton 
                  size="small" 
                  onClick={isMaximized ? onMinimize : onMaximize}
                >
                  {isMaximized ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{
            pb: 1,
            backgroundColor: safeTheme.palette.background.default,
            borderBottom: `1px solid ${safeTheme.palette.divider}`,
            flexShrink: 0
          }}
        />

        {/* Enhanced Content Area */}
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: isMaximized ? 3 : 2,
            '&:last-child': { pb: isMaximized ? 3 : 2 },
            // Ensure content fills available space
            '& > *': {
              flex: 1,
              minHeight: 0, // Allow flex children to shrink
            }
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Zoom in={true} timeout={300}>
              <Box 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  // Ensure content is fully visible
                  '& > *': {
                    flex: 1,
                    overflow: 'auto',
                  }
                }}
                key={refreshKey}
              >
                <WidgetComponent 
                  analysisResults={analysisResults}
                  isMaximized={isMaximized}
                  isMobile={isMobile}
                  theme={safeTheme}
                  {...props}
                />
              </Box>
            </Zoom>
          </Suspense>
        </CardContent>
      </Card>
    </WidgetErrorBoundary>
  );
};

export default WidgetWrapper;
