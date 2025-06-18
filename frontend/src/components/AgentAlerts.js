import React from "react";
import { Alert, Box } from "@mui/material";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function checkRiskySituations(agents) {
  // Look for risky situations in Risk Management Agent
  const alerts = [];
  const risk = agents && agents["Risk Management Agent"];
  if (risk && typeof risk === 'object') {
    Object.entries(risk).forEach(([ticker, info]) => {
      const r = info.reasoning || {};
      if (r.remaining_limit === 0) {
        alerts.push({
          type: 'warning',
          message: `${ticker}: No remaining position limit!`,
        });
      }
      if (r.available_cash === 0) {
        alerts.push({
          type: 'warning',
          message: `${ticker}: No available cash for trading!`,
        });
      }
      if (r.position_limit && r.current_position && r.current_position > r.position_limit) {
        alerts.push({
          type: 'error',
          message: `${ticker}: Current position exceeds position limit!`,
        });
      }
    });
  }
  return alerts;
}

export default function AgentAlerts({ agents }) {
  const alerts = checkRiskySituations(agents);
  if (!alerts.length) return null;
  return (
    <Box sx={{ mb: 2 }}>
      {alerts.map((a, i) => (
        <Alert severity={a.type} iconMapping={{ warning: <WarningAmberIcon />, error: <WarningAmberIcon />, success: <CheckCircleIcon /> }} key={i} sx={{ mb: 1 }}>
          {a.message}
        </Alert>
      ))}
    </Box>
  );
}
