// AgentChatCues.js - Conversation Starters and Interaction Cues for Voice Chat
// Provides contextual prompts to help users engage naturally with each AI agent

export const agentChatCues = {
  'Warren Buffett Agent': {
    conversationStarters: [
      "What do you think about the current market valuations?",
      "Can you explain your investment philosophy?",
      "How do you evaluate a company's competitive advantage?",
      "What's your take on long-term vs short-term investing?",
      "How do you find undervalued companies?"
    ],
    voicePrompts: [
      "Ask Warren about value investing principles",
      "Discuss economic moats and competitive advantages",
      "Get his perspective on market timing",
      "Learn about his famous investment mistakes",
      "Understand his approach to company management evaluation"
    ],
    interactionCues: {
      whenToSpeak: "Warren speaks slowly and thoughtfully - give him time to finish",
      howToEngage: "Ask about real-world examples and analogies",
      topicSuggestions: ["Berkshire Hathaway", "value investing", "business fundamentals", "long-term thinking"]
    },
    sampleConversations: [
      {
        user: "Warren, what makes a good investment?",
        agent: "Well, you know, I always look for businesses I can understand. Think of it like buying a farm - you want good soil, reliable weather, and crops people will always need. The same goes for companies."
      },
      {
        user: "How do you handle market volatility?",
        agent: "In my experience, volatility is actually the friend of the long-term investor. It's like having someone show up at your door every day offering to buy or sell your house at different prices. Most days, you'd just ignore them."
      }
    ]
  },

  'Cathie Wood Agent': {
    conversationStarters: [
      "What disruptive technologies excite you most right now?",
      "How do you identify innovation opportunities?",
      "What's your view on AI and automation?",
      "How do you evaluate growth potential in tech stocks?",
      "What role does genomics play in your investment strategy?"
    ],
    voicePrompts: [
      "Explore disruptive innovation opportunities with Cathie",
      "Discuss the convergence of technologies",
      "Learn about her research methodology",
      "Understand her approach to growth investing",
      "Get insights on emerging market trends"
    ],
    interactionCues: {
      whenToSpeak: "Cathie is energetic and fast-paced - jump in with follow-up questions",
      howToEngage: "Ask about cutting-edge technologies and future trends",
      topicSuggestions: ["artificial intelligence", "genomics", "blockchain", "automation", "space exploration"]
    },
    sampleConversations: [
      {
        user: "What's the most exciting innovation you're seeing?",
        agent: "This is incredibly exciting! We're seeing the convergence of AI, genomics, and robotics creating unprecedented opportunities. The pace of innovation is accelerating exponentially!"
      },
      {
        user: "How do you evaluate disruptive companies?",
        agent: "We look for companies at the intersection of multiple innovation platforms. The opportunity here is massive - we're talking about technologies that will transform entire industries over the next decade."
      }
    ]
  },

  'Ben Graham Agent': {
    conversationStarters: [
      "How do you calculate intrinsic value?",
      "What is the margin of safety principle?",
      "Can you explain your approach to security analysis?",
      "How do you differentiate between investing and speculation?",
      "What financial ratios are most important?"
    ],
    voicePrompts: [
      "Learn fundamental analysis techniques from Ben",
      "Understand the mathematical approach to investing",
      "Discuss risk assessment methodologies",
      "Explore value investing principles",
      "Get insights on market psychology"
    ],
    interactionCues: {
      whenToSpeak: "Ben is methodical and precise - prepare specific questions",
      howToEngage: "Focus on quantitative analysis and mathematical concepts",
      topicSuggestions: ["intrinsic value", "margin of safety", "financial analysis", "risk assessment"]
    },
    sampleConversations: [
      {
        user: "How do I know if a stock is undervalued?",
        agent: "Based on my analysis, you must first calculate the intrinsic value using fundamental metrics. The mathematical approach shows us the true worth of a security, independent of market sentiment."
      },
      {
        user: "What's the most important principle in investing?",
        agent: "The margin of safety principle is crucial. Never invest without a significant buffer between price and value. This protects against both analytical errors and market volatility."
      }
    ]
  },

  'Bill Ackman Agent': {
    conversationStarters: [
      "What makes an attractive activist investment opportunity?",
      "How do you identify undervalued companies?",
      "What's your approach to engaging with management?",
      "How do you create value in your investments?",
      "What catalysts do you look for?"
    ],
    voicePrompts: [
      "Discuss activist investing strategies with Bill",
      "Learn about value creation opportunities",
      "Understand corporate strategy analysis",
      "Explore special situation investments",
      "Get insights on management engagement"
    ],
    interactionCues: {
      whenToSpeak: "Bill is direct and confident - engage with specific scenarios",
      howToEngage: "Ask about concrete examples and strategic thinking",
      topicSuggestions: ["activist investing", "corporate strategy", "value creation", "special situations"]
    },
    sampleConversations: [
      {
        user: "How do you identify investment opportunities?",
        agent: "My thesis is simple - I look for high-quality businesses trading at significant discounts to intrinsic value. The catalyst here is usually some form of corporate action or strategic change."
      },
      {
        user: "What's your approach to working with management?",
        agent: "I believe strongly in collaborative engagement. The opportunity to create value is much greater when you work with management rather than against them."
      }
    ]
  },

  'Phil Fisher Agent': {
    conversationStarters: [
      "How do you evaluate management quality?",
      "What is the scuttlebutt method?",
      "How do you identify growth companies?",
      "What makes a company's competitive position strong?",
      "How do you balance growth and value?"
    ],
    voicePrompts: [
      "Learn qualitative analysis techniques from Phil",
      "Understand the scuttlebutt research method",
      "Discuss management evaluation criteria",
      "Explore growth investing principles",
      "Get insights on competitive advantage assessment"
    ],
    interactionCues: {
      whenToSpeak: "Phil is thoughtful and analytical - allow time for detailed explanations",
      howToEngage: "Focus on qualitative factors and long-term perspectives",
      topicSuggestions: ["management quality", "competitive advantages", "growth potential", "innovation"]
    },
    sampleConversations: [
      {
        user: "How do you research a company?",
        agent: "When I investigate a company, I use what I call the scuttlebutt method - talking to customers, suppliers, competitors, and employees. The numbers only tell part of the story."
      },
      {
        user: "What makes a great growth company?",
        agent: "Outstanding companies share certain characteristics: superior management, strong competitive positions, and the ability to grow earnings consistently over many years."
      }
    ]
  },

  'Portfolio Manager': {
    conversationStarters: [
      "How do you construct an optimal portfolio?",
      "What's your approach to asset allocation?",
      "How do you manage portfolio risk?",
      "What role does diversification play?",
      "How do you rebalance portfolios?"
    ],
    voicePrompts: [
      "Discuss portfolio construction strategies",
      "Learn about asset allocation models",
      "Understand risk management techniques",
      "Explore diversification principles",
      "Get insights on portfolio optimization"
    ],
    interactionCues: {
      whenToSpeak: "Professional and systematic - ask about specific methodologies",
      howToEngage: "Focus on systematic approaches and quantitative methods",
      topicSuggestions: ["asset allocation", "risk management", "diversification", "portfolio optimization"]
    },
    sampleConversations: [
      {
        user: "How do you allocate assets in a portfolio?",
        agent: "From a portfolio perspective, asset allocation is the primary driver of returns. The allocation model suggests diversifying across asset classes based on risk tolerance and investment horizon."
      },
      {
        user: "How important is diversification?",
        agent: "Diversification principles show that proper allocation can reduce risk without sacrificing expected returns. It's about balancing risk and return across different investments."
      }
    ]
  },

  'Risk Manager': {
    conversationStarters: [
      "How do you assess investment risk?",
      "What are the key risk metrics to monitor?",
      "How do you protect against downside risk?",
      "What's your approach to stress testing?",
      "How do you quantify portfolio risk?"
    ],
    voicePrompts: [
      "Learn risk assessment methodologies",
      "Understand downside protection strategies",
      "Discuss stress testing approaches",
      "Explore risk measurement techniques",
      "Get insights on risk management frameworks"
    ],
    interactionCues: {
      whenToSpeak: "Cautious and analytical - ask about specific risk scenarios",
      howToEngage: "Focus on risk mitigation and protection strategies",
      topicSuggestions: ["risk assessment", "downside protection", "volatility", "stress testing"]
    },
    sampleConversations: [
      {
        user: "How do you measure portfolio risk?",
        agent: "The risk metrics show us various dimensions of potential loss. We need to consider volatility, correlation, and maximum drawdown to get a complete picture."
      },
      {
        user: "What's the most important aspect of risk management?",
        agent: "Risk management is paramount. We must consider the downside before the upside. The probability of loss should always be carefully quantified and managed."
      }
    ]
  },

  'Technical Analyst': {
    conversationStarters: [
      "What chart patterns are you seeing?",
      "How do you interpret technical indicators?",
      "What's the current trend analysis showing?",
      "How do you identify support and resistance levels?",
      "What momentum indicators do you watch?"
    ],
    voicePrompts: [
      "Discuss current chart patterns and trends",
      "Learn technical indicator interpretation",
      "Understand price action analysis",
      "Explore momentum and trend analysis",
      "Get insights on timing entry and exit points"
    ],
    interactionCues: {
      whenToSpeak: "Precise and data-focused - ask about specific charts and patterns",
      howToEngage: "Focus on visual patterns and technical signals",
      topicSuggestions: ["chart patterns", "technical indicators", "trend analysis", "support/resistance"]
    },
    sampleConversations: [
      {
        user: "What are the charts telling you about this stock?",
        agent: "The technical picture shows a clear upward trend with strong momentum. Chart patterns indicate we're approaching a key resistance level that could signal a breakout."
      },
      {
        user: "How do you time your trades?",
        agent: "Price action indicates the best entry points. Moving averages suggest trend direction, while momentum oscillators help identify overbought or oversold conditions."
      }
    ]
  },

  'Fundamental Analysis Agent': {
    conversationStarters: [
      "What do the financial statements reveal?",
      "How do you evaluate business metrics?",
      "What valuation methods do you use?",
      "How do you analyze competitive position?",
      "What are the key fundamental indicators?"
    ],
    voicePrompts: [
      "Dive deep into financial analysis",
      "Learn valuation methodologies",
      "Understand business metric evaluation",
      "Explore competitive analysis techniques",
      "Get insights on fundamental research"
    ],
    interactionCues: {
      whenToSpeak: "Thorough and methodical - prepare for detailed analysis",
      howToEngage: "Focus on specific financial metrics and business fundamentals",
      topicSuggestions: ["financial statements", "valuation models", "business metrics", "competitive analysis"]
    },
    sampleConversations: [
      {
        user: "How do you analyze a company's financials?",
        agent: "The financial data shows us the underlying health of the business. Fundamental metrics indicate profitability, efficiency, and growth potential over time."
      },
      {
        user: "What's the most important financial ratio?",
        agent: "The business model suggests different ratios matter for different industries. Valuation analysis reveals which metrics are most predictive of future performance."
      }
    ]
  },

  'Sentiment Agent': {
    conversationStarters: [
      "What's the current market sentiment?",
      "How are social media signals looking?",
      "What does news sentiment indicate?",
      "How do you measure investor psychology?",
      "What sentiment indicators do you track?"
    ],
    voicePrompts: [
      "Explore current market sentiment trends",
      "Learn social media analysis techniques",
      "Understand crowd psychology indicators",
      "Discuss sentiment measurement methods",
      "Get insights on emotional market drivers"
    ],
    interactionCues: {
      whenToSpeak: "Dynamic and responsive - ask about current market mood",
      howToEngage: "Focus on emotional and psychological market factors",
      topicSuggestions: ["market sentiment", "social signals", "news sentiment", "crowd psychology"]
    },
    sampleConversations: [
      {
        user: "What's the market feeling right now?",
        agent: "Market sentiment reveals a mix of optimism and caution. The emotional indicators show investors are becoming more risk-averse despite positive fundamentals."
      },
      {
        user: "How do you read social media sentiment?",
        agent: "Social media buzz suggests retail investors are increasingly bullish, but crowd psychology indicates this could be a contrarian signal to watch carefully."
      }
    ]
  }
};

// Utility functions for conversation cues
export const getConversationStarters = (agentName) => {
  return agentChatCues[agentName]?.conversationStarters || [];
};

export const getVoicePrompts = (agentName) => {
  return agentChatCues[agentName]?.voicePrompts || [];
};

export const getInteractionCues = (agentName) => {
  return agentChatCues[agentName]?.interactionCues || {};
};

export const getSampleConversations = (agentName) => {
  return agentChatCues[agentName]?.sampleConversations || [];
};

export const getRandomConversationStarter = (agentName) => {
  const starters = getConversationStarters(agentName);
  return starters[Math.floor(Math.random() * starters.length)];
};

export const getRandomVoicePrompt = (agentName) => {
  const prompts = getVoicePrompts(agentName);
  return prompts[Math.floor(Math.random() * prompts.length)];
};

export default agentChatCues;
