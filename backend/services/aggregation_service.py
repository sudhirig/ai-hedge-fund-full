"""
Monthly Aggregation Service

This service handles the aggregation of all agent predictions for each stock 
per month/quarter and stores the results in the agent_analysis_periods table.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from uuid import UUID
import asyncpg
from decimal import Decimal

# Add parent directory to path for src imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from src.database.db_manager import DatabaseManager


class AggregationService:
    """Service for aggregating agent analysis results by time period"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def aggregate_monthly_analysis(
        self, 
        ticker: str, 
        year: int, 
        month: int,
        force_recompute: bool = False
    ) -> Dict[str, Any]:
        """
        Aggregate all agent predictions for a stock in a given month
        
        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL')
            year: Year (e.g., 2024)
            month: Month (1-12)
            force_recompute: Whether to recompute if record already exists
            
        Returns:
            Dict containing aggregation results and metadata
        """
        try:
            # Create analysis period date (first day of month)
            analysis_period = date(year, month, 1)
            
            # Check if aggregation already exists
            if not force_recompute:
                existing = await self._get_existing_aggregation(ticker, analysis_period)
                if existing:
                    return {
                        "status": "exists",
                        "message": f"Aggregation for {ticker} {year}-{month:02d} already exists",
                        "data": existing
                    }
            
            # Get instrument ID
            instrument_id = await self._get_instrument_id(ticker)
            if not instrument_id:
                return {
                    "status": "error",
                    "message": f"Instrument {ticker} not found in database"
                }
            
            # Get all agent predictions for the period
            predictions = await self._get_agent_predictions_for_period(
                instrument_id, year, month
            )
            
            if not predictions:
                return {
                    "status": "no_data",
                    "message": f"No agent predictions found for {ticker} in {year}-{month:02d}"
                }
            
            # Calculate consensus metrics
            consensus_data = await self._calculate_consensus(predictions)
            
            # Get market context for the period
            market_context = await self._get_market_context(instrument_id, year, month)
            
            # Store aggregated analysis
            aggregation_id = await self._store_monthly_analysis(
                instrument_id=instrument_id,
                analysis_period=analysis_period,
                agent_outputs=predictions,
                consensus_data=consensus_data,
                market_context=market_context
            )
            
            return {
                "status": "success",
                "message": f"Successfully aggregated analysis for {ticker} {year}-{month:02d}",
                "aggregation_id": str(aggregation_id),
                "total_agents": len(predictions),
                "consensus": consensus_data
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error aggregating analysis: {str(e)}"
            }
    
    async def _get_existing_aggregation(
        self, 
        ticker: str, 
        analysis_period: date
    ) -> Optional[Dict[str, Any]]:
        """Check if aggregation already exists for the period"""
        query = """
        SELECT aap.*, i.ticker 
        FROM agent_analysis_periods aap
        JOIN instruments i ON i.id = aap.instrument_id
        WHERE i.ticker = $1 AND aap.analysis_period = $2
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, ticker, analysis_period)
            return dict(row) if row else None
    
    async def _get_instrument_id(self, ticker: str) -> Optional[UUID]:
        """Get instrument ID for a ticker"""
        query = "SELECT id FROM instruments WHERE ticker = $1"
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, ticker)
            return row['id'] if row else None
    
    async def _get_agent_predictions_for_period(
        self, 
        instrument_id: UUID, 
        year: int, 
        month: int
    ) -> Dict[str, Any]:
        """Get all agent predictions for an instrument in a specific month"""
        query = """
        SELECT 
            a.name as agent_name,
            a.display_name,
            a.type as agent_type,
            ap.signal,
            ap.confidence,
            ap.reasoning,
            ap.target_price,
            ap.prediction_timestamp,
            ap.prediction_data
        FROM agent_predictions ap
        JOIN agents a ON a.id = ap.agent_id  
        WHERE ap.instrument_id = $1
        AND EXTRACT(YEAR FROM ap.prediction_timestamp) = $2
        AND EXTRACT(MONTH FROM ap.prediction_timestamp) = $3
        ORDER BY ap.prediction_timestamp DESC
        """
        
        agent_outputs = {}
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, instrument_id, year, month)
            
            for row in rows:
                agent_name = row['agent_name']
                if agent_name not in agent_outputs:
                    # Take most recent prediction for each agent
                    agent_outputs[agent_name] = {
                        "display_name": row['display_name'],
                        "agent_type": row['agent_type'],
                        "signal": row['signal'],
                        "confidence": float(row['confidence']) if row['confidence'] else 0.0,
                        "reasoning": row['reasoning'],
                        "target_price": float(row['target_price']) if row['target_price'] else None,
                        "prediction_timestamp": row['prediction_timestamp'].isoformat(),
                        "prediction_data": row['prediction_data'] or {}
                    }
        
        return agent_outputs
    
    async def _calculate_consensus(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate consensus metrics from agent predictions"""
        if not predictions:
            return {
                "total_agents": 0,
                "bullish_count": 0,
                "bearish_count": 0,
                "neutral_count": 0,
                "avg_confidence": 0.0,
                "consensus_signal": "neutral",
                "consensus_strength": 0.0
            }
        
        total_agents = len(predictions)
        bullish_count = 0
        bearish_count = 0
        neutral_count = 0
        total_confidence = 0.0
        
        for agent_data in predictions.values():
            signal = agent_data.get('signal', '').lower()
            confidence = agent_data.get('confidence', 0.0)
            
            if signal in ['bullish', 'buy', 'strong_buy']:
                bullish_count += 1
            elif signal in ['bearish', 'sell', 'strong_sell']:
                bearish_count += 1
            else:
                neutral_count += 1
            
            total_confidence += confidence
        
        avg_confidence = total_confidence / total_agents if total_agents > 0 else 0.0
        
        # Determine consensus signal
        if bullish_count > bearish_count and bullish_count > neutral_count:
            consensus_signal = "bullish"
        elif bearish_count > bullish_count and bearish_count > neutral_count:
            consensus_signal = "bearish"
        else:
            consensus_signal = "neutral"
        
        # Calculate consensus strength (how unified the agents are)
        max_agreement = max(bullish_count, bearish_count, neutral_count)
        consensus_strength = (max_agreement / total_agents) * 100 if total_agents > 0 else 0.0
        
        return {
            "total_agents": total_agents,
            "bullish_count": bullish_count,
            "bearish_count": bearish_count,
            "neutral_count": neutral_count,
            "avg_confidence": round(avg_confidence, 2),
            "consensus_signal": consensus_signal,
            "consensus_strength": round(consensus_strength, 2)
        }
    
    async def _get_market_context(
        self, 
        instrument_id: UUID, 
        year: int, 
        month: int
    ) -> Dict[str, Any]:
        """Get market context data for the period (price movements, volatility, etc.)"""
        # For now, return empty context - can be enhanced with historical price data
        return {
            "period_start_price": None,
            "period_end_price": None,
            "period_return": None,
            "period_volatility": None,
            "market_conditions": {}
        }
    
    async def _store_monthly_analysis(
        self,
        instrument_id: UUID,
        analysis_period: date,
        agent_outputs: Dict[str, Any],
        consensus_data: Dict[str, Any],
        market_context: Dict[str, Any]
    ) -> UUID:
        """Store the aggregated monthly analysis in the database"""
        query = """
        INSERT INTO agent_analysis_periods (
            instrument_id,
            analysis_period,
            period_type,
            agent_outputs,
            total_agents,
            bullish_count,
            bearish_count,
            neutral_count,
            avg_confidence,
            consensus_signal,
            consensus_strength,
            period_start_price,
            period_end_price,
            period_return,
            period_volatility,
            market_conditions,
            analysis_completed_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        ON CONFLICT (instrument_id, analysis_period) 
        DO UPDATE SET
            agent_outputs = EXCLUDED.agent_outputs,
            total_agents = EXCLUDED.total_agents,
            bullish_count = EXCLUDED.bullish_count,
            bearish_count = EXCLUDED.bearish_count,
            neutral_count = EXCLUDED.neutral_count,
            avg_confidence = EXCLUDED.avg_confidence,
            consensus_signal = EXCLUDED.consensus_signal,
            consensus_strength = EXCLUDED.consensus_strength,
            analysis_completed_at = EXCLUDED.analysis_completed_at,
            updated_at = NOW()
        RETURNING id
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(
                query,
                instrument_id,
                analysis_period,
                "monthly",
                json.dumps(agent_outputs),
                consensus_data["total_agents"],
                consensus_data["bullish_count"],
                consensus_data["bearish_count"],
                consensus_data["neutral_count"],
                Decimal(str(consensus_data["avg_confidence"])),
                consensus_data["consensus_signal"],
                Decimal(str(consensus_data["consensus_strength"])),
                market_context.get("period_start_price"),
                market_context.get("period_end_price"),
                market_context.get("period_return"),
                market_context.get("period_volatility"),
                json.dumps(market_context.get("market_conditions", {})),
                datetime.now()
            )
            
            return row['id']
    
    async def get_aggregation_by_id(self, aggregation_id: UUID) -> Optional[Dict[str, Any]]:
        """Get aggregation data by ID"""
        query = """
        SELECT aap.*, i.ticker, i.name as instrument_name
        FROM agent_analysis_periods aap
        JOIN instruments i ON i.id = aap.instrument_id
        WHERE aap.id = $1
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, aggregation_id)
            if row:
                result = dict(row)
                # Parse JSON fields
                result['agent_outputs'] = json.loads(result['agent_outputs'])
                result['market_conditions'] = json.loads(result['market_conditions'])
                return result
            return None
    
    async def list_aggregations(
        self, 
        ticker: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List aggregations with optional filtering"""
        base_query = """
        SELECT aap.*, i.ticker, i.name as instrument_name
        FROM agent_analysis_periods aap
        JOIN instruments i ON i.id = aap.instrument_id
        """
        
        where_clause = ""
        params = []
        
        if ticker:
            where_clause = "WHERE i.ticker = $1"
            params.append(ticker)
        
        query = f"""
        {base_query} 
        {where_clause}
        ORDER BY aap.analysis_period DESC, aap.created_at DESC
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        
        params.extend([limit, offset])
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, *params)
            
            results = []
            for row in rows:
                result = dict(row)
                # Parse JSON fields
                result['agent_outputs'] = json.loads(result['agent_outputs'])
                result['market_conditions'] = json.loads(result['market_conditions'])
                results.append(result)
            
            return results
