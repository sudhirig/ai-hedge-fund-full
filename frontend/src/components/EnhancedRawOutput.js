import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  Alert,
  LinearProgress,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import AgentDetailedAnalysis from './AgentDetailedAnalysis';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchemaIcon from '@mui/icons-material/Schema';
import SourceIcon from '@mui/icons-material/Source';
import CalculateIcon from '@mui/icons-material/Calculate';
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

// Helper function to try parsing JSON
function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Main component
function EnhancedRawOutput({ raw }) {
  const [tab, setTab] = useState(0);
  const [parsedData, setParsedData] = useState({
    agents: [],
    decisions: [],
    analysis: []
  });

  // Parse raw output on component mount
  useEffect(() => {
    if (!raw) return;
    
    // Parse agent blocks
    const agentBlocks = [];
    const agentBlockRegex = /=+\s+([\w\s]+Agent[\w\s]*)=+\n(\{[\s\S]+?\})\n=+/g;
    let m;
    while ((m = agentBlockRegex.exec(raw))) {
      const name = m[1].trim();
      const jsonStr = m[2];
      const data = tryParseJSON(jsonStr) || jsonStr;
      agentBlocks.push({ name, data });
    }
    
    // Parse trading decisions
    const decisions = [];
    const tradingTableRegex = /TRADING DECISION: \[(.*?)\][^\S\r\n]*\n(?:[ \t]*\n)*([+\-|\w\s%.$:,\[\]]+)/g;
    let tt;
    while ((tt = tradingTableRegex.exec(raw))) {
      const ticker = tt[1];
      const tableStr = tt[2];
      
      // Parse the table
      const lines = tableStr.split("\n").filter(line => line.trim().startsWith("|") && line.includes("|"));
      if (lines.length < 2) continue;
      
      const headers = lines[0].split("|").map(h => h.trim()).filter(Boolean);
      const values = lines[1].split("|").map(v => v.trim()).filter(Boolean);
      
      const decision = { ticker };
      headers.forEach((header, i) => {
        if (i < values.length) {
          const key = header.toLowerCase();
          let value = values[i];
          
          // Convert to appropriate types
          if (key === 'quantity' && !isNaN(value)) {
            value = parseInt(value);
          } else if (key === 'confidence' && value.includes('%')) {
            value = parseFloat(value.replace('%', ''));
          }
          
          decision[key] = value;
        }
      });
      
      decisions.push(decision);
    }
    
    // Parse analysis sections
    const analysis = [];
    const analysisRegex = /Analysis for ([A-Z]+)[\s=]+/g;
    let a;
    while ((a = analysisRegex.exec(raw))) {
      analysis.push(a[0]);
    }
    
    setParsedData({
      agents: agentBlocks,
      decisions,
      analysis,
      raw
    });
  }, [raw]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Capital Global AI System - Detailed Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This section provides a comprehensive breakdown of how the AI agents analyze data, make decisions, and generate trading signals.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<SchemaIcon />} iconPosition="start" label="Agent Details" />
            <Tab icon={<BarChartIcon />} iconPosition="start" label="Decision Process" />
            <Tab icon={<SourceIcon />} iconPosition="start" label="Data Sources" />
            <Tab icon={<CalculateIcon />} iconPosition="start" label="Formulas & Models" />
            <Tab icon={<CodeIcon />} iconPosition="start" label="Raw Log" />
          </Tabs>
        </Box>
        
        {/* Agent Details Tab */}
        {tab === 0 && (
          <AgentDetailsTab agents={parsedData.agents} />
        )}
        
        {/* Decision Process Tab */}
        {tab === 1 && (
          <DecisionProcessTab agents={parsedData.agents} decisions={parsedData.decisions} />
        )}
        
        {/* Data Sources Tab */}
        {tab === 2 && (
          <DataSourcesTab agents={parsedData.agents} raw={raw} />
        )}
        
        {/* Formulas & Models Tab */}
        {tab === 3 && (
          <FormulasModelsTab agents={parsedData.agents} />
        )}
        
        {/* Raw Log Tab */}
        {tab === 4 && (
          <RawLogTab raw={raw} />
        )}
      </Paper>
    </Box>
  );
}

// Agent Details Tab Component
function AgentDetailsTab({ agents }) {
  return <AgentDetailedAnalysis agents={agents} />;
}

