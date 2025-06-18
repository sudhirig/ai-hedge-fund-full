import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Grid,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stack,
  LinearProgress
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import axios from 'axios';
import AgentAvatar from './AgentAvatars';
import { API_ENDPOINTS, checkBackendHealth } from '../config/api';

// Default values for the form
const DEFAULT_TICKERS = "AAPL,MSFT";
const DEFAULT_START_DATE = "2024-01-01";
const DEFAULT_END_DATE = "2024-04-30";
const DEFAULT_CASH = 100000;
const DEFAULT_MARGIN = 0.0;

// Available analysts
const AVAILABLE_ANALYSTS = [
  { name: "Fundamental Analysis Agent", value: "fundamental_analysis" },
  { name: "Technical Analyst", value: "technical_analysis" },
  { name: "Valuation Analysis Agent", value: "valuation_analysis" },
  { name: "Sentiment Analysis Agent", value: "sentiment_analysis" },
  { name: "Ben Graham Agent", value: "ben_graham" },
  { name: "Cathie Wood Agent", value: "cathie_wood" },
  { name: "Bill Ackman Agent", value: "bill_ackman" },
  { name: "Phil Fisher Agent", value: "phil_fisher" },
  { name: "Warren Buffett Agent", value: "warren_buffett" },
  { name: "Charlie Munger Agent", value: "charlie_munger" },
  { name: "Stanley Druckenmiller Agent", value: "stanley_druckenmiller" },
  { name: "Risk Management Agent", value: "risk_management" },
  { name: "Portfolio Management Agent", value: "portfolio_management" }
];

// Colors for charts
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const TRADE_COLORS = {
  buy: '#4caf50',
  sell: '#f44336',
  short: '#9c27b0',
  cover: '#ff9800',
  hold: '#9e9e9e'
};

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to format percentage
const formatPercentage = (value) => {
  return `${value.toFixed(2)}%`;
};

