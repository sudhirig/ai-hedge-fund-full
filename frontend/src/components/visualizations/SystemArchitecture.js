import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Collapse,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AgentAvatar from '../AgentAvatars';

// Component for section headers
const SectionHeader = ({ title, subtitle, color = '#E3F2FD' }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2, 
      mb: 3, 
      backgroundColor: color,
      borderRadius: 2,
      textAlign: 'center'
    }}
  >
    <Typography variant="h6" fontWeight="bold">{title}</Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
    )}
  </Paper>
);

// Component for agent cards
const AgentCard = ({ title, description, tags, icon, color = '#FFEB9A', expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  return (
    <Card 
      sx={{ 
        mb: 2,
        backgroundColor: color,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardHeader
        avatar={icon}
        title={title}
        action={
          <IconButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />
      <Collapse in={isExpanded}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            {description}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            ))}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

// Component for feature cards
const FeatureCard = ({ title, items, color = '#E8F5E9' }) => (
  <Card 
    sx={{ 
      mb: 2,
      backgroundColor: color,
      borderRadius: 2,
      height: '100%'
    }}
  >
    <CardHeader
      title={
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
      }
      sx={{ pb: 0 }}
    />
    <CardContent>
      <List dense>
        {items.map((item, index) => (
          <ListItem key={index} sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body2">{item}</Typography>
              } 
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

// Flow arrow component
const FlowArrow = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      my: 2 
    }}
  >
    <ArrowDownwardIcon 
      color="primary" 
      sx={{ 
        fontSize: 40,
        animation: 'bounce 1s infinite alternate',
        '@keyframes bounce': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(10px)' }
        }
      }} 
    />
  </Box>
);

function SystemArchitecture({ simulationData }) {
  // Strategic Investor Agents
  const strategicAgents = [
    {
      title: 'Ben Graham Agent',
      description: 'Focuses on finding undervalued stocks with a margin of safety. Analyzes balance sheets, P/E ratios, and other fundamental metrics.',
      tags: ['Value Investing', 'Balance Sheet Analysis', 'P/E, P/B Ratios', 'Margin of Safety'],
      icon: <AgentAvatar agent="Ben Graham Agent" />,
      expanded: true
    },
    {
      title: 'Warren Buffett Agent',
      description: 'Seeks businesses with durable competitive advantages at reasonable prices. Focuses on business quality and management integrity.',
      tags: ['Business Quality', 'Moat Assessment', 'Management Quality', 'ROIC Analysis'],
      icon: <AgentAvatar agent="Warren Buffett Agent" />
    },
    {
      title: 'Cathie Wood Agent',
      description: 'Identifies disruptive innovation and high-growth opportunities. Focuses on technological breakthroughs and exponential growth potential.',
      tags: ['Tech Trend Analysis', 'Growth Forecasting', 'TAM Sizing'],
      icon: <AgentAvatar agent="Cathie Wood Agent" />
    },
    {
      title: 'Ray Dalio Agent',
      description: 'Implements an all-weather strategy that balances risk across different economic environments. Analyzes macro trends and correlations.',
      tags: ['Macro Cycle Analysis', 'Risk Parity', 'Asset Correlation'],
      icon: <AgentAvatar agent="Ray Dalio Agent" />
    },
    {
      title: 'Stan Druckenmiller Agent',
      description: 'Makes concentrated bets based on macroeconomic trends. Focuses on central bank policies, currency flows, and liquidity assessment.',
      tags: ['Central Bank Analysis', 'Currency Flows', 'Liquidity Assessment'],
      icon: <AgentAvatar agent="Stanley Druckenmiller Agent" />
    },
    {
      title: 'Peter Lynch Agent',
      description: 'Focuses on growth at a reasonable price. Looks for companies with strong growth potential that are still reasonably valued.',
      tags: ['PEG Ratio Analysis', 'Industry Trends', 'Growth Assessment'],
      icon: <AgentAvatar agent="Phil Fisher Agent" />
    }
  ];
  
  // Portfolio Management Agents
  const portfolioAgents = [
    {
      title: 'Portfolio Tracker',
      description: 'Monitors performance metrics and attributes returns to specific strategies and decisions.',
      tags: ['Performance Monitoring', 'Benchmark Comparison', 'Metrics Calculation'],
      color: '#E8F5E9'
    },
    {
      title: 'Allocation Optimizer',
      description: 'Optimizes asset allocation based on risk-return profiles and diversification benefits.',
      tags: ['Asset Allocation', 'Sector Weighting', 'Position Sizing'],
      color: '#E8F5E9'
    },
    {
      title: 'Scenario Simulator',
      description: 'Stress tests the portfolio against various market scenarios to identify vulnerabilities.',
      tags: ['Market Scenarios', 'Volatility Modeling', 'Tail Risk Assessment'],
      color: '#E8F5E9'
    },
    {
      title: 'Rebalancing Agent',
      description: 'Manages portfolio drift and suggests rebalancing actions to maintain target allocations.',
      tags: ['Drift Analysis', 'Rebalance Triggers', 'Tax Efficiency'],
      color: '#E8F5E9'
    },
    {
      title: 'Risk Manager',
      description: 'Controls risk exposure and implements hedging strategies when necessary.',
      tags: ['Position Limits', 'Drawdown Control', 'Hedging Strategy'],
      color: '#E8F5E9'
    },
    {
      title: 'Trade Executor',
      description: 'Manages order generation and execution verification for portfolio changes.',
      tags: ['Order Generation', 'Execution Strategy', 'Trading Verification'],
      color: '#E8F5E9'
    }
  ];
  
  // AI Model Integration
  const aiModels = [
    {
      title: 'OpenAI (GPT-4o)',
      description: 'Provides trading logic and analysis capabilities for the agents.',
      tags: ['Function Calling', 'Structured Output', 'Pattern Recognition']
    },
    {
      title: 'Claude (Opus/Sonnet)',
      description: 'Specializes in research and reasoning for deeper financial analysis.',
      tags: ['Deep Analysis', 'Financial Reasoning', 'Report Generation']
    },
    {
      title: 'Google Gemini Pro',
      description: 'Focuses on technical and pattern analysis across multiple data types.',
      tags: ['Chart Analysis', 'Multi-modal Data', 'Market Patterns']
    }
  ];
  
  // Agent Collaboration Features
  const collaborationFeatures = [
    {
      title: 'Insight Aggregation',
      items: ['Multi-agent Synthesis', 'Insight Extraction', 'Conflict Resolution']
    },
    {
      title: 'Consensus Building',
      items: ['Weighted Voting', 'Confidence Scoring', 'Agreement Metrics']
    },
    {
      title: 'Decision Validation',
      items: ['Risk Assessment', 'Sanity Checking', 'Historical Comparison']
    }
  ];
  
  // Action Generation Features
  const actionFeatures = [
    {
      title: 'Trading Signal Generation',
      items: ['Buy (Entry, Size, Timing)', 'Sell (Exit, Size, Timing)', 'Hold (Conditions, Timeframe)', 'Short (Entry, Size, Timing)', 'Cover (Exit, Size, Timing)', 'Hedge (Strategy, Instruments)']
    },
    {
      title: 'Analysis Output Generation',
      items: ['Interactive Dashboards', 'Reports & Analysis', 'Risk Assessments', 'Alerts & Notifications']
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        AI System Architecture
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <SectionHeader 
          title="Complete Agent-Based Trading System" 
          color="#E3F2FD"
        />
        
        {/* User Input & Market Data */}
        <SectionHeader 
          title="User Input & Market Data" 
          color="#E3F2FD"
        />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="User Queries" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Market Events" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Portfolio Holdings" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Trading Objectives" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
        </Grid>
        
        <FlowArrow />
        
        {/* Agent Swarm Orchestrator */}
        <SectionHeader 
          title="Agent Swarm Orchestrator" 
          color="#E3F2FD"
        />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Query Analysis" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Agent Selection" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Task Distribution" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Chip 
              label="Priority Setting" 
              color="primary" 
              variant="outlined" 
              sx={{ width: '100%' }} 
            />
          </Grid>
        </Grid>
        
        <FlowArrow />
        
        {/* Strategic Investor Agents */}
        <SectionHeader 
          title="Strategic Investor Agents" 
          color="#FFF9C4"
        />
        <Grid container spacing={2}>
          {strategicAgents.map((agent, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <AgentCard {...agent} />
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ 
          backgroundColor: '#FFF9C4', 
          p: 2, 
          borderRadius: 2, 
          mt: 2, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            Input: Financial Statements, Economic Data, Company Reports, Industry Analysis
          </Typography>
        </Box>
        
        <FlowArrow />
        
        {/* Portfolio Management Agents */}
        <SectionHeader 
          title="Portfolio Management Agents" 
          color="#E8F5E9"
        />
        <Grid container spacing={2}>
          {portfolioAgents.map((agent, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <AgentCard {...agent} />
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ 
          backgroundColor: '#E8F5E9', 
          p: 2, 
          borderRadius: 2, 
          mt: 2, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            Input: Portfolio Holdings, Asset Performance, Market Conditions, Risk Parameters
          </Typography>
        </Box>
        
        <FlowArrow />
        
        {/* AI Model Integration */}
        <SectionHeader 
          title="AI Model Integration" 
          color="#F3E5F5"
        />
        <Grid container spacing={2}>
          {aiModels.map((model, index) => (
            <Grid item xs={12} md={4} key={index}>
              <AgentCard 
                {...model} 
                color="#F3E5F5"
              />
            </Grid>
          ))}
        </Grid>
        
        <FlowArrow />
        
        {/* Agent Collaboration Layer */}
        <SectionHeader 
          title="Agent Collaboration Layer" 
          color="#E3F2FD"
        />
        <Grid container spacing={2}>
          {collaborationFeatures.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <FeatureCard {...feature} color="#E3F2FD" />
            </Grid>
          ))}
        </Grid>
        
        <FlowArrow />
        
        {/* Action Generation */}
        <SectionHeader 
          title="Action Generation" 
          color="#FFF8E1"
        />
        <Grid container spacing={2}>
          {actionFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <FeatureCard {...feature} color="#FFF8E1" />
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <InfoIcon color="info" sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          This architecture diagram shows how multiple AI agents collaborate to analyze data, 
          make investment decisions, and manage portfolio risk in an integrated system.
        </Typography>
      </Box>
    </Box>
  );
}

export default SystemArchitecture;
