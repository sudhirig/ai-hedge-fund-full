#!/usr/bin/env python3
"""
Command-line interface for standalone backtester
This script can be used directly by the frontend without requiring a running backend server
Usage: python run_backtest_cli.py --tickers AAPL,MSFT --start 2023-01-01 --end 2023-01-31 --capital 10000
"""

import sys
import json
import argparse
from backend.standalone_backtester import run_standalone_backtest, EnhancedJSONEncoder

def parse_args():
    parser = argparse.ArgumentParser(description='Run backtesting simulation')
    parser.add_argument('--tickers', required=True, help='Comma-separated list of ticker symbols')
    parser.add_argument('--start', required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end', required=True, help='End date (YYYY-MM-DD)')
    parser.add_argument('--capital', type=float, default=10000, help='Initial capital amount')
    parser.add_argument('--margin', type=float, default=0.0, help='Margin requirement')
    parser.add_argument('--output-file', help='Output file for results (default: prints to stdout)')
    return parser.parse_args()

def main():
    args = parse_args()
    
    print(f"Running backtest with tickers: {args.tickers}")
    print(f"Period: {args.start} to {args.end}")
    print(f"Initial capital: ${args.capital:,.2f}")
    
    # Run the backtest
    result = run_standalone_backtest(
        tickers=args.tickers,
        start_date=args.start,
        end_date=args.end,
        initial_capital=args.capital,
        margin_requirement=args.margin
    )
    
    # Output the results
    if args.output_file:
        with open(args.output_file, 'w') as f:
            json.dump(result, f, indent=2, cls=EnhancedJSONEncoder)
        print(f"Results written to {args.output_file}")
    else:
        print(json.dumps(result, indent=2, cls=EnhancedJSONEncoder))
        
    # Print summary
    if result.get('portfolio_values'):
        print("\nBacktest Summary:")
        print(f"Portfolio values: {len(result['portfolio_values'])} data points")
        print(f"Trades executed: {len(result['trades'])}")
        metrics = result.get('performance_metrics', {})
        print(f"Total return: {metrics.get('total_return', 'N/A')}%")
        print(f"Sharpe ratio: {metrics.get('sharpe_ratio', 'N/A')}")
        
    return 0

if __name__ == "__main__":
    sys.exit(main())
