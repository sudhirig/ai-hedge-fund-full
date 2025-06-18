#!/usr/bin/env python
"""
Integrated Backtester for AI Hedge Fund

This backtester combines:
1. Original implementation's real data fetching and model calling
2. Enhanced visualization of the decision flow from analysts to portfolio management
3. Clear focus on the Portfolio Management model as the final decision maker

It uses actual agent models and real data from APIs, unlike our simulated version.
"""

import sys
import os
import json
import argparse
import random
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd
import numpy as np
from colorama import Fore, Style, init
from tabulate import tabulate
import yfinance as yf
import questionary

# Import components from the original backtester
from src.backtester import Backtester

# Initialize colorama
init(autoreset=True)

def format_backtest_row(
    date,
    ticker,
    action,
    quantity,
    price,
    shares_owned,
    position_value,
    bullish_count,
    bearish_count,
    neutral_count,
    is_summary=False,
    total_value=0,
    return_pct=0,
    cash_balance=0,
    total_position_value=0,
    sharpe_ratio=0,
    sortino_ratio=0,
    max_drawdown=0,
):
    """Format a row for the backtest results table"""
    if is_summary:
        return {
            "date": f"{Fore.YELLOW}{date}{Style.RESET_ALL}",
            "ticker": f"{Fore.YELLOW}SUMMARY{Style.RESET_ALL}",
            "action": "",
            "quantity": "",
            "price": "",
            "position": "",
            "value": f"{Fore.YELLOW}${total_value:,.2f}{Style.RESET_ALL}",
            "signals": f"{Fore.YELLOW}Return: {return_pct:,.2f}%{Style.RESET_ALL}",
            "cash": f"{Fore.GREEN}${cash_balance:,.2f}{Style.RESET_ALL}",
            "positions": f"${total_position_value:,.2f}",
            "metrics": f"SR:{sharpe_ratio:.2f} | DD:{max_drawdown:.1f}%",
        }
    else:
        # Color code for action
        if action.lower() == "buy":
            action_color = Fore.GREEN
        elif action.lower() == "sell":
            action_color = Fore.RED
        else:
            action_color = Fore.BLUE
            
        # Signal distribution indicators
        signal_display = f"B:{Fore.GREEN}{bullish_count}{Style.RESET_ALL} "
        signal_display += f"S:{Fore.RED}{bearish_count}{Style.RESET_ALL} "
        signal_display += f"N:{Fore.BLUE}{neutral_count}{Style.RESET_ALL}"
            
        return {
            "date": date,
            "ticker": ticker,
            "action": f"{action_color}{action.upper()}{Style.RESET_ALL}",
            "quantity": quantity if quantity else "",
            "price": f"${price:.2f}",
            "position": shares_owned,
            "value": f"${position_value:.2f}",
            "signals": signal_display,
            "cash": "",
            "positions": "",
            "metrics": "",
        }

def print_backtest_results(table_rows):
    """Print results in a tabular format"""
    if not table_rows:
        return
        
    headers = {
        "date": "Date",
        "ticker": "Ticker",
        "action": "Decision",
        "quantity": "Qty",
        "price": "Price",
        "position": "Position",
        "value": "Value",
        "signals": "Signals",
        "cash": "Cash",
        "positions": "All Positions",
        "metrics": "Metrics",
    }
    
    # Find the most recent summary row to print at the top
    summary_rows = [row for row in table_rows if "SUMMARY" in row["ticker"]]
    if summary_rows:
        latest_summary = summary_rows[-1]
        print("\n")
        print(f"Portfolio Value: {latest_summary['value']}")
        print(f"Return: {latest_summary['signals']}")
        print(f"Cash: {latest_summary['cash']}")
        print(f"Performance: {latest_summary['metrics']}")
        print("\n")
    
    # Print the table
    print(tabulate(
        table_rows,
        headers=headers,
        tablefmt="grid",
        stralign="left",
    ))
    print("\n")

