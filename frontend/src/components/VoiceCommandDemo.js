// Voice Command Demo - Test component for voice command recognition
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  Check,
  Error,
  ExpandMore,
  TrendingUp,
  ShowChart,
  AccountBalance,
  Psychology
} from '@mui/icons-material';
import { useCustomTheme } from '../contexts/ThemeProvider';
import voiceService from '../services/voiceService';
import voiceCommandParser from '../services/voiceCommandParser';

const VoiceCommandDemo = () => {
  const { theme, isDarkMode } = useCustomTheme();
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Test voice commands
  const testCommands = [
    "Analyze Apple",
    "Show my portfolio", 
    "Talk to Warren Buffett",
    "Compare Apple and Microsoft",
    "Should I buy Tesla?",
    "Show charts",
    "What's the market doing?",
    "Go to dashboard"
  ];

  // Voice support check
  const voiceSupport = {
    speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window
  };

  // Handle voice input with command recognition
  const handleVoiceInput = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setIsProcessing(false);

    voiceService.startListening(
      // onResult callback
      (result) => {
        const { transcript, confidence, isCommand, command } = result;
        
        setLastTranscript(transcript);
        
        if (isCommand && command) {
          setLastCommand(command);
          setCommandHistory(prev => [...prev.slice(-9), command]);
          
          // Log test result
          setTestResults(prev => [...prev.slice(-9), {
            timestamp: new Date().toLocaleTimeString(),
            input: transcript,
            command: command,
            success: true,
            confidence: command.confidence
          }]);
        } else {
          // Log as non-command
          setTestResults(prev => [...prev.slice(-9), {
            timestamp: new Date().toLocaleTimeString(),
            input: transcript,
            command: null,
            success: false,
            confidence: confidence
          }]);
        }
        
        setIsListening(false);
      },
      
      // onError callback
      (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
        setTestResults(prev => [...prev.slice(-9), {
          timestamp: new Date().toLocaleTimeString(),
          input: 'ERROR',
          command: null,
          success: false,
          error: error.toString()
        }]);
      },
      
      // onCommand callback
      async (command) => {
        setIsProcessing(true);
        try {
          // Simulate command execution
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Speak response
          const responseText = voiceCommandParser.generateResponse(command);
          await voiceService.speak(responseText, 'system');
          
        } catch (error) {
          console.error('Error executing command:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  // Test command parsing directly
  const testCommandParsing = (commandText) => {
    const result = voiceCommandParser.parseCommand(commandText);
    
    setTestResults(prev => [...prev.slice(-9), {
      timestamp: new Date().toLocaleTimeString(),
      input: commandText,
      command: result,
      success: !!result,
      confidence: result?.confidence || 0,
      manual: true
    }]);

    if (result) {
      setLastCommand(result);
      setCommandHistory(prev => [...prev.slice(-9), result]);
    }
  };

  // Get command statistics
  const getStats = () => {
    const total = testResults.length;
    const successful = testResults.filter(r => r.success).length;
    const avgConfidence = testResults.filter(r => r.success)
      .reduce((acc, r) => acc + (r.confidence || 0), 0) / (successful || 1);
    
    return {
      total,
      successful,
      successRate: total ? (successful / total * 100).toFixed(1) : 0,
      avgConfidence: (avgConfidence * 100).toFixed(1)
    };
  };

  const stats = getStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        🎤 Voice Command Recognition Demo
      </Typography>

      {/* Voice Support Status */}
      <Alert 
        severity={voiceSupport.speechRecognition && voiceSupport.speechSynthesis ? 'success' : 'warning'}
        sx={{ mb: 3 }}
      >
        Speech Recognition: {voiceSupport.speechRecognition ? '✅ Supported' : '❌ Not Supported'} | 
        Speech Synthesis: {voiceSupport.speechSynthesis ? '✅ Supported' : '❌ Not Supported'}
      </Alert>

      <Grid container spacing={3}>
        {/* Voice Input Controls */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mic /> Voice Input
              </Typography>

              <Button
                variant={isListening ? 'contained' : 'outlined'}
                color={isListening ? 'error' : 'primary'}
                onClick={handleVoiceInput}
                startIcon={isListening ? <MicOff /> : <Mic />}
                disabled={!voiceSupport.speechRecognition}
                fullWidth
                sx={{
                  mb: 2,
                  height: 56,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: isListening ? '0 0 20px rgba(255, 82, 82, 0.4)' : 'none',
                  animation: isListening ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.02)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                {isListening ? 'Listening... Speak Now!' : 'Start Voice Recognition'}
              </Button>

              {isProcessing && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Processing command...</Typography>
                  <LinearProgress />
                </Box>
              )}

              {lastTranscript && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Last Input:</strong> "{lastTranscript}"
                  </Typography>
                </Alert>
              )}

              {lastCommand && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Recognized Command:</strong> {lastCommand.action.replace('_', ' ')}
                  </Typography>
                  <Typography variant="caption">
                    Confidence: {(lastCommand.confidence * 100).toFixed(1)}%
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Test Commands */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeUp /> Test Commands
              </Typography>

              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                Click these commands to test parsing without voice input:
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {testCommands.map((cmd, index) => (
                  <Chip
                    key={index}
                    label={cmd}
                    variant="outlined"
                    clickable
                    onClick={() => testCommandParsing(cmd)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📊 Recognition Statistics</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2">Total Attempts</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      {stats.successRate}%
                    </Typography>
                    <Typography variant="body2">Success Rate</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.info.main }}>
                      {stats.successful}
                    </Typography>
                    <Typography variant="body2">Commands Recognized</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                      {stats.avgConfidence}%
                    </Typography>
                    <Typography variant="body2">Avg Confidence</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Commands */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>🎯 Available Command Types</Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUp sx={{ color: theme.palette.success.main }} /></ListItemIcon>
                  <ListItemText primary="Stock Analysis" secondary="Analyze AAPL, Run analysis on Tesla" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AccountBalance sx={{ color: theme.palette.primary.main }} /></ListItemIcon>
                  <ListItemText primary="Portfolio" secondary="Show portfolio, My holdings" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Psychology sx={{ color: theme.palette.info.main }} /></ListItemIcon>
                  <ListItemText primary="Agent Control" secondary="Talk to Warren Buffett, Switch agent" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ShowChart sx={{ color: theme.palette.warning.main }} /></ListItemIcon>
                  <ListItemText primary="Navigation" secondary="Show charts, Go to dashboard" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>📝 Test Results</Typography>
              
              {testResults.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  No tests performed yet. Try the voice input or click test commands above.
                </Typography>
              ) : (
                <List>
                  {testResults.slice().reverse().map((result, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        {result.success ? (
                          <Check sx={{ color: theme.palette.success.main }} />
                        ) : (
                          <Error sx={{ color: theme.palette.error.main }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              "{result.input}"
                            </Typography>
                            {result.manual && (
                              <Chip label="Manual Test" size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          result.success ? (
                            `→ ${result.command.action.replace('_', ' ')} (${(result.confidence * 100).toFixed(1)}% confidence)`
                          ) : (
                            result.error || 'No command recognized'
                          )
                        }
                      />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {result.timestamp}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VoiceCommandDemo;
