from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import subprocess
import json
import re
import sys
import os

app = FastAPI()

# Allow frontend requests from specific origins for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class RunRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class AgentChatRequest(BaseModel):
    agent_name: str
    message: str
    chat_history: Optional[List[ChatMessage]] = Field(default_factory=list)

@app.post("/api/run")
async def run_simulation(req: RunRequest):
    cmd = [
        "poetry", "run", "python", "src/main.py",
        "--tickers", req.tickers,
        "--start-date", req.start_date,
        "--end-date", req.end_date,
        "--initial-cash", str(req.initial_cash),
        "--show-reasoning",
        "--no-interactive"
    ]
    import re, json
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=90)
        output = result.stdout

        # Parse agent blocks: e.g. '==========  Fundamental Analysis Agent  ==========' ... {json} ... '================================================'
        agent_blocks = re.findall(r'=+\s+([\w\s]+Agent[\w\s]*)=+\n(\{[\s\S]+?\})\n=+', output)
        agents = {}
        for name, block in agent_blocks:
            agent_name = name.strip()
            try:
                parsed = json.loads(block)
                # Special handling for Risk Management Agent: fill missing fields with defaults
                if agent_name == "Risk Management Agent":
                    for ticker in (parsed.keys() if isinstance(parsed, dict) else []):
                        v = parsed[ticker]
                        if isinstance(v, dict):
                            for key in ["portfolio_value", "current_position", "position_limit", "remaining_limit", "available_cash"]:
                                if key not in v.get("reasoning", {}):
                                    if "reasoning" not in v:
                                        v["reasoning"] = {}
                                    v["reasoning"][key] = None
                agents[agent_name] = parsed
            except Exception:
                # Fallback: try to parse as a dict of tickers with empty fields
                if agent_name == "Risk Management Agent":
                    import re
                    tickers = re.findall(r'"([A-Z]+)"\s*:', block)
                    agents[agent_name] = {t: {"reasoning": {"portfolio_value": None, "current_position": None, "position_limit": None, "remaining_limit": None, "available_cash": None}} for t in tickers}
                else:
                    agents[agent_name] = block

        # Parse trading decisions: e.g. 'TRADING DECISION: [AAPL]' ... table ...
        # Loosen the regex to allow for optional blank/comment lines between header and table
        decision_blocks = re.findall(r'TRADING DECISION: \[(.*?)\][^\S\r\n]*\n(?:[ \t]*\n)*([+\-|\w\s%.$:,\[\]]+)', output)
        decisions = {}
        for ticker, table in decision_blocks:
            actions = re.findall(r'\|\s*Action\s*\|\s*(\w+)\s*\|', table)
            qtys = re.findall(r'\|\s*Quantity\s*\|\s*(\d+)\s*\|', table)
            confs = re.findall(r'\|\s*Confidence\s*\|\s*([\d.]+)%\s*\|', table)
            reasons = re.findall(r'\|\s*Reasoning\s*\|(.+?)\|', table, re.DOTALL)
            decisions[ticker] = {
                'action': actions[0] if actions else '',
                'quantity': int(qtys[0]) if qtys else 0,
                'confidence': float(confs[0]) if confs else 0,
                'reasoning': reasons[0].strip() if reasons else ''
            }

        return {
            'agents': agents,
            'decisions': decisions,
            'raw': output
        }
    except subprocess.TimeoutExpired:
        return {"error": "Simulation timed out"}
    except subprocess.CalledProcessError as e:
        import json
        try:
            err_json = json.loads(e.stderr)
            if isinstance(err_json, dict):
                return err_json
            elif isinstance(err_json, list) and len(err_json) > 0 and isinstance(err_json[0], dict):
                return err_json[0]
        except Exception:
            pass
        return {"error": e.stderr or 'Simulation failed'}

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
