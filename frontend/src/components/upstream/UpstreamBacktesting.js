import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  ShowChart as ChartIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';

const UpstreamBacktesting = () => {
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
  const [isRunning, setIsRunning] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [progress, setProgress] = useState(0);

  // Backtest configuration state
  const [config, setConfig] = useState({
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    initialCapital: 100000,
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    strategy: 'ai_consensus',
    rebalanceFreq: 'monthly',
    maxPositions: 5,
    stopLoss: 0.1,
    takeProfit: 0.2,
    useRiskManagement: true
  });

  // Mock backtest results
  const mockResults = {
    summary: {
      totalReturn: '24.3%',
      annualizedReturn: '22.1%',
      sharpeRatio: '1.87',
      maxDrawdown: '-8.5%',
      winRate: '68.2%',
      totalTrades: 147,
      profitFactor: '2.34'
    },
    monthlyReturns: [
      { month: '2023-01', return: 0.053 },
      { month: '2023-02', return: -0.021 },
      { month: '2023-03', return: 0.087 },
      { month: '2023-04', return: 0.034 },
      { month: '2023-05', return: -0.012 },
      { month: '2023-06', return: 0.076 },
      { month: '2023-07', return: 0.045 },
      { month: '2023-08', return: 0.023 },
      { month: '2023-09', return: -0.034 },
      { month: '2023-10', return: 0.091 },
      { month: '2023-11', return: 0.067 },
      { month: '2023-12', return: 0.028 }
    ],
    trades: [
      {
        symbol: 'AAPL',
        entryDate: '2023-02-15',
        exitDate: '2023-03-20',
        entryPrice: 152.34,
        exitPrice: 167.89,
        quantity: 65,
        pnl: 1010.75,
        return: '10.2%'
      },
      {
        symbol: 'MSFT',
        entryDate: '2023-03-10',
        exitDate: '2023-04-25',
        entryPrice: 289.45,
        exitPrice: 312.67,
        quantity: 32,
        pnl: 743.04,
        return: '8.0%'
      },
      {
        symbol: 'GOOGL',
        entryDate: '2023-04-05',
        exitDate: '2023-05-15',
        entryPrice: 103.89,
        exitPrice: 98.23,
        quantity: 95,
        pnl: -537.70,
        return: '-5.4%'
      }
    ],
    equity_curve: [
      { date: '2023-01-01', value: 100000 },
      { date: '2023-02-01', value: 105300 },
      { date: '2023-03-01', value: 103187 },
      { date: '2023-04-01', value: 112174 },
      { date: '2023-05-01', value: 115988 },
      { date: '2023-06-01', value: 114596 },
      { date: '2023-07-01', value: 123305 },
      { date: '2023-08-01', value: 128852 },
      { date: '2023-09-01', value: 131813 },
      { date: '2023-10-01', value: 127330 },
      { date: '2023-11-01', value: 138920 },
      { date: '2023-12-01', value: 148227 },
      { date: '2024-01-01', value: 152375 }
    ]
  };

  const runBacktest = async () => {
    setIsRunning(true);
    setProgress(0);
    setBacktestResults(null);

    // Simulate backtest progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsRunning(false);
          setBacktestResults(mockResults);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const stopBacktest = () => {
    setIsRunning(false);
    setProgress(0);
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <Box sx={{ p: 3, backgroundColor: colors.background }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: colors.text.primary, mb: 2, fontWeight: 600 }}>
          <TimelineIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Upstream Backtesting Engine
        </Typography>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          Test your AI agent strategies against historical market data
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ backgroundColor: colors.surface, height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: colors.text.primary, mb: 3 }}>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Backtest Configuration
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => handleConfigChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Initial Capital"
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => handleConfigChange('initialCapital', parseInt(e.target.value))}
                  sx={{ mb: 2 }}
                />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Strategy</InputLabel>
                <Select
                  value={config.strategy}
                  onChange={(e) => handleConfigChange('strategy', e.target.value)}
                  label="Strategy"
                >
                  <MenuItem value="ai_consensus">AI Agent Consensus</MenuItem>
                  <MenuItem value="momentum">Momentum Strategy</MenuItem>
                  <MenuItem value="mean_reversion">Mean Reversion</MenuItem>
                  <MenuItem value="trend_following">Trend Following</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Rebalance Frequency</InputLabel>
                <Select
                  value={config.rebalanceFreq}
                  onChange={(e) => handleConfigChange('rebalanceFreq', e.target.value)}
                  label="Rebalance Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                  Stop Loss: {formatPercent(config.stopLoss)}
                </Typography>
                <Slider
                  value={config.stopLoss}
                  onChange={(e, value) => handleConfigChange('stopLoss', value)}
                  min={0.05}
                  max={0.3}
                  step={0.01}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatPercent}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.useRiskManagement}
                    onChange={(e) => handleConfigChange('useRiskManagement', e.target.checked)}
                  />
                }
                label="Use Risk Management"
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={runBacktest}
                  disabled={isRunning}
                  startIcon={isRunning ? <CircularProgress size={16} /> : <PlayIcon />}
                  fullWidth
                  sx={{ backgroundColor: colors.primary }}
                >
                  {isRunning ? 'Running...' : 'Run Backtest'}
                </Button>
                {isRunning && (
                  <Button
                    variant="outlined"
                    onClick={stopBacktest}
                    startIcon={<StopIcon />}
                  >
                    Stop
                  </Button>
                )}
              </Box>

              {isRunning && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                    Progress: {progress.toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.border,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: colors.primary
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} lg={8}>
          {backtestResults ? (
            <>
              {/* Performance Summary */}
              <Card sx={{ backgroundColor: colors.surface, mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: colors.text.primary }}>
                      <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Performance Summary
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      size="small"
                    >
                      Export
                    </Button>
                  </Box>

                  <Grid container spacing={3}>
                    {Object.entries(backtestResults.summary).map(([key, value]) => (
                      <Grid item xs={6} sm={4} md={3} key={key}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ 
                            color: key.includes('Return') && value.includes('-') ? colors.error : colors.success,
                            fontWeight: 600 
                          }}>
                            {value}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Monthly Returns */}
              <Accordion sx={{ backgroundColor: colors.surface, mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ color: colors.text.primary }}>
                    <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Monthly Returns Breakdown
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {backtestResults.monthlyReturns.map((month, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          border: `1px solid ${colors.border}`, 
                          borderRadius: 1,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                            {month.month}
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: month.return >= 0 ? colors.success : colors.error,
                            fontWeight: 600 
                          }}>
                            {formatPercent(month.return)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Trade History */}
              <Accordion sx={{ backgroundColor: colors.surface }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ color: colors.text.primary }}>
                    Recent Trades (Top 3)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: colors.text.secondary }}>Symbol</TableCell>
                          <TableCell sx={{ color: colors.text.secondary }}>Entry</TableCell>
                          <TableCell sx={{ color: colors.text.secondary }}>Exit</TableCell>
                          <TableCell sx={{ color: colors.text.secondary }}>Quantity</TableCell>
                          <TableCell sx={{ color: colors.text.secondary }}>P&L</TableCell>
                          <TableCell sx={{ color: colors.text.secondary }}>Return</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backtestResults.trades.map((trade, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip label={trade.symbol} size="small" />
                            </TableCell>
                            <TableCell sx={{ color: colors.text.secondary }}>
                              {trade.entryDate}<br />
                              {formatCurrency(trade.entryPrice)}
                            </TableCell>
                            <TableCell sx={{ color: colors.text.secondary }}>
                              {trade.exitDate}<br />
                              {formatCurrency(trade.exitPrice)}
                            </TableCell>
                            <TableCell sx={{ color: colors.text.secondary }}>
                              {trade.quantity}
                            </TableCell>
                            <TableCell sx={{ 
                              color: trade.pnl >= 0 ? colors.success : colors.error,
                              fontWeight: 600 
                            }}>
                              {formatCurrency(trade.pnl)}
                            </TableCell>
                            <TableCell sx={{ 
                              color: trade.return.includes('-') ? colors.error : colors.success,
                              fontWeight: 600 
                            }}>
                              {trade.return}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </>
          ) : (
            <Card sx={{ backgroundColor: colors.surface, height: 400 }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}>
                <ChartIcon sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }} />
                <Typography variant="h6" sx={{ color: colors.text.secondary, mb: 1 }}>
                  No Backtest Results
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.disabled, textAlign: 'center' }}>
                  Configure your strategy parameters and click "Run Backtest" to see results
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default UpstreamBacktesting;
