import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as BullishIcon,
  TrendingDown as BearishIcon,
  Remove as NeutralIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';

const UpstreamAnalysisResults = () => {
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
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [selectedAsset, setSelectedAsset] = useState('AAPL');

  // Mock analysis data for demonstration
  const mockAnalysisData = {
    timestamp: new Date().toISOString(),
    asset: selectedAsset,
    timeframe: selectedTimeframe,
    agents: [
      {
        id: 'fundamental_agent',
        name: 'Fundamental Analysis Agent',
        signal: 'bullish',
        confidence: 0.75,
        reasoning: 'Strong financial metrics with growing revenue and improving margins',
        metrics: {
          'P/E Ratio': '29.2',
          'ROE': '156.3%',
          'Debt/Equity': '1.73',
          'Revenue Growth': '8.2%'
        }
      },
      {
        id: 'technical_agent',
        name: 'Technical Analysis Agent',
        signal: 'neutral',
        confidence: 0.62,
        reasoning: 'Mixed technical signals with consolidation pattern forming',
        metrics: {
          'RSI': '52.4',
          'MACD': 'Bullish crossover',
          'Support': '$180.50',
          'Resistance': '$195.20'
        }
      },
      {
        id: 'sentiment_agent',
        name: 'Market Sentiment Agent',
        signal: 'bearish',
        confidence: 0.68,
        reasoning: 'Recent analyst downgrades and negative news flow',
        metrics: {
          'News Sentiment': '-0.23',
          'Social Media': 'Negative',
          'Analyst Rating': '3.2/5',
          'Institutional Flow': 'Outflow'
        }
      }
    ],
    consensus: {
      overall_signal: 'neutral',
      confidence: 0.68,
      bullish_count: 1,
      bearish_count: 1,
      neutral_count: 1
    },
    performance: {
      accuracy: '73.5%',
      profit_factor: '1.42',
      win_rate: '68.2%',
      max_drawdown: '-12.3%'
    }
  };

  useEffect(() => {
    // Simulate loading analysis data
    setLoading(true);
    setTimeout(() => {
      setAnalysisData(mockAnalysisData);
      setLoading(false);
    }, 1500);
  }, [selectedAsset, selectedTimeframe]);

  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'bullish': return <BullishIcon sx={{ color: colors.success, fontSize: 20 }} />;
      case 'bearish': return <BearishIcon sx={{ color: colors.error, fontSize: 20 }} />;
      default: return <NeutralIcon sx={{ color: colors.warning, fontSize: 20 }} />;
    }
  };

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'bullish': return colors.success;
      case 'bearish': return colors.error;
      default: return colors.warning;
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysisData({
        ...mockAnalysisData,
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: colors.background }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: colors.text.primary, mb: 2, fontWeight: 600 }}>
          <AnalyticsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Upstream Analysis Results
        </Typography>
        
        {/* Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Asset</InputLabel>
              <Select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                label="Asset"
              >
                <MenuItem value="AAPL">Apple (AAPL)</MenuItem>
                <MenuItem value="MSFT">Microsoft (MSFT)</MenuItem>
                <MenuItem value="GOOGL">Google (GOOGL)</MenuItem>
                <MenuItem value="TSLA">Tesla (TSLA)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                label="Timeframe"
              >
                <MenuItem value="1D">1 Day</MenuItem>
                <MenuItem value="1W">1 Week</MenuItem>
                <MenuItem value="1M">1 Month</MenuItem>
                <MenuItem value="3M">3 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              >
                {loading ? 'Analyzing...' : 'Refresh Analysis'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={!analysisData}
              >
                Export Results
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: colors.text.secondary }}>
            Running AI Agent Analysis...
          </Typography>
        </Box>
      ) : analysisData ? (
        <>
          {/* Consensus Summary */}
          <Card sx={{ mb: 3, backgroundColor: colors.surface }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: colors.text.primary }}>
                Analysis Consensus
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getSignalIcon(analysisData.consensus.overall_signal)}
                    <Typography variant="h5" sx={{ ml: 1, color: getSignalColor(analysisData.consensus.overall_signal), fontWeight: 600 }}>
                      {analysisData.consensus.overall_signal.toUpperCase()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    Overall Signal
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h5" sx={{ color: colors.text.primary, fontWeight: 600 }}>
                    {(analysisData.consensus.confidence * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    Confidence Level
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={`${analysisData.consensus.bullish_count} Bullish`} color="success" size="small" />
                    <Chip label={`${analysisData.consensus.bearish_count} Bearish`} color="error" size="small" />
                    <Chip label={`${analysisData.consensus.neutral_count} Neutral`} color="warning" size="small" />
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    Agent Distribution
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Agent Analysis Details */}
          <Typography variant="h6" sx={{ mb: 2, color: colors.text.primary }}>
            Individual Agent Analysis
          </Typography>
          
          {analysisData.agents.map((agent, index) => (
            <Accordion key={agent.id} sx={{ mb: 2, backgroundColor: colors.surface }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                  {getSignalIcon(agent.signal)}
                  <Typography variant="h6" sx={{ ml: 2, color: colors.text.primary, flexGrow: 1 }}>
                    {agent.name}
                  </Typography>
                  <Chip 
                    label={`${(agent.confidence * 100).toFixed(0)}%`}
                    size="small"
                    sx={{ backgroundColor: getSignalColor(agent.signal), color: 'white' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: colors.text.primary, mb: 1, fontWeight: 600 }}>
                      Analysis Reasoning
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
                      {agent.reasoning}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={agent.confidence * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: colors.border,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getSignalColor(agent.signal)
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: colors.text.primary, mb: 1, fontWeight: 600 }}>
                      Key Metrics
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          {Object.entries(agent.metrics).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell sx={{ color: colors.text.secondary, border: 'none', py: 0.5 }}>
                                {key}
                              </TableCell>
                              <TableCell sx={{ color: colors.text.primary, border: 'none', py: 0.5, fontWeight: 600 }}>
                                {value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Performance Metrics */}
          <Card sx={{ mt: 3, backgroundColor: colors.surface }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: colors.text.primary }}>
                <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Historical Performance
              </Typography>
              <Grid container spacing={3}>
                {Object.entries(analysisData.performance).map(([key, value]) => (
                  <Grid item xs={6} sm={3} key={key}>
                    <Typography variant="h6" sx={{ color: colors.text.primary, fontWeight: 600 }}>
                      {value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select an asset and timeframe to view analysis results.
        </Alert>
      )}
    </Box>
  );
};

export default UpstreamAnalysisResults;
