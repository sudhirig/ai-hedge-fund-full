/**
 * Signal color mappings and utilities for consistent visual representation
 */

// Color constants for different signal types
export const SIGNAL_COLORS = {
  bullish: '#4caf50',      // Green
  bearish: '#f44336',      // Red
  neutral: '#2196f3',      // Blue
  buy: '#4caf50',          // Green
  sell: '#f44336',         // Red
  hold: '#2196f3',         // Blue
  'strong buy': '#2e7d32', // Dark green
  'strong sell': '#c62828', // Dark red
  default: '#999999'       // Gray
};

// Confidence level colors
export const CONFIDENCE_COLORS = {
  high: '#4caf50',         // Green (>70%)
  medium: '#ff9800',       // Orange (40-70%)
  low: '#f44336'           // Red (<40%)
};

/**
 * Get color for a given signal
 * @param {string} signal - The signal value
 * @returns {string} - Hex color code
 */
export const getSignalColor = (signal) => {
  if (!signal || typeof signal !== 'string') {
    return SIGNAL_COLORS.default;
  }
  
  const normalizedSignal = signal.toLowerCase().trim();
  return SIGNAL_COLORS[normalizedSignal] || SIGNAL_COLORS.default;
};

/**
 * Get color for a confidence level
 * @param {number} confidence - Confidence value (0-1 or 0-100)
 * @returns {string} - Hex color code
 */
export const getConfidenceColor = (confidence) => {
  if (typeof confidence !== 'number') {
    return CONFIDENCE_COLORS.low;
  }
  
  // Convert percentage to decimal if needed
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;
  
  if (normalizedConfidence > 0.7) {
    return CONFIDENCE_COLORS.high;
  } else if (normalizedConfidence > 0.4) {
    return CONFIDENCE_COLORS.medium;
  } else {
    return CONFIDENCE_COLORS.low;
  }
};

/**
 * Get appropriate color for performance metrics
 * @param {number} value - Performance value
 * @param {string} type - Type of performance metric
 * @returns {string} - Hex color code
 */
export const getPerformanceColor = (value, type = 'default') => {
  if (typeof value !== 'number') {
    return SIGNAL_COLORS.default;
  }
  
  switch (type) {
    case 'return':
    case 'profit':
      return value >= 0 ? SIGNAL_COLORS.bullish : SIGNAL_COLORS.bearish;
    case 'accuracy':
      return getConfidenceColor(value / 100);
    case 'volatility':
      // Lower volatility is better
      return value < 20 ? SIGNAL_COLORS.bullish : 
             value < 40 ? SIGNAL_COLORS.neutral : SIGNAL_COLORS.bearish;
    default:
      return SIGNAL_COLORS.default;
  }
};
