#!/usr/bin/env python
"""
Basic CLI Demo for Real Backtesting in AI Hedge Fund

This demo provides a simple command-line interface to run real backtests
and display actual portfolio values, trades and performance metrics.

No external dependencies required - only standard Python libraries.
"""

import sys
import json
import argparse
from datetime import datetime
from backend.standalone_backtester import run_standalone_backtest, EnhancedJSONEncoder

def parse_args():
    parser = argparse.ArgumentParser(description='Basic Real Backtesting Demo')
    parser.add_argument('--tickers', required=True, help='Comma-separated list of ticker symbols')
    parser.add_argument('--start', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--capital', type=float, default=100000, help='Initial capital amount')
    return parser.parse_args()

def format_currency(value):
    """Format a number as currency"""
    return f"${value:,.2f}"

def print_header(title):
    """Print a section header"""
    print("\n" + "="*80)
    print(" "*(40-len(title)//2) + title)
    print("="*80)

def print_table(headers, data):
    """Print data as a simple table"""
    # Calculate column widths
    col_widths = [len(h) for h in headers]
    for row in data:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Print headers
    header_row = ""
    for i, header in enumerate(headers):
        header_row += f"{header:{col_widths[i]+2}}"
    print(header_row)
    print("-" * sum(width + 2 for width in col_widths))
    
    # Print data rows
    for row in data:
        row_str = ""
        for i, cell in enumerate(row):
            row_str += f"{str(cell):{col_widths[i]+2}}"
        print(row_str)

def display_portfolio_values(result):
    """Display portfolio values over time"""
    print_header("PORTFOLIO VALUES")
    
    portfolio_values = result.get('portfolio_values', [])
    if not portfolio_values:
        print("No portfolio value data available")
        return
    
    data = []
    for entry in portfolio_values:
        data.append([entry['date'], format_currency(entry['value'])])
    
    print_table(['Date', 'Portfolio Value'], data)

def display_trades(result):
    """Display trades executed during the backtest"""
    print_header("TRADES")
    
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
    
    print_table(['Date', 'Ticker', 'Action', 'Quantity', 'Price', 'Value'], data)

def display_performance_metrics(result):
    """Display performance metrics"""
    print_header("PERFORMANCE METRICS")
    
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
    
    print_table(['Metric', 'Value'], data)

def main():
    """Main function to run the backtest demo"""
    print("\n" + "="*80)
    print(" "*20 + "AI HEDGE FUND - REAL BACKTESTING DEMO")
    print("="*80 + "\n")
    
    # Parse command line arguments
    args = parse_args()
    
    print(f"\nRunning backtest with:")
    print(f"- Tickers: {args.tickers}")
    print(f"- Period: {args.start} to {args.end}")
    print(f"- Initial capital: {format_currency(args.capital)}")
    print("\nThis will use REAL data and generate REAL portfolio values...\n")
    
    # Run the backtest
    result = run_standalone_backtest(
        tickers=args.tickers,
        start_date=args.start,
        end_date=args.end,
        initial_capital=args.capital,
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
        import traceback
        traceback.print_exc()
    print("\nThanks for using AI Hedge Fund Real Backtesting Demo!")
