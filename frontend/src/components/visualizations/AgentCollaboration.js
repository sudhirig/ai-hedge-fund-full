import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AgentAvatar from '../AgentAvatars';

// Agent Card Component
function AgentCard({ agent, data, isActive, onActivate }) {
  const [expanded, setExpanded] = useState(false);
  
  // Get agent data
  const agentData = data && data[agent] ? data[agent] : {};
  const firstTicker = Object.keys(agentData)[0] || '';
  const tickerData = firstTicker ? agentData[firstTicker] : {};
  
  // Get signal and confidence
  const signal = tickerData.signal || 'N/A';
  const confidence = tickerData.confidence || 0;
  
  // Get reasoning
  const reasoning = tickerData.reasoning || '';
  
  // Determine signal color
  const signalColor = 
    signal?.toLowerCase() === 'bullish' ? 'success' :
    signal?.toLowerCase() === 'bearish' ? 'error' :
    'default';
  
  // Determine border color based on activity
  const borderColor = isActive ? '#4CAF50' : '#e0e0e0';
  const shadowColor = isActive ? 'rgba(76, 175, 80, 0.5)' : 'rgba(0, 0, 0, 0.1)';
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${borderColor}`,
        boxShadow: isActive ? `0 0 15px ${shadowColor}` : 'none',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {isActive && (
        <Box 
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)' },
              '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
            }
          }}
        />
      )}
      
      <CardHeader
        avatar={<AgentAvatar agent={agent} />}
        title={agent}
        action={
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Signal for {firstTicker}:
          </Typography>
          <Chip 
            label={signal} 
            color={signalColor} 
            size="small" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`${confidence}% Confidence`} 
            variant="outlined" 
            size="small" 
          />
        </Box>
        
        <Collapse in={expanded}>
          <Typography variant="subtitle2" gutterBottom>
            Reasoning:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1.5, 
              mb: 2, 
              maxHeight: 150, 
              overflow: 'auto',
              bgcolor: '#f5f5f5'
            }}
          >
            <Typography variant="body2">
              {typeof reasoning === 'string' 
                ? reasoning 
                : typeof reasoning === 'object' 
                  ? JSON.stringify(reasoning, null, 2) 
                  : 'No reasoning available'}
            </Typography>
          </Paper>
        </Collapse>
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0 }}>
        <Button 
          variant={isActive ? "contained" : "outlined"} 
          color={isActive ? "success" : "primary"}
          size="small"
          fullWidth
          onClick={onActivate}
        >
          {isActive ? "Active" : "Activate"}
        </Button>
      </Box>
    </Card>
  );
}

// Message Component
function CollaborationMessage({ message }) {
  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: message.type === 'info' ? '#E3F2FD' : 
                         message.type === 'warning' ? '#FFF8E1' :
                         message.type === 'success' ? '#E8F5E9' : '#FFFFFF',
        borderLeft: `4px solid ${message.type === 'info' ? '#2196F3' : 
                                message.type === 'warning' ? '#FFC107' :
                                message.type === 'success' ? '#4CAF50' : '#9E9E9E'}`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ mr: 2, mt: 0.5 }}>
          {message.type === 'info' && <InfoIcon color="info" />}
          {message.type === 'warning' && <WarningIcon color="warning" />}
          {message.type === 'success' && <CheckCircleIcon color="success" />}
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {message.title}
          </Typography>
          <Typography variant="body2">
            {message.content}
          </Typography>
          {message.details && (
            <Box sx={{ mt: 1 }}>
              <Collapse in={message.expanded}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.details}
                  </Typography>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// Decision Card Component
function DecisionCard({ decision, ticker }) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine action color
  const actionColor = 
    decision.action?.toLowerCase() === 'buy' ? 'success' :
    decision.action?.toLowerCase() === 'sell' ? 'error' :
    decision.action?.toLowerCase() === 'short' ? 'error' :
    decision.action?.toLowerCase() === 'cover' ? 'success' :
    'info';
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={`Decision for ${ticker}`}
        subheader={`Confidence: ${decision.confidence}%`}
        action={
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            Action:
          </Typography>
          <Chip 
            label={decision.action} 
            color={actionColor} 
            size="medium" 
          />
          {decision.quantity && (
            <Typography variant="body1" sx={{ ml: 2 }}>
              Quantity: {decision.quantity}
            </Typography>
          )}
        </Box>
        
        <Collapse in={expanded}>
          <Typography variant="subtitle2" gutterBottom>
            Reasoning:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1.5, 
              bgcolor: '#f5f5f5',
              maxHeight: 200,
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {decision.reasoning || 'No reasoning provided'}
            </Typography>
          </Paper>
        </Collapse>
      </CardContent>
    </Card>
  );
}

// Main Component
function AgentCollaboration({ simulationData }) {
  const [activeAgents, setActiveAgents] = useState([]);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [consensusScore, setConsensusScore] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  
  // Get agent data from simulation
  const agentData = simulationData?.agents || {};
  const decisions = simulationData?.decisions || {};
  
  // List of all agents
  const allAgents = Object.keys(agentData);
  
  // First ticker (for demo purposes)
  const firstTicker = Object.keys(decisions)[0] || '';
  
  // Toggle agent activation
  const toggleAgent = (agent) => {
    if (activeAgents.includes(agent)) {
      setActiveAgents(activeAgents.filter(a => a !== agent));
    } else {
      setActiveAgents([...activeAgents, agent]);
    }
  };
  
  // Start simulation
  const startSimulation = () => {
    // Reset state
    setSimulationStep(0);
    setMessages([]);
    setIsSimulating(true);
  };
  
  // Pause simulation
  const pauseSimulation = () => {
    setIsSimulating(false);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    setSimulationStep(0);
    setMessages([]);
    setActiveAgents([]);
    setIsSimulating(false);
    setConsensusScore(0);
    setConfidenceScore(0);
  };
  
  // Simulation steps
  useEffect(() => {
    if (!isSimulating) return;
    
    const simulationSteps = [
      // Step 1: Activate Strategic Investor Agents
      () => {
        const strategicAgents = allAgents.filter(a => 
          a.includes('Agent') && 
          !a.includes('Management') && 
          !a.includes('Risk')
        );
        setActiveAgents(strategicAgents);
        setMessages([
          {
            type: 'info',
            title: 'Agent Activation',
            content: 'Strategic investor agents have been activated to analyze the market data.',
            expanded: false
          }
        ]);
      },
      
      // Step 2: Agents Analyze Data
      () => {
        setMessages(prev => [...prev, 
          {
            type: 'info',
            title: 'Data Analysis',
            content: 'Agents are analyzing financial data, news, and market conditions.',
            expanded: false
          }
        ]);
      },
      
      // Step 3: Agents Generate Insights
      () => {
        // Calculate a simulated consensus score
        const signals = [];
        activeAgents.forEach(agent => {
          if (agentData[agent] && agentData[agent][firstTicker]) {
            signals.push(agentData[agent][firstTicker].signal);
          }
        });
        
        const bullishCount = signals.filter(s => s?.toLowerCase() === 'bullish').length;
        const bearishCount = signals.filter(s => s?.toLowerCase() === 'bearish').length;
        const totalCount = signals.length;
        
        const consensus = totalCount > 0 
          ? Math.max(bullishCount, bearishCount) / totalCount * 100 
          : 0;
        
        setConsensusScore(Math.round(consensus));
        
        // Calculate average confidence
        let totalConfidence = 0;
        let confidenceCount = 0;
        
        activeAgents.forEach(agent => {
          if (agentData[agent] && agentData[agent][firstTicker] && agentData[agent][firstTicker].confidence) {
            totalConfidence += agentData[agent][firstTicker].confidence;
            confidenceCount++;
          }
        });
        
        const avgConfidence = confidenceCount > 0 
          ? totalConfidence / confidenceCount 
          : 0;
        
        setConfidenceScore(Math.round(avgConfidence));
        
        setMessages(prev => [...prev, 
          {
            type: 'success',
            title: 'Insights Generated',
            content: `Agents have generated insights with ${Math.round(consensus)}% consensus and ${Math.round(avgConfidence)}% average confidence.`,
            expanded: false
          }
        ]);
      },
      
      // Step 4: Risk Management
      () => {
        setActiveAgents(prev => [...prev, 'Risk Management Agent']);
        
        setMessages(prev => [...prev, 
          {
            type: 'warning',
            title: 'Risk Assessment',
            content: 'Risk Management Agent is evaluating position limits and portfolio exposure.',
            expanded: false
          }
        ]);
      },
      
      // Step 5: Portfolio Management
      () => {
        setActiveAgents(prev => [...prev, 'Portfolio Management Agent']);
        
        setMessages(prev => [...prev, 
          {
            type: 'info',
            title: 'Portfolio Optimization',
            content: 'Portfolio Management Agent is determining optimal position sizes and timing.',
            expanded: false
          }
        ]);
      },
      
      // Step 6: Final Decision
      () => {
        const decision = decisions[firstTicker];
        
        setMessages(prev => [...prev, 
          {
            type: 'success',
            title: 'Decision Generated',
            content: `Final decision: ${decision?.action || 'N/A'} ${decision?.quantity || ''} shares of ${firstTicker} with ${decision?.confidence || 0}% confidence.`,
            details: decision?.reasoning || '',
            expanded: true
          }
        ]);
        
        // End simulation
        setIsSimulating(false);
      }
    ];
    
    if (simulationStep < simulationSteps.length) {
      const timer = setTimeout(() => {
        simulationSteps[simulationStep]();
        setSimulationStep(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSimulating, simulationStep, activeAgents, allAgents, agentData, decisions, firstTicker]);
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Agent Collaboration Layer
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        {/* Simulation Controls */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Simulation Controls
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={startSimulation}
              disabled={isSimulating || !simulationData}
              sx={{ mr: 1 }}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PauseIcon />}
              onClick={pauseSimulation}
              disabled={!isSimulating}
              sx={{ mr: 1 }}
            >
              Pause
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RestartAltIcon />}
              onClick={resetSimulation}
              disabled={!simulationData}
            >
              Reset
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column: Agents */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Agent Network
            </Typography>
            
            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              <Grid container spacing={2}>
                {allAgents.map(agent => (
                  <Grid item xs={12} key={agent}>
                    <AgentCard
                      agent={agent}
                      data={agentData}
                      isActive={activeAgents.includes(agent)}
                      onActivate={() => toggleAgent(agent)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
          
          {/* Middle Column: Collaboration Process */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Collaboration Process
            </Typography>
            
            {/* Progress */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Simulation Progress</Typography>
                <Typography variant="body2">{Math.min(100, Math.round(simulationStep / 6 * 100))}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, Math.round(simulationStep / 6 * 100))} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            
            {/* Messages */}
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {messages.map((message, index) => (
                <CollaborationMessage key={index} message={message} />
              ))}
              
              {messages.length === 0 && (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No collaboration data yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start the simulation to see agent collaboration in action
                  </Typography>
                </Paper>
              )}
            </Box>
          </Grid>
          
          {/* Right Column: Decision Output */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Decision Output
            </Typography>
            
            {/* Consensus Metrics */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Collaboration Metrics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" gutterBottom>
                    Consensus Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={consensusScore} 
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {consensusScore}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" gutterBottom>
                    Confidence Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={confidenceScore} 
                        color="primary"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {confidenceScore}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Trading Decisions */}
            <Typography variant="subtitle2" gutterBottom>
              Final Trading Decisions
            </Typography>
            
            {Object.entries(decisions).length > 0 ? (
              Object.entries(decisions).map(([ticker, decision]) => (
                <DecisionCard 
                  key={ticker} 
                  decision={decision} 
                  ticker={ticker} 
                />
              ))
            ) : (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  backgroundColor: '#f5f5f5'
                }}
              >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No decisions yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete the simulation to see final trading decisions
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <InfoIcon color="info" sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          This visualization demonstrates how multiple AI agents collaborate to analyze data,
          build consensus, and generate trading decisions.
        </Typography>
      </Box>
    </Box>
  );
}

export default AgentCollaboration;
