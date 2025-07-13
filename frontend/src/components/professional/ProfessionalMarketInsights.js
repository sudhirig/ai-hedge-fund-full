import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Psychology,
  Warning
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';
import { getSignalColor } from '../shared/utils/signalColors';

function ProfessionalMarketInsights({ agents, title = "Market Intelligence" }) {
  const { theme } = useCustomTheme();

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
          // Process reasoning - handle both simple strings and nested objects
          let reasoningText = '';
          const reasoning = tickerData.reasoning;
          
          if (typeof reasoning === 'string') {
            reasoningText = reasoning;
          } else if (typeof reasoning === 'object' && reasoning !== null) {
            // Convert nested reasoning object to readable text
            const reasoningParts = [];
            Object.entries(reasoning).forEach(([key, value]) => {
              if (value && typeof value === 'object' && value.details) {
                reasoningParts.push(`${key.replace('_', ' ')}: ${value.details}`);
              }
            });
            reasoningText = reasoningParts.join(' | ');
          }
          
          insights.push({
            type: tickerData.signal.toLowerCase(),
            ticker,
            agent: agentName,
            confidence: tickerData.confidence,
            reason: reasoningText.length > 100 
              ? reasoningText.substring(0, 100) + '...'
              : reasoningText || `High confidence ${tickerData.signal.toLowerCase()} signal`
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
    <Card sx={{ 
      height: 400,
      borderRadius: 3,
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      border: `1px solid ${theme.palette.divider}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 10px 40px rgba(0,0,0,0.3)'
          : '0 10px 40px rgba(0,0,0,0.1)'
      }
    }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ 
          variant: 'h6', 
          fontWeight: 'bold',
          color: theme.palette.text.primary
        }}
        avatar={
          <Avatar sx={{ 
            bgcolor: theme.palette.primary.main,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
          }}>
            <Psychology />
          </Avatar>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        {/* Agent Signal Distribution */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ color: theme.palette.text.secondary, mb: 2, fontWeight: 'medium' }}
          >
            Signal Distribution from {agentCount} AI Agents
          </Typography>
          
          {totalSignals > 0 ? (
            <>
              <Box sx={{ display: 'flex', mb: 2, borderRadius: 2, overflow: 'hidden', height: 32 }}>
                {/* Bullish */}
                <Box sx={{ 
                  flex: signalCounts.bullish || 0.1, 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  {signalCounts.bullish}
                </Box>
                {/* Neutral */}
                <Box sx={{ 
                  flex: signalCounts.neutral || 0.1,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  {signalCounts.neutral}
                </Box>
                {/* Bearish */}
                <Box sx={{ 
                  flex: signalCounts.bearish || 0.1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  {signalCounts.bearish}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 'medium' }}>
                  Bullish: {Math.round((signalCounts.bullish / totalSignals) * 100)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 'medium' }}>
                  Neutral: {Math.round((signalCounts.neutral / totalSignals) * 100)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 'medium' }}>
                  Bearish: {Math.round((signalCounts.bearish / totalSignals) * 100)}%
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: 32,
              bgcolor: theme.palette.action.hover,
              borderRadius: 2,
              mb: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                No signals available
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* High Confidence Insights */}
        <Typography 
          variant="subtitle2" 
          sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 'medium' }}
        >
          High Confidence Signals ({'>'}65%)
        </Typography>
        
        {insights.length > 0 ? (
          <List sx={{ maxHeight: 200, overflow: 'auto', p: 0 }}>
            {insights.slice(0, 4).map((insight, index) => (
              <ListItem 
                key={index}
                sx={{
                  mb: 1, 
                  p: 1.5, 
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {insight.type === 'bullish' ? 
                    <TrendingUp sx={{ color: '#10b981' }} /> : 
                    insight.type === 'bearish' ?
                    <TrendingDown sx={{ color: '#ef4444' }} /> :
                    <ShowChart sx={{ color: '#3b82f6' }} />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {insight.ticker}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={`${Math.round(insight.confidence)}%`}
                        sx={{
                          bgcolor: insight.type === 'bullish' ? '#10b981' : 
                                  insight.type === 'bearish' ? '#ef4444' : '#3b82f6',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {insight.agent.replace('_agent', '').replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Warning sx={{ fontSize: 32, color: theme.palette.text.secondary, mb: 1 }} />
            <Typography color="text.secondary" variant="body2">
              No high-confidence signals detected
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfessionalMarketInsights;
