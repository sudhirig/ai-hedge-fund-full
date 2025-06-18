import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Stack,
  LinearProgress
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import CalculateIcon from '@mui/icons-material/Calculate';
import DataObjectIcon from '@mui/icons-material/DataObject';
import BarChartIcon from '@mui/icons-material/BarChart';
import AgentAvatar from './AgentAvatars';

// Helper function to determine signal color
const signalColor = (signal) => {
  if (!signal) return "default";
  const s = signal.toLowerCase();
  if (s === "bullish" || s === "buy") return "success";
  if (s === "bearish" || s === "sell") return "error";
  if (s === "neutral" || s === "hold") return "info";
  return "default";
};

// Helper function to format JSON
function formatJsonOutput(data) {
  if (!data) return 'No data available';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
}

/**
 * Component for displaying detailed agent analysis
 * This component is used in both the Agents tab and the Raw Output tab
 */
function AgentDetailedAnalysis({ agents, compact = false }) {
  // Agent methodology information
  const agentMethodologies = {
    'Ben Graham Agent': {
      description: 'Applies Benjamin Graham\'s value investing principles to identify undervalued stocks with a margin of safety.',
      inputs: ['Balance Sheet', 'Income Statement', 'Price Data', 'Market Capitalization'],
      methodology: [
        'Calculates intrinsic value using Graham\'s formula: EPS × (8.5 + 2g) where g is growth rate',
        'Evaluates Price-to-Book ratio against historical averages',
        'Assesses debt-to-equity ratio to ensure financial stability',
        'Requires margin of safety of at least 30% below intrinsic value'
      ],
      formulas: [
        { name: 'Graham Number', formula: '√(22.5 × EPS × BVPS)', description: 'Maximum price to pay for a stock' },
        { name: 'Net Current Asset Value', formula: 'Current Assets - Total Liabilities', description: 'Measure of liquidation value' },
        { name: 'Margin of Safety', formula: '(Intrinsic Value - Market Price) / Intrinsic Value', description: 'Safety buffer for investments' }
      ],
      signalGeneration: 'Generates BUY signals when price is significantly below intrinsic value with adequate margin of safety. Generates SELL signals when price approaches or exceeds intrinsic value.'
    },
    'Warren Buffett Agent': {
      description: 'Emulates Warren Buffett\'s investment approach focusing on businesses with durable competitive advantages at reasonable prices.',
      inputs: ['Financial Statements', 'Return on Equity', 'Debt Levels', 'Free Cash Flow', 'Competitive Position'],
      methodology: [
        'Identifies companies with consistent high return on equity (ROE)',
        'Evaluates economic moat through market share and brand strength',
        'Assesses management quality and capital allocation decisions',
        'Calculates intrinsic value using discounted cash flow analysis'
      ],
      formulas: [
        { name: 'Return on Equity', formula: 'Net Income / Shareholder\'s Equity', description: 'Measures profitability relative to equity' },
        { name: 'Owner Earnings', formula: 'Net Income + Depreciation - CapEx', description: 'True earnings power of business' },
        { name: 'Intrinsic Value', formula: 'Sum of discounted future cash flows', description: 'True value of the business' }
      ],
      signalGeneration: 'Generates BUY signals for high-quality businesses with strong moats trading below intrinsic value. Generates SELL signals when quality deteriorates or price significantly exceeds intrinsic value.'
    },
    'Cathie Wood Agent': {
      description: 'Implements Cathie Wood\'s innovation-focused investment strategy targeting disruptive technologies and exponential growth.',
      inputs: ['R&D Spending', 'Revenue Growth Rate', 'Market Size (TAM)', 'Technology Adoption Rates'],
      methodology: [
        'Identifies companies in disruptive innovation sectors',
        'Evaluates total addressable market (TAM) and growth potential',
        'Assesses technology adoption curves and inflection points',
        'Projects 5-year revenue growth and market penetration'
      ],
      formulas: [
        { name: 'Wright\'s Law', formula: 'Cost = First Unit Cost × Cumulative Volume^(-Learning Rate)', description: 'Cost decline with production volume' },
        { name: 'TAM Penetration', formula: 'Company Revenue / Total Addressable Market', description: 'Market share potential' },
        { name: 'Growth Adjusted P/S', formula: 'Price-to-Sales / Revenue Growth Rate', description: 'Valuation metric for high-growth companies' }
      ],
      signalGeneration: 'Generates BUY signals for companies with disruptive technologies showing exponential growth potential. Generates SELL signals when innovation momentum slows or valuation becomes excessive relative to growth.'
    },
    'Charlie Munger Agent': {
      description: 'Applies Charlie Munger\'s mental models and focus on high-quality businesses with predictable earnings.',
      inputs: ['Business Model', 'Competitive Landscape', 'Management Quality', 'Financial Statements'],
      methodology: [
        'Applies multiple mental models to assess business quality',
        'Evaluates business predictability and consistency',
        'Assesses management incentives and capital allocation',
        'Requires significant margin of safety'
      ],
      formulas: [
        { name: 'Latticework Analysis', formula: 'Qualitative assessment using multiple mental models', description: 'Holistic business evaluation' },
        { name: 'Moat Analysis', formula: 'Qualitative + Quantitative factors', description: 'Competitive advantage assessment' },
        { name: 'Quality Score', formula: 'Weighted sum of quality metrics', description: 'Overall business quality rating' }
      ],
      signalGeneration: 'Generates BUY signals for high-quality businesses with durable competitive advantages at reasonable prices. Generates SELL signals when quality deteriorates or price becomes unreasonable.'
    },
    'Ray Dalio Agent': {
      description: 'Implements Ray Dalio\'s macro-driven approach with focus on economic cycles and risk parity.',
      inputs: ['Macroeconomic Indicators', 'Interest Rates', 'Inflation Data', 'Credit Cycles'],
      methodology: [
        'Analyzes economic machine and debt cycles',
        'Evaluates asset correlations and risk-adjusted returns',
        'Assesses inflation/deflation risks and monetary policy',
        'Implements risk parity principles for portfolio construction'
      ],
      formulas: [
        { name: 'Risk Parity', formula: 'Asset Weight ∝ 1/Asset Volatility', description: 'Balances risk contribution across assets' },
        { name: 'Economic Cycle Indicator', formula: 'Composite of leading economic indicators', description: 'Economic cycle positioning' },
        { name: 'Inflation Regime Model', formula: 'Weighted sum of inflation indicators', description: 'Inflation/deflation assessment' }
      ],
      signalGeneration: 'Generates BUY signals for assets well-positioned for current macroeconomic regime. Generates SELL signals when macro risks increase or regime shifts occur.'
    },
    'Stan Druckenmiller Agent': {
      description: 'Emulates Stanley Druckenmiller\'s top-down, concentrated approach with focus on macro trends and momentum.',
      inputs: ['Global Macro Trends', 'Monetary Policy', 'Sector Momentum', 'Earnings Surprises'],
      methodology: [
        'Identifies major macro themes and inflection points',
        'Takes concentrated positions with strong conviction',
        'Focuses on sectors with positive momentum and catalysts',
        'Incorporates technical analysis for timing'
      ],
      formulas: [
        { name: 'Momentum Score', formula: 'Weighted sum of price momentum factors', description: 'Price trend strength' },
        { name: 'Liquidity Indicator', formula: 'Composite of monetary policy metrics', description: 'Market liquidity assessment' },
        { name: 'Earnings Revision Model', formula: 'Rate of change in earnings estimates', description: 'Earnings momentum' }
      ],
      signalGeneration: 'Generates BUY signals for sectors and stocks with strong momentum aligned with macro themes. Generates SELL signals when momentum weakens or macro themes shift.'
    },
    'Portfolio Management Agent': {
      description: 'Synthesizes all agent signals and optimizes portfolio construction based on risk/reward and diversification.',
      inputs: ['Agent Signals', 'Position Sizes', 'Risk Metrics', 'Correlation Matrix'],
      methodology: [
        'Aggregates signals from all agents with confidence weighting',
        'Optimizes position sizing based on conviction and risk',
        'Manages portfolio-level risk and diversification',
        'Implements trade execution strategy'
      ],
      formulas: [
        { name: 'Signal Aggregation', formula: 'Weighted Sum of Agent Signals × Confidence Scores', description: 'Combines all agent inputs' },
        { name: 'Optimal Position Size', formula: 'Expected Return / (Risk Aversion × Variance)', description: 'Kelly-inspired position sizing' },
        { name: 'Portfolio Efficiency', formula: '(Expected Return - Risk-Free Rate) / Portfolio Volatility', description: 'Sharpe ratio optimization' }
      ],
      signalGeneration: 'Generates final BUY/SELL/HOLD decisions by synthesizing all agent inputs and optimizing for the overall portfolio context.'
    },
    'Fundamental Analysis Agent': {
      description: 'Analyzes company fundamentals including financial statements, growth rates, and profitability metrics.',
      inputs: ['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Financial Ratios'],
      methodology: [
        'Evaluates profitability trends and margins',
        'Assesses balance sheet strength and leverage',
        'Analyzes cash flow generation and quality',
        'Compares key metrics to industry benchmarks'
      ],
      formulas: [
        { name: 'Gross Margin', formula: '(Revenue - COGS) / Revenue', description: 'Measure of production efficiency' },
        { name: 'Interest Coverage', formula: 'EBIT / Interest Expense', description: 'Ability to cover debt obligations' },
        { name: 'Free Cash Flow Yield', formula: 'FCF / Market Cap', description: 'Cash generation relative to price' }
      ],
      signalGeneration: 'Generates BUY signals for companies with strong fundamentals trading at reasonable valuations. Generates SELL signals when fundamentals deteriorate or valuation becomes excessive.'
    },
    'Technical Analyst': {
      description: 'Applies technical analysis to identify price patterns, trends, and momentum signals.',
      inputs: ['Price Data', 'Volume Data', 'Technical Indicators', 'Chart Patterns'],
      methodology: [
        'Identifies trend direction using moving averages',
        'Evaluates momentum with oscillators like RSI and MACD',
        'Analyzes support/resistance levels and chart patterns',
        'Incorporates volume confirmation for signals'
      ],
      formulas: [
        { name: 'Relative Strength Index', formula: '100 - (100 / (1 + RS))', description: 'Momentum oscillator' },
        { name: 'Moving Average Convergence Divergence', formula: '12-Period EMA - 26-Period EMA', description: 'Trend-following momentum indicator' },
        { name: 'Bollinger Bands', formula: '20-Period MA ± (20-Period Standard Deviation × 2)', description: 'Volatility-based trading bands' }
      ],
      signalGeneration: 'Generates BUY signals when price shows bullish patterns, upward momentum, or key support levels. Generates SELL signals when bearish patterns emerge or momentum deteriorates.'
    },
    'Valuation Analysis Agent': {
      description: 'Focuses on valuation metrics and models to determine if stocks are overvalued or undervalued.',
      inputs: ['Financial Projections', 'Discount Rates', 'Growth Rates', 'Comparable Multiples'],
      methodology: [
        'Implements discounted cash flow (DCF) analysis',
        'Compares current multiples to historical and peer averages',
        'Calculates intrinsic value using multiple methodologies',
        'Assesses value relative to growth (PEG ratio)'
      ],
      formulas: [
        { name: 'Discounted Cash Flow', formula: 'Sum of (Future Cash Flows / (1 + Discount Rate)^t)', description: 'Present value of future cash flows' },
        { name: 'EV/EBITDA', formula: 'Enterprise Value / EBITDA', description: 'Capital structure-neutral valuation multiple' },
        { name: 'PEG Ratio', formula: 'P/E Ratio / Annual EPS Growth', description: 'Price relative to earnings growth' }
      ],
      signalGeneration: 'Generates BUY signals when valuation is significantly below intrinsic value estimates. Generates SELL signals when valuation exceeds intrinsic value by a material margin.'
    },
    'Sentiment Analysis Agent': {
      description: 'Analyzes market sentiment from news, social media, and analyst opinions to gauge market psychology.',
      inputs: ['News Headlines', 'Social Media Data', 'Analyst Ratings', 'Options Market Data'],
      methodology: [
        'Processes news sentiment using natural language processing',
        'Tracks social media mentions and sentiment trends',
        'Monitors analyst rating changes and consensus shifts',
        'Analyzes options market for implied volatility and put/call ratios'
      ],
      formulas: [
        { name: 'Sentiment Score', formula: '(Positive References - Negative References) / Total References', description: 'Net sentiment measure' },
        { name: 'Put/Call Ratio', formula: 'Put Volume / Call Volume', description: 'Options market sentiment indicator' },
        { name: 'Analyst Consensus', formula: 'Weighted Average of Analyst Ratings', description: 'Professional sentiment measure' }
      ],
      signalGeneration: 'Generates BUY signals when sentiment is positive and improving. Generates SELL signals when sentiment deteriorates or becomes excessively bullish (contrarian indicator).'
    },
    'Risk Management Agent': {
      description: 'Evaluates and manages risk at both the position and portfolio level.',
      inputs: ['Position Sizes', 'Volatility Metrics', 'Correlation Matrix', 'Market Risk Indicators'],
      methodology: [
        'Calculates position-level risk metrics (VaR, beta)',
        'Assesses portfolio-level risk and diversification',
        'Monitors market risk indicators and tail risk',
        'Implements risk mitigation strategies'
      ],
      formulas: [
        { name: 'Value at Risk', formula: 'Portfolio Value × Z-score × Portfolio Volatility', description: 'Potential loss estimate' },
        { name: 'Beta', formula: 'Covariance(Asset, Market) / Variance(Market)', description: 'Systematic risk measure' },
        { name: 'Maximum Drawdown', formula: 'Max(Previous Peak - Current Value) / Previous Peak', description: 'Worst historical loss' }
      ],
      signalGeneration: 'Generates risk warnings and position size recommendations based on risk metrics. May override other agent signals when risk thresholds are exceeded.'
    }
  };

  return (
    <Box>
      {!compact && (
        <>
          <Typography variant="h6" gutterBottom>
            Agent Methodologies & Decision Processes
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Each agent in the Capital Global AI system uses specific methodologies, data inputs, and formulas to generate investment signals. Below is a detailed breakdown of how each agent works.
          </Typography>
        </>
      )}
      
      {agents.map((agent, index) => {
        const agentName = typeof agent === 'string' ? agent : agent.name;
        const agentData = typeof agent === 'string' ? {} : agent.data;
        
        const methodology = agentMethodologies[agentName] || {
          description: 'Specialized investment agent focusing on specific market factors and signals.',
          inputs: ['Market Data', 'Financial Statements', 'Economic Indicators'],
          methodology: ['Analyzes specific market factors', 'Generates signals based on proprietary algorithms'],
          formulas: [{ name: 'Signal Generation', formula: 'Proprietary', description: 'Custom signal generation formula' }],
          signalGeneration: 'Generates BUY/SELL signals based on analysis of relevant market factors.'
        };
        
        // For compact mode (used in Agents tab), use a different layout
        if (compact) {
          return (
            <Box key={index} sx={{ mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{agentName} Overview</Typography>
                <Typography variant="body2" paragraph>{methodology.description}</Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Current Analysis Results - Compact View */}
                {Object.keys(agentData).length > 0 ? (
                  <>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Current Analysis</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(agentData).map(([ticker, data], idx) => (
                        <Grid item xs={12} key={idx}>
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              borderLeft: `4px solid ${data.signal ? 
                                (data.signal.toLowerCase() === 'bullish' || data.signal.toLowerCase() === 'buy' ? '#4caf50' : 
                                data.signal.toLowerCase() === 'bearish' || data.signal.toLowerCase() === 'sell' ? '#f44336' : 
                                '#2196f3') : '#9e9e9e'}`
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold">{ticker}</Typography>
                              {data.signal && (
                                <Chip 
                                  label={data.signal} 
                                  size="small" 
                                  color={signalColor(data.signal)}
                                />
                              )}
                            </Box>
                            
                            {/* Confidence Level */}
                            {data.confidence !== undefined && (
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2">Confidence:</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {typeof data.confidence === 'number' && data.confidence <= 1 
                                      ? `${Math.round(data.confidence * 100)}%` 
                                      : `${Math.round(data.confidence)}%`}
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={typeof data.confidence === 'number' && data.confidence <= 1 
                                    ? data.confidence * 100 
                                    : data.confidence} 
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'rgba(0,0,0,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 4,
                                      bgcolor: data.confidence > 70 || data.confidence > 0.7 ? 'success.main' :
                                              data.confidence > 40 || data.confidence > 0.4 ? 'info.main' :
                                              'warning.main'
                                    }
                                  }}
                                />
                              </Box>
                            )}
                            
                            {/* Reasoning - Simplified for compact view */}
                            {data.reasoning && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" fontWeight="medium" gutterBottom>Analysis:</Typography>
                                {typeof data.reasoning === 'string' ? (
                                  <Typography variant="body2" sx={{ 
                                    whiteSpace: 'pre-line', 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.85rem',
                                    p: 1.5,
                                    bgcolor: 'rgba(0,0,0,0.03)',
                                    borderRadius: 1,
                                    maxHeight: '150px',
                                    overflow: 'auto'
                                  }}>
                                    {data.reasoning}
                                  </Typography>
                                ) : (
                                  <Box sx={{ 
                                    p: 1.5, 
                                    bgcolor: 'rgba(0,0,0,0.03)', 
                                    borderRadius: 1,
                                    maxHeight: '200px',
                                    overflow: 'auto'
                                  }}>
                                    {Object.entries(data.reasoning).map(([key, value]) => (
                                      <Box key={key} sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" fontWeight="bold" color="primary">
                                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                          pl: 1, 
                                          borderLeft: '2px solid #e0e0e0', 
                                          fontSize: '0.85rem',
                                          wordBreak: 'break-word'
                                        }}>
                                          {typeof value === 'object' ? 
                                            JSON.stringify(value, null, 2) : 
                                            String(value)}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No current analysis data available for this agent.
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                {/* Key Methodology - Compact View */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Key Methodology</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {methodology.inputs.map((input, i) => (
                      <Chip key={i} label={input} size="small" variant="outlined" color="primary" />
                    ))}
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'rgba(0,0,0,0.03)', 
                    borderRadius: 1,
                    mt: 1 
                  }}>
                    <ul style={{ paddingLeft: '1.5rem', margin: '0' }}>
                      {methodology.methodology.slice(0, 2).map((step, i) => (
                        <li key={i}>
                          <Typography variant="body2">{step}</Typography>
                        </li>
                      ))}
                      {methodology.methodology.length > 2 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          + {methodology.methodology.length - 2} more steps
                        </Typography>
                      )}
                    </ul>
                  </Box>
                </Box>
              </Paper>
            </Box>
          );
        }
        
        // Full detailed view (used in Raw Output tab)
        return (
          <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AgentAvatar agent={agentName} sx={{ mr: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold">{agentName}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Agent Description */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardHeader 
                      title="Agent Description" 
                      avatar={<InfoIcon color="primary" />}
                      sx={{ pb: 1 }}
                    />
                    <CardContent>
                      <Typography variant="body2" paragraph>
                        {methodology.description}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>Data Inputs:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {methodology.inputs.map((input, i) => (
                          <Chip key={i} label={input} size="small" variant="outlined" />
                        ))}
                      </Box>
                      <Typography variant="subtitle2" gutterBottom>Methodology:</Typography>
                      <ul style={{ paddingLeft: '1.5rem', marginTop: 0 }}>
                        {methodology.methodology.map((step, i) => (
                          <li key={i}>
                            <Typography variant="body2">{step}</Typography>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Agent Formulas */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardHeader 
                      title="Key Formulas & Models" 
                      avatar={<CalculateIcon color="primary" />}
                      sx={{ pb: 1 }}
                    />
                    <CardContent>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Formula</TableCell>
                              <TableCell>Expression</TableCell>
                              <TableCell>Purpose</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {methodology.formulas.map((formula, i) => (
                              <TableRow key={i}>
                                <TableCell>{formula.name}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {formula.formula}
                                  </Typography>
                                </TableCell>
                                <TableCell>{formula.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>Signal Generation Logic:</Typography>
                      <Typography variant="body2">
                        {methodology.signalGeneration}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Current Analysis Results */}
                {Object.keys(agentData).length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardHeader 
                        title="Current Analysis" 
                        avatar={<DataObjectIcon color="primary" />}
                        sx={{ pb: 1 }}
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          {Object.entries(agentData).map(([ticker, data], idx) => (
                            <Grid item xs={12} md={6} lg={4} key={idx}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">{ticker}</Typography>
                                  {data.signal && (
                                    <Chip 
                                      label={data.signal} 
                                      size="small" 
                                      color={signalColor(data.signal)}
                                    />
                                  )}
                                </Box>
                                
                                {/* Confidence Level */}
                                {data.confidence !== undefined && (
                                  <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                      <Typography variant="body2">Confidence:</Typography>
                                      <Typography variant="body2" fontWeight="bold">
                                        {typeof data.confidence === 'number' && data.confidence <= 1 
                                          ? `${Math.round(data.confidence * 100)}%` 
                                          : `${Math.round(data.confidence)}%`}
                                      </Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={typeof data.confidence === 'number' && data.confidence <= 1 
                                        ? data.confidence * 100 
                                        : data.confidence} 
                                      sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(0,0,0,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 4,
                                          bgcolor: data.confidence > 70 || data.confidence > 0.7 ? 'success.main' :
                                                  data.confidence > 40 || data.confidence > 0.4 ? 'info.main' :
                                                  'warning.main'
                                        }
                                      }}
                                    />
                                  </Box>
                                )}
                                
                                {/* Reasoning */}
                                <Typography variant="body2" fontWeight="medium" gutterBottom>Analysis:</Typography>
                                {data.reasoning ? (
                                  typeof data.reasoning === 'string' ? (
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                      {data.reasoning.length > 200 ? `${data.reasoning.substring(0, 200)}...` : data.reasoning}
                                    </Typography>
                                  ) : (
                                    <Box>
                                      {Object.entries(data.reasoning).map(([key, value]) => (
                                        <Box key={key} sx={{ mb: 1 }}>
                                          <Typography variant="caption" fontWeight="bold" color="primary">
                                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                          </Typography>
                                          <Typography variant="body2" sx={{ pl: 1, borderLeft: '2px solid #e0e0e0', fontSize: '0.85rem' }}>
                                            {typeof value === 'object' ? formatJsonOutput(value) : String(value)}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  )
                                ) : (
                                  <Typography variant="body2" color="text.secondary">No detailed reasoning available.</Typography>
                                )}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Performance Metrics Placeholder (for future implementation) */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader 
                      title="Agent Performance Metrics" 
                      avatar={<BarChartIcon color="primary" />}
                      sx={{ pb: 1 }}
                      action={
                        <Tooltip title="Historical performance metrics for this agent">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px' }}>
                          <Typography variant="subtitle2" gutterBottom>Signal Accuracy</Typography>
                          <Typography variant="h5" color="primary" fontWeight="bold">78%</Typography>
                          <Typography variant="caption" color="text.secondary">Based on 3-month performance</Typography>
                        </Paper>
                        
                        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px' }}>
                          <Typography variant="subtitle2" gutterBottom>Avg. Return per Signal</Typography>
                          <Typography variant="h5" color="success.main" fontWeight="bold">+4.2%</Typography>
                          <Typography variant="caption" color="text.secondary">30-day holding period</Typography>
                        </Paper>
                        
                        <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px' }}>
                          <Typography variant="subtitle2" gutterBottom>Confidence Correlation</Typography>
                          <Typography variant="h5" color="info.main" fontWeight="bold">0.72</Typography>
                          <Typography variant="caption" color="text.secondary">Confidence vs. actual returns</Typography>
                        </Paper>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

export default AgentDetailedAnalysis;
