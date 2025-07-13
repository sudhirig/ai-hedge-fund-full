// VoiceAgentInterface.js - Enhanced Voice-Enabled Agent Chat Interface
// Integrates speech-to-text, text-to-speech, and agent personality-driven conversations

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Collapse,
  FormControl,
  FormControlLabel,
  Switch,
  Slider,
  Select,
  InputLabel
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  Send,
  Settings,
  PlayArrow,
  Pause,
  Stop,
  QuestionAnswer,
  Psychology,
  Lightbulb,
  RecordVoiceOver,
  GraphicEq,
  Tune
} from '@mui/icons-material';
import { useCustomTheme } from '../../theme/ThemeProvider';
import { AgentAvatar } from '../shared/AgentAvatar';
import { agentVoiceProfiles, getAgentVoice, getVoiceSettings, getConversationStarters } from '../../config/VoicePersonalities';
import { agentChatCues, getConversationStarters as getChatStarters, getVoicePrompts, getSampleConversations } from '../../config/AgentChatCues';
import { chatWithAgent } from '../../services/agentChatService';

const VoiceAgentInterface = ({ 
  selectedAgent, 
  onAgentChange, 
  analysisResults,
  availableAgents = []
}) => {
  const { currentTheme } = useCustomTheme();
  
  // Voice and chat state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });
  
  // UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCues, setShowCues] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  
  // Refs
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const conversationEndRef = useRef(null);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
        
        if (finalTranscript) {
          handleVoiceInput(finalTranscript.trim());
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setTranscript('');
      };
    }
    
    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        const voices = synthesisRef.current.getVoices();
        setAvailableVoices(voices);
        
        // Set default voice based on agent profile
        if (selectedAgent && voices.length > 0) {
          const agentVoice = getAgentVoice(selectedAgent);
          setSelectedVoice(agentVoice || voices[0]);
        }
      };
      
      loadVoices();
      synthesisRef.current.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [selectedAgent]);
  
  // Update voice settings when agent changes
  useEffect(() => {
    if (selectedAgent) {
      const agentSettings = getVoiceSettings(selectedAgent);
      setVoiceSettings(prev => ({
        ...prev,
        rate: agentSettings.speed || 1.0,
        pitch: agentSettings.pitch === 'lower' ? 0.8 : 
               agentSettings.pitch === 'higher' ? 1.2 : 1.0,
        volume: agentSettings.volume || 0.8
      }));
      
      // Update selected voice
      if (availableVoices.length > 0) {
        const agentVoice = getAgentVoice(selectedAgent);
        setSelectedVoice(agentVoice || availableVoices[0]);
      }
    }
  }, [selectedAgent, availableVoices]);
  
  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);
  
  // Voice input handler
  const handleVoiceInput = useCallback(async (text) => {
    if (!text.trim() || !selectedAgent) return;
    
    setIsProcessing(true);
    
    // Add user message to conversation
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      isVoice: true
    };
    
    setConversation(prev => [...prev, userMessage]);
    
    try {
      // Get agent response
      const response = await chatWithAgent(selectedAgent, text, {
        voiceMode: true,
        agentPersonality: agentVoiceProfiles[selectedAgent]?.personality
      });
      
      const agentMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: response.message,
        timestamp: new Date(),
        isVoice: true,
        agentName: selectedAgent
      };
      
      setConversation(prev => [...prev, agentMessage]);
      
      // Speak the response if auto-speak is enabled
      if (autoSpeak && voiceEnabled) {
        speakText(response.message);
      }
      
    } catch (error) {
      console.error('Error getting agent response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAgent, autoSpeak, voiceEnabled]);
  
  // Text-to-speech function
  const speakText = useCallback((text) => {
    if (!synthesisRef.current || !selectedVoice || !voiceEnabled) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  }, [selectedVoice, voiceSettings, voiceEnabled]);
  
  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Handle text input
  const handleTextInput = async () => {
    if (!inputText.trim()) return;
    
    await handleVoiceInput(inputText);
    setInputText('');
  };
  
  // Get current agent profile
  const agentProfile = selectedAgent ? agentVoiceProfiles[selectedAgent] : null;
  const chatCues = selectedAgent ? agentChatCues[selectedAgent] : null;
  
  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: currentTheme.colors.background.primary,
      color: currentTheme.colors.text.primary
    }}>
      {/* Header */}
      <Paper sx={{ 
        p: 2, 
        borderRadius: 0,
        bgcolor: currentTheme.colors.background.secondary,
        borderBottom: `1px solid ${currentTheme.colors.border}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedAgent && (
              <>
                <AgentAvatar agent={selectedAgent} size="large" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedAgent}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {agentProfile?.personality.tone || 'AI Financial Agent'}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Voice Settings">
              <IconButton 
                onClick={(e) => setSettingsAnchor(e.currentTarget)}
                sx={{ color: currentTheme.colors.accent }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={voiceEnabled ? "Disable Voice" : "Enable Voice"}>
              <IconButton 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                sx={{ color: voiceEnabled ? currentTheme.colors.success : currentTheme.colors.text.secondary }}
              >
                {voiceEnabled ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Voice Status */}
        {(isListening || isSpeaking || isProcessing) && (
          <Box sx={{ mt: 2 }}>
            {isListening && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GraphicEq sx={{ color: currentTheme.colors.success, animation: 'pulse 1s infinite' }} />
                <Typography variant="body2" color="success">
                  Listening... {transcript && `"${transcript}"`}
                </Typography>
              </Box>
            )}
            
            {isSpeaking && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RecordVoiceOver sx={{ color: currentTheme.colors.accent }} />
                <Typography variant="body2">Agent is speaking...</Typography>
                <Button size="small" onClick={stopSpeaking} startIcon={<Stop />}>
                  Stop
                </Button>
              </Box>
            )}
            
            {isProcessing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress sx={{ flex: 1 }} />
                <Typography variant="body2">Processing...</Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Conversation Cues */}
      <Collapse in={showCues && chatCues}>
        <Paper sx={{ 
          m: 2, 
          p: 2, 
          bgcolor: currentTheme.colors.background.secondary,
          border: `1px solid ${currentTheme.colors.border}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb sx={{ color: currentTheme.colors.accent }} />
              Conversation Starters
            </Typography>
            <IconButton size="small" onClick={() => setShowCues(false)}>
              <Stop />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {getChatStarters(selectedAgent).slice(0, 3).map((starter, index) => (
              <Chip
                key={index}
                label={starter}
                onClick={() => handleVoiceInput(starter)}
                sx={{ 
                  bgcolor: currentTheme.colors.accent + '20',
                  color: currentTheme.colors.accent,
                  '&:hover': { bgcolor: currentTheme.colors.accent + '40' }
                }}
              />
            ))}
          </Box>
        </Paper>
      </Collapse>
      
      {/* Conversation Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {conversation.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Psychology sx={{ fontSize: 64, color: currentTheme.colors.text.secondary, mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              Start a conversation with {selectedAgent}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {agentProfile?.conversationStyle.greeting || "Click the microphone to speak or type a message below"}
            </Typography>
          </Box>
        ) : (
          conversation.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Card sx={{
                maxWidth: '70%',
                bgcolor: message.type === 'user' 
                  ? currentTheme.colors.accent 
                  : message.type === 'error'
                  ? currentTheme.colors.error + '20'
                  : currentTheme.colors.background.secondary,
                color: message.type === 'user' ? 'white' : currentTheme.colors.text.primary
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {message.type === 'agent' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AgentAvatar agent={message.agentName} size="small" />
                      <Typography variant="caption" color="textSecondary">
                        {message.agentName}
                      </Typography>
                      {message.isVoice && (
                        <Chip size="small" icon={<RecordVoiceOver />} label="Voice" />
                      )}
                    </Box>
                  )}
                  
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                  
                  {message.type === 'agent' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => speakText(message.content)}
                        disabled={!voiceEnabled}
                      >
                        <VolumeUp />
                      </IconButton>
                      <Typography variant="caption" color="textSecondary">
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))
        )}
        <div ref={conversationEndRef} />
      </Box>
      
      {/* Input Area */}
      <Paper sx={{ 
        p: 2, 
        borderRadius: 0,
        bgcolor: currentTheme.colors.background.secondary,
        borderTop: `1px solid ${currentTheme.colors.border}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or use voice..."
            onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
            disabled={isProcessing}
          />
          
          <IconButton 
            onClick={handleTextInput}
            disabled={!inputText.trim() || isProcessing}
            sx={{ color: currentTheme.colors.accent }}
          >
            <Send />
          </IconButton>
          
          <Fab
            color={isListening ? "secondary" : "primary"}
            onClick={toggleListening}
            disabled={!voiceEnabled || isProcessing}
            sx={{ 
              bgcolor: isListening ? currentTheme.colors.error : currentTheme.colors.accent,
              '&:hover': { 
                bgcolor: isListening ? currentTheme.colors.error + 'CC' : currentTheme.colors.accent + 'CC' 
              }
            }}
          >
            {isListening ? <MicOff /> : <Mic />}
          </Fab>
        </Box>
      </Paper>
      
      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        PaperProps={{ sx: { minWidth: 300 } }}
      >
        <MenuItem disabled>
          <ListItemIcon><Tune /></ListItemIcon>
          <ListItemText primary="Voice Settings" />
        </MenuItem>
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
              />
            }
            label="Auto-speak responses"
          />
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Speech Rate: {voiceSettings.rate.toFixed(1)}
          </Typography>
          <Slider
            value={voiceSettings.rate}
            onChange={(_, value) => setVoiceSettings(prev => ({ ...prev, rate: value }))}
            min={0.5}
            max={2.0}
            step={0.1}
          />
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Pitch: {voiceSettings.pitch.toFixed(1)}
          </Typography>
          <Slider
            value={voiceSettings.pitch}
            onChange={(_, value) => setVoiceSettings(prev => ({ ...prev, pitch: value }))}
            min={0.5}
            max={2.0}
            step={0.1}
          />
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Volume: {voiceSettings.volume.toFixed(1)}
          </Typography>
          <Slider
            value={voiceSettings.volume}
            onChange={(_, value) => setVoiceSettings(prev => ({ ...prev, volume: value }))}
            min={0.1}
            max={1.0}
            step={0.1}
          />
          
          {availableVoices.length > 0 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Voice</InputLabel>
              <Select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find(v => v.name === e.target.value);
                  setSelectedVoice(voice);
                }}
              >
                {availableVoices.map((voice) => (
                  <MenuItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Menu>
    </Box>
  );
};

export default VoiceAgentInterface;
