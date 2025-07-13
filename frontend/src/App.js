import React from "react";
import { Container, Typography, Box, CssBaseline, Paper, Button, AppBar, Toolbar, IconButton, Tooltip } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { LightMode, DarkMode } from "@mui/icons-material";
import HedgeFundDashboard from "./components/HedgeFundDashboard";
import AgentChatPage from "./components/AgentChatPage";
import ProfessionalTradingInterface from "./components/ProfessionalTradingInterface";
import NetworkTestPage from "./test/NetworkTestPage";
import Phase3ComponentTest from "./test/Phase3ComponentTest";
import ChatIcon from "@mui/icons-material/Chat";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BugReportIcon from "@mui/icons-material/BugReport";
import { CustomThemeProvider, useCustomTheme } from "./theme/ThemeProvider";

// Header component with theme toggle
function AppHeader() {
  const { isDarkMode, toggleTheme } = useCustomTheme();

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Capital Global AI Hedge Fund
        </Typography>
        <Button 
          color="inherit" 
          component={Link} 
          to="/"
          startIcon={<DashboardIcon />}
          sx={{ mr: 1 }}
        >
          Dashboard
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/agent-chat"
          startIcon={<ChatIcon />}
          sx={{ mr: 1 }}
        >
          Agent Chat
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/professional"
          startIcon={<TrendingUpIcon />}
          sx={{ 
            mr: 1,
            background: 'linear-gradient(45deg, #1a1a1a 30%, #333 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #333 30%, #555 90%)',
            }
          }}
        >
          Professional
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/test-network"
          startIcon={<BugReportIcon />}
          sx={{ mr: 1 }}
        >
          Test Network
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/phase3-component-test"
          startIcon={<BugReportIcon />}
          sx={{ mr: 2 }}
        >
          Phase 3 Component Test
        </Button>
        
        {/* Theme Toggle Button */}
        <Tooltip title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{
              ml: 1,
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'scale(1.05)'
              }
            }}
          >
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <Router>
        <CssBaseline />
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <AppHeader />
          <Routes>
            <Route path="*" element={
              <Box sx={{ py: 3, flexGrow: 1 }}>
                <Container maxWidth="lg">
                  <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                    <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
                      Capital Global AI Hedge Fund Platform
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Run agent workflows, simulate portfolios, and visualize multi-agent signals with LLMs
                    </Typography>
                  </Paper>
                  
                  <Routes>
                    <Route path="/" element={<HedgeFundDashboard />} />
                    <Route path="/agent-chat" element={<AgentChatPage />} />
                    <Route path="/test-network" element={<NetworkTestPage />} />
                    <Route path="/professional" element={<ProfessionalTradingInterface />} />
                    <Route path="/phase3-component-test" element={<Phase3ComponentTest />} />
                  </Routes>
                </Container>
              </Box>
            } />
          </Routes>
        </Box>
      </Router>
    </CustomThemeProvider>
  );
}

export default App;
