import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Divider,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import AgentAvatar from './AgentAvatars';
import agentChatService from '../services/agentChatService';

// Styled components for chat bubbles
const UserMessage = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  maxWidth: '80%',
  borderRadius: '12px 12px 3px 12px',
  alignSelf: 'flex-end',
  fontSize: '0.9rem'
}));

const AgentMessage = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  maxWidth: '80%',
  borderRadius: '12px 12px 12px 3px',
  alignSelf: 'flex-start',
  fontSize: '0.9rem'
}));

// Styled card for agent selection
const AgentCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  transform: selected ? 'translateY(-8px)' : 'none',
  boxShadow: selected ? theme.shadows[8] : theme.shadows[1],
  border: selected ? `2px solid ${theme.palette.primary.main}` : 'none',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

function AgentChatPage() {
  const [selectedAgent, setSelectedAgent] = useState('Warren Buffett Agent');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // Agent data with descriptions, images, and sample questions
  const agentData = {
    'Warren Buffett Agent': {
      name: 'Warren Buffett',
      role: 'Value Investor',
      description: 'Focuses on companies with strong economic moats and consistent earnings.',
      philosophy: 'Buy wonderful companies at fair prices and hold them for the long term.',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Warren_Buffett_KU_Visit.jpg/440px-Warren_Buffett_KU_Visit.jpg',
      color: '#3f51b5',
      sampleQuestions: [
        'What companies have strong economic moats?',
        'How do you evaluate management quality?',
        'What metrics do you use to identify undervalued stocks?',
        'Which industries do you currently favor?',
        'How important is dividend history in your analysis?',
        'What is your approach to market downturns?'
      ]
    },
    'Cathie Wood Agent': {
      name: 'Cathie Wood',
      role: 'Innovation Investor',
      description: 'Focuses on disruptive innovation and emerging technologies.',
      philosophy: 'Invest in companies that are leading technological revolutions.',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Cathie_Wood_-_2021_%28cropped%29.jpg/440px-Cathie_Wood_-_2021_%28cropped%29.jpg',
      color: '#9c27b0',
      sampleQuestions: [
        'Which emerging technologies have the most potential?',
        'What is your view on AI companies?',
        'How do you evaluate pre-profit tech companies?',
        'What metrics matter most for growth stocks?',
        'How do you balance risk in a disruptive innovation portfolio?',
        'Which sectors will see the most disruption in the next decade?'
      ]
    },
    'Ben Graham Agent': {
      name: 'Ben Graham',
      role: 'Value Investing Pioneer',
      description: 'Focuses on stocks with significant margins of safety and intrinsic value.',
      philosophy: 'The intelligent investor is a realist who sells to optimists and buys from pessimists.',
      image: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Benjamin_Graham.jpg/440px-Benjamin_Graham.jpg',
      color: '#2196f3',
      sampleQuestions: [
        'Find stocks trading below their intrinsic value',
        'What companies have a strong margin of safety?',
        'Analyze the value metrics for Coca-Cola',
        'Compare book value to market price for bank stocks',
        'Which industries offer the best value opportunities now?',
        'How can I calculate the intrinsic value of Amazon?'
      ]
    },
    'Technical Analyst': {
      name: 'Technical Analyst',
      role: 'Chart Specialist',
      description: 'Analyzes price patterns and market trends to identify trading opportunities.',
      philosophy: 'The price chart reflects all available information and psychology of market participants.',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop',
      color: '#f44336',
      sampleQuestions: [
        'What chart patterns indicate a bullish reversal?',
        'How reliable are head and shoulders patterns?',
        'Which technical indicators work best for crypto?',
        'Explain the MACD indicator and how to use it',
        'What timeframes do you recommend for day trading?',
        'How do you identify support and resistance levels?'
      ]
    },
    'Fundamental Analysis Agent': {
      name: 'Fundamental Analyst',
      role: 'Business Evaluator',
      description: 'Evaluates companies based on financial statements and business fundamentals.',
      philosophy: 'The value of a business is the sum of all its future cash flows, discounted to present value.',
      image: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=2070&auto=format&fit=crop',
      color: '#4caf50',
      sampleQuestions: [
        'What are the most important financial ratios to analyze?',
        'How do you evaluate a company competitive position?',
        'What red flags should I look for in financial statements?',
        'How important is cash flow vs. earnings?',
        'What is a good P/E ratio for tech companies?',
        'How do you project future growth rates?'
      ]
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Initialize chat with a welcome message when agent changes
  useEffect(() => {
    // Only add welcome message if there are no messages or the last message is not from the current agent
    if (chatHistory.length === 0 || 
        (chatHistory.length > 0 && 
         chatHistory[chatHistory.length - 1].sender === 'user' || 
         chatHistory[chatHistory.length - 1].agent !== selectedAgent)) {
      
      const welcomeMessages = {
        'Warren Buffett Agent': "Hello, I'm Warren Buffett's AI agent. I focus on companies with strong economic moats and consistent earnings. How can I help you with your investment decisions today?",
        'Cathie Wood Agent': "Hi there! I'm Cathie Wood's AI agent. I specialize in disruptive innovation and high-growth opportunities. What emerging technologies are you interested in?",
        'Ben Graham Agent': "Greetings, I'm Ben Graham's AI agent. I focus on finding undervalued companies with strong fundamentals and a margin of safety. What would you like to analyze today?",
        'Technical Analyst': "Welcome! I'm your Technical Analysis agent. I can help you identify patterns, trends, and signals in price charts. Which stocks would you like me to analyze?",
        'Fundamental Analysis Agent': "Hello! I'm your Fundamental Analysis agent. I evaluate companies based on financial statements and business fundamentals. Which company would you like to discuss?"
      };
      
      setChatHistory(prev => [
        ...prev.filter(msg => msg.sender === 'user'),
        {
          sender: 'agent',
          content: welcomeMessages[selectedAgent] || "Hello, I'm your AI investment advisor. How can I help you today?",
          timestamp: new Date(),
          agent: selectedAgent
        }
      ]);
    }
  }, [selectedAgent]);
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = { 
      sender: 'user', 
      content: message, 
      timestamp: new Date() 
    };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Get response from agent chat service
      const response = await agentChatService.sendMessage(
        selectedAgent, 
        message, 
        chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      );
      
      // Add agent response to chat
      const agentResponse = { 
        sender: 'agent', 
        content: response.response, 
        timestamp: new Date(),
        agent: selectedAgent
      };
      setChatHistory(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error('Error getting agent response:', error);
      // Add error message to chat
      const errorResponse = { 
        sender: 'agent', 
        content: 'Sorry, I encountered an error while processing your request. Please try again.', 
        timestamp: new Date(),
        agent: selectedAgent
      };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle selecting an agent from the card grid
  const handleSelectAgent = (agentKey) => {
    setSelectedAgent(agentKey);
  };
  
  return (
    <Box sx={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', maxWidth: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" fontWeight="500" gutterBottom>
        Strategic Investor Agents
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chat with AI agents modeled after famous investors and analysts to get diverse perspectives on your investment questions.
      </Typography>
      
      {/* Agent selection cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {Object.entries(agentData).map(([agentKey, agent]) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={agentKey}>
            <AgentCard 
              selected={selectedAgent === agentKey} 
              onClick={() => handleSelectAgent(agentKey)}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="100"
                  image={agent.image}
                  alt={agent.name}
                  sx={{ objectFit: 'cover' }}
                />
                {selectedAgent === agentKey && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      bgcolor: `${agent.color}22`,
                      borderLeft: `4px solid ${agent.color}`
                    }} 
                  />
                )}
              </Box>
              <CardContent sx={{ p: 1.5, flexGrow: 1, height: '100px', overflow: 'hidden' }}>
                <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 0.25, fontSize: '0.9rem' }}>
                  {agent.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                  {agent.role}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5, lineHeight: 1.3 }}>
                  {agent.description}
                </Typography>
                <Tooltip title={agent.philosophy}>
                  <IconButton size="small" sx={{ p: 0 }}>
                    <InfoIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              </CardContent>
            </AgentCard>
          </Grid>
        ))}
      </Grid>
      
      {/* Main content area - split into two columns on larger screens */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flexGrow: 1 }}>
        {/* Left column - Sample questions */}
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#f8f9fa', 
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.08)',
            display: selectedAgent ? 'block' : 'none',
            width: { xs: '100%', md: '30%' },
            height: { xs: 'auto', md: '100%' },
            maxHeight: { xs: '200px', md: 'none' },
            overflowY: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar 
              sx={{ 
                mr: 1, 
                bgcolor: selectedAgent ? agentData[selectedAgent].color : 'primary.main',
                width: 28, 
                height: 28 
              }}
            >
              {selectedAgent && <AgentAvatar agent={selectedAgent} />}
            </Avatar>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {selectedAgent && `Ask ${agentData[selectedAgent].name}`}
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontSize: '0.75rem', lineHeight: 1.4 }}>
            {selectedAgent && agentData[selectedAgent].philosophy}
          </Typography>
          
          <Divider sx={{ my: 1.5 }} />
          
          <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
            Sample Questions:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selectedAgent && agentData[selectedAgent].sampleQuestions.map((question, index) => (
              <Button 
                key={index}
                variant="text"
                size="small"
                color="primary"
                onClick={() => setMessage(question)}
                sx={{ 
                  justifyContent: 'flex-start',
                  textTransform: 'none', 
                  fontSize: '0.75rem', 
                  py: 0.5,
                  px: 1,
                  fontWeight: 'normal',
                  color: 'text.primary',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  }
                }}
              >
                {question}
              </Button>
            ))}
          </Box>
        </Box>
      
        {/* Right column - Chat container */}
        <Paper 
          elevation={0}
          variant="outlined"
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: 1,
            p: 2,
            overflowY: 'auto',
            mb: 2,
            bgcolor: '#f8f9fa',
            width: { xs: '100%', md: '70%' },
            height: { xs: 'calc(100vh - 450px)', md: '100%' },
          }}
        >
        {/* Agent info banner */}
        {selectedAgent && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 1, 
              mb: 2, 
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.03)'
            }}
          >
            <Avatar 
              sx={{ 
                mr: 1.5, 
                bgcolor: agentData[selectedAgent].color,
                width: 36, 
                height: 36 
              }}
            >
              <AgentAvatar agent={selectedAgent} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                {agentData[selectedAgent].name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {agentData[selectedAgent].role}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Chat messages */}
        {chatHistory.length > 0 ? (
          chatHistory.map((msg, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1.5
              }}
            >
              {msg.sender === 'user' ? (
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <UserMessage>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {msg.content}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7, fontSize: '0.7rem' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </UserMessage>
                  <Avatar sx={{ ml: 0.5, width: 28, height: 28, bgcolor: 'primary.main' }}>
                    <PersonIcon sx={{ fontSize: '0.9rem' }} />
                  </Avatar>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar 
                    sx={{ 
                      mr: 0.5, 
                      width: 28, 
                      height: 28, 
                      bgcolor: msg.agent ? agentData[msg.agent].color : agentData[selectedAgent].color 
                    }}
                  >
                    <AgentAvatar agent={msg.agent || selectedAgent} sx={{ fontSize: '0.9rem' }} />
                  </Avatar>
                  <AgentMessage>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {msg.content}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: '0.7rem' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </AgentMessage>
                </Box>
              )}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
            Select an agent above and start a conversation.
          </Typography>
        )}
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 4, mb: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {agentData[selectedAgent].name} is thinking...
            </Typography>
          </Box>
        )}
        <div ref={chatEndRef} />
        </Paper>
      </Box>
      
      {/* Message input */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask your investment question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          size="small"
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.85rem'
            }
          }}
          disabled={isLoading}
        />
        <Button 
          variant="contained" 
          color="primary" 
          size="small"
          endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
          onClick={handleSendMessage}
          disabled={isLoading || !message.trim()}
          sx={{ borderRadius: 2, textTransform: 'none', py: 1 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default AgentChatPage;
