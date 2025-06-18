import React, { useState } from "react";
import SampleTradingData from './demo/SampleTradingData';
import { Grid, Paper, Typography, Button, TextField, Chip, Divider, CircularProgress, Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, Collapse, Alert, IconButton, LinearProgress, Step, StepLabel, Stepper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CodeIcon from '@mui/icons-material/Code';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoIcon from '@mui/icons-material/Info';
import axios from "axios";
import EnhancedRawOutput from "./EnhancedRawOutput";
import AgentAvatar from "./AgentAvatars";
import AgentCharts from "./AgentCharts";
import AgentAlerts from "./AgentAlerts";
import AgentSummary from "./AgentSummary";
import EnhancedSummary from "./EnhancedSummary";
import VisualizationDashboard from "./VisualizationDashboard";
import BacktestDashboard from "./BacktestDashboard";
import AgentDetailedAnalysis from "./AgentDetailedAnalysis";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

const DEFAULT_TICKERS = "AAPL,MSFT";
const DEFAULT_START_DATE = "2024-01-01";
const DEFAULT_END_DATE = "2024-04-30";
const DEFAULT_CASH = 100000;

const SIGNAL_COLORS = {
  bullish: 'success',
  bearish: 'error',
  neutral: 'default',
};

// Agent descriptions
const AGENT_LABELS = {
  'Fundamental Analysis Agent': 'Evaluates companies based on financial statements and business fundamentals',
  'Technical Analyst': 'Analyzes price patterns and market trends',
  'Valuation Analysis Agent': 'Determines fair value using DCF and other valuation models',
  'Sentiment Analysis Agent': 'Gauges market sentiment from news and social media',
  'Ben Graham Agent': 'Focuses on finding undervalued stocks with margin of safety',
  'Cathie Wood Agent': 'Seeks disruptive innovation and high-growth opportunities',
  'Bill Ackman Agent': 'Takes activist positions in underperforming companies',
  'Phil Fisher Agent': 'Looks for high-quality growth companies with strong management',
  'Warren Buffett Agent': 'Invests in companies with durable competitive advantages',
  'Charlie Munger Agent': 'Emphasizes high-quality businesses at fair prices',
  'Stanley Druckenmiller Agent': 'Makes concentrated bets based on macroeconomic trends',
  'Risk Management Agent': 'Monitors portfolio risk and suggests hedging strategies',
  'Portfolio Management Agent': 'Optimizes asset allocation and portfolio construction'
};

export default function HedgeFundDashboard() {
  // --- State for Agents tab ---
  const [openAgentsBanner, setOpenAgentsBanner] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState(null);

  // --- Utility: specialties for each agent ---
  function getAgentSpecialties(agent) {
    switch (agent) {
      case 'Fundamental Analysis Agent': return ['Value', 'Fundamental'];
      case 'Technical Analyst': return ['Technical', 'Momentum'];
      case 'Valuation Analysis Agent': return ['Valuation', 'DCF'];
      case 'Sentiment Analysis Agent': return ['Sentiment'];
      case 'Ben Graham Agent': return ['Value'];
      case 'Cathie Wood Agent': return ['Growth', 'Innovation'];
      case 'Bill Ackman Agent': return ['Activist', 'Quality'];
      case 'Phil Fisher Agent': return ['Growth'];
      case 'Warren Buffett Agent': return ['Value', 'Quality'];
      case 'Charlie Munger Agent': return ['Quality', 'Value'];
      case 'Stanley Druckenmiller Agent': return ['Macro', 'Growth'];
      case 'Risk Management Agent': return ['Risk'];
      case 'Portfolio Management Agent': return ['Portfolio'];
      default: return [];
    }
  }
  // --- Utility: agent timeline with real data ---
  function getAgentTimeline(agent, data) {
    if (!data || typeof data !== 'object') return [];
    const tickers = Object.keys(data);
    if (tickers.length === 0) return [];
    
    // Create a more detailed timeline based on agent type and available data
    const timeline = [];
    
    // Common first step for all agents
    timeline.push(`Received market data for ${tickers.join(', ')}`);
    
    // Agent-specific analysis steps
    if (agent.includes('Fundamental')) {
      timeline.push(`Analyzed financial statements and ratios`);
      timeline.push(`Evaluated profitability trends and growth rates`);
    } else if (agent.includes('Technical')) {
      timeline.push(`Calculated technical indicators (RSI, MACD, Moving Averages)`);
      timeline.push(`Identified price patterns and trend direction`);
    } else if (agent.includes('Sentiment')) {
      timeline.push(`Processed news headlines and social media data`);
      timeline.push(`Calculated sentiment scores and trend analysis`);
    } else if (agent.includes('Valuation')) {
      timeline.push(`Built DCF models and calculated intrinsic values`);
      timeline.push(`Compared current price to fair value estimates`);
    } else if (agent.includes('Risk')) {
      timeline.push(`Calculated position-level and portfolio-level risk metrics`);
      timeline.push(`Evaluated correlation and diversification effects`);
    } else if (agent.includes('Portfolio')) {
      timeline.push(`Aggregated signals from all strategic and analysis agents`);
      timeline.push(`Optimized position sizing based on conviction and risk`);
    } else {
      // Strategic investor agents
      timeline.push(`Applied ${agent.replace(' Agent', '')} investment philosophy`);
      timeline.push(`Evaluated business quality and competitive advantages`);
    }
    
    // Add signal generation based on actual data
    for (const ticker of tickers) {
      if (data[ticker]?.signal) {
        const confidence = data[ticker].confidence ? ` with ${data[ticker].confidence}% confidence` : '';
        timeline.push(`Generated ${data[ticker].signal.toUpperCase()} signal for ${ticker}${confidence}`);
      }
    }
    
    // Final step
    if (agent.includes('Portfolio')) {
      timeline.push('Generated final trading decisions');
    } else {
      timeline.push('Submitted signals to Portfolio Management Agent');
    }
    
    return timeline;
  }
  
  // --- Utility: format JSON data for display ---
  function formatJsonOutput(data) {
    if (!data) return 'No data available';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  }
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
  const [initialCash, setInitialCash] = useState(DEFAULT_CASH);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [mainTab, setMainTab] = useState(0);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      console.log('Sending request to /api/run with data:', {
        tickers,
        start_date: startDate,
        end_date: endDate,
        initial_cash: initialCash,
      });
      
      // Always use the local backend server for now
      // Try both localhost and IP address formats to improve connection reliability
      const apiUrl = 'http://localhost:8000/api/run';
      console.log('Using API URL:', apiUrl);
      
      const response = await axios.post(apiUrl, {
        tickers,
        start_date: startDate,
        end_date: endDate,
        initial_cash: initialCash,
      });
      
      console.log('Received response:', response.data);
      
      // Handle different response formats
      if (response.data) {
        // Force a re-render by creating a new object
        setResult({...response.data});
        // Switch to the summary tab to show results
        setTab(0);
      } else {
        setError('Received empty response from server');
      }
    } catch (err) {
      console.error('Error during API call:', err);
      
      // Check for specific error messages
      const errorMessage = err.response?.data?.error || err.message;
      
      if (err.message === 'Network Error') {
        setError('Network Error: Cannot connect to the backend server. Please ensure the backend is running at http://localhost:8000');
      } else if (errorMessage === 'No high-confidence signals detected' || 
                errorMessage?.includes('high-confidence') || 
                errorMessage?.includes('confidence threshold')) {
        // Load sample data to demonstrate the flow when no signals meet threshold
        console.log('Using sample trading data for demonstration');
        setResult({
          agents: SampleTradingData.analystSignals,
          decisions: SampleTradingData.portfolioDecisions,
          raw: 'Sample demonstration data is being displayed because no high-confidence signals were detected in the actual data.\n\nThis allows you to see how the trading decision flow works.'
        });
        setError('Using demonstration data: No high-confidence signals were detected in actual data');
        setTab(0); // Switch to the results tab
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Capital Global Multi-Agent Hedge Fund Simulation
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label="Simulation" icon={<VisibilityIcon />} iconPosition="start" />
          <Tab label="Backtesting" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {mainTab === 0 && (
        <>
          <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField label="Tickers" value={tickers} onChange={e => setTickers(e.target.value)} fullWidth helperText="Comma-separated (e.g., AAPL,MSFT)" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField label="Initial Cash ($)" type="number" value={initialCash} onChange={e => setInitialCash(Number(e.target.value))} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button variant="contained" color="primary" onClick={handleRun} fullWidth disabled={loading} size="large">
            {loading ? <CircularProgress size={24} /> : "Run Simulation"}
          </Button>
        </Grid>
      </Grid>
      <Divider sx={{ my: 3 }} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {result && (
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Summary" />
            <Tab label="Agents" />
            <Tab label="Visualizations" />
            <Tab label="Raw Output" />
          </Tabs>
          {tab === 0 && (
            <Box>
              <EnhancedSummary agents={result.agents} decisions={result.decisions} />
            </Box>
          )}
          {tab === 1 && result.agents && (
            <Box>
              {/* Intro Banner */}
              <Collapse in={openAgentsBanner}>
                <Alert
                  icon={<CloseIcon fontSize="inherit" />} severity="info"
                  action={<IconButton size="small" onClick={() => setOpenAgentsBanner(false)}><CloseIcon fontSize="small" /></IconButton>}
                  sx={{ mb: 2 }}
                >
                  Meet your AI-powered investment team! Click on any agent to explore its unique strategy, reasoning, and recent actions.
                </Alert>
              </Collapse>
              
              {/* Summary Table of All Agents */}
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell>Specialty</TableCell>
                      <TableCell>Tickers</TableCell>
                      <TableCell>Signals</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(result.agents).map(([agent, data]) => {
                      const tickers = Object.keys(data);
                      const firstTickerData = tickers.length > 0 ? data[tickers[0]] : {};
                      return (
                        <TableRow 
                          key={agent} 
                          hover 
                          onClick={() => setExpandedAgent(agent === expandedAgent ? null : agent)}
                          sx={{ cursor: 'pointer', backgroundColor: expandedAgent === agent ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AgentAvatar agent={agent} sx={{ width: 24, height: 24, mr: 1 }} />
                              <Typography variant="body2" fontWeight={600}>{agent}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {getAgentSpecialties(agent).map(tag => (
                                <Chip key={tag} label={tag} size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>{tickers.join(', ')}</TableCell>
                          <TableCell>
                            {tickers.map(ticker => (
                              <Chip 
                                key={ticker} 
                                label={`${ticker}: ${data[ticker]?.signal || 'N/A'}`} 
                                size="small" 
                                color={SIGNAL_COLORS[data[ticker]?.signal?.toLowerCase()] || 'default'}
                                sx={{ mr: 0.5, mb: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            ))}
                          </TableCell>
                          <TableCell>
                            {firstTickerData.confidence !== undefined ? `${firstTickerData.confidence}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color={expandedAgent === agent ? "secondary" : "primary"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedAgent(agent === expandedAgent ? null : agent);
                              }}
                            >
                              {expandedAgent === agent ? "Hide Details" : "View Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Agent Comparison & Leaderboard Placeholders */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button variant="outlined" color="primary" startIcon={<CompareArrowsIcon />} disabled>Compare Agents (Coming Soon)</Button>
                <Button variant="outlined" color="secondary" startIcon={<EmojiEventsIcon />} disabled>Agent Leaderboard (Coming Soon)</Button>
              </Box>

              {/* Responsive Agent Gallery */}
              <Grid container spacing={3}>
                {Object.entries(result.agents).map(([agent, data]) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={agent}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: 4,
                        p: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { transform: 'translateY(-4px) scale(1.03)', boxShadow: 8 },
                        cursor: 'pointer',
                        minHeight: 320,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'visible',
                        ...(expandedAgent === agent && {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                          borderStyle: 'solid'
                        })
                      }}
                      onClick={() => setExpandedAgent(agent === expandedAgent ? null : agent)}
                      raised={expandedAgent === agent}
                    >
                      {/* Active Agent Indicator */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'success.main',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxShadow: '0 0 0 rgba(75, 192, 192, 0.4)',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              boxShadow: '0 0 0 0 rgba(75, 192, 192, 0.4)'
                            },
                            '70%': {
                              boxShadow: '0 0 0 10px rgba(75, 192, 192, 0)'
                            },
                            '100%': {
                              boxShadow: '0 0 0 0 rgba(75, 192, 192, 0)'
                            }
                          }
                        }}
                      />
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <AgentAvatar agent={agent} />
                        <Typography fontWeight={700} variant="h6">{agent}</Typography>
                        <Chip label="AI-Driven" color="primary" size="small" />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        {/* Specialty tags (example: Value, Growth, Risk, Sentiment) */}
                        {getAgentSpecialties(agent).map(tag => (
                          <Chip key={tag} label={tag} size="small" color="info" variant="outlined" />
                        ))}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 36 }}>{AGENT_LABELS[agent] || ''}</Typography>
                      {/* Confidence/uncertainty bar (if available) */}
                      {typeof data === 'object' && Object.values(data)[0]?.confidence !== undefined && (
                        <Box sx={{ width: '100%', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">Confidence</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Object.values(data)[0].confidence}
                            sx={{ height: 8, borderRadius: 4, background: '#e3e3e3', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }}
                          />
                        </Box>
                      )}
                      {/* Expandable section: reasoning, timeline, see in action */}
                      <Collapse in={expandedAgent === agent}>
                        <>
                          {/* Agent Status and Current Activity */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Agent Status</Typography>
                              <Chip 
                                label="Active" 
                                color="success" 
                                size="small" 
                                sx={{ 
                                  '& .MuiChip-label': { px: 2 },
                                  animation: 'pulse 2s infinite',
                                  '@keyframes pulse': {
                                    '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.4)' },
                                    '70%': { boxShadow: '0 0 0 6px rgba(76, 175, 80, 0)' },
                                    '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' }
                                  }
                                }} 
                              />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Processing Mode</Typography>
                              <Chip 
                                label="Autonomous" 
                                color="primary" 
                                size="small" 
                                sx={{ '& .MuiChip-label': { px: 2 } }} 
                              />
                            </Box>
                          </Box>

                          {/* Agent Actions */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Agent Actions</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                color="primary"
                                sx={{ minWidth: 100 }}
                              >
                                Run Analysis
                              </Button>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                color="success"
                                sx={{ minWidth: 100 }}
                              >
                                Generate Signal
                              </Button>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                color="secondary"
                                sx={{ minWidth: 100 }}
                              >
                                Adjust Parameters
                              </Button>
                            </Stack>
                          </Box>

                          {/* Detailed Agent Analysis */}
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Detailed Agent Analysis</Typography>
                          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <AgentDetailedAnalysis 
                              agents={[{
                                name: agent,
                                data: data
                              }]} 
                              compact={true}
                            />
                          </Paper>
                          {/* Mini Timeline of Actions */}
                          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Agent Activity Timeline</Typography>
                          <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: 300, overflow: 'auto' }}>
                            <Stepper activeStep={getAgentTimeline(agent, data).length - 1} orientation="vertical" sx={{ mb: 1 }}>
                              {getAgentTimeline(agent, data).map((step, idx) => {
                                // Calculate time for each step (for demonstration purposes)
                                const minutes = Math.floor(Math.random() * 2);
                                const seconds = Math.floor(Math.random() * 60);
                                const timeString = `${minutes}m ${seconds}s ago`;
                                
                                return (
                                  <Step key={idx} completed={idx < getAgentTimeline(agent, data).length - 1}>
                                    <StepLabel>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <Typography variant="body2">{step}</Typography>
                                        <Typography variant="caption" color="text.secondary">{timeString}</Typography>
                                      </Box>
                                    </StepLabel>
                                  </Step>
                                );
                              })}
                            </Stepper>
                          </Paper>
                          
                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            {/* See in Action Button */}
                            <Button 
                              variant="contained" 
                              color="primary" 
                              size="small" 
                              startIcon={<VisibilityIcon />} 
                              sx={{ mt: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTab(0); // Switch to Summary tab
                              }}
                            >
                              See in Action (Summary)
                            </Button>
                            
                            {/* View Raw Output Button */}
                            <Button 
                              variant="outlined" 
                              color="secondary" 
                              size="small" 
                              startIcon={<CodeIcon />} 
                              sx={{ mt: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTab(3); // Switch to Raw Output tab
                              }}
                            >
                              View Raw Output
                            </Button>
                          </Box>
                        </>
                      </Collapse>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {tab === 2 && (
            <Box sx={{ mt: 2 }}>
              <VisualizationDashboard simulationData={result} />
            </Box>
          )}
          {tab === 3 && (
            <Box sx={{ mt: 2 }}>
              <EnhancedRawOutput raw={result.raw || result.output || ""} />
            </Box>
          )}
        </Box>
      )}
        </>
      )}
      
      {mainTab === 1 && (
        <BacktestDashboard />
      )}
    </Paper>
  );
}