function BacktestDashboard() {
  // Form state
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
  const [initialCash, setInitialCash] = useState(DEFAULT_CASH);
  const [marginRequirement, setMarginRequirement] = useState(DEFAULT_MARGIN);
  const [selectedAnalysts, setSelectedAnalysts] = useState(['portfolio_management']);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  
  // Handle form submission
  const runBacktest = async () => {
    setLoading(true);
    setError('');  // Reset any previous errors
    
    try {
      console.log('Running backtest with params:', {
        tickers,
        start_date: startDate,
        end_date: endDate,
        initial_cash: initialCash,
        margin_requirement: marginRequirement,
        selected_analysts: selectedAnalysts
      });
      
      // Use the local backend server with API_BASE_URL
      const apiUrl = API_ENDPOINTS.BACKTEST;
      console.log('Using API URL:', apiUrl);
      
      // Ensure tickers are sent as a comma-separated string as expected by the backend
      const tickersString = Array.isArray(tickers) ? tickers.join(',') : tickers;
      
      const response = await axios.post(apiUrl, {
        tickers: tickersString,
        start_date: startDate,
        end_date: endDate,
        initial_cash: initialCash,
        margin_requirement: marginRequirement,
        selected_analysts: selectedAnalysts
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Received backtest response:', response.data);
      
      if (response.data) {
        // Force a re-render by creating a new object
        setResult({...response.data});
        // Switch to the results tab
        setTab(0);
      } else {
        setError('Received empty response from server');
      }
    } catch (err) {
      console.error('Error during backtest API call:', err);
      if (err.message === 'Network Error') {
        setError(`Network Error: Cannot connect to the backend server. Please ensure the backend is running at ${API_ENDPOINTS.BASE_URL}. Details: ${err.message}`);
        // Try a test request to the backend to check if it's responding
        try {
          await checkBackendHealth();
          console.log('Backend is accessible');
          setError('Backend server is reachable but the specific backtesting endpoint may have an issue. Please try again.');
        } catch (testErr) {
          console.error('Backend server test request failed:', testErr);
        }
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };
  
  // Handle analyst selection change
  const handleAnalystChange = (event) => {
    setSelectedAnalysts(event.target.value);
  };
  
  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Capital Global Multi-Agent Hedge Fund Backtester
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Backtest your AI hedge fund strategy across different time periods and market conditions.
        Select your preferred analysts, set your parameters, and analyze the performance.
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField 
            label="Tickers" 
            value={tickers} 
            onChange={e => setTickers(e.target.value)} 
            fullWidth 
            helperText="Comma-separated (e.g., AAPL,MSFT)" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField 
            label="Start Date" 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            fullWidth 
            InputLabelProps={{ shrink: true }} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField 
            label="End Date" 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            fullWidth 
            InputLabelProps={{ shrink: true }} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField 
            label="Initial Cash ($)" 
            type="number" 
            value={initialCash} 
            onChange={e => setInitialCash(Number(e.target.value))} 
            fullWidth 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="margin-requirement-label">Margin Requirement</InputLabel>
            <Select
              labelId="margin-requirement-label"
              value={marginRequirement}
              label="Margin Requirement"
              onChange={e => setMarginRequirement(Number(e.target.value))}
            >
              <MenuItem value={0.0}>No Margin (0%)</MenuItem>
              <MenuItem value={0.25}>25% Margin</MenuItem>
              <MenuItem value={0.5}>50% Margin</MenuItem>
              <MenuItem value={0.75}>75% Margin</MenuItem>
              <MenuItem value={1.0}>100% Margin</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="analysts-label">Select Analysts</InputLabel>
          <Select
            labelId="analysts-label"
            multiple
            value={selectedAnalysts}
            onChange={handleAnalystChange}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const analyst = AVAILABLE_ANALYSTS.find(a => a.value === value);
                  return (
                    <Chip 
                      key={value} 
                      label={analyst ? analyst.name : value} 
                      size="small" 
                      avatar={<AgentAvatar agent={analyst ? analyst.name : value} sx={{ width: 24, height: 24 }} />}
                    />
                  );
                })}
              </Box>
            )}
          >
            {AVAILABLE_ANALYSTS.map((analyst) => (
              <MenuItem key={analyst.value} value={analyst.value}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AgentAvatar agent={analyst.name} sx={{ width: 24, height: 24, mr: 1 }} />
                  {analyst.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={runBacktest} 
        disabled={loading} 
        size="large"
        fullWidth
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={24} /> : "Run Backtest"}
      </Button>
      
      <Divider sx={{ my: 3 }} />
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {result && (
        <Box>
          <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tab label="Performance" />
            <Tab label="Trades" />
            <Tab label="Agents" />
            <Tab label="Terminal Output" />
            <Tab label="Raw Output" />
          </Tabs>
          
          {tab === 0 && <PerformanceTab result={result} />}
          {tab === 1 && <TradesTab result={result} />}
          {tab === 2 && <AgentsTab result={result} />}
          {tab === 3 && <TerminalOutputTab result={result} />}
          {tab === 4 && <RawOutputTab result={result} />}
        </Box>
      )}
    </Paper>
  );
}

// Performance Tab Component
function PerformanceTab({ result }) {
  const { performance_metrics, portfolio_values } = result;
  
  // Format portfolio values for display
  const portfolioData = portfolio_values?.map(item => ({
    date: item.date,
    value: item.value
  })) || [];
  
  // Calculate daily returns
  const returnsData = [];
  for (let i = 1; i < portfolioData.length; i++) {
    const prevValue = portfolioData[i-1].value;
    const currentValue = portfolioData[i].value;
    const dailyReturn = ((currentValue - prevValue) / prevValue) * 100;
    
    returnsData.push({
      date: portfolioData[i].date,
      return: dailyReturn
    });
  }
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Performance Metrics Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Return</Typography>
              <Typography 
                variant="h3" 
                color={performance_metrics?.total_return >= 0 ? 'success.main' : 'error.main'}
              >
                {performance_metrics?.total_return ? formatPercentage(performance_metrics.total_return) : 'N/A'}
              </Typography>
              {performance_metrics?.total_return >= 0 ? 
                <TrendingUpIcon color="success" fontSize="large" /> : 
                <TrendingDownIcon color="error" fontSize="large" />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sharpe Ratio</Typography>
              <Typography 
                variant="h3" 
                color={performance_metrics?.sharpe_ratio >= 1 ? 'success.main' : 
                       (performance_metrics?.sharpe_ratio >= 0 ? 'warning.main' : 'error.main')}
              >
                {performance_metrics?.sharpe_ratio ? performance_metrics.sharpe_ratio.toFixed(2) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Maximum Drawdown</Typography>
              <Typography variant="h3" color="error.main">
                {performance_metrics?.max_drawdown ? formatPercentage(performance_metrics.max_drawdown) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Win Rate</Typography>
              <Typography 
                variant="h3" 
                color={performance_metrics?.win_rate >= 50 ? 'success.main' : 'warning.main'}
              >
                {performance_metrics?.win_rate ? formatPercentage(performance_metrics.win_rate) : 'N/A'}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={performance_metrics?.win_rate || 0} 
                color={performance_metrics?.win_rate >= 50 ? "success" : "warning"}
                sx={{ height: 10, borderRadius: 5, mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Win/Loss Ratio</Typography>
              <Typography 
                variant="h3" 
                color={performance_metrics?.win_loss_ratio >= 1 ? 'success.main' : 'warning.main'}
              >
                {performance_metrics?.win_loss_ratio ? performance_metrics.win_loss_ratio.toFixed(2) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Portfolio Value Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Portfolio Value Over Time</Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Portfolio Value</TableCell>
                      <TableCell align="right">Change</TableCell>
                      <TableCell align="right">Daily Return</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolioData.map((item, index) => {
                      const prevValue = index > 0 ? portfolioData[index-1].value : item.value;
                      const change = item.value - prevValue;
                      const dailyReturn = index > 0 ? ((item.value - prevValue) / prevValue) * 100 : 0;
                      
                      return (
                        <TableRow key={item.date}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell align="right">{formatCurrency(item.value)}</TableCell>
                          <TableCell align="right" sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}>
                            {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            {change >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                          </TableCell>
                          <TableCell align="right" sx={{ color: dailyReturn >= 0 ? 'success.main' : 'error.main' }}>
                            {dailyReturn >= 0 ? '+' : ''}{formatPercentage(dailyReturn)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Daily Returns Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Daily Returns</Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Return</TableCell>
                      <TableCell align="center">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returnsData.map((item) => (
                      <TableRow key={item.date}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: item.return >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {item.return >= 0 ? '+' : ''}{formatPercentage(item.return)}
                        </TableCell>
                        <TableCell align="center">
                          {item.return > 1 ? <TrendingUpIcon color="success" /> : 
                           item.return < -1 ? <TrendingDownIcon color="error" /> : 
                           <TrendingFlatIcon color="action" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Trades Tab Component
function TradesTab({ result }) {
  const { trades = [], decisions = {} } = result;
  
  // Group trades by ticker
  const tradesByTicker = {};
  trades.forEach(trade => {
    if (!tradesByTicker[trade.ticker]) {
      tradesByTicker[trade.ticker] = [];
    }
    tradesByTicker[trade.ticker].push(trade);
  });
  
  // Create timeline data
  const timelineData = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Trades Timeline */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Trade Timeline</Typography>
              {timelineData.length > 0 ? (
                <List>
                  {timelineData.map((trade, index) => (
                    <ListItem key={index} divider={index < timelineData.length - 1}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: TRADE_COLORS[trade.action.toLowerCase()] || 'grey' }}>
                          {trade.action.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body1" fontWeight="bold">
                              {trade.ticker}: {trade.action.toUpperCase()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {trade.date}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2">
                              {trade.quantity} shares @ {formatCurrency(trade.price)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total: {formatCurrency(trade.quantity * trade.price)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 3 }}>
                  No trade data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Trades Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Trade History</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Ticker</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timelineData.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{trade.date}</TableCell>
                        <TableCell>{trade.ticker}</TableCell>
                        <TableCell>
                          <Chip 
                            label={trade.action.toUpperCase()} 
                            size="small" 
                            sx={{ 
                              bgcolor: TRADE_COLORS[trade.action.toLowerCase()] || 'grey',
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">{trade.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(trade.price)}</TableCell>
                        <TableCell align="right">{formatCurrency(trade.quantity * trade.price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Trades by Ticker */}
        {Object.keys(tradesByTicker).map(ticker => (
          <Grid item xs={12} md={6} key={ticker}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{ticker} Trades</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradesByTicker[ticker].map((trade, index) => (
                        <TableRow key={index}>
                          <TableCell>{trade.date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={trade.action.toUpperCase()} 
                              size="small" 
                              sx={{ 
                                bgcolor: TRADE_COLORS[trade.action.toLowerCase()] || 'grey',
                                color: 'white'
                              }} 
                            />
                          </TableCell>
                          <TableCell align="right">{trade.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(trade.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Agents Tab Component
function AgentsTab({ result }) {
  const { agents = {}, decisions = {} } = result;
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Agent Decision Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Agent Decisions</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticker</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                      <TableCell>Reasoning</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(decisions).map(([ticker, decision]) => (
                      <TableRow key={ticker}>
                        <TableCell>{ticker}</TableCell>
                        <TableCell>
                          <Chip 
                            label={decision.action.toUpperCase()} 
                            size="small" 
                            sx={{ 
                              bgcolor: TRADE_COLORS[decision.action.toLowerCase()] || 'grey',
                              color: 'white'
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">{decision.quantity}</TableCell>
                        <TableCell align="right">{decision.confidence}%</TableCell>
                        <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {decision.reasoning}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Individual Agent Cards */}
        {Object.entries(agents).map(([agentName, agentData]) => (
          <Grid item xs={12} md={6} key={agentName}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AgentAvatar agent={agentName} sx={{ width: 40, height: 40, mr: 2 }} />
                  <Typography variant="h6">{agentName}</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {typeof agentData === 'object' ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ticker</TableCell>
                          <TableCell>Signal</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(agentData).map(([ticker, data]) => (
                          <TableRow key={ticker}>
                            <TableCell>{ticker}</TableCell>
                            <TableCell>
                              {data.signal && (
                                <Chip 
                                  label={data.signal.toUpperCase()} 
                                  size="small" 
                                  color={
                                    data.signal.toLowerCase() === 'bullish' ? 'success' :
                                    data.signal.toLowerCase() === 'bearish' ? 'error' :
                                    'default'
                                  } 
                                />
                              )}
                            </TableCell>
                            <TableCell>{data.confidence !== undefined ? `${data.confidence}%` : 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {String(agentData)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// Terminal Output Tab Component
function TerminalOutputTab({ result }) {
  const [expanded, setExpanded] = useState(false);
  
  // Check if we have any result
  const hasResult = result && (result.raw || result.formatted_output);
  
  // Use hardcoded example output if no real output is available yet
  const exampleOutput = `PORTFOLIO SUMMARY:
Cash Balance: $143,788.69
Total Position Value: $-882.09
Total Value: $142,906.60
Return: +42.89%
Sharpe Ratio: 5.80
Sortino Ratio: 14.46
Max Drawdown: -15.73%



+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+
| Date       | Ticker   |  Action  |   Quantity |   Price |   Shares |   Position Value |   Bullish |   Bearish |   Neutral |
+============+==========+==========+============+=========+==========+==================+===========+===========+===========+
| 2024-01-02 | AAPL     |  SHORT   |        103 |  185.64 |     -103 |       -19,120.92 |         0 |         1 |         1 |
+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+
| 2024-01-02 | MSFT     |   HOLD   |          0 |  370.87 |        0 |             0.00 |         0 |         0 |         2 |
+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+
| 2024-01-03 | AAPL     |   HOLD   |          0 |  185.64 |     -103 |       -19,120.92 |         0 |         1 |         1 |
+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+
| 2024-01-03 | MSFT     |   HOLD   |          0 |  370.87 |        0 |             0.00 |         0 |         0 |         2 |
+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+
| 2024-01-04 | AAPL     |  COVER   |        103 |  181.91 |        0 |             0.00 |         0 |         1 |         1 |
+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+





PORTFOLIO PERFORMANCE SUMMARY:
Total Return: 42.91%
Total Realized Gains/Losses: $0.00`;
  
  // Use either the real output, formatted output, or example output
  const displayOutput = hasResult ? (result.formatted_output || result.raw) : exampleOutput;
  
  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Terminal Output</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand Full Output'}
            </Button>
          </Box>
          
          <Box 
            sx={{ 
              maxHeight: expanded ? 'none' : '600px', 
              overflow: 'auto', 
              bgcolor: '#1e1e1e', 
              color: '#f8f8f8',
              p: 2, 
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre',
              position: 'relative'
            }}
          >
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre' }}>
              {displayOutput}
            </pre>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This terminal output displays the backtesting results in a command-line interface format, showing portfolio summaries, trade tables, and performance metrics.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

// Raw Output Tab Component
function RawOutputTab({ result }) {
  const [expanded, setExpanded] = useState(false);
  
  // Check if raw output exists and has content
  const hasRawOutput = result && result.raw && result.raw.length > 0;
  
  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Raw Backtest Output</Typography>
            {hasRawOutput && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Collapse' : 'Expand Full Output'}
              </Button>
            )}
          </Box>
          
          {hasRawOutput ? (
            <Box 
              sx={{ 
                maxHeight: expanded ? 'none' : '600px', 
                overflow: 'auto', 
                bgcolor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                position: 'relative'
              }}
            >
              {result.raw}
              
              {!expanded && result.raw.length > 2000 && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    height: '100px', 
                    background: 'linear-gradient(rgba(245, 245, 245, 0), rgba(245, 245, 245, 1))',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    pb: 2
                  }}
                >
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => setExpanded(true)}
                  >
                    Show More
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              No raw output available. This could be because the backtester hasn't been run yet or didn't generate any output.
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The raw output contains the complete log from the backtesting process, including all agent decisions, market data, and performance calculations.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default BacktestDashboard;
