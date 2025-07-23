import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  alpha,
  Drawer,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  Psychology as AgentIcon,
  TrendingUp as TechnicalIcon,
  Analytics as FundamentalIcon,
  SentimentSatisfied as SentimentIcon,
  Security as RiskIcon,
  AccountBalance as PortfolioIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useCustomTheme } from '../theme/ThemeProvider';

// Modern minimalistic color scheme (from AgentNetworkVisualization)
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

// Helper function to get agent icons
const getAgentIcon = (type) => {
  switch (type) {
    case 'technical': return <TechnicalIcon />;
    case 'fundamental': return <FundamentalIcon />;
    case 'sentiment': return <SentimentIcon />;
    case 'risk': return <RiskIcon />;
    case 'portfolio': return <PortfolioIcon />;
    default: return <PersonIcon />;
  }
};

// Convert JSON analysis to plain English (from AgentNetworkVisualization)
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
          Object.entries(analysis.reasoning).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
              plainText += `• **${key.replace(/_/g, ' ').toUpperCase()}:** ${value}\n`;
            }
          });
        }
      }
    } else {
      // Handle nested object structure
      Object.entries(analysis).forEach(([key, value]) => {
        if (key === 'signal' || key === 'confidence') return; // Skip already handled
        
        if (typeof value === 'string' || typeof value === 'number') {
          plainText += `• **${key.replace(/_/g, ' ').toUpperCase()}:** ${value}\n`;
        } else if (typeof value === 'object' && value !== null) {
          plainText += `\n**${key.replace(/_/g, ' ').toUpperCase()}:**\n`;
          Object.entries(value).forEach(([subKey, subValue]) => {
            plainText += `  • ${subKey.replace(/_/g, ' ')}: ${subValue}\n`;
          });
        }
      });
    }
    
    return plainText || 'Analysis data available but format not recognized.';
  }
  
  return 'No analysis data available.';
};

// Enhanced Custom Edge Component with sophisticated styling
const CustomEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition,
  style = {},
  data = {},
  markerEnd,
  animated = false
}) => {
  const { theme, financialColors } = useCustomTheme();
  
  // Calculate edge path
  const edgePath = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
  
  // Dynamic styling based on connection type
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeDasharray: data.type === 'collaboration' ? '5,5' : data.type === 'decision' ? '10,2' : 'none',
      strokeWidth: data.important ? 3 : 2,
      opacity: 0.8,
      transition: 'all 0.3s ease-in-out'
    };
    
    if (data.signal) {
      switch (data.signal) {
        case 'bullish':
          return { ...baseStyle, stroke: financialColors.success, filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.4))' };
        case 'bearish':
          return { ...baseStyle, stroke: financialColors.danger, filter: 'drop-shadow(0 0 4px rgba(244, 67, 54, 0.4))' };
        case 'neutral':
          return { ...baseStyle, stroke: financialColors.warning, filter: 'drop-shadow(0 0 4px rgba(255, 193, 7, 0.4))' };
        default:
          return { ...baseStyle, stroke: theme.palette.primary.main };
      }
    }
    
    return { ...baseStyle, stroke: theme.palette.divider, ...style };
  };
  
  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
        </linearGradient>
        {animated && (
          <circle id={`flow-${id}`} r="3" fill={getEdgeStyle().stroke}>
            <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
          </circle>
        )}
      </defs>
      <path
        id={id}
        style={getEdgeStyle()}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {animated && <use xlinkHref={`#flow-${id}`} />}
    </>
  );
};

// Enhanced Custom Agent Node Component with animations and polish
const AgentNode = React.memo(({ data }) => {
  const { theme, financialColors } = useCustomTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  const getSignalColor = (signal) => {
    // Ensure we always return a valid color
    const colors = {
      bullish: financialColors?.success || theme?.palette?.success?.main || '#4caf50',
      bearish: financialColors?.danger || theme?.palette?.error?.main || '#f44336', 
      neutral: financialColors?.warning || theme?.palette?.warning?.main || '#ff9800'
    };
    return colors[signal] || theme?.palette?.text?.secondary || '#666666';
  };

  const getStatusColor = (status) => {
    // Ensure we always return a valid color
    const colors = {
      running: financialColors?.bullish || theme?.palette?.info?.main || '#2196f3',
      completed: financialColors?.success || theme?.palette?.success?.main || '#4caf50',
      error: financialColors?.bearish || theme?.palette?.error?.main || '#f44336'
    };
    return colors[status] || theme?.palette?.grey?.[500] || '#9e9e9e';
  };

  // Helper function to safely get contrast text
  const getSafeContrastText = (color) => {
    try {
      // Ensure color is a valid string
      if (typeof color !== 'string' || !color) {
        return theme.palette.getContrastText('#ffffff');
      }
      return theme.palette.getContrastText(color);
    } catch (error) {
      console.warn('Invalid color for contrast text:', color, error);
      return theme.palette.getContrastText('#ffffff');
    }
  };

  // Enhanced styling with animations and polish
  const getNodeStyle = () => {
    const baseStyle = {
      minWidth: 160,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      filter: isHovered 
        ? 'drop-shadow(0 8px 25px rgba(0,0,0,0.15))' 
        : 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
      '&:hover': {
        transform: 'scale(1.05)',
        filter: 'drop-shadow(0 8px 25px rgba(0,0,0,0.15))'
      }
    };
    
    if (data.status === 'running') {
      return {
        ...baseStyle,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.02)' }
        }
      };
    }
    
    return baseStyle;
  };

  // Dynamic border color based on confidence and signal
  const getBorderStyle = () => {
    const confidence = data.confidence || 0;
    const signal = data.signal;
    
    if (confidence > 70) {
      return {
        borderWidth: 3,
        borderColor: getSignalColor(signal),
        borderStyle: 'solid'
      };
    } else if (confidence > 40) {
      return {
        borderWidth: 2,
        borderColor: getSignalColor(signal),
        borderStyle: 'dashed'
      };
    }
    
    return {
      borderWidth: 1,
      borderColor: theme.palette.divider,
      borderStyle: 'solid'
    };
  };

  return (
    <Card 
      sx={{ 
        ...getNodeStyle(),
        ...getBorderStyle(),
        backgroundColor: alpha(
          theme.palette.background.paper, 
          data.status === 'idle' ? 0.7 : 0.95
        ),
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'visible'
      }}
      onClick={data.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${data.label} agent with ${data.confidence || 0}% confidence and ${data.signal || 'no'} signal`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
      <CardContent sx={{ p: 2 }}>
        {/* Confidence indicator overlay */}
        {data.confidence && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: getSignalColor(data.signal),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              boxShadow: theme.shadows[4],
              zIndex: 1
            }}
          >
            {Math.round(data.confidence)}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: getStatusColor(data.status),
              mr: 1 
            }}
            aria-hidden="true"
          >
            {getAgentIcon(data.type)}
          </Avatar>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              lineHeight: 1.2,
              wordWrap: 'break-word'
            }}
          >
            {data.label}
          </Typography>
        </Box>
        
        <Chip 
          label={data.signal || 'idle'}
          size="small"
          sx={{
            backgroundColor: alpha(getSignalColor(data.signal), 0.2),
            color: getSignalColor(data.signal),
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha(getSignalColor(data.signal), 0.3),
              transform: 'scale(1.05)'
            }
          }}
        />
        
        {data.confidence && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Confidence: {Math.round(data.confidence)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={data.confidence}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.divider, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getSignalColor(data.signal),
                  borderRadius: 2,
                  transition: 'all 0.3s ease'
                }
              }}
            />
          </Box>
        )}
        
        {data.signal && (
          <Chip 
            label={data.signal.toUpperCase()}
            size="small" 
            variant="outlined"
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.6rem', sm: '0.65rem' },
              height: { xs: 18, sm: 20 },
              fontWeight: 'bold',
              color: getSignalColor(data.signal),
              borderColor: getSignalColor(data.signal),
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: alpha(getSignalColor(data.signal), 0.1),
                transform: 'scale(1.05)'
              }
            }}
            aria-label={`Trading signal: ${data.signal}`}
          />
        )}
      </CardContent>
      
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </Card>
  );
});



// Enhanced Agent Details Modal (from AgentNetworkVisualization)
const AgentDetailsModal = ({ open, onClose, agent, analysisResults }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  
  if (!agent) return null;
  
  // Get agent data from analysisResults
  const agentData = analysisResults?.agents?.[agent.id] || agent.data || {};
  const fullReasoning = convertAnalysisToPlainEnglish(agentData.rawAnalysis || agentData);
  
  // Get agent config for styling
  const agentConfig = {
    color: agent.data?.signal === 'bullish' ? MODERN_COLORS.success : 
           agent.data?.signal === 'bearish' ? MODERN_COLORS.error : MODERN_COLORS.neutral,
    icon: getAgentIcon(agent.type || 'default')
  };
  
  const handleExpandClick = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${agentConfig.color}30`,
          borderRadius: '20px',
          boxShadow: `0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px ${agentConfig.color}20`,
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#94a3b8',
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 1000,
          '&:hover': { 
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.4)'
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 4, overflow: 'auto' }}>
        {/* Header Section */}
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Avatar 
            sx={{ 
              bgcolor: agentConfig.color, 
              width: 72, 
              height: 72,
              boxShadow: `0 8px 32px ${agentConfig.color}40`,
              border: `2px solid ${agentConfig.color}60`
            }}
          >
            {agentConfig.icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#fff', 
                fontWeight: 700,
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {agent.label || agent.name || 'Trading Agent'}
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ color: '#94a3b8', mb: 2 }}
            >
              {agent.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Financial Analysis Agent'}
            </Typography>
            
            {/* Signal & Confidence Chips */}
            <Stack direction="row" spacing={2}>
              <Chip
                label={agentData.signal?.toUpperCase() || 'ANALYZING'}
                sx={{
                  bgcolor: `${agentConfig.color}20`,
                  color: agentConfig.color,
                  border: `1px solid ${agentConfig.color}40`,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              />
              <Chip
                label={`${agentData.confidence || 0}% Confidence`}
                variant="outlined"
                sx={{
                  borderColor: '#64748b',
                  color: '#e2e8f0',
                  fontWeight: 500
                }}
              />
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ bgcolor: '#334155', mb: 4 }} />

        {/* Main Analysis Section */}
        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '12px'
              }}
            >
              <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
                Performance Metrics
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    Confidence Level
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={agentData.confidence || 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(100, 116, 139, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: agentConfig.color,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {agentData.confidence || 0}%
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Status: <Chip 
                      size="small"
                      label={agent.status || 'Active'}
                      sx={{ 
                        bgcolor: agent.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: agent.status === 'completed' ? '#10b981' : '#3b82f6',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Detailed Analysis */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <Accordion
                expanded={expandedSection === 'analysis'}
                onChange={() => handleExpandClick('analysis')}
                sx={{
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#e2e8f0' }}>
                    📊 Detailed Analysis
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Box 
                    sx={{ 
                      maxHeight: 400, 
                      overflow: 'auto',
                      p: 2,
                      bgcolor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      border: '1px solid rgba(100, 116, 139, 0.1)'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#cbd5e1',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.6,
                        '& strong': {
                          color: '#f1f5f9',
                          fontWeight: 600
                        }
                      }}
                    >
                      {fullReasoning}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid>
        </Grid>

        {/* Additional Agent Info */}
        {agentData.rawAnalysis && (
          <Box sx={{ mt: 3 }}>
            <Paper
              sx={{
                p: 2,
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '12px'
              }}
            >
              <Accordion
                expanded={expandedSection === 'raw'}
                onChange={() => handleExpandClick('raw')}
                sx={{
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    minHeight: 'auto',
                    '&.Mui-expanded': {
                      minHeight: 'auto'
                    }
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}
                >
                  <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>
                    🔧 Raw Analysis Data
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1 }}>
                  <Box 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto',
                      bgcolor: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      p: 2
                    }}
                  >
                    <pre style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      fontFamily: 'Menlo, Monaco, Consolas, monospace',
                      color: '#94a3b8',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {JSON.stringify(agentData.rawAnalysis, null, 2)}
                    </pre>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AgentFlowVisualization = ({ analysisResults, onRunAnalysis, isAnalysisRunning }) => {
  const { theme, financialColors } = useCustomTheme();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Monitor data updates for debugging if needed
  useEffect(() => {
    if (analysisResults) {
      console.log('✅ AgentFlowVisualization - Analysis data loaded:', Object.keys(analysisResults.agents || {}).length, 'agents');
    }
  }, [analysisResults]);

  // Define agent types and their connections - using actual backend agent names
  // Strategic 3-tier layout: Analysis Layer → Investment Experts → Decision Layer
  const agentDefinitions = [
    // Core Analysis Agents - Top Tier (More spaced out horizontally)
    { id: 'Fundamental Analysis Agent', label: 'Fundamental Analysis', type: 'fundamental', position: { x: 150, y: 100 } },
    { id: 'Valuation Analysis Agent', label: 'Valuation Analysis', type: 'fundamental', position: { x: 450, y: 100 } },
    { id: 'Sentiment Analysis Agent', label: 'Sentiment Analysis', type: 'sentiment', position: { x: 750, y: 100 } },
    
    // Famous Investor Agents - Second Tier (Better spacing)
    { id: 'Warren Buffett Agent', label: 'Warren Buffett', type: 'person', position: { x: 50, y: 300 } },
    { id: 'Ben Graham Agent', label: 'Ben Graham', type: 'person', position: { x: 250, y: 300 } },
    { id: 'Charlie Munger Agent', label: 'Charlie Munger', type: 'person', position: { x: 450, y: 300 } },
    { id: 'Peter Lynch Agent', label: 'Peter Lynch', type: 'person', position: { x: 650, y: 300 } },
    { id: 'Phil Fisher Agent', label: 'Phil Fisher', type: 'person', position: { x: 850, y: 300 } },
    
    // Modern Investor Agents - Third Tier (Wider spacing)
    { id: 'Cathie Wood Agent', label: 'Cathie Wood', type: 'person', position: { x: 50, y: 500 } },
    { id: 'Bill Ackman Agent', label: 'Bill Ackman', type: 'person', position: { x: 250, y: 500 } },
    { id: 'Michael Burry Agent', label: 'Michael Burry', type: 'person', position: { x: 450, y: 500 } },
    { id: 'Stanley Druckenmiller Agent', label: 'Stanley Druckenmiller', type: 'person', position: { x: 650, y: 500 } },
    { id: 'Aswath Damodaran Agent', label: 'Aswath Damodaran', type: 'person', position: { x: 850, y: 500 } },
    { id: 'Rakesh Jhunjhunwala Agent', label: 'Rakesh Jhunjhunwala', type: 'person', position: { x: 150, y: 700 } },
    
    // Management Agents - Bottom Tier (Centered and spaced)
    { id: 'Risk Management Agent', label: 'Risk Management', type: 'risk', position: { x: 300, y: 850 } },
    { id: 'Portfolio Management Agent', label: 'Portfolio Management', type: 'portfolio', position: { x: 600, y: 850 } },
  ];

  // Create nodes with current analysis data
  const [nodes, setNodes, onNodesChange] = useNodesState(
    agentDefinitions.map(agent => {
      // Access agent data using the correct structure: agents[agentName][ticker]
      const agentDataByTicker = analysisResults?.agents?.[agent.id];
      let agentData = null;
      let ticker = null;
      
      // Get the first ticker's data if available
      if (agentDataByTicker && typeof agentDataByTicker === 'object') {
        const tickers = Object.keys(agentDataByTicker);
        if (tickers.length > 0) {
          ticker = tickers[0];
          agentData = agentDataByTicker[ticker];
        }
      }
      
      const status = isAnalysisRunning ? 'running' : 
                     agentData ? 'completed' : 'idle';
      
      return {
        id: agent.id,
        type: 'custom',
        position: agent.position,
        data: {
          label: agent.label,
          type: agent.type,
          status: status,
          confidence: agentData?.confidence,
          signal: agentData?.signal,
          ticker: ticker,
          reasoning: agentData?.reasoning,
          onClick: () => handleAgentClick(agent)
        }
      };
    })
  );

  // Define edges with sophisticated styling - strategic data flow connections between tiers
  const edgeDefinitions = [
    // Tier 1 → Tier 2: Analysis Foundation feeds Investment Experts
    { 
      id: 'e1', 
      source: 'Fundamental Analysis Agent', 
      target: 'Warren Buffett Agent', 
      type: 'custom', 
      animated: true,
      data: { type: 'collaboration', important: true, signal: 'bullish' }
    },
    { 
      id: 'e2', 
      source: 'Fundamental Analysis Agent', 
      target: 'Ben Graham Agent', 
      type: 'custom', 
      animated: true,
      data: { type: 'collaboration', signal: 'neutral' }
    },
    { 
      id: 'e3', 
      source: 'Fundamental Analysis Agent', 
      target: 'Peter Lynch Agent', 
      type: 'custom', 
      animated: true,
      data: { type: 'collaboration', signal: 'bearish' }
    },
    { 
      id: 'e4', 
      source: 'Valuation Analysis Agent', 
      target: 'Charlie Munger Agent', 
      type: 'custom', 
      animated: true,
      data: { type: 'decision', important: true, signal: 'bullish' }
    },
    { 
      id: 'e5', 
      source: 'Valuation Analysis Agent', 
      target: 'Phil Fisher Agent', 
      type: 'custom', 
      animated: true,
      data: { type: 'decision', signal: 'neutral' }
    },
    {
      id: 'e6',
      source: 'Valuation Analysis Agent',
      target: 'Aswath Damodaran Agent',
      type: 'custom',
      animated: true,
      data: { type: 'analysis', signal: 'bearish' }
    },
    {
      id: 'e7',
      source: 'Sentiment Analysis Agent',
      target: 'Cathie Wood Agent',
      type: 'custom',
      animated: true,
      data: { type: 'collaboration', signal: 'bullish' }
    },
    {
      id: 'e8',
      source: 'Sentiment Analysis Agent',
      target: 'Bill Ackman Agent',
      type: 'custom',
      animated: true,
      data: { type: 'collaboration', signal: 'neutral' }
    },
    // Tier 2 → Tier 3: Investment Experts feed Decision Makers with sophisticated styling
    {
      id: 'e9',
      source: 'Warren Buffett Agent',
      target: 'Portfolio Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'decision', important: true, signal: 'bullish' }
    },
    {
      id: 'e10',
      source: 'Ben Graham Agent',
      target: 'Portfolio Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'decision', signal: 'neutral' }
    },
    {
      id: 'e11',
      source: 'Peter Lynch Agent',
      target: 'Portfolio Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'decision', signal: 'bearish' }
    },
    {
      id: 'e12',
      source: 'Charlie Munger Agent',
      target: 'Risk Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'risk_assessment', important: true, signal: 'neutral' }
    },
    {
      id: 'e13',
      source: 'Phil Fisher Agent',
      target: 'Risk Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'risk_assessment', signal: 'bullish' }
    },
    {
      id: 'e14',
      source: 'Aswath Damodaran Agent',
      target: 'Risk Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'risk_assessment', signal: 'bearish' }
    },
    {
      id: 'e15',
      source: 'Cathie Wood Agent',
      target: 'Portfolio Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'decision', signal: 'bullish' }
    },
    {
      id: 'e16',
      source: 'Bill Ackman Agent',
      target: 'Risk Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'risk_assessment', signal: 'neutral' }
    },
    // Cross-tier coordination flows with enhanced styling
    {
      id: 'e17',
      source: 'Risk Management Agent',
      target: 'Portfolio Management Agent',
      type: 'custom',
      animated: true,
      data: { type: 'coordination', important: true, signal: 'neutral' }
    }
  ];

  const [edges, setEdges, onEdgesChange] = useEdgesState(edgeDefinitions);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  // Update node status when analysis results change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        // Access agent data using the correct structure: agents[agentName][ticker]
        const agentDataByTicker = analysisResults?.agents?.[node.id];
        let agentData = null;
        let ticker = null;
        
        // Get the first ticker's data if available
        if (agentDataByTicker && typeof agentDataByTicker === 'object') {
          const tickers = Object.keys(agentDataByTicker);
          if (tickers.length > 0) {
            ticker = tickers[0];
            agentData = agentDataByTicker[ticker];
          }
        }
        
        const status = isAnalysisRunning ? 'running' : 
                       agentData ? 'completed' : 'idle';
        
        return {
          ...node,
          data: {
            ...node.data,
            status: status,
            confidence: agentData?.confidence,
            signal: agentData?.signal,
            ticker: ticker,
            reasoning: agentData?.reasoning,
          }
        };
      })
    );
  }, [analysisResults, isAnalysisRunning, setNodes]);

  // Enhanced node and edge types configuration with performance optimization
  const nodeTypes = useMemo(
    () => ({
      custom: AgentNode,
    }),
    []
  );
  
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    []
  );

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Controls Header */}
      <Paper 
        sx={{ 
          position: 'absolute', 
          top: { xs: 8, sm: 16 }, 
          left: { xs: 8, sm: 16 }, 
          right: { xs: 8, sm: 16 }, 
          zIndex: 1000,
          p: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
        role="banner"
        aria-label="Flow visualization controls"
      >
        <Typography 
          variant="h6" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          <AgentIcon sx={{ mr: 1 }} aria-hidden="true" />
          Agent Flow Visualization
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Run Analysis">
            <Button
              variant="contained"
              startIcon={isAnalysisRunning ? <StopIcon /> : <PlayIcon />}
              onClick={onRunAnalysis}
              disabled={isAnalysisRunning}
              color={isAnalysisRunning ? "secondary" : "primary"}
              size={ window.innerWidth < 600 ? "small" : "medium" }
              aria-label={isAnalysisRunning ? 'Stop running analysis' : 'Start analysis'}
            >
              {isAnalysisRunning ? 'Running...' : 'Run Analysis'}
            </Button>
          </Tooltip>
          
          <Tooltip title="Reset View">
            <IconButton
              onClick={() => {
                // Reset to fit view
                const reactFlowInstance = document.querySelector('.react-flow');
                if (reactFlowInstance) {
                  const event = new CustomEvent('fitView');
                  reactFlowInstance.dispatchEvent(event);
                }
                // Reset nodes to initial positions
                setNodes((nds) => 
                  nds.map((node) => ({
                    ...node,
                    position: agentDefinitions.find(def => def.id === node.id)?.position || node.position
                  }))
                );
              }}
              aria-label="Reset view to initial state"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
        style={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.95)}, ${alpha(theme.palette.background.paper, 0.98)})`,
          borderRadius: 12
        }}
        connectionLineStyle={{
          stroke: theme.palette.primary.main,
          strokeWidth: 3,
          strokeDasharray: '8,4',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
        defaultMarkerColor={theme.palette.primary.main}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        selectionOnDrag
        multiSelectionKeyCode="Meta"
        deleteKeyCode="Delete"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const signal = node.data?.signal;
            switch (signal) {
              case 'bullish': return financialColors.success;
              case 'bearish': return financialColors.danger;
              case 'neutral': return financialColors.warning;
              default: return alpha(theme.palette.text.secondary, 0.6);
            }
          }}
          nodeStrokeWidth={2}
          zoomable
          pannable
          style={{
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
            boxShadow: theme.shadows[4]
          }}
          maskColor={alpha(theme.palette.background.default, 0.6)}
          aria-label="Flow minimap navigation"
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      {/* Agent Details Dialog */}
      <AgentDetailsModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        agent={selectedAgent}
        analysisResults={analysisResults}
      />
    </Box>
  );
};

export default AgentFlowVisualization;
