#!/usr/bin/env python
"""
Non-interactive version of the backtester for API usage.
This script wraps the original backtester to run without requiring user input.
"""

import sys
import os
import json
import subprocess
import re
from datetime import datetime

def run_non_interactive_backtest(
    tickers,
    start_date,
    end_date,
    initial_capital,
    margin_requirement=0.0,
    selected_analysts=None,
    model_name="gpt-4o"
):
    """Run the backtester in a non-interactive mode for API usage"""
    
    # Default to all analysts if none specified
    if not selected_analysts:
        selected_analysts = [
            "ben_graham", "bill_ackman", "cathie_wood", "charlie_munger", 
            "phil_fisher", "stanley_druckenmiller", "warren_buffett", 
            "technical_analysis", "fundamental_analysis", "sentiment_analysis", 
            "valuation_analysis", "portfolio_management", "risk_management"
        ]
    
    try:
        # Construct the command to run the backtester
        cmd = [
            "python3", 
            os.path.join(os.path.dirname(__file__), "backtester.py"),
            "--tickers", tickers,
            "--start-date", start_date,
            "--end-date", end_date,
            "--initial-capital", str(initial_capital),
            "--margin-requirement", str(margin_requirement)
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        
        # Create input for the interactive prompts
        # First input: select analysts (space-separated)
        analyst_input = ' '.join(selected_analysts) + '\n'
        # Second input: select model
        model_input = model_name + '\n'
        
        # Combine inputs
        input_data = analyst_input + model_input
        print(f"Input data: {input_data}")
        
        # Run the backtester with simulated input
        result = subprocess.run(
            cmd, 
            input=input_data,
            capture_output=True, 
            text=True
        )
        
        # Check if the command was successful
        if result.returncode != 0:
            print(f"Command failed with return code {result.returncode}")
            print(f"STDERR: {result.stderr}")
            return {
                "success": False,
                "error": result.stderr,
                "output": result.stdout
            }
            
        raw_output = result.stdout
        
        # Extract basic performance metrics
        performance_metrics = {}
        
        # Extract Sharpe Ratio
        sharpe_match = re.search(r'Sharpe Ratio: ([\d.-]+)', raw_output)
        if sharpe_match:
            performance_metrics['sharpe_ratio'] = float(sharpe_match.group(1))
            
        # Extract Max Drawdown
        drawdown_match = re.search(r'Maximum Drawdown: ([\d.-]+)%', raw_output)
        if drawdown_match:
            performance_metrics['max_drawdown'] = float(drawdown_match.group(1))
            
        # Extract Win Rate
        win_rate_match = re.search(r'Win Rate: ([\d.-]+)%', raw_output)
        if win_rate_match:
            performance_metrics['win_rate'] = float(win_rate_match.group(1))
            
        # Extract Total Return
        total_return_match = re.search(r'Total Return: ([\d.-]+)%', raw_output)
        if total_return_match:
            performance_metrics['total_return'] = float(total_return_match.group(1))
        
        # Extract portfolio values over time
        portfolio_values = []
        portfolio_values_match = re.findall(r'PORTFOLIO VALUE: (\d{4}-\d{2}-\d{2}),([\d.]+)', raw_output)
        for date, value in portfolio_values_match:
            portfolio_values.append({
                'date': date,
                'value': float(value)
            })
        
        # Extract trade history
        trades = []
        trade_match = re.findall(r'TRADE: (\d{4}-\d{2}-\d{2}),([A-Z]+),([\w]+),(\d+),([\d.]+)', raw_output)
        for date, ticker, action, quantity, price in trade_match:
            trades.append({
                'date': date,
                'ticker': ticker,
                'action': action,
                'quantity': int(quantity),
                'price': float(price)
            })
        
        # Create a formatted terminal-like output
        formatted_output = f"""\n
PORTFOLIO SUMMARY:
Cash Balance: ${performance_metrics.get('cash_balance', 0):,.2f}
Total Position Value: ${performance_metrics.get('position_value', 0):,.2f}
Total Value: ${performance_metrics.get('total_value', 0):,.2f}
Return: {'+' if performance_metrics.get('total_return', 0) > 0 else ''}{performance_metrics.get('total_return', 0):.2f}%
Sharpe Ratio: {performance_metrics.get('sharpe_ratio', 0):.2f}
Max Drawdown: {performance_metrics.get('max_drawdown', 0):.2f}%

"""
        
        # Add trade table to formatted output
        if trades:
            formatted_output += "\nTRADE HISTORY:\n"
            formatted_output += "+------------+----------+----------+------------+---------+----------+\n"
            formatted_output += "| Date       | Ticker   |  Action  |   Quantity |   Price | Position |\n"
            formatted_output += "+============+==========+==========+============+=========+==========+\n"
            
            for trade in trades:
                formatted_output += f"| {trade['date']} | {trade['ticker']:<8} | {trade['action']:<8} | {trade['quantity']:>10} | {trade['price']:>7.2f} | {'N/A':>8} |\n"
                formatted_output += "+------------+----------+----------+------------+---------+----------+\n"
        
        # Add agent status indicators
        agent_status = []
        for line in raw_output.split('\n'):
            if '⋯' in line or '✓' in line:
                agent_status.append(line)
        
        if agent_status:
            formatted_output += "\nAGENT STATUS:\n"
            formatted_output += "\n".join(agent_status)
        
        # Return success with all the data
        return {
            "success": True,
            "output": raw_output,
            "formatted_output": formatted_output,
            "performance_metrics": performance_metrics,
            "portfolio_values": portfolio_values,
            "trades": trades
        }
    except subprocess.CalledProcessError as e:
        # Return error if the backtester fails
        print(f"CalledProcessError: {e}")
        print(f"STDERR: {e.stderr}")
        print(f"STDOUT: {e.stdout}")
        return {
            "success": False,
            "error": e.stderr if e.stderr else "Unknown error occurred",
            "output": e.stdout if e.stdout else ""
        }
    except Exception as e:
        # Return error for any other exception
        print(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "output": ""
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run backtesting simulation non-interactively")
    parser.add_argument(
        "--tickers",
        type=str,
        required=True,
        help="Comma-separated list of stock ticker symbols (e.g., AAPL,MSFT,GOOGL)",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        default=datetime.now().strftime("%Y-%m-%d"),
        help="End date in YYYY-MM-DD format",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default=(datetime.now() - relativedelta(months=1)).strftime("%Y-%m-%d"),
        help="Start date in YYYY-MM-DD format",
    )
    parser.add_argument(
        "--initial-capital",
        type=float,
        default=100000,
        help="Initial capital amount (default: 100000)",
    )
    parser.add_argument(
        "--margin-requirement",
        type=float,
        default=0.0,
        help="Margin ratio for short positions, e.g. 0.5 for 50% (default: 0.0)",
    )
    parser.add_argument(
        "--analysts",
        type=str,
        default="",
        help="Comma-separated list of analysts to use",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gpt-4o",
        help="LLM model to use",
    )
    
    args = parser.parse_args()
    
    # Parse analysts from comma-separated string
    selected_analysts = [a.strip() for a in args.analysts.split(",")] if args.analysts else None
    
    # Run the backtest
    result = run_non_interactive_backtest(
        tickers=args.tickers,
        start_date=args.start_date,
        end_date=args.end_date,
        initial_capital=args.initial_capital,
        margin_requirement=args.margin_requirement,
        selected_analysts=selected_analysts,
        model_name=args.model
    )
    
    # Print the result
    if result["success"]:
        print(result["output"])
    else:
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)
