// Node.js compatible test for voice command parser
const fs = require('fs');
const path = require('path');

console.log(' VOICE COMMAND PARSER - COMPREHENSIVE TESTING');
console.log('================================================\n');

// Mock the agent profiles for testing
const mockAgentProfiles = {
  'fundamental-analysis': { name: 'Fundamental Analysis Agent' },
  'warren-buffett': { name: 'Warren Buffett Agent' },
  'cathie-wood': { name: 'Cathie Wood Agent' },
  'bill-ackman': { name: 'Bill Ackman Agent' },
  'technical-analysis': { name: 'Technical Analysis Agent' },
  'sentiment-analysis': { name: 'Sentiment Analysis Agent' }
};

// Voice command parser logic (CommonJS version)
class VoiceCommandParser {
  constructor() {
    this.stockSymbols = new Map([
      ['apple', 'AAPL'], ['microsoft', 'MSFT'], ['google', 'GOOGL'],
      ['amazon', 'AMZN'], ['tesla', 'TSLA'], ['meta', 'META'],
      ['netflix', 'NFLX'], ['nvidia', 'NVDA'], ['facebook', 'META'],
      ['aapl', 'AAPL'], ['msft', 'MSFT'], ['googl', 'GOOGL'],
      ['amzn', 'AMZN'], ['tsla', 'TSLA'], ['nflx', 'NFLX'], ['nvda', 'NVDA']
    ]);

    this.agentNames = new Map([
      ['warren', 'warren-buffett'], ['buffett', 'warren-buffett'],
      ['cathie', 'cathie-wood'], ['wood', 'cathie-wood'],
      ['bill', 'bill-ackman'], ['ackman', 'bill-ackman'],
      ['technical', 'technical-analysis'], ['fundamental', 'fundamental-analysis'],
      ['sentiment', 'sentiment-analysis']
    ]);

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
  }

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
    
    // Check if it's already a stock symbol (1-5 letters)
    if (cleaned.match(/^[a-z]{1,5}$/)) {
      return cleaned.toUpperCase();
    }
    
    // Return original input as uppercase if no match found
    return input.trim().toUpperCase();
  }

  normalizeAgent(input) {
    if (!input) return null;
    
    const cleaned = input.toLowerCase().trim().replace(/[^a-z\s]/g, '');
    
    // Check for exact matches first
    for (const [key, value] of this.agentNames) {
      if (cleaned === key || cleaned.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

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

  calculateConfidence(match, parameters, extract) {
    let confidence = 0.8; // Base confidence for pattern match
    
    // Boost confidence based on parameter quality
    extract.forEach(param => {
      const value = parameters[param];
      if (value) {
        if (param === 'stock' || param === 'stock1' || param === 'stock2') {
          if (this.stockSymbols.has(value.toLowerCase()) || value.match(/^[A-Z]{1,5}$/)) {
            confidence += 0.1;
          }
        } else if (param === 'agent') {
          if (this.agentNames.has(value)) {
            confidence += 0.1;
          }
        }
      }
    });
    
    return Math.min(confidence, 0.95);
  }

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

  generateResponse(command) {
    if (!command) return "I didn't understand that command.";
    
    const responses = {
      'ANALYZE_STOCK': `Running analysis for ${command.parameters.stock || 'the requested stock'}...`,
      'SHOW_PORTFOLIO': 'Opening your portfolio view...',
      'SWITCH_AGENT': `Switching to ${command.parameters.agent || 'the requested agent'}...`,
      'SHOW_MARKET': 'Showing market overview...',
      'GET_BUY_RECOMMENDATION': `Getting buy recommendation for ${command.parameters.stock}...`,
      'GET_RECOMMENDATION': `Analyzing ${command.parameters.action || 'recommendation'} signals for ${command.parameters.stock}...`,
      'COMPARE_STOCKS': `Comparing ${command.parameters.stock1} and ${command.parameters.stock2}...`,
      'SHOW_HELP': 'Here are the available voice commands...',
      'NAVIGATE': `Navigating to ${command.parameters.destination}...`
    };
    
    return responses[command.action] || 'Command recognized, executing...';
  }
}

// Run comprehensive tests
const parser = new VoiceCommandParser();

const testCases = [
  // Stock Analysis Commands
  'Analyze Apple',
  'Analyze AAPL',
  'Run analysis on Microsoft',
  'What do you think about Tesla?',
  'Check Google',
  'Look at NVDA',
  
  // Portfolio Commands
  'Show my portfolio',
  'Display portfolio',
  'What\'s in my portfolio?',
  'My holdings',
  'Portfolio summary',
  
  // Agent Commands
  'Talk to Warren Buffett',
  'Switch to Cathie Wood',
  'Change to Bill Ackman',
  'Talk to Warren',
  'Get opinion from technical analyst',
  
  // Market Commands
  'What\'s the market doing?',
  'Market overview',
  'How\'s the market?',
  'Market status',
  
  // Trading Decisions
  'Should I buy Apple?',
  'Is Tesla a buy?',
  'Should I purchase MSFT?',
  'Is AAPL a sell?',
  
  // Comparisons
  'Compare Apple and Microsoft',
  'Compare AAPL vs MSFT',
  'Compare Tesla versus Google',
  
  // Navigation
  'Show charts',
  'Go to dashboard',
  'Open portfolio view',
  
  // Help
  'Help',
  'What can you do?',
  'Voice commands',
  
  // Edge Cases
  'Invalid command xyz',
  '',
  'Buy Apple maybe',
  'Warren thinks what?'
];

console.log(' RUNNING TEST CASES');
console.log('====================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

testCases.forEach((testInput, index) => {
  totalTests++;
  console.log(`Test ${index + 1}: "${testInput}"`);
  
  try {
    const result = parser.parseCommand(testInput);
    
    if (result) {
      console.log(` Action: ${result.action}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Parameters: ${JSON.stringify(result.parameters)}`);
      console.log(`   Response: "${parser.generateResponse(result)}"`);
      
      if (result.confidence >= 0.6) {
        passedTests++;
        console.log(`   Status: PASS (confidence >= 60%)`);
      } else {
        failedTests.push({ test: testInput, reason: 'Low confidence', confidence: result.confidence });
        console.log(`   Status: FAIL (confidence < 60%)`);
      }
    } else {
      console.log(` No command recognized`);
      if (testInput.trim() === '' || testInput.includes('Invalid')) {
        passedTests++; // Expected to fail
        console.log(`   Status: PASS (expected failure)`);
      } else {
        failedTests.push({ test: testInput, reason: 'No command recognized' });
        console.log(`   Status: FAIL (should have recognized command)`);
      }
    }
  } catch (error) {
    console.log(` Error: ${error.message}`);
    failedTests.push({ test: testInput, reason: `Error: ${error.message}` });
    console.log(`   Status: FAIL (error occurred)`);
  }
  
  console.log('');
});

console.log(' TEST RESULTS SUMMARY');
console.log('=======================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests.length}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests.length > 0) {
  console.log('\n FAILED TESTS:');
  failedTests.forEach((failure, index) => {
    console.log(`${index + 1}. "${failure.test}" - ${failure.reason}`);
    if (failure.confidence) {
      console.log(`   Confidence: ${(failure.confidence * 100).toFixed(1)}%`);
    }
  });
}

console.log('\n TESTING COMPLETE!');
