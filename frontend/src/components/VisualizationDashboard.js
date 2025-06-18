import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TradingDecisionFlow from './visualizations/TradingDecisionFlow';
import SystemArchitecture from './visualizations/SystemArchitecture';
import AgentCollaboration from './visualizations/AgentCollaboration';

function VisualizationDashboard({ simulationData }) {
  const [tab, setTab] = useState(0);
  const [showInfo, setShowInfo] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Paper elevation={2} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Capital Global Agentic AI System Visualization
      </Typography>

      {showInfo && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowInfo(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          These visualizations demonstrate how multiple AI agents collaborate to make trading decisions.
          Each tab shows a different aspect of the agentic AI system.
        </Alert>
      )}

      <Tabs 
        value={tab} 
        onChange={handleTabChange} 
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Trading Decision Flow" />
        <Tab label="System Architecture" />
        <Tab label="Agent Collaboration" />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {tab === 0 && (
        <TradingDecisionFlow simulationData={simulationData} />
      )}

      {tab === 1 && (
        <SystemArchitecture simulationData={simulationData} />
      )}

      {tab === 2 && (
        <AgentCollaboration simulationData={simulationData} />
      )}
    </Paper>
  );
}

export default VisualizationDashboard;
