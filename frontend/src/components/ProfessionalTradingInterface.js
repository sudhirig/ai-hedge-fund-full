import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Breadcrumbs,
  Link,
  IconButton,
  Collapse,
  Badge,
  Divider,
  AppBar,
  Toolbar,
  useMediaQuery,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard,
  AccountTree,
  RecordVoiceOver,
  Analytics,
  TrendingUp,
  Security,
  Settings,
  Notifications,
  Menu,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Circle,
  PlayArrow,
  Pause,
  Stop,
  Speed,
  NetworkCheck,
  Chat,
  Psychology,
  AccountBalance,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  MonitorHeart,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Person,
  GridView,
  CloudUpload
} from '@mui/icons-material';
import AgentNetworkVisualization from './AgentNetworkVisualization';
import AgentCommunicationFlow from './AgentCommunicationFlow';
import InteractiveCharts from './InteractiveCharts';
import ProfessionalPortfolioCard from './professional/ProfessionalPortfolioCard';
import ProfessionalAgentPanel from './professional/ProfessionalAgentPanel';
import ProfessionalDecisionFlow from './professional/ProfessionalDecisionFlow';
import ProfessionalMarketInsights from './professional/ProfessionalMarketInsights';
import ProfessionalTabularView from './professional/ProfessionalTabularView';
import AgentFlowVisualization from './AgentFlowVisualization';
import { SP500_COMPANIES, POPULAR_STOCKS } from '../data/sp500Companies';
import { API_ENDPOINTS } from '../config/api';
import axios from 'axios';
import { useCustomTheme } from '../theme/ThemeProvider';
import LayoutManager from './LayoutManager';
// Upstream components
import UpstreamSandbox from './upstream/UpstreamSandbox';
import UpstreamDashboard from './upstream/UpstreamDashboard';


