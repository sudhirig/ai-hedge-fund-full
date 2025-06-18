#!/usr/bin/env python
"""
Interactive Demo for Real Backtesting in AI Hedge Fund

This demo provides a simple interactive CLI to run real backtests
and display actual portfolio values, trades and performance metrics.

No frontend or backend server required - just run this script directly.
"""

import os
import json
import argparse
import pandas as pd
import matplotlib.pyplot as plt
from tabulate import tabulate
from datetime import datetime
from backend.standalone_backtester import run_standalone_backtest, EnhancedJSONEncoder

def parse_args():
    parser = argparse.ArgumentParser(description='Interactive Real Backtesting Demo')
    parser.add_argument('--tickers', help='Comma-separated list of ticker symbols')
    parser.add_argument('--start', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end', help='End date (YYYY-MM-DD)')
    parser.add_argument('--capital', type=float, default=100000, help='Initial capital amount')
    return parser.parse_args()

def get_user_input():
    """Get input parameters from user if not provided via command line"""
    tickers = input("Enter ticker symbols (comma-separated, e.g., AAPL,MSFT): ")
    start_date = input("Enter start date (YYYY-MM-DD): ")
    end_date = input("Enter end date (YYYY-MM-DD): ")
    capital = input("Enter initial capital (default: 100000): ")
    if not capital:
        capital = 100000
    else:
        capital = float(capital)
    return tickers, start_date, end_date, capital

def format_currency(value):
    """Format a number as currency"""
    return f"${value:,.2f}"

def display_portfolio_values(result):
    """Display portfolio values over time"""
    print("\n" + "="*80)
    print(" "*30 + "PORTFOLIO VALUES")
    print("="*80)
    
    portfolio_values = result.get('portfolio_values', [])
    if not portfolio_values:
        print("No portfolio value data available")
        return
    
    data = []
    for entry in portfolio_values:
        data.append([entry['date'], format_currency(entry['value'])])
    
    print(tabulate(data, headers=['Date', 'Portfolio Value'], tablefmt='grid'))
    
    # Create a simple plot of portfolio values
    dates = [entry['date'] for entry in portfolio_values]
    values = [entry['value'] for entry in portfolio_values]
    
    plt.figure(figsize=(10, 6))
    plt.plot(dates, values)
    plt.title('Portfolio Value Over Time')
    plt.xlabel('Date')
    plt.ylabel('Portfolio Value ($)')
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.tight_layout()
    
    # Save the plot to a file
    plot_filename = "portfolio_values.png"
    plt.savefig(plot_filename)
    print(f"\nPortfolio value plot saved to {plot_filename}")

def display_trades(result):
    """Display trades executed during the backtest"""
    print("\n" + "="*80)
    print(" "*30 + "TRADES")
    print("="*80)
    
    trades = result.get('trades', [])
    if not trades:
        print("No trade data available")
        return
    
    data = []
    for trade in trades:
        data.append([
            trade['date'],
            trade['ticker'],
            trade['action'],
            trade['quantity'],
            format_currency(trade['price']),
            format_currency(trade['value'])
        ])
    
    print(tabulate(data, headers=['Date', 'Ticker', 'Action', 'Quantity', 'Price', 'Value'], tablefmt='grid'))

def display_performance_metrics(result):
    """Display performance metrics"""
    print("\n" + "="*80)
    print(" "*30 + "PERFORMANCE METRICS")
    print("="*80)
    
    metrics = result.get('performance_metrics', {})
    if not metrics:
        print("No performance metrics available")
        return
    
    data = []
    data.append(["Total Return (%)", metrics.get('total_return', 'N/A')])
    data.append(["Annual Return (%)", metrics.get('annual_return', 'N/A')])
    data.append(["Sharpe Ratio", metrics.get('sharpe_ratio', 'N/A')])
    data.append(["Sortino Ratio", metrics.get('sortino_ratio', 'N/A')])
    data.append(["Max Drawdown (%)", metrics.get('max_drawdown', 'N/A')])
    data.append(["Win Rate (%)", metrics.get('win_rate', 'N/A')])
    
    print(tabulate(data, headers=['Metric', 'Value'], tablefmt='grid'))

def main():
    """Main function to run the backtest demo"""
    print("\n" + "="*80)
    print(" "*20 + "AI HEDGE FUND - REAL BACKTESTING DEMO")
    print("="*80 + "\n")
    
    # Parse command line arguments
    args = parse_args()
    
    # Get input parameters (from command line or user input)
    tickers = args.tickers
    start_date = args.start
    end_date = args.end
    capital = args.capital
    
    if not all([tickers, start_date, end_date]):
        tickers, start_date, end_date, capital = get_user_input()
    
    print(f"\nRunning backtest with:")
    print(f"- Tickers: {tickers}")
    print(f"- Period: {start_date} to {end_date}")
    print(f"- Initial capital: {format_currency(capital)}")
    print("\nThis will use REAL data and generate REAL portfolio values...\n")
    
    # Run the backtest
    result = run_standalone_backtest(
        tickers=tickers,
        start_date=start_date,
        end_date=end_date,
        initial_capital=capital,
        margin_requirement=0.0
    )
    
    # Display results
    display_portfolio_values(result)
    display_trades(result)
    display_performance_metrics(result)
    
    # Save result to file
    result_file = f"backtest_result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2, cls=EnhancedJSONEncoder)
    print(f"\nDetailed backtest results saved to {result_file}")
    
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBacktest interrupted by user.")
    except Exception as e:
        print(f"\nError running backtest: {e}")
    print("\nThanks for using AI Hedge Fund Real Backtesting Demo!")
