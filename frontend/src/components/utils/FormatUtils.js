/**
 * Utility functions for formatting data in visualization components
 */

/**
 * Formats JSON data for display
 * @param {Object} data - The JSON data to format
 * @returns {Object} - Formatted JSON data
 */
export const formatJsonData = (data) => {
  if (!data) return {};
  
  try {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    return data;
  } catch (e) {
    console.error("Error formatting JSON data:", e);
    return {};
  }
};

/**
 * Formats a value for display with appropriate color coding
 * @param {any} value - The value to format
 * @param {string} type - The type of value (e.g., 'signal', 'confidence', etc.)
 * @returns {Object} - An object with the formatted value and color
 */
export const formatValue = (value, type = 'default') => {
  if (value === undefined || value === null) {
    return { value: 'N/A', color: '#999' };
  }

  switch (type) {
    case 'signal':
      return {
        value: value.toString().toUpperCase(),
        color: getSignalColor(value)
      };
    case 'confidence':
      const confidenceValue = typeof value === 'string' ? parseFloat(value) : value;
      const percentage = confidenceValue * 100;
      return {
        value: `${percentage.toFixed(0)}%`,
        color: confidenceValue > 0.7 ? '#4caf50' : confidenceValue > 0.4 ? '#ff9800' : '#f44336'
      };
    case 'money':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return {
        value: `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        color: numValue >= 0 ? '#4caf50' : '#f44336'
      };
    case 'percentage':
      const pctValue = typeof value === 'string' ? parseFloat(value) : value;
      return {
        value: `${pctValue.toFixed(2)}%`,
        color: pctValue >= 0 ? '#4caf50' : '#f44336'
      };
    default:
      return {
        value: value.toString(),
        color: '#333'
      };
  }
};

/**
 * Returns a color based on the signal value
 * @param {string} signal - The signal value (bullish, bearish, neutral)
 * @returns {string} - The color corresponding to the signal
 */
export const getSignalColor = (signal) => {
  if (!signal || typeof signal !== 'string') return '#999';
  
  const normalizedSignal = signal.toLowerCase().trim();
  
  switch (normalizedSignal) {
    case 'bullish':
    case 'buy':
    case 'strong buy':
      return '#4caf50';  // Green
    case 'bearish':
    case 'sell':
    case 'strong sell':
      return '#f44336';  // Red
    case 'neutral':
    case 'hold':
      return '#2196f3';  // Blue
    default:
      return '#999';     // Gray
  }
};

/**
 * A component to display formatted JSON data
 * @param {Object} props - Component props
 * @param {Object} props.data - JSON data to display
 * @returns {React.Component} - Formatted JSON display component
 */
export const FormattedJson = ({ data }) => {
  const formattedJson = JSON.stringify(data, null, 2);
  
  return (
    <pre style={{ 
      backgroundColor: '#f5f5f5', 
      padding: '10px',
      borderRadius: '4px', 
      overflow: 'auto', 
      maxHeight: '400px'
    }}>
      {formattedJson}
    </pre>
  );
};
