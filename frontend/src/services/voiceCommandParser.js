// Voice Command Parser - Natural language processing for trading commands
import { agentVoiceProfiles } from '../config/VoicePersonalities';

class VoiceCommandParser {
  constructor() {
    // Command patterns and their corresponding actions
    this.commandPatterns = [
      // Analysis Commands - Fixed parameter extraction
      { pattern: /^(analyze|analysis|check|look at|examine)\s+(.+)$/i, action: 'ANALYZE_STOCK', extract: ['stock'] },
      { pattern: /^(run analysis|do analysis|perform analysis)\s+(?:on|for)\s+(.+)$/i, action: 'ANALYZE_STOCK', extract: ['stock'] },
      { pattern: /^what do you think about\s+(.+)\??$/i, action: 'ANALYZE_STOCK', extract: ['stock'] },
      { pattern: /^(?:get|show|give)\s+(?:me\s+)?(?:an?\s+)?(?:analysis|opinion|view)\s+(?:on|of|for)\s+(.+)$/i, action: 'ANALYZE_STOCK', extract: ['stock'] },

      // Portfolio Commands - More specific patterns to avoid conflicts
      { pattern: /^(?:show|display|view|open)\s+(?:my\s+)?portfolio$/i, action: 'SHOW_PORTFOLIO', extract: [] },
      { pattern: /^(?:what.?s in my portfolio|my holdings|portfolio summary|portfolio overview)$/i, action: 'SHOW_PORTFOLIO', extract: [] },
      { pattern: /^(?:portfolio|holdings|positions)$/i, action: 'SHOW_PORTFOLIO', extract: [] },
      { pattern: /^what.?s\s+(?:in\s+)?(?:my\s+)?portfolio\??$/i, action: 'SHOW_PORTFOLIO', extract: [] },

      // Agent Commands - Better agent name extraction
      { pattern: /^(?:talk to|switch to|change to|select)\s+(.+?)(?:\s+agent)?$/i, action: 'SWITCH_AGENT', extract: ['agent'] },
      { pattern: /^(?:get opinion from|ask)\s+(.+?)(?:\s+agent)?$/i, action: 'SWITCH_AGENT', extract: ['agent'] },

      // Market Commands
      { pattern: /^(?:what.?s the market|market overview|how.?s the market|market status|market update).*$/i, action: 'SHOW_MARKET', extract: [] },

      // Trading Decision Commands - Fixed stock extraction
      { pattern: /^should i (?:buy|purchase)\s+(.+)\??$/i, action: 'GET_BUY_RECOMMENDATION', extract: ['stock'] },
      { pattern: /^is\s+(.+?)\s+a\s+(buy|sell)\??$/i, action: 'GET_RECOMMENDATION', extract: ['stock', 'action'] },
      { pattern: /^(?:buy|sell)\s+recommendation\s+(?:for|on)\s+(.+)$/i, action: 'GET_RECOMMENDATION', extract: ['stock'] },

      // Comparison Commands - Fixed to extract both stocks properly
      { pattern: /^compare\s+(.+?)\s+(?:and|vs|versus)\s+(.+)$/i, action: 'COMPARE_STOCKS', extract: ['stock1', 'stock2'] },

      // Navigation Commands
      { pattern: /^(?:show|display|open|go to)\s+(charts?|dashboard|portfolio view|portfolio)$/i, action: 'NAVIGATE', extract: ['destination'] },

      // Help Commands - More specific to avoid conflicts
      { pattern: /^(?:help|what can you do|voice commands|commands|show commands)$/i, action: 'SHOW_HELP', extract: [] }
    ];

    // Stock symbols dictionary for better recognition
    this.stockSymbols = new Map([
      ['AAPL', 'AAPL'],
      ['MSFT', 'MSFT'],
      ['GOOGL', 'GOOGL'],
      ['GOOG', 'GOOGL'],
      ['AMZN', 'AMZN'],
      ['TSLA', 'TSLA'],
      ['META', 'META'],
      ['NVDA', 'NVDA'],
      ['JPM', 'JPM'],
      ['JNJ', 'JNJ'],
      ['V', 'V'],
      ['PG', 'PG'],
      ['UNH', 'UNH'],
      ['HD', 'HD'],
      ['DIS', 'DIS'],
      ['MA', 'MA'],
      ['PYPL', 'PYPL'],
      ['ADBE', 'ADBE'],
      ['NFLX', 'NFLX'],
      ['CRM', 'CRM'],
      ['INTC', 'INTC'],
      ['AMD', 'AMD'],
      ['ORCL', 'ORCL'],
      ['IBM', 'IBM'],
      ['CSCO', 'CSCO']
    ]);

    // Agent names for better matching
    this.agentNames = Object.keys(agentVoiceProfiles);
  }

