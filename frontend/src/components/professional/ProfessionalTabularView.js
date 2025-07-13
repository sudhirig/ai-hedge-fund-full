import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  Avatar,
  Tooltip,
  LinearProgress,
  Divider,
  useMediaQuery
} from '@mui/material';
import {
  Terminal,
  TrendingUp,
  TrendingDown,
  ShowChart
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';
import { formatCurrency, formatPercentage } from '../shared/utils/formatUtils';

function ProfessionalTabularView({ agents, decisions, title = "Terminal View" }) {
  const { theme } = useCustomTheme();
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
        // Use the agent name as-is (already formatted by backend)
        const displayName = agentName;
        
        // Determine agent type and specialty
        const isRiskAgent = agentName.toLowerCase().includes('risk');
        const isPortfolioAgent = agentName.toLowerCase().includes('portfolio');
        
        // Map agent names to their specialties
        const getAgentSpecialty = (name) => {
          const lowerName = name.toLowerCase();
          if (lowerName.includes('fundamental')) return 'Value\nFundamental';
          if (lowerName.includes('valuation')) return 'Valuation\nDCF';
          if (lowerName.includes('sentiment')) return 'Sentiment';
          if (lowerName.includes('technical')) return 'Technical';
          if (lowerName.includes('aswath damodaran')) return 'Valuation\nIntrinsic Value';
          if (lowerName.includes('michael burry')) return 'Contrarian\nValue';
          if (lowerName.includes('peter lynch')) return 'Growth\nConsumer';
          if (lowerName.includes('rakesh jhunjhunwala')) return 'Growth\nEmerging Markets';
          if (lowerName.includes('warren buffett')) return 'Value\nQuality';
          if (lowerName.includes('ben graham')) return 'Value';
          if (lowerName.includes('cathie wood')) return 'Growth\nInnovation';
          if (lowerName.includes('bill ackman')) return 'Activist\nQuality';
          if (lowerName.includes('stanley druckenmiller')) return 'Macro\nGrowth';
          if (lowerName.includes('phil fisher')) return 'Growth';
          if (lowerName.includes('charlie munger')) return 'Quality\nValue';
          if (lowerName.includes('risk')) return 'Risk';
          if (lowerName.includes('portfolio')) return 'Portfolio';
          return 'Analyst';
        };
        
        const agentType = isRiskAgent ? 'risk' : 
                         isPortfolioAgent ? 'portfolio' : 'analyst';
        const agentSpecialty = getAgentSpecialty(agentName);
        
        // Process reasoning - handle both simple strings and nested objects
        let reasoningText = '';
        const reasoning = data[selectedTicker].reasoning;
        
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
        
        // Extract relevant data based on agent type
        let signalData = {
          analyst: displayName,
          agentType,
          specialty: agentSpecialty,
          signal: data[selectedTicker].signal || '',
          confidence: data[selectedTicker].confidence || null,
          reasoning: reasoningText
        };
        
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

  const getSignalColor = (signal) => {
    const s = signal?.toLowerCase();
    if (s === 'bullish') return '#10b981';
    if (s === 'bearish') return '#ef4444';
    return '#3b82f6';
  };

  const getSignalIcon = (signal) => {
    const s = signal?.toLowerCase();
    if (s === 'bullish') return <TrendingUp sx={{ color: '#10b981', fontSize: 16 }} />;
    if (s === 'bearish') return <TrendingDown sx={{ color: '#ef4444', fontSize: 16 }} />;
    return <ShowChart sx={{ color: '#3b82f6', fontSize: 16 }} />;
  };

  return (
    <Card 
      sx={{ 
        minHeight: 400,
        maxHeight: '80vh',
        height: 'auto',
        borderRadius: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 10px 40px rgba(0,0,0,0.3)'
            : '0 10px 40px rgba(0,0,0,0.1)'
        }
      }}
      role="region"
      aria-label={`${title} - Agent Analysis Table`}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{ 
          variant: 'h6', 
          fontWeight: 'bold',
          color: theme.palette.text.primary
        }}
        avatar={
          <Avatar sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? '#1f2937' : '#374151',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
              : 'linear-gradient(135deg, #6b7280 0%, #374151 100%)'
          }}>
            <Terminal />
          </Avatar>
        }
        action={
          tickers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1, color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
                TICKER:
              </Typography>
              <Select
                value={selectedTicker || ''}
                onChange={(e) => setSelectedTicker(e.target.value)}
                size="small"
                inputProps={{
                  'aria-label': 'Select ticker for analysis',
                  'aria-describedby': 'ticker-select-description'
                }}
                sx={{ 
                  minWidth: 100,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider
                  }
                }}
              >
                {tickers.map(ticker => (
                  <MenuItem key={ticker} value={ticker} sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {ticker}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
        {selectedTicker ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Terminal Header */}
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#f8fafc',
              p: 1.5,
              borderRadius: 1,
              mb: 2,
              border: `1px solid ${theme.palette.divider}`,
              fontFamily: 'monospace'
            }}>
              <Typography variant="body2" sx={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>
                AI-HEDGE-FUND:~$ analyze {selectedTicker}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
                Executing agent analysis... {analystSignals.length} agents active
              </Typography>
            </Box>

            {/* Agent Signals Table */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle2" sx={{ 
                color: theme.palette.text.primary, 
                mb: 1, 
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                AGENT_SIGNALS [{analystSignals.length}]
              </Typography>
              
              <TableContainer 
                component={Paper} 
                variant="outlined" 
                sx={{ 
                  maxHeight: 200, 
                  overflow: 'auto',
                  bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                  '& .MuiTableCell-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.8rem', // Improved readability
                    py: 0.75
                  }
                }}
              >
                <Table size="small" aria-label="Agent signals analysis table">
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                      <TableCell scope="col" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>AGENT</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>TYPE</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>SIGNAL</TableCell>
                      <TableCell scope="col" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>CONF%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analystSignals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontStyle: 'italic' }}
                          >
                            No agent signals available for {selectedTicker}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      analystSignals.map((signal, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { bgcolor: theme.palette.action.hover },
                          '&:nth-of-type(odd)': { 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' 
                          }
                        }}
                      >
                        <TableCell>
                          <Tooltip title={signal.reasoning} arrow>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.primary }}>
                              {signal.analyst.toUpperCase().replace(' ', '_')}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={signal.agentType.toUpperCase()} 
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.6rem',
                              height: 20,
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              color: signal.agentType === 'risk' ? '#ef4444' : 
                                    signal.agentType === 'portfolio' ? '#3b82f6' : '#10b981',
                              borderColor: signal.agentType === 'risk' ? '#ef4444' : 
                                          signal.agentType === 'portfolio' ? '#3b82f6' : '#10b981'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getSignalIcon(signal.signal)}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getSignalColor(signal.signal),
                                textTransform: 'uppercase'
                              }}
                            >
                              {signal.signal}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {signal.confidence !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={typeof signal.confidence === 'number' && signal.confidence <= 1 ? 
                                       signal.confidence * 100 : 
                                       signal.confidence}
                                sx={{
                                  width: 40,
                                  height: 6,
                                  borderRadius: 5,
                                  bgcolor: theme.palette.action.hover,
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: 
                                      (signal.confidence > 70 || signal.confidence > 0.7) ? '#10b981' :
                                      (signal.confidence > 40 || signal.confidence > 0.4) ? '#f59e0b' :
                                      '#ef4444',
                                    borderRadius: 5,
                                  }
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 30 }}>
                                {Math.round(typeof signal.confidence === 'number' && signal.confidence <= 1 ? 
                                           signal.confidence * 100 : 
                                           signal.confidence)}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Trading Decision */}
            {tradingDecision && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="subtitle2" sx={{ 
                  color: theme.palette.text.primary, 
                  mb: 1, 
                  fontFamily: 'monospace',
                  fontWeight: 'bold'
                }}>
                  TRADING_DECISION
                </Typography>
                <Box sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#f8fafc',
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`
                }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: theme.palette.text.primary }}>
                    <span style={{ color: '#10b981' }}>ACTION:</span> {tradingDecision.action.toUpperCase()} | 
                    <span style={{ color: '#3b82f6' }}> QTY:</span> {tradingDecision.quantity} | 
                    <span style={{ color: '#f59e0b' }}> CONF:</span> {Math.round(tradingDecision.confidence)}%
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              flex: 1,
              textAlign: 'center',
              py: 4
            }}
          >
            <Terminal sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Analysis Data Available
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {tickers.length === 0 
                ? 'Run an analysis to see agent signals and trading decisions'
                : 'Select a ticker from the dropdown above to view analysis results'
              }
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfessionalTabularView;
