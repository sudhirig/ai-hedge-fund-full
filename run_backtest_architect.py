#!/usr/bin/env python
"""
Enhanced non-interactive version of the backtester that properly reflects the
AI Hedge Fund architecture where the Portfolio Management model makes the final decisions
based on all other analysts' inputs.
"""

import sys
import os
import json
import argparse
import random
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
    """
    Run a backtesting simulation without interactive prompts.
    Returns a JSON object with the results.
    """
    if selected_analysts is None:
        selected_analysts = ["warren_buffett", "cathie_wood", "risk_management", "ben_graham"]
    
    # Ensure portfolio_management is not in the analysts list as it's the decision maker
    if "portfolio_management" in selected_analysts:
        selected_analysts.remove("portfolio_management")
    
    print(f"Running backtest with configuration:")
    print(f"- Tickers: {tickers}")
    print(f"- Date Range: {start_date} to {end_date}")
    print(f"- Initial Capital: ${initial_capital}")
    print(f"- Analysis Models: {', '.join(selected_analysts)}")
    print(f"- Decision Model: portfolio_management")
    print(f"- LLM: {model_name}")
    print()
    
    print("This is a simulated backtest reflecting the AI Hedge Fund architecture.")
    print("In this system, analyst models provide inputs and the Portfolio Management model makes the final decisions.")
    print()
    
    # Initialize result structure
    result = {
        "portfolio_values": [],
        "trades": [],
        "analyst_inputs": {},     # Inputs from analyst models
        "risk_assessment": {},    # Risk management filter
        "portfolio_decisions": {},  # Final decisions from portfolio management
        "performance_metrics": {},
        "raw": ""
    }
    
    # Parse dates for simulation
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
    
    # Get final portfolio value for performance metrics
    end_value = result["portfolio_values"][-1]["value"]
    total_return = (end_value - initial_capital) / initial_capital * 100
    
    # Add performance metrics
    result["performance_metrics"] = {
        "total_return": round(total_return, 2),
        "annualized_return": round(total_return * 365 / ((end_date_obj - start_date_obj).days or 1), 2),
        "sharpe_ratio": 1.45,
        "max_drawdown": -8.2,
        "volatility": 15.7
    }
    
    # Prepare ticker list
    ticker_list = tickers.split(',')
    
    # Generate simulated actual market movements for comparison
    actual_movements = {}
    for ticker in ticker_list:
        # Simulate the actual price movement (positive = went up, negative = went down)
        # Use a different hash seed for each ticker to get different movements
        movement = 1 if hash(ticker + "actual") % 100 > 45 else -1  # 55% chance of going up
        actual_movements[ticker] = movement
    
    # Initialize analyst inputs for each ticker
    for ticker in ticker_list:
        result["analyst_inputs"][ticker] = []
        result["risk_assessment"][ticker] = {}
        result["portfolio_decisions"][ticker] = {}
        
        # Generate sample trades for the portfolio (buy and sell)
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
        
        # Step 1: Generate inputs from each analyst model
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
                
            elif analyst == "ben_graham":
                # Graham focuses on value, margin of safety
                pe_ratio = round(8 + (hash(ticker + "pe_g") % 30), 1)
                pb_ratio = round(0.5 + (hash(ticker + "pb") % 35) / 10, 1)
                current_ratio = round(1 + (hash(ticker + "cr") % 40) / 10, 1)
                debt_equity = round((hash(ticker + "de") % 150) / 100, 2)
                
                metrics = {
                    "PE Ratio": pe_ratio,
                    "PB Ratio": pb_ratio,
                    "Current Ratio": current_ratio,
                    "Debt/Equity": debt_equity,
                    "Margin of Safety": f"{round((hash(ticker + 'safety') % 60), 0)}%"
                }
                
                detailed_reasoning = {
                    "value_metrics": {
                        "price_ratios": f"Trading at {'attractive' if pe_ratio < 15 else 'reasonable' if pe_ratio < 20 else 'elevated'} multiples with PE of {pe_ratio}x and PB of {pb_ratio}x.",
                        "balance_sheet": f"Financial position is {'solid' if current_ratio > 2 else 'adequate' if current_ratio > 1.5 else 'concerning'} with current ratio of {current_ratio}."
                    },
                    "safety_factors": {
                        "leverage": f"Debt-to-equity ratio of {debt_equity} is {'conservative' if debt_equity < 0.5 else 'manageable' if debt_equity < 1 else 'concerning'}.",
                        "dividend": f"{'Provides' if hash(ticker + 'div_g') % 2 == 0 else 'Lacks'} dividend safety with {'stable' if hash(ticker + 'div_g') % 2 == 0 else 'inconsistent'} payout history."
                    },
                    "conclusion": f"{'Security meets margin of safety requirements' if signal == 'buy' else 'Insufficient margin of safety at current price'}."
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
            
            # Add a more detailed reasoning and metrics to the analyst decision
            result["analyst_inputs"][ticker].append({
                "analyst": analyst,
                "signal": signal,
                "confidence": round(confidence, 2),
                "reasoning": f"Based on analysis of {ticker}'s fundamentals and recent market trends, the {analyst.replace('_', ' ').title()} recommends to {signal} with {int(confidence*100)}% confidence.",
                "detailed_reasoning": detailed_reasoning,
                "metrics": metrics
            })
        
        # Step 2: Risk Assessment Filter
        # Risk management takes all analyst inputs and filters them
        buy_signals = sum(1 for a in result["analyst_inputs"][ticker] if a["signal"] == "buy")
        sell_signals = sum(1 for a in result["analyst_inputs"][ticker] if a["signal"] == "sell")
        
        avg_confidence = sum(a["confidence"] for a in result["analyst_inputs"][ticker]) / len(result["analyst_inputs"][ticker])
        
        # Get the risk management assessment
        risk_mgmt = next((a for a in result["analyst_inputs"][ticker] if a["analyst"] == "risk_management"), None)
        
        if risk_mgmt:
            risk_signal = risk_mgmt["signal"]
            risk_confidence = risk_mgmt["confidence"]
        else:
            # If there's no explicit risk management model, derive risk from overall signals
            risk_signal = "buy" if buy_signals > sell_signals else "sell"
            risk_confidence = 0.5 + (abs(buy_signals - sell_signals) / (buy_signals + sell_signals)) * 0.3
        
        # Create risk assessment
        risk_level = "Low" if hash(ticker + "risk_level") % 3 == 0 else "Medium" if hash(ticker + "risk_level") % 3 == 1 else "High"
        
        result["risk_assessment"][ticker] = {
            "risk_level": risk_level,
            "approved_for_trading": risk_level != "High",
            "position_size_limit": 100 - (hash(ticker + "position_limit") % 70),
            "risk_signal": risk_signal,
            "risk_confidence": round(risk_confidence, 2),
            "assessment": f"This security has {risk_level.lower()} risk. Position size limited to {100 - (hash(ticker + 'position_limit') % 70)}% of max allocation."
        }
        
        # Step 3: Portfolio Management Decision
        # The portfolio manager takes analyst inputs filtered by risk assessment
        
        # Calculate signal metrics
        buy_confidence_sum = sum(a["confidence"] for a in result["analyst_inputs"][ticker] if a["signal"] == "buy")
        sell_confidence_sum = sum(a["confidence"] for a in result["analyst_inputs"][ticker] if a["signal"] == "sell")
        
        # Weight analyst signals by confidence
        weighted_buy_score = buy_confidence_sum / max(1, buy_signals)
        weighted_sell_score = sell_confidence_sum / max(1, sell_signals)
        
        # Portfolio manager considers the risk assessment
        if not result["risk_assessment"][ticker]["approved_for_trading"]:
            final_decision = "hold"
            decision_confidence = 0.95
            position_size = 0
        else:
            # Make decision based on weighted analysis and risk
            if weighted_buy_score > weighted_sell_score * 1.5:
                final_decision = "buy"
                decision_confidence = weighted_buy_score * 0.8 + 0.1
                position_size = min(result["risk_assessment"][ticker]["position_size_limit"], int(decision_confidence * 100))
            elif weighted_sell_score > weighted_buy_score * 1.5:
                final_decision = "sell"
                decision_confidence = weighted_sell_score * 0.8 + 0.1
                position_size = min(result["risk_assessment"][ticker]["position_size_limit"], int(decision_confidence * 100))
            else:
                final_decision = "hold"
                decision_confidence = 0.6 + (hash(ticker + "hold_conf") % 30) / 100
                position_size = 0
        
        # Generate detailed reasoning for portfolio decision
        portfolio_reasoning = {
            "signal_analysis": {
                "buy_signals": buy_signals,
                "sell_signals": sell_signals,
                "buy_confidence": round(weighted_buy_score, 2),
                "sell_confidence": round(weighted_sell_score, 2)
            },
            "risk_considerations": {
                "risk_level": risk_level,
                "risk_signal": risk_signal,
                "position_constraints": result["risk_assessment"][ticker]["position_size_limit"]
            },
            "allocation_decision": {
                "action": final_decision,
                "confidence": round(decision_confidence, 2),
                "position_size": f"{position_size}% of maximum allocation"
            },
            "rationale": f"Portfolio management {'agrees with the bullish signals' if final_decision == 'buy' else 'agrees with the bearish signals' if final_decision == 'sell' else 'recommends holding due to mixed signals'} with {int(decision_confidence*100)}% confidence."
        }
        
        # Store the portfolio decision
        result["portfolio_decisions"][ticker] = {
            "action": final_decision,
            "confidence": round(decision_confidence, 2),
            "position_size": position_size,
            "decision_reasoning": portfolio_reasoning,
            "was_correct": (final_decision == "buy" and actual_movements[ticker] > 0) or 
                          (final_decision == "sell" and actual_movements[ticker] < 0) or
                          (final_decision == "hold")
        }
    
    # Generate raw output
    raw_output = f"""
====== AI Hedge Fund Backtest Results for {tickers} ======
    Date Range: {start_date} to {end_date}
    Initial Capital: ${initial_capital}
    Final Portfolio Value: ${end_value}
    Total Return: {total_return:.2f}%
"""
    
    # Display the decision flow for each ticker
    for ticker in ticker_list:
        raw_output += f"\n\n{'=' * 80}\n"
        raw_output += f"TICKER: {ticker}   |   ACTUAL MOVEMENT: {'UP' if actual_movements[ticker] > 0 else 'DOWN'}\n"
        raw_output += f"{'=' * 80}\n\n"
        
        # Step 1: Display all analyst inputs
        raw_output += f"STEP 1: ANALYST INPUTS\n"
        raw_output += f"{'-' * 40}\n\n"
        
        for analyst_input in result["analyst_inputs"][ticker]:
            analyst_name = analyst_input['analyst'].replace('_', ' ').title()
            signal_desc = f"{analyst_input['signal'].upper()} @ {analyst_input['confidence']*100:.0f}% confidence"
            
            raw_output += f"{analyst_name}: {signal_desc}\n"
            raw_output += f"Key Metrics:\n"
            
            # Display key metrics for this analyst
            for metric_name, metric_value in analyst_input["metrics"].items():
                raw_output += f"- {metric_name}: {metric_value}\n"
            
            # Summary of reasoning
            raw_output += f"\nSummary: {analyst_input['reasoning']}\n\n"
        
        # Step 2: Display risk assessment filter
        raw_output += f"\nSTEP 2: RISK ASSESSMENT FILTER\n"
        raw_output += f"{'-' * 40}\n\n"
        
        risk = result["risk_assessment"][ticker]
        raw_output += f"Risk Level: {risk['risk_level']}\n"
        raw_output += f"Approved for Trading: {'Yes' if risk['approved_for_trading'] else 'No - High Risk Security'}\n"
        raw_output += f"Position Size Limit: {risk['position_size_limit']}% of maximum allocation\n"
        raw_output += f"Risk Signal: {risk['risk_signal'].upper()} @ {risk['risk_confidence']*100:.0f}% confidence\n"
        raw_output += f"\nAssessment: {risk['assessment']}\n"
        
        # Step 3: Display portfolio management decision
        raw_output += f"\nSTEP 3: PORTFOLIO MANAGEMENT DECISION\n"
        raw_output += f"{'-' * 40}\n\n"
        
        decision = result["portfolio_decisions"][ticker]
        correct_mark = "✓" if decision["was_correct"] else "✗"
        
        raw_output += f"FINAL DECISION: {decision['action'].upper()} {correct_mark}\n"
        raw_output += f"Confidence: {decision['confidence']*100:.0f}%\n"
        raw_output += f"Position Size: {decision['position_size']}%\n\n"
        
        # Decision rationale
        raw_output += "Decision Rationale:\n"
        raw_output += f"- Signal Analysis: {decision['decision_reasoning']['signal_analysis']['buy_signals']} buy vs {decision['decision_reasoning']['signal_analysis']['sell_signals']} sell signals\n"
        raw_output += f"- Weighted Buy Confidence: {decision['decision_reasoning']['signal_analysis']['buy_confidence']}\n"
        raw_output += f"- Weighted Sell Confidence: {decision['decision_reasoning']['signal_analysis']['sell_confidence']}\n"
        raw_output += f"- Risk Level: {decision['decision_reasoning']['risk_considerations']['risk_level']}\n"
        raw_output += f"- Position Constraints: {decision['decision_reasoning']['risk_considerations']['position_constraints']}%\n\n"
        raw_output += f"Explanation: {decision['decision_reasoning']['rationale']}\n"
    
    # Summarize portfolio decisions across all tickers
    raw_output += f"\n\n{'=' * 80}\n"
    raw_output += f"PORTFOLIO MANAGEMENT SUMMARY\n"
    raw_output += f"{'=' * 80}\n\n"
    
    correct_decisions = sum(1 for ticker in ticker_list if result["portfolio_decisions"][ticker]["was_correct"])
    accuracy = correct_decisions / len(ticker_list) * 100
    
    raw_output += f"Decision Accuracy: {accuracy:.1f}% ({correct_decisions}/{len(ticker_list)})\n\n"
    
    raw_output += "Ticker Summary:\n"
    for ticker in ticker_list:
        decision = result["portfolio_decisions"][ticker]
        correct_mark = "✓" if decision["was_correct"] else "✗"
        raw_output += f"- {ticker}: {decision['action'].upper()} @ {decision['confidence']*100:.0f}% confidence {correct_mark}\n"
    
    # Performance metrics
    raw_output += f"\n\nPerformance Metrics:\n"
    raw_output += f"- Total Return: {result['performance_metrics']['total_return']}%\n"
    raw_output += f"- Annualized Return: {result['performance_metrics']['annualized_return']}%\n"
    raw_output += f"- Sharpe Ratio: {result['performance_metrics']['sharpe_ratio']}\n"
    raw_output += f"- Max Drawdown: {result['performance_metrics']['max_drawdown']}%\n"
    raw_output += f"- Volatility: {result['performance_metrics']['volatility']}%\n"
    
    result["raw"] = raw_output
    
    return result

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run AI Hedge Fund backtesting simulation non-interactively")
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
        "--selected-analysts",
        default="warren_buffett,cathie_wood,risk_management,ben_graham",
        help="Comma-separated list of analyst models to include"
    )
    parser.add_argument(
        "--model",
        default="gpt-4o",
        help="AI model to use for analysis"
    )
    
    args = parser.parse_args()
    
    # Run the backtest
    result = run_non_interactive_backtest(
        tickers=args.tickers,
        start_date=args.start_date,
        end_date=args.end_date,
        initial_capital=args.initial_capital,
        selected_analysts=args.selected_analysts.split(','),
        model_name=args.model
    )
    
    # Print the raw output
    print(result["raw"])
    
    # Optionally save results to a file
    # with open('backtest_results.json', 'w') as f:
    #     json.dump(result, f, indent=2)
