"""
Stock Ranking Service

This service computes and maintains stock rankings based on portfolio manager 
verdicts, agent consensus, and performance metrics for user-facing displays.
"""

import json
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from uuid import UUID
from decimal import Decimal

# Add parent directory to path for src imports
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from src.database.db_manager import DatabaseManager


class RankingService:
    """Service for computing and managing stock rankings"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def compute_stock_rankings(
        self, 
        ranking_period: date = None,
        ranking_type: str = "monthly",
        force_recompute: bool = False
    ) -> Dict[str, Any]:
        """
        Compute stock rankings based on portfolio verdicts and performance
        
        Args:
            ranking_period: Period for rankings (defaults to current month)
            ranking_type: Type of ranking ('monthly', 'quarterly', 'top_picks')
            force_recompute: Whether to recompute existing rankings
            
        Returns:
            Dict containing ranking results and metadata
        """
        try:
            if ranking_period is None:
                now = datetime.now()
                ranking_period = date(now.year, now.month, 1)
            
            # Check if rankings already exist
            if not force_recompute:
                existing_rankings = await self._get_existing_rankings(ranking_period, ranking_type)
                if existing_rankings:
                    return {
                        "status": "exists", 
                        "message": f"Rankings for {ranking_period} already exist",
                        "rankings": existing_rankings
                    }
            
            # Get portfolio verdicts for the period
            verdicts = await self._get_portfolio_verdicts_for_period(ranking_period, ranking_type)
            
            if not verdicts:
                return {
                    "status": "no_data",
                    "message": f"No portfolio verdicts found for {ranking_period}"
                }
            
            # Compute composite scores and rankings
            ranked_stocks = await self._compute_composite_scores(verdicts)
            
            # Store rankings in database
            stored_count = await self._store_rankings(
                rankings=ranked_stocks,
                ranking_period=ranking_period,
                ranking_type=ranking_type
            )
            
            return {
                "status": "success",
                "message": f"Successfully computed {stored_count} stock rankings",
                "ranking_period": ranking_period.isoformat(),
                "ranking_type": ranking_type,
                "total_stocks": len(ranked_stocks)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error computing stock rankings: {str(e)}"
            }
    
    async def _get_existing_rankings(
        self, 
        ranking_period: date, 
        ranking_type: str
    ) -> List[Dict[str, Any]]:
        """Check if rankings already exist for the period"""
        query = """
        SELECT sr.*, i.ticker, i.name as instrument_name
        FROM stock_rankings sr
        JOIN instruments i ON i.id = sr.instrument_id
        WHERE sr.ranking_period = $1 AND sr.ranking_type = $2
        AND sr.is_active = true
        ORDER BY sr.rank_position ASC
        """
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, ranking_period, ranking_type)
            
            results = []
            for row in rows:
                result = dict(row)
                result['key_highlights'] = json.loads(result['key_highlights'])
                results.append(result)
            
            return results
    
    async def _get_portfolio_verdicts_for_period(
        self, 
        ranking_period: date, 
        ranking_type: str
    ) -> List[Dict[str, Any]]:
        """Get portfolio verdicts for ranking computation"""
        
        # Adjust query based on ranking type
        if ranking_type == "monthly":
            date_condition = "pv.analysis_period = $1"
        elif ranking_type == "quarterly":
            date_condition = """
            EXTRACT(YEAR FROM pv.analysis_period) = EXTRACT(YEAR FROM $1::date)
            AND EXTRACT(QUARTER FROM pv.analysis_period) = EXTRACT(QUARTER FROM $1::date)
            """
        else:  # top_picks - get recent verdicts
            date_condition = "pv.analysis_period >= $1::date - INTERVAL '3 months'"
        
        query = f"""
        SELECT 
            pv.*,
            i.ticker,
            i.name as instrument_name,
            i.sector,
            ap.agent_performance_id,
            ap.accuracy_rate,
            ap.avg_return,
            ap.sharpe_ratio
        FROM portfolio_verdicts pv
        JOIN instruments i ON i.id = pv.instrument_id
        LEFT JOIN agent_performance ap ON ap.instrument_id = pv.instrument_id
        WHERE {date_condition}
        ORDER BY pv.confidence DESC, pv.created_at DESC
        """
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, ranking_period)
            
            results = []
            for row in rows:
                result = dict(row)
                result['key_factors'] = json.loads(result['key_factors'])
                results.append(result)
            
            return results
    
    async def _compute_composite_scores(self, verdicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Compute composite scores for ranking stocks"""
        scored_stocks = []
        
        for verdict in verdicts:
            score_components = await self._calculate_score_components(verdict)
            composite_score = self._calculate_composite_score(score_components)
            
            # Create ranking entry
            ranking_entry = {
                "instrument_id": verdict['instrument_id'],
                "ticker": verdict['ticker'],
                "instrument_name": verdict['instrument_name'],
                "recommendation": verdict['recommendation'],
                "confidence": float(verdict['confidence']),
                "composite_score": composite_score,
                "score_components": score_components,
                "verdict_data": verdict
            }
            
            scored_stocks.append(ranking_entry)
        
        # Sort by composite score (descending)
        scored_stocks.sort(key=lambda x: x['composite_score'], reverse=True)
        
        # Assign rank positions
        for i, stock in enumerate(scored_stocks):
            stock['rank_position'] = i + 1
            stock['title'] = self._generate_stock_title(stock, i + 1)
            stock['description'] = self._generate_stock_description(stock)
            stock['key_highlights'] = self._generate_key_highlights(stock)
        
        return scored_stocks
    
    async def _calculate_score_components(self, verdict: Dict[str, Any]) -> Dict[str, float]:
        """Calculate individual score components for a stock"""
        components = {}
        
        # Portfolio Manager Confidence (0-30 points)
        pm_confidence = float(verdict.get('confidence', 0))
        components['portfolio_manager_score'] = min(30, pm_confidence * 0.3)
        
        # Recommendation Strength (0-25 points)
        recommendation_scores = {
            'STRONG_BUY': 25,
            'BUY': 20,
            'HOLD': 10,
            'SELL': 5,
            'STRONG_SELL': 0
        }
        components['recommendation_score'] = recommendation_scores.get(
            verdict.get('recommendation', 'HOLD'), 10
        )
        
        # Risk Assessment (0-20 points, inverted - lower risk = higher score)
        risk_scores = {
            'LOW': 20,
            'MEDIUM': 15,
            'HIGH': 8,
            'VERY_HIGH': 3
        }
        components['risk_score'] = risk_scores.get(verdict.get('risk_rating', 'MEDIUM'), 15)
        
        # Historical Performance (0-15 points)
        accuracy_rate = verdict.get('accuracy_rate')
        if accuracy_rate:
            components['performance_score'] = min(15, float(accuracy_rate) * 0.15)
        else:
            components['performance_score'] = 7.5  # Neutral score for new stocks
        
        # Target Upside Potential (0-10 points)
        upside_potential = verdict.get('upside_potential', 0)
        if upside_potential:
            components['upside_score'] = min(10, max(0, float(upside_potential) * 0.5))
        else:
            components['upside_score'] = 5  # Neutral score
        
        return components
    
    def _calculate_composite_score(self, components: Dict[str, float]) -> float:
        """Calculate final composite score from components"""
        return sum(components.values())
    
    def _generate_stock_title(self, stock: Dict[str, Any], rank: int) -> str:
        """Generate display title for ranked stock"""
        recommendation = stock['recommendation']
        ticker = stock['ticker']
        
        if rank <= 3:
            if recommendation in ['STRONG_BUY', 'BUY']:
                return f"🏆 Top Pick: {ticker}"
            else:
                return f"🥇 #{rank} Ranked: {ticker}"
        elif rank <= 10:
            if recommendation in ['STRONG_BUY', 'BUY']:
                return f"⭐ Strong Buy: {ticker}"
            else:
                return f"📈 Growth Pick: {ticker}"
        else:
            return f"💼 Portfolio Option: {ticker}"
    
    def _generate_stock_description(self, stock: Dict[str, Any]) -> str:
        """Generate description for ranked stock"""
        confidence = stock['confidence']
        recommendation = stock['recommendation']
        target_price = stock['verdict_data'].get('target_price')
        
        desc_parts = [
            f"{recommendation.replace('_', ' ')} recommendation",
            f"with {confidence:.1f}% confidence"
        ]
        
        if target_price:
            desc_parts.append(f"and ${target_price:.2f} target price")
        
        return " ".join(desc_parts) + "."
    
    def _generate_key_highlights(self, stock: Dict[str, Any]) -> Dict[str, Any]:
        """Generate key highlights for display"""
        verdict = stock['verdict_data']
        
        highlights = {
            "recommendation": stock['recommendation'],
            "confidence": f"{stock['confidence']:.1f}%",
            "risk_rating": verdict.get('risk_rating', 'MEDIUM'),
            "composite_score": f"{stock['composite_score']:.1f}",
            "target_price": f"${verdict.get('target_price', 0):.2f}" if verdict.get('target_price') else "N/A",
            "position_size": f"{verdict.get('position_size_recommendation', 0):.1f}%" if verdict.get('position_size_recommendation') else "N/A"
        }
        
        return highlights
    
    async def _store_rankings(
        self,
        rankings: List[Dict[str, Any]],
        ranking_period: date,
        ranking_type: str
    ) -> int:
        """Store computed rankings in database"""
        
        # First, deactivate existing rankings for the period
        await self._deactivate_existing_rankings(ranking_period, ranking_type)
        
        # Insert new rankings
        insert_query = """
        INSERT INTO stock_rankings (
            instrument_id,
            ranking_period,
            ranking_type,
            rank_position,
            score,
            recommendation,
            confidence,
            agent_consensus_score,
            portfolio_manager_confidence,
            historical_accuracy,
            risk_adjusted_return,
            momentum_score,
            title,
            description,
            key_highlights,
            expected_return,
            target_price,
            current_price,
            upside_potential,
            expires_at,
            is_active
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        """
        
        stored_count = 0
        async with self.db_manager.get_connection() as conn:
            for ranking in rankings:
                verdict = ranking['verdict_data']
                score_components = ranking['score_components']
                
                # Calculate expiry (30 days for monthly, 90 for quarterly)
                expires_at = datetime.now()
                if ranking_type == "monthly":
                    expires_at = expires_at.replace(day=1, month=expires_at.month + 1 if expires_at.month < 12 else 1, year=expires_at.year + (1 if expires_at.month == 12 else 0))
                else:
                    expires_at = expires_at.replace(month=expires_at.month + 3 if expires_at.month <= 9 else expires_at.month - 9, year=expires_at.year + (1 if expires_at.month > 9 else 0))
                
                await conn.execute(
                    insert_query,
                    ranking['instrument_id'],  # $1
                    ranking_period,  # $2
                    ranking_type,  # $3
                    ranking['rank_position'],  # $4
                    Decimal(str(ranking['composite_score'])),  # $5
                    ranking['recommendation'],  # $6
                    Decimal(str(ranking['confidence'])),  # $7
                    Decimal(str(score_components.get('portfolio_manager_score', 0))),  # $8
                    Decimal(str(ranking['confidence'])),  # $9
                    Decimal(str(score_components.get('performance_score', 0))),  # $10
                    Decimal(str(score_components.get('performance_score', 0))),  # $11
                    Decimal(str(score_components.get('upside_score', 0))),  # $12
                    ranking['title'],  # $13
                    ranking['description'],  # $14
                    json.dumps(ranking['key_highlights']),  # $15
                    verdict.get('target_price'),  # $16
                    verdict.get('target_price'),  # $17
                    None,  # $18 - current_price (to be updated later)
                    verdict.get('upside_potential'),  # $19
                    expires_at,  # $20
                    True  # $21 - is_active
                )
                
                stored_count += 1
        
        return stored_count
    
    async def _deactivate_existing_rankings(self, ranking_period: date, ranking_type: str):
        """Deactivate existing rankings for the period"""
        query = """
        UPDATE stock_rankings 
        SET is_active = false, updated_at = NOW()
        WHERE ranking_period = $1 AND ranking_type = $2 AND is_active = true
        """
        
        async with self.db_manager.get_connection() as conn:
            await conn.execute(query, ranking_period, ranking_type)
    
    async def get_top_stocks(
        self,
        ranking_type: str = "monthly",
        limit: int = 10,
        recommendation_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get top-ranked stocks for user display"""
        base_query = """
        SELECT sr.*, i.ticker, i.name as instrument_name, i.sector
        FROM stock_rankings sr
        JOIN instruments i ON i.id = sr.instrument_id
        WHERE sr.is_active = true AND sr.ranking_type = $1
        """
        
        params = [ranking_type]
        
        if recommendation_filter:
            base_query += f" AND sr.recommendation = ${len(params) + 1}"
            params.append(recommendation_filter)
        
        query = f"""
        {base_query}
        ORDER BY sr.rank_position ASC
        LIMIT ${len(params) + 1}
        """
        params.append(limit)
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, *params)
            
            results = []
            for row in rows:
                result = dict(row)
                result['key_highlights'] = json.loads(result['key_highlights'])
                results.append(result)
            
            return results
    
    async def get_stock_ranking(self, ticker: str, ranking_type: str = "monthly") -> Optional[Dict[str, Any]]:
        """Get ranking for a specific stock"""
        query = """
        SELECT sr.*, i.ticker, i.name as instrument_name, i.sector
        FROM stock_rankings sr
        JOIN instruments i ON i.id = sr.instrument_id
        WHERE i.ticker = $1 AND sr.ranking_type = $2 AND sr.is_active = true
        ORDER BY sr.ranking_period DESC
        LIMIT 1
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, ticker, ranking_type)
            if row:
                result = dict(row)
                result['key_highlights'] = json.loads(result['key_highlights'])
                return result
            return None
    
    async def get_rankings_by_period(
        self,
        ranking_period: date,
        ranking_type: str = "monthly"
    ) -> List[Dict[str, Any]]:
        """Get all rankings for a specific period"""
        query = """
        SELECT sr.*, i.ticker, i.name as instrument_name, i.sector
        FROM stock_rankings sr
        JOIN instruments i ON i.id = sr.instrument_id
        WHERE sr.ranking_period = $1 AND sr.ranking_type = $2 AND sr.is_active = true
        ORDER BY sr.rank_position ASC
        """
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, ranking_period, ranking_type)
            
            results = []
            for row in rows:
                result = dict(row)
                result['key_highlights'] = json.loads(result['key_highlights'])
                results.append(result)
            
            return results
