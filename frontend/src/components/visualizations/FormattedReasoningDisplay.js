import React, { useState } from 'react';
import { 
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Component to display reasoning text with optional expansion/collapse
 * 
 * @param {Object} props - Component props
 * @param {string} props.reasoning - The reasoning text to display
 * @param {boolean} props.expandable - Whether the text should be expandable
 * @param {number} props.maxLength - Maximum length before truncating
 * @param {string} props.backgroundColor - Background color for the container
 * @returns {React.Component} - Formatted reasoning display component
 */
const FormattedReasoningDisplay = ({ 
  reasoning, 
  expandable = true, 
  maxLength = 100,
  backgroundColor = "#ffffff"
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!reasoning) {
    return (
      <Box sx={{ p: 1, bgcolor: backgroundColor, borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No reasoning provided
        </Typography>
      </Box>
    );
  }

  const reasoningText = typeof reasoning === 'string' 
    ? reasoning 
    : JSON.stringify(reasoning);
  
  const shouldTruncate = expandable && reasoningText.length > maxLength;
  const displayText = shouldTruncate && !expanded 
    ? `${reasoningText.substring(0, maxLength)}...` 
    : reasoningText;

  // Extract key points if reasoning is in JSON format with specific structure
  let keyPoints = [];
  if (typeof reasoning === 'object' && reasoning !== null) {
    if (reasoning.points && Array.isArray(reasoning.points)) {
      keyPoints = reasoning.points;
    } else if (reasoning.key_factors && Array.isArray(reasoning.key_factors)) {
      keyPoints = reasoning.key_factors;
    } else if (reasoning.reasons && Array.isArray(reasoning.reasons)) {
      keyPoints = reasoning.reasons;
    }
  }

  return (
    <Box sx={{ p: 1, bgcolor: backgroundColor, borderRadius: 1 }}>
      {keyPoints.length > 0 ? (
        <>
          <Typography variant="body2" fontWeight="medium" mb={1}>
            Key Points:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {keyPoints.map((point, idx) => (
              <li key={idx}>
                <Typography variant="body2">{point}</Typography>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Typography 
          variant="body2" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            fontSize: '0.875rem'
          }}
        >
          {displayText}
        </Typography>
      )}

      {shouldTruncate && (
        <Box textAlign="center" mt={0.5}>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Show less" : "Show more"}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default FormattedReasoningDisplay;