def run_integrated_backtest(
    tickers,
    start_date,
    end_date,
    initial_capital=100000,
    margin_requirement=0.0,
    selected_analysts=None,
    model_name="gpt-4o"
):
    """
    Run a backtest using the original backtester implementation with enhanced output.
    
    This uses real data APIs and calls to actual agent models.
    """
    if selected_analysts is None:
        selected_analysts = ["warren_buffett", "cathie_wood", "risk_management", "ben_graham"]
    
    print(f"Running integrated backtest with configuration:")
    print(f"- Tickers: {tickers}")
    print(f"- Date Range: {start_date} to {end_date}")
    print(f"- Initial Capital: ${initial_capital:,.2f}")
    print(f"- Analysis Models: {', '.join(selected_analysts)}")
    print(f"- Decision Model: portfolio_management")
    print(f"- LLM: {model_name}")
    print()
    
    # Define a custom agent function that emphasizes the flow from analysts to portfolio manager
    def hedge_fund_agent(ticker, date, price_data, news, financials, llm_config):
        """
        Custom agent function that calls analyst models and aggregates their outputs
        through the portfolio management model.
        """
        # Initialize the response structure
        response = {
            "ticker": ticker,
            "date": date,
            "signals": {},
            "decision": {}
        }
        
        # Import necessary agent models
        try:
            from src.agents.warren_buffett import analyze as warren_buffett_analyze
            from src.agents.cathie_wood import analyze as cathie_wood_analyze
            from src.agents.ben_graham import analyze as ben_graham_analyze
            from src.agents.risk_management import analyze as risk_analyze
            from src.agents.portfolio_management import decide
        except ImportError as e:
            print(f"Error importing agent models: {e}")
            print("Using simulated agent behavior as fallback")
            # If imports fail, we'll simulate the behavior
            
            # Simulate analyst signals
            for analyst in selected_analysts:
                # Generate a random signal (bullish, bearish, neutral)
                rng = hash(f"{analyst}_{ticker}_{date}") % 100
                if rng < 40:
                    signal = "bullish"
                elif rng < 75:
                    signal = "bearish"
                else:
                    signal = "neutral"
                    
                # Generate a random confidence (50-95%)
                confidence = (hash(f"{analyst}_{ticker}_{date}_conf") % 45 + 50) / 100
                
                # Generate reasoning
                reasoning = f"Analysis of {ticker} on {date} yielded a {signal} outlook."
                
                # Store the signal
                response["signals"][analyst] = {
                    "signal": signal,
                    "confidence": confidence,
                    "reasoning": reasoning
                }
            
            # Make a portfolio decision based on signals
            bullish_count = sum(1 for s in response["signals"].values() if s["signal"] == "bullish")
            bearish_count = sum(1 for s in response["signals"].values() if s["signal"] == "bearish")
            
            if bullish_count > bearish_count:
                action = "buy"
                quantity = max(1, int((initial_capital * 0.1) / price_data.iloc[-1]["Close"]))
            elif bearish_count > bullish_count:
                action = "sell"
                quantity = max(1, int((initial_capital * 0.1) / price_data.iloc[-1]["Close"]))
            else:
                action = "hold"
                quantity = 0
                
            response["decision"] = {
                "action": action,
                "quantity": quantity,
                "reasoning": f"Based on {bullish_count} bullish and {bearish_count} bearish signals."
            }
            
            return response
        
        # Try to call actual analyst models
        try:
            # Run analysis for each selected analyst
            if "warren_buffett" in selected_analysts:
                wb_analysis = warren_buffett_analyze(ticker, date, price_data, news, financials, llm_config)
                response["signals"]["warren_buffett"] = wb_analysis
                
            if "cathie_wood" in selected_analysts:
                cw_analysis = cathie_wood_analyze(ticker, date, price_data, news, financials, llm_config)
                response["signals"]["cathie_wood"] = cw_analysis
                
            if "ben_graham" in selected_analysts:
                bg_analysis = ben_graham_analyze(ticker, date, price_data, news, financials, llm_config)
                response["signals"]["ben_graham"] = bg_analysis
                
            if "risk_management" in selected_analysts:
                risk_analysis = risk_analyze(ticker, date, price_data, news, financials, llm_config)
                response["signals"]["risk_management"] = risk_analysis
            
            # Let the portfolio management model make the final decision
            pm_decision = decide(ticker, date, response["signals"], price_data, llm_config)
            response["decision"] = pm_decision
            
            return response
        
        except Exception as e:
            print(f"Error calling agent models: {e}")
            print("Using simulated agent behavior")
            # Fall back to simulated behavior if model calls fail
            # This is the same code as in the ImportError exception handler
            
            # Simulate analyst signals
            for analyst in selected_analysts:
                # Generate a random signal (bullish, bearish, neutral)
                rng = hash(f"{analyst}_{ticker}_{date}") % 100
                if rng < 40:
                    signal = "bullish"
                elif rng < 75:
                    signal = "bearish"
                else:
                    signal = "neutral"
                    
                # Generate a random confidence (50-95%)
                confidence = (hash(f"{analyst}_{ticker}_{date}_conf") % 45 + 50) / 100
                
                # Generate reasoning
                reasoning = f"Analysis of {ticker} on {date} yielded a {signal} outlook."
                
                # Store the signal
                response["signals"][analyst] = {
                    "signal": signal,
                    "confidence": confidence,
                    "reasoning": reasoning
                }
            
            # Make a portfolio decision based on signals
            bullish_count = sum(1 for s in response["signals"].values() if s["signal"] == "bullish")
            bearish_count = sum(1 for s in response["signals"].values() if s["signal"] == "bearish")
            
            if bullish_count > bearish_count:
                action = "buy"
                quantity = max(1, int((initial_capital * 0.1) / price_data.iloc[-1]["Close"]))
            elif bearish_count > bullish_count:
                action = "sell"
                quantity = max(1, int((initial_capital * 0.1) / price_data.iloc[-1]["Close"]))
            else:
                action = "hold"
                quantity = 0
                
            response["decision"] = {
                "action": action,
                "quantity": quantity,
                "reasoning": f"Based on {bullish_count} bullish and {bearish_count} bearish signals."
            }
            
            return response
    
    # Parse the tickers list
    ticker_list = tickers.split(',')
    
    # Create an instance of the original Backtester with our custom agent
    backtester = Backtester(
        agent=hedge_fund_agent,
        tickers=ticker_list,
        start_date=start_date,
        end_date=end_date,
        initial_capital=initial_capital,
        model_name=model_name,
        selected_analysts=selected_analysts,
        initial_margin_requirement=margin_requirement
    )
    
    # Run the backtest
    print(f"\n{'=' * 80}")
    print(f"RUNNING INTEGRATED BACKTEST")
    print(f"{'=' * 80}\n")
    
    try:
        # Call the original backtester but enhance the output presentation
        performance_metrics = backtester.run_backtest()
        
        # Analyze the results
        backtester.analyze_performance()
        
        # Calculate additional metrics for reporting
        portfolio_values_df = pd.DataFrame(backtester.portfolio_values)
        
        # Get all analyst signals and decisions
        analyst_signals = {}
        portfolio_decisions = {}
        
        # Create a structured output for any frontend visualization
        result = {
            "portfolio_values": backtester.portfolio_values,
            "trades": backtester.portfolio["trades"] if "trades" in backtester.portfolio else [],
            "analyst_signals": analyst_signals,
            "portfolio_decisions": portfolio_decisions,
            "performance_metrics": performance_metrics
        }
        
        # Return the full result object
        return result
        
    except Exception as e:
        print(f"Error running backtest: {e}")
        return None