const ProfessionalTradingInterface = () => {
  const { isDarkMode, theme: customTheme } = useCustomTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [expandedSections, setExpandedSections] = useState({
    analytics: true,
    trading: false,
    settings: false
  });

  // Stock selection and analysis state
  const [selectedStocks, setSelectedStocks] = useState(['AAPL', 'MSFT']);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-04-30');
  const [initialCash, setInitialCash] = useState(100000);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
  };

  // Stock selection handlers
  const handleStockChange = (event, newValue) => {
    const symbols = newValue.map(option => typeof option === 'string' ? option : option.symbol);
    setSelectedStocks(symbols.slice(0, 5)); // Limit to 5 stocks
  };

  // Debug analysisResults changes
  useEffect(() => {
    console.log('🔍 analysisResults state changed:', analysisResults);
    if (analysisResults?.agents) {
      console.log('📊 Agents available:', Object.keys(analysisResults.agents).length);
    }
    if (analysisResults?.decisions) {
      console.log('💼 Decisions available:', Object.keys(analysisResults.decisions).length);
    }
  }, [analysisResults]);

  const handlePresetSelect = (preset) => {
    setSelectedStocks(preset.symbols);
    setSnackbarMessage(`Selected ${preset.label}`);
    setSnackbarOpen(true);
  };

  // Run analysis with selected stocks
  const runAnalysis = async () => {
    if (selectedStocks.length === 0) {
      setAnalysisError('Please select at least one stock');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      console.log('Starting analysis for:', selectedStocks);
      console.log('API endpoint:', API_ENDPOINTS.run);
      
      const response = await axios.post(API_ENDPOINTS.run, {
        tickers: selectedStocks.join(','),
        start_date: startDate,
        end_date: endDate,
        initial_cash: initialCash
      }, {
        timeout: 300000, // 5 minute timeout (matches backend)
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Analysis response:', response.data);

      // Handle new structured response format
      if (response.data.status === 'success' && response.data.data) {
        console.log('✅ Structured format detected - setting analysisResults:', response.data.data);
        console.log('Agents count:', Object.keys(response.data.data.agents || {}).length);
        console.log('Decisions:', Object.keys(response.data.data.decisions || {}).length);
        setAnalysisResults(response.data.data);
        setSnackbarMessage('Analysis completed successfully!');
        setSnackbarOpen(true);
      } else if (response.data.status === 'error') {
        console.log('❌ Backend error:', response.data.message);
        setAnalysisError(response.data.message || 'Analysis failed');
      } else if (response.data.agents || response.data.decisions) {
        // Legacy format support
        console.log('✅ Legacy format detected - setting analysisResults:', response.data);
        console.log('Agents count:', Object.keys(response.data.agents || {}).length);
        setAnalysisResults(response.data);
        setSnackbarMessage('Analysis completed successfully!');
        setSnackbarOpen(true);
      } else {
        console.log('❌ Unexpected response format:', response.data);
        setAnalysisError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setAnalysisError('Analysis timed out. Please try again.');
      } else if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 
                           error.response.data?.detail || 
                           `Server error: ${error.response.status}`;
        setAnalysisError(errorMessage);
      } else if (error.request) {
        // Request was made but no response
        setAnalysisError('Unable to connect to analysis server. Please check if backend is running.');
      } else {
        // Something else happened
        setAnalysisError(error.message || 'Failed to run analysis');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stock selection panel component
  const StockSelectionPanel = () => (
    <Card sx={{ 
      bgcolor: customTheme.palette.background.paper, 
      border: `1px solid ${customTheme.palette.divider}`, 
      mb: 3,
      color: customTheme.palette.text.primary
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: customTheme.palette.text.primary, mb: 2, display: 'flex', alignItems: 'center' }}>
          <AccountBalance sx={{ mr: 1, color: customTheme.palette.primary.main }} />
          Stock Selection & Analysis
        </Typography>

        {/* Stock Autocomplete */}
        <Autocomplete
          multiple
          options={SP500_COMPANIES}
          getOptionLabel={(option) => typeof option === 'string' ? option : `${option.symbol} - ${option.name}`}
          value={selectedStocks.map(symbol => SP500_COMPANIES.find(c => c.symbol === symbol) || symbol)}
          onChange={handleStockChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Stocks (Max 5)"
              variant="outlined"
              sx={{ 
                mb: 2,
                '& .MuiInputLabel-root': { color: customTheme.palette.text.secondary },
                '& .MuiOutlinedInput-root': { 
                  color: customTheme.palette.text.primary,
                  '& fieldset': { borderColor: customTheme.palette.divider },
                  '&:hover fieldset': { borderColor: customTheme.palette.primary.main },
                  '&.Mui-focused fieldset': { borderColor: customTheme.palette.primary.main }
                }
              }}
            />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={typeof option === 'string' ? option : option.symbol}
                label={typeof option === 'string' ? option : option.symbol}
                sx={{ bgcolor: customTheme.palette.primary.main, color: customTheme.palette.text.primary, m: 0.25 }}
              />
            ))
          }
          sx={{ mb: 2 }}
        />

        {/* Quick Selection Presets */}
        <Typography variant="subtitle2" sx={{ color: customTheme.palette.text.secondary, mb: 1 }}>
          Quick Selection:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {POPULAR_STOCKS.map((preset, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => handlePresetSelect(preset)}
              sx={{
                color: customTheme.palette.text.secondary,
                borderColor: customTheme.palette.divider,
                '&:hover': {
                  borderColor: customTheme.palette.primary.main,
                  bgcolor: customTheme.palette.action.hover
                }
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Box>

        <Divider sx={{ bgcolor: customTheme.palette.divider, my: 2 }} />

        {/* Analysis Parameters */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ 
                '& .MuiInputLabel-root': { color: customTheme.palette.text.secondary },
                '& .MuiOutlinedInput-root': { 
                  color: customTheme.palette.text.primary,
                  '& fieldset': { borderColor: customTheme.palette.divider }
                }
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ 
                '& .MuiInputLabel-root': { color: customTheme.palette.text.secondary },
                '& .MuiOutlinedInput-root': { 
                  color: customTheme.palette.text.primary,
                  '& fieldset': { borderColor: customTheme.palette.divider }
                }
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Initial Cash ($)"
              type="number"
              value={initialCash}
              onChange={(e) => setInitialCash(parseInt(e.target.value))}
              fullWidth
              sx={{ 
                '& .MuiInputLabel-root': { color: customTheme.palette.text.secondary },
                '& .MuiOutlinedInput-root': { 
                  color: customTheme.palette.text.primary,
                  '& fieldset': { borderColor: customTheme.palette.divider }
                }
              }}
            />
          </Grid>
        </Grid>

        {/* Run Analysis Button */}
        <Button
          variant="contained"
          onClick={runAnalysis}
          disabled={isAnalyzing || selectedStocks.length === 0}
          startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          sx={{
            bgcolor: customTheme.palette.success.main,
            color: customTheme.palette.text.primary,
            '&:hover': { bgcolor: customTheme.palette.success.dark },
            '&:disabled': { bgcolor: customTheme.palette.action.disabled, color: customTheme.palette.text.disabled }
          }}
        >
          {isAnalyzing ? 'Running Analysis...' : 'Run Agent Analysis'}
        </Button>

        {/* Analysis Status */}
        {analysisError && (
          <Alert severity="error" sx={{ mt: 2, bgcolor: customTheme.palette.error.main, color: customTheme.palette.text.primary }}>
            {analysisError}
          </Alert>
        )}

        {analysisResults && (
          <Alert severity="success" sx={{ mt: 2, bgcolor: customTheme.palette.success.main, color: customTheme.palette.text.primary }}>
            Analysis completed for {selectedStocks.join(', ')} - {Object.keys(analysisResults.agents || {}).length} agents analyzed
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (selectedSection) {
      case 'dashboard':
        return (
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header Section */}
            <Box sx={{ 
              px: 4, 
              py: 3, 
              borderBottom: `1px solid ${customTheme.palette.divider}`,
              backgroundColor: customTheme.palette.background.paper,
              position: 'sticky',
              top: 0,
              zIndex: 50
            }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: customTheme.palette.text.primary, 
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
                  letterSpacing: '-0.025em',
                  mb: 1
                }}
              >
                Professional Trading Dashboard
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: customTheme.palette.text.secondary,
                  fontSize: '1.1rem',
                  fontWeight: 400
                }}
              >
                AI-powered investment analysis and portfolio management
              </Typography>
            </Box>
            
            {/* Stock Selection Panel */}
            <Box sx={{ px: 4, py: 3, backgroundColor: customTheme.palette.background.default }}>
              <StockSelectionPanel />
            </Box>
            
            {/* Dashboard Content */}
            <Box sx={{ 
              flex: 1, 
              px: 4, 
              py: 2, 
              overflow: 'auto',
              backgroundColor: customTheme.palette.background.default
            }}>
              <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ProfessionalPortfolioCard 
                  decisions={analysisResults?.decisions}
                  title="AI Agent Decision Summary"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ProfessionalAgentPanel 
                  agents={analysisResults?.agents}
                  title="AI Agent Performance"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <ProfessionalDecisionFlow 
                  simulationData={analysisResults}
                  title="AI Decision Timeline"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ProfessionalMarketInsights 
                  agents={analysisResults?.agents}
                  title="Market Intelligence"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <ProfessionalTabularView 
                  agents={analysisResults?.agents}
                  decisions={analysisResults?.decisions}
                  title="Terminal Analysis"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: customTheme.palette.background.paper, 
                  border: `1px solid ${customTheme.palette.divider}`, 
                  height: 400,
                  borderRadius: 3,
                  background: customTheme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: customTheme.palette.mode === 'dark' 
                      ? '0 10px 40px rgba(0,0,0,0.3)'
                      : '0 10px 40px rgba(0,0,0,0.1)'
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: customTheme.palette.text.primary, mb: 2, fontWeight: 'bold' }}>
                      Market Analysis Overview
                    </Typography>
                    <Typography variant="body2" sx={{ color: customTheme.palette.text.secondary, mb: 2 }}>
                      Selected stocks: {selectedStocks.length > 0 ? selectedStocks.join(', ') : 'None selected'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: customTheme.palette.text.secondary, mb: 2 }}>
                      Analysis period: {startDate} to {endDate}
                    </Typography>
                    <Typography variant="body2" sx={{ color: customTheme.palette.text.secondary, mb: 2 }}>
                      Initial capital: ${initialCash.toLocaleString()}
                    </Typography>
                    
                    {analysisResults && (
                      <>
                        <Typography variant="body2" sx={{ color: customTheme.palette.success.main, mb: 1 }}>
                          ✓ Analysis completed successfully
                        </Typography>
                        <Typography variant="body2" sx={{ color: customTheme.palette.text.secondary }}>
                          Total decisions: {Object.keys(analysisResults.decisions || {}).length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: customTheme.palette.text.secondary }}>
                          Active agents: {Object.keys(analysisResults.agents || {}).length}
                        </Typography>
                      </>
                    )}
                    
                    {isAnalyzing && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ color: customTheme.palette.text.secondary }}>
                          Running AI analysis...
                        </Typography>
                      </Box>
                    )}
                    
                    {analysisError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {analysisError}
                      </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<GridView />}
                      onClick={() => handleSectionSelect('custom-dashboard')}
                      sx={{ mt: 1 }}
                    >
                      Switch to Custom Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            </Box>
          </Box>
        );

      case 'custom-dashboard':
        return (
          <Box sx={{ height: 'calc(100vh - 200px)' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ color: customTheme.palette.text.primary, fontWeight: 'bold' }}>
                Custom Dashboard Layout
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Dashboard />}
                onClick={() => handleSectionSelect('overview')}
              >
                Switch to Standard Overview
              </Button>
            </Box>
            <LayoutManager 
              data={{
                analysisResults,
                agents: analysisResults?.agents,
                decisions: analysisResults?.decisions,
                selectedStocks,
                isAnalyzing,
                analysisError,
                startDate,
                endDate,
                initialCash
              }}
              onLayoutChange={(layout) => {
                console.log('Layout changed:', layout);
              }}
            />
          </Box>
        );

      case 'agent-flow':
        return (
          <Box sx={{ height: '100vh', overflow: 'hidden' }}>
            <AgentFlowVisualization 
              analysisResults={analysisResults}
              onRunAnalysis={runAnalysis}
              isAnalysisRunning={isAnalyzing}
            />
          </Box>
        );

      case 'network':
        return (
          <Box sx={{ height: '100vh', overflow: 'hidden' }}>
            <AgentNetworkVisualization 
              analysisResults={analysisResults}
              selectedStocks={selectedStocks}
              isAnalyzing={isAnalyzing}
            />
          </Box>
        );

      case 'communications':
        return (
          <Box sx={{ height: '100vh', overflow: 'hidden' }}>
            <AgentCommunicationFlow 
              analysisResults={analysisResults}
              selectedStocks={selectedStocks}
              isAnalyzing={isAnalyzing}
            />
          </Box>
        );

      case 'interactive-charts':
        return (
          <Box sx={{ height: '100vh', overflow: 'auto' }}>
            <InteractiveCharts 
              analysisResults={analysisResults}
              selectedStocks={selectedStocks}
              isAnalyzing={isAnalyzing}
            />
          </Box>
        );

      // Upstream Sandbox Components
      case 'upstream-dashboard':
        return (
          <Box sx={{ height: '100vh', overflow: 'auto' }}>
            <UpstreamDashboard />
          </Box>
        );



      case 'upstream-analysis':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: customTheme.palette.text.primary, mb: 3 }}>
              Upstream Analysis Results
            </Typography>
            <Typography variant="body1" sx={{ color: customTheme.palette.text.secondary }}>
              Analysis results from the upstream architecture will be displayed here.
            </Typography>
          </Box>
        );

      case 'upstream-backtesting':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: customTheme.palette.text.primary, mb: 3 }}>
              Upstream Backtesting
            </Typography>
            <Typography variant="body1" sx={{ color: customTheme.palette.text.secondary }}>
              Backtesting functionality from the upstream architecture will be displayed here.
            </Typography>
          </Box>
        );

      case 'upstream':
        return (
          <Box sx={{ height: '100vh', overflow: 'auto' }}>
            <UpstreamSandbox />
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: customTheme.palette.text.primary }}>
              {selectedSection}
            </Typography>
          </Box>
        );
    }
  };

  const sidebarItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Dashboard />,
      section: 'main'
    },
    {
      id: 'custom-dashboard',
      label: 'Custom Dashboard',
      icon: <GridView />,
      section: 'main'
    },
    {
      id: 'agents',
      label: 'Agentic Architecture',
      icon: <Psychology />,
      section: 'agents',
      expandable: true,
      children: [
        { id: 'agent-flow', label: 'Visual Agent Flow', icon: <AccountTree /> },
        { id: 'network', label: 'Agent Network', icon: <AccountTree /> },
        { id: 'communications', label: 'Communication Flow', icon: <Chat /> },
        { id: 'performance', label: 'Agent Performance', icon: <BarChart /> },
        { id: 'consensus', label: 'Consensus Engine', icon: <AccountBalance /> }
      ]
    },
    {
      id: 'analytics',
      label: 'Advanced Analytics',
      icon: <Analytics />,
      section: 'analytics',
      expandable: true,
      children: [
        { id: 'market', label: 'Market Analysis', icon: <TrendingUp /> },
        { id: 'portfolio', label: 'Portfolio Insights', icon: <PieChart /> },
        { id: 'risk', label: 'Risk Dashboard', icon: <Security /> },
        { id: 'performance', label: 'Performance Tracking', icon: <ShowChart /> },
        { id: 'interactive-charts', label: 'Interactive Charts', icon: <ShowChart /> }
      ]
    },
    {
      id: 'upstream',
      label: 'Upstream Sandbox',
      icon: <CloudUpload />,
      section: 'upstream',
      expandable: true,
      children: [
        { id: 'upstream-dashboard', label: 'Upstream Dashboard', icon: <Dashboard /> },
        { id: 'upstream-config', label: 'Agent Configuration', icon: <Settings /> },
        { id: 'upstream-analysis', label: 'Analysis Results', icon: <Analytics /> },
        { id: 'upstream-backtesting', label: 'Backtesting', icon: <Timeline /> }
      ]
    },
    {
      id: 'voice',
      label: 'Voice Intelligence',
      icon: <RecordVoiceOver />,
      section: 'voice'
    },
    {
      id: 'system',
      label: 'System Controls',
      icon: <Settings />,
      section: 'system',
      expandable: true,
      children: [
        { id: 'monitoring', label: 'System Monitor', icon: <MonitorHeart /> },
        { id: 'alerts', label: 'Alert Center', icon: <Notifications /> },
        { id: 'config', label: 'Configuration', icon: <Settings /> }
      ]
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100vw',
      backgroundColor: customTheme.palette.background.default,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* Top App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: 1300,
          backgroundColor: customTheme.palette.background.paper,
          borderBottom: `1px solid ${customTheme.palette.divider}`,
          boxShadow: customTheme.shadows[2],
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          width: '100vw'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ color: customTheme.palette.text.primary }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" sx={{ color: customTheme.palette.text.primary, fontWeight: 600 }}>
              Professional Trading Interface
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={2} color="error">
              <Notifications sx={{ color: customTheme.palette.text.primary }} />
            </Badge>
            <Avatar sx={{ bgcolor: customTheme.palette.primary.main }}>
              <Person />
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          zIndex: 1200,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: customTheme.palette.background.paper,
            borderRight: `1px solid ${customTheme.palette.divider}`,
            top: '64px',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            overflowY: 'auto',
            overflowX: 'hidden'
          },
        }}
      >
        {/* System Status Panel */}
        <Paper sx={{ m: 2, p: 2, backgroundColor: customTheme.palette.background.paper, border: `1px solid ${customTheme.palette.divider}` }}>
          <Typography variant="subtitle2" sx={{ color: customTheme.palette.text.primary, mb: 1 }}>
            System Status
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Circle sx={{ fontSize: 8, color: customTheme.palette.success.main }} />
                <Typography variant="caption" sx={{ color: customTheme.palette.text.secondary }}>
                  Stocks
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: customTheme.palette.text.primary, display: 'block' }}>
                {selectedStocks.length}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Circle sx={{ fontSize: 8, color: customTheme.palette.success.main }} />
                <Typography variant="caption" sx={{ color: customTheme.palette.text.secondary }}>
                  Analysis
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: customTheme.palette.text.primary, display: 'block' }}>
                {isAnalyzing ? 'Running...' : 'Idle'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Navigation List */}
        <List sx={{ px: 1 }}>
          {sidebarItems.map((item) => (
            <React.Fragment key={item.id}>
              <ListItemButton
                onClick={() => {
                  if (item.expandable) {
                    handleSectionToggle(item.section);
                  } else {
                    handleSectionSelect(item.id);
                  }
                }}
                selected={selectedSection === item.id}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: customTheme.palette.background.paper,
                    border: `1px solid ${customTheme.palette.divider}`,
                    '& .MuiListItemIcon-root': { color: customTheme.palette.primary.main },
                    '& .MuiListItemText-primary': { color: customTheme.palette.primary.main }
                  }
                }}
              >
                <ListItemIcon sx={{ color: customTheme.palette.text.secondary, minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    sx: { color: customTheme.palette.text.primary }
                  }}
                />
                {item.expandable && (
                  expandedSections[item.section] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>

              {item.expandable && (
                <Collapse in={expandedSections[item.section]} timeout="auto">
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.id}
                        onClick={() => handleSectionSelect(child.id)}
                        selected={selectedSection === child.id}
                        sx={{
                          pl: 4,
                          borderRadius: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            backgroundColor: customTheme.palette.background.paper,
                            border: `1px solid ${customTheme.palette.divider}`,
                            '& .MuiListItemIcon-root': { color: customTheme.palette.primary.main },
                            '& .MuiListItemText-primary': { color: customTheme.palette.primary.main }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: customTheme.palette.text.secondary, minWidth: 36 }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: { color: customTheme.palette.text.primary }
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>

        {/* Quick Actions */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Typography variant="subtitle2" sx={{ color: customTheme.palette.text.primary, mb: 1 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <IconButton 
                size="small" 
                sx={{ 
                  backgroundColor: customTheme.palette.background.paper, 
                  border: `1px solid ${customTheme.palette.divider}`,
                  '&:hover': { backgroundColor: customTheme.palette.action.hover }
                }}
              >
                <PlayArrow sx={{ color: customTheme.palette.success.main }} />
              </IconButton>
            </Grid>
            <Grid item xs={4}>
              <IconButton 
                size="small" 
                sx={{ 
                  backgroundColor: customTheme.palette.background.paper, 
                  border: `1px solid ${customTheme.palette.divider}`,
                  '&:hover': { backgroundColor: customTheme.palette.action.hover }
                }}
              >
                <Pause sx={{ color: customTheme.palette.warning.main }} />
              </IconButton>
            </Grid>
            <Grid item xs={4}>
              <IconButton 
                size="small" 
                sx={{ 
                  backgroundColor: customTheme.palette.background.paper, 
                  border: `1px solid ${customTheme.palette.divider}`,
                  '&:hover': { backgroundColor: customTheme.palette.action.hover }
                }}
              >
                <Stop sx={{ color: customTheme.palette.error.main }} />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: drawerOpen && !isMobile ? 'calc(100vw - 280px)' : '100vw',
          marginLeft: drawerOpen && !isMobile ? '280px' : '0px',
          marginTop: '64px',
          backgroundColor: customTheme.palette.background.default,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          position: 'fixed',
          top: '64px',
          right: 0,
          zIndex: 1000,
          transition: customTheme.transitions.create(['margin-left', 'width'], {
            easing: customTheme.transitions.easing.sharp,
            duration: customTheme.transitions.duration.leavingScreen,
          })
        }}
      >
        {/* Breadcrumbs */}
        <Box sx={{ 
          px: 3, 
          py: 2, 
          borderBottom: `1px solid ${customTheme.palette.divider}`,
          backgroundColor: customTheme.palette.background.paper,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <Breadcrumbs sx={{ color: customTheme.palette.text.secondary }}>
            <Link href="#" sx={{ color: customTheme.palette.primary.main, textDecoration: 'none' }}>
              Professional
            </Link>
            <Typography sx={{ color: customTheme.palette.text.primary }}>
              {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Content Area */}
        <Box sx={{ 
          flex: 1,
          backgroundColor: customTheme.palette.background.default,
          overflow: 'auto',
          height: 'calc(100% - 64px)' // Account for breadcrumbs
        }}>
          {renderContent()}
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          zIndex: 1400, // Above AppBar
          marginTop: '80px' // Below AppBar with some spacing
        }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          sx={{ 
            backgroundColor: customTheme.palette.success.main,
            color: customTheme.palette.text.primary,
            '& .MuiAlert-icon': { color: customTheme.palette.text.primary }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalTradingInterface;
