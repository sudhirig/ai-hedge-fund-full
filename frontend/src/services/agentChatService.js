import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// This service will handle communication with the backend for agent chat
const agentChatService = {
  // Send a message to an agent and get a response
  sendMessage: async (agentName, message, chatHistory) => {
    try {
      // Use the actual backend API
      const response = await axios.post(API_ENDPOINTS.AGENT_CHAT, {
        agent_name: agentName,
        message: message,
        chat_history: chatHistory
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to agent:', error);
      // If there's an error with the API, fall back to simulated responses
      return simulateAgentResponse(agentName, message);
    }
  }
};

// Simulate agent responses (this will be replaced by the backend)
const simulateAgentResponse = (agentName, message) => {
  const lowerCaseMessage = message.toLowerCase();
  
  // Very basic pattern matching for demonstration
  if (lowerCaseMessage.includes('stock') || lowerCaseMessage.includes('invest')) {
    const responses = {
      'Warren Buffett Agent': "When I look at a stock, I focus on its intrinsic value and competitive advantage. I prefer companies with consistent earnings, low debt, and strong management. Remember, the stock market is a device for transferring money from the impatient to the patient.",
      'Cathie Wood Agent': "I look for disruptive innovation and exponential growth opportunities. Companies leading in areas like AI, genomics, robotics, and blockchain have tremendous potential. The key is to identify technologies that will change the world in the next 5-10 years.",
      'Ben Graham Agent': "I always emphasize margin of safety. Look for stocks trading below their intrinsic value, with strong balance sheets and consistent earnings. Remember, investment is most intelligent when it is most businesslike.",
      'Technical Analyst': "I'd analyze the price patterns, moving averages, and momentum indicators for this stock. The current chart shows key support and resistance levels that could inform your entry and exit points.",
      'Fundamental Analysis Agent': "Let's examine the company's financial statements, particularly the P/E ratio, debt-to-equity ratio, and free cash flow. These metrics will help us determine if the stock is fairly valued."
    };
    return { response: responses[agentName] || "That's an interesting question about stocks. Let me analyze that for you..." };
  }
  
  if (lowerCaseMessage.includes('market') || lowerCaseMessage.includes('economy')) {
    const responses = {
      'Warren Buffett Agent': "Be fearful when others are greedy, and greedy when others are fearful. Market timing is futile - focus on buying wonderful companies at fair prices instead of trying to predict short-term market movements.",
      'Cathie Wood Agent': "I believe we're in the midst of several innovation platforms that will transform the global economy. Short-term market volatility is noise - the long-term trajectory of innovative technologies is upward.",
      'Ben Graham Agent': "The market is a voting machine in the short run, but a weighing machine in the long run. Focus on the intrinsic value of businesses rather than market sentiment.",
      'Technical Analyst': "Market trends can be identified through various technical indicators. Currently, I'm seeing patterns that suggest [bullish/bearish] momentum in the broader indices.",
      'Fundamental Analysis Agent': "The overall market valuation metrics like the Shiller PE ratio and total market cap to GDP can give us insights into whether the market as a whole is overvalued or undervalued."
    };
    return { response: responses[agentName] || "The market is a complex system influenced by many factors. Here's my analysis..." };
  }
  
  // Default responses
  const defaultResponses = {
    'Warren Buffett Agent': "I focus on long-term value investing. The best investments are in companies with strong economic moats, consistent earnings, and good management that you can hold for decades.",
    'Cathie Wood Agent': "I'm looking for companies at the forefront of disruptive innovation that will change the way the world works. These high-growth opportunities often come with volatility, but the long-term potential is tremendous.",
    'Ben Graham Agent': "As a value investor, I always look for a margin of safety. The intelligent investor is a realist who sells to optimists and buys from pessimists.",
    'Technical Analyst': "I focus on price patterns and market trends rather than company fundamentals. The charts often reveal information that isn't yet reflected in the fundamentals.",
    'Fundamental Analysis Agent': "I believe in thorough analysis of financial statements and business models. Understanding the numbers behind a company is essential for making informed investment decisions."
  };
  
  return { response: defaultResponses[agentName] || "That's an interesting question. Let me analyze that from my investment perspective..." };
};

export default agentChatService;
