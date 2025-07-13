import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Avatar,
  Divider,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Chat as ChatIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

// Import standardized utilities
import { 
  processAgentData, 
  processTradingDecisions, 
  calculateConsensus,
  getSignalColor, 
  SIGNAL_TYPES,
  AGENT_CONFIG 
} from '../utils/agentDataProcessor';

const AgentCommunicationFlow = ({ analysisResults, selectedStocks, isAnalyzing }) => {
  const [expandedDecision, setExpandedDecision] = useState(null);

  // Process agent data using standardized utility
  const agentData = useMemo(() => {
    return processAgentData(analysisResults, selectedStocks);
  }, [analysisResults, selectedStocks]);

  // Process trading decisions using standardized utility
  const collaborativeDecisions = useMemo(() => {
    return processTradingDecisions(analysisResults, selectedStocks);
  }, [analysisResults, selectedStocks]);

  // Calculate consensus using standardized utility
  const consensus = useMemo(() => {
    return calculateConsensus(agentData);
  }, [agentData]);

  // Generate communications from processed agent data
  const agentCommunications = useMemo(() => {
    if (agentData.length === 0) return [];

    return agentData.map(agent => {
      // Generate realistic communication message based on agent type
      let message = '';
      const agentType = agent.name.toLowerCase();
      
      if (agentType.includes('fundamental')) {
        message = `Completed fundamental analysis for ${agent.ticker || 'portfolio'}. Revenue growth and P/E ratio analysis complete.`;
      } else if (agentType.includes('technical')) {
        message = `Technical indicators for ${agent.ticker || 'portfolio'} analyzed. RSI and MACD patterns identified.`;
      } else if (agentType.includes('valuation')) {
        message = `DCF valuation for ${agent.ticker || 'portfolio'} calculated. Fair value assessment complete.`;
      } else if (agentType.includes('sentiment')) {
        message = `Market sentiment for ${agent.ticker || 'portfolio'} evaluated. News and social media analysis complete.`;
      } else if (agentType.includes('risk')) {
        message = `Risk assessment for ${agent.ticker || 'portfolio'} completed. Position limits and exposure calculated.`;
      } else if (agentType.includes('portfolio')) {
        message = `Portfolio allocation for ${agent.ticker || 'portfolio'} optimized. Weight recommendations updated.`;
      } else {
        // Investment style agents
        const style = agent.name.split(' ')[0]; // Ben, Warren, etc.
        message = `${style} investment style analysis for ${agent.ticker || 'portfolio'} complete. Strategy recommendations generated.`;
      }

      return {
        id: agent.id,
        agent: agent.name,
        message,
        ticker: agent.ticker,
        timestamp: agent.timestamp,
        priority: agent.config.priority,
        signal: agent.signal, // Keep standardized signal format
        confidence: agent.confidence,
        reasoning: agent.reasoning,
        config: agent.config
      };
    });
  }, [agentData]);

  const getSignalColor = (signal) => {
    // Convert standardized signals to color mapping
    const normalizedSignal = signal.toUpperCase();
    switch (normalizedSignal) {
      case SIGNAL_TYPES.BULLISH:
      case 'BULLISH': return '#4caf50';
      case SIGNAL_TYPES.BEARISH:
      case 'BEARISH': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getSignalIcon = (signal) => {
    switch (signal) {
      case SIGNAL_TYPES.BULLISH: return <TrendingUpIcon />;
      case SIGNAL_TYPES.BEARISH: return <TrendingDownIcon />;
      default: return <RemoveIcon />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      default: return '#666';
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Statistics calculation
  const statistics = useMemo(() => {
    const totalAgents = agentData.length;
    const activeAgents = agentCommunications.length > 0 ? 
      new Set(agentCommunications.map(c => c.agent)).size : 0;
    
    const avgConfidence = agentCommunications.length > 0 ?
      agentCommunications.reduce((sum, c) => sum + (c.confidence || 0), 0) / agentCommunications.length : 0;
    
    const consensusRate = collaborativeDecisions.length > 0 ?
      collaborativeDecisions.filter(d => d.confidence > 70).length / collaborativeDecisions.length * 100 : 0;
    
    return {
      totalCommunications: agentCommunications.length,
      activeAgents: activeAgents,
      avgResponseTime: '2.3s', // Simulated for now
      consensusRate: Math.round(consensusRate)
    };
  }, [agentCommunications, collaborativeDecisions, agentData]);

  const handleDecisionToggle = (decisionId) => {
    setExpandedDecision(expandedDecision === decisionId ? null : decisionId);
  };

  // Loading state
  if (isAnalyzing) {
    return (
      <Box sx={{ 
        height: '100vh', 
        bgcolor: '#0a0e1a', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 3
      }}>
        <CircularProgress size={60} sx={{ color: '#4caf50' }} />
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Running Agent Analysis...
        </Typography>
        <Typography variant="body2" sx={{ color: '#b0bec5' }}>
          Analyzing {selectedStocks?.join(', ')} with all available agents
        </Typography>
      </Box>
    );
  }

  // No data state
  if (!analysisResults || !selectedStocks?.length) {
    return (
      <Box sx={{ 
        height: '100vh', 
        bgcolor: '#0a0e1a', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 3,
        p: 3
      }}>
        <PsychologyIcon sx={{ fontSize: 80, color: '#666' }} />
        <Typography variant="h5" sx={{ color: '#fff', textAlign: 'center' }}>
          No Analysis Data
        </Typography>
        <Typography variant="body1" sx={{ color: '#b0bec5', textAlign: 'center', maxWidth: 400 }}>
          Select stocks and run analysis from the Dashboard to see real-time agent communications and collaborative decisions.
        </Typography>
        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
          Real data will replace synthetic simulations once analysis is run
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#0a0e1a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(15, 20, 25, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="h5" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 2, color: '#4caf50' }} />
          Agent Communication Flow
        </Typography>
        
        {/* Statistics Dashboard */}
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  {statistics.totalCommunications}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b0bec5' }}>
                  Total Communications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                  {statistics.activeAgents}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b0bec5' }}>
                  Active Agents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  {statistics.avgResponseTime}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b0bec5' }}>
                  Avg Response Time
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  {statistics.consensusRate}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#b0bec5' }}>
                  Consensus Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Communications Timeline */}
        <Box sx={{ flex: '0 0 70%', p: 3, overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center' }}>
            <ChatIcon sx={{ mr: 1 }} />
            Real-Time Agent Communications
          </Typography>
          
          {agentCommunications.length === 0 ? (
            <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
              No communications yet. Agents will appear here after analysis completes.
            </Alert>
          ) : (
            <List sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
              {agentCommunications.map((comm, index) => {
                const config = AGENT_CONFIG[comm.agent] || { color: '#666', icon: '🤖' };
                
                return (
                  <React.Fragment key={comm.id}>
                    <ListItem sx={{ py: 2, alignItems: 'flex-start' }}>
                      {/* Timeline connector */}
                      <Box sx={{ 
                        position: 'relative', 
                        mr: 2, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        minHeight: 80
                      }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: config.color, 
                            width: 32, 
                            height: 32,
                            fontSize: 14,
                            border: '2px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {config.icon}
                        </Avatar>
                        {index < agentCommunications.length - 1 && (
                          <Box sx={{
                            width: 2,
                            flex: 1,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            mt: 1
                          }} />
                        )}
                      </Box>
                      
                      {/* Communication content */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            {comm.agent}
                          </Typography>
                          <Chip 
                            label={comm.ticker}
                            size="small"
                            sx={{ bgcolor: '#2196f3', color: '#fff', fontSize: 10 }}
                          />
                          <Chip 
                            label={comm.priority}
                            size="small"
                            sx={{ 
                              bgcolor: getPriorityColor(comm.priority), 
                              color: '#fff', 
                              fontSize: 10 
                            }}
                          />
                          {comm.signal !== SIGNAL_TYPES.NEUTRAL && (
                            <Chip
                              icon={getSignalIcon(comm.signal)}
                              label={comm.signal}
                              size="small"
                              sx={{
                                bgcolor: `${getSignalColor(comm.signal)}20`,
                                color: getSignalColor(comm.signal), 
                                border: `1px solid ${getSignalColor(comm.signal)}40`,
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" sx={{ color: '#b0bec5', mb: 1 }}>
                          {comm.message}
                        </Typography>
                        
                        {comm.confidence > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" sx={{ color: '#90caf9' }}>
                              Confidence: {comm.confidence}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={comm.confidence} 
                              sx={{ 
                                width: 100, 
                                height: 4,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '& .MuiLinearProgress-bar': { bgcolor: getSignalColor(comm.signal) }
                              }} 
                            />
                          </Box>
                        )}
                        
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {formatTimestamp(comm.timestamp)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < agentCommunications.length - 1 && (
                      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>

        {/* Collaborative Decisions Panel */}
        <Box sx={{ flex: '0 0 30%', p: 3, borderLeft: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            Trading Decisions
          </Typography>
          
          {collaborativeDecisions.length === 0 ? (
            <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
              No trading decisions yet. Decisions will appear here after analysis.
            </Alert>
          ) : (
            <Box sx={{ space: 2 }}>
              {collaborativeDecisions.map((decision) => (
                <Accordion
                  key={decision.id}
                  expanded={expandedDecision === decision.id}
                  onChange={() => handleDecisionToggle(decision.id)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    mb: 2,
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#90caf9' }} />}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                          {decision.ticker}
                        </Typography>
                        <Chip 
                          label={decision.action}
                          size="small"
                          sx={{ 
                            bgcolor: getSignalColor(decision.action.toLowerCase().includes('buy') ? 'bullish' : 
                                   decision.action.toLowerCase().includes('sell') ? 'bearish' : 'neutral'),
                            color: '#fff'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#b0bec5' }}>
                        Quantity: {decision.quantity} | Confidence: {decision.confidence}%
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#b0bec5', mb: 2 }}>
                      {decision.reasoning}
                    </Typography>
                    
                    <Typography variant="subtitle2" sx={{ color: '#90caf9', mb: 1 }}>
                      Contributing Agents ({decision.contributingAgents.length}):
                    </Typography>
                    
                    {decision.contributingAgents.map((agent, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#fff' }}>
                            {agent.name}
                          </Typography>
                          {agent.signal && (
                            <Chip
                              icon={getSignalIcon(agent.signal)}
                              label={agent.signal}
                              size="small"
                              sx={{
                                bgcolor: `${getSignalColor(agent.signal)}20`,
                                color: getSignalColor(agent.signal), 
                                border: `1px solid ${getSignalColor(agent.signal)}40`,
                                fontWeight: 500
                              }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={agent.confidence} 
                            sx={{ 
                              width: 60, 
                              height: 4,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': { bgcolor: agent.config?.color || getSignalColor(agent.signal) }
                            }} 
                          />
                          <Typography variant="caption" sx={{ color: '#90caf9', minWidth: 30 }}>
                            {agent.confidence}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AgentCommunicationFlow;
