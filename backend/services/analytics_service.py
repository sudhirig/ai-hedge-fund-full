"""
Analytics Service for AI Hedge Fund Platform

This service provides analytics and aggregation functionality for:
- Top stocks analysis
- System recommendations
- Agent consensus analysis
- Aggregation periods management
"""

import json
import os
import sys
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from uuid import UUID

# Add parent directory to path for src imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from src.database.db_manager import DatabaseManager


class AnalyticsService:
    """Service for analytics and aggregated data analysis"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def get_top_stocks(
        self, 
        period_type: str = "monthly", 
        limit: int = 10, 
        criteria: str = "overall_score"
    ) -> List[Dict[str, Any]]:
        """
        Get top-ranked stocks based on aggregated agent analysis.
        
        Args:
            period_type: "monthly" or "quarterly"
            limit: Number of top stocks to return
            criteria: Ranking criteria ("overall_score", "consensus", "confidence")
        
        Returns:
            List of top stocks with rankings and scores
        """
        try:
            # Calculate date range based on period type
            end_date = datetime.now().date()
            if period_type == "monthly":
                start_date = end_date.replace(day=1)
            else:  # quarterly
                quarter_start_month = ((end_date.month - 1) // 3) * 3 + 1
                start_date = end_date.replace(month=quarter_start_month, day=1)
            
            query = """
            SELECT 
                i.ticker,
                i.name as company_name,
                i.sector,
                COUNT(ap.id) as prediction_count,
                AVG(CASE WHEN ap.signal = 'BUY' THEN ap.confidence 
                         WHEN ap.signal = 'SELL' THEN -ap.confidence 
                         ELSE 0 END) as avg_signal_strength,
                AVG(ap.confidence) as avg_confidence,
                COUNT(CASE WHEN ap.signal = 'BUY' THEN 1 END) as buy_signals,
                COUNT(CASE WHEN ap.signal = 'SELL' THEN 1 END) as sell_signals,
                COUNT(CASE WHEN ap.signal = 'HOLD' THEN 1 END) as hold_signals,
                MAX(ap.prediction_timestamp) as latest_analysis
            FROM instruments i
            JOIN agent_predictions ap ON ap.instrument_id = i.id
            WHERE ap.prediction_timestamp >= $1 AND ap.prediction_timestamp <= $2
            GROUP BY i.id, i.ticker, i.name, i.sector
            HAVING COUNT(ap.id) >= 3
            ORDER BY avg_signal_strength DESC, avg_confidence DESC
            LIMIT $3
            """
            
            async with self.db_manager.get_connection() as conn:
                rows = await conn.fetch(query, start_date, end_date, limit)
                
                results = []
                for row in rows:
                    stock_data = {
                        "ticker": row["ticker"],
                        "company_name": row["company_name"],
                        "sector": row["sector"],
                        "prediction_count": row["prediction_count"],
                        "avg_signal_strength": float(row["avg_signal_strength"]) if row["avg_signal_strength"] else 0.0,
                        "avg_confidence": float(row["avg_confidence"]) if row["avg_confidence"] else 0.0,
                        "buy_signals": row["buy_signals"],
                        "sell_signals": row["sell_signals"],
                        "hold_signals": row["hold_signals"],
                        "latest_analysis": row["latest_analysis"].isoformat() if row["latest_analysis"] else None,
                        "overall_score": self._calculate_overall_score(row)
                    }
                    results.append(stock_data)
                
                # Sort by specified criteria
                if criteria == "consensus":
                    results.sort(key=lambda x: x["prediction_count"], reverse=True)
                elif criteria == "confidence":
                    results.sort(key=lambda x: x["avg_confidence"], reverse=True)
                else:  # overall_score
                    results.sort(key=lambda x: x["overall_score"], reverse=True)
                
                return results
                
        except Exception as e:
            print(f"Error in get_top_stocks: {e}")
            return []
    
    async def get_system_recommendations(
        self, 
        period_type: str = "monthly", 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get system-wide investment recommendations based on aggregated analysis.
        
        Args:
            period_type: "monthly" or "quarterly"
            limit: Number of recommendations to return
        
        Returns:
            System recommendations with detailed rationale
        """
        try:
            # Get top stocks first
            top_stocks = await self.get_top_stocks(period_type, limit * 2, "overall_score")
            
            recommendations = []
            for i, stock in enumerate(top_stocks[:limit]):
                recommendation = {
                    "rank": i + 1,
                    "ticker": stock["ticker"],
                    "company_name": stock["company_name"],
                    "recommendation_type": self._get_recommendation_type(stock),
                    "confidence_level": self._get_confidence_level(stock["avg_confidence"]),
                    "rationale": self._generate_rationale(stock),
                    "risk_level": self._assess_risk_level(stock),
                    "expected_return": self._estimate_return(stock),
                    "time_horizon": "1-3 months" if period_type == "monthly" else "3-6 months",
                    "supporting_data": {
                        "agent_consensus": f"{stock['prediction_count']} agents analyzed",
                        "signal_strength": round(stock["avg_signal_strength"], 2),
                        "confidence": round(stock["avg_confidence"], 2),
                        "sector": stock["sector"]
                    }
                }
                recommendations.append(recommendation)
            
            return recommendations
            
        except Exception as e:
            print(f"Error in get_system_recommendations: {e}")
            return []
    
    async def get_agent_consensus(
        self, 
        ticker: str, 
        period_type: str = "monthly", 
        periods: int = 6
    ) -> Dict[str, Any]:
        """
        Get agent consensus analysis for a specific stock over multiple periods.
        
        Args:
            ticker: Stock ticker symbol
            period_type: "monthly" or "quarterly"
            periods: Number of periods to analyze
        
        Returns:
            Consensus analysis with trends and agreement levels
        """
        try:
            query = """
            SELECT 
                ap.signal,
                ap.confidence,
                ap.reasoning,
                ap.prediction_timestamp,
                a.name as agent_name,
                a.display_name,
                a.type as agent_type
            FROM agent_predictions ap
            JOIN agents a ON a.id = ap.agent_id
            JOIN instruments i ON i.id = ap.instrument_id
            WHERE i.ticker = $1
            AND ap.prediction_timestamp >= $2
            ORDER BY ap.prediction_timestamp DESC
            """
            
            # Calculate date range
            end_date = datetime.now().date()
            if period_type == "monthly":
                start_date = end_date - timedelta(days=30 * periods)
            else:  # quarterly
                start_date = end_date - timedelta(days=90 * periods)
            
            async with self.db_manager.get_connection() as conn:
                rows = await conn.fetch(query, ticker, start_date)
                
                if not rows:
                    return {"error": f"No analysis data found for {ticker}"}
                
                # Analyze consensus
                signals = [row["signal"] for row in rows]
                confidences = [float(row["confidence"]) for row in rows if row["confidence"]]
                
                buy_count = signals.count("BUY")
                sell_count = signals.count("SELL")
                hold_count = signals.count("HOLD")
                total = len(signals)
                
                consensus_data = {
                    "ticker": ticker,
                    "analysis_period": f"{start_date} to {end_date}",
                    "total_predictions": total,
                    "consensus_breakdown": {
                        "buy_signals": buy_count,
                        "sell_signals": sell_count,
                        "hold_signals": hold_count,
                        "buy_percentage": round((buy_count / total) * 100, 1) if total > 0 else 0,
                        "sell_percentage": round((sell_count / total) * 100, 1) if total > 0 else 0,
                        "hold_percentage": round((hold_count / total) * 100, 1) if total > 0 else 0
                    },
                    "confidence_metrics": {
                        "average_confidence": round(sum(confidences) / len(confidences), 2) if confidences else 0,
                        "min_confidence": round(min(confidences), 2) if confidences else 0,
                        "max_confidence": round(max(confidences), 2) if confidences else 0
                    },
                    "consensus_strength": self._calculate_consensus_strength(buy_count, sell_count, hold_count, total),
                    "dominant_signal": max([("BUY", buy_count), ("SELL", sell_count), ("HOLD", hold_count)], key=lambda x: x[1])[0],
                    "agent_details": [
                        {
                            "agent_name": row["agent_name"],
                            "display_name": row["display_name"],
                            "agent_type": row["agent_type"],
                            "signal": row["signal"],
                            "confidence": float(row["confidence"]) if row["confidence"] else 0,
                            "prediction_timestamp": row["prediction_timestamp"].isoformat() if row["prediction_timestamp"] else None
                        } for row in rows[:10]  # Limit to recent 10 predictions
                    ]
                }
                
                return consensus_data
                
        except Exception as e:
            print(f"Error in get_agent_consensus: {e}")
            return {"error": f"Failed to get consensus for {ticker}: {str(e)}"}
    
    async def get_aggregation_periods(
        self, 
        period_type: str = "monthly", 
        limit: int = 12
    ) -> List[Dict[str, Any]]:
        """
        Get available aggregation periods with summary statistics.
        
        Args:
            period_type: "monthly" or "quarterly"
            limit: Number of periods to return
        
        Returns:
            Available periods with summary data
        """
        try:
            query = """
            SELECT 
                DATE_TRUNC($1, ap.prediction_timestamp) as period_start,
                COUNT(DISTINCT ap.instrument_id) as unique_stocks,
                COUNT(ap.id) as total_predictions,
                COUNT(DISTINCT ap.agent_id) as active_agents,
                AVG(ap.confidence) as avg_confidence
            FROM agent_predictions ap
            WHERE ap.prediction_timestamp >= $2
            GROUP BY DATE_TRUNC($1, ap.prediction_timestamp)
            ORDER BY period_start DESC
            LIMIT $3
            """
            
            # Calculate lookback period
            end_date = datetime.now().date()
            if period_type == "monthly":
                start_date = end_date - timedelta(days=30 * limit)
                period_trunc = "month"
            else:  # quarterly
                start_date = end_date - timedelta(days=90 * limit)
                period_trunc = "quarter"
            
            async with self.db_manager.get_connection() as conn:
                rows = await conn.fetch(query, period_trunc, start_date, limit)
                
                periods = []
                for row in rows:
                    period_data = {
                        "period_start": row["period_start"].isoformat() if row["period_start"] else None,
                        "period_type": period_type,
                        "unique_stocks": row["unique_stocks"],
                        "total_predictions": row["total_predictions"],
                        "active_agents": row["active_agents"],
                        "avg_confidence": round(float(row["avg_confidence"]), 2) if row["avg_confidence"] else 0,
                        "activity_level": self._get_activity_level(row["total_predictions"])
                    }
                    periods.append(period_data)
                
                return periods
                
        except Exception as e:
            print(f"Error in get_aggregation_periods: {e}")
            return []
    
    def _calculate_overall_score(self, row: Dict) -> float:
        """Calculate overall score for stock ranking"""
        signal_strength = float(row["avg_signal_strength"]) if row["avg_signal_strength"] else 0
        confidence = float(row["avg_confidence"]) if row["avg_confidence"] else 0
        prediction_count = row["prediction_count"]
        
        # Weighted score considering signal strength, confidence, and consensus
        consensus_weight = min(prediction_count / 10, 1.0)  # Cap at 10 predictions
        score = (signal_strength * 0.5) + (confidence * 0.3) + (consensus_weight * 0.2)
        
        return round(score, 3)
    
    def _get_recommendation_type(self, stock: Dict) -> str:
        """Determine recommendation type based on stock analysis"""
        signal_strength = stock["avg_signal_strength"]
        
        if signal_strength > 0.5:
            return "STRONG BUY"
        elif signal_strength > 0.2:
            return "BUY"
        elif signal_strength > -0.2:
            return "HOLD"
        elif signal_strength > -0.5:
            return "SELL"
        else:
            return "STRONG SELL"
    
    def _get_confidence_level(self, confidence: float) -> str:
        """Convert confidence score to descriptive level"""
        if confidence >= 0.8:
            return "Very High"
        elif confidence >= 0.6:
            return "High"
        elif confidence >= 0.4:
            return "Medium"
        elif confidence >= 0.2:
            return "Low"
        else:
            return "Very Low"
    
    def _generate_rationale(self, stock: Dict) -> str:
        """Generate recommendation rationale"""
        signals = {
            "buy": stock["buy_signals"],
            "sell": stock["sell_signals"],
            "hold": stock["hold_signals"]
        }
        
        dominant_signal = max(signals.items(), key=lambda x: x[1])
        
        rationale = f"Based on analysis from {stock['prediction_count']} agents, "
        rationale += f"{dominant_signal[1]} agents recommend {dominant_signal[0].upper()}. "
        rationale += f"Average confidence is {stock['avg_confidence']:.1f}% "
        rationale += f"with signal strength of {stock['avg_signal_strength']:.2f}."
        
        return rationale
    
    def _assess_risk_level(self, stock: Dict) -> str:
        """Assess risk level based on signal consensus"""
        total_signals = stock["buy_signals"] + stock["sell_signals"] + stock["hold_signals"]
        max_signals = max(stock["buy_signals"], stock["sell_signals"], stock["hold_signals"])
        
        consensus_ratio = max_signals / total_signals if total_signals > 0 else 0
        
        if consensus_ratio >= 0.8:
            return "Low"  # High consensus = lower risk
        elif consensus_ratio >= 0.6:
            return "Medium"
        else:
            return "High"  # Low consensus = higher risk
    
    def _estimate_return(self, stock: Dict) -> str:
        """Estimate expected return range"""
        signal_strength = abs(stock["avg_signal_strength"])
        confidence = stock["avg_confidence"]
        
        return_estimate = signal_strength * confidence * 0.15  # Scale to realistic returns
        
        if return_estimate >= 0.1:
            return "8-15%"
        elif return_estimate >= 0.05:
            return "5-10%"
        elif return_estimate >= 0.02:
            return "2-8%"
        else:
            return "0-5%"
    
    def _calculate_consensus_strength(self, buy: int, sell: int, hold: int, total: int) -> str:
        """Calculate consensus strength"""
        if total == 0:
            return "No Data"
        
        max_signals = max(buy, sell, hold)
        consensus_ratio = max_signals / total
        
        if consensus_ratio >= 0.8:
            return "Very Strong"
        elif consensus_ratio >= 0.6:
            return "Strong"
        elif consensus_ratio >= 0.4:
            return "Moderate"
        else:
            return "Weak"
    
    def _get_activity_level(self, prediction_count: int) -> str:
        """Get activity level description"""
        if prediction_count >= 100:
            return "Very High"
        elif prediction_count >= 50:
            return "High"
        elif prediction_count >= 20:
            return "Medium"
        elif prediction_count >= 5:
            return "Low"
        else:
            return "Very Low"
