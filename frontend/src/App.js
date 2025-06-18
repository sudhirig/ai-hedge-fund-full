import React from "react";
import { Container, Typography, Box, CssBaseline, Paper, Button, AppBar, Toolbar } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HedgeFundDashboard from "./components/HedgeFundDashboard";
import AgentChatPage from "./components/AgentChatPage";
import ChatIcon from "@mui/icons-material/Chat";
import DashboardIcon from "@mui/icons-material/Dashboard";

function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ bgcolor: "#f5f6fa", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
            >
              Agent Chat
            </Button>
          </Toolbar>
        </AppBar>
        
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
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