  // Parse voice command and extract intent
  parseCommand(input) {
    if (!input || typeof input !== 'string') return null;
    
    const cleaned = input.trim();
    if (cleaned.length === 0) return null;

    for (const { pattern, action, extract } of this.commandPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const parameters = {};
        
        extract.forEach((param, index) => {
          let value;
          // For patterns with multiple capture groups, adjust indexing
          if (extract.length === 1) {
            value = match[2] || match[1]; // Try second capture group first, then first
          } else if (extract.length === 2) {
            if (index === 0) {
              value = match[1]; // First parameter from first capture group
            } else {
              value = match[2]; // Second parameter from second capture group
            }
          } else {
            value = match[index + 1]; // Default behavior
          }
          
          if (value) {
            if (param === 'stock' || param === 'stock1' || param === 'stock2') {
              parameters[param] = this.normalizeStock(value);
            } else if (param === 'agent') {
              parameters[param] = this.normalizeAgent(value);
            } else {
              parameters[param] = value;
            }
          }
        });

        const confidence = this.calculateConfidence(match, parameters, extract);
        
        return {
          action,
          parameters,
          confidence,
          originalInput: input,
          matchedPattern: pattern.source
        };
      }
    }

    return this.parseContextually(input);
  }

  // Extract parameters based on command type
  extractParameters(match, extract) {
    const parameters = {};
    
    for (const param of extract) {
      parameters[param] = match[extract.indexOf(param) + 1];
    }
    
    return parameters;
  }

  // Normalize stock symbol (handle common variations)
  normalizeStock(input) {
    if (!input) return null;
    
    const cleaned = input.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    
    // Handle multi-word company names first
    const fullName = cleaned.replace(/\s+/g, '');
    if (this.stockSymbols.has(fullName)) {
      return this.stockSymbols.get(fullName);
    }
    
    // Check each word for company names
    const words = cleaned.split(/\s+/);
    for (const word of words) {
      if (this.stockSymbols.has(word)) {
        return this.stockSymbols.get(word);
      }
    }
    
    // Check if it's already a stock symbol (1-5 letters) but exclude common action words
    const actionWords = ['buy', 'sell', 'hold', 'get', 'show', 'run', 'do', 'go', 'open', 'view', 'help'];
    if (cleaned.match(/^[a-z]{1,5}$/) && !actionWords.includes(cleaned)) {
      return cleaned.toUpperCase();
    }
    
    // Return original input as uppercase if no match found and not an action word
    if (!actionWords.includes(cleaned.toLowerCase())) {
      return input.trim().toUpperCase();
    }
    
    return null;
  }

  // Normalize agent name for better matching
  normalizeAgent(input) {
    if (!input) return null;
    
    const cleaned = input.toLowerCase().trim().replace(/[^a-z\s]/g, '');
    
    // Check for exact matches first
    for (const [key, value] of this.agentNames) {
      if (cleaned === key || cleaned.includes(key)) {
        return value;
      }
    }
    
    // Check for partial matches in agent profile names
    for (const [profileId, profile] of Object.entries(agentVoiceProfiles)) {
      const profileName = profile.name.toLowerCase();
      if (profileName.includes(cleaned) || cleaned.includes(profileName.split(' ')[0])) {
        return profileId;
      }
    }
    
    return null;
  }

  // Calculate confidence score for the match
  calculateConfidence(match, parameters, extract) {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for exact matches
    if (match[0].length === match.input.length) {
      confidence += 0.2;
    }
    
    // Higher confidence for stock symbol matches
    if (match[1] && this.stockSymbols.has(match[1].toUpperCase())) {
      confidence += 0.1;
    }
    
    // Pattern complexity bonus
    if (extract.length > 1) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Validate command parameters
  validateCommand(command) {
    switch (command.action) {
      case 'ANALYZE_STOCK':
      case 'GET_BUY_RECOMMENDATION':
      case 'GET_RECOMMENDATION':
        return command.parameters.stock && command.parameters.stock.length <= 5;
        
      case 'COMPARE_STOCKS':
        return command.parameters.stock1 && command.parameters.stock2;
        
      case 'SWITCH_AGENT':
        return command.parameters.agent;
        
      default:
        return true; // Other commands don't require specific validation
    }
  }

  // Parse contextual commands when no pattern matches
  parseContextually(input) {
    const words = input.toLowerCase().split(/\s+/);
    
    // Check for help-related terms
    if (words.some(w => ['help', 'commands', 'what', 'can', 'do'].includes(w))) {
      if (words.includes('help') || (words.includes('what') && words.includes('can'))) {
        return {
          action: 'SHOW_HELP',
          parameters: {},
          confidence: 0.7,
          originalInput: input,
          matchedPattern: 'contextual-help'
        };
      }
    }
    
    // Check for portfolio-related terms first (higher priority)
    if (words.some(w => ['portfolio', 'holdings', 'positions'].includes(w))) {
      return {
        action: 'SHOW_PORTFOLIO', 
        parameters: {},
        confidence: 0.65,
        originalInput: input,
        matchedPattern: 'contextual-portfolio'
      };
    }
    
    // Check for stock mentions - improved to find actual stock names before action words
    const stockMentions = [];
    for (const word of words) {
      const stock = this.normalizeStock(word);
      if (stock && (this.stockSymbols.has(word) || word.match(/^[a-z]{1,5}$/))) {
        stockMentions.push(stock);
      }
    }
    
    // If we found stock mentions, determine action based on context
    if (stockMentions.length > 0) {
      const primaryStock = stockMentions[0]; // Use first stock found
      
      // Determine action based on context
      if (words.some(w => ['buy', 'purchase', 'should'].includes(w))) {
        return {
          action: 'GET_BUY_RECOMMENDATION',
          parameters: { stock: primaryStock },
          confidence: 0.65,
          originalInput: input,
          matchedPattern: 'contextual-buy'
        };
      } else if (words.some(w => ['sell', 'dump', 'exit'].includes(w))) {
        return {
          action: 'GET_RECOMMENDATION',
          parameters: { stock: primaryStock, action: 'sell' },
          confidence: 0.65,
          originalInput: input,
          matchedPattern: 'contextual-sell'
        };
      } else {
        return {
          action: 'ANALYZE_STOCK',
          parameters: { stock: primaryStock },
          confidence: 0.6,
          originalInput: input,
          matchedPattern: 'contextual-analyze'
        };
      }
    }
    
    // Check for agent mentions
    for (const word of words) {
      const agent = this.normalizeAgent(word);
      if (agent) {
        return {
          action: 'SWITCH_AGENT',
          parameters: { agent },
          confidence: 0.65,
          originalInput: input,
          matchedPattern: 'contextual-agent'
        };
      }
    }
    
    return null;
  }

  // Get available commands for help
  getAvailableCommands() {
    return {
      analysis: [
        "Analyze AAPL",
        "Run analysis on Microsoft",
        "What do you think about Tesla?"
      ],
      portfolio: [
        "Show my portfolio",
        "What's in my portfolio?",
        "Portfolio summary"
      ],
      agent: [
        "Talk to Warren Buffett",
        "Switch to Cathie Wood",
        "Get opinion from technical analyst"
      ],
      market: [
        "What's the market doing?",
        "Market overview",
        "How is the market?"
      ],
      trading: [
        "Should I buy Apple?",
        "Is Tesla a sell?",
        "Compare Apple vs Microsoft"
      ],
      navigation: [
        "Show charts",
        "Go to dashboard",
        "Open portfolio view"
      ]
    };
  }

  // Generate response text for a command
  getResponse(action) {
    switch (action) {
      case 'ANALYZE_STOCK':
        return (symbol) => `Analyzing ${symbol}... Let me gather insights from all agents.`;
      case 'SHOW_PORTFOLIO':
        return () => 'Here\'s your current portfolio overview.';
      case 'SWITCH_AGENT':
        return (agent) => `Switching to ${agent}. How can they help you today?`;
      case 'SHOW_MARKET':
        return () => 'Here\'s the current market overview.';
      case 'GET_BUY_RECOMMENDATION':
        return (symbol) => `Let me check the buy signals for ${symbol}.`;
      case 'GET_RECOMMENDATION':
        return (symbol, action) => `Analyzing ${action} signals for ${symbol}.`;
      case 'COMPARE_STOCKS':
        return (symbol1, symbol2) => `Comparing ${symbol1} and ${symbol2} across all metrics.`;
      case 'SHOW_HELP':
        return () => 'Here are the voice commands you can use.';
      case 'NAVIGATE':
        return (destination) => `Navigating to ${destination}.`;
      default:
        return () => 'I didn\'t understand that command. Try saying "help" for available commands.';
    }
  }
}

// Create and export singleton instance
const voiceCommandParser = new VoiceCommandParser();

export default voiceCommandParser;

// Export class for testing or multiple instances
export { VoiceCommandParser };
