import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Speed as SpeedIcon,
  CloudQueue as CloudIcon,
  LocalOffer as CostIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  PlayArrow as RunIcon,
  Settings as ConfigIcon,
  Assessment as CompareIcon,
  TrendingUp as BullishIcon,
  TrendingDown as BearishIcon,
  Remove as NeutralIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';
import upstreamDataService from '../../services/upstreamDataService';
import { API_ENDPOINTS } from '../../config/api';

const UpstreamDashboard = () => {
  const { theme, isDarkMode, financialColors } = useCustomTheme();
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    background: theme.palette.background.default,
    surface: theme.palette.background.paper,
    text: {
      primary: theme.palette.text.primary,
      secondary: theme.palette.text.secondary,
      disabled: theme.palette.text.disabled
    },
    border: theme.palette.divider,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main
  };
  // Provider and UI state
  const [selectedProvider, setSelectedProvider] = useState('anthropic-claude');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stock selection and analysis state
  const [selectedTickers, setSelectedTickers] = useState(['AAPL']);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonResults, setComparisonResults] = useState({});
  const [maxTokens, setMaxTokens] = useState(4000);
  const [temperature, setTemperature] = useState(0.7);
  const [analysisType, setAnalysisType] = useState('standard');

  // Available stock options for autocomplete
  const [stockOptions] = useState([
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 
    'CRM', 'ORCL', 'AMD', 'INTC', 'CSCO', 'ADBE', 'PYPL', 'SHOP'
  ]);

  useEffect(() => {
    loadProviderData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadProviderData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadProviderData = async () => {
    try {
      setError(null);
      const data = await upstreamDataService.getLLMPerformanceMetrics();
      setProviders(data.providers || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading provider data:', err);
      setError('Failed to load LLM performance data. Using cached data if available.');
      // Keep existing data if load fails
    } finally {
      setIsLoading(false);
    }
  };

  // Real analysis function that calls backend API
  const handleRunAnalysis = async () => {
    if (selectedTickers.length === 0) {
      setError('Please select at least one stock ticker for analysis.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickers: selectedTickers.join(','),
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          end_date: new Date().toISOString().split('T')[0], // today
          initial_cash: 100000,
          provider: selectedProvider,
          max_tokens: maxTokens,
          temperature: temperature,
          analysis_type: analysisType
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisResults(data);
      setLastUpdate(new Date());
      
      // Store results for comparison if in comparison mode
      if (comparisonMode) {
        setComparisonResults(prev => ({
          ...prev,
          [selectedProvider]: {
            ...data,
            timestamp: new Date(),
            provider: selectedProvider
          }
        }));
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis failed: ${err.message}. Please check if the backend is running.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle comparison mode analysis
  const handleCompareProviders = async () => {
    setComparisonMode(true);
    setComparisonResults({});
    
    const providersToCompare = providers.filter(p => p.status === 'active').slice(0, 3);
    
    for (const provider of providersToCompare) {
      setSelectedProvider(provider.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between requests
      await handleRunAnalysis();
    }
  };

  const ProviderCard = ({ provider, isSelected, onSelect }) => (
    <Card
      sx={{
        cursor: 'pointer',
        border: isSelected ? `2px solid ${provider.color}` : `1px solid ${colors.border}`,
        backgroundColor: isSelected ? `${provider.color}08` : colors.surface,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${provider.color}40`,
        }
      }}
      onClick={() => onSelect(provider.id)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: provider.color,
              mr: 1
            }}
          />
          <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 'bold' }}>
            {provider.name}
          </Typography>
          {provider.status === 'local' && (
            <Chip
              label="LOCAL"
              size="small"
              sx={{
                ml: 'auto',
                fontSize: '10px',
                height: '18px',
                backgroundColor: colors.success + '20',
                color: colors.success
              }}
            />
          )}
        </Box>
        
        <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1, display: 'block' }}>
          {provider.provider}
        </Typography>

        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                Cost
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'bold', fontSize: '11px' }}>
                {provider.cost}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                Speed
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'bold', fontSize: '11px' }}>
                {provider.speed}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                Accuracy
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'bold', fontSize: '11px' }}>
                {provider.accuracy}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ 
          color: colors.text, 
          fontWeight: 'bold', 
          mb: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <AIIcon sx={{ mr: 1, color: colors.primary }} />
          Multi-LLM Analysis Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          Select and configure multiple LLM providers for enhanced AI agent analysis
        </Typography>
      </Box>

      {/* Stock Ticker Selection */}
      <Card sx={{ 
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        mb: 3
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: colors.text, mb: 2, display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 1, color: colors.primary }} />
            Stock Selection
          </Typography>
          
          <Autocomplete
            multiple
            options={stockOptions}
            value={selectedTickers}
            onChange={(event, newValue) => setSelectedTickers(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Stock Tickers"
                placeholder="Add tickers (e.g., AAPL, MSFT)"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: colors.border },
                    '&:hover fieldset': { borderColor: colors.primary },
                    '&.Mui-focused fieldset': { borderColor: colors.primary }
                  }
                }}
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: colors.primary + '20',
                    color: colors.primary,
                    '& .MuiChip-deleteIcon': { color: colors.primary }
                  }}
                />
              ))
            }
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Select one or more stock tickers for multi-LLM analysis. Results will be compared across different AI providers.
          </Typography>
        </CardContent>
      </Card>

      {/* Provider Selection */}
      <Card sx={{ 
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        mb: 3
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: colors.text, mb: 2, display: 'flex', alignItems: 'center' }}>
            <CloudIcon sx={{ mr: 1, color: colors.primary }} />
            LLM Provider Selection
          </Typography>

          <Grid container spacing={2}>
            {providers.map((provider) => (
              <Grid item xs={12} sm={6} md={4} key={provider.id}>
                <ProviderCard
                  provider={provider}
                  isSelected={selectedProvider === provider.id}
                  onSelect={setSelectedProvider}
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3, backgroundColor: colors.border }} />

          {/* Multi-Provider Comparison */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.primary,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: colors.text }}>
                  Enable Auto-Refresh
                </Typography>
              }
            />
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                backgroundColor: `${colors.error}10`,
                borderColor: colors.error + '40',
                '& .MuiAlert-icon': { color: colors.error },
                '& .MuiAlert-message': { color: colors.text }
              }}
            >
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Configuration */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: colors.text, mb: 2, display: 'flex', alignItems: 'center' }}>
                <ConfigIcon sx={{ mr: 1, color: colors.primary }} />
                Analysis Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Tokens"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    type="number"
                    inputProps={{ min: 1000, max: 8000, step: 500 }}
                    sx={{
                      '& .MuiInputLabel-root': { color: colors.textSecondary },
                      '& .MuiOutlinedInput-root': {
                        color: colors.text,
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.primary },
                        '&.Mui-focused fieldset': { borderColor: colors.primary }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    type="number"
                    inputProps={{ step: 0.1, min: 0, max: 2 }}
                    sx={{
                      '& .MuiInputLabel-root': { color: colors.textSecondary },
                      '& .MuiOutlinedInput-root': {
                        color: colors.text,
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.primary },
                        '&.Mui-focused fieldset': { borderColor: colors.primary }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: colors.textSecondary }}>Analysis Type</InputLabel>
                    <Select
                      value={analysisType}
                      onChange={(e) => setAnalysisType(e.target.value)}
                      label="Analysis Type"
                      sx={{
                        color: colors.text,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary }
                      }}
                    >
                      <MenuItem value="quick">Quick Analysis</MenuItem>
                      <MenuItem value="standard">Standard Analysis</MenuItem>
                      <MenuItem value="comprehensive">Comprehensive Analysis</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={comparisonMode}
                        onChange={(e) => setComparisonMode(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: colors.primary,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: colors.primary,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: colors.text }}>
                        Multi-Provider Comparison Mode
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            mb: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: colors.text, mb: 2 }}>
                Quick Actions
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={isAnalyzing ? <RefreshIcon /> : <RunIcon />}
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                sx={{
                  mb: 2,
                  backgroundColor: colors.primary,
                  '&:hover': { backgroundColor: colors.primary + 'DD' },
                  '&:disabled': { backgroundColor: colors.textSecondary + '40' }
                }}
              >
                {isAnalyzing ? 'Running Analysis...' : 'Run Multi-LLM Analysis'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={handleCompareProviders}
                disabled={isAnalyzing || selectedTickers.length === 0}
                sx={{
                  borderColor: colors.border,
                  color: colors.text,
                  '&:hover': {
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '10'
                  },
                  '&:disabled': {
                    borderColor: colors.textSecondary + '40',
                    color: colors.textSecondary + '60'
                  }
                }}
              >
                {comparisonMode ? 'Comparing Providers...' : 'Compare Results'}
              </Button>

              {isAnalyzing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="indeterminate"
                    sx={{
                      backgroundColor: colors.border,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: colors.primary
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 1, display: 'block' }}>
                    {comparisonMode ? `Comparing providers (${Object.keys(comparisonResults).length} completed)` : `Processing with ${selectedProvider}...`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card sx={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: colors.text, mb: 2 }}>
                Performance Stats
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Avg Response Time
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.success }}>
                    1.8s
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{
                    backgroundColor: colors.border,
                    '& .MuiLinearProgress-bar': { backgroundColor: colors.success }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Accuracy Score
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.primary }}>
                    96%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={96}
                  sx={{
                    backgroundColor: colors.border,
                    '& .MuiLinearProgress-bar': { backgroundColor: colors.primary }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    Cost Efficiency
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.warning }}>
                    $0.12/analysis
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={85}
                  sx={{
                    backgroundColor: colors.border,
                    '& .MuiLinearProgress-bar': { backgroundColor: colors.warning }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Results Section */}
      {analysisResults && (
        <Card sx={{ 
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          mt: 3
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: colors.text, mb: 2, display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 1, color: colors.primary }} />
              Analysis Results
            </Typography>
            
            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ backgroundColor: colors.primary + '10', border: `1px solid ${colors.primary}40` }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h5" sx={{ color: colors.primary, fontWeight: 'bold' }}>
                      {analysisResults.agents?.length || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text }}>
                      Active Agents
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ backgroundColor: colors.success + '10', border: `1px solid ${colors.success}40` }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h5" sx={{ color: colors.success, fontWeight: 'bold' }}>
                      {analysisResults.decisions?.length || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text }}>
                      Decisions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ backgroundColor: colors.info + '10', border: `1px solid ${colors.info}40` }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h5" sx={{ color: colors.info, fontWeight: 'bold' }}>
                      {selectedTickers.length}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text }}>
                      Stocks Analyzed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ backgroundColor: colors.warning + '10', border: `1px solid ${colors.warning}40` }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h5" sx={{ color: colors.warning, fontWeight: 'bold' }}>
                      {selectedProvider.toUpperCase()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text }}>
                      Provider Used
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Agent Signals Display */}
            {analysisResults.agents && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: colors.text, mb: 2 }}>
                  Agent Signals
                </Typography>
                <Grid container spacing={2}>
                  {analysisResults.agents.slice(0, 6).map((agent, index) => {
                    const agentData = selectedTickers.length === 1 
                      ? agent.data 
                      : agent.data?.[selectedTickers[0]];
                    
                    const signal = agentData?.signal || 'neutral';
                    const confidence = agentData?.confidence || 0;
                    
                    const getSignalIcon = (signal) => {
                      switch(signal.toLowerCase()) {
                        case 'bullish': return <BullishIcon sx={{ color: colors.success }} />;
                        case 'bearish': return <BearishIcon sx={{ color: colors.error }} />;
                        default: return <NeutralIcon sx={{ color: colors.warning }} />;
                      }
                    };
                    
                    const getSignalColor = (signal) => {
                      switch(signal.toLowerCase()) {
                        case 'bullish': return colors.success;
                        case 'bearish': return colors.error;
                        default: return colors.warning;
                      }
                    };
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ 
                          backgroundColor: colors.surface,
                          border: `1px solid ${getSignalColor(signal)}40`,
                          '&:hover': { borderColor: getSignalColor(signal) }
                        }}>
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                {getSignalIcon(signal)}
                                <Box sx={{ ml: 1 }}>
                                  <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'medium' }}>
                                    {agent.agent_name?.replace('_', ' ')?.toUpperCase() || `Agent ${index + 1}`}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: getSignalColor(signal) }}>
                                    {signal.toUpperCase()}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip 
                                label={`${Math.round(confidence)}%`}
                                size="small"
                                sx={{ 
                                  backgroundColor: getSignalColor(signal) + '20',
                                  color: getSignalColor(signal),
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {Object.keys(comparisonResults).length > 0 && (
        <Card sx={{ 
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          mt: 3
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: colors.text, mb: 2, display: 'flex', alignItems: 'center' }}>
              <CompareIcon sx={{ mr: 1, color: colors.primary }} />
              Provider Comparison Results
            </Typography>
            
            <Grid container spacing={3}>
              {Object.entries(comparisonResults).map(([providerName, result]) => (
                <Grid item xs={12} md={6} lg={4} key={providerName}>
                  <Card sx={{ 
                    backgroundColor: colors.primary + '05',
                    border: `1px solid ${colors.primary}20`,
                    height: '100%'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: colors.primary, mb: 2 }}>
                        {providerName.toUpperCase()}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: colors.text, mb: 1 }}>
                          Agents: {result.agents?.length || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.text, mb: 1 }}>
                          Decisions: {result.decisions?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                          Analyzed at: {result.timestamp?.toLocaleTimeString()}
                        </Typography>
                      </Box>
                      
                      {result.agents && result.agents.slice(0, 3).map((agent, idx) => {
                        const agentData = selectedTickers.length === 1 
                          ? agent.data 
                          : agent.data?.[selectedTickers[0]];
                        const signal = agentData?.signal || 'neutral';
                        const confidence = agentData?.confidence || 0;
                        
                        return (
                          <Box key={idx} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 1,
                            p: 1,
                            backgroundColor: colors.surface,
                            borderRadius: 1
                          }}>
                            <Typography variant="caption" sx={{ color: colors.text }}>
                              {agent.agent_name?.replace('_', ' ') || `Agent ${idx + 1}`}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={signal}
                                size="small"
                                sx={{ 
                                  backgroundColor: signal === 'bullish' ? colors.success + '20' : 
                                                   signal === 'bearish' ? colors.error + '20' : colors.warning + '20',
                                  color: signal === 'bullish' ? colors.success : 
                                         signal === 'bearish' ? colors.error : colors.warning,
                                  fontSize: '0.7rem'
                                }}
                              />
                              <Typography variant="caption" sx={{ color: colors.text, fontWeight: 'bold' }}>
                                {Math.round(confidence)}%
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
      
    </Box>
  );
};

export default UpstreamDashboard;
