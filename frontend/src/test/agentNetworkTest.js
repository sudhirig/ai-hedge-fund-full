// Test file to verify AgentNetworkVisualization works with real git repo data format
import { processAgentData, calculateConsensus, SIGNAL_TYPES } from '../utils/agentDataProcessor';

// Mock data matching the exact git repo format from agents/fundamentals.py
const mockAnalysisResults = {
  agents: {
    fundamentals_agent: {
      AAPL: {
        signal: "bullish",
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
          trend_signal: { signal: "neutral", details: "Mixed signals" },
          momentum_signal: { signal: "bearish", details: "RSI: 58.3" }
        }
      }
    },
    sentiment_agent: {
      AAPL: {
        signal: "bearish",
        confidence: 60,
        reasoning: {
          market_sentiment: { signal: "bearish", details: "Negative news sentiment" }
        }
      }
    }
  }
};

const selectedStocks = ['AAPL'];

console.log('🧪 Testing Agent Network Data Processing...');

// Test 1: processAgentData
console.log('\n1. Testing processAgentData...');
const agentData = processAgentData(mockAnalysisResults, selectedStocks);
console.log('Processed agent data:', JSON.stringify(agentData, null, 2));

// Test 2: calculateConsensus  
console.log('\n2. Testing calculateConsensus...');
const consensus = calculateConsensus(agentData);
console.log('Consensus result:', JSON.stringify(consensus, null, 2));

// Test 3: Signal Types
console.log('\n3. Testing Signal Types...');
console.log('SIGNAL_TYPES:', SIGNAL_TYPES);

// Test 4: Verify signal extraction
console.log('\n4. Testing signal extraction...');
Object.values(agentData).forEach(agent => {
  Object.keys(agent.analysis).forEach(ticker => {
    const analysis = agent.analysis[ticker];
    console.log(`${agent.name} - ${ticker}:`, {
      signal: analysis.signal,
      confidence: analysis.confidence,
      hasReasoning: !!analysis.reasoning
    });
  });
});

export { mockAnalysisResults, selectedStocks };
