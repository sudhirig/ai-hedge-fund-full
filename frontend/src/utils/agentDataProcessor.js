/**
 * Unified Agent Data Processing Utility
 * 
 * This module provides standardized functions for processing agent analysis data
 * to ensure consistency between AgentNetworkVisualization and AgentCommunicationFlow
 */

// Signal types used throughout the application - MATCHING CORE AGENTIC LOGIC
export const SIGNAL_TYPES = {
  BULLISH: 'bullish',  // ORIGINAL: bullish signal from agents
  BEARISH: 'bearish',  // ORIGINAL: bearish signal from agents  
  NEUTRAL: 'neutral'   // ORIGINAL: neutral signal from agents
};

// Legacy aliases for backward compatibility
export const LEGACY_SIGNAL_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL', 
  NEUTRAL: 'NEUTRAL'
};

/**
 * Convert legacy signal types to original agentic format
 */
const convertLegacySignal = (signal) => {
  if (!signal) return SIGNAL_TYPES.NEUTRAL;
  const s = signal.toLowerCase();
  if (s === 'buy' || s === 'bullish') return SIGNAL_TYPES.BULLISH;
  if (s === 'sell' || s === 'bearish') return SIGNAL_TYPES.BEARISH;
  return SIGNAL_TYPES.NEUTRAL;
};

// Agent configuration mapping
export const AGENT_CONFIG = {
  // Original git repo agent names (exact match)
  'fundamentals_agent': { 
    icon: '📊', 
    color: '#2196f3', 
    category: 'Analysis',
    description: 'Analyzes financial fundamentals and company metrics',
    priority: 'high'
  },
  'technical_analyst_agent': { 
    icon: '📈', 
    color: '#ff9800', 
    category: 'Analysis',
    description: 'Technical analysis and chart patterns',
    priority: 'high'
  },
  'sentiment_agent': { 
    icon: '💭', 
    color: '#9c27b0', 
    category: 'Analysis',
    description: 'Market sentiment and news analysis',
    priority: 'medium'
  },
  'warren_buffett_agent': { 
    icon: '🏛️', 
    color: '#ff5722', 
    category: 'Strategy',
    description: 'Long-term value investing philosophy',
    priority: 'high'
  },
  'bill_ackman_agent': { 
    icon: '⚡', 
    color: '#4caf50', 
    category: 'Strategy',
    description: 'Activist value investing strategy',
    priority: 'medium'
  },
  
  // Legacy display names (for backward compatibility)
  'Fundamental Analysis Agent': { 
    icon: '📊', 
    color: '#2196f3', 
    category: 'Analysis',
    description: 'Analyzes financial fundamentals and company metrics',
    priority: 'high'
  },
  'Technical Analyst': { 
    icon: '📈', 
    color: '#ff9800', 
    category: 'Analysis',
    description: 'Studies price patterns and technical indicators',
    priority: 'high'
  },
  'Valuation Analysis Agent': { 
    icon: '💰', 
    color: '#4caf50', 
    category: 'Analysis',
    description: 'Performs DCF and relative valuation analysis',
    priority: 'high'
  },
  'Sentiment Analysis Agent': { 
    icon: '😊', 
    color: '#9c27b0', 
    category: 'Market',
    description: 'Analyzes market sentiment and news',
    priority: 'medium'
  },
  'Ben Graham Agent': { 
    icon: '🔍', 
    color: '#795548', 
    category: 'Strategy',
    description: 'Value investing approach with safety margin',
    priority: 'high'
  },
  'Cathie Wood Agent': { 
    icon: '🚀', 
    color: '#e91e63', 
    category: 'Strategy',
    description: 'Innovation-focused growth strategy',
    priority: 'medium'
  },
  'Bill Ackman Agent': { 
    icon: '⚡', 
    color: '#607d8b', 
    category: 'Strategy',
    description: 'Activist value investing strategy',
    priority: 'medium'
  },
  'Phil Fisher Agent': { 
    icon: '🌱', 
    color: '#8bc34a', 
    category: 'Strategy',
    description: 'Growth at reasonable price strategy',
    priority: 'medium'
  },
  'Warren Buffett Agent': { 
    icon: '🏛️', 
    color: '#ff5722', 
    category: 'Strategy',
    description: 'Long-term value investing philosophy',
    priority: 'high'
  },
  'Charlie Munger Agent': { 
    icon: '🧠', 
    color: '#673ab7', 
    category: 'Strategy',
    description: 'Mental models and multidisciplinary thinking',
    priority: 'high'
  },
  'Stanley Druckenmiller Agent': { 
    icon: '📊', 
    color: '#00bcd4', 
    category: 'Strategy',
    description: 'Macro trading and risk management',
    priority: 'medium'
  },
  'Risk Management Agent': { 
    icon: '🛡️', 
    color: '#f44336', 
    category: 'Risk',
    description: 'Portfolio risk assessment and management',
    priority: 'critical'
  },
  'Portfolio Management Agent': { 
    icon: '💼', 
    color: '#3f51b5', 
    category: 'Portfolio',
    description: 'Asset allocation and portfolio optimization',
    priority: 'high'
  }
};

