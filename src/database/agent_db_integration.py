"""
AI Hedge Fund Agent Database Integration
Connects existing agent analysis system with PostgreSQL database for persistence and learning
"""

import asyncio
import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional
import uuid
from decimal import Decimal

from .db_manager import DatabaseManager, AgentPrediction, PredictionOutcome, create_database_manager

# Configure logging
logger = logging.getLogger(__name__)

class AgentDatabaseIntegrator:
    """Integrates agent analysis results with database storage"""
    
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db_manager = db_manager
        self._agent_cache = {}  # Cache for agent ID lookups
        self._instrument_cache = {}  # Cache for instrument ID lookups
    
    async def initialize(self):
        """Initialize database connection and cache lookups"""
        if not self.db_manager:
            self.db_manager = await create_database_manager()
        
        # Pre-load agent and instrument mappings
        await self._load_agent_cache()
        await self._load_instrument_cache()
        
        logger.info("Agent Database Integrator initialized successfully")
    
    async def _load_agent_cache(self):
        """Load agent name to ID mappings"""
        agents = await self.db_manager.get_all_active_agents()
        for agent in agents:
            self._agent_cache[agent['name']] = agent['id']
        
        logger.info(f"Loaded {len(self._agent_cache)} agents into cache")
    
    async def _load_instrument_cache(self):
        """Load instrument ticker to ID mappings"""
        # This will be populated as instruments are encountered
        pass
    
    async def _get_or_create_instrument_id(self, ticker: str, 
                                         name: Optional[str] = None) -> uuid.UUID:
        """Get instrument ID, creating if necessary"""
        if ticker in self._instrument_cache:
            return self._instrument_cache[ticker]
        
        # Try to get from database
        instrument = await self.db_manager.get_instrument_by_ticker(ticker)
        
        if instrument:
            instrument_id = instrument['id']
        else:
            # Create new instrument
            instrument_name = name or ticker
            instrument_id = await self.db_manager.create_instrument_if_not_exists(
                ticker=ticker,
                name=instrument_name,
                market='US' if '.' not in ticker else 'NSE',  # Simple heuristic
                currency='USD' if '.' not in ticker else 'INR'
            )
        
        self._instrument_cache[ticker] = instrument_id
        return instrument_id
    
    async def store_agent_analysis_results(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store complete agent analysis results in database
        
        Args:
            analysis_results: Full analysis results from agent run
            
        Returns:
            Dictionary with storage statistics and prediction IDs
        """
        try:
            storage_stats = {
                'predictions_stored': 0,
                'agents_processed': 0,
                'instruments_processed': set(),
                'prediction_ids': [],
                'errors': []
            }
            
            # Extract stock symbols from analysis
            stocks = analysis_results.get('metadata', {}).get('stocks', [])
            if isinstance(stocks, str):
                stocks = [stocks]  # Handle single stock case
            
            # Process each agent's results
            agents = analysis_results.get('agents', [])
            
            for agent_data in agents:
                try:
                    agent_name = agent_data.get('name', '')
                    agent_id = self._agent_cache.get(agent_name)
                    
                    if not agent_id:
                        storage_stats['errors'].append(f"Agent not found: {agent_name}")
                        continue
                    
                    # Process predictions for each stock
                    for stock in stocks:
                        try:
                            prediction_id = await self._store_agent_stock_prediction(
                                agent_id=agent_id,
                                agent_data=agent_data,
                                stock=stock,
                                analysis_metadata=analysis_results.get('metadata', {})
                            )
                            
                            if prediction_id:
                                storage_stats['prediction_ids'].append(str(prediction_id))
                                storage_stats['predictions_stored'] += 1
                                storage_stats['instruments_processed'].add(stock)
                        
                        except Exception as e:
                            error_msg = f"Failed to store prediction for {agent_name}/{stock}: {e}"
                            logger.error(error_msg)
                            storage_stats['errors'].append(error_msg)
                    
                    storage_stats['agents_processed'] += 1
                
                except Exception as e:
                    error_msg = f"Failed to process agent {agent_data.get('name', 'unknown')}: {e}"
                    logger.error(error_msg)
                    storage_stats['errors'].append(error_msg)
            
            # Convert set to list for JSON serialization
            storage_stats['instruments_processed'] = list(storage_stats['instruments_processed'])
            
            # Log summary
            logger.info(f"Stored {storage_stats['predictions_stored']} predictions "
                       f"from {storage_stats['agents_processed']} agents "
                       f"for {len(storage_stats['instruments_processed'])} instruments")
            
            return storage_stats
        
        except Exception as e:
            logger.error(f"Failed to store agent analysis results: {e}")
            return {
                'predictions_stored': 0,
                'agents_processed': 0,
                'instruments_processed': [],
                'prediction_ids': [],
                'errors': [str(e)]
            }
    
    async def _store_agent_stock_prediction(self, agent_id: uuid.UUID,
                                          agent_data: Dict[str, Any],
                                          stock: str,
                                          analysis_metadata: Dict[str, Any]) -> Optional[uuid.UUID]:
        """Store individual agent prediction for a stock"""
        try:
            # Get or create instrument ID
            instrument_id = await self._get_or_create_instrument_id(stock)
            
            # Extract agent-specific data for this stock
            agent_stock_data = agent_data.get(stock, {})
            if not agent_stock_data and len(agent_data.keys()) == 1:
                # Handle case where stock data is directly in agent_data
                agent_stock_data = agent_data
            
            # Extract signal and confidence
            signal = self._extract_signal(agent_stock_data)
            confidence = self._extract_confidence(agent_stock_data)
            
            if not signal or confidence is None:
                logger.warning(f"Missing signal or confidence for {agent_data.get('name')}/{stock}")
                return None
            
            # Build prediction object
            prediction = AgentPrediction(
                agent_id=agent_id,
                instrument_id=instrument_id,
                signal=signal,
                confidence=float(confidence),
                reasoning=self._extract_reasoning(agent_stock_data),
                market_conditions=self._extract_market_conditions(analysis_metadata, stock),
                financial_metrics=self._extract_financial_metrics(agent_stock_data),
                price_data=self._extract_price_data(analysis_metadata, stock),
                target_price=self._extract_target_price(agent_stock_data),
                stop_loss=self._extract_stop_loss(agent_stock_data),
                time_horizon_days=self._extract_time_horizon(agent_stock_data),
                position_size_pct=self._extract_position_size(agent_stock_data),
                model_version=analysis_metadata.get('version', '1.0'),
                feature_vector=self._extract_features(agent_stock_data),
                external_factors=self._extract_external_factors(analysis_metadata)
            )
            
            # Save to database
            prediction_id = await self.db_manager.save_agent_prediction(prediction)
            return prediction_id
        
        except Exception as e:
            logger.error(f"Failed to store prediction for {stock}: {e}")
            return None
    
    def _extract_signal(self, agent_data: Dict[str, Any]) -> Optional[str]:
        """Extract trading signal from agent data"""
        # Look for signal in various possible locations
        signal_keys = ['signal', 'recommendation', 'action', 'position']
        
        for key in signal_keys:
            if key in agent_data:
                signal = str(agent_data[key]).lower()
                
                # Normalize signal values
                if signal in ['buy', 'bullish', 'long', 'positive']:
                    return 'bullish'
                elif signal in ['sell', 'bearish', 'short', 'negative']:
                    return 'bearish'
                elif signal in ['hold', 'neutral', 'wait']:
                    return 'neutral'
        
        # Try to infer from confidence and reasoning
        confidence = self._extract_confidence(agent_data)
        if confidence is not None:
            if confidence > 70:
                return 'bullish'  # Default high confidence to bullish
            elif confidence < 30:
                return 'bearish'
            else:
                return 'neutral'
        
        return None
    
    def _extract_confidence(self, agent_data: Dict[str, Any]) -> Optional[float]:
        """Extract confidence score from agent data"""
        confidence_keys = ['confidence', 'confidence_score', 'certainty', 'probability']
        
        for key in confidence_keys:
            if key in agent_data:
                try:
                    confidence = float(agent_data[key])
                    # Normalize to 0-100 if needed
                    if confidence <= 1.0:
                        confidence *= 100
                    return min(100.0, max(0.0, confidence))
                except (ValueError, TypeError):
                    continue
        
        return None
    
    def _extract_reasoning(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract reasoning/analysis from agent data"""
        reasoning_keys = ['reasoning', 'analysis', 'rationale', 'explanation', 'details']
        reasoning = {}
        
        for key in reasoning_keys:
            if key in agent_data:
                reasoning[key] = agent_data[key]
        
        # Include other relevant fields
        for key, value in agent_data.items():
            if key not in ['signal', 'confidence', 'target_price', 'stop_loss']:
                reasoning[key] = value
        
        return reasoning
    
    def _extract_market_conditions(self, metadata: Dict[str, Any], stock: str) -> Dict[str, Any]:
        """Extract market conditions from analysis metadata"""
        return {
            'timestamp': metadata.get('timestamp'),
            'market_session': metadata.get('market_session'),
            'volatility': metadata.get('market_volatility'),
            'sector_performance': metadata.get('sector_performance', {}).get(stock),
            'market_trend': metadata.get('market_trend')
        }
    
    def _extract_financial_metrics(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract financial metrics from agent data"""
        financial_keys = ['pe_ratio', 'pb_ratio', 'debt_to_equity', 'roe', 'revenue_growth',
                         'earnings_growth', 'current_ratio', 'quick_ratio', 'gross_margin']
        
        return {key: agent_data.get(key) for key in financial_keys 
                if agent_data.get(key) is not None}
    
    def _extract_price_data(self, metadata: Dict[str, Any], stock: str) -> Dict[str, Any]:
        """Extract price data from metadata"""
        price_data = metadata.get('price_data', {}).get(stock, {})
        return {
            'current_price': price_data.get('current_price'),
            'previous_close': price_data.get('previous_close'),
            'day_high': price_data.get('day_high'),
            'day_low': price_data.get('day_low'),
            'volume': price_data.get('volume'),
            'avg_volume': price_data.get('avg_volume')
        }
    
    def _extract_target_price(self, agent_data: Dict[str, Any]) -> Optional[float]:
        """Extract target price from agent data"""
        target_keys = ['target_price', 'price_target', 'target']
        
        for key in target_keys:
            if key in agent_data:
                try:
                    return float(agent_data[key])
                except (ValueError, TypeError):
                    continue
        
        return None
    
    def _extract_stop_loss(self, agent_data: Dict[str, Any]) -> Optional[float]:
        """Extract stop loss from agent data"""
        stop_keys = ['stop_loss', 'stop_price', 'risk_limit']
        
        for key in stop_keys:
            if key in agent_data:
                try:
                    return float(agent_data[key])
                except (ValueError, TypeError):
                    continue
        
        return None
    
    def _extract_time_horizon(self, agent_data: Dict[str, Any]) -> int:
        """Extract time horizon from agent data"""
        horizon_keys = ['time_horizon', 'horizon_days', 'holding_period']
        
        for key in horizon_keys:
            if key in agent_data:
                try:
                    return int(agent_data[key])
                except (ValueError, TypeError):
                    continue
        
        return 30  # Default 30 days
    
    def _extract_position_size(self, agent_data: Dict[str, Any]) -> Optional[float]:
        """Extract position size percentage from agent data"""
        size_keys = ['position_size', 'allocation', 'weight']
        
        for key in size_keys:
            if key in agent_data:
                try:
                    return float(agent_data[key])
                except (ValueError, TypeError):
                    continue
        
        return None
    
    def _extract_features(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract technical/fundamental features from agent data"""
        feature_keys = ['sma_10', 'sma_50', 'rsi', 'macd', 'bollinger_bands',
                       'volume_ratio', 'beta', 'volatility']
        
        return {key: agent_data.get(key) for key in feature_keys 
                if agent_data.get(key) is not None}
    
    def _extract_external_factors(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract external factors from metadata"""
        return {
            'news_sentiment': metadata.get('news_sentiment'),
            'market_sentiment': metadata.get('market_sentiment'),
            'economic_indicators': metadata.get('economic_indicators'),
            'sector_rotation': metadata.get('sector_rotation')
        }
    
    async def get_agent_performance_summary(self, days_back: int = 30) -> Dict[str, Any]:
        """Get performance summary for all agents"""
        try:
            # Get top performing agents
            top_agents = await self.db_manager.get_top_performing_agents(
                limit=10, days_back=days_back
            )
            
            # Get system health
            health_status = await self.db_manager.get_system_health_status(
                hours_back=24
            )
            
            return {
                'top_agents': top_agents,
                'system_health': health_status,
                'period_days': days_back,
                'generated_at': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Failed to get performance summary: {e}")
            return {'error': str(e)}
    
    async def close(self):
        """Close database connections"""
        if self.db_manager:
            await self.db_manager.close()

# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def store_analysis_results(analysis_results: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to store analysis results"""
    integrator = AgentDatabaseIntegrator()
    try:
        await integrator.initialize()
        return await integrator.store_agent_analysis_results(analysis_results)
    finally:
        await integrator.close()

async def get_performance_dashboard() -> Dict[str, Any]:
    """Convenience function to get performance dashboard data"""
    integrator = AgentDatabaseIntegrator()
    try:
        await integrator.initialize()
        return await integrator.get_agent_performance_summary()
    finally:
        await integrator.close()

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_usage():
    """Example usage of agent database integration"""
    
    # Sample analysis results (similar to your current format)
    sample_results = {
        'status': 'success',
        'metadata': {
            'timestamp': datetime.utcnow().isoformat(),
            'stocks': ['AAPL', 'MSFT'],
            'version': '2.0'
        },
        'agents': [
            {
                'name': 'warren_buffett_agent',
                'AAPL': {
                    'signal': 'bullish',
                    'confidence': 85.5,
                    'reasoning': 'Strong fundamentals and brand moat',
                    'target_price': 180.0
                },
                'MSFT': {
                    'signal': 'bullish', 
                    'confidence': 78.2,
                    'reasoning': 'Cloud growth and AI positioning'
                }
            },
            {
                'name': 'technical_analyst_agent',
                'AAPL': {
                    'signal': 'neutral',
                    'confidence': 65.0,
                    'reasoning': 'Consolidation pattern'
                }
            }
        ]
    }
    
    # Store results
    storage_stats = await store_analysis_results(sample_results)
    print(f"Storage results: {storage_stats}")
    
    # Get performance dashboard
    dashboard = await get_performance_dashboard()
    print(f"Performance dashboard: {dashboard}")

if __name__ == "__main__":
    asyncio.run(example_usage())
