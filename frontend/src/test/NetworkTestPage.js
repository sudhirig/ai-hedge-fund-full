// Simple test page to verify AgentNetworkVisualization works with real data
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AgentNetworkVisualization from '../components/AgentNetworkVisualization';
import { processAgentData, calculateConsensus, SIGNAL_TYPES } from '../utils/agentDataProcessor';

// Mock data that exactly matches git repo agent output format
const realMockData = {
  agents: {
    fundamentals_agent: {
      AAPL: {
        signal: "bullish", // Exact format from agents/fundamentals.py 
        confidence: 75,
        reasoning: {
          profitability_signal: {
            signal: "bullish",
            details: "ROE: 22.50%, Net Margin: 23.70%, Op Margin: 28.20%"
          },
          growth_signal: {
            signal: "bullish", 
            details: "Revenue Growth: 8.20%, Earnings Growth: 11.50%"
          },
          financial_health_signal: {
            signal: "neutral",
            details: "Debt/Equity: 1.73, Current Ratio: 1.07"
          },
          price_ratios_signal: {
            signal: "bearish",
            details: "P/E: 29.67, P/B: 39.97, P/S: 7.54"
          }
        }
      }
    },
    technical_analyst_agent: {
      AAPL: {
        signal: "neutral",
        confidence: 45,
        reasoning: {
          trend_signal: { signal: "neutral", details: "Mixed trend signals detected" },
          momentum_signal: { signal: "bearish", details: "RSI: 58.3, showing weakness" }
        }
      }
    },
    sentiment_agent: {
      AAPL: {
        signal: "bearish",
        confidence: 60,
        reasoning: {
          market_sentiment: { signal: "bearish", details: "Negative news sentiment detected" }
        }
      }
    },
    warren_buffett_agent: {
      AAPL: {
        signal: "bullish",
        confidence: 80,
        reasoning: {
          value_signal: { signal: "bullish", details: "Strong moat and consistent earnings" }
        }
      }
    },
    bill_ackman_agent: {
      AAPL: {
        signal: "neutral",
        confidence: 55,
        reasoning: {
          activist_signal: { signal: "neutral", details: "No immediate catalyst identified" }
        }
      }
    }
  }
};

const NetworkTestPage = () => {
  const selectedStocks = ['AAPL'];
  const [debugData, setDebugData] = useState(null);

  useEffect(() => {
    // Debug the data processing
    console.log('🧪 Testing Agent Data Processing...');
    console.log('Raw Data:', realMockData);
    
    const processedAgents = processAgentData(realMockData, selectedStocks);
    console.log('Processed Agents:', processedAgents);
    
    const consensus = calculateConsensus(processedAgents);
    console.log('Consensus:', consensus);
    
    setDebugData({ processedAgents, consensus });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Agent Network Test - Real Git Repo Data Format
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Testing AgentNetworkVisualization with data that exactly matches the git repo agent output format:
        <br />
        • Signal format: "bullish", "bearish", "neutral" (NOT BUY/SELL/NEUTRAL)
        <br />
        • Structure: {`{ signal, confidence, reasoning }`}
        <br />
        • Agents: fundamentals_agent, technical_analyst_agent, sentiment_agent, warren_buffett_agent, bill_ackman_agent
      </Typography>

      {debugData && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="h6">Debug Info:</Typography>
          <Typography variant="body2">
            Processed Agents: {debugData.processedAgents.length}
          </Typography>
          {debugData.processedAgents.map((agent, i) => (
            <Typography key={i} variant="body2">
              {agent.name}: {agent.signal} ({agent.confidence}%)
            </Typography>
          ))}
        </Box>
      )}

      <Button 
        variant="contained" 
        onClick={() => window.location.reload()} 
        sx={{ mb: 2 }}
      >
        Reload Test
      </Button>

      <Box sx={{ border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden' }}>
        <AgentNetworkVisualization 
          analysisResults={realMockData}
          selectedStocks={selectedStocks}
          isAnalyzing={false}
        />
      </Box>
    </Box>
  );
};

export default NetworkTestPage;
