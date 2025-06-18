#!/usr/bin/env python
"""
Non-interactive version of the backtester for command-line usage.
"""

import sys
import os
import json
import subprocess
import re
import argparse
from datetime import datetime, timedelta

def run_non_interactive_backtest(
    tickers,
    start_date,
    end_date,
    initial_capital=100000,
    margin_requirement=0.0,
    selected_analysts=None,
    model_name="gpt-4o"
):
    """Run the backtester in a non-interactive mode for API usage"""
    
    # Default to key analysts if none specified
    if not selected_analysts:
        selected_analysts = [
            "warren_buffett", "portfolio_management", "risk_management"
        ]
    
    # Convert to list if string
    if isinstance(selected_analysts, str):
        selected_analysts = selected_analysts.split(',')
    
    # Create the output as JSON format
    result = {
        "portfolio_values": [],
        "trades": [],
        "performance_metrics": {},
        "agent_decisions": {},
        "raw": ""
    }
    
    # Log the configuration
    print(f"Running backtest with configuration:")
    print(f"- Tickers: {tickers}")
    print(f"- Date Range: {start_date} to {end_date}")
    print(f"- Initial Capital: ${initial_capital}")
    print(f"- Selected Analysts: {', '.join(selected_analysts)}")
    print(f"- Model: {model_name}")
    print("\nThis is a simulated backtest. In a full implementation, this would call the backtester module.")
    
    # Simulate some data for demonstration
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Generate portfolio values
    current_date = start_date_obj
    value = initial_capital
    while current_date <= end_date_obj:
        if current_date.weekday() < 5:  # Only business days
            # Add some random movement to portfolio value
            value = value * (1 + (hash(str(current_date)) % 100 - 50) / 5000)
            result["portfolio_values"].append({
                "date": current_date.strftime("%Y-%m-%d"),
                "value": round(value, 2)
            })
        current_date = current_date + timedelta(days=1)
    
    # Generate some trades
    ticker_list = tickers.split(',')
    for ticker in ticker_list:
        # Add sample trades for the portfolio
        result["trades"].append({
            "ticker": ticker,
            "date": (start_date_obj + timedelta(days=7)).strftime("%Y-%m-%d"),
            "action": "buy",
            "quantity": 10,
            "price": 150.25
        })
        
        result["trades"].append({
            "ticker": ticker,
            "date": (end_date_obj - timedelta(days=7)).strftime("%Y-%m-%d"),
            "action": "sell",
            "quantity": 10,
            "price": 165.75
        })
    
    # Calculate accuracy percentages
    for analyst in selected_analysts:
        if model_performance[analyst]["total_predictions"] > 0:
            model_performance[analyst]["accuracy"] = round(
                model_performance[analyst]["correct_predictions"] / 
                model_performance[analyst]["total_predictions"] * 100, 1
            )
        model_performance[analyst]["total_return"] = round(model_performance[analyst]["total_return"], 2)
    
    # Save model performance to results
    result["model_performance"] = model_performance
    
    # Add performance metrics
    end_value = result["portfolio_values"][-1]["value"]
    total_return = (end_value - initial_capital) / initial_capital * 100
    
    result["performance_metrics"] = {
        "total_return": round(total_return, 2),
        "annualized_return": round(total_return * 365 / ((end_date_obj - start_date_obj).days or 1), 2),
        "sharpe_ratio": 1.45,
        "max_drawdown": -8.2,
        "volatility": 15.7
    }
    
    # For each ticker, get the agent decisions
    for ticker in ticker_list:
        result["agent_decisions"][ticker] = []
        for analyst in selected_analysts:
            # Generate a more detailed and realistic analysis
            # Use different logic per analyst type to match their real-world approach
            confidence = (hash(analyst + ticker) % 80 + 20) / 100
            signal = "buy" if confidence > 0.5 else "sell"
            
            # Create detailed reasoning based on analyst type
            detailed_reasoning = {}
            metrics = {}
            
            if analyst == "warren_buffett":
                # Buffett focuses on fundamentals, long-term value
                pe_ratio = round(10 + (hash(ticker + "pe") % 40), 1)
                ev_ebitda = round(5 + (hash(ticker + "ev") % 25), 1)
                roic = round(5 + (hash(ticker + "roic") % 25), 1) 
                moat_score = round(1 + (hash(ticker + "moat") % 9), 1)
                
                metrics = {
                    "PE Ratio": pe_ratio,
                    "EV/EBITDA": ev_ebitda,
                    "ROIC %": roic,
                    "Moat Score": moat_score,
                    "Intrinsic Value": f"${round(100 + (hash(ticker + 'value') % 900), 2)}"
                }
                
                detailed_reasoning = {
                    "fundamentals": {
                        "valuation": f"The company's PE ratio of {pe_ratio}x and EV/EBITDA of {ev_ebitda}x suggest {'undervaluation' if pe_ratio < 20 else 'potential overvaluation'}.",
                        "moat": f"The business has a {'strong' if moat_score > 5 else 'moderate'} economic moat (score: {moat_score}/10) based on {'brand strength and pricing power' if hash(ticker) % 2 == 0 else 'cost advantages and network effects'}.",
                        "management": f"Management has {'efficiently' if roic > 15 else 'adequately'} allocated capital with ROIC of {roic}%."
                    },
                    "risks": {
                        "competition": f"Facing {'increasing' if hash(ticker + 'comp') % 2 == 0 else 'stable'} competitive pressure.",
                        "regulation": f"Regulatory environment is {'favorable' if hash(ticker + 'reg') % 2 == 0 else 'challenging'}."
                    },
                    "conclusion": f"Based on value investing principles, {'initiating a long position' if signal == 'buy' else 'avoiding the stock'} at current prices."
                }
            
            elif analyst == "cathie_wood":
                # Wood focuses on disruptive innovation, growth potential
                growth_rate = round(5 + (hash(ticker + "growth") % 65), 1)
                tam = round(10 + (hash(ticker + "tam") % 990), 1)
                innovation_score = round(1 + (hash(ticker + "innovation") % 9), 1)
                
                metrics = {
                    "5Y Revenue Growth %": growth_rate,
                    "TAM ($ Billions)": tam,
                    "Innovation Score": innovation_score,
                    "Disruption Potential": f"{round(1 + (hash(ticker + 'disrupt') % 9), 1)}/10"
                }
                
                detailed_reasoning = {
                    "innovation": {
                        "disruption": f"The company is {'leading' if innovation_score > 7 else 'participating in'} the {('AI' if hash(ticker) % 3 == 0 else 'robotics' if hash(ticker) % 3 == 1 else 'genomics')} revolution.",
                        "growth": f"Revenue growth of {growth_rate}% {'exceeds' if growth_rate > 25 else 'meets' if growth_rate > 15 else 'falls below'} our exponential growth threshold."
                    },
                    "market_opportunity": {
                        "tam": f"Addressable market of ${tam}B is {'enormous' if tam > 500 else 'substantial' if tam > 100 else 'moderate'}.",
                        "market_share": f"Potential to {'dominate' if innovation_score > 7 else 'capture significant share in'} their sector."
                    },
                    "conclusion": f"{'Strong buy based on disruptive potential' if signal == 'buy' else 'Avoiding despite innovation due to valuation concerns'}."
                }
            
            elif analyst == "portfolio_management":
                # Portfolio manager focuses on position sizing, diversification, overall fit
                alpha = round(-3 + (hash(ticker + "alpha") % 7), 2)
                beta = round(0.5 + (hash(ticker + "beta") % 15) / 10, 2)
                sharpe = round(0.5 + (hash(ticker + "sharpe") % 25) / 10, 2)
                
                metrics = {
                    "Alpha": alpha,
                    "Beta": beta,
                    "Sharpe Ratio": sharpe,
                    "Portfolio Fit": f"{round(1 + (hash(ticker + 'fit') % 9), 1)}/10"
                }
                
                detailed_reasoning = {
                    "portfolio_analysis": {
                        "diversification": f"Adding this position {'improves' if hash(ticker + 'div') % 2 == 0 else 'maintains'} sector diversification.",
                        "correlation": f"Shows {'low' if beta < 1 else 'high'} correlation (β={beta}) with existing holdings."
                    },
                    "risk_reward": {
                        "sharpe": f"Sharpe ratio of {sharpe} indicates {'excellent' if sharpe > 1.5 else 'average' if sharpe > 1 else 'poor'} risk-adjusted returns.",
                        "alpha": f"Generates {'positive' if alpha > 0 else 'negative'} alpha of {alpha}%."
                    },
                    "conclusion": f"{'Allocating capital based on favorable risk-adjusted metrics' if signal == 'buy' else 'Reducing exposure due to unfavorable portfolio metrics'}."
                }
            
            elif analyst == "risk_management":
                # Risk manager focuses on downside protection, volatility, risk metrics
                var = round(3 + (hash(ticker + "var") % 12), 1)
                vol = round(10 + (hash(ticker + "vol") % 40), 1)
                downside = round(5 + (hash(ticker + "down") % 20), 1)
                
                metrics = {
                    "VaR (95%)": f"{var}%",
                    "Volatility": f"{vol}%",
                    "Max Drawdown": f"{downside}%",
                    "Risk Score": f"{round(1 + (hash(ticker + 'risk') % 9), 1)}/10"
                }
                
                detailed_reasoning = {
                    "risk_metrics": {
                        "volatility": f"Historical volatility of {vol}% is {'below' if vol < 20 else 'above'} market average.",
                        "tail_risk": f"Value at Risk (95%) of {var}% indicates {'acceptable' if var < 8 else 'elevated'} downside exposure."
                    },
                    "scenario_analysis": {
                        "stress_test": f"In a market downturn, expected maximum drawdown of {downside}% {'within' if downside < 15 else 'exceeds'} risk tolerance.",
                        "liquidity": f"Position {'can be' if hash(ticker + 'liq') % 2 == 0 else 'may not be'} liquidated without significant market impact."
                    },
                    "conclusion": f"{'Risk profile supports position' if signal == 'buy' else 'Risk metrics exceed parameters'}."
                }
            
            else:
                # Generic analyst
                detailed_reasoning = {
                    "analysis": f"Standard analysis of {ticker}'s performance and outlook",
                    "conclusion": f"{'Recommend purchase' if signal == 'buy' else 'Recommend avoiding'} based on analysis."
                }
                metrics = {
                    "Score": f"{int(confidence*100)}/100"
                }
            
            # Add a more detailed reasonings and metrics to the agent decision
            result["agent_decisions"][ticker].append({
                "analyst": analyst,
                "signal": signal,
                "confidence": round(confidence, 2),
                "reasoning": f"Based on analysis of {ticker}'s fundamentals and recent market trends, the {analyst.replace('_', ' ').title()} recommends to {signal} with {int(confidence*100)}% confidence.",
                "detailed_reasoning": detailed_reasoning,
                "metrics": metrics
            })
    
    # Initialize model performance tracking
    model_performance = {}
    actual_movements = {}
    
    # Generate simulated actual market movements for comparison
    for ticker in ticker_list:
        # Simulate the actual price movement (positive = went up, negative = went down)
        # Use a different hash seed for each ticker to get different movements
        movement = 1 if hash(ticker + "actual") % 100 > 45 else -1  # 55% chance of going up
        actual_movements[ticker] = movement
    
    # Evaluate each analyst's performance
    for analyst in selected_analysts:
        model_performance[analyst] = {
            "correct_predictions": 0,
            "total_predictions": 0,
            "total_return": 0,
            "trades": [],
            "accuracy": 0
        }
        
        # Calculate performance for each ticker
        for ticker in ticker_list:
            decision = next((d for d in result["agent_decisions"][ticker] if d["analyst"] == analyst), None)
            if decision:
                # Determine if prediction was correct (buy when went up, sell when went down)
                was_correct = (decision["signal"] == "buy" and actual_movements[ticker] > 0) or \
                             (decision["signal"] == "sell" and actual_movements[ticker] < 0)
                
                # Calculate simulated return based on decision
                trade_return = 0
                if decision["signal"] == "buy":
                    # If buy and price went up, positive return. If buy and price went down, negative return
                    trade_return = actual_movements[ticker] * 10 * decision["confidence"]
                else:
                    # If sell and price went down, positive return. If sell and price went up, negative return
                    trade_return = -actual_movements[ticker] * 10 * decision["confidence"]
                
                # Update model performance
                model_performance[analyst]["correct_predictions"] += 1 if was_correct else 0
                model_performance[analyst]["total_predictions"] += 1
                model_performance[analyst]["total_return"] += trade_return
                model_performance[analyst]["trades"].append({
                    "ticker": ticker,
                    "signal": decision["signal"],
                    "confidence": decision["confidence"],
                    "correct": was_correct,
                    "return": trade_return
                })
    
    # Calculate accuracy percentages
    for analyst in selected_analysts:
        if model_performance[analyst]["total_predictions"] > 0:
            model_performance[analyst]["accuracy"] = round(
                model_performance[analyst]["correct_predictions"] / 
                model_performance[analyst]["total_predictions"] * 100, 1
            )
        model_performance[analyst]["total_return"] = round(model_performance[analyst]["total_return"], 2)
    
    # Save model performance to results
    result["model_performance"] = model_performance
    result["actual_movements"] = actual_movements
    
    # Generate raw output
    raw_output = f"""\n====== Backtest Results for {tickers} ======
    Date Range: {start_date} to {end_date}
    Initial Capital: ${initial_capital}
    Final Portfolio Value: ${end_value}
    Total Return: {total_return:.2f}%\n"""
    
    for ticker in ticker_list:
        raw_output += f"\n===== {ticker} Analysis =====\n"
        
        for analyst_decision in result["agent_decisions"][ticker]:
            analyst_name = analyst_decision['analyst'].replace('_', ' ').title()
            raw_output += f"\n==== {analyst_name} Agent ====\n"
            
            # Display the signal and confidence
            signal_color = "green" if analyst_decision["signal"] == "buy" else "red"
            raw_output += f"Signal: {analyst_decision['signal'].upper()} | Confidence: {analyst_decision['confidence']*100:.0f}%\n\n"
            
            # Display key metrics for each analyst
            raw_output += "Key Metrics:\n"
            for metric_name, metric_value in analyst_decision["metrics"].items():
                raw_output += f"- {metric_name}: {metric_value}\n"
            raw_output += "\n"
            
            # Display detailed reasoning based on analyst type
            raw_output += "Detailed Analysis:\n"
            
            if analyst_decision['analyst'] == "warren_buffett":
                raw_output += "Fundamental Valuation:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['fundamentals']['valuation']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['fundamentals']['moat']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['fundamentals']['management']}\n\n"
                
                raw_output += "Risk Assessment:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['risks']['competition']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['risks']['regulation']}\n\n"
                
            elif analyst_decision['analyst'] == "cathie_wood":
                raw_output += "Innovation Analysis:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['innovation']['disruption']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['innovation']['growth']}\n\n"
                
                raw_output += "Market Opportunity:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['market_opportunity']['tam']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['market_opportunity']['market_share']}\n\n"
                
            elif analyst_decision['analyst'] == "portfolio_management":
                raw_output += "Portfolio Analysis:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['portfolio_analysis']['diversification']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['portfolio_analysis']['correlation']}\n\n"
                
                raw_output += "Risk-Reward Metrics:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['risk_reward']['sharpe']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['risk_reward']['alpha']}\n\n"
                
            elif analyst_decision['analyst'] == "risk_management":
                raw_output += "Risk Metrics:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['risk_metrics']['volatility']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['risk_metrics']['tail_risk']}\n\n"
                
                raw_output += "Scenario Analysis:\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['scenario_analysis']['stress_test']}\n"
                raw_output += f"- {analyst_decision['detailed_reasoning']['scenario_analysis']['liquidity']}\n\n"
            
            # Add conclusion
            raw_output += "Conclusion:\n"
            for section_name, section_data in analyst_decision["detailed_reasoning"].items():
                if section_name == "conclusion":
                    raw_output += f"- {section_data}\n"
                elif isinstance(section_data, dict) and "conclusion" in section_data:
                    raw_output += f"- {section_data['conclusion']}\n"
            
            raw_output += "\n" + "-"*40 + "\n"
            
    # Add a weighted decision section that aggregates all analysts
    raw_output += "\n====== Weighted Decision Summary ======\n"
    for ticker in ticker_list:
        buy_signals = 0
        sell_signals = 0
        buy_confidence = 0
        sell_confidence = 0
        
        for analyst_decision in result["agent_decisions"][ticker]:
            if analyst_decision["signal"] == "buy":
                buy_signals += 1
                buy_confidence += analyst_decision["confidence"]
            else:
                sell_signals += 1
                sell_confidence += analyst_decision["confidence"]
        
        avg_buy_confidence = buy_confidence / buy_signals if buy_signals > 0 else 0
        avg_sell_confidence = sell_confidence / sell_signals if sell_signals > 0 else 0
        
        final_decision = "BUY" if buy_signals > sell_signals or (buy_signals == sell_signals and avg_buy_confidence > avg_sell_confidence) else "SELL"
        confidence_score = max(avg_buy_confidence, avg_sell_confidence) * 100 if final_decision == "BUY" else avg_sell_confidence * 100
        
        raw_output += f"{ticker}: {final_decision} with {confidence_score:.1f}% consensus confidence"  
        raw_output += f" ({buy_signals} buy vs {sell_signals} sell signals)\n"
        
    # Add model performance rankings
    raw_output += "\n====== Model Performance Rankings ======\n"
    
    # 1. Rank by returns
    raw_output += "\n=== Models Ranked by Returns ===\n"
    # Sort analysts by total return in descending order
    analysts_by_return = sorted(result["model_performance"].items(), key=lambda x: x[1]["total_return"], reverse=True)
    for i, (analyst, perf) in enumerate(analysts_by_return):
        raw_output += f"{i+1}. {analyst.replace('_', ' ').title()}: ${perf['total_return']:.2f}\n"
    
    # 2. Rank by prediction accuracy
    raw_output += "\n=== Models Ranked by Prediction Accuracy ===\n"
    # Sort analysts by accuracy in descending order
    analysts_by_accuracy = sorted(result["model_performance"].items(), key=lambda x: x[1]["accuracy"], reverse=True)
    for i, (analyst, perf) in enumerate(analysts_by_accuracy):
        raw_output += f"{i+1}. {analyst.replace('_', ' ').title()}: {perf['accuracy']}% ({perf['correct_predictions']}/{perf['total_predictions']})\n"
    
    # 3. Detailed trading performance for each analyst
    raw_output += "\n=== Detailed Model Performance ===\n"
    for analyst, perf in result["model_performance"].items():
        raw_output += f"\n{analyst.replace('_', ' ').title()}:\n"
        raw_output += f"  Total Return: ${perf['total_return']:.2f}\n"
        raw_output += f"  Accuracy: {perf['accuracy']}% ({perf['correct_predictions']}/{perf['total_predictions']})\n"
        raw_output += "  Trading Decisions:\n"
        
        # Show each trade decision
        for trade in perf["trades"]:
            correct_mark = "✓" if trade["correct"] else "✗"
            return_color = "positive" if trade["return"] > 0 else "negative"
            raw_output += f"    {trade['ticker']}: {trade['signal'].upper()} @ {trade['confidence']*100:.0f}% confidence - {correct_mark} (${trade['return']:.2f})\n"
            
    # Calculate overall model accuracy compared to actual market movements
    correct_predictions = sum(perf["correct_predictions"] for perf in result["model_performance"].values())
    total_predictions = sum(perf["total_predictions"] for perf in result["model_performance"].values())
    overall_accuracy = round(correct_predictions / total_predictions * 100, 1) if total_predictions > 0 else 0
    
    raw_output += f"\n=== Overall System Accuracy ===\n"
    raw_output += f"Overall Prediction Accuracy: {overall_accuracy}% ({correct_predictions}/{total_predictions})\n"
    
    # Display actual market movements for reference
    raw_output += "\n=== Actual Market Movements ===\n"
    for ticker, movement in actual_movements.items():
        direction = "UP" if movement > 0 else "DOWN"
        raw_output += f"{ticker}: Went {direction}\n"
    
    # Add performance summary
    raw_output += "\n====== Performance Summary ======\n"
    raw_output += f"Total Return: {result['performance_metrics']['total_return']}\n"
    raw_output += f"Annualized Return: {result['performance_metrics']['annualized_return']}\n"
    raw_output += f"Sharpe Ratio: {result['performance_metrics']['sharpe_ratio']}\n"
    raw_output += f"Max Drawdown: {result['performance_metrics']['max_drawdown']}\n"
    raw_output += f"Volatility: {result['performance_metrics']['volatility']}\n"
    
    result["raw"] = raw_output
    
    return result

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run backtesting simulation non-interactively")
    parser.add_argument(
        "--tickers",
        type=str,
        required=True,
        help="Comma-separated list of stock ticker symbols (e.g., AAPL,MSFT,GOOGL)",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        required=True,
        help="Start date in YYYY-MM-DD format",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        required=True,
        help="End date in YYYY-MM-DD format",
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
        default="warren_buffett,portfolio_management,risk_management",
        help="Comma-separated list of analysts to use (default: warren_buffett,portfolio_management,risk_management)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gpt-4o",
        help="LLM model to use (default: gpt-4o)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="console",
        help="Output format: console or json (default: console)",
    )
    
    args = parser.parse_args()
    
    # Run the backtest
    result = run_non_interactive_backtest(
        tickers=args.tickers,
        start_date=args.start_date,
        end_date=args.end_date,
        initial_capital=args.initial_capital,
        margin_requirement=args.margin_requirement,
        selected_analysts=args.selected_analysts.split(','),
        model_name=args.model
    )
    
    # Output results
    if args.output == "json":
        print(json.dumps(result, indent=2))
    else:
        # Pretty print the raw output
        print("\n" + result["raw"])
        
        print("\n====== Performance Summary ======")
        for metric, value in result["performance_metrics"].items():
            print(f"{metric.replace('_', ' ').title()}: {value}")
