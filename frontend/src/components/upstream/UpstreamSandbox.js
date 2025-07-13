import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Assessment as AnalysisIcon,
  Timeline as BacktestIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';
import UpstreamDashboard from './UpstreamDashboard';

import UpstreamAnalysisResults from './UpstreamAnalysisResults';
import UpstreamBacktesting from './UpstreamBacktesting';

const UpstreamSandbox = () => {
  const { colors } = useCustomTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  const tabsConfig = [
    { 
      label: 'Dashboard', 
      icon: <DashboardIcon />, 
      component: <UpstreamDashboard />,
      description: 'Multi-LLM Analysis & Provider Selection'
    },

    { 
      label: 'Analysis Results', 
      icon: <AnalysisIcon />, 
      component: <UpstreamAnalysisResults />,
      description: 'Enhanced Analysis Results & Comparisons'
    },
    { 
      label: 'Backtesting', 
      icon: <BacktestIcon />, 
      component: <UpstreamBacktesting />,
      description: 'Advanced Multi-LLM Backtesting Engine'
    },
  ];

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: colors.background }}>
      {/* Header */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: colors.border,
        backgroundColor: colors.cardBackground,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 3,
          py: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              color: colors.text, 
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}>
              🚀 Upstream Web Architecture
            </Typography>
            <Typography variant="subtitle1" sx={{ color: colors.textSecondary }}>
              Enhanced Multi-LLM Trading System Integration
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label="SANDBOX MODE"
              size="small"
              sx={{
                backgroundColor: `${colors.warning}20`,
                color: colors.warning,
                fontWeight: 'bold',
                fontSize: '11px'
              }}
            />
            <Tooltip title="Refresh upstream components">
              <IconButton 
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{ color: colors.primary }}
              >
                <RefreshIcon sx={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Info Banner */}
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{
            mx: 3,
            mb: 2,
            backgroundColor: `${colors.info}10`,
            borderColor: colors.info + '40',
            '& .MuiAlert-icon': { color: colors.info },
            '& .MuiAlert-message': { color: colors.text }
          }}
        >
          <Typography variant="body2">
            <strong>Upstream Integration Preview:</strong> This sandbox showcases enhanced features from the upstream repository including multi-LLM provider support, advanced agent configuration, and enhanced backtesting capabilities. All changes are isolated and won't affect your existing Professional Interface.
          </Typography>
        </Alert>

        {/* Navigation Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            px: 3,
            '& .MuiTab-root': { 
              color: colors.textSecondary,
              minHeight: 72,
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&.Mui-selected': { 
                color: colors.primary,
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': { 
              backgroundColor: colors.primary,
              height: 3,
            }
          }}
        >
          {tabsConfig.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                    {tab.label}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: colors.textSecondary,
                    fontSize: '11px',
                    display: 'block',
                    mt: 0.5
                  }}>
                    {tab.description}
                  </Typography>
                </Box>
              }
              iconPosition="top"
              sx={{ 
                py: 1,
                '& .MuiSvgIcon-root': {
                  fontSize: '24px',
                  mb: 1
                }
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ backgroundColor: colors.background }}>
        {tabsConfig.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            <Box sx={{ px: 3, pb: 3 }}>
              {tab.component}
            </Box>
          </TabPanel>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ 
        mt: 4,
        py: 3,
        px: 3,
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBackground,
        textAlign: 'center'
      }}>
        <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>
          Upstream Web Architecture Integration • Multi-LLM Provider Support
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {['OpenAI', 'Anthropic', 'Groq', 'DeepSeek', 'Ollama'].map((provider) => (
            <Chip
              key={provider}
              label={provider}
              size="small"
              variant="outlined"
              sx={{
                borderColor: colors.border,
                color: colors.textSecondary,
                fontSize: '10px'
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default UpstreamSandbox;