/**
 * Extract signal from analysis data - PRESERVING EXACT ORIGINAL AGENTIC LOGIC
 * The original agents return: { "signal": "bullish/bearish/neutral", "confidence": number, "reasoning": object }
 * @param {any} analysis - The analysis data (should already have signal property from agents)
 * @returns {string} - One of SIGNAL_TYPES values
 */
export const extractSignal = (analysis) => {
  // ORIGINAL AGENTIC LOGIC: Agents provide pre-computed signals
  if (analysis && analysis.signal) {
    return convertLegacySignal(analysis.signal);
  }

  // FALLBACK: If no signal, try to extract from action (for legacy data)
  if (analysis && analysis.action) {
    return convertLegacySignal(analysis.action);
  }

  // FALLBACK: Try reasoning as last resort (for legacy data)
  if (analysis && analysis.reasoning) {
    let reasoningText = '';
    if (typeof analysis.reasoning === 'string') {
      reasoningText = analysis.reasoning.toLowerCase();
    } else if (typeof analysis.reasoning === 'object' && analysis.reasoning.recommendation) {
      reasoningText = analysis.reasoning.recommendation.toLowerCase();
    }

    if (reasoningText.includes('bullish') || reasoningText.includes('buy')) {
      return SIGNAL_TYPES.BULLISH;
    }
    if (reasoningText.includes('bearish') || reasoningText.includes('sell')) {
      return SIGNAL_TYPES.BEARISH;
    }
  }

  return SIGNAL_TYPES.NEUTRAL;
};

/**
 * Extract confidence from analysis data
 * @param {any} analysis - The analysis data
 * @returns {number} - Confidence percentage (0-100)
 */
export const extractConfidence = (analysis) => {
  if (!analysis) return 50;

  // Method 1: Check structured confidence property
  if (typeof analysis === 'object' && analysis.confidence) {
    return Math.min(Math.max(parseInt(analysis.confidence), 0), 100);
  }

  // Method 2: Extract from text using regex
  const analysisText = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);
  const confidenceMatch = analysisText.match(/(\d+)%/);
  if (confidenceMatch) {
    return Math.min(Math.max(parseInt(confidenceMatch[1]), 0), 100);
  }

  // Method 3: Infer confidence from signal strength
  const signal = extractSignal(analysis);
  const text = analysisText.toLowerCase();
  
  if (signal !== SIGNAL_TYPES.NEUTRAL) {
    if (text.includes('strong') || text.includes('confident')) return 85;
    if (text.includes('likely') || text.includes('probable')) return 70;
    if (text.includes('possible') || text.includes('may')) return 60;
    return 65; // Default for clear signals
  }

  return 50; // Default neutral confidence
};

/**
 * Process agent analysis data into standardized format - PRESERVING ORIGINAL LOGIC
 * @param {object} analysisResults - The raw analysis results from API
 * @param {array} selectedStocks - Array of selected stock tickers
 * @returns {array} - Standardized agent data
 */
export const processAgentData = (analysisResults, selectedStocks = []) => {
  if (!analysisResults?.agents) return [];

  const agents = analysisResults.agents;
  const processedData = [];

  Object.entries(agents).forEach(([agentName, agentData]) => {
    if (!agentData || typeof agentData !== 'object') return;

    const config = AGENT_CONFIG[agentName] || {
      icon: '🤖',
      color: '#666',
      category: 'Other',
      description: 'AI Agent',
      priority: 'low'
    };

    // Process each ticker for this agent
    Object.entries(agentData).forEach(([ticker, analysis]) => {
      if (selectedStocks.length > 0 && !selectedStocks.includes(ticker)) return;

      // PRESERVE ORIGINAL LOGIC: Use the signal if it's already provided, otherwise extract
      const signal = analysis.signal ? 
        extractSignal(analysis) : // Use provided signal
        extractSignal(analysis);   // Extract from analysis if needed

      const confidence = extractConfidence(analysis);
      
      // Preserve reasoning structure
      let reasoning = '';
      if (analysis.reasoning) {
        if (typeof analysis.reasoning === 'string') {
          reasoning = analysis.reasoning;
        } else if (typeof analysis.reasoning === 'object') {
          // Convert object reasoning to readable format, handling nested objects
          const reasoningParts = [];
          
          Object.entries(analysis.reasoning).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              // Handle nested objects like { signal: 'bullish', details: 'ROE: 22.50%' }
              if (value.details) {
                reasoningParts.push(`${key.replace(/_/g, ' ')}: ${value.details}`);
              } else if (value.signal && value.details) {
                reasoningParts.push(`${key.replace(/_/g, ' ')}: ${value.signal} - ${value.details}`);
              } else if (value.signal) {
                reasoningParts.push(`${key.replace(/_/g, ' ')}: ${value.signal}`);
              } else {
                // For other nested objects, extract key-value pairs
                const nestedParts = Object.entries(value)
                  .filter(([k, v]) => typeof v !== 'object')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ');
                if (nestedParts) {
                  reasoningParts.push(`${key.replace(/_/g, ' ')}: ${nestedParts}`);
                }
              }
            } else {
              // Handle simple key-value pairs
              reasoningParts.push(`${key.replace(/_/g, ' ')}: ${value}`);
            }
          });
          
          reasoning = reasoningParts.join('; ');
        }
      }

      processedData.push({
        id: `${agentName}-${ticker}-${Date.now()}`,
        name: agentName,
        ticker,
        signal,
        confidence,
        reasoning,
        config,
        timestamp: new Date(),
        // PRESERVE ORIGINAL: Keep the raw analysis data
        rawAnalysis: analysis
      });
    });
  });

  return processedData;
};

/**
 * Calculate consensus from agent data - EXACT ORIGINAL LOGIC FROM AGENTCHARTS.JS
 * @param {array} agentData - Array of processed agent data
 * @returns {object} - Consensus calculation by ticker
 */
export const calculateConsensus = (agentData) => {
  if (!agentData || agentData.length === 0) return {};

  // First aggregate signals by ticker (matching original aggregateSignals logic)
  const signalAgg = {};
  
  agentData.forEach(agent => {
    const ticker = agent.ticker;
    if (!ticker) return;

    // Initialize ticker data if needed
    if (!signalAgg[ticker]) {
      signalAgg[ticker] = { 
        bullish: { count: 0, agents: [] }, 
        bearish: { count: 0, agents: [] }, 
        neutral: { count: 0, agents: [] }
      };
    }

    // Convert our signal format to original format
    let signalKey = 'neutral';
    if (agent.signal === SIGNAL_TYPES.BULLISH) signalKey = 'bullish';
    else if (agent.signal === SIGNAL_TYPES.BEARISH) signalKey = 'bearish';

    // Count the signal
    signalAgg[ticker][signalKey].count++;
    signalAgg[ticker][signalKey].agents.push({
      name: agent.name,
      confidence: agent.confidence,
      reasoning: agent.reasoning
    });
  });

  // Now apply EXACT original consensus calculation logic
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
};

/**
 * Process trading decisions from analysis results
 * @param {object} analysisResults - The raw analysis results from API
 * @param {array} selectedStocks - Array of selected stock tickers
 * @returns {array} - Processed trading decisions
 */
export const processTradingDecisions = (analysisResults, selectedStocks = []) => {
  if (!analysisResults?.decisions) return [];

  return selectedStocks.map(ticker => {
    const decision = analysisResults.decisions[ticker];
    if (!decision) return null;

    // Get contributing agents for this decision
    const contributingAgents = Object.entries(analysisResults.agents || {})
      .filter(([agentName, agentData]) => agentData[ticker])
      .map(([agentName, agentData]) => {
        const analysis = agentData[ticker];
        return {
          name: agentName,
          signal: extractSignal(analysis),
          confidence: extractConfidence(analysis),
          config: AGENT_CONFIG[agentName] || { color: '#666', icon: '🤖' }
        };
      });

    return {
      id: `decision-${ticker}`,
      ticker,
      action: decision.action || 'Hold',
      quantity: decision.quantity || 0,
      confidence: extractConfidence(decision),
      reasoning: decision.reasoning || 'No reasoning provided',
      contributingAgents,
      timestamp: new Date()
    };
  }).filter(Boolean);
};

/**
 * Get color for signal type
 * @param {string} signal - Signal type
 * @returns {string} - Color hex code
 */
export const getSignalColor = (signal) => {
  switch (signal) {
    case SIGNAL_TYPES.BULLISH: return '#4caf50';
    case SIGNAL_TYPES.BEARISH: return '#f44336';
    default: return '#ff9800';
  }
};
