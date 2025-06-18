/**
 * Sample data for when no high-confidence signals are detected
 * This provides demonstration data for the TradingDecisionFlow component
 */

export const sampleAnalystSignals = {
  "Warren Buffett Agent": {
    "AAPL": {
      "signal": "bullish",
      "confidence": 0.87,
      "reasoning": "Strong brand moat, excellent capital allocation, trading below intrinsic value with high FCF yield. Management has demonstrated consistent shareholder-friendly actions with buybacks and growing dividend."
    },
    "MSFT": {
      "signal": "bullish",
      "confidence": 0.82,
      "reasoning": "Excellent business model with recurring revenue streams, strong competitive position in cloud services, and prudent capital allocation under current management."
    },
    "NVDA": {
      "signal": "neutral",
      "confidence": 0.60,
      "reasoning": "While the business has strong competitive advantages, current valuation appears to price in significant future growth expectations."
    }
  },
  "Cathie Wood Agent": {
    "AAPL": {
      "signal": "neutral",
      "confidence": 0.55,
      "reasoning": "While Apple has strong fundamentals, it may not represent the disruptive innovation potential we typically seek in investments."
    },
    "MSFT": {
      "signal": "bullish",
      "confidence": 0.89,
      "reasoning": "Microsoft's cloud business and AI investments position it at the forefront of technological transformation across multiple industries."
    },
    "NVDA": {
      "signal": "bullish",
      "confidence": 0.94,
      "reasoning": "NVDA is the key enabler of the AI revolution with its specialized hardware and software ecosystem. The company has created a significant moat through its CUDA platform."
    }
  },
  "Risk Management Agent": {
    "AAPL": {
      "signal": "bullish",
      "confidence": 0.75,
      "reasoning": {
        "portfolio_value": 1000000,
        "current_position": 50000,
        "position_limit": 100000,
        "remaining_limit": 50000,
        "risk_metrics": {
          "volatility": "Low",
          "beta": 1.02,
          "var_95": "4.3%",
          "correlation": "Moderate negative correlation with existing holdings"
        }
      }
    },
    "MSFT": {
      "signal": "neutral",
      "confidence": 0.60,
      "reasoning": {
        "portfolio_value": 1000000,
        "current_position": 85000,
        "position_limit": 100000,
        "remaining_limit": 15000,
        "risk_metrics": {
          "volatility": "Low",
          "beta": 0.98,
          "var_95": "4.1%",
          "correlation": "High positive correlation with existing tech holdings"
        }
      }
    },
    "NVDA": {
      "signal": "bearish",
      "confidence": 0.68,
      "reasoning": {
        "portfolio_value": 1000000,
        "current_position": 95000,
        "position_limit": 100000,
        "remaining_limit": 5000,
        "risk_metrics": {
          "volatility": "High",
          "beta": 1.45,
          "var_95": "8.7%",
          "correlation": "High positive correlation with existing semiconductor holdings"
        }
      }
    }
  },
  "Ben Graham Agent": {
    "AAPL": {
      "signal": "bullish",
      "confidence": 0.71,
      "reasoning": "Strong balance sheet with high cash reserves. P/E ratio is reasonable relative to market and historical averages. Consistent dividend growth demonstrates financial strength."
    },
    "MSFT": {
      "signal": "bullish",
      "confidence": 0.75,
      "reasoning": "Strong financial position with consistent earnings growth. Current ratio and debt-to-equity metrics indicate financial stability."
    },
    "NVDA": {
      "signal": "bearish",
      "confidence": 0.78,
      "reasoning": "Current valuation metrics exceed historical averages by a significant margin. P/E and P/B ratios indicate potential overvaluation based on fundamental analysis."
    }
  }
};

export const samplePortfolioDecisions = {
  "AAPL": {
    "action": "buy",
    "quantity": 25,
    "confidence": 0.82,
    "reasoning": "Based on strong fundamental analysis, value metrics, and positive risk assessment."
  },
  "MSFT": {
    "action": "hold",
    "quantity": 0,
    "confidence": 0.65,
    "reasoning": "Current position is near portfolio limits despite positive analyst signals."
  },
  "NVDA": {
    "action": "sell",
    "quantity": 10,
    "confidence": 0.75,
    "reasoning": "High valuation concerns from value perspective combined with negative risk metrics."
  }
};

export default {
  analystSignals: sampleAnalystSignals,
  portfolioDecisions: samplePortfolioDecisions
};
