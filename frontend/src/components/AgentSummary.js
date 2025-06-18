import React, { useState } from "react";
import { Box, Typography, Grid, Paper, Chip, Tooltip, Stack, Stepper, Step, StepLabel, IconButton, Collapse, Alert, CircularProgress } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AgentAvatar from "./AgentAvatars";


const AGENT_LABELS = {
  "Fundamental Analysis Agent": "Fundamental analysis of profitability, growth, financial health, and price ratios.",
  "Technical Analyst": "Technical signals: trend, mean reversion, momentum, volatility, statistical arbitrage.",
  "Valuation Analysis Agent": "Valuation via DCF and owner earnings vs. market cap.",
  "Sentiment Analysis Agent": "Market sentiment and signal weighting.",
  "Ben Graham Agent": "Classic value investing: margin of safety, balance sheet, Graham Number.",
  "Cathie Wood Agent": "Disruptive innovation, R&D, and exponential growth potential.",
  "Bill Ackman Agent": "Quality, moat, capital allocation, and activist investing.",
  "Phil Fisher Agent": "Growth, innovation, management quality, and long-term prospects.",
  "Warren Buffett Agent": "Economic moat, management, value, and financial strength.",
  "Charlie Munger Agent": "Business quality, predictability, and margin of safety.",
  "Stanley Druckenmiller Agent": "Macro/growth focus, momentum, and risk-reward profile.",
  "Risk Management Agent": "Position sizing, risk limits, and portfolio constraints.",
  "Portfolio Management Agent": "Synthesizes all agents for the final trading action."
};

