import React, { useEffect, useRef, useState } from 'react';
import { formatJsonData, formatValue, getSignalColor, FormattedJson } from '../../components/utils/FormatUtils';
import FormattedReasoningDisplay from './FormattedReasoningDisplay';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  CircularProgress,
  LinearProgress,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AgentAvatar from '../AgentAvatars';

// Custom node components
function AgentNode({ data }) {
  // Format confidence value for display
  const formatConfidence = (confidence) => {
    if (typeof confidence !== 'number') return 'N/A';
    return confidence <= 1 ? `${Math.round(confidence * 100)}%` : `${Math.round(confidence)}%`;
  };
  
  // Get normalized confidence value for progress bars
  const getNormalizedConfidence = (confidence) => {
    if (typeof confidence !== 'number') return 0;
    return confidence <= 1 ? confidence * 100 : confidence;
  };
  
  // Get color based on confidence level
  const getConfidenceColor = (confidence) => {
    const normalizedConfidence = getNormalizedConfidence(confidence);
    return normalizedConfidence > 75 ? '#4CAF50' :
           normalizedConfidence > 50 ? '#2196F3' :
           normalizedConfidence > 25 ? '#FF9800' : '#F44336';
  };
  
  // Format reasoning data for display
  const formatReasoning = (reasoning) => {
    if (!reasoning) return '';
    if (typeof reasoning === 'object') {
      return Object.entries(reasoning)
        .map(([key, value]) => {
          const formattedKey = key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return `${formattedKey}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
        })
        .join('\n');
    }
    return reasoning;
  };
  
  // Extract key metrics from reasoning if available
  const extractMetrics = (reasoning) => {
    if (!reasoning || typeof reasoning !== 'object') return null;
    
    const metrics = [];
    
    // Financial metrics
    if (reasoning.profitability_signal) metrics.push({ label: 'Profitability', value: reasoning.profitability_signal });
    if (reasoning.growth_signal) metrics.push({ label: 'Growth', value: reasoning.growth_signal });
    if (reasoning.financial_health_signal) metrics.push({ label: 'Financial Health', value: reasoning.financial_health_signal });
    if (reasoning.price_ratios_signal) metrics.push({ label: 'Price Ratios', value: reasoning.price_ratios_signal });
    
    // Risk metrics
    if (reasoning.portfolio_value) metrics.push({ label: 'Portfolio Value', value: `$${reasoning.portfolio_value}` });
    if (reasoning.position_limit) metrics.push({ label: 'Position Limit', value: reasoning.position_limit });
    if (reasoning.current_position) metrics.push({ label: 'Current Position', value: reasoning.current_position });
    
    return metrics.length > 0 ? metrics : null;
  };
  
  // Format the reasoning for display
  // Use the reasoning data directly, it will be formatted by FormattedReasoningDisplay
  const metrics = data.fullReasoning ? extractMetrics(data.fullReasoning) : null;
  
  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        borderRadius: 2,
        width: 280,
        backgroundColor: data.active ? (data.bgcolor || '#FFEB9A') : '#F5F5F5',
        border: `1px solid ${data.active ? '#E0D082' : '#E0E0E0'}`,
        '&:hover': {
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Agent Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 1,
        pb: 1,
        borderBottom: '1px dashed rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ mr: 1 }}>
          <AgentAvatar agent={data.label} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {data.label}
          </Typography>
          {data.specialty && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {data.specialty}
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Active Agent Content */}
      {data.active && (
        <>
          {/* Signal and Ticker */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 1.5 
          }}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Signal: 
                <Chip 
                  size="small" 
                  label={data.signal || 'N/A'} 
                  color={
                    data.signal?.toLowerCase() === 'bullish' ? 'success' :
                    data.signal?.toLowerCase() === 'bearish' ? 'error' :
                    'default'
                  }
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
            {data.ticker && (
              <Chip 
                size="small" 
                label={data.ticker} 
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
          
          {/* Confidence Meter */}
          {typeof data.confidence === 'number' && (
            <Box sx={{ mt: 1.5, mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">
                  Confidence Level
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: getConfidenceColor(data.confidence) }}>
                  {formatConfidence(data.confidence)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getNormalizedConfidence(data.confidence)} 
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: getConfidenceColor(data.confidence)
                  }
                }}
              />
            </Box>
          )}
          
          {/* Key Metrics */}
          {metrics && metrics.length > 0 && (
            <Box sx={{ mt: 1.5, mb: 1.5 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Key Metrics:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {metrics.map((metric, index) => (
                  <Chip 
                    key={index}
                    size="small" 
                    label={`${metric.label}: ${metric.value}`}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Reasoning */}
          {formattedReasoning && (
            <Tooltip title={formattedReasoning} placement="bottom" arrow>
              <Box sx={{ 
                mt: 1.5, 
                p: 1, 
                backgroundColor: 'rgba(0,0,0,0.04)', 
                borderRadius: 1,
                maxHeight: 80,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Typography variant="caption" color="text.secondary" fontWeight="medium">
                  Analysis Reasoning:
                </Typography>
                {data.fullReasoning && typeof data.fullReasoning === 'object' ? (
                  <FormattedReasoningDisplay reasoning={data.fullReasoning} />
                ) : (
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {data.reasoning}
                  </Typography>
                )}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  height: 20, 
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.8))' 
                }} />
              </Box>
            </Tooltip>
          )}
          
          {/* Data Points Timestamp */}
          {data.timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
              Analysis: {new Date(data.timestamp).toLocaleString()}
            </Typography>
          )}
        </>
      )}
      
      {/* Inactive Agent State */}
      {!data.active && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
          <Typography variant="body2" color="text.secondary">
            Waiting for activation...
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

function DecisionNode({ data }) {
  // Format confidence value for display
  const formatConfidence = (confidence) => {
    if (typeof confidence !== 'number') return 'N/A';
    return confidence <= 1 ? `${Math.round(confidence * 100)}%` : `${Math.round(confidence)}%`;
  };
  
  // Get normalized confidence value for progress bars
  const getNormalizedConfidence = (confidence) => {
    if (typeof confidence !== 'number') return 0;
    return confidence <= 1 ? confidence * 100 : confidence;
  };
  
  // Get color based on confidence level
  const getConfidenceColor = (confidence) => {
    const normalizedConfidence = getNormalizedConfidence(confidence);
    return normalizedConfidence > 75 ? '#4CAF50' :
           normalizedConfidence > 50 ? '#2196F3' :
           normalizedConfidence > 25 ? '#FF9800' : '#F44336';
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        borderRadius: 3,
        width: 200,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: data.active ? '#B3E5FC' : '#E1F5FE',
        border: data.active ? '2px solid #29B6F6' : '1px solid #81D4FA',
        boxShadow: data.active ? '0 0 15px rgba(33, 150, 243, 0.5)' : 'none',
        '&:hover': {
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" align="center">
        {data.label}
      </Typography>
      
      {data.active && (
        <>
          {/* Signal Distribution */}
          {data.signalDistribution && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <Tooltip title={`${data.signalDistribution.bullish || 0} Bullish Signals`}>
                <Chip 
                  size="small" 
                  label={`B: ${data.signalDistribution.bullish || 0}`}
                  sx={{ bgcolor: '#C8E6C9', height: 20, fontSize: '0.7rem' }}
                />
              </Tooltip>
              <Tooltip title={`${data.signalDistribution.bearish || 0} Bearish Signals`}>
                <Chip 
                  size="small" 
                  label={`S: ${data.signalDistribution.bearish || 0}`}
                  sx={{ bgcolor: '#FFCDD2', height: 20, fontSize: '0.7rem' }}
                />
              </Tooltip>
              <Tooltip title={`${data.signalDistribution.neutral || 0} Neutral Signals`}>
                <Chip 
                  size="small" 
                  label={`N: ${data.signalDistribution.neutral || 0}`}
                  sx={{ bgcolor: '#E0E0E0', height: 20, fontSize: '0.7rem' }}
                />
              </Tooltip>
            </Box>
          )}
          
          {/* Confidence Indicator */}
          {typeof data.confidence === 'number' && (
            <Box sx={{ mt: 1.5, width: '100%', textAlign: 'center' }}>
              <Tooltip title={`Decision Confidence: ${formatConfidence(data.confidence)}`}>
                <Box>
                  <CircularProgress 
                    variant="determinate" 
                    value={getNormalizedConfidence(data.confidence)} 
                    size={60}
                    thickness={6}
                    sx={{ 
                      color: getConfidenceColor(data.confidence),
                      mb: 0.5
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      color: getConfidenceColor(data.confidence)
                    }}
                  >
                    {formatConfidence(data.confidence)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
          
          {/* Selected Action */}
          {data.selectedAction && (
            <Box sx={{ mt: 1.5 }}>
              <Tooltip title={`Selected Action: ${data.selectedAction.toUpperCase()}`}>
                <Chip 
                  label={data.selectedAction.toUpperCase()} 
                  size="small" 
                  color={
                    data.selectedAction.toLowerCase() === 'buy' ? 'success' :
                    data.selectedAction.toLowerCase() === 'sell' ? 'error' :
                    data.selectedAction.toLowerCase() === 'short' ? 'error' :
                    data.selectedAction.toLowerCase() === 'cover' ? 'success' :
                    'info'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
              </Tooltip>
            </Box>
          )}
        </>
      )}
      
      {!data.active && (
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={20} thickness={5} sx={{ color: '#90CAF9' }} />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Processing...
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

function ActionNode({ data }) {
  // Format confidence value for display
  const formatConfidence = (confidence) => {
    if (typeof confidence !== 'number') return 'N/A';
    return confidence <= 1 ? `${Math.round(confidence * 100)}%` : `${Math.round(confidence)}%`;
  };
  
  // Get normalized confidence value for progress bars
  const getNormalizedConfidence = (confidence) => {
    if (typeof confidence !== 'number') return 0;
    return confidence <= 1 ? confidence * 100 : confidence;
  };
  
  // Determine background color based on action type
  const getBackgroundColor = () => {
    if (data.bgcolor) return data.bgcolor;
    
    const action = data.label?.toLowerCase();
    if (action === 'buy') return '#C8E6C9'; // Light green
    if (action === 'sell') return '#FFCDD2'; // Light red
    if (action === 'short') return '#EF9A9A'; // Medium red
    if (action === 'cover') return '#A5D6A7'; // Medium green
    if (action === 'hold') return '#E1F5FE'; // Light blue
    return '#C8E6C9'; // Default light green
  };
  
  // Determine border color based on action type
  const getBorderColor = () => {
    const action = data.label?.toLowerCase();
    if (action === 'buy') return '#81C784'; // Green
    if (action === 'sell') return '#E57373'; // Red
    if (action === 'short') return '#F44336'; // Bright red
    if (action === 'cover') return '#4CAF50'; // Bright green
    if (action === 'hold') return '#29B6F6'; // Blue
    return '#A5D6A7'; // Default green
  };
  
  // Format reasoning data for display
  const formatReasoning = (reasoning) => {
    if (!reasoning) return '';
    if (typeof reasoning === 'object') {
      return Object.entries(reasoning)
        .map(([key, value]) => {
          const formattedKey = key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return `${formattedKey}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
        })
        .join('\n');
    }
    return reasoning;
  };
  
  // Extract key metrics from reasoning if available
  const extractMetrics = (reasoning) => {
    if (!reasoning || typeof reasoning !== 'object') return null;
    
    const metrics = [];
    
    // Financial metrics
    if (reasoning.expected_return) metrics.push({ label: 'Expected Return', value: `${reasoning.expected_return}%` });
    if (reasoning.risk_level) metrics.push({ label: 'Risk Level', value: reasoning.risk_level });
    if (reasoning.time_horizon) metrics.push({ label: 'Time Horizon', value: reasoning.time_horizon });
    if (reasoning.price_target) metrics.push({ label: 'Price Target', value: `$${reasoning.price_target}` });
    
    // Position metrics
    if (reasoning.position_size) metrics.push({ label: 'Position Size', value: reasoning.position_size });
    if (reasoning.entry_price) metrics.push({ label: 'Entry Price', value: `$${reasoning.entry_price}` });
    if (reasoning.stop_loss) metrics.push({ label: 'Stop Loss', value: `$${reasoning.stop_loss}` });
    
    return metrics.length > 0 ? metrics : null;
  };
  
  // Format the reasoning for display
  const formattedReasoning = data.reasoning ? formatReasoning(data.reasoning) : '';
  const metrics = data.reasoning ? extractMetrics(data.reasoning) : null;
  
  // Get action icon
  const getActionIcon = () => {
    const action = data.label?.toLowerCase();
    if (action === 'buy' || action === 'cover') return '↗️';
    if (action === 'sell' || action === 'short') return '↘️';
    return '↔️'; // hold
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        borderRadius: 2,
        width: 180,
        backgroundColor: getBackgroundColor(),
        border: `2px solid ${getBorderColor()}`,
        '&:hover': {
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.2)',
          transform: data.active ? 'scale(1.05)' : 'none',
        },
        transition: 'all 0.3s ease',
        position: 'relative',
        ...(data.active && {
          boxShadow: `0 0 15px ${getBorderColor()}`,
        }),
      }}
    >
      {/* Action Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mb: 1.5,
        pb: 1,
        borderBottom: '1px dashed rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h6" fontWeight="bold" align="center">
          {getActionIcon()} {data.label.toUpperCase()}
        </Typography>
      </Box>
      
      {/* Ticker and Quantity */}
      {data.active && (
        <>
          {data.ticker && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Chip 
                size="small" 
                label={data.ticker} 
                variant="outlined"
                color="primary"
              />
            </Box>
          )}
          
          {data.quantity && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="body2" fontWeight="medium">
                Quantity:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {data.quantity} shares
              </Typography>
            </Box>
          )}
          
          {/* Confidence Meter */}
          {typeof data.confidence === 'number' && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">
                  Confidence:
                </Typography>
                <Typography variant="body2" fontWeight="bold" color={
                  getNormalizedConfidence(data.confidence) > 75 ? 'success.main' :
                  getNormalizedConfidence(data.confidence) > 50 ? 'info.main' :
                  getNormalizedConfidence(data.confidence) > 25 ? 'warning.main' : 'error.main'
                }>
                  {formatConfidence(data.confidence)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getNormalizedConfidence(data.confidence)}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: 
                      getNormalizedConfidence(data.confidence) > 75 ? '#4CAF50' :
                      getNormalizedConfidence(data.confidence) > 50 ? '#2196F3' :
                      getNormalizedConfidence(data.confidence) > 25 ? '#FF9800' : '#F44336'
                  }
                }}
              />
            </Box>
          )}
          
          {/* Key Metrics */}
          {metrics && metrics.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Key Metrics:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {metrics.map((metric, index) => (
                  <Chip 
                    key={index}
                    size="small" 
                    label={`${metric.label}: ${metric.value}`}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Reasoning */}
          {data.reasoning && (
            <Box 
              sx={{ 
                p: 1, 
                backgroundColor: 'rgba(0,0,0,0.04)', 
                borderRadius: 1,
                maxHeight: 120,
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Decision Reasoning:
              </Typography>
              {typeof data.reasoning === 'object' ? (
                <FormattedReasoningDisplay reasoning={data.reasoning} />
              ) : (
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {data.reasoning}
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
      
      {/* Inactive State */}
      {!data.active && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
          <Typography variant="body2" color="text.secondary">
            Waiting for decision...
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// Node types
const nodeTypes = {
  agentNode: AgentNode,
  decisionNode: DecisionNode,
  actionNode: ActionNode
};

// Initial nodes and edges
const initialNodes = [
  {
    id: 'start',
    type: 'default',
    data: { label: 'Start' },
    position: { x: 250, y: 0 },
    style: {
      background: '#E3F2FD',
      border: '1px solid #90CAF9',
      borderRadius: '8px',
      padding: '10px',
      width: 80,
    },
  },
  {
    id: 'pick-agents',
    type: 'default',
    data: { label: '[1] Pick Agents' },
    position: { x: 400, y: 0 },
    style: {
      background: '#E8EAF6',
      border: '1px solid #C5CAE9',
      borderRadius: '8px',
      padding: '10px',
      width: 120,
    },
  },
  {
    id: 'ben-graham',
    type: 'agentNode',
    data: { 
      label: 'Ben Graham Agent', 
      specialty: 'Value Investing',
      active: false,
    },
    position: { x: 50, y: 100 },
  },
  {
    id: 'warren-buffett',
    type: 'agentNode',
    data: { 
      label: 'Warren Buffett Agent', 
      specialty: 'Business Quality',
      active: false,
    },
    position: { x: 50, y: 200 },
  },
  {
    id: 'cathie-wood',
    type: 'agentNode',
    data: { 
      label: 'Cathie Wood Agent', 
      specialty: 'Disruptive Innovation',
      active: false,
    },
    position: { x: 50, y: 300 },
  },
  {
    id: 'charlie-munger',
    type: 'agentNode',
    data: { 
      label: 'Charlie Munger Agent', 
      specialty: 'Mental Models',
      active: false,
    },
    position: { x: 50, y: 400 },
  },
  {
    id: 'ray-dalio',
    type: 'agentNode',
    data: { 
      label: 'Ray Dalio Agent', 
      specialty: 'All-Weather Strategy',
      active: false,
    },
    position: { x: 50, y: 500 },
  },
  {
    id: 'stan-druckenmiller',
    type: 'agentNode',
    data: { 
      label: 'Stan Druckenmiller Agent', 
      specialty: 'Macro Trading',
      active: false,
    },
    position: { x: 50, y: 600 },
  },
  {
    id: 'trading-signals',
    type: 'default',
    data: { label: '[2] Trading Signals' },
    position: { x: 250, y: 150 },
    style: {
      background: '#E8EAF6',
      border: '1px solid #C5CAE9',
      borderRadius: '8px',
      padding: '10px',
      width: 120,
    },
  },
  {
    id: 'risk-manager',
    type: 'agentNode',
    data: { 
      label: 'Risk Manager', 
      bgcolor: '#FFECB3',
      active: false,
    },
    position: { x: 400, y: 150 },
  },
  {
    id: 'risk-signals',
    type: 'default',
    data: { label: '[3] Risk Signals' },
    position: { x: 550, y: 150 },
    style: {
      background: '#E8EAF6',
      border: '1px solid #C5CAE9',
      borderRadius: '8px',
      padding: '10px',
      width: 120,
    },
  },
  {
    id: 'portfolio-manager',
    type: 'agentNode',
    data: { 
      label: 'Portfolio Manager', 
      bgcolor: '#FFECB3',
      active: false,
    },
    position: { x: 700, y: 150 },
  },
  {
    id: 'buy',
    type: 'actionNode',
    data: { label: 'Buy' },
    position: { x: 850, y: 100 },
  },
  {
    id: 'cover',
    type: 'actionNode',
    data: { label: 'Cover' },
    position: { x: 850, y: 150 },
  },
  {
    id: 'sell',
    type: 'actionNode',
    data: { 
      label: 'Sell',
      bgcolor: '#FFCDD2',
    },
    position: { x: 850, y: 200 },
  },
  {
    id: 'short',
    type: 'actionNode',
    data: { 
      label: 'Short',
      bgcolor: '#FFCDD2',
    },
    position: { x: 850, y: 250 },
  },
  {
    id: 'hold',
    type: 'actionNode',
    data: { 
      label: 'Hold',
      bgcolor: '#BBDEFB',
    },
    position: { x: 850, y: 300 },
  },
  {
    id: 'trading-decision',
    type: 'decisionNode',
    data: { 
      label: 'Make Trading Decision',
      active: false,
    },
    position: { x: 400, y: 300 },
  },
  {
    id: 'take-action',
    type: 'default',
    data: { label: '[4] Take Action' },
    position: { x: 400, y: 450 },
    style: {
      background: '#E8EAF6',
      border: '1px solid #C5CAE9',
      borderRadius: '8px',
      padding: '10px',
      width: 120,
    },
  },
  {
    id: 'ai-hedge-fund',
    type: 'default',
    data: { label: 'AI Hedge Fund' },
    position: { x: 400, y: 550 },
    style: {
      background: '#D1C4E9',
      border: '1px solid #B39DDB',
      borderRadius: '8px',
      padding: '10px',
      width: 150,
      textAlign: 'center',
      fontWeight: 'bold',
    },
  },
];

const initialEdges = [
  { id: 'e1', source: 'start', target: 'pick-agents', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e2', source: 'pick-agents', target: 'trading-signals', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e3', source: 'trading-signals', target: 'risk-manager', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e4', source: 'risk-manager', target: 'risk-signals', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e5', source: 'risk-signals', target: 'portfolio-manager', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e6', source: 'portfolio-manager', target: 'buy', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e7', source: 'portfolio-manager', target: 'cover', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e8', source: 'portfolio-manager', target: 'sell', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e9', source: 'portfolio-manager', target: 'short', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e10', source: 'portfolio-manager', target: 'hold', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e11', source: 'portfolio-manager', target: 'trading-decision', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e12', source: 'trading-decision', target: 'take-action', animated: true, style: { stroke: '#90CAF9' } },
  { id: 'e13', source: 'take-action', target: 'ai-hedge-fund', animated: true, style: { stroke: '#90CAF9' } },
  
  // Connect all agents to trading signals
  { id: 'e14', source: 'ben-graham', target: 'trading-signals', animated: true, style: { stroke: '#FFD54F' } },
  { id: 'e15', source: 'warren-buffett', target: 'trading-signals', animated: true, style: { stroke: '#FFD54F' } },
  { id: 'e16', source: 'cathie-wood', target: 'trading-signals', animated: true, style: { stroke: '#FFD54F' } },
  { id: 'e17', source: 'charlie-munger', target: 'trading-signals', animated: true, style: { stroke: '#FFD54F' } },
  { id: 'e18', source: 'ray-dalio', target: 'trading-signals', animated: true, style: { stroke: '#FFD54F' } },
  { id: 'e19', source: 'stan-druckenmiller', target: 'trading-signals', animated: true, style: { stroke: '#FFD54F' } },
];

function TradingDecisionFlow({ simulationData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update nodes based on simulation data
  useEffect(() => {
    if (simulationData && simulationData.agents) {
      // Reset animation state
      setCurrentStep(0);
      setIsAnimating(false);
      
      // Update agent nodes with data
      const updatedNodes = nodes.map(node => {
        // Update agent nodes with signals from simulation data
        if (node.type === 'agentNode' && simulationData.agents[node.data.label]) {
          const agentData = simulationData.agents[node.data.label];
          const firstTicker = Object.keys(agentData)[0];
          
          if (firstTicker && agentData[firstTicker]) {
            const tickerData = agentData[firstTicker];
            
            // Extract reasoning and store full object for detailed display
            let reasoning = tickerData.reasoning || '';
            let fullReasoning = reasoning;
            
            // Format the reasoning for display
            const formattedReasoning = typeof reasoning === 'string' 
              ? (reasoning.length > 100 ? reasoning.substring(0, 100) + '...' : reasoning)
              : 'Detailed analysis available';
            
            // Add timestamp for when the analysis was performed
            const timestamp = new Date().toISOString();
            
            return {
              ...node,
              data: {
                ...node.data,
                signal: tickerData.signal || 'N/A',
                confidence: tickerData.confidence || 0,
                reasoning: formattedReasoning,
                fullReasoning: fullReasoning, // Store full reasoning object for detailed display
                ticker: firstTicker,
                timestamp: timestamp,
                analysisType: node.data.specialty || 'General Analysis'
              }
            };
          }
        }
        
        // Update trading decision node with signal distribution
        if (node.id === 'trading-decision') {
          // Count signals from all agents
          const signalCounts = { bullish: 0, bearish: 0, neutral: 0 };
          let totalConfidence = 0;
          let agentCount = 0;
          
          // Collect all signals and calculate distribution
          Object.values(simulationData.agents).forEach(agent => {
            if (typeof agent === 'object') {
              Object.values(agent).forEach(tickerData => {
                if (tickerData.signal) {
                  const signal = tickerData.signal.toLowerCase();
                  if (signalCounts[signal] !== undefined) {
                    signalCounts[signal]++;
                  }
                }
                if (typeof tickerData.confidence === 'number') {
                  totalConfidence += tickerData.confidence;
                  agentCount++;
                }
              });
            }
          });
          
          // Calculate average confidence
          const avgConfidence = agentCount > 0 ? totalConfidence / agentCount : 0;
          
          // Get decision factors based on the most common signals
          const decisionFactors = [];
          if (signalCounts.bullish > 0) {
            decisionFactors.push(`${signalCounts.bullish} agents with bullish signals`);
          }
          if (signalCounts.bearish > 0) {
            decisionFactors.push(`${signalCounts.bearish} agents with bearish signals`);
          }
          if (signalCounts.neutral > 0) {
            decisionFactors.push(`${signalCounts.neutral} agents with neutral signals`);
          }
          
          return {
            ...node,
            data: {
              ...node.data,
              signalDistribution: signalCounts,
              confidence: avgConfidence,
              decisionFactors: decisionFactors
            }
          };
        }
        
        return node;
      });
      
      setNodes(updatedNodes);
    }
  }, [simulationData, setNodes]);

  // Animation effect
  useEffect(() => {
    if (isAnimating && currentStep < 7) {
      const timer = setTimeout(() => {
        animateStep(currentStep);
        setCurrentStep(prev => prev + 1);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAnimating, currentStep]);

  // Start animation
  const startAnimation = () => {
    // Reset all nodes
    setNodes(nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        active: false
      }
    })));
    
    setCurrentStep(0);
    setIsAnimating(true);
  };

  // Animate each step
  const animateStep = (step) => {
    const updatedNodes = [...nodes];
    
    switch(step) {
      case 0: // Activate investor agents
        updatedNodes.forEach(node => {
          if (['ben-graham', 'warren-buffett', 'cathie-wood', 'charlie-munger', 'ray-dalio', 'stan-druckenmiller'].includes(node.id)) {
            node.data = { ...node.data, active: true };
          }
        });
        break;
      case 1: // Activate trading signals
        updatedNodes.find(n => n.id === 'trading-signals').style = {
          ...updatedNodes.find(n => n.id === 'trading-signals').style,
          background: '#B3E5FC',
          boxShadow: '0 0 10px #29B6F6'
        };
        break;
      case 2: // Activate risk manager
        updatedNodes.find(n => n.id === 'risk-manager').data = {
          ...updatedNodes.find(n => n.id === 'risk-manager').data,
          active: true
        };
        break;
      case 3: // Activate risk signals
        updatedNodes.find(n => n.id === 'risk-signals').style = {
          ...updatedNodes.find(n => n.id === 'risk-signals').style,
          background: '#B3E5FC',
          boxShadow: '0 0 10px #29B6F6'
        };
        break;
      case 4: // Activate portfolio manager
        updatedNodes.find(n => n.id === 'portfolio-manager').data = {
          ...updatedNodes.find(n => n.id === 'portfolio-manager').data,
          active: true
        };
        break;
      case 5: // Activate trading decision
        updatedNodes.find(n => n.id === 'trading-decision').data = {
          ...updatedNodes.find(n => n.id === 'trading-decision').data,
          active: true
        };
        break;
      case 6: // Highlight final action
        // Highlight the action based on simulation data
        if (simulationData && simulationData.decisions) {
          const firstTicker = Object.keys(simulationData.decisions)[0];
          if (firstTicker) {
            const decision = simulationData.decisions[firstTicker];
            const action = decision.action?.toLowerCase();
            const actionNodeId = action === 'buy' ? 'buy' : 
                               action === 'sell' ? 'sell' : 
                               action === 'short' ? 'short' : 
                               action === 'cover' ? 'cover' : 'hold';
            
            const actionNode = updatedNodes.find(n => n.id === actionNodeId);
            if (actionNode) {
              // Add decision details to the action node
              actionNode.data = {
                ...actionNode.data,
                active: true,
                ticker: firstTicker,
                quantity: decision.quantity || 0,
                confidence: decision.confidence || 0,
                reasoning: decision.reasoning || ''
              };
              
              // Update node style based on confidence
              const confidenceColor = 
                decision.confidence > 75 ? '#4CAF50' :
                decision.confidence > 50 ? '#2196F3' :
                decision.confidence > 25 ? '#FF9800' : '#F44336';
                
              actionNode.style = {
                ...actionNode.style,
                boxShadow: `0 0 15px ${confidenceColor}`
              };
              
              // Also update the trading decision node to show it's connected to this action
              const decisionNode = updatedNodes.find(n => n.id === 'trading-decision');
              if (decisionNode) {
                decisionNode.data = {
                  ...decisionNode.data,
                  selectedAction: action,
                  confidence: decision.confidence || 0
                };
              }
            }
          }
        }
        break;
      default:
        break;
    }
    
    setNodes(updatedNodes);
  };

  return (
    <Box sx={{ height: 700, width: '100%' }}>
      {/* Header and Animation Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          AI Trading Decision Flow
        </Typography>
        <Tooltip title="Animate the trading decision process">
          <Box>
            <Chip 
              label="Animate Flow" 
              color="primary" 
              onClick={startAnimation}
              disabled={isAnimating}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Tooltip>
      </Box>
      
      {/* Explanatory Guide Panel */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#F5F9FF', borderLeft: '4px solid #2196F3' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Understanding the AI Agent Decision Flow
        </Typography>
        <Typography variant="body2" paragraph>
          This visualization shows how our AI agents collaborate to make trading decisions. Each agent provides three key outputs:
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <Paper elevation={0} sx={{ p: 1, flex: '1 1 30%', minWidth: '250px', backgroundColor: '#FFFFFF' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              1. Signal/Action
            </Typography>
            <Typography variant="body2">
              • Analyst agents (Warren Buffett, Cathie Wood, etc.) output: <Chip size="small" label="Bullish" color="success" sx={{ mr: 0.5 }} />
              <Chip size="small" label="Bearish" color="error" sx={{ mr: 0.5 }} /> <Chip size="small" label="Neutral" color="info" />
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              • Portfolio Manager outputs: <Chip size="small" label="BUY" sx={{ backgroundColor: '#C8E6C9', mr: 0.5 }} />
              <Chip size="small" label="SELL" sx={{ backgroundColor: '#FFCDD2', mr: 0.5 }} /> <Chip size="small" label="HOLD" sx={{ backgroundColor: '#E1F5FE' }} />
            </Typography>
          </Paper>
          
          <Paper elevation={0} sx={{ p: 1, flex: '1 1 30%', minWidth: '250px', backgroundColor: '#FFFFFF' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              2. Confidence Level
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              A value between 0-100% indicating how certain the agent is about its recommendation.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress variant="determinate" value={75} size={24} thickness={5} sx={{ color: 'success.main' }} />
              <Typography variant="caption" sx={{ ml: 1 }}>High confidence (75%+)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <CircularProgress variant="determinate" value={40} size={24} thickness={5} sx={{ color: 'warning.main' }} />
              <Typography variant="caption" sx={{ ml: 1 }}>Lower confidence (below 50%)</Typography>
            </Box>
          </Paper>
          
          <Paper elevation={0} sx={{ p: 1, flex: '1 1 30%', minWidth: '250px', backgroundColor: '#FFFFFF' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              3. Reasoning
            </Typography>
            <Typography variant="body2">
              Each agent provides a text explanation justifying its recommendation based on financial analysis.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', fontSize: '0.8rem' }}>
              "Strong ROE of 25%, conservative debt levels, consistent earnings growth over 5 years..."
              <Tooltip title="Hover over agent nodes to see full reasoning"><InfoIcon sx={{ fontSize: '0.9rem', ml: 0.5, verticalAlign: 'middle', color: 'info.main' }} /></Tooltip>
            </Typography>
          </Paper>
        </Box>
        
        <Typography variant="body2">
          <b>How to use:</b> Click "Animate Flow" to see how signals from analyst agents flow through risk management to the final portfolio decision.
          Hover over nodes to see detailed information about each agent's analysis.
        </Typography>
      </Paper>
      
      {/* Main Visualization */}
      <Paper elevation={2} sx={{ height: '100%', p: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#f8f8f8" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Note: The system simulates trading decisions; it does not execute live trades.
      </Typography>
    </Box>
  );
}

export default TradingDecisionFlow;
