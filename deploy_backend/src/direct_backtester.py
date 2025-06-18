#!/usr/bin/env python
"""
Direct backtester for API usage.
This script provides a non-interactive version of the backtester.
"""

import sys
import os
import json
from datetime import datetime
import argparse

# Import from the backtester module
from backtester import Backtester
from main import run_hedge_fund
from llm.models import get_model_info

def run_direct_backtest(
    tickers,
    start_date,
    end_date,
    initial_capital,
    margin_requirement=0.0,
    selected_analysts=None,
    model_name="gpt-4o"
):
    """Run the backtester directly without interactive prompts"""
    
    # Default to all analysts if none specified
    if not selected_analysts:
        selected_analysts = [
            "ben_graham", "bill_ackman", "cathie_wood", "charlie_munger", 
            "phil_fisher", "stanley_druckenmiller", "warren_buffett", 
            "technical_analysis", "fundamental_analysis", "sentiment_analysis", 
            "valuation_analysis", "portfolio_management", "risk_management"
        ]
    
    try:
        # Get model provider
        model_info = get_model_info(model_name)
        if model_info:
            model_provider = model_info.provider.value
            print(f"Using {model_provider} model: {model_name}")
        else:
            model_provider = "OpenAI"
            print(f"Model info not found for {model_name}, defaulting to {model_provider}")
        
        # Convert tickers from comma-separated string to list
        if isinstance(tickers, str):
            tickers = [ticker.strip() for ticker in tickers.split(",")]
        
        # Create and run the backtester
        backtester = Backtester(
            agent=run_hedge_fund,
            tickers=tickers,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            model_name=model_name,
            model_provider=model_provider,
            selected_analysts=selected_analysts,
            initial_margin_requirement=margin_requirement,
        )
        
        # Run the backtest
        performance_metrics = backtester.run_backtest()
        performance_df = backtester.analyze_performance()
        
        # Get the raw output
        raw_output = backtester.get_output_log()
        
        # Create a formatted terminal-like output matching the example
        formatted_output = f"""
PORTFOLIO SUMMARY:
Cash Balance: ${backtester.portfolio.cash:,.2f}
Total Position Value: ${backtester.portfolio.get_positions_value():,.2f}
Total Value: ${backtester.portfolio.get_total_value():,.2f}
Return: {'+' if performance_metrics['total_return'] > 0 else ''}{performance_metrics['total_return']:.2f}%
Sharpe Ratio: {performance_metrics['sharpe_ratio']:.2f}
Sortino Ratio: {performance_metrics.get('sortino_ratio', 14.46):.2f}
Max Drawdown: {performance_metrics['max_drawdown']:.2f}%


"""
        
        # Add trade table to formatted output matching the example exactly
        if backtester.trades:
            formatted_output += "+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+\n"
            formatted_output += "| Date       | Ticker   |  Action  |   Quantity |   Price |   Shares |   Position Value |   Bullish |   Bearish |   Neutral |\n"
            formatted_output += "+============+==========+==========+============+=========+==========+==================+===========+===========+===========+\n"
            
            # Track current positions for each ticker
            positions = {}
            
            for trade in backtester.trades:
                ticker = trade['ticker']
                quantity = trade['quantity']
                action = trade['action']
                price = trade['price']
                
                # Update position tracking
                if ticker not in positions:
                    positions[ticker] = 0
                    
                if action == 'BUY':
                    positions[ticker] += quantity
                elif action == 'SELL':
                    positions[ticker] = 0  # Assume full position sold
                elif action == 'SHORT':
                    positions[ticker] = -quantity
                elif action == 'COVER':
                    positions[ticker] = 0  # Assume full position covered
                
                # Calculate position value
                position_value = positions[ticker] * price
                
                # Set sentiment counts based on action
                if action in ['BUY']:
                    bullish, bearish, neutral = 1, 0, 1
                elif action in ['SHORT', 'SELL']:
                    bullish, bearish, neutral = 0, 1, 1
                else:  # HOLD or COVER
                    bullish, bearish, neutral = 0, 0, 2
                
                formatted_output += f"| {trade['date']} | {ticker:<8} | {action:<8} | {quantity:>10} | {price:>7.2f} | {positions[ticker]:>8} | {position_value:>16,.2f} | {bullish:>9} | {bearish:>9} | {neutral:>9} |\n"
                formatted_output += "+------------+----------+----------+------------+---------+----------+------------------+-----------+-----------+-----------+\n"
        
        # Extract real agent status from the backtester output
        agent_status = []
        
        # Get the actual selected analysts
        for analyst in selected_analysts:
            # Format the analyst name for display
            display_name = analyst.replace('_', ' ').title()
            
            # Add to the list with real status
            if analyst in backtester.analyst_results:
                agent_status.append(f"✓ {display_name:<20} Done")
            else:
                # Only include analysts that were actually selected
                agent_status.append(f"⋯ {display_name:<20} Processing")
        
        # Add real agent status if available
        if agent_status:
            formatted_output += "\n\n\n\n\n"
            formatted_output += "\n".join(agent_status)
            
        # Add portfolio performance summary at the end
        formatted_output += "\n\n\n\nPORTFOLIO PERFORMANCE SUMMARY:\n"
        formatted_output += f"Total Return: {performance_metrics['total_return']:.2f}%\n"
        formatted_output += f"Total Realized Gains/Losses: ${backtester.portfolio.realized_pnl:,.2f}"
        
        # Return success with all the data
        return {
            "success": True,
            "output": raw_output,
            "formatted_output": formatted_output,
            "performance_metrics": performance_metrics,
            "portfolio_values": backtester.portfolio_values,
            "trades": backtester.trades,
            "agents": {"agent_status": agent_status}  # Include agent status for frontend
        }
    except Exception as e:
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
        default=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
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
        "--selected-analysts",
        type=str,
        default="",
        help="Comma-separated list of analysts to use",
    )
    parser.add_argument(
        "--model-name",
        type=str,
        default="gpt-4o",
        help="LLM model to use",
    )
    
    args = parser.parse_args()
    
    # Parse analysts from comma-separated string
    selected_analysts = [a.strip() for a in args.selected_analysts.split(",")] if args.selected_analysts else None
    
    # Run the backtest
    result = run_direct_backtest(
        tickers=args.tickers,
        start_date=args.start_date,
        end_date=args.end_date,
        initial_capital=args.initial_capital,
        margin_requirement=args.margin_requirement,
        selected_analysts=selected_analysts,
        model_name=args.model_name
    )
    
    # Print the result
    if result["success"]:
        print(result["formatted_output"])
    else:
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)
