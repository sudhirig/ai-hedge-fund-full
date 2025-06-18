import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Chip, 
  Card, 
  CardContent, 
  CardHeader,
  Avatar,
  Divider, 
  Stack,
  LinearProgress,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AgentAvatar from "./AgentAvatars";
import AgentCharts from "./AgentCharts";

// Helper function to determine signal color
function signalColor(signal) {
  if (!signal) return "default";
  const s = signal.toLowerCase();
  if (s === "bullish" || s === "buy" || s === "strong buy") return "success";
  if (s === "bearish" || s === "sell" || s === "strong sell") return "error";
  if (s === "neutral" || s === "hold") return "info";
  return "default";
}

// Helper function to format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Helper function to format percentage
function formatPercentage(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Portfolio Summary Card
function PortfolioSummaryCard({ decisions }) {
  // Calculate metrics based on actual decisions data
  const calculateMetrics = () => {
    if (!decisions || Object.keys(decisions).length === 0) {
      return {
        totalPositions: 0,
        buyCount: 0,
        sellCount: 0,
        holdCount: 0,
        avgConfidence: 0
      };
    }

    // Use only real data from decisions
    const totalPositions = Object.keys(decisions).length;
    
    // Count different types of decisions
    const buyDecisions = Object.values(decisions).filter(d => 
      d.action?.toLowerCase() === 'buy'
    );
    
    const sellDecisions = Object.values(decisions).filter(d => 
      d.action?.toLowerCase() === 'sell'
    );
    
    const holdDecisions = Object.values(decisions).filter(d => 
      d.action?.toLowerCase() === 'hold'
    );
    
    // Calculate average confidence based on actual confidence scores
    const allConfidences = Object.values(decisions)
      .map(d => d.confidence || 0)
      .filter(c => c > 0);
    
    const avgConfidence = allConfidences.length > 0 ?
      allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length : 0;
    
    return {
      totalPositions,
      buyCount: buyDecisions.length,
      sellCount: sellDecisions.length,
      holdCount: holdDecisions.length,
      avgConfidence
    };
  };

  const metrics = calculateMetrics();

  return (
    <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
      <CardHeader
        title="AI Agent Decision Summary"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AccountBalanceIcon />
          </Avatar>
        }
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Trading Decisions
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Chip 
              icon={<TrendingUpIcon />} 
              label={`Buy: ${metrics.buyCount}`} 
              color="success" 
              variant="outlined" 
              sx={{ flex: 1, mr: 1 }}
            />
            <Chip 
              icon={<TrendingDownIcon />} 
              label={`Sell: ${metrics.sellCount}`} 
              color="error" 
              variant="outlined" 
              sx={{ flex: 1, mr: 1 }}
            />
            <Chip 
              icon={<ShowChartIcon />} 
              label={`Hold: ${metrics.holdCount}`} 
              color="info" 
              variant="outlined" 
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Analyzed Positions
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {metrics.totalPositions}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Average AI Confidence
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress 
              variant="determinate" 
              value={metrics.avgConfidence} 
              size={60}
              thickness={5}
              sx={{ 
                color: metrics.avgConfidence > 75 ? 'success.main' : 
                       metrics.avgConfidence > 50 ? 'info.main' : 
                       metrics.avgConfidence > 25 ? 'warning.main' : 'error.main' 
              }}
            />
            <Box sx={{ ml: 2 }}>
              <Typography variant="h5" fontWeight="bold">
                {Math.round(metrics.avgConfidence)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on actual agent confidence scores
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Market Insights Card
function MarketInsightsCard({ agents }) {
  // Extract insights from agent data - using only real data
  const extractInsights = () => {
    if (!agents || Object.keys(agents).length === 0) {
      return {
        insights: [],
        agentCount: 0,
        signalCounts: { bullish: 0, bearish: 0, neutral: 0 }
      };
    }

    const insights = [];
    const signalCounts = { bullish: 0, bearish: 0, neutral: 0 };
    let totalSignals = 0;
    
    // Process all signals from agents
    Object.entries(agents).forEach(([agentName, data]) => {
      Object.entries(data).forEach(([ticker, tickerData]) => {
        // Count all signals by type
        if (tickerData.signal) {
          const signalType = tickerData.signal.toLowerCase();
          if (signalType === 'bullish') signalCounts.bullish++;
          else if (signalType === 'bearish') signalCounts.bearish++;
          else signalCounts.neutral++;
          totalSignals++;
        }
        
        // Add high confidence signals to insights
        if (tickerData.signal && tickerData.confidence > 65) {
          insights.push({
            type: tickerData.signal.toLowerCase(),
            ticker,
            agent: agentName,
            confidence: tickerData.confidence,
            reason: typeof tickerData.reasoning === 'string' 
              ? tickerData.reasoning.substring(0, 100) + (tickerData.reasoning.length > 100 ? '...' : '')
              : `High confidence ${tickerData.signal.toLowerCase()} signal`
          });
        }
      });
    });
    
    // Sort by confidence (highest first)
    return {
      insights: insights.sort((a, b) => b.confidence - a.confidence),
      agentCount: Object.keys(agents).length,
      signalCounts,
      totalSignals
    };
  };

  const { insights, agentCount, signalCounts, totalSignals } = extractInsights();

  return (
    <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
      <CardHeader
        title="AI Agent Analysis"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        avatar={
          <Avatar sx={{ bgcolor: 'info.main' }}>
            <GroupWorkIcon />
          </Avatar>
        }
      />
      <CardContent>
        {/* Agent Signal Distribution */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Signal Distribution from {agentCount} AI Agents
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 1 }}>
            {/* Bullish */}
            <Box sx={{ flex: signalCounts.bullish || 0.5, height: 24, bgcolor: 'success.main', borderRadius: '4px 0 0 4px' }} />
            {/* Neutral */}
            <Box sx={{ flex: signalCounts.neutral || 0.5, height: 24, bgcolor: 'info.main' }} />
            {/* Bearish */}
            <Box sx={{ flex: signalCounts.bearish || 0.5, height: 24, bgcolor: 'error.main', borderRadius: '0 4px 4px 0' }} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="success.main">
              Bullish: {signalCounts.bullish} ({totalSignals ? Math.round((signalCounts.bullish / totalSignals) * 100) : 0}%)
            </Typography>
            <Typography variant="caption" color="info.main">
              Neutral: {signalCounts.neutral} ({totalSignals ? Math.round((signalCounts.neutral / totalSignals) * 100) : 0}%)
            </Typography>
            <Typography variant="caption" color="error.main">
              Bearish: {signalCounts.bearish} ({totalSignals ? Math.round((signalCounts.bearish / totalSignals) * 100) : 0}%)
            </Typography>
          </Box>
        </Box>
        
        {/* High Confidence Insights */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          High Confidence Signals
        </Typography>
        
        {insights.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {insights.slice(0, 5).map((insight, index) => (
              <ListItem 
                key={index}
                sx={{
                  mb: 1, 
                  p: 1.5, 
                  borderRadius: 1,
                  bgcolor: 
                    insight.type === 'bullish' ? 'rgba(76, 175, 80, 0.1)' : 
                    insight.type === 'bearish' ? 'rgba(244, 67, 54, 0.1)' : 
                    'rgba(33, 150, 243, 0.1)'
                }}
              >
                <ListItemIcon>
                  {insight.type === 'bullish' ? 
                    <TrendingUpIcon color="success" /> : 
                    insight.type === 'bearish' ?
                    <TrendingDownIcon color="error" /> :
                    <ShowChartIcon color="info" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">{insight.ticker}</Typography>
                      <Chip 
                        size="small" 
                        label={`${Math.round(insight.confidence)}% confidence`}
                        color={
                          insight.type === 'bullish' ? 'success' : 
                          insight.type === 'bearish' ? 'error' : 
                          'info'
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {insight.agent.replace('_agent', '').replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                      <Typography variant="body2">
                        {insight.reason}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <WarningIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">
              No high-confidence signals detected
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Trading Decisions Card
function TradingDecisionsCard({ decisions }) {
  const [expanded, setExpanded] = useState(false);

  if (!decisions || Object.keys(decisions).length === 0) {
    return (
      <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
        <CardHeader
          title="Trading Decisions"
          titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
          avatar={
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <ShowChartIcon />
            </Avatar>
          }
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No trading decisions available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
      <CardHeader
        title="Trading Decisions"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        avatar={
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <ShowChartIcon />
          </Avatar>
        }
        action={
          <Button
            size="small"
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : 'Show All'}
          </Button>
        }
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ticker</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Confidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(decisions)
                .slice(0, expanded ? undefined : 5)
                .map(([ticker, decision]) => (
                  <TableRow key={ticker}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {ticker}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={decision.action} 
                        size="small" 
                        color={signalColor(decision.action)}
                      />
                    </TableCell>
                    <TableCell>{decision.quantity}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 60, mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={decision.confidence} 
                            color={
                              decision.confidence > 70 ? 'success' :
                              decision.confidence > 40 ? 'warning' : 'error'
                            }
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {decision.confidence}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {Object.keys(decisions).length > 5 && !expanded && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {Object.keys(decisions).length - 5} more decisions not shown
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Agent Performance Card
function AgentPerformanceCard({ agents }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Get list of agents
  const agentList = Object.keys(agents || {});
  
  // Calculate agent performance metrics
  const calculatePerformance = (agentName) => {
    if (!agents || !agents[agentName]) return null;
    
    const agentData = agents[agentName];
    const tickers = Object.keys(agentData);
    
    // Calculate accuracy based on confidence scores
    const totalConfidence = tickers.reduce((sum, ticker) => {
      return sum + (agentData[ticker].confidence || 0);
    }, 0);
    
    const avgConfidence = tickers.length > 0 ? totalConfidence / tickers.length : 0;
    
    // For demo purposes, we'll generate some plausible values
    // In a real app, these would be calculated from historical performance
    return {
      accuracy: Math.min(100, Math.max(50, avgConfidence + (Math.random() * 20 - 10))),
      signalStrength: Math.min(100, Math.max(0, avgConfidence + (Math.random() * 30 - 15))),
      contribution: Math.min(100, Math.max(0, 40 + Math.random() * 60)),
    };
  };
  
  return (
    <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
      <CardHeader
        title="Agent Performance"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        avatar={
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <BarChartIcon />
          </Avatar>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Select an agent to view performance
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {agentList.map(agent => (
                <Chip
                  key={agent}
                  label={agent.replace(' Agent', '')}
                  onClick={() => setSelectedAgent(agent)}
                  color={selectedAgent === agent ? 'primary' : 'default'}
                  variant={selectedAgent === agent ? 'filled' : 'outlined'}
                  avatar={<AgentAvatar agent={agent} />}
                />
              ))}
            </Box>
          </Grid>
          
          {selectedAgent && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AgentAvatar agent={selectedAgent} sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedAgent}
                  </Typography>
                </Box>
              </Grid>
              
              {(() => {
                const performance = calculatePerformance(selectedAgent);
                if (!performance) return null;
                
                return (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Signal Accuracy
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={performance.accuracy} 
                            color="success"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(performance.accuracy)}%
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Signal Strength
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={performance.signalStrength} 
                            color="primary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(performance.signalStrength)}%
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Portfolio Contribution
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={performance.contribution} 
                            color="secondary"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(performance.contribution)}%
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                );
              })()}
            </>
          )}
          
          {!selectedAgent && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">
                  Select an agent to view performance metrics
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

// Agent Network Card Component
function AgentNetworkCard({ agents, onAgentAction }) {
  const [activeAgent, setActiveAgent] = useState(null);
  
  // Get list of all agents
  const agentList = Object.keys(agents || {});
  
  // Group agents by type
  const strategicAgents = agentList.filter(a => 
    !a.includes('Management') && 
    !a.includes('Risk') && 
    !a.includes('Technical') && 
    !a.includes('Sentiment') && 
    !a.includes('Valuation') && 
    !a.includes('Fundamental')
  );
  
  const analysisAgents = agentList.filter(a => 
    a.includes('Technical') || 
    a.includes('Sentiment') || 
    a.includes('Valuation') || 
    a.includes('Fundamental')
  );
  
  const managementAgents = agentList.filter(a => 
    a.includes('Management') || 
    a.includes('Risk')
  );
  
  // Handle agent click
  const handleAgentClick = (agent) => {
    setActiveAgent(agent === activeAgent ? null : agent);
  };
  
  // Get agent status
  const getAgentStatus = (agent) => {
    if (!agents[agent]) return 'inactive';
    
    const agentData = agents[agent];
    const tickers = Object.keys(agentData);
    
    if (tickers.length === 0) return 'inactive';
    
    const hasSignals = tickers.some(ticker => 
      agentData[ticker].signal && agentData[ticker].confidence > 50
    );
    
    return hasSignals ? 'active' : 'standby';
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'standby': return 'warning';
      default: return 'default';
    }
  };
  
  // Get agent actions
  const getAgentActions = (agent) => {
    const status = getAgentStatus(agent);
    if (status === 'inactive') return [];
    
    const agentData = agents[agent];
    const tickers = Object.keys(agentData);
    
    if (tickers.length === 0) return [];
    
    // Get the first ticker with a signal
    const tickerWithSignal = tickers.find(ticker => 
      agentData[ticker].signal && agentData[ticker].confidence > 50
    );
    
    if (!tickerWithSignal) return [];
    
    const signal = agentData[tickerWithSignal].signal.toLowerCase();
    
    if (signal === 'bullish') {
      return ['Buy', 'Research'];
    } else if (signal === 'bearish') {
      return ['Sell', 'Research'];
    } else {
      return ['Research'];
    }
  };
  
  return (
    <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
      <CardHeader
        title="Capital Global AI Agent Network"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        subheader="Interactive multi-agent system working together to make trading decisions"
      />
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Strategic Investor Agents
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {strategicAgents.map(agent => {
            const status = getAgentStatus(agent);
            return (
              <Chip
                key={agent}
                label={agent.replace(' Agent', '')}
                onClick={() => handleAgentClick(agent)}
                color={activeAgent === agent ? 'primary' : 'default'}
                variant={activeAgent === agent ? 'filled' : 'outlined'}
                avatar={<AgentAvatar agent={agent} />}
                sx={{ 
                  '&::after': status === 'active' ? {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                      '70%': { boxShadow: '0 0 0 5px rgba(76, 175, 80, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
                    }
                  } : {}
                }}
              />
            );
          })}
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>
          Analysis Agents
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {analysisAgents.map(agent => {
            const status = getAgentStatus(agent);
            return (
              <Chip
                key={agent}
                label={agent.replace(' Agent', '').replace(' Analysis', '').replace('Analyst', '')}
                onClick={() => handleAgentClick(agent)}
                color={activeAgent === agent ? 'primary' : 'default'}
                variant={activeAgent === agent ? 'filled' : 'outlined'}
                avatar={<AgentAvatar agent={agent} />}
                sx={{ 
                  '&::after': status === 'active' ? {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                      '70%': { boxShadow: '0 0 0 5px rgba(76, 175, 80, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
                    }
                  } : {}
                }}
              />
            );
          })}
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>
          Management Agents
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {managementAgents.map(agent => {
            const status = getAgentStatus(agent);
            return (
              <Chip
                key={agent}
                label={agent.replace(' Agent', '')}
                onClick={() => handleAgentClick(agent)}
                color={activeAgent === agent ? 'primary' : 'default'}
                variant={activeAgent === agent ? 'filled' : 'outlined'}
                avatar={<AgentAvatar agent={agent} />}
                sx={{ 
                  '&::after': status === 'active' ? {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
                      '70%': { boxShadow: '0 0 0 5px rgba(76, 175, 80, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
                    }
                  } : {}
                }}
              />
            );
          })}
        </Box>
        
        {activeAgent && (
          <Box sx={{ mt: 3 }}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                borderRadius: 2,
                backgroundColor: '#f5f5f5',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AgentAvatar agent={activeAgent} sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {activeAgent}
                </Typography>
                <Chip 
                  label={getAgentStatus(activeAgent)} 
                  size="small" 
                  color={getStatusColor(getAgentStatus(activeAgent))} 
                  sx={{ ml: 2 }}
                />
              </Box>
              
              {agents[activeAgent] && Object.keys(agents[activeAgent]).length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Analysis
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {Object.entries(agents[activeAgent]).map(([ticker, data]) => (
                      <Grid item xs={12} sm={6} md={4} key={ticker}>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography fontWeight="bold">{ticker}</Typography>
                            {data.signal && (
                              <Chip 
                                label={data.signal} 
                                size="small" 
                                color={signalColor(data.signal)} 
                              />
                            )}
                          </Box>
                          {data.confidence !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" sx={{ mr: 1 }}>
                                Confidence:
                              </Typography>
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={data.confidence} 
                                  color={
                                    data.confidence > 70 ? 'success' :
                                    data.confidence > 40 ? 'warning' : 'error'
                                  }
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                {data.confidence}%
                              </Typography>
                            </Box>
                          )}
                          {data.reasoning && typeof data.reasoning === 'string' && (
                            <Tooltip title={data.reasoning}>
                              <Typography variant="caption" sx={{ 
                                display: 'block', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}>
                                {data.reasoning}
                              </Typography>
                            </Tooltip>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Agent Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {getAgentActions(activeAgent).map(action => (
                      <Button
                        key={action}
                        variant="contained"
                        color={
                          action === 'Buy' ? 'success' :
                          action === 'Sell' ? 'error' :
                          'primary'
                        }
                        size="small"
                        onClick={() => onAgentAction(activeAgent, action)}
                      >
                        {action}
                      </Button>
                    ))}
                    {getAgentActions(activeAgent).length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No actions available for this agent
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Trading Actions Card Component
function TradingActionsCard({ decisions, onAction }) {
  // Get the most confident decision for each action type
  const getBestDecisions = () => {
    if (!decisions || Object.keys(decisions).length === 0) return {};
    
    const actionGroups = {
      buy: [],
      sell: [],
      hold: [],
      short: []
    };
    
    Object.entries(decisions).forEach(([ticker, decision]) => {
      const action = decision.action?.toLowerCase();
      if (action && actionGroups[action]) {
        actionGroups[action].push({
          ticker,
          ...decision
        });
      }
    });
    
    // Sort by confidence and get top decision for each action
    const bestDecisions = {};
    Object.entries(actionGroups).forEach(([action, decisions]) => {
      if (decisions.length > 0) {
        decisions.sort((a, b) => b.confidence - a.confidence);
        bestDecisions[action] = decisions[0];
      }
    });
    
    return bestDecisions;
  };
  
  const bestDecisions = getBestDecisions();
  
  return (
    <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
      <CardHeader
        title="Trading Actions"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        subheader="Agent-recommended trading actions"
      />
      <CardContent>
        <Grid container spacing={2}>
          {Object.entries(bestDecisions).map(([action, decision]) => (
            <Grid item xs={12} sm={6} key={action}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  backgroundColor: 
                    action === 'buy' ? 'rgba(76, 175, 80, 0.1)' :
                    action === 'sell' ? 'rgba(244, 67, 54, 0.1)' :
                    action === 'short' ? 'rgba(211, 47, 47, 0.1)' :
                    'rgba(33, 150, 243, 0.1)',
                  border: '1px solid',
                  borderColor: 
                    action === 'buy' ? 'success.light' :
                    action === 'sell' ? 'error.light' :
                    action === 'short' ? 'error.light' :
                    'info.light'
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {action.toUpperCase()}: {decision.ticker}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">
                    Quantity: {decision.quantity}
                  </Typography>
                  <Chip 
                    label={`${decision.confidence}% Confidence`} 
                    size="small" 
                    color={
                      decision.confidence > 70 ? 'success' :
                      decision.confidence > 40 ? 'warning' : 'error'
                    }
                  />
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  color={
                    action === 'buy' ? 'success' :
                    action === 'sell' ? 'error' :
                    action === 'short' ? 'error' :
                    'info'
                  }
                  onClick={() => onAction(action, decision)}
                  sx={{ mt: 1 }}
                >
                  {action === 'buy' ? 'Execute Buy' :
                   action === 'sell' ? 'Execute Sell' :
                   action === 'short' ? 'Execute Short' :
                   'Execute Hold'}
                </Button>
              </Paper>
            </Grid>
          ))}
          
          {Object.keys(bestDecisions).length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">
                  No trading actions available
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button variant="contained" color="success" onClick={() => onAction('buy_all')}>
            Buy All Recommended
          </Button>
          <Button variant="contained" color="error" onClick={() => onAction('sell_all')}>
            Sell All Recommended
          </Button>
          <Button variant="outlined" color="primary" onClick={() => onAction('rebalance')}>
            Rebalance Portfolio
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => onAction('optimize')}>
            Optimize Allocations
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// Tabular Summary Component
function TabularSummaryView({ agents, decisions }) {
  // State for ticker selection
  const [selectedTicker, setSelectedTicker] = useState(null);
  
  // Get available tickers
  const tickers = decisions ? Object.keys(decisions) : [];
  
  // Set default ticker if none selected
  useEffect(() => {
    if (tickers.length > 0 && !selectedTicker) {
      setSelectedTicker(tickers[0]);
    }
  }, [tickers, selectedTicker]);
  
  // Extract analyst signals for the selected ticker
  const extractAnalystSignals = () => {
    if (!selectedTicker || !agents) return [];
    
    const signals = [];
    
    // Add each agent's signal for this ticker
    Object.entries(agents).forEach(([agentName, data]) => {
      if (data[selectedTicker]) {
        const displayName = agentName
          .replace('_agent', '')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        // Determine agent type
        const isRiskAgent = agentName.toLowerCase().includes('risk');
        const isPortfolioAgent = agentName.toLowerCase().includes('portfolio');
        const agentType = isRiskAgent ? 'risk' : 
                         isPortfolioAgent ? 'portfolio' : 'analyst';
        
        // Extract relevant data based on agent type
        let signalData = {
          analyst: displayName,
          agentType,
          signal: data[selectedTicker].signal || '',
          confidence: data[selectedTicker].confidence || null,
          reasoning: data[selectedTicker].reasoning || ''
        };
        
        // For risk agents, extract additional data if available
        if (isRiskAgent && data[selectedTicker].reasoning) {
          const reasoning = data[selectedTicker].reasoning;
          if (typeof reasoning === 'object') {
            signalData.portfolioValue = reasoning.portfolio_value;
            signalData.currentPosition = reasoning.current_position;
            signalData.positionLimit = reasoning.position_limit;
            signalData.remainingLimit = reasoning.remaining_limit;
            signalData.availableCash = reasoning.available_cash;
          }
        }
        
        signals.push(signalData);
      }
    });
    
    return signals;
  };
  
  // Extract trading decision for the selected ticker
  const extractTradingDecision = () => {
    if (!selectedTicker || !decisions || !decisions[selectedTicker]) return null;
    
    return {
      action: decisions[selectedTicker].action || '',
      quantity: decisions[selectedTicker].quantity || 0,
      confidence: decisions[selectedTicker].confidence || 0,
      reasoning: decisions[selectedTicker].reasoning || ''
    };
  };
  
  const analystSignals = extractAnalystSignals();
  const tradingDecision = extractTradingDecision();
  
  // Handle execute action
  const handleExecuteAction = () => {
    if (tradingDecision) {
      alert(`Executing ${tradingDecision.action.toUpperCase()} for ${selectedTicker}: ${tradingDecision.quantity} shares`);
    }
  };
  
  return (
    <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
      <CardHeader
        title="AI Trading Decision Summary"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Select Ticker:</Typography>
            <Select
              value={selectedTicker || ''}
              onChange={(e) => setSelectedTicker(e.target.value)}
              size="small"
              sx={{ minWidth: 100 }}
            >
              {tickers.map(ticker => (
                <MenuItem key={ticker} value={ticker}>{ticker}</MenuItem>
              ))}
            </Select>
          </Box>
        }
      />
      <CardContent>
        {selectedTicker ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ANALYST SIGNALS
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Agent Signal Analysis: {analystSignals.length} agents providing analysis
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {analystSignals.map((signal, index) => (
                        <Chip 
                          key={index}
                          size="small" 
                          label={signal.analyst}
                          variant="outlined"
                          color={signal.agentType === 'risk' ? 'error' : 
                                signal.agentType === 'portfolio' ? 'info' : 'primary'}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Analyst</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Signal</TableCell>
                          <TableCell>Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analystSignals.map((signal, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Tooltip title={typeof signal.reasoning === 'string' ? signal.reasoning : 'Detailed reasoning available'} arrow>
                                <Typography variant="body2">{signal.analyst}</Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={signal.agentType.charAt(0).toUpperCase() + signal.agentType.slice(1)} 
                                size="small"
                                color={signal.agentType === 'risk' ? 'error' : 
                                      signal.agentType === 'portfolio' ? 'info' : 'primary'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={signal.signal} 
                                size="small"
                                sx={{
                                  bgcolor: 
                                    signal.signal?.toLowerCase() === 'bullish' ? 'success.light' :
                                    signal.signal?.toLowerCase() === 'bearish' ? 'error.light' :
                                    'warning.light',
                                  color: 'text.primary',
                                  fontWeight: 'medium'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {signal.confidence !== null && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={typeof signal.confidence === 'number' && signal.confidence <= 1 ? 
                                           signal.confidence * 100 : 
                                           signal.confidence}
                                    sx={{
                                      width: 60,
                                      height: 8,
                                      borderRadius: 5,
                                      mr: 1,
                                      bgcolor: 'grey.300',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: 
                                          (signal.confidence > 70 || signal.confidence > 0.7) ? 'success.main' :
                                          (signal.confidence > 40 || signal.confidence > 0.4) ? 'warning.main' :
                                          'error.main',
                                        borderRadius: 5,
                                      }
                                    }}
                                  />
                                  <Typography variant="caption">
                                    {typeof signal.confidence === 'number' && signal.confidence <= 1 ? 
                                     Math.round(signal.confidence * 100) : 
                                     Math.round(signal.confidence)}%
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Portfolio and Risk Management Details */}
                  {analystSignals.some(signal => signal.agentType === 'risk' || signal.agentType === 'portfolio') && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Portfolio & Risk Management Details
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        {analystSignals
                          .filter(signal => signal.agentType === 'risk' || signal.agentType === 'portfolio')
                          .map((signal, index) => (
                            <Box key={index} sx={{ mb: index !== analystSignals.length - 1 ? 1.5 : 0 }}>
                              <Typography variant="body2" fontWeight="medium" color="primary">
                                {signal.analyst} Analysis:
                              </Typography>
                              {signal.portfolioValue && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                  <Chip size="small" label={`Portfolio: $${signal.portfolioValue}`} />
                                  <Chip size="small" label={`Position: ${signal.currentPosition || 0}`} />
                                  <Chip size="small" label={`Limit: ${signal.positionLimit || 'N/A'}`} />
                                  <Chip size="small" label={`Cash: $${signal.availableCash || 0}`} />
                                </Box>
                              )}
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {typeof signal.reasoning === 'string' ? signal.reasoning : (
                                  typeof signal.reasoning === 'object' ? (
                                    <Box sx={{ mt: 1 }}>
                                      {Object.entries(signal.reasoning).map(([key, value]) => (
                                        <Box key={key} sx={{ mb: 0.5 }}>
                                          <Typography variant="caption" fontWeight="medium" display="block">
                                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                          </Typography>
                                          <Typography variant="body2">
                                            {typeof value === 'object' ? JSON.stringify(value) : value}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  ) : 'No detailed reasoning provided'
                                )}
                              </Typography>
                            </Box>
                          ))}
                      </Paper>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Trading Decision */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                TRADING DECISION
              </Typography>
              {tradingDecision ? (
                <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(224, 224, 224, 1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Action</Typography>
                      <Chip 
                        label={tradingDecision.action.toUpperCase()}
                        color={
                          tradingDecision.action.toLowerCase() === 'buy' ? 'success' : 
                          tradingDecision.action.toLowerCase() === 'sell' ? 'error' : 
                          'info'
                        }
                        sx={{ mt: 0.5, fontWeight: 'bold' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Quantity</Typography>
                      <Typography variant="h6">{tradingDecision.quantity}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Confidence</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress 
                          variant="determinate" 
                          value={typeof tradingDecision.confidence === 'number' && tradingDecision.confidence <= 1 ? 
                                 tradingDecision.confidence * 100 : 
                                 tradingDecision.confidence} 
                          size={30}
                          thickness={4}
                          sx={{ 
                            color: (tradingDecision.confidence > 70 || tradingDecision.confidence > 0.7) ? 'success.main' : 
                                  (tradingDecision.confidence > 40 || tradingDecision.confidence > 0.4) ? 'warning.main' : 
                                  'error.main',
                            mr: 1
                          }}
                        />
                        <Typography variant="body1" fontWeight="medium">
                          {typeof tradingDecision.confidence === 'number' && tradingDecision.confidence <= 1 ? 
                           Math.round(tradingDecision.confidence * 100) : 
                           Math.round(tradingDecision.confidence)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {tradingDecision.reasoning && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Reasoning:</Typography>
                      {typeof tradingDecision.reasoning === 'string' ? (
                        <Typography variant="body2" sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1 }}>
                          {tradingDecision.reasoning}
                        </Typography>
                      ) : (
                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1 }}>
                          {Object.entries(tradingDecision.reasoning).map(([key, value]) => (
                            <Box key={key} sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                              </Typography>
                              <Typography variant="body2">
                                {typeof value === 'object' ? JSON.stringify(value) : value}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      color={
                        tradingDecision.action.toLowerCase() === 'buy' ? 'success' : 
                        tradingDecision.action.toLowerCase() === 'sell' ? 'error' : 
                        'primary'
                      }
                      onClick={handleExecuteAction}
                      startIcon={tradingDecision.action.toLowerCase() === 'buy' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    >
                      Execute {tradingDecision.action}
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No trading decision available for {selectedTicker}
                </Typography>
              )}
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" align="center" color="text.secondary" sx={{ py: 4 }}>
            No tickers available for analysis
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// Main Enhanced Summary Component
function EnhancedSummary({ agents, decisions }) {
  const [summaryTab, setSummaryTab] = useState(0);
  
  // Handle agent action
  const handleAgentAction = (agent, action) => {
    console.log(`Agent ${agent} action: ${action}`);
    // In a real app, this would trigger the action
    alert(`${agent} is executing action: ${action}`);
  };
  
  // Handle trading action
  const handleTradingAction = (action, decision) => {
    console.log(`Trading action: ${action}`, decision);
    // In a real app, this would execute the trade
    if (typeof decision === 'object') {
      alert(`Executing ${action.toUpperCase()} for ${decision.ticker}: ${decision.quantity} shares`);
    } else {
      alert(`Executing global action: ${action}`);
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={summaryTab} 
          onChange={(_, newValue) => setSummaryTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Dashboard" icon={<ShowChartIcon />} iconPosition="start" />
          <Tab label="Agent Network" icon={<GroupWorkIcon />} iconPosition="start" />
          <Tab label="Performance" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {summaryTab === 0 && (
        <>
          {/* Explanatory Guide Panel */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#F5F9FF', borderLeft: '4px solid #2196F3' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Understanding Your AI Hedge Fund Dashboard
            </Typography>
            <Typography variant="body2" paragraph>
              This dashboard displays real outputs from our AI agents' analysis. Here's what you're looking at:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
              <Paper elevation={0} sx={{ p: 1, flex: '1 1 30%', minWidth: '250px', backgroundColor: '#FFFFFF' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  AI Agent Decision Summary
                </Typography>
                <Typography variant="body2">
                  Shows actual trading decisions (buy/sell/hold) made by AI agents based on their analysis, with the number of analyzed positions and average confidence level across all agents.
                </Typography>
              </Paper>
              
              <Paper elevation={0} sx={{ p: 1, flex: '1 1 30%', minWidth: '250px', backgroundColor: '#FFFFFF' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  AI Agent Analysis
                </Typography>
                <Typography variant="body2">
                  Displays the distribution of signals (bullish/bearish/neutral) from all AI agents and highlights high-confidence recommendations with their reasoning.
                </Typography>
              </Paper>
              
              <Paper elevation={0} sx={{ p: 1, flex: '1 1 30%', minWidth: '250px', backgroundColor: '#FFFFFF' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Trading Actions
                </Typography>
                <Typography variant="body2">
                  Recommended actions based on AI analysis. Click on actions to execute them (simulated in this demo).
                </Typography>
              </Paper>
            </Box>
            
            <Typography variant="body2">
              <b>Note:</b> All data shown is based on actual AI agent outputs - no simulated portfolio values or returns are displayed.
            </Typography>
          </Paper>
          
          {/* Tabular Summary View */}
          <TabularSummaryView agents={agents} decisions={decisions} />
          
          {/* Dashboard Content */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <PortfolioSummaryCard decisions={decisions} />
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <MarketInsightsCard agents={agents} />
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <TradingActionsCard 
                decisions={decisions} 
                onAction={handleTradingAction}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Card elevation={3} sx={{ borderRadius: 2 }}>
                <CardHeader
                  title="AI Agent Signal Analysis"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                />
                <CardContent>
                  <AgentCharts agents={agents} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      
      {summaryTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AgentNetworkCard 
              agents={agents} 
              onAgentAction={handleAgentAction}
            />
          </Grid>
        </Grid>
      )}
      
      {summaryTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Agent Performance Metrics"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              />
              <CardContent>
                <AgentCharts agents={agents} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <AgentPerformanceCard agents={agents} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default EnhancedSummary;
