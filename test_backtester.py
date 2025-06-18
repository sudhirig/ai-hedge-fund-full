#!/usr/bin/env python3
"""
Test script for the direct_backtester.py integration
"""

import os
import sys
import json

# Add the deploy_backend directory to the Python path
deploy_backend_path = os.path.join(os.path.dirname(__file__), 'deploy_backend')
src_path = os.path.join(deploy_backend_path, 'src')

if deploy_backend_path not in sys.path:
    sys.path.append(deploy_backend_path)
if src_path not in sys.path:
    sys.path.append(src_path)

try:
    print("Attempting to import direct_backtester...")
    from src.direct_backtester import run_direct_backtest
    print("Import successful!")
except ImportError as e:
    print(f"Import error: {e}")
    try:
        print("Trying alternative import...")
        from direct_backtester import run_direct_backtest
        print("Alternative import successful!")
    except ImportError as e2:
        print(f"Alternative import error: {e2}")
        print("Trying manual import...")
        import importlib.util
        direct_backtester_path = os.path.join(src_path, 'direct_backtester.py')
        print(f"Loading from {direct_backtester_path}")
        print(f"File exists? {os.path.exists(direct_backtester_path)}")
        
        spec = importlib.util.spec_from_file_location("direct_backtester", direct_backtester_path)
        direct_backtester = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(direct_backtester)
        run_direct_backtest = direct_backtester.run_direct_backtest
        print("Manual import successful!")

# Test parameters
tickers = ["AAPL"]
start_date = "2023-01-01"
end_date = "2023-01-10"
initial_capital = 10000.0

# Use only the core analysts that are definitely available
available_analysts = ["warren_buffett", "charlie_munger"]

print(f"\nRunning backtest with: {tickers}, {start_date} to {end_date}")

try:
    # Run the direct backtester
    result = run_direct_backtest(
        tickers=tickers,
        start_date=start_date,
        end_date=end_date,
        initial_capital=initial_capital,
        model_name="gpt-4o",
        selected_analysts=available_analysts
    )
    
    # Print debug info about the result
    print(f"Backtest result type: {type(result)}")
    if isinstance(result, dict):
        print(f"Backtest result keys: {result.keys()}")
        print(f"Success: {result.get('success', False)}")
        
        # Check for portfolio values
        if 'portfolio_values' in result:
            print(f"Portfolio values type: {type(result['portfolio_values'])}")
            print(f"Portfolio values length: {len(result['portfolio_values']) if hasattr(result['portfolio_values'], '__len__') else 'N/A'}")
            print(f"First few portfolio values: {list(result['portfolio_values'].items())[:3] if isinstance(result['portfolio_values'], dict) else result['portfolio_values'][:3] if isinstance(result['portfolio_values'], list) else 'N/A'}")
        
        # Check for trades
        if 'trades' in result:
            print(f"Trades type: {type(result['trades'])}")
            print(f"Number of trades: {len(result['trades'])}")
            print(f"First trade: {result['trades'][0] if result['trades'] else 'No trades'}")
        
        # Check for performance metrics
        if 'performance_metrics' in result:
            print(f"Performance metrics: {result['performance_metrics']}")
    else:
        print(f"Unexpected result type: {type(result)}")
        print(f"Result: {result}")
        
except Exception as e:
    import traceback
    print(f"Error in direct_backtester: {e}")
    print(traceback.format_exc())
