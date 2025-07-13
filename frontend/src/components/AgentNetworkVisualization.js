// AgentNetworkVisualization.js - Modern Minimalistic Trading Agent Network
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  Security,
  Speed,
  Timeline,
  Close,
  Analytics,
  ExpandMore,
  ExpandLess,
  Refresh,
  Remove
} from '@mui/icons-material';

// Import standardized utilities
import { 
  processAgentData, 
  calculateConsensus, 
  getSignalColor,
  SIGNAL_TYPES, 
  AGENT_CONFIG 
} from '../utils/agentDataProcessor';

// Modern minimalistic color scheme
const MODERN_COLORS = {
  primary: '#2563eb',      // Modern blue
  secondary: '#64748b',    // Slate grey
  success: '#10b981',      // Emerald green
  warning: '#f59e0b',      // Amber
  error: '#ef4444',        // Red
  neutral: '#6b7280',      // Grey
  surface: '#1e293b',      // Dark surface
  accent: '#8b5cf6'        // Purple accent
};

// Convert JSON analysis to plain English
const convertAnalysisToPlainEnglish = (analysis) => {
  if (typeof analysis === 'string') {
    return analysis;
  }
  
  if (typeof analysis === 'object' && analysis !== null) {
    let plainText = '';
    
    // Handle direct agent analysis structure
    if (analysis.signal && analysis.reasoning) {
      plainText += `**Overall Signal:** ${analysis.signal.toUpperCase()}\n`;
      plainText += `**Confidence Level:** ${analysis.confidence || 'N/A'}%\n\n`;
      
      if (analysis.reasoning) {
        plainText += `**Detailed Analysis:**\n\n`;
        
        if (typeof analysis.reasoning === 'string') {
          plainText += analysis.reasoning;
        } else if (typeof analysis.reasoning === 'object') {
          Object.entries(analysis.reasoning).forEach(([category, details]) => {
            const categoryName = category.replace(/_/g, ' ').replace(/signal/g, '').trim();
            const categoryTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            
            plainText += `**${categoryTitle}:** `;
            
            if (typeof details === 'object' && details !== null) {
              if (details.signal) {
                plainText += `${details.signal.charAt(0).toUpperCase() + details.signal.slice(1)}`;
              }
              if (details.details) {
                plainText += ` - ${details.details}`;
              } else if (details.value !== undefined) {
                plainText += ` ${details.value}`;
              } else {
                // Handle other object properties
                const detailStr = Object.entries(details)
                  .filter(([k, v]) => typeof v !== 'object')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ');
                if (detailStr) {
                  plainText += detailStr;
                }
              }
            } else {
              plainText += details;
            }
            plainText += '\n\n';
          });
        }
      }
      
      return plainText;
    }
    
    // Check if it's ticker-based structure (legacy support)
    Object.entries(analysis).forEach(([ticker, data]) => {
      if (typeof data === 'object' && data.signal && data.reasoning) {
        plainText += `## ${ticker} Analysis\n\n`;
        plainText += `**Overall Signal:** ${data.signal.toUpperCase()}\n`;
        plainText += `**Confidence Level:** ${data.confidence}%\n\n`;
        
        if (data.reasoning) {
          plainText += `**Detailed Analysis:**\n\n`;
          
          Object.entries(data.reasoning).forEach(([category, details]) => {
            const categoryName = category.replace(/_/g, ' ').replace(/signal/g, '').trim();
            const categoryTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            
            plainText += `**${categoryTitle}:** `;
            if (details.signal) {
              plainText += `${details.signal.charAt(0).toUpperCase() + details.signal.slice(1)}`;
            }
            if (details.details) {
              plainText += ` - ${details.details}`;
            }
            plainText += '\n\n';
          });
        }
        plainText += '\n---\n\n';
      }
    });
    
    // If no structured format found, try to format as readable JSON
    if (!plainText) {
      plainText = JSON.stringify(analysis, null, 2)
        .replace(/[{}]/g, '')
        .replace(/"/g, '')
        .replace(/,\n/g, '\n')
        .replace(/:/g, ': ')
        .trim();
    }
    
    return plainText || 'No detailed analysis available';
  }
  
  return 'No analysis available';
};

const AgentNetworkVisualization = ({ analysisResults, selectedStocks, isAnalyzing }) => {
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Process analysis results into standardized agent data
  const agentData = useMemo(() => {
    return processAgentData(analysisResults, selectedStocks);
  }, [analysisResults, selectedStocks]);

  // Calculate consensus using standardized function
  const consensus = useMemo(() => {
    return calculateConsensus(agentData);
  }, [agentData]);

  // Get signal icon based on original agentic format
  const getSignalIcon = (signal) => {
    switch (signal) {
      case SIGNAL_TYPES.BULLISH: return <TrendingUp />;
      case SIGNAL_TYPES.BEARISH: return <TrendingDown />;
      default: return <Remove />;
    }
  };

  // Get signal color for UI elements  
  const getSignalColorForUI = (signal) => {
    switch (signal) {
      case SIGNAL_TYPES.BULLISH: return '#4caf50';
      case SIGNAL_TYPES.BEARISH: return '#f44336';
      default: return '#ff9800';
    }
  };

  // Agent Card Component
  const AgentCard = ({ agent, onClick }) => (
    <Card
      onClick={() => onClick(agent)}
      sx={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
          border: `1px solid ${agent.config.color}40`,
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Agent Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${agent.config.color}20`,
              color: agent.config.color,
              width: 40,
              height: 40,
              mr: 1.5,
              fontSize: '18px'
            }}
          >
            {agent.config.icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {agent.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#b0bec5',
                fontSize: '11px',
                mt: 0.5
              }}
            >
              {agent.config.category}
            </Typography>
          </Box>
        </Box>

        {/* Signal Chip */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Chip
            icon={getSignalIcon(agent.signal)}
            label={agent.signal}
            size="small"
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: `${getSignalColorForUI(agent.signal)}20`,
              color: getSignalColorForUI(agent.signal),
              px: 2,
              py: 1,
              borderRadius: '20px',
              border: `1px solid ${getSignalColorForUI(agent.signal)}40`,
              flex: 1,
              justifyContent: 'center'
            }}
          />
        </Box>

        {/* Confidence Metric */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#b0bec5', fontSize: '12px' }}>
              Confidence
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', fontSize: '12px', fontWeight: 600 }}>
              {agent.confidence}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={agent.confidence}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: agent.config.color,
                borderRadius: 3,
              }
            }}
          />
        </Box>

        {/* Reasoning Preview */}
        <Typography
          variant="body2"
          sx={{
            color: '#b0bec5',
            fontSize: '11px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {agent.reasoning?.substring(0, 100) + (agent.reasoning?.length > 100 ? '...' : '')}
        </Typography>
      </CardContent>
    </Card>
  );

  // Consensus Engine Component
  const ConsensusEngine = () => {
    if (!agentData.length) return null;
    
    // Get consensus for the first selected stock (or first stock if none selected)
    const ticker = selectedStocks.length > 0 ? selectedStocks[0] : 
                   (agentData.length > 0 ? agentData[0].ticker : 'AAPL');
    const consensusData = consensus[ticker];
    
    if (!consensusData) return null;
    
    // Calculate confidence percentage from the leading signal
    const { percentages } = consensusData;
    const maxPercentage = Math.max(percentages.bullish, percentages.bearish, percentages.neutral);
    
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          bgcolor: 'rgba(18, 18, 18, 0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          backdrop: 'blur(10px)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 600,
            textAlign: 'center',
            mb: 2
          }}
        >
          Consensus Engine
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            p: 2,
            bgcolor: `${getSignalColorForUI(consensusData.signal)}20`,
            borderRadius: '16px',
            border: `2px solid ${getSignalColorForUI(consensusData.signal)}40`
          }}
        >
          {getSignalIcon(consensusData.signal)}
          <Typography
            variant="h4"
            sx={{
              color: getSignalColorForUI(consensusData.signal),
              ml: 2,
              fontWeight: 700
            }}
          >
            {consensusData.signal.toUpperCase()}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" sx={{ color: '#b0bec5', mb: 1 }}>
              Confidence
            </Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              {Math.round(maxPercentage)}%
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" sx={{ color: '#b0bec5', mb: 1 }}>
              Agreement
            </Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              {Math.round(maxPercentage)}%
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" sx={{ color: '#b0bec5', mb: 1 }}>
              Active Agents
            </Typography>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              {consensusData.counts.total}/12
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />

        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: MODERN_COLORS.success, fontWeight: 600 }}>
                BUY: {consensusData.counts.bullish}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: MODERN_COLORS.error, fontWeight: 600 }}>
                SELL: {consensusData.counts.bearish}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: MODERN_COLORS.neutral, fontWeight: 600 }}>
                NEUTRAL: {consensusData.counts.neutral}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  if (isAnalyzing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#0a0a0a'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: MODERN_COLORS.primary, mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            Analyzing Agent Network
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0bec5' }}>
            Agents are processing {selectedStocks.join(', ')}...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!analysisResults || agentData.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#0a0a0a',
          p: 3
        }}
      >
        <Alert
          severity="info"
          sx={{
            bgcolor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#2196f3' }
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Analysis Data Available
          </Typography>
          <Typography variant="body2">
            Run an analysis from the Dashboard to see the agent network in action.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Agent Details Modal
  const AgentDetailsModal = () => {
    if (!selectedAgent) return null;

    const fullReasoning = convertAnalysisToPlainEnglish(selectedAgent.rawAnalysis || selectedAgent);

    return (
      <Dialog
        open={Boolean(selectedAgent)}
        onClose={() => setSelectedAgent(null)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${selectedAgent.config.color}30`,
            borderRadius: '16px',
            p: 4,
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={() => setSelectedAgent(null)}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: '#94a3b8',
            '&:hover': { color: '#fff' }
          }}
        >
          <Close />
        </IconButton>

        <DialogContent sx={{ p: 0 }}>
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Avatar 
              sx={{ 
                bgcolor: selectedAgent.config.color, 
                width: 64, 
                height: 64,
                boxShadow: `0 8px 32px ${selectedAgent.config.color}40`
              }}
            >
              {selectedAgent.config.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#fff', 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                {selectedAgent.name}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: selectedAgent.config.color,
                  fontWeight: 500,
                  mb: 2
                }}
              >
                {selectedAgent.config.description}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={getSignalIcon(selectedAgent.signal)}
                  label={selectedAgent.signal}
                  sx={{
                    bgcolor: `${getSignalColorForUI(selectedAgent.signal)}20`,
                    color: getSignalColorForUI(selectedAgent.signal),
                    border: `1px solid ${getSignalColorForUI(selectedAgent.signal)}40`,
                    fontWeight: 600
                  }}
                />
                <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                  Confidence: <span style={{ color: '#fff', fontWeight: 600 }}>{selectedAgent.confidence}%</span>
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ borderColor: '#334155', mb: 3 }} />

          <Typography 
            variant="h6" 
            sx={{ 
              color: '#fff', 
              fontWeight: 600, 
              mb: 2,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Analytics sx={{ mr: 1, color: selectedAgent.config.color }} />
            Detailed Analysis
          </Typography>

          <Box
            sx={{
              bgcolor: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '12px',
              p: 3,
              border: '1px solid #334155',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: '#e2e8f0',
                lineHeight: 1.6,
                fontSize: '14px',
                '& strong': {
                  color: '#fff',
                  fontWeight: 600
                },
                '& hr': {
                  borderColor: '#334155',
                  margin: '16px 0'
                }
              }}
              dangerouslySetInnerHTML={{
                __html: fullReasoning
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/##\s(.*)/g, '<strong style="font-size: 1.1em; color: ' + selectedAgent.config.color + ';">$1</strong>')
                  .replace(/---/g, '<hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;" />')
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Agent Network Intelligence
          </Typography>
          <Typography variant="body1" sx={{ color: '#b0bec5' }}>
            Real-time analysis from {agentData.length} AI agents for {selectedStocks.join(', ')}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showFlowAnimation}
                onChange={(e) => setShowFlowAnimation(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: MODERN_COLORS.primary },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: MODERN_COLORS.primary }
                }}
              />
            }
            label={<Typography sx={{ color: '#b0bec5' }}>Flow Animation</Typography>}
          />
          <IconButton sx={{ color: MODERN_COLORS.primary }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Consensus Engine */}
      <Box sx={{ mb: 4 }}>
        <ConsensusEngine />
      </Box>

      {/* Agent Grid */}
      <Grid container spacing={2}>
        {agentData.map((agent, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={agent.name}>
            <AgentCard agent={agent} onClick={setSelectedAgent} />
          </Grid>
        ))}
      </Grid>

      {AgentDetailsModal()}
    </Box>
  );
};

export default AgentNetworkVisualization;
