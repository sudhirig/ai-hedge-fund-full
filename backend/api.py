from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import subprocess
import sys
import json
import time
import re
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Environment validation
def validate_environment():
    """Validate required environment variables and dependencies."""
    missing_vars = []
    warnings = []
    
    # Check required API keys
    if not os.getenv("FINANCIAL_DATASETS_API_KEY"):
        missing_vars.append("FINANCIAL_DATASETS_API_KEY")
    
    # Check optional LLM API keys
    if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        warnings.append("No LLM API keys found - LLM agents will not function")
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")
    
    return {"warnings": warnings}

# Validate environment on startup
try:
    env_status = validate_environment()
    if env_status["warnings"]:
        print("⚠️  Environment warnings:")
        for warning in env_status["warnings"]:
            print(f"   - {warning}")
except ValueError as e:
    print(f"❌ Environment validation failed: {e}")
    sys.exit(1)

app = FastAPI(
    title="AI Hedge Fund API",
    description="Advanced AI-powered hedge fund simulation with multi-agent analysis",
    version="1.0.0"
)

# Allow frontend requests from specific origins for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Agent Configuration Models
class AgentConfig(BaseModel):
    """Global agent configuration parameters"""
    confidence_threshold: Optional[float] = 0.6
    analysis_depth: Optional[int] = 5
    risk_tolerance: Optional[str] = "moderate"  # conservative, moderate, aggressive
    time_horizon: Optional[int] = 30  # days
    
class AgentWeights(BaseModel):
    """Weights for different analysis components"""
    technical: Optional[float] = 0.3
    fundamental: Optional[float] = 0.4
    sentiment: Optional[float] = 0.3
    valuation: Optional[float] = 0.0  # Auto-calculated if not provided
    
class TechnicalConfig(BaseModel):
    """Technical analysis specific configuration"""
    lookback_period: Optional[int] = 20
    rsi_period: Optional[int] = 14
    ma_short: Optional[int] = 20
    ma_long: Optional[int] = 50
    volume_threshold: Optional[float] = 1.5
    trend_weight: Optional[float] = 0.4
    momentum_weight: Optional[float] = 0.3
    volume_weight: Optional[float] = 0.3
    
class RiskConfig(BaseModel):
    """Risk management specific configuration"""
    max_position_size: Optional[float] = 0.1  # 10% of portfolio
    stop_loss_threshold: Optional[float] = 0.05  # 5%
    volatility_lookback: Optional[int] = 30
    correlation_threshold: Optional[float] = 0.7
    
class SentimentConfig(BaseModel):
    """Sentiment analysis specific configuration"""
    news_weight: Optional[float] = 0.6
    insider_weight: Optional[float] = 0.4
    sentiment_threshold: Optional[float] = 0.1
    news_lookback_days: Optional[int] = 7
    
class AgentSpecificConfig(BaseModel):
    """Agent-specific configuration parameters"""
    technical: Optional[TechnicalConfig] = None
    risk: Optional[RiskConfig] = None
    sentiment: Optional[SentimentConfig] = None
    
class FullAgentConfig(BaseModel):
    """Complete agent configuration structure"""
    global_config: Optional[AgentConfig] = None
    weights: Optional[AgentWeights] = None
    agent_specific: Optional[AgentSpecificConfig] = None
    enabled_agents: Optional[List[str]] = None

class RunRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int
    agent_config: Optional[FullAgentConfig] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class AgentChatRequest(BaseModel):
    agent_name: str
    message: str
    chat_history: Optional[List[ChatMessage]] = Field(default_factory=list)

