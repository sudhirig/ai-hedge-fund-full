"""
Portfolio Verdict Service

This service handles the Portfolio Manager agent's analysis of aggregated 
agent data and generates final investment verdicts/recommendations.
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


class VerdictService:
    """Service for generating and managing portfolio manager verdicts"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    async def generate_portfolio_verdict(
        self, 
        analysis_period_id: UUID,
        override_existing: bool = False
    ) -> Dict[str, Any]:
        """
        Generate portfolio manager verdict based on aggregated agent analysis
        
        Args:
            analysis_period_id: ID of the agent_analysis_periods record
            override_existing: Whether to override existing verdict
            
        Returns:
            Dict containing verdict results and metadata
        """
        try:
            # Get aggregated analysis data
            analysis_data = await self._get_analysis_period_data(analysis_period_id)
            if not analysis_data:
                return {
                    "status": "error",
                    "message": f"Analysis period {analysis_period_id} not found"
                }
            
            # Check if verdict already exists
            if not override_existing:
                existing_verdict = await self._get_existing_verdict(
                    analysis_data['instrument_id'], 
                    analysis_data['analysis_period']
                )
                if existing_verdict:
                    return {
                        "status": "exists",
                        "message": "Portfolio verdict already exists for this period",
                        "verdict": existing_verdict
                    }
            
            # Generate portfolio manager verdict using AI analysis
            verdict_data = await self._generate_verdict_analysis(analysis_data)
            
            # Store the verdict in database
            verdict_id = await self._store_portfolio_verdict(
                analysis_period_id=analysis_period_id,
                instrument_id=analysis_data['instrument_id'],
                analysis_period=analysis_data['analysis_period'],
                verdict_data=verdict_data
            )
            
            return {
                "status": "success",
                "message": f"Portfolio verdict generated successfully",
                "verdict_id": str(verdict_id),
                "recommendation": verdict_data['recommendation'],
                "confidence": verdict_data['confidence'],
                "target_price": verdict_data['target_price']
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error generating portfolio verdict: {str(e)}"
            }
    
    async def _get_analysis_period_data(self, analysis_period_id: UUID) -> Optional[Dict[str, Any]]:
        """Get aggregated analysis data by ID"""
        query = """
        SELECT aap.*, i.ticker, i.name as instrument_name
        FROM agent_analysis_periods aap
        JOIN instruments i ON i.id = aap.instrument_id
        WHERE aap.id = $1
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, analysis_period_id)
            if row:
                result = dict(row)
                # Parse JSON fields
                result['agent_outputs'] = json.loads(result['agent_outputs'])
                result['market_conditions'] = json.loads(result['market_conditions'])
                return result
            return None
    
    async def _get_existing_verdict(
        self, 
        instrument_id: UUID, 
        analysis_period: date
    ) -> Optional[Dict[str, Any]]:
        """Check if portfolio verdict already exists"""
        query = """
        SELECT pv.*, i.ticker
        FROM portfolio_verdicts pv
        JOIN instruments i ON i.id = pv.instrument_id
        WHERE pv.instrument_id = $1 AND pv.analysis_period = $2
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, instrument_id, analysis_period)
            if row:
                result = dict(row)
                result['key_factors'] = json.loads(result['key_factors'])
                return result
            return None
    
    async def _generate_verdict_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate portfolio manager's verdict based on all agent analysis
        This uses rule-based logic + AI reasoning to make final recommendation
        """
        agent_outputs = analysis_data['agent_outputs']
        consensus_data = {
            'total_agents': analysis_data['total_agents'],
            'bullish_count': analysis_data['bullish_count'],
            'bearish_count': analysis_data['bearish_count'],
            'neutral_count': analysis_data['neutral_count'],
            'avg_confidence': float(analysis_data['avg_confidence']),
            'consensus_signal': analysis_data['consensus_signal'],
            'consensus_strength': float(analysis_data['consensus_strength'])
        }
        
        # Portfolio Manager Logic
        verdict = self._portfolio_manager_decision_logic(agent_outputs, consensus_data)
        
        # Add reasoning based on agent consensus
        reasoning = self._generate_portfolio_reasoning(agent_outputs, consensus_data, verdict)
        
        return {
            **verdict,
            'reasoning': reasoning,
            'agent_consensus_analysis': self._analyze_agent_consensus(agent_outputs, consensus_data),
            'key_factors': self._extract_key_factors(agent_outputs),
            'market_outlook': self._generate_market_outlook(agent_outputs, consensus_data)
        }
    
    def _portfolio_manager_decision_logic(
        self, 
        agent_outputs: Dict[str, Any], 
        consensus_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Core portfolio manager decision logic
        Considers agent consensus, confidence levels, and risk factors
        """
        total_agents = consensus_data['total_agents']
        bullish_count = consensus_data['bullish_count']
        bearish_count = consensus_data['bearish_count']
        avg_confidence = consensus_data['avg_confidence']
        consensus_strength = consensus_data['consensus_strength']
        
        # Calculate target price from agent predictions
        target_prices = []
        high_confidence_agents = []
        
        for agent_name, agent_data in agent_outputs.items():
            if agent_data.get('target_price'):
                target_prices.append(float(agent_data['target_price']))
            
            if agent_data.get('confidence', 0) >= 80:
                high_confidence_agents.append(agent_name)
        
        avg_target_price = sum(target_prices) / len(target_prices) if target_prices else None
        
        # Decision Logic
        if consensus_strength >= 70:  # Strong consensus
            if bullish_count > bearish_count:
                if avg_confidence >= 85:
                    recommendation = "STRONG_BUY"
                    confidence = min(95, avg_confidence + 5)
                else:
                    recommendation = "BUY"
                    confidence = avg_confidence
            elif bearish_count > bullish_count:
                if avg_confidence >= 85:
                    recommendation = "STRONG_SELL"
                    confidence = min(95, avg_confidence + 5)
                else:
                    recommendation = "SELL"
                    confidence = avg_confidence
            else:
                recommendation = "HOLD"
                confidence = avg_confidence * 0.8  # Lower confidence for neutral
        
        elif consensus_strength >= 50:  # Moderate consensus
            if bullish_count > bearish_count and avg_confidence >= 75:
                recommendation = "BUY"
                confidence = avg_confidence * 0.9
            elif bearish_count > bullish_count and avg_confidence >= 75:
                recommendation = "SELL"
                confidence = avg_confidence * 0.9
            else:
                recommendation = "HOLD"
                confidence = avg_confidence * 0.7
        
        else:  # Weak consensus
            recommendation = "HOLD"
            confidence = max(30, avg_confidence * 0.6)  # Conservative approach
        
        # Risk assessment
        risk_rating = self._assess_risk_rating(agent_outputs, consensus_data)
        
        # Position size recommendation
        position_size = self._calculate_position_size(recommendation, confidence, risk_rating)
        
        return {
            'recommendation': recommendation,
            'confidence': round(confidence, 2),
            'target_price': avg_target_price,
            'stop_loss': avg_target_price * 0.85 if avg_target_price else None,  # 15% stop loss
            'time_horizon_days': 30,  # Default monthly horizon
            'risk_rating': risk_rating,
            'position_size_recommendation': position_size
        }
    
    def _assess_risk_rating(self, agent_outputs: Dict[str, Any], consensus_data: Dict[str, Any]) -> str:
        """Assess risk rating based on agent analysis and consensus"""
        consensus_strength = consensus_data['consensus_strength']
        avg_confidence = consensus_data['avg_confidence']
        
        # Count risk-focused agents (like Michael Burry, Risk Manager)
        risk_agents = ['michael_burry_agent', 'risk_manager_agent']
        risk_concerns = 0
        
        for agent_name in risk_agents:
            if agent_name in agent_outputs:
                agent_signal = agent_outputs[agent_name].get('signal', '').lower()
                if agent_signal in ['bearish', 'sell', 'strong_sell']:
                    risk_concerns += 1
        
        # Risk assessment logic
        if consensus_strength >= 80 and avg_confidence >= 85 and risk_concerns == 0:
            return "LOW"
        elif consensus_strength >= 60 and avg_confidence >= 70 and risk_concerns <= 1:
            return "MEDIUM"
        elif consensus_strength >= 40 or risk_concerns >= 2:
            return "HIGH"
        else:
            return "VERY_HIGH"
    
    def _calculate_position_size(self, recommendation: str, confidence: float, risk_rating: str) -> float:
        """Calculate recommended position size as percentage of portfolio"""
        base_sizes = {
            "STRONG_BUY": 12.0,
            "BUY": 8.0,
            "HOLD": 5.0,
            "SELL": 0.0,
            "STRONG_SELL": 0.0
        }
        
        risk_multipliers = {
            "LOW": 1.2,
            "MEDIUM": 1.0,
            "HIGH": 0.7,
            "VERY_HIGH": 0.4
        }
        
        base_size = base_sizes.get(recommendation, 5.0)
        risk_multiplier = risk_multipliers.get(risk_rating, 1.0)
        confidence_multiplier = confidence / 100.0
        
        position_size = base_size * risk_multiplier * confidence_multiplier
        return round(min(position_size, 15.0), 2)  # Cap at 15% of portfolio
    
    def _generate_portfolio_reasoning(
        self, 
        agent_outputs: Dict[str, Any], 
        consensus_data: Dict[str, Any], 
        verdict: Dict[str, Any]
    ) -> str:
        """Generate detailed reasoning for the portfolio decision"""
        recommendation = verdict['recommendation']
        confidence = verdict['confidence']
        consensus_signal = consensus_data['consensus_signal']
        consensus_strength = consensus_data['consensus_strength']
        bullish_count = consensus_data['bullish_count']
        bearish_count = consensus_data['bearish_count']
        total_agents = consensus_data['total_agents']
        
        reasoning_parts = []
        
        # Consensus analysis
        reasoning_parts.append(
            f"Agent Consensus: {bullish_count}/{total_agents} agents are bullish, "
            f"{bearish_count}/{total_agents} are bearish, with {consensus_strength:.1f}% consensus strength."
        )
        
        # Key agent insights
        key_agents = ['warren_buffett_agent', 'cathie_wood_agent', 'peter_lynch_agent', 'michael_burry_agent']
        agent_insights = []
        
        for agent_name in key_agents:
            if agent_name in agent_outputs:
                agent_data = agent_outputs[agent_name]
                display_name = agent_data.get('display_name', agent_name)
                signal = agent_data.get('signal', 'neutral')
                confidence_val = agent_data.get('confidence', 0)
                agent_insights.append(f"{display_name} ({signal.upper()}, {confidence_val:.1f}%)")
        
        if agent_insights:
            reasoning_parts.append(f"Key Agent Positions: {', '.join(agent_insights)}.")
        
        # Decision rationale
        if recommendation in ['STRONG_BUY', 'BUY']:
            reasoning_parts.append(
                f"Recommendation to {recommendation.replace('_', ' ')} is based on {consensus_signal} consensus "
                f"with {confidence:.1f}% confidence. Strong fundamentals and growth prospects identified."
            )
        elif recommendation in ['STRONG_SELL', 'SELL']:
            reasoning_parts.append(
                f"Recommendation to {recommendation.replace('_', ' ')} is based on {consensus_signal} consensus "
                f"with {confidence:.1f}% confidence. Risk factors and negative outlook identified."
            )
        else:
            reasoning_parts.append(
                f"HOLD recommendation reflects mixed signals or insufficient consensus strength ({consensus_strength:.1f}%). "
                f"Waiting for clearer market direction."
            )
        
        return " ".join(reasoning_parts)
    
    def _analyze_agent_consensus(self, agent_outputs: Dict[str, Any], consensus_data: Dict[str, Any]) -> str:
        """Analyze how agents agreed or disagreed"""
        total_agents = consensus_data['total_agents']
        consensus_strength = consensus_data['consensus_strength']
        
        if consensus_strength >= 80:
            return f"Strong agreement among {total_agents} agents with {consensus_strength:.1f}% consensus."
        elif consensus_strength >= 60:
            return f"Moderate agreement among {total_agents} agents with some divergent views."
        else:
            return f"Mixed signals with {consensus_strength:.1f}% consensus. Agents show significant disagreement."
    
    def _extract_key_factors(self, agent_outputs: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key factors mentioned by agents"""
        factors = {
            "bullish_factors": [],
            "bearish_factors": [],
            "risk_factors": [],
            "growth_drivers": []
        }
        
        # This is a simplified version - in production, would use NLP to extract factors
        for agent_name, agent_data in agent_outputs.items():
            signal = agent_data.get('signal', '').lower()
            reasoning = agent_data.get('reasoning', '')
            
            if signal in ['bullish', 'buy', 'strong_buy']:
                factors["bullish_factors"].append(f"{agent_data.get('display_name', agent_name)}: {reasoning[:100]}...")
            elif signal in ['bearish', 'sell', 'strong_sell']:
                factors["bearish_factors"].append(f"{agent_data.get('display_name', agent_name)}: {reasoning[:100]}...")
        
        return factors
    
    def _generate_market_outlook(self, agent_outputs: Dict[str, Any], consensus_data: Dict[str, Any]) -> str:
        """Generate market outlook based on agent analysis"""
        consensus_signal = consensus_data['consensus_signal']
        avg_confidence = consensus_data['avg_confidence']
        
        if consensus_signal == 'bullish' and avg_confidence >= 80:
            return "Positive market outlook with strong fundamentals and growth potential."
        elif consensus_signal == 'bearish' and avg_confidence >= 80:
            return "Cautious market outlook with identified risks and headwinds."
        else:
            return "Mixed market outlook requiring careful monitoring of key indicators."
    
    async def _store_portfolio_verdict(
        self,
        analysis_period_id: UUID,
        instrument_id: UUID,
        analysis_period: date,
        verdict_data: Dict[str, Any]
    ) -> UUID:
        """Store portfolio verdict in database"""
        query = """
        INSERT INTO portfolio_verdicts (
            analysis_period_id,
            instrument_id,
            analysis_period,
            recommendation,
            confidence,
            target_price,
            stop_loss,
            time_horizon_days,
            risk_rating,
            position_size_recommendation,
            reasoning,
            key_factors,
            agent_consensus_analysis,
            market_outlook
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (instrument_id, analysis_period)
        DO UPDATE SET
            recommendation = EXCLUDED.recommendation,
            confidence = EXCLUDED.confidence,
            target_price = EXCLUDED.target_price,
            stop_loss = EXCLUDED.stop_loss,
            reasoning = EXCLUDED.reasoning,
            key_factors = EXCLUDED.key_factors,
            agent_consensus_analysis = EXCLUDED.agent_consensus_analysis,
            market_outlook = EXCLUDED.market_outlook,
            updated_at = NOW()
        RETURNING id
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(
                query,
                analysis_period_id,
                instrument_id,
                analysis_period,
                verdict_data['recommendation'],
                Decimal(str(verdict_data['confidence'])),
                Decimal(str(verdict_data['target_price'])) if verdict_data['target_price'] else None,
                Decimal(str(verdict_data['stop_loss'])) if verdict_data['stop_loss'] else None,
                verdict_data['time_horizon_days'],
                verdict_data['risk_rating'],
                Decimal(str(verdict_data['position_size_recommendation'])),
                verdict_data['reasoning'],
                json.dumps(verdict_data['key_factors']),
                verdict_data['agent_consensus_analysis'],
                verdict_data['market_outlook']
            )
            
            return row['id']
    
    async def get_verdict_by_id(self, verdict_id: UUID) -> Optional[Dict[str, Any]]:
        """Get portfolio verdict by ID"""
        query = """
        SELECT pv.*, i.ticker, i.name as instrument_name
        FROM portfolio_verdicts pv
        JOIN instruments i ON i.id = pv.instrument_id
        WHERE pv.id = $1
        """
        
        async with self.db_manager.get_connection() as conn:
            row = await conn.fetchrow(query, verdict_id)
            if row:
                result = dict(row)
                result['key_factors'] = json.loads(result['key_factors'])
                return result
            return None
    
    async def list_verdicts(
        self,
        ticker: Optional[str] = None,
        recommendation: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List portfolio verdicts with optional filtering"""
        base_query = """
        SELECT pv.*, i.ticker, i.name as instrument_name
        FROM portfolio_verdicts pv
        JOIN instruments i ON i.id = pv.instrument_id
        """
        
        where_conditions = []
        params = []
        
        if ticker:
            where_conditions.append(f"i.ticker = ${len(params) + 1}")
            params.append(ticker)
        
        if recommendation:
            where_conditions.append(f"pv.recommendation = ${len(params) + 1}")
            params.append(recommendation)
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        query = f"""
        {base_query} 
        {where_clause}
        ORDER BY pv.analysis_period DESC, pv.created_at DESC
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        
        params.extend([limit, offset])
        
        async with self.db_manager.get_connection() as conn:
            rows = await conn.fetch(query, *params)
            
            results = []
            for row in rows:
                result = dict(row)
                result['key_factors'] = json.loads(result['key_factors'])
                results.append(result)
            
            return results