function agentSnapshot(agentName, agentData) {
  if (!agentData || typeof agentData !== "object") return null;
  // Show a summary per ticker
  return (
    <Grid container spacing={1}>
      {Object.entries(agentData).map(([ticker, info]) => (
        <Grid item xs={12} sm={6} md={4} key={ticker}>
          <Paper elevation={1} sx={{ p: 1.5, minHeight: 90 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={700}>{ticker}</Typography>
              {info.signal && <Chip label={info.signal.toUpperCase()} color={signalColor(info.signal)} size="small" />}
              {info.confidence !== undefined && <Chip label={`Conf: ${info.confidence}%`} color="info" size="small" />}
            </Stack>
            {info.reasoning && typeof info.reasoning === "string" && (
              <Tooltip title={info.reasoning.length > 100 ? info.reasoning : ''} placement="top">
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {info.reasoning}
                </Typography>
              </Tooltip>
            )}
            {info.reasoning && typeof info.reasoning === "object" && (
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                {Object.values(info.reasoning).map((v, i) => v.signal ? v.signal : '').filter(Boolean).join(', ')}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function signalColor(signal) {
  if (!signal) return "default";
  const s = signal.toLowerCase();
  if (s === "bullish") return "success";
  if (s === "bearish") return "error";
  if (s === "neutral") return "default";
  return "default";
}

function consensusSummary(agents) {
  // For each ticker, count signals and generate a brief summary
  const tickers = {};
  Object.entries(agents).forEach(([agent, data]) => {
    if (typeof data !== 'object') return;
    Object.entries(data).forEach(([ticker, info]) => {
      if (!tickers[ticker]) tickers[ticker] = { bullish: 0, bearish: 0, neutral: 0, signals: [] };
      if (info.signal) {
        const s = info.signal.toLowerCase();
        if (tickers[ticker][s] !== undefined) tickers[ticker][s]++;
        tickers[ticker].signals.push({ agent, signal: info.signal, confidence: info.confidence });
      }
    });
  });
  return tickers;
}

function tickerSummaryText(ticker, stats) {
  const total = stats.bullish + stats.bearish + stats.neutral;
  if (!total) return 'No agent signals.';
  let trend = 'mixed';
  if (stats.bullish > stats.bearish && stats.bullish > stats.neutral) trend = 'bullish';
  else if (stats.bearish > stats.bullish && stats.bearish > stats.neutral) trend = 'bearish';
  else if (stats.neutral > stats.bullish && stats.neutral > stats.bearish) trend = 'neutral';
  return `Consensus: ${trend.toUpperCase()} (${stats.bullish} bullish, ${stats.bearish} bearish, ${stats.neutral} neutral)`;
}

export default function AgentSummary({ agents, isThinking }) {
  const [openBanner, setOpenBanner] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  // Timeline steps for agentic AI with tooltips
  const agentSteps = [
    { label: 'Data Gathering', tooltip: 'The AI collects relevant market and portfolio data.' },
    { label: 'Market & Risk Analysis', tooltip: 'Analyzes market trends and risk factors.' },
    { label: 'Portfolio Construction', tooltip: 'Builds an optimal portfolio using agent strategies.' },
    { label: 'Simulation', tooltip: 'Runs simulations to test portfolio robustness.' },
    { label: 'Summary Generation', tooltip: 'Generates this summary with reasoning and insights.' }
  ];

  // Handler for inline reasoning expansion
  const handleExpandAgent = (agent) => setExpandedAgent(expandedAgent === agent ? null : agent);

  // Handler for feedback
  const handleFeedback = (type) => setFeedback(type);

  if (!agents) return null;
  const consensus = consensusSummary(agents);
  return (
    <Box>
      {/* User Guidance Banner */}
      <Collapse in={openBanner}>
        <Alert
          icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info"
          action={<IconButton size="small" onClick={() => setOpenBanner(false)}><CloseIcon fontSize="small" /></IconButton>}
          sx={{ mb: 2 }}
        >
          Explore how our agentic AI autonomously manages your portfolio—click on any “Why?” icon to see the reasoning!
        </Alert>
      </Collapse>

      {/* Agentic AI Explainer */}
      <Paper elevation={3} sx={{ p: 2, mb: 3, background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
            <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
            Agentic AI Portfolio Simulation
            <Chip label="AI-Generated" color="primary" size="small" sx={{ ml: 2 }} />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This summary is powered by an agentic AI that autonomously analyzes data, optimizes portfolios, and provides transparent reasoning for every decision.
          </Typography>
        </Box>
        {isThinking && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 180, justifyContent: 'flex-end' }}>
            <CircularProgress size={24} thickness={4} />
            <Typography variant="body2" color="text.secondary">AI is thinking…</Typography>
          </Stack>
        )}
      </Paper>

      {/* Agent Activity Timeline with tooltips */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Stepper alternativeLabel activeStep={agentSteps.length - 1}>
          {agentSteps.map((step, idx) => (
            <Step key={step.label} onMouseEnter={() => setHoveredStep(idx)} onMouseLeave={() => setHoveredStep(null)}>
              <Tooltip title={step.tooltip} arrow open={hoveredStep === idx} disableFocusListener disableTouchListener>
                <StepLabel>{step.label}</StepLabel>
              </Tooltip>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Consensus Snapshots */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1, mt: 2 }}>Agent Snapshots</Typography>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {Object.entries(consensus).map(([ticker, stats]) => (
          <Paper key={ticker} elevation={1} sx={{ p: 1.5, mb: 1, mr: 2, minWidth: 260, flex: '0 1 auto' }}>
            <Typography fontWeight={700} sx={{ mr: 1, display: 'inline' }}>{ticker}:</Typography>
            <Typography variant="body2" sx={{ display: 'inline' }}>{tickerSummaryText(ticker, stats)}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Agent Details with Reasoning and Confidence, Avatar, and Inline Expansion */}
      <Grid container spacing={3}>
        {Object.entries(agents).map(([agent, data]) => (
          <Grid item xs={12} md={6} key={agent}>
            <Paper elevation={2} sx={{ p: 2, mb: 2, position: 'relative', minHeight: 180 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <AgentAvatar agent={agent} />
                <Typography fontWeight={700}>{agent}</Typography>
                <Chip label="AI-Generated" color="primary" size="small" />
                <Tooltip title="See how this agent thinks!">
                  <IconButton size="small" onClick={() => handleExpandAgent(agent)}>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>{AGENT_LABELS[agent] || ''}</Typography>
              {/* Confidence Indicator for first ticker */}
              {typeof data === 'object' && Object.values(data)[0]?.confidence !== undefined && (
                <Chip label={`Confidence: ${Object.values(data)[0].confidence}%`} color="info" size="small" sx={{ mb: 1 }} />
              )}
              {agentSnapshot(agent, data)}
              {/* Inline Reasoning Expansion */}
              <Collapse in={expandedAgent === agent}>
                <Paper elevation={0} sx={{ mt: 2, p: 1.5, background: '#f5f7fa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Reasoning</Typography>
                  {typeof data === 'object' && Object.values(data)[0]?.reasoning ?
                    (typeof Object.values(data)[0].reasoning === 'string' ? (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {Object.values(data)[0].reasoning}
                      </Typography>
                    ) : (
                      <Box component="pre" sx={{ background: '#f3f3f3', p: 1, borderRadius: 1, overflowX: 'auto', fontSize: 14 }}>
                        <code>{JSON.stringify(Object.values(data)[0].reasoning, null, 2)}</code>
                      </Box>
                    ))
                    : (<Typography variant="body2">No reasoning available.</Typography>)}
                </Paper>
              </Collapse>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* User Feedback Prompt */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Was this AI-generated summary helpful?</Typography>
        <IconButton color={feedback === 'up' ? 'primary' : 'default'} onClick={() => handleFeedback('up')}>
          <ThumbUpAltOutlinedIcon />
        </IconButton>
        <IconButton color={feedback === 'down' ? 'error' : 'default'} onClick={() => handleFeedback('down')}>
          <ThumbDownAltOutlinedIcon />
        </IconButton>
        {feedback && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {feedback === 'up' ? 'Thank you for your feedback!' : 'We appreciate your feedback!'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
