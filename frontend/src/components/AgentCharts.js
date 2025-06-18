import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Chip, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  Tooltip,
  IconButton,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Badge
} from "@mui/material";
import { Pie, Bar, Doughnut, PolarArea } from "react-chartjs-2";
import { 
  Chart, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement 
} from 'chart.js';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';

Chart.register(
  ArcElement, 
  ChartTooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement
);

// Count bullish/bearish/neutral per ticker and track which agents provided each signal
function aggregateSignals(agents) {
  const tickers = {};
  
  // Process each agent's signals
  Object.entries(agents).forEach(([agentName, agentData]) => {
    if (typeof agentData !== 'object') return;
    
    // Get agent display name
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
    
    // Process each ticker this agent analyzed
    Object.entries(agentData).forEach(([ticker, info]) => {
      // Initialize ticker data if needed
      if (!tickers[ticker]) {
        tickers[ticker] = { 
          bullish: { count: 0, agents: [] }, 
          bearish: { count: 0, agents: [] }, 
          neutral: { count: 0, agents: [] },
          highConfidence: { count: 0, agents: [] },
          mediumConfidence: { count: 0, agents: [] },
          lowConfidence: { count: 0, agents: [] },
          agentTypes: { analyst: 0, portfolio: 0, risk: 0 }
        };
      }
      
      // Track agent type
      tickers[ticker].agentTypes[agentType]++;
      
      // Process signal
      if (info.signal) {
        const signal = info.signal.toLowerCase();
        if (tickers[ticker][signal] !== undefined) {
          tickers[ticker][signal].count++;
          tickers[ticker][signal].agents.push({
            name: displayName,
            type: agentType,
            confidence: info.confidence,
            reasoning: info.reasoning
          });
        }
      }
      
      // Process confidence
      const confidence = info.confidence;
      if (typeof confidence === 'number') {
        let confidenceLevel;
        if (confidence <= 1) {
          // Handle 0-1 scale
          confidenceLevel = confidence > 0.7 ? 'highConfidence' : 
                           confidence > 0.4 ? 'mediumConfidence' : 
                           'lowConfidence';
        } else {
          // Handle 0-100 scale
          confidenceLevel = confidence > 70 ? 'highConfidence' : 
                           confidence > 40 ? 'mediumConfidence' : 
                           'lowConfidence';
        }
        
        tickers[ticker][confidenceLevel].count++;
        tickers[ticker][confidenceLevel].agents.push({
          name: displayName,
          type: agentType,
          signal: info.signal,
          confidence: info.confidence,
          reasoning: info.reasoning
        });
      }
    });
  });
  
  return tickers;
}

// Calculate detailed confidence metrics per ticker
function aggregateConfidence(agents) {
  const tickers = {};
  
  // Process each agent's confidence values
  Object.values(agents).forEach(agent => {
    if (typeof agent !== 'object') return;
    
    Object.entries(agent).forEach(([ticker, info]) => {
      if (!tickers[ticker]) {
        tickers[ticker] = { 
          total: 0, 
          count: 0,
          max: 0,
          min: 100,
          distribution: {
            '0-25': 0,
            '26-50': 0,
            '51-75': 0,
            '76-100': 0
          },
          bySignal: {
            bullish: { total: 0, count: 0 },
            bearish: { total: 0, count: 0 },
            neutral: { total: 0, count: 0 }
          }
        };
      }
      
      if (typeof info.confidence === 'number') {
        // Normalize confidence to 0-100 scale
        const normalizedConfidence = info.confidence <= 1 ? 
          info.confidence * 100 : info.confidence;
        
        // Update aggregate values
        tickers[ticker].total += normalizedConfidence;
        tickers[ticker].count++;
        
        // Update max/min
        if (normalizedConfidence > tickers[ticker].max) {
          tickers[ticker].max = normalizedConfidence;
        }
        if (normalizedConfidence < tickers[ticker].min) {
          tickers[ticker].min = normalizedConfidence;
        }
        
        // Update distribution
        if (normalizedConfidence <= 25) {
          tickers[ticker].distribution['0-25']++;
        } else if (normalizedConfidence <= 50) {
          tickers[ticker].distribution['26-50']++;
        } else if (normalizedConfidence <= 75) {
          tickers[ticker].distribution['51-75']++;
        } else {
          tickers[ticker].distribution['76-100']++;
        }
        
        // Update by signal type if available
        if (info.signal) {
          const signal = info.signal.toLowerCase();
          if (tickers[ticker].bySignal[signal]) {
            tickers[ticker].bySignal[signal].total += normalizedConfidence;
            tickers[ticker].bySignal[signal].count++;
          }
        }
      }
    });
  });
  
  // Calculate averages
  Object.entries(tickers).forEach(([ticker, data]) => {
    // Overall average
    data.avg = data.count ? data.total / data.count : 0;
    
    // Average by signal
    Object.entries(data.bySignal).forEach(([signal, values]) => {
      values.avg = values.count ? values.total / values.count : 0;
    });
  });
  
  return tickers;
}

// Get consensus signal for each ticker
function getConsensusSignals(signalAgg) {
  const consensus = {};
  
  Object.entries(signalAgg).forEach(([ticker, data]) => {
    // Get total signal count
    const totalSignals = data.bullish.count + data.bearish.count + data.neutral.count;
    
    // Calculate percentages
    const bullishPct = totalSignals ? (data.bullish.count / totalSignals) * 100 : 0;
    const bearishPct = totalSignals ? (data.bearish.count / totalSignals) * 100 : 0;
    const neutralPct = totalSignals ? (data.neutral.count / totalSignals) * 100 : 0;
    
    // Determine consensus
    let consensusSignal = 'mixed';
    let consensusStrength = 'weak';
    
    // Strong consensus: >70% agreement
    if (bullishPct >= 70) {
      consensusSignal = 'bullish';
      consensusStrength = 'strong';
    } else if (bearishPct >= 70) {
      consensusSignal = 'bearish';
      consensusStrength = 'strong';
    } else if (neutralPct >= 70) {
      consensusSignal = 'neutral';
      consensusStrength = 'strong';
    }
    // Moderate consensus: >50% agreement
    else if (bullishPct >= 50) {
      consensusSignal = 'bullish';
      consensusStrength = 'moderate';
    } else if (bearishPct >= 50) {
      consensusSignal = 'bearish';
      consensusStrength = 'moderate';
    } else if (neutralPct >= 50) {
      consensusSignal = 'neutral';
      consensusStrength = 'moderate';
    }
    // Weak consensus: plurality wins
    else {
      const max = Math.max(bullishPct, bearishPct, neutralPct);
      if (max === bullishPct) consensusSignal = 'bullish';
      else if (max === bearishPct) consensusSignal = 'bearish';
      else consensusSignal = 'neutral';
      
      // Check if it's very mixed (close percentages)
      const range = Math.max(bullishPct, bearishPct, neutralPct) - 
                   Math.min(bullishPct, bearishPct, neutralPct);
      if (range < 20) {
        consensusStrength = 'divided';
      } else {
        consensusStrength = 'weak';
      }
    }
    
    consensus[ticker] = {
      signal: consensusSignal,
      strength: consensusStrength,
      percentages: {
        bullish: bullishPct,
        bearish: bearishPct,
        neutral: neutralPct
      },
      counts: {
        bullish: data.bullish.count,
        bearish: data.bearish.count,
        neutral: data.neutral.count,
        total: totalSignals
      }
    };
  });
  
  return consensus;
}

