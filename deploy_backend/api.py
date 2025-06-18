from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import re
from typing import Optional, List

app = FastAPI()

# Allow frontend requests from specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class RunRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int

class BacktestRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int
    margin_requirement: Optional[float] = 0.0
    selected_analysts: Optional[List[str]] = None

@app.post("/api/run")
async def run_simulation(req: RunRequest):
    cmd = [
        "poetry", "run", "python", "../src/main.py",
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
    except Exception as e:
        print(f"Error in simulation API: {str(e)}")
        return {"error": f"Simulation error: {str(e)}"}

@app.post("/api/backtest")
async def run_backtest(req: BacktestRequest):
    try:
        # Import the direct backtester
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
        try:
            from direct_backtester import run_direct_backtest
            use_direct_backtester = True
        except ImportError:
            from non_interactive_backtester import run_non_interactive_backtest
            use_direct_backtester = False
        print(f"Using direct backtester: {use_direct_backtester}")
        
        # Convert selected analysts to string format if provided
        selected_analysts = req.selected_analysts if req.selected_analysts else []
        
        print(f"Running backtester with tickers: {req.tickers}, dates: {req.start_date} to {req.end_date}")
        print(f"Selected analysts: {selected_analysts}")
        
        # Run the backtester
        if use_direct_backtester:
            result = run_direct_backtest(
                tickers=req.tickers,
                start_date=req.start_date,
                end_date=req.end_date,
                initial_capital=req.initial_cash,
                margin_requirement=req.margin_requirement,
                selected_analysts=selected_analysts,
                model_name="gpt-4o"  # Default to GPT-4o
            )
        else:
            result = run_non_interactive_backtest(
                tickers=req.tickers,
                start_date=req.start_date,
                end_date=req.end_date,
                initial_capital=req.initial_cash,
                margin_requirement=req.margin_requirement,
                selected_analysts=selected_analysts,
                model_name="gpt-4o"  # Default to GPT-4o
            )
        
        # Check if the backtester ran successfully
        if not result["success"]:
            return {"error": f"Backtester failed: {result['error']}"}
            
        # Get the output
        output = result["output"]
        
        # Parse performance metrics
        performance_metrics = {}
        
        # Extract Sharpe Ratio
        sharpe_match = re.search(r'Sharpe Ratio: ([\d.-]+)', output)
        if sharpe_match:
            performance_metrics['sharpe_ratio'] = float(sharpe_match.group(1))
            
        # Extract Max Drawdown
        drawdown_match = re.search(r'Maximum Drawdown: ([\d.-]+)%', output)
        if drawdown_match:
            performance_metrics['max_drawdown'] = float(drawdown_match.group(1))
            
        # Extract Win Rate
        win_rate_match = re.search(r'Win Rate: ([\d.-]+)%', output)
        if win_rate_match:
            performance_metrics['win_rate'] = float(win_rate_match.group(1))
            
        # Extract Win/Loss Ratio
        win_loss_match = re.search(r'Win/Loss Ratio: ([\d.-]+)', output)
        if win_loss_match:
            performance_metrics['win_loss_ratio'] = float(win_loss_match.group(1))
            
        # Extract Total Return
        total_return_match = re.search(r'Total Return: ([\d.-]+)%', output)
        if total_return_match:
            performance_metrics['total_return'] = float(total_return_match.group(1))
            
        # Extract portfolio values over time
        portfolio_values = []
        portfolio_values_match = re.findall(r'PORTFOLIO VALUE: (\d{4}-\d{2}-\d{2}),([\d.]+)', output)
        for date, value in portfolio_values_match:
            portfolio_values.append({
                'date': date,
                'value': float(value)
            })
        
        # Extract trade history
        trades = []
        trade_match = re.findall(r'TRADE: (\d{4}-\d{2}-\d{2}),([A-Z]+),([\w]+),(\d+),([\d.]+)', output)
        for date, ticker, action, quantity, price in trade_match:
            trades.append({
                'date': date,
                'ticker': ticker,
                'action': action,
                'quantity': int(quantity),
                'price': float(price)
            })
        
        # Parse agent blocks like in run_simulation
        agent_blocks = re.findall(r'=+\s+([\w\s]+Agent[\w\s]*)=+\n(\{[\s\S]+?\})\n=+', output)
        agents = {}
        for name, block in agent_blocks:
            agent_name = name.strip()
            try:
                parsed = json.loads(block)
                agents[agent_name] = parsed
            except Exception:
                agents[agent_name] = block
        
        # Parse trading decisions like in run_simulation
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
                
        # Use the data directly from the backtester result
        if 'formatted_output' in result:
            # New version with formatted output
            return {
                'performance_metrics': result.get('performance_metrics', performance_metrics),
                'portfolio_values': result.get('portfolio_values', portfolio_values),
                'trades': result.get('trades', trades),
                'agents': agents,
                'decisions': decisions,
                'raw': output if output else 'No output generated from backtester',
                'formatted_output': result.get('formatted_output', '')
            }
        else:
            # Fallback to old version
            return {
                'performance_metrics': performance_metrics,
                'portfolio_values': portfolio_values,
                'trades': trades,
                'agents': agents,
                'decisions': decisions,
                'raw': output if output else 'No output generated from backtester'
            }
    except Exception as e:
        print(f"Error in backtester API: {str(e)}")
        return {"error": f"Backtester error: {str(e)}"}