// Decision Process Tab Component
function DecisionProcessTab({ agents, decisions }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Decision-Making Process
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This section illustrates how the Capital Global AI system processes data through multiple agents to arrive at final trading decisions.
      </Typography>
      
      {/* Decision Flow Visualization */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Decision Flow Diagram" titleTypographyProps={{ variant: 'subtitle1' }} />
        <CardContent>
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f8f9fa', 
            borderRadius: 1,
            overflowX: 'auto'
          }}>
            <Box sx={{ 
              minWidth: 800, 
              height: 400, 
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* Data Sources Layer */}
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center'
              }}>
                {['Market Data', 'Financial Statements', 'Economic Indicators', 'News & Social Media'].map((source, i) => (
                  <Paper key={i} elevation={2} sx={{ 
                    p: 1.5, 
                    width: 160, 
                    textAlign: 'center',
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText'
                  }}>
                    <Typography variant="body2" fontWeight="bold">{source}</Typography>
                  </Paper>
                ))}
              </Box>
              
              {/* Connecting Lines from Data to Analysis Agents */}
              <Box sx={{ 
                position: 'absolute',
                top: 80,
                left: 0,
                right: 0,
                height: 40,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center'
              }}>
                {[...Array(8)].map((_, i) => (
                  <Box key={i} sx={{ 
                    height: 40, 
                    width: 1, 
                    bgcolor: 'grey.400',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: -3,
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '6px solid grey.800'
                    }
                  }} />
                ))}
              </Box>
              
              {/* Analysis Agents Layer */}
              <Box sx={{ 
                position: 'absolute',
                top: 120,
                left: 0,
                right: 0,
                height: 80,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center'
              }}>
                {['Fundamental Analysis', 'Technical Analysis', 'Valuation Analysis', 'Sentiment Analysis'].map((agent, i) => (
                  <Paper key={i} elevation={3} sx={{ 
                    p: 1.5, 
                    width: 180, 
                    textAlign: 'center',
                    bgcolor: 'secondary.light',
                    color: 'secondary.contrastText'
                  }}>
                    <Typography variant="body2" fontWeight="bold">{agent}</Typography>
                  </Paper>
                ))}
              </Box>
              
              {/* Connecting Lines from Analysis to Strategy Agents */}
              <Box sx={{ 
                position: 'absolute',
                top: 200,
                left: 0,
                right: 0,
                height: 40,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {[...Array(4)].map((_, i) => (
                  <Box key={i} sx={{ 
                    height: 40, 
                    width: 1, 
                    mx: 10,
                    bgcolor: 'grey.400',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: -3,
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '6px solid grey.800'
                    }
                  }} />
                ))}
              </Box>
              
              {/* Strategy Agents Layer */}
              <Box sx={{ 
                position: 'absolute',
                top: 240,
                left: 0,
                right: 0,
                height: 80,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center'
              }}>
                {['Warren Buffett', 'Ben Graham', 'Cathie Wood', 'Charlie Munger', 'Stanley Druckenmiller'].map((agent, i) => (
                  <Paper key={i} elevation={3} sx={{ 
                    p: 1.5, 
                    width: 140, 
                    textAlign: 'center',
                    bgcolor: 'success.light',
                    color: 'success.contrastText'
                  }}>
                    <Typography variant="body2" fontWeight="bold">{agent}</Typography>
                  </Paper>
                ))}
              </Box>
              
              {/* Connecting Lines from Strategy to Management Agents */}
              <Box sx={{ 
                position: 'absolute',
                top: 320,
                left: 0,
                right: 0,
                height: 40,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {[...Array(2)].map((_, i) => (
                  <Box key={i} sx={{ 
                    height: 40, 
                    width: 1, 
                    mx: 20,
                    bgcolor: 'grey.400',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: -3,
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '6px solid grey.800'
                    }
                  }} />
                ))}
              </Box>
              
              {/* Management Agents Layer */}
              <Box sx={{ 
                position: 'absolute',
                top: 360,
                left: 0,
                right: 0,
                height: 80,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10
              }}>
                {['Risk Management Agent', 'Portfolio Management Agent'].map((agent, i) => (
                  <Paper key={i} elevation={4} sx={{ 
                    p: 1.5, 
                    width: 200, 
                    textAlign: 'center',
                    bgcolor: 'error.light',
                    color: 'error.contrastText'
                  }}>
                    <Typography variant="body2" fontWeight="bold">{agent}</Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Decision Process Steps */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Step-by-Step Decision Process" titleTypographyProps={{ variant: 'subtitle1' }} />
        <CardContent>
          <Box component="ol" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Data Collection & Preprocessing</Typography>
              <Typography variant="body2" paragraph>
                The system collects and preprocesses data from multiple sources including market data feeds, financial statements, economic indicators, and news/social media content. Data is cleaned, normalized, and prepared for analysis.
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <Typography variant="caption" display="block">Example Raw Data:</Typography>
                <Box component="pre" sx={{ m: 0, overflow: 'auto' }}>
                  {`{
  "AAPL": {
    "price": 173.45,
    "volume": 67823500,
    "pe_ratio": 28.7,
    "market_cap": 2724000000000,
    "revenue_growth": 0.072,
    "profit_margin": 0.254,
    "sentiment_score": 0.68
  },
  "MSFT": {
    "price": 328.79,
    "volume": 22451200,
    "pe_ratio": 34.2,
    "market_cap": 2442000000000,
    "revenue_growth": 0.118,
    "profit_margin": 0.372,
    "sentiment_score": 0.72
  }
}`}
                </Box>
              </Box>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Analysis Agent Processing</Typography>
              <Typography variant="body2" paragraph>
                Four specialized analysis agents process the data to extract specific insights: Fundamental Analysis evaluates financial health, Technical Analysis identifies price patterns, Valuation Analysis determines fair value, and Sentiment Analysis gauges market perception.
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <Typography variant="caption" display="block">Example Analysis Output:</Typography>
                <Box component="pre" sx={{ m: 0, overflow: 'auto' }}>
                  {`// Fundamental Analysis Agent
{
  "AAPL": {
    "revenue_growth": { "value": 0.072, "signal": "neutral" },
    "profit_margin": { "value": 0.254, "signal": "bullish" },
    "debt_to_equity": { "value": 1.73, "signal": "neutral" },
    "overall_signal": "bullish",
    "confidence": 72
  }
}`}
                </Box>
              </Box>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Strategic Agent Evaluation</Typography>
              <Typography variant="body2" paragraph>
                Strategic investor agents (Warren Buffett, Ben Graham, etc.) apply their investment philosophies to the analyzed data, each generating signals based on their unique criteria and methodologies.
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <Typography variant="caption" display="block">Example Strategic Agent Output:</Typography>
                <Box component="pre" sx={{ m: 0, overflow: 'auto' }}>
                  {`// Warren Buffett Agent
{
  "AAPL": {
    "economic_moat": { "value": "strong", "signal": "bullish" },
    "management_quality": { "value": "excellent", "signal": "bullish" },
    "intrinsic_value": { "value": 195.23, "signal": "bullish" },
    "overall_signal": "bullish",
    "confidence": 85,
    "reasoning": "Strong brand moat, excellent capital allocation, trading below intrinsic value"
  }
}`}
                </Box>
              </Box>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Risk & Portfolio Management</Typography>
              <Typography variant="body2" paragraph>
                The Risk Management Agent evaluates position-specific and portfolio-wide risks, while the Portfolio Management Agent synthesizes all signals, optimizes position sizing, and generates final trading decisions.
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <Typography variant="caption" display="block">Example Final Decision Output:</Typography>
                <Box component="pre" sx={{ m: 0, overflow: 'auto' }}>
                  {`// Portfolio Management Agent
{
  "AAPL": {
    "action": "BUY",
    "quantity": 100,
    "confidence": 82,
    "reasoning": "Strong bullish consensus (4/5 agents), reasonable valuation, acceptable risk profile",
    "risk_assessment": "Low, 2.3% of portfolio",
    "expected_return": "12.5% annualized"
  }
}`}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Current Trading Decisions */}
      <Card variant="outlined">
        <CardHeader title="Current Trading Decisions" titleTypographyProps={{ variant: 'subtitle1' }} />
        <CardContent>
          {decisions && decisions.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ticker</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Agent Consensus</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {decisions.map((decision, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Typography fontWeight="bold">{decision.ticker}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={decision.action || 'UNKNOWN'} 
                          color={signalColor(decision.action)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{decision.quantity}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {typeof decision.confidence === 'number' ? `${decision.confidence}%` : decision.confidence}
                          </Typography>
                          {typeof decision.confidence === 'number' && (
                            <LinearProgress 
                              variant="determinate" 
                              value={decision.confidence} 
                              color={decision.confidence > 70 ? 'success' : decision.confidence > 40 ? 'warning' : 'error'}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{decision.price}</TableCell>
                      <TableCell>
                        {decision.consensus || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No trading decisions available in the current simulation data.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// Raw Log Tab Component
function RawLogTab({ raw }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Raw Simulation Output
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Below is the complete raw output from the simulation for reference and debugging purposes.
      </Typography>
      
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          p: 2, 
          maxHeight: 600, 
          overflow: 'auto', 
          fontFamily: 'monospace', 
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          bgcolor: '#f5f5f5'
        }}
      >
        {raw}
      </Paper>
    </Box>
  );
}

// Data Sources Tab Component
function DataSourcesTab({ agents, raw }) {
  // Data source information
  const dataSources = [
    {
      name: 'Market Data',
      description: 'Real-time and historical price, volume, and trading data for securities.',
      sources: [
        { name: 'Alpha Vantage API', description: 'Provides real-time and historical market data for stocks, forex, and cryptocurrencies.' },
        { name: 'Yahoo Finance API', description: 'Offers historical price data, financial news, and company information.' },
        { name: 'IEX Cloud', description: 'Delivers real-time market data, including prices, volumes, and order book information.' }
      ],
      dataPoints: [
        { name: 'Price', description: 'Current and historical trading prices', format: 'Numeric (USD)', frequency: 'Real-time/Daily' },
        { name: 'Volume', description: 'Number of shares traded', format: 'Integer', frequency: 'Real-time/Daily' },
        { name: 'OHLC', description: 'Open, High, Low, Close prices', format: 'Numeric Array', frequency: 'Daily/Hourly' },
        { name: 'Bid/Ask Spread', description: 'Difference between buy and sell prices', format: 'Numeric (USD)', frequency: 'Real-time' },
        { name: 'Market Depth', description: 'Order book data showing pending buy/sell orders', format: 'Nested Object', frequency: 'Real-time' }
      ],
      example: `{
  "AAPL": {
    "price": 173.45,
    "change": 2.18,
    "change_percent": 1.27,
    "volume": 67823500,
    "avg_volume": 58942300,
    "market_cap": 2724000000000,
    "52_week_high": 198.23,
    "52_week_low": 124.17
  }
}`
    },
    {
      name: 'Financial Statements',
      description: 'Quarterly and annual financial reports including income statements, balance sheets, and cash flow statements.',
      sources: [
        { name: 'SEC EDGAR Database', description: 'Official repository of financial filings from public companies.' },
        { name: 'Financial Modeling Prep API', description: 'Structured financial statement data for thousands of companies.' },
        { name: 'Intrinio', description: 'Provides standardized financial data and analytics.' }
      ],
      dataPoints: [
        { name: 'Revenue', description: 'Total sales generated', format: 'Numeric (USD)', frequency: 'Quarterly/Annual' },
        { name: 'Net Income', description: 'Profit after all expenses', format: 'Numeric (USD)', frequency: 'Quarterly/Annual' },
        { name: 'EPS', description: 'Earnings Per Share', format: 'Numeric (USD)', frequency: 'Quarterly/Annual' },
        { name: 'Assets', description: 'Everything a company owns', format: 'Numeric (USD)', frequency: 'Quarterly/Annual' },
        { name: 'Liabilities', description: 'Debts and obligations', format: 'Numeric (USD)', frequency: 'Quarterly/Annual' },
        { name: 'Cash Flow', description: 'Cash generated and used', format: 'Numeric (USD)', frequency: 'Quarterly/Annual' }
      ],
      example: `{
  "AAPL": {
    "income_statement": {
      "revenue": 394328000000,
      "gross_profit": 170782000000,
      "operating_income": 119437000000,
      "net_income": 99803000000,
      "eps": 6.15
    },
    "balance_sheet": {
      "total_assets": 352755000000,
      "total_liabilities": 287912000000,
      "total_equity": 64843000000
    }
  }
}`
    },
    {
      name: 'Economic Indicators',
      description: 'Macroeconomic data points that provide context for market conditions and economic health.',
      sources: [
        { name: 'Federal Reserve Economic Data (FRED)', description: 'Comprehensive database of economic indicators maintained by the St. Louis Fed.' },
        { name: 'Bureau of Economic Analysis', description: 'Official source for GDP and other economic measures.' },
        { name: 'Bureau of Labor Statistics', description: 'Employment, inflation, and productivity statistics.' }
      ],
      dataPoints: [
        { name: 'GDP Growth Rate', description: 'Percentage change in economic output', format: 'Percentage', frequency: 'Quarterly' },
        { name: 'Inflation Rate', description: 'Rate of price increases', format: 'Percentage', frequency: 'Monthly' },
        { name: 'Unemployment Rate', description: 'Percentage of workforce without jobs', format: 'Percentage', frequency: 'Monthly' },
        { name: 'Interest Rates', description: 'Federal funds rate and other key rates', format: 'Percentage', frequency: 'Daily/As Changed' },
        { name: 'Consumer Sentiment', description: 'Index of consumer confidence', format: 'Index Value', frequency: 'Monthly' }
      ],
      example: `{
  "economic_data": {
    "gdp_growth": 2.1,
    "inflation_rate": 3.7,
    "unemployment": 3.8,
    "fed_funds_rate": 5.25,
    "consumer_sentiment": 68.7,
    "housing_starts": 1283000
  }
}`
    },
    {
      name: 'News & Social Media',
      description: 'Financial news, social media sentiment, and analyst opinions that can impact market psychology.',
      sources: [
        { name: 'News API', description: 'Aggregates news articles from thousands of sources.' },
        { name: 'Twitter API', description: 'Social media posts and sentiment related to financial markets.' },
        { name: 'Reddit API', description: 'Discussion and sentiment from investment communities.' }
      ],
      dataPoints: [
        { name: 'News Headlines', description: 'Major news stories about companies or markets', format: 'Text', frequency: 'Real-time' },
        { name: 'Sentiment Score', description: 'Positive/negative sentiment analysis', format: 'Numeric (-1 to 1)', frequency: 'Real-time' },
        { name: 'Mention Volume', description: 'Number of mentions across platforms', format: 'Integer', frequency: 'Hourly/Daily' },
        { name: 'Analyst Ratings', description: 'Buy/Sell/Hold recommendations', format: 'Categorical', frequency: 'As Released' },
        { name: 'Price Targets', description: 'Analyst price predictions', format: 'Numeric (USD)', frequency: 'As Released' }
      ],
      example: `{
  "AAPL": {
    "news": [
      {
        "headline": "Apple Unveils New iPhone 15 with Revolutionary Features",
        "source": "TechCrunch",
        "sentiment": 0.78,
        "url": "https://techcrunch.com/2023/09/12/apple-iphone-15"
      }
    ],
    "social_sentiment": {
      "overall_score": 0.68,
      "tweet_volume": 12453,
      "reddit_mentions": 843,
      "sentiment_trend": "increasing"
    }
  }
}`
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Sources & Information Flow
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        The Capital Global AI system ingests and processes data from multiple sources to inform its investment decisions. Below is a detailed breakdown of these data sources and how they're used.
      </Typography>
      
      {/* Data Sources Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dataSources.map((source, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {source.name}
                </Typography>
                <Typography variant="body2" paragraph>
                  {source.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Key data points: {source.dataPoints.slice(0, 3).map(dp => dp.name).join(', ')}...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Detailed Data Source Information */}
      {dataSources.map((source, index) => (
        <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">{source.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Description */}
              <Grid item xs={12}>
                <Typography variant="body1" paragraph>
                  {source.description}
                </Typography>
              </Grid>
              
              {/* Sources */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Data Providers" titleTypographyProps={{ variant: 'subtitle1' }} />
                  <CardContent>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Provider</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {source.sources.map((provider, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">{provider.name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{provider.description}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Data Points */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Key Data Points" titleTypographyProps={{ variant: 'subtitle1' }} />
                  <CardContent>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data Point</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Format</TableCell>
                          <TableCell>Frequency</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {source.dataPoints.map((dataPoint, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">{dataPoint.name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{dataPoint.description}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{dataPoint.format}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{dataPoint.frequency}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Example Data */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader title="Example Data Format" titleTypographyProps={{ variant: 'subtitle1' }} />
                  <CardContent>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1, 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem',
                      overflow: 'auto'
                    }}>
                      <pre>{source.example}</pre>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
      
      {/* Data Processing Flow */}
      <Card variant="outlined" sx={{ mt: 4 }}>
        <CardHeader title="Data Processing Flow" titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Box component="ol" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Data Collection</Typography>
              <Typography variant="body2" paragraph>
                Raw data is collected from multiple sources through APIs, web scraping, and database connections. This includes market data, financial statements, economic indicators, and news/social media content.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Data Cleaning & Normalization</Typography>
              <Typography variant="body2" paragraph>
                Raw data is cleaned to handle missing values, outliers, and inconsistencies. Data is then normalized into standardized formats for consistent processing across different sources.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Feature Engineering</Typography>
              <Typography variant="body2" paragraph>
                Raw data is transformed into meaningful features that agents can use for analysis. This includes calculating financial ratios, technical indicators, sentiment scores, and other derived metrics.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Agent-Specific Processing</Typography>
              <Typography variant="body2" paragraph>
                Each agent receives the subset of data relevant to its analysis method. For example, the Warren Buffett Agent focuses on long-term fundamentals, while the Technical Analysis Agent processes price and volume patterns.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Signal Generation</Typography>
              <Typography variant="body2" paragraph>
                Agents process their relevant data through their specific methodologies to generate investment signals with confidence levels. These signals are then passed to the Portfolio Management Agent for final decision-making.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// Formulas & Models Tab Component
function FormulasModelsTab({ agents }) {
  // Formula categories
  const formulaCategories = [
    {
      name: 'Valuation Models',
      description: 'Formulas and models used to determine the intrinsic value of securities.',
      formulas: [
        {
          name: 'Discounted Cash Flow (DCF)',
          formula: `Value = Σ(CF_t / (1 + r)^t) + TV / (1 + r)^n

Where:
CF_t = Cash flow in period t
r = Discount rate
TV = Terminal value
n = Number of periods`,
          description: 'Calculates the present value of projected future cash flows.',
          example: `// Example DCF Calculation for AAPL
Projected Cash Flows: [25.4B, 27.8B, 30.1B, 32.5B, 35.2B]
Discount Rate: 9%
Terminal Growth Rate: 3%
Terminal Value: 35.2B × (1 + 3%) / (9% - 3%) = 607.6B

PV of Cash Flows: 113.5B
PV of Terminal Value: 394.2B
Enterprise Value: 507.7B
Net Debt: -80.3B (net cash)
Equity Value: 588.0B
Shares Outstanding: 16.5B
Intrinsic Value per Share: $35.64`,
          usedBy: ['Warren Buffett Agent', 'Valuation Analysis Agent']
        },
        {
          name: 'Price-to-Earnings (P/E) Ratio',
          formula: `P/E Ratio = Market Price per Share / Earnings per Share`,
          description: 'Measures the price investors are willing to pay for each dollar of earnings.',
          example: `// Example P/E Calculation for MSFT
Current Stock Price: $328.79
Trailing EPS: $9.61
P/E Ratio = $328.79 / $9.61 = 34.2x

Industry Average P/E: 28.5x
S&P 500 Average P/E: 22.3x
MSFT Premium to Industry: 20.0%`,
          usedBy: ['Ben Graham Agent', 'Valuation Analysis Agent', 'Fundamental Analysis Agent']
        },
        {
          name: 'Enterprise Value to EBITDA (EV/EBITDA)',
          formula: `EV/EBITDA = (Market Cap + Debt - Cash) / EBITDA`,
          description: 'Capital structure-neutral valuation multiple that accounts for debt levels.',
          example: `// Example EV/EBITDA Calculation for GOOGL
Market Cap: $1.72T
Total Debt: $14.7B
Cash & Equivalents: $118.3B
EBITDA (TTM): $96.5B

EV = $1.72T + $14.7B - $118.3B = $1.62T
EV/EBITDA = $1.62T / $96.5B = 16.8x`,
          usedBy: ['Charlie Munger Agent', 'Valuation Analysis Agent']
        },
        {
          name: 'Graham Number',
          formula: `Graham Number = √(22.5 × EPS × BVPS)

Where:
EPS = Earnings per Share
BVPS = Book Value per Share`,
          description: 'Benjamin Graham\'s formula for the maximum price to pay for a stock.',
          example: `// Example Graham Number Calculation for JPM
Earnings per Share: $14.32
Book Value per Share: $97.56

Graham Number = √(22.5 × $14.32 × $97.56) = $177.39
Current Price: $151.07
Margin of Safety: 14.8%`,
          usedBy: ['Ben Graham Agent']
        }
      ]
    },
    {
      name: 'Technical Indicators',
      description: 'Mathematical formulas used to analyze price and volume data for trading signals.',
      formulas: [
        {
          name: 'Relative Strength Index (RSI)',
          formula: `RSI = 100 - (100 / (1 + RS))

Where:
RS = Average Gain / Average Loss
over n periods (typically 14)`,
          description: 'Momentum oscillator that measures the speed and change of price movements on a scale of 0 to 100.',
          example: `// Example RSI Calculation for AAPL (14-day)
Average Gain: $1.87
Average Loss: $1.23
RS = $1.87 / $1.23 = 1.52
RSI = 100 - (100 / (1 + 1.52)) = 60.3

Interpretation:
- RSI > 70: Potentially overbought
- RSI < 30: Potentially oversold
- Current value (60.3): Neutral with bullish bias`,
          usedBy: ['Technical Analyst']
        },
        {
          name: 'Moving Average Convergence Divergence (MACD)',
          formula: `MACD Line = 12-period EMA - 26-period EMA
Signal Line = 9-period EMA of MACD Line
MACD Histogram = MACD Line - Signal Line`,
          description: 'Trend-following momentum indicator showing the relationship between two moving averages.',
          example: `// Example MACD Calculation for TSLA
12-day EMA: $248.73
26-day EMA: $242.18
MACD Line = $248.73 - $242.18 = $6.55

9-day EMA of MACD Line (Signal Line): $4.82
MACD Histogram = $6.55 - $4.82 = $1.73

Interpretation: MACD Line above Signal Line and rising histogram indicate bullish momentum`,
          usedBy: ['Technical Analyst']
        },
        {
          name: 'Bollinger Bands',
          formula: `Middle Band = 20-day SMA
Upper Band = Middle Band + (20-day SD × 2)
Lower Band = Middle Band - (20-day SD × 2)`,
          description: 'Volatility bands placed above and below a moving average, adapting to market conditions.',
          example: `// Example Bollinger Bands Calculation for AMZN
20-day SMA: $132.45
20-day Standard Deviation: $3.87

Upper Band = $132.45 + ($3.87 × 2) = $140.19
Lower Band = $132.45 - ($3.87 × 2) = $124.71
Current Price: $138.23

Interpretation: Price near upper band suggests potential resistance or overbought condition`,
          usedBy: ['Technical Analyst']
        }
      ]
    },
    {
      name: 'Risk Metrics',
      description: 'Formulas used to quantify and manage investment risk.',
      formulas: [
        {
          name: 'Value at Risk (VaR)',
          formula: `VaR = Portfolio Value × Z-score × Portfolio Volatility

Where:
Z-score for 95% confidence = 1.645
Z-score for 99% confidence = 2.326`,
          description: 'Statistical measure of the maximum potential loss over a specific time period at a given confidence level.',
          example: `// Example VaR Calculation for Portfolio
Portfolio Value: $10,000,000
Daily Volatility: 1.2%
Confidence Level: 95% (Z-score = 1.645)

1-Day VaR at 95% = $10,000,000 × 1.645 × 1.2% = $197,400

Interpretation: There is a 95% probability that the portfolio will not lose more than $197,400 in one day`,
          usedBy: ['Risk Management Agent']
        },
        {
          name: 'Sharpe Ratio',
          formula: `Sharpe Ratio = (Rp - Rf) / σp

Where:
Rp = Portfolio return
Rf = Risk-free rate
σp = Portfolio standard deviation`,
          description: 'Measures risk-adjusted return, showing excess return per unit of risk.',
          example: `// Example Sharpe Ratio Calculation
Portfolio Annual Return: 12.7%
Risk-free Rate: 4.5%
Portfolio Standard Deviation: 15.3%

Sharpe Ratio = (12.7% - 4.5%) / 15.3% = 0.54

Interpretation: Sharpe Ratio of 0.54 indicates moderate risk-adjusted performance`,
          usedBy: ['Portfolio Management Agent', 'Risk Management Agent']
        },
        {
          name: 'Beta',
          formula: `Beta = Covariance(Asset, Market) / Variance(Market)`,
          description: 'Measures an asset\'s volatility relative to the overall market.',
          example: `// Example Beta Calculation for NFLX
Covariance(NFLX, S&P 500): 0.0023
Variance(S&P 500): 0.0012

Beta = 0.0023 / 0.0012 = 1.92

Interpretation: Beta of 1.92 indicates NFLX is 92% more volatile than the market`,
          usedBy: ['Risk Management Agent', 'Portfolio Management Agent']
        }
      ]
    },
    {
      name: 'Portfolio Optimization',
      description: 'Mathematical models used to construct optimal portfolios based on risk and return objectives.',
      formulas: [
        {
          name: 'Modern Portfolio Theory (MPT)',
          formula: `Portfolio Return = Σ(wi × Ri)
Portfolio Variance = ΣΣ(wi × wj × σi × σj × ρij)

Where:
wi, wj = Weight of assets i and j
Ri = Expected return of asset i
σi, σj = Standard deviations
ρij = Correlation between assets i and j`,
          description: 'Framework for constructing portfolios to maximize expected return for a given level of risk.',
          example: `// Example Two-Asset Portfolio Calculation
Asset A: Expected Return = 8%, Standard Deviation = 15%
Asset B: Expected Return = 5%, Standard Deviation = 8%
Correlation between A and B = 0.3
Weight of Asset A = 60%
Weight of Asset B = 40%

Portfolio Return = (0.6 × 8%) + (0.4 × 5%) = 6.8%
Portfolio Variance = (0.6² × 0.15²) + (0.4² × 0.08²) + (2 × 0.6 × 0.4 × 0.15 × 0.08 × 0.3) = 0.0102
Portfolio Standard Deviation = √0.0102 = 10.1%`,
          usedBy: ['Portfolio Management Agent']
        },
        {
          name: 'Kelly Criterion',
          formula: `f* = (p × b - q) / b

Where:
f* = Optimal fraction of capital to invest
p = Probability of winning
q = Probability of losing (1-p)
b = Ratio of amount won to amount lost`,
          description: 'Formula for determining optimal position sizing to maximize long-term growth rate.',
          example: `// Example Kelly Criterion Calculation
Probability of Winning: 55%
Probability of Losing: 45%
Payoff Ratio: 1:1 (b = 1)

f* = (0.55 × 1 - 0.45) / 1 = 0.10

Interpretation: Optimal position size is 10% of capital`,
          usedBy: ['Portfolio Management Agent', 'Risk Management Agent']
        }
      ]
    },
    {
      name: 'Sentiment Analysis',
      description: 'Algorithms and formulas used to quantify market sentiment from textual and social media data.',
      formulas: [
        {
          name: 'Sentiment Score',
          formula: `Sentiment Score = (P - N) / (P + N)

Where:
P = Number of positive references
N = Number of negative references`,
          description: 'Measures the overall sentiment polarity from -1 (extremely negative) to +1 (extremely positive).',
          example: `// Example Sentiment Analysis for TSLA
Positive References: 843
Negative References: 412
Neutral References: 375

Sentiment Score = (843 - 412) / (843 + 412) = 0.34

Interpretation: Moderately positive sentiment`,
          usedBy: ['Sentiment Analysis Agent']
        },
        {
          name: 'News Impact Score',
          formula: `Impact Score = Sentiment Score × Source Credibility × Recency Factor`,
          description: 'Weighted sentiment measure that accounts for source reliability and timing of news.',
          example: `// Example News Impact Calculation
Sentiment Score: 0.72 (positive)
Source Credibility: 0.85 (high)
Recency Factor: 0.95 (very recent)

Impact Score = 0.72 × 0.85 × 0.95 = 0.58

Interpretation: Significant positive impact on sentiment`,
          usedBy: ['Sentiment Analysis Agent']
        }
      ]
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Formulas & Models
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This section details the key formulas, mathematical models, and algorithms used by the Capital Global AI system to analyze data and make investment decisions.
      </Typography>
      
      {/* Formula Categories */}
      {formulaCategories.map((category, index) => (
        <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">{category.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              {category.description}
            </Typography>
            
            {/* Formulas */}
            {category.formulas.map((formula, i) => (
              <Card key={i} variant="outlined" sx={{ mb: 3 }}>
                <CardHeader 
                  title={formula.name}
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  action={
                    <Tooltip title="Used by agents">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {formula.usedBy.map((agent, j) => (
                          <Chip 
                            key={j} 
                            label={agent.split(' ')[0]} 
                            size="small" 
                            color={agent.includes('Risk') ? 'error' : 
                                   agent.includes('Portfolio') ? 'warning' : 
                                   agent.includes('Technical') ? 'info' : 
                                   agent.includes('Valuation') ? 'success' : 'primary'} 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Tooltip>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Formula */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Formula:</Typography>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: '#f8f9fa', 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {formula.formula}
                      </Box>
                    </Grid>
                    
                    {/* Description */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Description:</Typography>
                      <Typography variant="body2">{formula.description}</Typography>
                    </Grid>
                    
                    {/* Example */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Example Calculation:</Typography>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: '#f5f5f5', 
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {formula.example}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
      
      {/* Model Integration */}
      <Card variant="outlined" sx={{ mt: 4 }}>
        <CardHeader title="Model Integration & Decision Process" titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Typography variant="body2" paragraph>
            The Capital Global AI system integrates these formulas and models through a multi-layered decision process:
          </Typography>
          
          <Box component="ol" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Data Processing & Feature Extraction</Typography>
              <Typography variant="body2" paragraph>
                Raw market data is processed to calculate key metrics and indicators using the formulas above. This creates a rich feature set for each security.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Agent-Specific Analysis</Typography>
              <Typography variant="body2" paragraph>
                Each agent applies its specialized formulas and models to the processed data. For example, the Warren Buffett Agent focuses on DCF and moat analysis, while the Technical Analyst applies momentum indicators.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Signal Aggregation</Typography>
              <Typography variant="body2" paragraph>
                The Portfolio Management Agent aggregates signals from all agents using a weighted formula that accounts for each agent's historical accuracy and confidence level.
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                mb: 2
              }}>
                <pre>{`Aggregate Signal = Σ(Agent_Signal × Agent_Weight × Confidence)

Where:
Agent_Weight = Historical Accuracy × Market_Condition_Relevance`}</pre>
              </Box>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Risk Assessment</Typography>
              <Typography variant="body2" paragraph>
                The Risk Management Agent applies VaR, Beta, and correlation models to evaluate the risk profile of potential trades and the overall portfolio.
              </Typography>
            </Box>
            
            <Box component="li" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Position Sizing & Execution</Typography>
              <Typography variant="body2" paragraph>
                Final position sizes are determined using Kelly Criterion and MPT principles, adjusted for risk limits and portfolio constraints.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default EnhancedRawOutput;
