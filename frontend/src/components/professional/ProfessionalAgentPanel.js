import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Chip, 
  Card, 
  CardContent, 
  CardHeader,
  Avatar,
  Grid,
  LinearProgress,
  Divider
} from "@mui/material";
import BarChartIcon from '@mui/icons-material/BarChart';
import AgentAvatar from '../shared/AgentAvatar';

// Professional Agent Panel - Adapted from legacy AgentPerformanceCard
function ProfessionalAgentPanel({ agents, title = "AI Agent Performance" }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Get list of agents
  const agentList = Object.keys(agents || {});
  
  // Calculate agent performance metrics - EXACT same logic as legacy
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
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        borderRadius: 3,
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 10px 40px rgba(0,0,0,0.3)'
            : '0 10px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{ 
          variant: 'h6', 
          fontWeight: 'bold',
          color: 'text.primary'
        }}
        avatar={
          <Avatar sx={{ 
            bgcolor: 'warning.main',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          }}>
            <BarChartIcon />
          </Avatar>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontWeight: 600, letterSpacing: 0.5 }}
            >
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
                  sx={{
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0,0,0,0.3)'
                        : '0 4px 20px rgba(0,0,0,0.1)'
                    }
                  }}
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
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold"
                    color="text.primary"
                  >
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
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{ fontWeight: 600, letterSpacing: 0.5 }}
                      >
                        Signal Accuracy
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={performance.accuracy} 
                            color="success"
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.1)' 
                                : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)'
                              }
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontWeight: 600, minWidth: '45px' }}
                        >
                          {Math.round(performance.accuracy)}%
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{ fontWeight: 600, letterSpacing: 0.5 }}
                      >
                        Signal Strength
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={performance.signalStrength} 
                            color="primary"
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.1)' 
                                : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: 'linear-gradient(90deg, #2196f3 0%, #42a5f5 100%)'
                              }
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontWeight: 600, minWidth: '45px' }}
                        >
                          {Math.round(performance.signalStrength)}%
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{ fontWeight: 600, letterSpacing: 0.5 }}
                      >
                        Portfolio Contribution
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={performance.contribution} 
                            color="secondary"
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.1)' 
                                : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: 'linear-gradient(90deg, #9c27b0 0%, #ba68c8 100%)'
                              }
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontWeight: 600, minWidth: '45px' }}
                        >
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
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
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

export default ProfessionalAgentPanel;
