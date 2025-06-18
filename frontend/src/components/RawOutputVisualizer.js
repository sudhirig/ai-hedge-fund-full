import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Divider,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const signalColor = (signal) => {
  if (!signal) return "default";
  const s = signal.toLowerCase();
  if (s === "bullish") return "success";
  if (s === "bearish") return "error";
  if (s === "neutral") return "default";
  return "default";
};

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function prettifyAgentBlock(agentName, jsonStr) {
  const data = tryParseJSON(jsonStr);
  if (!data || typeof data !== "object")
    return <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{jsonStr}</Box>;

  return (
    <Box>
      <Typography variant="h6" color="primary" gutterBottom>{agentName}</Typography>
      <Grid container spacing={2}>
        {Object.entries(data).map(([ticker, info]) => (
          <Grid item xs={12} sm={6} md={4} key={ticker}>
            <Paper elevation={2} sx={{ p: 2, minHeight: 120 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>{ticker}</Typography>
                {info.signal && <Chip label={info.signal.toUpperCase()} color={signalColor(info.signal)} />}
                {info.confidence !== undefined && <Chip label={`Confidence: ${info.confidence}%`} color="info" />}
              </Stack>
              {info.reasoning && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Reasoning:</Typography>
                  {typeof info.reasoning === "object" ? (
                    <Box sx={{ ml: 2 }}>
                      {Object.entries(info.reasoning).map(([key, val]) => (
                        <Box key={key} sx={{ mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={700}>{key.replace(/_/g, ' ')}:</Typography>
                          {val.signal && <Chip label={val.signal.toUpperCase()} size="small" color={signalColor(val.signal)} sx={{ ml: 1 }} />}
                          {val.details && <Typography variant="caption" sx={{ ml: 1 }}>{val.details}</Typography>}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption">{info.reasoning}</Typography>
                  )}
                </Box>
              )}
              {info.strategy_signals && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Strategy Signals:</Typography>
                  <Box sx={{ ml: 2 }}>
                    {Object.entries(info.strategy_signals).map(([strategy, strat]) => (
                      <Box key={strategy} sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700}>{strategy.replace(/_/g, ' ')}:</Typography>
                        {strat.signal && <Chip label={strat.signal.toUpperCase()} size="small" color={signalColor(strat.signal)} sx={{ ml: 1 }} />}
                        {strat.confidence !== undefined && <Chip label={`Conf: ${strat.confidence}%`} size="small" color="info" sx={{ ml: 1 }} />}
                        {strat.metrics && (
                          <Tooltip title={<Box>
                            {Object.entries(strat.metrics).map(([m, v]) => <div key={m}>{m}: {String(v)}</div>)}
                          </Box>} placement="right">
                            <Chip label="metrics" size="small" sx={{ ml: 1, cursor: 'pointer' }} />
                          </Tooltip>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function prettifyTableBlock(title, tableStr) {
  // Parse ASCII table into rows
  const lines = tableStr.split("\n").filter((l) => l.trim().startsWith("|") && l.includes("|") && !/^\+-/.test(l));
  if (lines.length < 2) return null;
  const headers = lines[0].split("|").map((h) => h.trim()).filter(Boolean);
  const rows = lines.slice(1).map((line) => line.split("|").map((c) => c.trim()).filter(Boolean));
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
      <TableContainer component={Paper} sx={{ mt: 1, maxWidth: 900 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((h, i) => <TableCell key={i}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function RawOutputVisualizer({ raw }) {
  // Parse agent blocks
  const agentBlocks = [];
  const agentBlockRegex = /=+\s+([\w\s]+Agent[\w\s]*)=+\n(\{[\s\S]+?\})\n=+/g;
  let m;
  while ((m = agentBlockRegex.exec(raw))) {
    agentBlocks.push({ name: m[1].trim(), json: m[2] });
  }

  // Parse ASCII tables (for AGENT ANALYSIS and TRADING DECISION)
  const tableBlocks = [];
  const tableRegex = /(AGENT ANALYSIS: \[.*?\][\s\S]+?\+[-=]+\+\n)/g;
  let t;
  while ((t = tableRegex.exec(raw))) {
    tableBlocks.push({ title: t[0].split("\n")[0], table: t[0] });
  }
  // Parse TRADING DECISION tables
  const tradingTableRegex = /(TRADING DECISION: \[.*?\][\s\S]+?\+[-=]+\+\n)/g;
  let tt;
  while ((tt = tradingTableRegex.exec(raw))) {
    tableBlocks.push({ title: tt[0].split("\n")[0], table: tt[0] });
  }

  // Parse simple analysis sections
  const analysisBlocks = [];
  const analysisRegex = /Analysis for ([A-Z]+)[\s=]+/g;
  let a;
  while ((a = analysisRegex.exec(raw))) {
    analysisBlocks.push(a[0]);
  }

  return (
    <Box>
      {agentBlocks.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Agent Outputs</Typography>
          {agentBlocks.map((b, i) => (
            <Accordion key={i} defaultExpanded={i === 0} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={700}>{b.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {prettifyAgentBlock(b.name, b.json)}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      {tableBlocks.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Summary Tables</Typography>
          {tableBlocks.map((b, i) => prettifyTableBlock(b.title, b.table))}
        </Box>
      )}
      {/* Fallback: show any missed content as plain text */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.secondary">Full Raw Output (for debugging):</Typography>
      <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, maxHeight: 400, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
        {raw}
      </Box>
    </Box>
  );
}
