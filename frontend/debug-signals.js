// Quick test to debug signal processing
const SIGNAL_TYPES = {
  BULLISH: 'bullish',
  BEARISH: 'bearish', 
  NEUTRAL: 'neutral'
};

const convertLegacySignal = (signal) => {
  if (!signal) return SIGNAL_TYPES.NEUTRAL;
  const s = signal.toLowerCase();
  if (s === 'buy' || s === 'bullish') return SIGNAL_TYPES.BULLISH;
  if (s === 'sell' || s === 'bearish') return SIGNAL_TYPES.BEARISH;
  return SIGNAL_TYPES.NEUTRAL;
};

const extractSignal = (analysis) => {
  if (analysis && analysis.signal) {
    return convertLegacySignal(analysis.signal);
  }
  return SIGNAL_TYPES.NEUTRAL;
};

// Test data
const testAnalysis = {
  signal: "bullish",
  confidence: 75,
  reasoning: {
    profitability_signal: {
      signal: "bullish",
      details: "ROE: 22.50%, Net Margin: 23.70%"
    }
  }
};

console.log('Test Analysis:', testAnalysis);
console.log('Extracted Signal:', extractSignal(testAnalysis));
console.log('Expected Signal:', SIGNAL_TYPES.BULLISH);
console.log('Match:', extractSignal(testAnalysis) === SIGNAL_TYPES.BULLISH);