@app.get("/health")
def health_check():
    """Health check endpoint with detailed system status."""
    try:
        # Check environment variables
        env_status = {
            "financial_api": bool(os.getenv("FINANCIAL_DATASETS_API_KEY")),
            "anthropic_api": bool(os.getenv("ANTHROPIC_API_KEY")),
            "openai_api": bool(os.getenv("OPENAI_API_KEY")),
        }
        
        # Check if main.py exists
        main_py_path = Path(__file__).parent.parent / "src" / "main.py"
        main_py_exists = main_py_path.exists()
        
        # Check critical dependencies
        try:
            import pandas
            import yfinance
            pandas_ok = True
        except ImportError:
            pandas_ok = False
        
        status = "healthy" if main_py_exists and pandas_ok and env_status["financial_api"] else "degraded"
        
        return {
            "status": status,
            "timestamp": time.time(),
            "environment": env_status,
            "dependencies": {
                "main_script": main_py_exists,
                "pandas": pandas_ok
            },
            "warnings": [] if status == "healthy" else ["Some components may not function properly"]
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": time.time(),
            "error": str(e)
        }

@app.post("/api/run")
async def run_simulation(req: RunRequest):
    try:
        # Validate inputs
        if not req.tickers:
            raise ValueError("At least one ticker must be provided")
        
        # Get the absolute path to main.py
        current_dir = Path(__file__).parent
        main_py_path = current_dir.parent / "src" / "main.py"
        
        if not main_py_path.exists():
            raise FileNotFoundError(f"main.py not found at {main_py_path}")
        
        # Prepare command arguments
        cmd = [
            sys.executable, str(main_py_path),
            "--tickers", req.tickers,
            "--start-date", req.start_date,
            "--end-date", req.end_date,
            "--initial-cash", str(req.initial_cash),
            "--show-reasoning",
            "--no-interactive"
        ]
        
        print(f"🚀 Starting simulation with command: {' '.join(cmd)}")
        
        # Run the simulation with timeout and proper error handling
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes timeout
                cwd=current_dir.parent,
                env=os.environ.copy()  # Pass all environment variables
            )
            
            if result.returncode != 0:
                error_msg = f"Simulation failed with return code {result.returncode}"
                if result.stderr:
                    error_msg += f". Error: {result.stderr[:500]}"
                
                return {
                    "status": "error",
                    "message": error_msg,
                    "details": {
                        "stdout": result.stdout[-1000:] if result.stdout else "",
                        "stderr": result.stderr[-1000:] if result.stderr else "",
                        "return_code": result.returncode
                    }
                }
            
            # Parse the output
            output = result.stdout
            if not output.strip():
                return {
                    "status": "error",
                    "message": "No output received from simulation",
                    "details": {"stderr": result.stderr[-500:] if result.stderr else ""}
                }
            
            print(f"✅ Simulation completed successfully. Output length: {len(output)} chars")
            
            # Parse new format agent debug logs: e.g. '🔍 LLM DEBUG - Agent: peter_lynch_agent, Attempt: 1' followed by result
            # Pattern to match agent debug entries
            agent_pattern = r'🔍 LLM DEBUG - Agent: ([\w_]+), Attempt: \d+[\s\S]*?📄 Raw Result: signal=\'([^\']*)\' confidence=([\d.]+) reasoning=(["\'][\s\S]*?)(?=🔍|✅|$)'
            agent_matches = re.findall(agent_pattern, output)
            
            agents = {}
            tickers = req.tickers.split(',') if ',' in req.tickers else [req.tickers]
            
            for agent_name, signal, confidence, reasoning in agent_matches:
                # Convert agent_name from snake_case to display name
                display_name = agent_name.replace('_', ' ').title().replace(' Agent', ' Agent')
                
                # Clean up reasoning text - remove quotes and escape characters
                reasoning_text = reasoning.strip('"\'')
                if reasoning_text.startswith('"') and reasoning_text.endswith('"'):
                    reasoning_text = reasoning_text[1:-1]
                
                # Create agent data structure for each ticker
                agent_data = {}
                for ticker in tickers:
                    agent_data[ticker] = {
                        "signal": signal,
                        "confidence": float(confidence),
                        "reasoning": reasoning_text
                    }
                
                agents[display_name] = agent_data

            # Parse portfolio manager decisions from debug logs
            # Pattern: 'Agent: portfolio_management_agent' followed by decisions data
            portfolio_pattern = r'🔍 LLM DEBUG - Agent: portfolio_management_agent[\s\S]*?📄 Raw Result: decisions=\{([\s\S]*?)\}[\s\S]*?(?=🔍|✅|$)'
            portfolio_match = re.search(portfolio_pattern, output)
            
            decisions = {}
            if portfolio_match:
                # Parse the portfolio decision data structure
                decision_text = portfolio_match.group(1)
                # Extract ticker decisions - look for 'TICKER': PortfolioDecision(...)
                ticker_pattern = r"'([A-Z]+)':\s*PortfolioDecision\(action='([^']*)',\s*quantity=([\d]+),\s*confidence=([\d.]+),\s*reasoning=\"([^\"]*)\""
                ticker_matches = re.findall(ticker_pattern, decision_text)
                
                for ticker, action, quantity, confidence, reasoning in ticker_matches:
                    decisions[ticker] = {
                        'action': action.upper(),  # Convert to uppercase for consistency
                        'quantity': int(quantity),
                        'confidence': float(confidence),
                        'reasoning': reasoning
                    }

            return {
                "status": "success", 
                "data": {
                    'agents': agents,
                    'decisions': decisions,
                    'raw': output
                },
                "metadata": {
                    "execution_time": "N/A",  # Could add timing
                    "tickers": req.tickers,
                    "date_range": f"{req.start_date} to {req.end_date}"
                }
            }
            
        except subprocess.TimeoutExpired:
            return {
                "status": "error",
                "message": "Simulation timed out after 5 minutes",
                "details": {"timeout": 300}
            }
        
        except subprocess.SubprocessError as e:
            return {
                "status": "error",
                "message": f"Subprocess execution failed: {str(e)}",
                "details": {"subprocess_error": str(e)}
            }
            
    except FileNotFoundError as e:
        return {
            "status": "error",
            "message": "Simulation script not found",
            "details": {"file_error": str(e)}
        }
        
    except ValueError as e:
        return {
            "status": "error",
            "message": f"Invalid input: {str(e)}",
            "details": {"validation_error": str(e)}
        }
        
    except Exception as e:
        print(f"❌ Unexpected error in simulation: {e}")
        return {
            "status": "error",
            "message": "An unexpected error occurred",
            "details": {
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        }

@app.post("/api/agent-chat")
async def agent_chat(req: AgentChatRequest):
    """
    Process a chat message sent to an AI agent and return a response.
    This simulates the agent's personality and investment strategy.
    """
    # In a production environment, this would call an LLM API or other AI service
    # For now, we'll use a simple rule-based approach to simulate different agent personalities
    
    agent_name = req.agent_name
    message = req.message.lower()
    
    # Simple response generation based on agent personality and message content
    if "stock" in message or "invest" in message:
        responses = {
            "Warren Buffett Agent": "When I look at a stock, I focus on its intrinsic value and competitive advantage. I prefer companies with consistent earnings, low debt, and strong management. Remember, the stock market is a device for transferring money from the impatient to the patient.",
            "Cathie Wood Agent": "I look for disruptive innovation and exponential growth opportunities. Companies leading in areas like AI, genomics, robotics, and blockchain have tremendous potential. The key is to identify technologies that will change the world in the next 5-10 years.",
            "Ben Graham Agent": "I always emphasize margin of safety. Look for stocks trading below their intrinsic value, with strong balance sheets and consistent earnings. Remember, investment is most intelligent when it is most businesslike.",
            "Technical Analyst": "I'd analyze the price patterns, moving averages, and momentum indicators for this stock. The current chart shows key support and resistance levels that could inform your entry and exit points.",
            "Fundamental Analysis Agent": "Let's examine the company's financial statements, particularly the P/E ratio, debt-to-equity ratio, and free cash flow. These metrics will help us determine if the stock is fairly valued."
        }
        response = responses.get(agent_name, "That's an interesting question about stocks. Let me analyze that for you...")
    
    elif "market" in message or "economy" in message:
        responses = {
            "Warren Buffett Agent": "Be fearful when others are greedy, and greedy when others are fearful. Market timing is futile - focus on buying wonderful companies at fair prices instead of trying to predict short-term market movements.",
            "Cathie Wood Agent": "I believe we're in the midst of several innovation platforms that will transform the global economy. Short-term market volatility is noise - the long-term trajectory of innovative technologies is upward.",
            "Ben Graham Agent": "The market is a voting machine in the short run, but a weighing machine in the long run. Focus on the intrinsic value of businesses rather than market sentiment.",
            "Technical Analyst": "Market trends can be identified through various technical indicators. Currently, I'm seeing patterns that suggest momentum in the broader indices.",
            "Fundamental Analysis Agent": "The overall market valuation metrics like the Shiller PE ratio and total market cap to GDP can give us insights into whether the market as a whole is overvalued or undervalued."
        }
        response = responses.get(agent_name, "The market is a complex system influenced by many factors. Here's my analysis...")
    
    else:
        # Default responses
        responses = {
            "Warren Buffett Agent": "I focus on long-term value investing. The best investments are in companies with strong economic moats, consistent earnings, and good management that you can hold for decades.",
            "Cathie Wood Agent": "I'm looking for companies at the forefront of disruptive innovation that will change the way the world works. These high-growth opportunities often come with volatility, but the long-term potential is tremendous.",
            "Ben Graham Agent": "As a value investor, I always look for a margin of safety. The intelligent investor is a realist who sells to optimists and buys from pessimists.",
            "Technical Analyst": "I focus on price patterns and market trends rather than company fundamentals. The charts often reveal information that isn't yet reflected in the fundamentals.",
            "Fundamental Analysis Agent": "I believe in thorough analysis of financial statements and business models. Understanding the numbers behind a company is essential for making informed investment decisions."
        }
        response = responses.get(agent_name, "That's an interesting question. Let me analyze that from my investment perspective...")
    
    return {"response": response}

class BacktestRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int
    margin_requirement: float = 0.0
    selected_analysts: List[str] = Field(default_factory=list)

@app.post("/api/backtest")
async def run_backtest(req: BacktestRequest):
    try:
        # Import our standalone backtester
        from backend.standalone_backtester import run_standalone_backtest
        
        # Parse ticker list from comma-separated string
        tickers = req.tickers
        
        # Print debugging info
        print(f"\n\nRunning backtest with: {tickers}, {req.start_date} to {req.end_date}")
        
        # Run the standalone backtester with real portfolio simulation
        try:
            print("Running standalone backtest...")
            result = run_standalone_backtest(
                tickers=tickers,
                start_date=req.start_date,
                end_date=req.end_date,
                initial_capital=float(req.initial_cash),
                margin_requirement=float(req.margin_requirement or 0.0)
            )
            print(f"Backtest result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
            print(f"Portfolio values: {len(result.get('portfolio_values', [])) if isinstance(result.get('portfolio_values'), list) else 'Not available'}")
            print(f"Trades: {len(result.get('trades', [])) if isinstance(result.get('trades'), list) else 'Not available'}")
            
            # Return the formatted result
            return result
            
        except Exception as e:
            import traceback
            print(f"Error in standalone backtester: {e}")
            print(traceback.format_exc())
            
            # Fall back to simplified response
            return {
                "error": f"Error running backtest: {str(e)}",
                "portfolio_values": [],
                "performance_metrics": {},
                "trades": [],
                "agent_outputs": {},
                "raw": ""
            }
            
    except Exception as e:
        # Handle any other errors
        import traceback
        print(f"Error in API endpoint: {e}")
        print(traceback.format_exc())
        return {
            "error": f"API error: {str(e)}",
            "portfolio_values": [],
            "performance_metrics": {},
            "trades": [],
            "agent_outputs": {},
            "raw": ""
        }

# Server startup
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", "8000"))
    
    print(f"🚀 Starting AI Hedge Fund Backend on port {port}")
    print(f"📊 Health check: http://localhost:{port}/health")
    print(f"📈 API endpoints available at: http://localhost:{port}/docs")
    
    # Start the server
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Set to True for development
        log_level="info"
    )
