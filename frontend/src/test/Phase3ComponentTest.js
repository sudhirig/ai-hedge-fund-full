import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ProfessionalMarketInsights from '../components/professional/ProfessionalMarketInsights';
import ProfessionalTabularView from '../components/professional/ProfessionalTabularView';

// Create dark theme for testing
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
});

// Mock data that matches our backend response format
const mockAnalysisData = {
  agents: {
    fundamentals_agent: {
      AAPL: {
        signal: 'bearish',
        confidence: 67,
        reasoning: {
          message: 'Strong fundamentals but overvalued at current price levels',
          details: 'ROE: 22.50%, Debt-to-Equity: 0.18, Operating Margin: 26.2%'
        }
      },
      MSFT: {
        signal: 'bullish',
        confidence: 74,
        reasoning: {
          message: 'Exceptional growth metrics and strong competitive position',
          details: 'Revenue Growth: 10.6%, EPS Growth: 90.2%, R&D Investment: 12.8%'
        }
      }
    },
    sentiment_agent: {
      AAPL: {
        signal: 'bearish',
        confidence: 63,
        reasoning: 'Market sentiment showing weakness with declining social media mentions'
      },
      MSFT: {
        signal: 'bullish',
        confidence: 71,
        reasoning: 'Strong institutional interest and positive analyst coverage'
      }
    },
    warren_buffett_agent: {
      AAPL: {
        signal: 'neutral',
        confidence: 58,
        reasoning: 'Quality business but price suggests limited margin of safety'
      },
      MSFT: {
        signal: 'neutral',
        confidence: 65,
        reasoning: 'Excellent business model but valuation requires patience'
      }
    },
    bill_ackman_agent: {
      AAPL: {
        signal: 'bearish',
        confidence: 72,
        reasoning: 'Activist concerns about capital allocation and growth prospects'
      },
      MSFT: {
        signal: 'bullish',
        confidence: 75,
        reasoning: 'Strong management execution and strategic positioning in cloud'
      }
    },
    phil_fisher_agent: {
      AAPL: {
        signal: 'neutral',
        confidence: 60,
        reasoning: 'Innovation leadership but mature market position'
      },
      MSFT: {
        signal: 'bullish',
        confidence: 78,
        reasoning: 'Continuous R&D investment and strong growth fundamentals'
      }
    },
    stanley_druckenmiller_agent: {
      AAPL: {
        signal: 'bearish',
        confidence: 69,
        reasoning: 'Macro headwinds and valuation compression risk'
      },
      MSFT: {
        signal: 'bullish',
        confidence: 73,
        reasoning: 'Beneficiary of digital transformation trends'
      }
    }
  },
  decisions: {
    AAPL: {
      action: 'SELL',
      quantity: 0,
      confidence: 58.5,
      reasoning: 'Predominantly bearish signals from multiple agents with confidence levels between 50-67%. The negative sentiment outweighs bullish indicators.'
    },
    MSFT: {
      action: 'BUY', 
      quantity: 20,
      confidence: 64.5,
      reasoning: 'Mixed but leaning positive signals. Strong bullish sentiment from multiple agents (74%, 75%, 78%). Initiate moderate long position.'
    }
  }
};

function Phase3ComponentTest() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default', 
        p: 3,
        color: 'text.primary'
      }}>
        <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          🧪 Phase 3 Component Testing
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Testing with Mock Agent Data (6 agents, 2 stocks)
        </Typography>

        <Grid container spacing={4}>
          {/* ProfessionalMarketInsights Test */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                📊 ProfessionalMarketInsights Component
              </Typography>
              <ProfessionalMarketInsights 
                agents={mockAnalysisData.agents}
                title="Market Intelligence Test"
              />
            </Paper>
          </Grid>

          {/* ProfessionalTabularView Test */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                🖥️ ProfessionalTabularView Component
              </Typography>
              <ProfessionalTabularView 
                agents={mockAnalysisData.agents}
                decisions={mockAnalysisData.decisions}
                title="Terminal Analysis Test"
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Data Preview */}
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            📋 Mock Data Structure Preview
          </Typography>
          
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            This test uses the exact data structure expected by our Phase 3 components:
          </Typography>
          
          <Box sx={{ 
            bgcolor: '#0a0a0a', 
            p: 2, 
            borderRadius: 1, 
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            overflow: 'auto',
            maxHeight: 200
          }}>
            <Typography variant="body2" sx={{ color: '#10b981' }}>
              Agents: {Object.keys(mockAnalysisData.agents).length} <br/>
              Stocks: {Object.keys(mockAnalysisData.decisions).length} <br/>
              Signals: bullish, bearish, neutral <br/>
              Confidence Range: 58% - 78%
            </Typography>
          </Box>
        </Paper>

        {/* Test Results */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            ✅ Expected Test Results
          </Typography>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>ProfessionalMarketInsights should show:</strong><br/>
            • Signal Distribution from 6 AI Agents<br/>
            • High Confidence Signals (3 signals {'>'} 65%)<br/>
            • Bullish: 4 signals, Bearish: 4 signals, Neutral: 4 signals<br/><br/>
            
            <strong>ProfessionalTabularView should show:</strong><br/>
            • Ticker selection dropdown (AAPL, MSFT)<br/>
            • Agent signals table with confidence bars<br/>
            • Trading decision summary<br/>
            • Terminal-style monospace formatting
          </Typography>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default Phase3ComponentTest;
