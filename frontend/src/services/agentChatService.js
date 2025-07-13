import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Enhanced service for agent chat with voice capabilities
const agentChatService = {
  // Send a message to an agent and get a response
  sendMessage: async (agentName, message, chatHistory = [], options = {}) => {
    try {
      // Prepare enhanced request payload for voice mode
      const requestPayload = {
        agent_name: agentName,
        message: message,
        chat_history: chatHistory,
        // Voice-specific parameters
        voice_mode: options.voiceMode || false,
        agent_personality: options.agentPersonality || null,
        response_format: options.voiceMode ? 'conversational' : 'standard',
        max_response_length: options.voiceMode ? 200 : 500, // Shorter responses for voice
        include_personality_cues: options.voiceMode || false
      };

      const response = await axios.post(API_ENDPOINTS.AGENT_CHAT, requestPayload);
      
      // Enhanced response processing for voice mode
      if (options.voiceMode && response.data.message) {
        return {
          ...response.data,
          message: optimizeForSpeech(response.data.message, agentName, options.agentPersonality)
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error sending message to agent:', error);
      // Enhanced fallback with voice support
      return simulateAgentResponse(agentName, message, options);
    }
  },

  // Convenience method for voice interactions
  chatWithAgent: async (agentName, message, options = {}) => {
    return agentChatService.sendMessage(agentName, message, [], {
      voiceMode: true,
      ...options
    });
  },

  // Get agent's voice profile information
  getAgentVoiceProfile: (agentName) => {
    // This could be enhanced to fetch from backend if profiles are stored there
    try {
      const { agentVoiceProfiles } = require('../config/VoicePersonalities');
      return agentVoiceProfiles[agentName] || null;
    } catch (error) {
      console.warn('Voice profiles not available:', error);
      return null;
    }
  }
};

// Optimize response text for natural speech
const optimizeForSpeech = (text, agentName, agentPersonality) => {
  if (!text || !agentPersonality) return text;

  let optimizedText = text;

  // Remove excessive formatting and technical jargon for voice
  optimizedText = optimizedText
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
    .replace(/`(.*?)`/g, '$1')       // Remove code formatting
    .replace(/_{2,}/g, '')           // Remove underscores
    .replace(/#+ /g, '')             // Remove headers
    .replace(/\n{2,}/g, '. ')        // Replace multiple newlines
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();

  // Add personality-specific speech patterns
  if (agentPersonality.catchphrases && agentPersonality.catchphrases.length > 0) {
    const randomCatchphrase = agentPersonality.catchphrases[
      Math.floor(Math.random() * agentPersonality.catchphrases.length)
    ];
    
    // Occasionally add catchphrases (30% chance)
    if (Math.random() < 0.3) {
      optimizedText = `${randomCatchphrase} ${optimizedText}`;
    }
  }

  // Add natural speech patterns based on agent personality
  if (agentPersonality.responsePatterns && agentPersonality.responsePatterns.length > 0) {
    const pattern = agentPersonality.responsePatterns[
      Math.floor(Math.random() * agentPersonality.responsePatterns.length)
    ];
    
    // Sometimes start with response patterns (20% chance)
    if (Math.random() < 0.2) {
      optimizedText = `${pattern} ${optimizedText}`;
    }
  }

  // Ensure response length is appropriate for speech (max 250 words)
  const words = optimizedText.split(' ');
  if (words.length > 250) {
    optimizedText = words.slice(0, 250).join(' ') + '...';
  }

  return optimizedText;
};

// Enhanced simulation with voice support
const simulateAgentResponse = (agentName, message, options = {}) => {
  const lowerCaseMessage = message.toLowerCase();
  
  // Get agent personality for voice mode
  let agentPersonality = null;
  try {
    const { agentVoiceProfiles } = require('../config/VoicePersonalities');
    agentPersonality = agentVoiceProfiles[agentName];
  } catch (error) {
    console.warn('Voice profiles not available for simulation');
  }

  // Enhanced responses with personality
  let response = '';

  if (lowerCaseMessage.includes('stock') || lowerCaseMessage.includes('invest')) {
    const responses = {
      'Warren Buffett Agent': options.voiceMode 
        ? "Well, you know, when I look at a stock, I focus on its intrinsic value. I prefer companies with consistent earnings and strong management. The key is patience."
        : "When I look at a stock, I focus on its intrinsic value and competitive advantage. I prefer companies with consistent earnings, low debt, and strong management. Remember, the stock market is a device for transferring money from the impatient to the patient.",
      
      'Cathie Wood Agent': options.voiceMode
        ? "This is incredibly exciting! I look for disruptive innovation and exponential growth. Companies in AI, genomics, and robotics have tremendous potential."
        : "I look for disruptive innovation and exponential growth opportunities. Companies leading in areas like AI, genomics, robotics, and blockchain have tremendous potential. The key is to identify technologies that will change the world in the next 5-10 years.",
      
      'Ben Graham Agent': options.voiceMode
        ? "The numbers don't lie. I always emphasize margin of safety. Look for stocks trading below their intrinsic value with strong balance sheets."
        : "I always emphasize margin of safety. Look for stocks trading below their intrinsic value, with strong balance sheets and consistent earnings. Remember, investment is most intelligent when it is most businesslike.",
      
      'Technical Analyst': options.voiceMode
        ? "The charts are telling us about price patterns and momentum indicators. I'm seeing key support and resistance levels that could guide your decisions."
        : "I'd analyze the price patterns, moving averages, and momentum indicators for this stock. The current chart shows key support and resistance levels that could inform your entry and exit points.",
      
      'Fundamental Analysis Agent': options.voiceMode
        ? "The financials reveal the business health. Let's examine the P/E ratio, debt-to-equity, and free cash flow to determine fair value."
        : "Let's examine the company's financial statements, particularly the P/E ratio, debt-to-equity ratio, and free cash flow. These metrics will help us determine if the stock is fairly valued."
    };
    
    response = responses[agentName] || (options.voiceMode 
      ? "That's interesting. Let me analyze that for you."
      : "That's an interesting question about stocks. Let me analyze that for you...");
  } 
  else if (lowerCaseMessage.includes('market') || lowerCaseMessage.includes('economy')) {
    const responses = {
      'Warren Buffett Agent': options.voiceMode
        ? "In my experience, be fearful when others are greedy, and greedy when others are fearful. Focus on buying wonderful companies at fair prices."
        : "Be fearful when others are greedy, and greedy when others are fearful. Market timing is futile - focus on buying wonderful companies at fair prices instead of trying to predict short-term market movements.",
      
      'Cathie Wood Agent': options.voiceMode
        ? "The future is here! We're seeing several innovation platforms transform the global economy. Short-term volatility is just noise."
        : "I believe we're in the midst of several innovation platforms that will transform the global economy. Short-term market volatility is noise - the long-term trajectory of innovative technologies is upward.",
      
      'Ben Graham Agent': options.voiceMode
        ? "Based on my analysis, the market is a voting machine short-term, but a weighing machine long-term. Focus on intrinsic value."
        : "The market is a voting machine in the short run, but a weighing machine in the long run. Focus on the intrinsic value of businesses rather than market sentiment.",
      
      'Technical Analyst': options.voiceMode
        ? "Price action indicates market trends through various indicators. I'm currently seeing patterns that suggest momentum in the indices."
        : "Market trends can be identified through various technical indicators. Currently, I'm seeing patterns that suggest [bullish/bearish] momentum in the broader indices.",
      
      'Fundamental Analysis Agent': options.voiceMode
        ? "Fundamental metrics like the Shiller PE ratio give insights into market valuation. Let me analyze the current levels."
        : "The overall market valuation metrics like the Shiller PE ratio and total market cap to GDP can give us insights into whether the market as a whole is overvalued or undervalued."
    };
    
    response = responses[agentName] || (options.voiceMode
      ? "The market is complex. Here's my analysis."
      : "The market is a complex system influenced by many factors. Here's my analysis...");
  }
  else {
    // Generic responses with personality
    if (agentPersonality && options.voiceMode) {
      const greeting = agentPersonality.conversationStyle?.greeting || `Hello! ${agentName} here.`;
      response = `${greeting} Could you tell me more about what you'd like to know?`;
    } else {
      response = "I'd be happy to help you with your investment questions. Could you provide more details about what you're looking for?";
    }
  }

  // Apply speech optimization if in voice mode
  if (options.voiceMode && agentPersonality) {
    response = optimizeForSpeech(response, agentName, agentPersonality);
  }

  return { 
    message: response,
    agent: agentName,
    timestamp: new Date().toISOString(),
    voice_optimized: options.voiceMode || false
  };
};

// Export both the service and individual functions
export { agentChatService as default, optimizeForSpeech };
export const chatWithAgent = agentChatService.chatWithAgent;
