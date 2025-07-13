import React from "react";
import { 
  Box, 
  Typography, 
  Chip, 
  Card, 
  CardContent, 
  CardHeader,
  Avatar,
  CircularProgress
} from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// Professional Portfolio Card - Adapted from legacy PortfolioSummaryCard
function ProfessionalPortfolioCard({ decisions, title = "AI Agent Decision Summary" }) {
  // Calculate metrics based on actual decisions data - EXACT same logic as legacy
  const calculateMetrics = () => {
    if (!decisions || Object.keys(decisions).length === 0) {
      return {
        totalPositions: 0,
        buyCount: 0,
        sellCount: 0,
        holdCount: 0,
        avgConfidence: 0
      };
    }

    // Use only real data from decisions
    const totalPositions = Object.keys(decisions).length;
    
    // Count different types of decisions
    const buyDecisions = Object.values(decisions).filter(d => 
      d.action?.toLowerCase() === 'buy'
    );
    
    const sellDecisions = Object.values(decisions).filter(d => 
      d.action?.toLowerCase() === 'sell'
    );
    
    const holdDecisions = Object.values(decisions).filter(d => 
      d.action?.toLowerCase() === 'hold'
    );
    
    // Calculate average confidence based on actual confidence scores
    const allConfidences = Object.values(decisions)
      .map(d => d.confidence || 0)
      .filter(c => c > 0);
    
    const avgConfidence = allConfidences.length > 0 ?
      allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length : 0;
    
    return {
      totalPositions,
      buyCount: buyDecisions.length,
      sellCount: sellDecisions.length,
      holdCount: holdDecisions.length,
      avgConfidence
    };
  };

  const metrics = calculateMetrics();

  return (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        borderRadius: 3,
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 10px 40px rgba(0,0,0,0.3)'
            : '0 10px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{ 
          variant: 'h6', 
          fontWeight: 'bold',
          color: 'text.primary'
        }}
        avatar={
          <Avatar sx={{ 
            bgcolor: 'primary.main',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          }}>
            <AccountBalanceIcon />
          </Avatar>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
          >
            Trading Decisions
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1 }}>
            <Chip 
              icon={<TrendingUpIcon />} 
              label={`Buy: ${metrics.buyCount}`} 
              color="success" 
              variant="outlined" 
              sx={{ 
                flex: 1,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'success.main',
                  color: 'success.contrastText'
                },
                transition: 'all 0.2s ease'
              }}
            />
            <Chip 
              icon={<TrendingDownIcon />} 
              label={`Sell: ${metrics.sellCount}`} 
              color="error" 
              variant="outlined" 
              sx={{ 
                flex: 1,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'error.contrastText'
                },
                transition: 'all 0.2s ease'
              }}
            />
            <Chip 
              icon={<ShowChartIcon />} 
              label={`Hold: ${metrics.holdCount}`} 
              color="info" 
              variant="outlined" 
              sx={{ 
                flex: 1,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'info.main',
                  color: 'info.contrastText'
                },
                transition: 'all 0.2s ease'
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
          >
            Analyzed Positions
          </Typography>
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            color="primary.main"
            sx={{ 
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {metrics.totalPositions}
          </Typography>
        </Box>
        
        <Box>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontWeight: 600, letterSpacing: 0.5 }}
          >
            Average AI Confidence
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <CircularProgress 
                variant="determinate" 
                value={metrics.avgConfidence} 
                size={70}
                thickness={6}
                sx={{ 
                  color: metrics.avgConfidence > 75 ? 'success.main' : 
                         metrics.avgConfidence > 50 ? 'info.main' : 
                         metrics.avgConfidence > 25 ? 'warning.main' : 'error.main',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
              <CircularProgress 
                variant="determinate" 
                value={100}
                size={70}
                thickness={6}
                sx={{ 
                  color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  position: 'absolute',
                  left: 0
                }}
              />
            </Box>
            <Box sx={{ ml: 3 }}>
              <Typography 
                variant="h4" 
                fontWeight="bold"
                sx={{
                  color: metrics.avgConfidence > 75 ? 'success.main' : 
                         metrics.avgConfidence > 50 ? 'info.main' : 
                         metrics.avgConfidence > 25 ? 'warning.main' : 'error.main'
                }}
              >
                {Math.round(metrics.avgConfidence)}%
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontWeight: 500, lineHeight: 1.2 }}
              >
                Based on actual agent<br />confidence scores
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ProfessionalPortfolioCard;
