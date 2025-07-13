import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Chip,
  Paper,
  Divider,
  TextField,
  Slider,
  Autocomplete,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  PanTool,
  Refresh,
  FileDownload,
  Timeline,
  ShowChart,
  BarChart,
  PieChart,
  Settings,
  Fullscreen,
  TrendingUp,
  TrendingDown,
  Remove,
  Analytics,
  FilterList,
  Search,
  Clear,
  Save,
  ExpandMore,
  FilterAlt
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { useCustomTheme } from '../theme/ThemeProvider';

const InteractiveCharts = ({ 
  analysisResults, 
  selectedStocks, 
  isAnalyzing
}) => {
  const { isDarkMode, financialColors, theme } = useCustomTheme();
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('1M');
  const [selectedMetric, setSelectedMetric] = useState('confidence');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [panMode, setPanMode] = useState(false);

  // Advanced Filtering State
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [agentTypeFilter, setAgentTypeFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [confidenceRange, setConfidenceRange] = useState([0, 100]);
  const [stockSearch, setStockSearch] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [showActiveFilters, setShowActiveFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterPresetName, setFilterPresetName] = useState('');

  // Agent type categories for filtering
  const agentTypes = [
    { value: 'all', label: 'All Agents', count: 0 },
    { value: 'fundamental', label: 'Fundamental', count: 0 },
    { value: 'technical', label: 'Technical', count: 0 },
    { value: 'sentiment', label: 'Sentiment', count: 0 },
    { value: 'valuation', label: 'Valuation', count: 0 },
    { value: 'risk', label: 'Risk Management', count: 0 },
    { value: 'portfolio', label: 'Portfolio', count: 0 },
    { value: 'personalities', label: 'Investment Personalities', count: 0 }
  ];

  // Signal filter options
  const signalOptions = [
    { value: 'all', label: 'All Signals', color: theme.palette.text.primary },
    { value: 'bullish', label: 'Bullish Only', color: financialColors.bullish.primary },
    { value: 'bearish', label: 'Bearish Only', color: financialColors.bearish.primary },
    { value: 'neutral', label: 'Neutral Only', color: financialColors.neutral.primary }
  ];

  // Enhanced chart color palette using financial colors
  const chartColors = useMemo(() => ({
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    bullish: financialColors.bullish.primary,
    bearish: financialColors.bearish.primary,
    neutral: financialColors.neutral.primary,
    excellent: financialColors.performance.excellent,
    good: financialColors.performance.good,
    average: financialColors.performance.average,
    poor: financialColors.performance.poor,
    loss: financialColors.performance.loss,
    riskLow: financialColors.risk.low,
    riskMedium: financialColors.risk.medium,
    riskHigh: financialColors.risk.high,
    riskCritical: financialColors.risk.critical,
    background: theme.palette.background.paper,
    text: theme.palette.text.primary,
    grid: theme.palette.chart.grid,
    axis: theme.palette.chart.axis
  }), [theme, financialColors]);

  // Generate real data from analysis results
  const processRealData = (analysisResults) => {
    if (!analysisResults || !analysisResults.agents) {
      return [];
    }

    console.log('🔍 processRealData - Processing analysisResults.agents:', analysisResults.agents);

    // Convert agent analysis results to chart data
    const agents = Object.keys(analysisResults.agents);
    const data = [];

    // Create data points from actual agent results
    agents.forEach((agentName, index) => {
      const agentData = analysisResults.agents[agentName];
      console.log(`🔍 processRealData - Processing agent: ${agentName}, agentData:`, agentData);
      
      if (agentData) {
        let confidence = 0;
        let signal = 'neutral';
        let reasoning = 'No reasoning provided';
        
        // Handle multi-stock nested structure
        if (typeof agentData === 'object' && agentData !== null) {
          // Check if this is multi-stock data (nested object with stock tickers)
          const keys = Object.keys(agentData);
          const hasStockTickers = keys.some(key => 
            typeof agentData[key] === 'object' && 
            agentData[key] !== null && 
            (agentData[key].confidence !== undefined || agentData[key].signal !== undefined)
          );
          
          if (hasStockTickers) {
            // Multi-stock data: aggregate values
            const stockData = Object.values(data || {});
            if (stockData.length > 0 && Array.isArray(stockData)) {
              // Calculate average confidence
              const validConfidences = stockData.filter(stock => stock && stock.confidence !== undefined);
              confidence = validConfidences.length > 0 
                ? Math.round(validConfidences.reduce((sum, stock) => sum + stock.confidence, 0) / validConfidences.length)
                : 0;
              
              // Use most frequent signal or first available
              const signals = stockData.filter(stock => stock && stock.signal).map(stock => stock.signal).filter(Boolean);
              signal = signals[0] || 'neutral';
              
              // Combine reasoning from all stocks
              const reasonings = stockData.filter(stock => stock && stock.reasoning).map(stock => {
                if (typeof stock.reasoning === 'object') {
                  return JSON.stringify(stock.reasoning);
                }
                return stock.reasoning;
              }).filter(Boolean);
              reasoning = reasonings.join(' | ') || 'No reasoning provided';
            }
          } else {
            // Single-stock data: use directly
            confidence = agentData.confidence || 0;
            signal = agentData.signal || 'neutral';
            reasoning = typeof agentData.reasoning === 'object' 
              ? JSON.stringify(agentData.reasoning) 
              : agentData.reasoning || 'No reasoning provided';
          }
        }
        
        console.log(`✅ processRealData - Agent ${agentName}: confidence=${confidence}, signal=${signal}`);
        
        data.push({
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now() - (index * 1000 * 60), // Stagger timestamps
          agent: agentName.replace('_agent', '').replace('_', ' '),
          confidence,
          signal,
          reasoning,
          consensus: analysisResults.consensus_confidence || 0,
          action: analysisResults.decision?.action || 'HOLD',
          price: analysisResults.decision?.current_price || 0,
          volume: Math.abs(analysisResults.decision?.quantity || 0)
        });
      }
    });

    console.log('✅ processRealData - Final chart data:', data);
    return data;
  };

  const chartData = useMemo(() => {
    if (analysisResults && analysisResults.agents) {
      return processRealData(analysisResults);
    }
    return []; // Return empty array instead of mock data
  }, [analysisResults, timeRange]);

  // Agent performance data from real analysis results
  const agentPerformanceData = useMemo(() => {
    console.log('🔍 InteractiveCharts - analysisResults received:', analysisResults);
    console.log('🔍 InteractiveCharts - analysisResults.agents:', analysisResults?.agents);
    
    // Comprehensive null checks for analysisResults and its properties
    if (!analysisResults || typeof analysisResults !== 'object') {
      console.log('❌ InteractiveCharts - No analysisResults object, returning empty array');
      return [];
    }
    
    if (!analysisResults.agents || typeof analysisResults.agents !== 'object') {
      console.log('❌ InteractiveCharts - No agents data, returning empty array');
      return [];
    }
    
    // Additional check to ensure agents is not an empty object
    const agentEntries = Object.entries(analysisResults.agents);
    if (agentEntries.length === 0) {
      console.log('❌ InteractiveCharts - Empty agents object, returning empty array');
      return [];
    }
    
    console.log('🔍 InteractiveCharts - Processing agents data...');
    const processedData = agentEntries.map(([name, data]) => {
      console.log(`🔍 InteractiveCharts - Processing agent ${name}:`, data);
      
      // Handle multi-stock data structure: {AAPL: {confidence, signal, reasoning}, MSFT: {...}}
      let agentSummary = { confidence: 0, signal: 'neutral', reasoning: '' };
      
      if (data.confidence !== undefined) {
        // Single stock format: direct data
        agentSummary = {
          confidence: data.confidence || 0,
          signal: data.signal || 'neutral',
          reasoning: data.reasoning || ''
        };
      } else {
        // Multi-stock format: aggregate across stocks
        const stockData = Object.values(data || {});
        if (stockData.length > 0 && Array.isArray(stockData)) {
          // Calculate average confidence
          const validConfidences = stockData.filter(stock => stock && stock.confidence !== undefined);
          agentSummary.confidence = validConfidences.length > 0 
            ? Math.round(validConfidences.reduce((sum, stock) => sum + stock.confidence, 0) / validConfidences.length)
            : 0;
          
          // Use most frequent signal or first available
          const signals = stockData.filter(stock => stock && stock.signal).map(stock => stock.signal).filter(Boolean);
          agentSummary.signal = signals[0] || 'neutral';
          
          // Combine reasoning from all stocks
          const reasonings = stockData.filter(stock => stock && stock.reasoning).map(stock => {
            if (typeof stock.reasoning === 'object') {
              return JSON.stringify(stock.reasoning);
            }
            return stock.reasoning;
          }).filter(Boolean);
          agentSummary.reasoning = reasonings.join(' | ');
        }
      }
      
      console.log(`📊 InteractiveCharts - Agent ${name} summary:`, agentSummary);
      
      return {
        name: name.replace('_agent', '').replace('_', ' '),
        confidence: agentSummary.confidence,
        signal: agentSummary.signal,
        reasoning_length: (agentSummary.reasoning || '').length || 0
      };
    });
    
    console.log('✅ InteractiveCharts - Final agentPerformanceData:', processedData);
    return processedData;
  }, [analysisResults]);

  // Calculate summary metrics from processed agent data
  const metrics = useMemo(() => {
    console.log('🔍 InteractiveCharts - Calculating metrics from agentPerformanceData:', agentPerformanceData);
    
    if (!agentPerformanceData.length) {
      console.log('❌ InteractiveCharts - No agent performance data, returning default metrics');
      return {
        avgConfidence: 0,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        consensusStrength: 'Very Weak'
      };
    }
    
    // Calculate average confidence
    const validConfidences = agentPerformanceData.filter(agent => agent.confidence > 0);
    const avgConfidence = validConfidences.length > 0 
      ? Math.round(validConfidences.reduce((sum, agent) => sum + agent.confidence, 0) / validConfidences.length)
      : 0;
    
    // Count signal types
    const bullishCount = agentPerformanceData.filter(agent => agent.signal === 'bullish').length;
    const bearishCount = agentPerformanceData.filter(agent => agent.signal === 'bearish').length;
    const neutralCount = agentPerformanceData.filter(agent => agent.signal === 'neutral').length;
    
    // Determine consensus strength
    const totalAgents = agentPerformanceData.length;
    const maxSignalCount = Math.max(bullishCount, bearishCount, neutralCount);
    const consensusPercentage = totalAgents > 0 ? (maxSignalCount / totalAgents) * 100 : 0;
    
    let consensusStrength = 'Very Weak';
    if (consensusPercentage >= 80) consensusStrength = 'Very Strong';
    else if (consensusPercentage >= 60) consensusStrength = 'Strong';
    else if (consensusPercentage >= 40) consensusStrength = 'Moderate';
    else if (consensusPercentage >= 25) consensusStrength = 'Weak';
    
    const calculatedMetrics = {
      avgConfidence,
      bullishCount,
      bearishCount,
      neutralCount,
      consensusStrength
    };
    
    console.log('✅ InteractiveCharts - Calculated metrics:', calculatedMetrics);
    return calculatedMetrics;
  }, [agentPerformanceData]);

  // Helper function to categorize agents by type
  const categorizeAgent = (agentName) => {
    const name = agentName.toLowerCase();
    if (name.includes('fundamental') || name.includes('analysis')) return 'fundamental';
    if (name.includes('technical') || name.includes('technicals')) return 'technical';
    if (name.includes('sentiment')) return 'sentiment';
    if (name.includes('valuation')) return 'valuation';
    if (name.includes('risk')) return 'risk';
    if (name.includes('portfolio')) return 'portfolio';
    if (name.includes('warren') || name.includes('buffett') || name.includes('munger') || 
        name.includes('graham') || name.includes('wood') || name.includes('ackman') || 
        name.includes('fisher') || name.includes('druckenmiller')) return 'personalities';
    return 'fundamental'; // default category
  };

  // Apply all filters to agent performance data
  const filteredAgentData = useMemo(() => {
    console.log('🔍 Applying filters to agentPerformanceData:', agentPerformanceData);
    
    let filtered = [...agentPerformanceData];

    // Agent type filter
    if (agentTypeFilter !== 'all') {
      filtered = filtered.filter(agent => categorizeAgent(agent.name) === agentTypeFilter);
    }

    // Signal filter
    if (signalFilter !== 'all') {
      filtered = filtered.filter(agent => agent.signal === signalFilter);
    }

    // Confidence range filter
    filtered = filtered.filter(agent => 
      agent.confidence >= confidenceRange[0] && 
      agent.confidence <= confidenceRange[1]
    );

    // Agent name search
    if (selectedAgents.length > 0) {
      filtered = filtered.filter(agent => 
        selectedAgents.some(selected => selected.name === agent.name)
      );
    }

    console.log('✅ Filtered agent data:', filtered);
    return filtered;
  }, [agentPerformanceData, agentTypeFilter, signalFilter, confidenceRange, selectedAgents]);

  // Apply filters to chart data as well
  const filteredChartData = useMemo(() => {
    console.log('🔍 Applying filters to chartData:', chartData);
    
    let filtered = [...chartData];

    // Agent type filter
    if (agentTypeFilter !== 'all') {
      filtered = filtered.filter(data => categorizeAgent(data.agent) === agentTypeFilter);
    }

    // Signal filter
    if (signalFilter !== 'all') {
      filtered = filtered.filter(data => data.signal === signalFilter);
    }

    // Confidence range filter
    filtered = filtered.filter(data => 
      data.confidence >= confidenceRange[0] && 
      data.confidence <= confidenceRange[1]
    );

    // Agent name search
    if (selectedAgents.length > 0) {
      filtered = filtered.filter(data => 
        selectedAgents.some(selected => selected.name === data.agent)
      );
    }

    console.log('✅ Filtered chart data:', filtered);
    return filtered;
  }, [chartData, agentTypeFilter, signalFilter, confidenceRange, selectedAgents]);

  // Update agent type counts
  const agentTypesWithCounts = useMemo(() => {
    // Add null checks for agentTypes and agentPerformanceData
    if (!Array.isArray(agentTypes) || !Array.isArray(agentPerformanceData)) {
      console.log('❌ agentTypes or agentPerformanceData not available, returning empty array');
      return [];
    }
    
    const counts = (agentTypes || []).map(type => ({
      ...type,
      count: type.value === 'all' 
        ? agentPerformanceData.length 
        : agentPerformanceData.filter(agent => categorizeAgent(agent.name) === type.value).length
    }));
    console.log('📊 Agent type counts:', counts);
    return counts;
  }, [agentPerformanceData]);

  // Get unique agent names for autocomplete
  const agentNameOptions = useMemo(() => {
    // Add null check for agentPerformanceData
    if (!Array.isArray(agentPerformanceData)) {
      console.log('❌ agentPerformanceData not available for autocomplete, returning empty array');
      return [];
    }
    
    return agentPerformanceData.map(agent => ({ name: agent.name, confidence: agent.confidence }));
  }, [agentPerformanceData]);

  // Filter management functions
  const clearAllFilters = () => {
    setAgentTypeFilter('all');
    setSignalFilter('all');
    setConfidenceRange([0, 100]);
    setStockSearch('');
    setSelectedAgents([]);
    console.log('🧹 All filters cleared');
  };

  const hasActiveFilters = () => {
    return agentTypeFilter !== 'all' || 
           signalFilter !== 'all' || 
           confidenceRange[0] !== 0 || 
           confidenceRange[1] !== 100 || 
           selectedAgents.length > 0 || 
           stockSearch !== '';
  };

  const saveCurrentFilter = () => {
    if (!filterPresetName.trim()) return;
    
    const newFilter = {
      id: Date.now(),
      name: filterPresetName,
      agentType: agentTypeFilter,
      signal: signalFilter,
      confidenceRange: [...confidenceRange],
      selectedAgents: [...selectedAgents],
      stockSearch
    };
    
    setSavedFilters(prev => [...prev, newFilter]);
    setFilterPresetName('');
    console.log('💾 Filter preset saved:', newFilter);
  };

  const loadFilterPreset = (preset) => {
    setAgentTypeFilter(preset.agentType);
    setSignalFilter(preset.signal);
    setConfidenceRange(preset.confidenceRange);
    setSelectedAgents(preset.selectedAgents);
    setStockSearch(preset.stockSearch);
    console.log('📂 Filter preset loaded:', preset);
  };

  // Time range options
  const timeRanges = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' },
    { value: 'ALL', label: 'All Time' }
  ];

  // Chart type options
  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: <ShowChart /> },
    { value: 'area', label: 'Area Chart', icon: <Timeline /> },
    { value: 'bar', label: 'Bar Chart', icon: <BarChart /> },
    { value: 'composed', label: 'Combined', icon: <Settings /> }
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: entry.color,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                {entry.dataKey}: {entry.value}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Export chart function with real implementation
  const exportToCSV = () => {
    // Create CSV data
    const csvData = filteredChartData.map(row => ({
      Date: row.date,
      Consensus: row.consensus,
      Price: row.price,
      Volume: row.volume,
      ...Object.fromEntries(
        Object.entries(row).filter(([key]) => 
          !['date', 'timestamp', 'consensus', 'price', 'volume'].includes(key) &&
          !key.includes('_signal')
        )
      )
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(field => row[field]).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trading_data_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Zoom handlers with improved functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const newLevel = Math.min(prev * 1.5, 10);
      console.log(`Zooming in to ${Math.round(newLevel * 100)}%`);
      return newLevel;
    });
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newLevel = Math.max(prev / 1.5, 0.1);
      console.log(`Zooming out to ${Math.round(newLevel * 100)}%`);
      return newLevel;
    });
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
    console.log('Reset zoom to 100%');
  };

  // Enhanced data filtering based on zoom level
  const getFilteredData = () => {
    if (!filteredChartData.length) {
      // Return sample data for chart structure when no real data
      return [
        { agent: 'Sample Agent', confidence: 0, signal: 'neutral', date: new Date().toISOString().split('T')[0] }
      ];
    }
    
    let filteredData = [...filteredChartData];
    
    // Apply time range filter
    const now = Date.now();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    if (timeRange !== 'all' && timeRangeMs[timeRange]) {
      const cutoff = now - timeRangeMs[timeRange];
      filteredData = filteredData.filter(item => 
        new Date(item.timestamp || item.date).getTime() > cutoff
      );
    }
    
    return filteredData;
  };

  // Check if we have real data
  const hasRealData = filteredChartData.length > 0;
  
  // Debug logging for chart issues
  console.log('InteractiveCharts Debug:', {
    analysisResults,
    chartDataLength: chartData.length,
    hasRealData,
    selectedStocks,
    isAnalyzing
  });

  // Render empty state when no data is available
  const renderEmptyState = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '300px',
        color: theme.palette.text.secondary
      }}
    >
      <Analytics sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        No Analysis Data Available
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 300 }}>
        Run an analysis simulation to see interactive charts with real agent data, 
        confidence levels, and trading decisions.
      </Typography>
    </Box>
  );

  const renderMainChart = () => {
    const data = getFilteredData();
    
    console.log('renderMainChart called:', { 
      hasRealData, 
      dataLength: data.length, 
      chartType,
      data: data.slice(0, 3) // Log first 3 items for debugging
    });

    const ChartComponent = ({ children }) => (
      <ResponsiveContainer width="100%" height={400}>
        {children}
      </ResponsiveContainer>
    );

    // Always render charts, even with empty/sample data
    switch (chartType) {
      case 'line':
        return (
          <ChartComponent>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="agent" 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                domain={[0, 100]}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke={chartColors.primary} 
                strokeWidth={2}
                dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2 }}
              />
              {!hasRealData && (
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill={chartColors.text}
                  fontSize="14"
                >
                  No data available - Run agent analysis to see real data
                </text>
              )}
            </LineChart>
          </ChartComponent>
        );

      case 'area':
        return (
          <ChartComponent>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="agent" 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                domain={[0, 100]}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke={chartColors.primary} 
                fill={chartColors.primary}
                fillOpacity={0.3}
              />
              {!hasRealData && (
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill={chartColors.text}
                  fontSize="14"
                >
                  No data available - Run agent analysis to see real data
                </text>
              )}
            </AreaChart>
          </ChartComponent>
        );

      case 'bar':
        return (
          <ChartComponent>
            <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="agent" 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                domain={[0, 100]}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="confidence" 
                fill={chartColors.primary}
                radius={[4, 4, 0, 0]}
              />
              {!hasRealData && (
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill={chartColors.text}
                  fontSize="14"
                >
                  No data available - Run agent analysis to see real data
                </text>
              )}
            </RechartsBarChart>
          </ChartComponent>
        );

      case 'composed':
        return (
          <ChartComponent>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="agent" 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                domain={[0, 100]}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                fill={chartColors.primary}
                fillOpacity={0.3}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke={chartColors.primary}
                strokeWidth={2}
              />
              {!hasRealData && (
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill={chartColors.text}
                  fontSize="14"
                >
                  No data available - Run agent analysis to see real data
                </text>
              )}
            </ComposedChart>
          </ChartComponent>
        );

      default:
        return (
          <ChartComponent>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="agent" 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
              />
              <YAxis 
                stroke={chartColors.axis}
                tick={{ fill: chartColors.text, fontSize: 12 }}
                domain={[0, 100]}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke={chartColors.primary} 
                strokeWidth={2}
              />
              {!hasRealData && (
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill={chartColors.text}
                  fontSize="14"
                >
                  No data available - Run agent analysis to see real data
                </text>
              )}
            </LineChart>
          </ChartComponent>
        );
    }
  };

  // Render agent performance pie chart
  const renderAgentPerformancePie = () => {
    if (!agentPerformanceData.length) {
      return renderEmptyState();
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <pie
            data={agentPerformanceData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="confidence"
            label={({ name, confidence }) => `${name}: ${confidence}%`}
          >
            {(agentPerformanceData || []).map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.signal === 'bullish' ? chartColors.bullish :
                  entry.signal === 'bearish' ? chartColors.bearish :
                  chartColors.neutral
                } 
              />
            ))}
          </pie>
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      color: theme.palette.text.primary
    }}>
      <Typography variant="h4" sx={{ 
        color: theme.palette.text.primary, 
        mb: 3, 
        fontWeight: 600 
      }}>
        Interactive Analytics Dashboard
      </Typography>

      {/* Chart Controls */}
      <Card sx={{ 
        mb: 3, 
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            {/* Chart Type Selector */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: theme.palette.text.secondary }}>Chart Type</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                label="Chart Type"
                sx={{
                  color: theme.palette.text.primary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                {(chartTypes || []).map((type) => (
                  <MenuItem 
                    key={type.value} 
                    value={type.value}
                    sx={{ 
                      color: theme.palette.text.primary,
                      '&:hover': { backgroundColor: theme.palette.action.hover }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Time Range Selector */}
            <ButtonGroup variant="outlined" size="small">
              {(timeRanges || []).map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange(range.value)}
                  sx={{
                    color: timeRange === range.value 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.primary,
                    borderColor: theme.palette.divider,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </ButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ borderColor: theme.palette.divider }} />

            {/* Zoom Controls */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Zoom In">
                <IconButton 
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))}
                  sx={{ 
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton 
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
                  sx={{ 
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset View">
                <IconButton 
                  onClick={() => {
                    setZoomLevel(1);
                    setPanMode(false);
                  }}
                  sx={{ 
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: theme.palette.divider }} />

            {/* Export Button */}
            <Button
              startIcon={<FileDownload />}
              onClick={exportToCSV}
              variant="outlined"
              size="small"
              sx={{
                color: theme.palette.text.primary,
                borderColor: theme.palette.divider,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              Export CSV
            </Button>
          </Box>

          {/* Selected Stocks Display */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mr: 1 }}>
              Selected Stocks:
            </Typography>
            {(selectedStocks || []).map((stock) => (
              <Chip 
                key={stock}
                label={stock}
                size="small"
                sx={{
                  backgroundColor: theme.palette.action.selected,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Advanced Filtering Panel */}
      <Card sx={{ 
        mb: 3, 
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary
      }}>
        <Accordion 
          expanded={filterExpanded} 
          onChange={(event, isExpanded) => setFilterExpanded(isExpanded)}
          sx={{
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: theme.palette.text.primary }} />}
            sx={{
              backgroundColor: 'transparent',
              color: theme.palette.text.primary,
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 2
              }
            }}
          >
            <FilterList sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              Advanced Filtering
            </Typography>
            {hasActiveFilters() && (
              <Chip 
                label={`${filteredAgentData.length} of ${agentPerformanceData.length} agents`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </AccordionSummary>
          
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={3}>
              
              {/* Agent Type Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: theme.palette.text.secondary }}>Agent Type</InputLabel>
                  <Select
                    value={agentTypeFilter}
                    onChange={(e) => setAgentTypeFilter(e.target.value)}
                    label="Agent Type"
                    sx={{
                      color: theme.palette.text.primary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    {(agentTypesWithCounts || []).map((type) => (
                      <MenuItem 
                        key={type.value} 
                        value={type.value}
                        sx={{ 
                          color: theme.palette.text.primary,
                          '&:hover': { backgroundColor: theme.palette.action.hover }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{type.label}</span>
                          <Chip label={type.count} size="small" variant="outlined" />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Signal Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Signal Type
                </Typography>
                <ButtonGroup variant="outlined" size="small" fullWidth>
                  {(signalOptions || []).map((option) => (
                    <Button
                      key={option.value}
                      variant={signalFilter === option.value ? 'contained' : 'outlined'}
                      onClick={() => setSignalFilter(option.value)}
                      sx={{
                        color: signalFilter === option.value 
                          ? theme.palette.primary.contrastText 
                          : option.color,
                        borderColor: option.color,
                        backgroundColor: signalFilter === option.value 
                          ? option.color 
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: signalFilter === option.value 
                            ? option.color 
                            : theme.palette.action.hover,
                          borderColor: option.color
                        },
                        fontSize: '0.75rem'
                      }}
                    >
                      {option.label.replace(' Only', '').replace('All ', '')}
                    </Button>
                  ))}
                </ButtonGroup>
              </Grid>

              {/* Confidence Range Slider */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                  Confidence Range: {confidenceRange[0]}% - {confidenceRange[1]}%
                </Typography>
                <Slider
                  value={confidenceRange}
                  onChange={(event, newValue) => setConfidenceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  step={5}
                  valueLabelFormat={(value) => `${value}%`}
                  sx={{
                    color: theme.palette.primary.main,
                    '& .MuiSlider-thumb': {
                      backgroundColor: theme.palette.primary.main,
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: theme.palette.primary.main,
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: theme.palette.divider,
                    }
                  }}
                />
              </Grid>

              {/* Agent Search/Selection */}
              <Grid item xs={12} sm={6} md={2}>
                <Autocomplete
                  multiple
                  options={agentNameOptions}
                  getOptionLabel={(option) => option.name}
                  value={selectedAgents}
                  onChange={(event, newValue) => setSelectedAgents(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Agents"
                      size="small"
                      sx={{
                        '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                        '& .MuiOutlinedInput-root': {
                          color: theme.palette.text.primary,
                          '& fieldset': { borderColor: theme.palette.divider },
                          '&:hover fieldset': { borderColor: theme.palette.primary.main },
                          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                        }
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    (value || []).map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.name}
                        size="small"
                        {...getTagProps({ index })}
                        key={option.name}
                        sx={{
                          color: theme.palette.text.primary,
                          borderColor: theme.palette.divider
                        }}
                      />
                    ))
                  }
                  size="small"
                />
              </Grid>

              {/* Filter Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  
                  {/* Clear Filters */}
                  {hasActiveFilters() && (
                    <Button
                      startIcon={<Clear />}
                      onClick={clearAllFilters}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: theme.palette.text.primary,
                        borderColor: theme.palette.divider,
                        '&:hover': {
                          borderColor: theme.palette.error.main,
                          color: theme.palette.error.main
                        }
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}

                  {/* Save Filter Preset */}
                  {hasActiveFilters() && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        label="Preset Name"
                        value={filterPresetName}
                        onChange={(e) => setFilterPresetName(e.target.value)}
                        size="small"
                        sx={{
                          width: 150,
                          '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                          '& .MuiOutlinedInput-root': {
                            color: theme.palette.text.primary,
                            '& fieldset': { borderColor: theme.palette.divider },
                            '&:hover fieldset': { borderColor: theme.palette.primary.main },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                          }
                        }}
                      />
                      <Button
                        startIcon={<Save />}
                        onClick={saveCurrentFilter}
                        variant="outlined"
                        size="small"
                        disabled={!filterPresetName.trim()}
                        sx={{
                          color: theme.palette.text.primary,
                          borderColor: theme.palette.divider,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.action.hover
                          }
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  )}

                  {/* Load Filter Presets */}
                  {savedFilters.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel sx={{ color: theme.palette.text.secondary }}>Load Preset</InputLabel>
                      <Select
                        value=""
                        onChange={(e) => {
                          const preset = savedFilters.find(f => f.id === e.target.value);
                          if (preset) loadFilterPreset(preset);
                        }}
                        label="Load Preset"
                        sx={{
                          color: theme.palette.text.primary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.divider,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                      >
                        {(savedFilters || []).map((preset) => (
                          <MenuItem 
                            key={preset.id} 
                            value={preset.id}
                            sx={{ 
                              color: theme.palette.text.primary,
                              '&:hover': { backgroundColor: theme.palette.action.hover }
                            }}
                          >
                            {preset.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Active Filter Summary */}
                  {hasActiveFilters() && (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, ml: 'auto' }}>
                      Showing {filteredAgentData.length} of {agentPerformanceData.length} agents
                    </Typography>
                  )}
                  
                </Box>
              </Grid>
              
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>

      {/* Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                {metrics.avgConfidence}%
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Avg Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: chartColors.bullish }}>
                {metrics.bullishCount}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Bullish Signals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: chartColors.bearish }}>
                {metrics.bearishCount}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Bearish Signals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                {metrics.consensusStrength}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Consensus
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Chart Area */}
      <Card sx={{ 
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
            Agent Analysis Visualization
          </Typography>
          
          <Box sx={{ height: 400, width: '100%' }}>
            {renderMainChart()}
          </Box>
          
          {!hasRealData && (
            <Typography variant="body2" sx={{ 
              textAlign: 'center', 
              mt: 2, 
              color: theme.palette.text.secondary 
            }}>
              Charts show sample structure. Run agent analysis to populate with real data.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Agent Performance Table */}
      {hasRealData && (
        <Card sx={{ 
          mt: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
              Agent Performance Details
            </Typography>
            <Grid container spacing={2}>
              {(filteredAgentData || []).map((agent, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.background.default,
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {agent.signal === 'bullish' && <TrendingUp sx={{ color: chartColors.bullish, mr: 1 }} />}
                      {agent.signal === 'bearish' && <TrendingDown sx={{ color: chartColors.bearish, mr: 1 }} />}
                      {agent.signal === 'neutral' && <Remove sx={{ color: chartColors.neutral, mr: 1 }} />}
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                        {agent.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Confidence: {agent.confidence}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Signal: {agent.signal}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InteractiveCharts;
