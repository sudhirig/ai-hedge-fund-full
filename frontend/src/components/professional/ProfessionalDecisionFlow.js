import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Collapse,
  IconButton,
  Divider,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AgentAvatar from '../shared/AgentAvatar';
import { getSignalColor } from '../shared/utils/signalColors';

// Simplified Professional Decision Flow - Adapted from complex legacy TradingDecisionFlow
function ProfessionalDecisionFlow({ simulationData, title = "AI Decision Timeline" }) {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedAgents, setExpandedAgents] = useState({});

  // Process simulation data into decision flow steps
  const processDecisionFlow = () => {
    if (!simulationData || !simulationData.decisions) {
      return [];
    }

    const steps = [];
    
    // Step 1: Agent Analysis
    steps.push({
      label: 'Agent Analysis',
      description: 'AI agents analyze market data and generate signals',
      agents: Object.keys(simulationData.decisions).map(ticker => {
        const decision = simulationData.decisions[ticker];
        return {
          ticker,
          action: decision.action,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          agents: decision.agent_decisions || {}
        };
      })
    });

    // Step 2: Signal Aggregation  
    const totalDecisions = Object.keys(simulationData.decisions).length;
    const buySignals = Object.values(simulationData.decisions).filter(d => d.action?.toLowerCase() === 'buy').length;
    const sellSignals = Object.values(simulationData.decisions).filter(d => d.action?.toLowerCase() === 'sell').length;
    const holdSignals = Object.values(simulationData.decisions).filter(d => d.action?.toLowerCase() === 'hold').length;

    steps.push({
      label: 'Signal Aggregation',
      description: 'Consolidate individual agent signals',
      summary: {
        total: totalDecisions,
        buy: buySignals,
        sell: sellSignals,
        hold: holdSignals
      }
    });

    // Step 3: Risk Assessment
    steps.push({
      label: 'Risk Assessment',
      description: 'Evaluate portfolio risk and position sizing',
      riskMetrics: {
        totalPositions: totalDecisions,
        avgConfidence: Object.values(simulationData.decisions)
          .reduce((sum, d) => sum + (d.confidence || 0), 0) / totalDecisions
      }
    });

    // Step 4: Final Decisions
    steps.push({
      label: 'Final Decisions',
      description: 'Execute trading decisions based on analysis',
      decisions: Object.entries(simulationData.decisions).map(([ticker, decision]) => ({
        ticker,
        action: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reasoning
      }))
    });

    return steps;
  };

  const steps = processDecisionFlow();

  const toggleAgentExpansion = (ticker) => {
    setExpandedAgents(prev => ({
      ...prev,
      [ticker]: !prev[ticker]
    }));
  };

  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case 'buy': return <TrendingUpIcon color="success" />;
      case 'sell': return <TrendingDownIcon color="error" />;
      case 'hold': return <ShowChartIcon color="info" />;
      default: return <ShowChartIcon color="disabled" />;
    }
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'buy': return 'success';
      case 'sell': return 'error';
      case 'hold': return 'info';
      default: return 'default';
    }
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
        transition: 'all 0.3s ease'
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
            bgcolor: 'info.main',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)'
          }}>
            <TimelineIcon />
          </Avatar>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        {steps.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No decision flow data available
            </Typography>
          </Box>
        ) : (
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index} expanded>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>

                  {/* Agent Analysis Step */}
                  {step.agents && (
                    <Box>
                      {step.agents.map((agentData, agentIndex) => (
                        <Card 
                          key={agentIndex} 
                          variant="outlined" 
                          sx={{ mb: 1, borderRadius: 2 }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
                                  {agentData.ticker}
                                </Typography>
                                <Chip
                                  icon={getActionIcon(agentData.action)}
                                  label={agentData.action?.toUpperCase() || 'N/A'}
                                  color={getActionColor(agentData.action)}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                  {Math.round((agentData.confidence || 0) * 100)}%
                                </Typography>
                                <IconButton 
                                  size="small"
                                  onClick={() => toggleAgentExpansion(agentData.ticker)}
                                >
                                  {expandedAgents[agentData.ticker] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              </Box>
                            </Box>
                            
                            <Collapse in={expandedAgents[agentData.ticker]}>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="caption" color="text.secondary">
                                Reasoning: {agentData.reasoning || 'No reasoning provided'}
                              </Typography>
                            </Collapse>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}

                  {/* Signal Aggregation Step */}
                  {step.summary && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Total: ${step.summary.total}`} variant="outlined" />
                      <Chip 
                        label={`Buy: ${step.summary.buy}`} 
                        color="success" 
                        variant="outlined"
                        icon={<TrendingUpIcon />}
                      />
                      <Chip 
                        label={`Sell: ${step.summary.sell}`} 
                        color="error" 
                        variant="outlined"
                        icon={<TrendingDownIcon />}
                      />
                      <Chip 
                        label={`Hold: ${step.summary.hold}`} 
                        color="info" 
                        variant="outlined"
                        icon={<ShowChartIcon />}
                      />
                    </Box>
                  )}

                  {/* Risk Assessment Step */}
                  {step.riskMetrics && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Average Confidence
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={step.riskMetrics.avgConfidence * 100} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          mb: 1
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(step.riskMetrics.avgConfidence * 100)}% confidence across {step.riskMetrics.totalPositions} positions
                      </Typography>
                    </Box>
                  )}

                  {/* Final Decisions Step */}
                  {step.decisions && (
                    <Box>
                      {step.decisions.map((decision, decisionIndex) => (
                        <Box 
                          key={decisionIndex}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            py: 1,
                            borderBottom: decisionIndex < step.decisions.length - 1 ? '1px solid' : 'none',
                            borderBottomColor: 'divider'
                          }}
                        >
                          <Typography variant="body2" fontWeight="medium">
                            {decision.ticker}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={getActionIcon(decision.action)}
                              label={decision.action?.toUpperCase() || 'N/A'}
                              color={getActionColor(decision.action)}
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round((decision.confidence || 0) * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      onClick={() => setActiveStep(index === steps.length - 1 ? 0 : index + 1)}
                      variant="outlined"
                      size="small"
                    >
                      {index === steps.length - 1 ? 'Reset' : 'Next Step'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfessionalDecisionFlow;
