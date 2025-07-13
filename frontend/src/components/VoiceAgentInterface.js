import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Avatar,
  Chip,
  Alert,
  Tooltip,
  Grid,
  Paper,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  Send,
  Settings,
  PlayArrow,
  Stop,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Psychology,
  Chat,
  RecordVoiceOver,
  HelpOutline,
  History,
  Close
} from '@mui/icons-material';
import { useCustomTheme } from '../contexts/ThemeProvider';
import voiceService from '../services/voiceService';
import agentChatService from '../services/agentChatService';
import { agentVoiceProfiles } from '../config/VoicePersonalities';
import { agentConversationCues } from '../config/AgentChatCues';
import { AgentAvatar } from './shared/AgentAvatar';

const VoiceAgentInterface = ({ selectedAgent = 'Warren Buffett Agent' }) => {
  const theme = useCustomTheme();
  
  // Voice and chat state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice settings and status
  const [voiceSupport, setVoiceSupport] = useState(voiceService.isSupported());
  const [voiceError, setVoiceError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showCues, setShowCues] = useState(true);
  
  // Agent and personality
  const [currentAgent, setCurrentAgent] = useState(selectedAgent);
  const [agentPersonality, setAgentPersonality] = useState(null);
  const [conversationCues, setConversationCues] = useState([]);
  
  // Voice command state
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [showCommandHelp, setShowCommandHelp] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize component
  useEffect(() => {
    initializeVoiceInterface();
    loadAgentData();
    
    return () => {
      voiceService.destroy();
    };
  }, []);

  // Update agent when selectedAgent changes
  useEffect(() => {
    setCurrentAgent(selectedAgent);
    loadAgentData();
  }, [selectedAgent]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize voice interface
  const initializeVoiceInterface = () => {
    // Set up voice service callbacks
    voiceService.setEventCallbacks({
      onSpeechStart: () => {
        setIsListening(true);
        setVoiceError(null);
      },
      onSpeechEnd: () => {
        setIsListening(false);
      },
      onSpeechResult: (result) => {
        setInterimTranscript(result.interim);
        if (result.final) {
          setTranscript(result.final);
          handleVoiceInput(result.final);
        }
      },
      onSpeechError: (error) => {
        setIsListening(false);
        setVoiceError(error.message);
        console.error('Voice error:', error);
      },
      onSpeakingStart: () => {
        setIsSpeaking(true);
      },
      onSpeakingEnd: () => {
        setIsSpeaking(false);
      }
    });

    // Check voice support
    const support = voiceService.isSupported();
    setVoiceSupport(support);
    
    if (!support.both) {
      setVoiceError('Voice features not fully supported in this browser');
    }
  };

  // Load agent personality and conversation cues
  const loadAgentData = () => {
    const personality = agentVoiceProfiles[currentAgent];
    const cues = agentConversationCues[currentAgent] || [];
    
    setAgentPersonality(personality);
    setConversationCues(cues);
    
    // Add welcome message if starting fresh
    if (messages.length === 0) {
      const welcomeMessage = personality?.conversationStyle?.greeting || 
        `Hello! I'm ${currentAgent}. How can I help you with your investment questions today?`;
      
      setMessages([{
        id: Date.now(),
        sender: 'agent',
        text: welcomeMessage,
        timestamp: new Date(),
        agent: currentAgent,
        isVoiceOptimized: false
      }]);
    }
  };

  // Handle voice input
  const handleVoiceInput = useCallback(async (text) => {
    if (!text.trim()) return;
    
    setTranscript('');
    setInterimTranscript('');
    await sendMessage(text, true);
  }, []);

  // Handle text input
  const handleTextInput = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText;
    setInputText('');
    await sendMessage(text, false);
  };

  // Send message to agent
  const sendMessage = async (text, isVoice = false) => {
    setIsProcessing(true);
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date(),
      isVoice: isVoice
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send to agent with voice context
      const response = await agentChatService.sendMessage(
        currentAgent,
        text,
        messages.slice(-10), // Last 10 messages for context
        {
          voiceMode: isVoice,
          agentPersonality: agentPersonality
        }
      );
      
      // Add agent response
      const agentMessage = {
        id: Date.now() + 1,
        sender: 'agent',
        text: response.message || response.response,
        timestamp: new Date(),
        agent: currentAgent,
        isVoiceOptimized: response.voice_optimized || false,
        confidence: response.confidence || null
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // Speak the response if in voice mode and auto-speak is enabled
      if ((isVoice || autoSpeak) && !isSpeaking) {
        try {
          await voiceService.speak(agentMessage.text, currentAgent);
        } catch (speakError) {
          console.warn('Text-to-speech failed:', speakError);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced voice input handling with command recognition
  const handleVoiceInputWithCommand = useCallback(() => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceError('');

    voiceService.startListening(
      // onResult callback
      (result) => {
        const { transcript, confidence, isCommand, command } = result;
        
        console.log('Voice result:', { transcript, confidence, isCommand, command });
        
        if (isCommand && command) {
          // Handle voice command
          setLastCommand(command);
          setCommandHistory(prev => [...prev.slice(-9), command]); // Keep last 10 commands
          setIsCommandMode(true);
          
          // Auto-hide command mode after 5 seconds
          setTimeout(() => setIsCommandMode(false), 5000);
        } else {
          // Regular chat input
          setVoiceInput(transcript);
          if (transcript.trim()) {
            handleSendMessage(transcript);
          }
        }
        
        setIsListening(false);
      },
      
      // onError callback
      (error) => {
        console.error('Voice recognition error:', error);
        setVoiceError(`Voice recognition error: ${error}`);
        setIsListening(false);
      },
      
      // onCommand callback - Execute the parsed command
      async (command) => {
        await executeVoiceCommand(command);
      }
    );
  }, [isListening, currentAgent]);

  // Execute voice commands
  const executeVoiceCommand = useCallback(async (command) => {
    if (!command) return;

    try {
      setIsProcessing(true);

      switch (command.action) {
        case 'ANALYZE_STOCK':
          if (command.parameters.symbol) {
            await agentChatService.sendMessage(
              currentAgent,
              `Analyze ${command.parameters.symbol}`,
              messages.slice(-10), // Last 10 messages for context
              {
                voiceMode: true,
                agentPersonality: agentPersonality
              }
            );
            await voiceService.speak(
              `Analysis complete for ${command.parameters.symbol}. Check the results below.`,
              currentAgent
            );
          }
          break;

        case 'SHOW_PORTFOLIO':
          await voiceService.speak('Showing your portfolio overview.', currentAgent);
          break;

        case 'SHOW_CHARTS':
          await voiceService.speak('Opening interactive charts view.', currentAgent);
          break;

        case 'NAVIGATE_DASHBOARD':
          await voiceService.speak('Navigating to the main dashboard.', currentAgent);
          break;

        case 'SWITCH_AGENT':
          if (command.parameters.agentName) {
            const newAgent = command.parameters.agentName;
            setCurrentAgent(newAgent);
            setMessages([]); // Clear chat history when switching agents
            await voiceService.speak(
              `Hello, I'm ${newAgent}. How can I help you with your investment decisions today?`,
              newAgent
            );
          }
          break;

        case 'COMPARE_STOCKS':
          if (command.parameters.symbol1 && command.parameters.symbol2) {
            await agentChatService.sendMessage(
              currentAgent,
              `Compare ${command.parameters.symbol1} and ${command.parameters.symbol2}`,
              messages.slice(-10), // Last 10 messages for context
              {
                voiceMode: true,
                agentPersonality: agentPersonality
              }
            );
            await voiceService.speak(
              `Comparing ${command.parameters.symbol1} and ${command.parameters.symbol2}. Results are ready.`,
              currentAgent
            );
          }
          break;

        case 'GET_BUY_RECOMMENDATION':
        case 'GET_SELL_RECOMMENDATION':
          if (command.parameters.symbol) {
            const action = command.action === 'GET_BUY_RECOMMENDATION' ? 'buy' : 'sell';
            const response = await handleAgentQuery(
              `Should I ${action} ${command.parameters.symbol}? Give me your recommendation.`
            );
            if (response) {
              await voiceService.speak(response, currentAgent);
            }
          }
          break;

        case 'SHOW_MARKET':
          await voiceService.speak(
            'Here\'s the current market overview. The major indices are showing mixed signals today.',
            currentAgent
          );
          break;

        case 'SHOW_HELP':
          setShowCommandHelp(true);
          await voiceService.speak(
            'Here are the voice commands you can use. I can analyze stocks, show your portfolio, switch to different agents, and much more.',
            'system'
          );
          break;

        default:
          await voiceService.speak(
            'I understood your command but I\'m not sure how to execute it yet. Try asking me directly instead.',
            currentAgent
          );
      }
    } catch (error) {
      console.error('Error executing voice command:', error);
      await voiceService.speak('Sorry, I had trouble executing that command.', 'system');
    } finally {
      setIsProcessing(false);
    }
  }, [currentAgent]);

  // Get available commands for help
  const getVoiceCommands = useCallback(() => {
    return voiceService.getAvailableCommands();
  }, []);

  // Toggle voice listening
  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening();
    } else {
      if (!voiceSupport.speechRecognition) {
        setVoiceError('Speech recognition not supported');
        return;
      }
      
      const success = voiceService.startListening();
      if (!success) {
        setVoiceError('Failed to start speech recognition');
      }
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    voiceService.stopSpeaking();
  };

  // Use conversation cue
  const useCue = (cue) => {
    if (isVoiceMode) {
      handleVoiceInput(cue.text);
    } else {
      setInputText(cue.text);
      inputRef.current?.focus();
    }
  };

  // Render voice status indicator
  const renderVoiceStatus = () => {
    if (!voiceSupport.both) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Voice features are not fully supported in this browser. 
            Consider using Chrome or Edge for the best experience.
          </Typography>
        </Alert>
      );
    }

    if (voiceError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVoiceError(null)}>
          <Typography variant="body2">{voiceError}</Typography>
        </Alert>
      );
    }

    return null;
  };

  // Render message
  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    
    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          alignItems: 'flex-start'
        }}
      >
        {!isUser && !isSystem && (
          <AgentAvatar 
            agentName={message.agent || currentAgent} 
            size={32}
            sx={{ mr: 1, mt: 1 }}
          />
        )}
        
        <Box
          sx={{
            maxWidth: '70%',
            backgroundColor: isUser 
              ? theme.palette.primary.main 
              : isSystem
              ? theme.palette.error.main
              : theme.palette.background.paper,
            color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
            padding: '12px 16px',
            borderRadius: '18px',
            borderTopLeftRadius: isUser ? '18px' : '4px',
            borderTopRightRadius: isUser ? '4px' : '18px',
            boxShadow: theme.shadows[1],
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
            {message.text}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {message.timestamp.toLocaleTimeString()}
            </Typography>
            
            {message.isVoice && (
              <Chip label="Voice" size="small" color="primary" sx={{ height: 20 }} />
            )}
            
            {message.isVoiceOptimized && (
              <Tooltip title="Optimized for speech">
                <VolumeUp sx={{ fontSize: 16, opacity: 0.7 }} />
              </Tooltip>
            )}
            
            {!isUser && !isSystem && (
              <Tooltip title="Speak this message">
                <IconButton
                  size="small"
                  onClick={() => voiceService.speak(message.text, message.agent)}
                  disabled={isSpeaking}
                  sx={{ p: 0.5 }}
                >
                  <VolumeUp sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {isUser && (
          <Avatar sx={{ ml: 1, mt: 1, width: 32, height: 32, backgroundColor: theme.palette.primary.main }}>
            U
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 0,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AgentAvatar agentName={currentAgent} size={48} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentAgent}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Voice Intelligence Chat
                {agentPersonality && (
                  <Chip 
                    label={agentPersonality.tone}
                    size="small" 
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={isVoiceMode}
                  onChange={(e) => setIsVoiceMode(e.target.checked)}
                  disabled={!voiceSupport.both}
                />
              }
              label="Voice Mode"
            />
            
            <IconButton 
              onClick={() => setShowSettings(!showSettings)}
              color={showSettings ? 'primary' : 'default'}
            >
              <Settings />
            </IconButton>
          </Box>
        </Box>
        
        {/* Voice status */}
        {renderVoiceStatus()}
        
        {/* Settings panel */}
        <Collapse in={showSettings}>
          <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={autoSpeak}
                      onChange={(e) => setAutoSpeak(e.target.checked)}
                      disabled={!voiceSupport.speechSynthesis}
                    />
                  }
                  label="Auto-speak responses"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showCues}
                      onChange={(e) => setShowCues(e.target.checked)}
                    />
                  }
                  label="Show conversation cues"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Main content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chat area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <Box 
            sx={{ 
              flex: 1, 
              overflow: 'auto',
              p: 2,
              backgroundColor: theme.palette.background.default
            }}
          >
            {messages.map(renderMessage)}
            
            {/* Processing indicator */}
            {isProcessing && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="body2" color="text.secondary">
                    {currentAgent} is thinking...
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Interim transcript display */}
            {interimTranscript && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Box 
                  sx={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    backgroundColor: theme.palette.action.hover,
                    borderRadius: '12px',
                    border: `2px dashed ${theme.palette.primary.main}`
                  }}
                >
                  <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
                    {interimTranscript}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
          <Paper 
            elevation={3}
            sx={{ 
              p: 2, 
              borderRadius: 0,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`
            }}
          >
            {/* Voice controls */}
            {isVoiceMode && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant={isListening ? "contained" : "outlined"}
                  color={isListening ? "error" : "primary"}
                  startIcon={isListening ? <MicOff /> : <Mic />}
                  onClick={handleVoiceInputWithCommand}
                  disabled={!voiceSupport.speechRecognition}
                  sx={{ 
                    minWidth: 120,
                    ...(isListening && {
                      animation: 'pulse 1.5s infinite'
                    })
                  }}
                >
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </Button>
                
                {isSpeaking && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Stop />}
                    onClick={stopSpeaking}
                  >
                    Stop Speaking
                  </Button>
                )}
                
                {isListening && (
                  <LinearProgress 
                    sx={{ 
                      flex: 1, 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: theme.palette.action.hover,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.primary.main
                      }
                    }} 
                  />
                )}
              </Box>
            )}
            
            {/* Text input */}
            <Box component="form" onSubmit={handleTextInput} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                ref={inputRef}
                fullWidth
                variant="outlined"
                placeholder={isVoiceMode ? "Speak or type your message..." : "Type your message..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing || isListening}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.default
                  }
                }}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={!inputText.trim() || isProcessing}
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark
                  }
                }}
              >
                <Send />
              </IconButton>
            </Box>
          </Paper>
        </Box>

        {/* Conversation cues sidebar */}
        {showCues && conversationCues.length > 0 && (
          <Paper 
            elevation={1}
            sx={{ 
              width: 300, 
              borderRadius: 0,
              borderLeft: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chat sx={{ fontSize: 20 }} />
                Conversation Starters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try these topics with {currentAgent}
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {conversationCues.map((cue, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => useCue(cue)}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.main
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={cue.text}
                    secondary={cue.category}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        
        {/* Voice Command Status Bar */}
        {(isCommandMode || lastCommand) && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: theme.palette.success.main,
              borderRadius: 2,
              border: `1px solid ${theme.palette.success.main}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CheckCircle sx={{ color: theme.palette.success.main }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                Voice Command Recognized
              </Typography>
              {lastCommand && (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  "{lastCommand.originalText}" → {lastCommand.action.replace('_', ' ').toLowerCase()}
                </Typography>
              )}
            </Box>
            <IconButton size="small" onClick={() => setIsCommandMode(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        {/* Voice Commands Help Dialog */}
        <Dialog
          open={showCommandHelp}
          onClose={() => setShowCommandHelp(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RecordVoiceOver />
            Voice Commands Guide
          </DialogTitle>
          <DialogContent>
            <VoiceCommandsHelp commands={getVoiceCommands()} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCommandHelp(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* Enhanced Voice Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant={isListening ? 'contained' : 'outlined'}
            color={isListening ? 'error' : 'primary'}
            onClick={handleVoiceInputWithCommand}
            disabled={isProcessing}
            startIcon={isListening ? <Stop /> : <Mic />}
            sx={{
              minWidth: 140,
              height: 48,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              boxShadow: isListening ? '0 0 20px rgba(255, 82, 82, 0.4)' : 'none',
              animation: isListening ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' }
              }
            }}
          >
            {isListening ? 'Stop Listening' : 'Voice Input'}
          </Button>

          <Tooltip title="Voice Commands Help">
            <IconButton
              onClick={() => setShowCommandHelp(true)}
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>

          {commandHistory.length > 0 && (
            <Tooltip title="Command History">
              <Chip
                icon={<History />}
                label={`${commandHistory.length} commands`}
                variant="outlined"
                clickable
                onClick={() => {
                  // Show command history in a simple alert for now
                  const recentCommands = commandHistory.slice(-5).map(cmd => cmd.originalText).join('\n');
                  alert(`Recent Commands:\n\n${recentCommands}`);
                }}
                sx={{ fontSize: '0.75rem' }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Box>
  );
};

// Voice Commands Help Component
const VoiceCommandsHelp = ({ commands }) => {
  const theme = useCustomTheme();

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ mb: 3, color: theme.palette.text.secondary }}>
        You can use these natural language voice commands to control the application:
      </Typography>

      {Object.entries(commands).map(([category, examples]) => (
        <Accordion key={category} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
              {category.replace('_', ' ')} Commands
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {examples.map((example, index) => (
                <Chip
                  key={index}
                  label={`"${example}"`}
                  variant="outlined"
                  size="small"
                  sx={{
                    alignSelf: 'flex-start',
                    fontSize: '0.8rem',
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: theme.palette.info.main,
          borderRadius: 2,
          border: `1px solid ${theme.palette.info.main}`
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          💡 Pro Tips:
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          • Speak clearly and naturally<br />
          • You can combine multiple stock symbols: "Compare Apple and Microsoft"<br />
          • Agent names can be partial: "Talk to Warren" switches to Warren Buffett<br />
          • Commands work alongside regular chat - just speak naturally!
        </Typography>
      </Box>
    </Box>
  );
};

export default VoiceAgentInterface;