export default function AgentCharts({ agents }) {
  if (!agents) return null;
  
  // Process data
  const signalAgg = aggregateSignals(agents);
  const confAgg = aggregateConfidence(agents);
  const consensusData = getConsensusSignals(signalAgg);
  const tickers = Object.keys(signalAgg);
  
  // State for chart type selection
  const [chartType, setChartType] = useState('pie');
  const [selectedTicker, setSelectedTicker] = useState(tickers.length > 0 ? tickers[0] : null);
  
  // Handle chart type change
  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };
  
  // Generate the appropriate chart based on selected type
  const renderSignalChart = (ticker) => {
    const data = {
      labels: ['Bullish', 'Bearish', 'Neutral'],
      datasets: [{
        data: [
          signalAgg[ticker].bullish.count, 
          signalAgg[ticker].bearish.count, 
          signalAgg[ticker].neutral.count
        ],
        backgroundColor: ['#4caf50', '#f44336', '#bdbdbd'],
        borderColor: ['#388e3c', '#d32f2f', '#9e9e9e'],
        borderWidth: 1,
        hoverOffset: 4
      }],
    };
    
    const options = { 
      plugins: { 
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = total ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
    
    switch(chartType) {
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      case 'polar':
        return <PolarArea data={data} options={options} />;
      case 'bar':
        return <Bar 
          data={{
            ...data,
            datasets: [{
              ...data.datasets[0],
              borderRadius: 4
            }]
          }} 
          options={{
            ...options,
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                grid: {
                  display: false
                }
              },
              y: {
                grid: {
                  display: false
                }
              }
            }
          }} 
        />;
      default: // pie
        return <Pie data={data} options={options} />;
    }
  };
  
  // Render confidence distribution chart
  const renderConfidenceChart = (ticker) => {
    const confidenceData = confAgg[ticker];
    
    if (!confidenceData) return null;
    
    const data = {
      labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
      datasets: [{
        label: 'Agents',
        data: [
          confidenceData.distribution['0-25'],
          confidenceData.distribution['26-50'],
          confidenceData.distribution['51-75'],
          confidenceData.distribution['76-100']
        ],
        backgroundColor: ['#ffcdd2', '#ffecb3', '#c8e6c9', '#81c784'],
        borderColor: ['#ef9a9a', '#ffe082', '#a5d6a7', '#66bb6a'],
        borderWidth: 1
      }]
    };
    
    return (
      <Bar
        data={data}
        options={{
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Confidence Distribution',
              font: { size: 14 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Agents'
              },
              ticks: {
                precision: 0
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }}
        height={150}
      />
    );
  };
  
  // Render consensus indicator
  const renderConsensusIndicator = (ticker) => {
    const consensus = consensusData[ticker];
    if (!consensus) return null;
    
    const getConsensusColor = (signal, strength) => {
      if (signal === 'bullish') {
        return strength === 'strong' ? '#2e7d32' : 
               strength === 'moderate' ? '#4caf50' : 
               strength === 'weak' ? '#81c784' : '#c8e6c9';
      } else if (signal === 'bearish') {
        return strength === 'strong' ? '#b71c1c' : 
               strength === 'moderate' ? '#e53935' : 
               strength === 'weak' ? '#ef5350' : '#ffcdd2';
      } else {
        return strength === 'strong' ? '#616161' : 
               strength === 'moderate' ? '#9e9e9e' : 
               strength === 'weak' ? '#bdbdbd' : '#eeeeee';
      }
    };
    
    const getConsensusIcon = (signal) => {
      if (signal === 'bullish') return <TrendingUpIcon />;
      if (signal === 'bearish') return <TrendingDownIcon />;
      return <RemoveIcon />;
    };
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip
          icon={getConsensusIcon(consensus.signal)}
          label={`${consensus.strength.charAt(0).toUpperCase() + consensus.strength.slice(1)} ${consensus.signal.charAt(0).toUpperCase() + consensus.signal.slice(1)} Consensus`}
          sx={{ 
            bgcolor: getConsensusColor(consensus.signal, consensus.strength),
            color: consensus.strength === 'strong' ? 'white' : 'rgba(0,0,0,0.87)',
            fontWeight: 'bold',
            mr: 1
          }}
        />
        <Tooltip title={`${consensus.counts.total} agents analyzed this ticker`}>
          <Typography variant="body2" color="text.secondary">
            {consensus.counts.total} agents
          </Typography>
        </Tooltip>
      </Box>
    );
  };
  
  // Render detailed agent breakdown
  const renderAgentBreakdown = (ticker) => {
    const data = signalAgg[ticker];
    if (!data) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Agent Type Breakdown</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip 
            size="small" 
            label={`${data.agentTypes.analyst} Analyst${data.agentTypes.analyst !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            size="small" 
            label={`${data.agentTypes.portfolio} Portfolio`}
            color="info"
            variant="outlined"
          />
          <Chip 
            size="small" 
            label={`${data.agentTypes.risk} Risk`}
            color="error"
            variant="outlined"
          />
        </Stack>
        
        <Typography variant="subtitle2" gutterBottom>Confidence Levels</Typography>
        <Stack direction="row" spacing={1}>
          <Badge badgeContent={data.highConfidence.count} color="success" max={99}>
            <Chip 
              size="small" 
              label="High Confidence"
              sx={{ bgcolor: '#c8e6c9' }}
            />
          </Badge>
          <Badge badgeContent={data.mediumConfidence.count} color="warning" max={99}>
            <Chip 
              size="small" 
              label="Medium Confidence"
              sx={{ bgcolor: '#fff9c4' }}
            />
          </Badge>
          <Badge badgeContent={data.lowConfidence.count} color="error" max={99}>
            <Chip 
              size="small" 
              label="Low Confidence"
              sx={{ bgcolor: '#ffcdd2' }}
            />
          </Badge>
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Agent Consensus Charts</Typography>
        <Tooltip title="These charts visualize the collective analysis from all AI agents for each ticker. The pie chart shows the distribution of bullish, bearish, and neutral signals, while the bar chart displays confidence levels.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {tickers.length > 0 ? (
        <Grid container spacing={3}>
          {tickers.map(ticker => (
            <Grid item xs={12} md={6} key={ticker}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight="bold">{ticker}</Typography>
                  }
                  action={
                    <ToggleButtonGroup
                      size="small"
                      value={chartType}
                      exclusive
                      onChange={handleChartTypeChange}
                      aria-label="chart type"
                    >
                      <ToggleButton value="pie" aria-label="pie chart">
                        <Tooltip title="Pie Chart">
                          <PieChartIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="doughnut" aria-label="doughnut chart">
                        <Tooltip title="Doughnut Chart">
                          <DonutLargeIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="bar" aria-label="bar chart">
                        <Tooltip title="Bar Chart">
                          <BarChartIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  }
                  subheader={renderConsensusIndicator(ticker)}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderSignalChart(ticker)}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderConfidenceChart(ticker)}
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {renderAgentBreakdown(ticker)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No agent data available for analysis
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