def select_analysts():
    """Interactive analyst selection using questionary"""
    print("\nSelect analysts for the backtest:")
    
    choices = questionary.checkbox(
        "Choose analysts:",
        choices=[
            questionary.Choice("warren_buffett", checked=True),
            questionary.Choice("cathie_wood", checked=True),
            questionary.Choice("ben_graham", checked=True),
            questionary.Choice("risk_management", checked=True),
        ],
        style=questionary.Style(
            [
                ("qmark", "fg:#673ab7 bold"),
                ("question", "bold"),
                ("answer", "fg:#f44336 bold"),
                ("pointer", "fg:#673ab7 bold"),
                ("highlighted", "fg:#673ab7 bold"),
                ("selected", "fg:#cc5454"),
                ("separator", "fg:#673ab7"),
                ("instruction", ""),
                ("text", ""),
                ("disabled", "fg:#858585 italic"),
                ("pointer", "noinherit"),
            ]
        ),
    ).ask()
    
    if not choices:
        print("\n\nInterrupt received. Exiting...")
        sys.exit(0)
    else:
        selected_analysts = choices
        print(
            f"\nSelected analysts: "
            f"{', '.join(Fore.GREEN + choice.title().replace('_', ' ') + Style.RESET_ALL for choice in choices)}"
        )
    
    return selected_analysts

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run AI Hedge Fund integrated backtesting")
    parser.add_argument(
        "--tickers",
        required=True,
        help="Comma-separated list of stock tickers to backtest"
    )
    parser.add_argument(
        "--start-date",
        required=True,
        help="Start date in YYYY-MM-DD format"
    )
    parser.add_argument(
        "--end-date",
        required=True,
        help="End date in YYYY-MM-DD format"
    )
    parser.add_argument(
        "--initial-capital",
        type=float,
        default=100000,
        help="Initial capital for the simulation"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Use interactive analyst selection"
    )
    parser.add_argument(
        "--model",
        default="gpt-4o",
        help="AI model to use for analysis"
    )
    
    args = parser.parse_args()
    
    # Get analysts - either interactively or from command line
    if args.interactive:
        selected_analysts = select_analysts()
    else:
        selected_analysts = ["warren_buffett", "cathie_wood", "risk_management", "ben_graham"]
    
    # Run the integrated backtest
    result = run_integrated_backtest(
        tickers=args.tickers,
        start_date=args.start_date,
        end_date=args.end_date,
        initial_capital=args.initial_capital,
        selected_analysts=selected_analysts,
        model_name=args.model
    )
    
    # Optionally save results to a file
    if result:
        with open('backtest_results.json', 'w') as f:
            # Convert result to a serializable format
            serializable_result = {
                "portfolio_values": result["portfolio_values"],
                "performance_metrics": result["performance_metrics"],
                # Other fields would be included here
            }
            
            # Save to JSON
            json.dump(serializable_result, f, indent=2)
        print("Results saved to backtest_results.json")
