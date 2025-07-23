"""
AI Hedge Fund Database Manager
Handles PostgreSQL database connections and operations for the self-improving ML system
"""

import os
import asyncio
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union
from decimal import Decimal
import json
import uuid

import asyncpg
import pandas as pd
from pydantic import BaseModel, UUID4
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConfig:
    """Database configuration from environment variables"""
    
    def __init__(self):
        # First try to use DATABASE_URL if available (for Neon PostgreSQL)
        self.database_url = os.getenv('DATABASE_URL')
        
        # Always set individual variables for compatibility
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = int(os.getenv('DB_PORT', 5432))
        self.database = os.getenv('DB_NAME', 'ai_hedge_fund_db')
        self.username = os.getenv('DB_USER', 'ai_hedge_fund_user')
        self.password = os.getenv('DB_PASSWORD', 'ai_hedge_fund_secure_password_2025')
        
    @property
    def connection_string(self) -> str:
        if self.database_url:
            return self.database_url
        else:
            return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

class AgentPrediction(BaseModel):
    """Agent prediction data model"""
    agent_id: UUID4
    instrument_id: UUID4
    signal: str  # 'bullish', 'bearish', 'neutral'
    confidence: float  # 0-100
    reasoning: Dict[str, Any]
    market_conditions: Optional[Dict[str, Any]] = {}
    financial_metrics: Optional[Dict[str, Any]] = {}
    price_data: Optional[Dict[str, Any]] = {}
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    time_horizon_days: int = 30
    position_size_pct: Optional[float] = None
    model_version: Optional[str] = None
    feature_vector: Optional[Dict[str, Any]] = {}
    external_factors: Optional[Dict[str, Any]] = {}
    
class PredictionOutcome(BaseModel):
    """Prediction outcome data model"""
    prediction_id: UUID4
    actual_signal: Optional[str] = None
    actual_price_change: Optional[float] = None
    actual_return: Optional[float] = None
    max_favorable_move: Optional[float] = None
    max_adverse_move: Optional[float] = None
    is_correct: Optional[bool] = None
    accuracy_score: Optional[float] = None
    return_score: Optional[float] = None
    risk_adjusted_return: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    days_to_target: Optional[int] = None
    early_exit_reason: Optional[str] = None

class DatabaseManager:
    """Main database manager for AI Hedge Fund platform"""
    
    def __init__(self, config: Optional[DatabaseConfig] = None):
        self.config = config or DatabaseConfig()
        self._pool: Optional[asyncpg.Pool] = None
        
    async def initialize(self):
        """Initialize database connection pool"""
        try:
            # Use connection_string which handles both DATABASE_URL and individual params
            connection_string = self.config.connection_string
            logger.info(f"Initializing database connection to: {connection_string.split('@')[0]}@[REDACTED]")
            
            self._pool = await asyncpg.create_pool(
                connection_string,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("Database connection pool initialized successfully.")
            
            # Test connection
            async with self._pool.acquire() as conn:
                result = await conn.fetchval("SELECT version()")
                logger.info(f"Connected to PostgreSQL: {result}")
                
        except Exception as e:
            logger.error(f"Failed to initialize database connection: {e}")
            raise
    
    async def close(self):
        """Close database connection pool"""
        if self._pool:
            await self._pool.close()
            logger.info("Database connection pool closed.")
    
    async def health_check(self):
        """Health check for database connectivity and table existence"""
        try:
            if not self._pool:
                return {
                    "connected": False,
                    "tables_exist": False,
                    "error": "Database pool not initialized"
                }
            
            async with self._pool.acquire() as conn:
                # Check connection
                await conn.fetchval("SELECT 1")
                
                # Check if required tables exist
                tables_query = """
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('agents', 'instruments', 'agent_predictions')
                """
                table_count = await conn.fetchval(tables_query)
                
                # Check agent count
                agent_count = await conn.fetchval("SELECT COUNT(*) FROM agents WHERE is_active = true")
                
                return {
                    "connected": True,
                    "tables_exist": table_count >= 3,
                    "agent_count": agent_count,
                    "expected_agents": 17
                }
                
        except Exception as e:
            return {
                "connected": False,
                "tables_exist": False,
                "error": str(e)
            }
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool"""
        if not self._pool:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        
        conn = await self._pool.acquire()
        try:
            yield conn
        finally:
            await self._pool.release(conn)
    
    # ============================================================================
    # AGENT MANAGEMENT
    # ============================================================================
    
    async def get_agent_by_name(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """Get agent information by name"""
        async with self.get_connection() as conn:
            result = await conn.fetchrow(
                "SELECT * FROM agents WHERE name = $1 AND is_active = true",
                agent_name
            )
            return dict(result) if result else None
    
    async def get_all_active_agents(self) -> List[Dict[str, Any]]:
        """Get all active agents"""
        async with self.get_connection() as conn:
            results = await conn.fetch(
                "SELECT * FROM agents WHERE is_active = true ORDER BY display_name"
            )
            return [dict(row) for row in results]
    
    async def get_instrument_by_ticker(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get instrument information by ticker"""
        async with self.get_connection() as conn:
            result = await conn.fetchrow(
                "SELECT * FROM instruments WHERE ticker = $1 AND is_active = true",
                ticker
            )
            return dict(result) if result else None
    
    async def create_instrument_if_not_exists(self, ticker: str, name: str, 
                                           market: str = 'US', currency: str = 'USD',
                                           sector: Optional[str] = None) -> UUID4:
        """Create instrument if it doesn't exist, return UUID"""
        async with self.get_connection() as conn:
            # Check if exists
            result = await conn.fetchrow(
                "SELECT id FROM instruments WHERE ticker = $1", ticker
            )
            
            if result:
                return result['id']
            
            # Create new instrument
            instrument_id = await conn.fetchval(
                """
                INSERT INTO instruments (ticker, name, market, currency, sector)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                """,
                ticker, name, market, currency, sector
            )
            
            logger.info(f"Created new instrument: {ticker} ({instrument_id})")
            return instrument_id
    
    # ============================================================================
    # PREDICTION MANAGEMENT
    # ============================================================================
    
    async def save_agent_prediction(self, prediction: AgentPrediction) -> UUID4:
        """Save agent prediction to database"""
        async with self.get_connection() as conn:
            prediction_id = await conn.fetchval(
                """
                INSERT INTO agent_predictions (
                    agent_id, instrument_id, signal, confidence, reasoning,
                    market_conditions, financial_metrics, price_data,
                    target_price, stop_loss, time_horizon_days, position_size_pct,
                    model_version, feature_vector, external_factors
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id
                """,
                prediction.agent_id, prediction.instrument_id, prediction.signal,
                prediction.confidence, json.dumps(prediction.reasoning),
                json.dumps(prediction.market_conditions), 
                json.dumps(prediction.financial_metrics),
                json.dumps(prediction.price_data), prediction.target_price,
                prediction.stop_loss, prediction.time_horizon_days,
                prediction.position_size_pct, prediction.model_version,
                json.dumps(prediction.feature_vector),
                json.dumps(prediction.external_factors)
            )
            
            logger.info(f"Saved prediction {prediction_id} for agent {prediction.agent_id}")
            return prediction_id
    
    async def save_prediction_outcome(self, outcome: PredictionOutcome) -> UUID4:
        """Save prediction outcome to database"""
        async with self.get_connection() as conn:
            outcome_id = await conn.fetchval(
                """
                INSERT INTO prediction_outcomes (
                    prediction_id, actual_signal, actual_price_change, actual_return,
                    max_favorable_move, max_adverse_move, is_correct, accuracy_score,
                    return_score, risk_adjusted_return, sharpe_ratio, days_to_target,
                    early_exit_reason
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id
                """,
                outcome.prediction_id, outcome.actual_signal, outcome.actual_price_change,
                outcome.actual_return, outcome.max_favorable_move, outcome.max_adverse_move,
                outcome.is_correct, outcome.accuracy_score, outcome.return_score,
                outcome.risk_adjusted_return, outcome.sharpe_ratio, outcome.days_to_target,
                outcome.early_exit_reason
            )
            
            logger.info(f"Saved outcome {outcome_id} for prediction {outcome.prediction_id}")
            return outcome_id
    
    async def get_agent_predictions(self, agent_id: UUID4, 
                                  limit: int = 100,
                                  days_back: int = 30) -> List[Dict[str, Any]]:
        """Get recent predictions for an agent"""
        async with self.get_connection() as conn:
            results = await conn.fetch(
                """
                SELECT ap.*, i.ticker, i.name as instrument_name,
                       po.actual_return, po.is_correct, po.accuracy_score
                FROM agent_predictions ap
                JOIN instruments i ON ap.instrument_id = i.id
                LEFT JOIN prediction_outcomes po ON ap.id = po.prediction_id
                WHERE ap.agent_id = $1
                  AND ap.prediction_timestamp >= NOW() - INTERVAL '%s days'
                ORDER BY ap.prediction_timestamp DESC
                LIMIT $2
                """ % days_back,
                agent_id, limit
            )
            
            return [dict(row) for row in results]
    
    # ============================================================================
    # PERFORMANCE ANALYTICS
    # ============================================================================
    
    async def calculate_agent_performance(self, agent_id: UUID4,
                                        start_date: date,
                                        end_date: date,
                                        instrument_id: Optional[UUID4] = None) -> Dict[str, Any]:
        """Calculate comprehensive agent performance metrics"""
        async with self.get_connection() as conn:
            # Use the stored function for basic metrics
            basic_metrics = await conn.fetchrow(
                "SELECT * FROM calculate_agent_performance($1, $2, $3, $4)",
                agent_id, start_date, end_date, instrument_id
            )
            
            # Get additional detailed metrics
            detailed_stats = await conn.fetchrow(
                """
                WITH prediction_stats AS (
                    SELECT 
                        ap.signal,
                        ap.confidence,
                        po.actual_return,
                        po.is_correct,
                        po.return_score,
                        po.risk_adjusted_return,
                        po.days_to_target
                    FROM agent_predictions ap
                    LEFT JOIN prediction_outcomes po ON ap.id = po.prediction_id
                    WHERE ap.agent_id = $1
                      AND ap.prediction_timestamp::date BETWEEN $2 AND $3
                      AND ($4 IS NULL OR ap.instrument_id = $4)
                      AND po.id IS NOT NULL
                )
                SELECT 
                    COUNT(*) as total_predictions,
                    AVG(confidence) as avg_confidence,
                    STDDEV(COALESCE(return_score, 0)) as return_volatility,
                    MAX(return_score) as best_return,
                    MIN(return_score) as worst_return,
                    AVG(days_to_target) as avg_days_to_target,
                    COUNT(CASE WHEN signal = 'bullish' THEN 1 END) as bullish_predictions,
                    COUNT(CASE WHEN signal = 'bearish' THEN 1 END) as bearish_predictions,
                    COUNT(CASE WHEN signal = 'neutral' THEN 1 END) as neutral_predictions
                FROM prediction_stats
                """,
                agent_id, start_date, end_date, instrument_id
            )
            
            # Combine results
            performance = {
                'agent_id': str(agent_id),
                'period_start': start_date.isoformat(),
                'period_end': end_date.isoformat(),
                'instrument_id': str(instrument_id) if instrument_id else None
            }
            
            # Add metrics if available
            if basic_metrics:
                performance.update(dict(basic_metrics))
            if detailed_stats:
                performance.update(dict(detailed_stats))
            
            return performance
    
    async def get_top_performing_agents(self, limit: int = 10,
                                      days_back: int = 30) -> List[Dict[str, Any]]:
        """Get top performing agents by accuracy and returns"""
        async with self.get_connection() as conn:
            results = await conn.fetch(
                """
                WITH agent_stats AS (
                    SELECT 
                        a.id,
                        a.name,
                        a.display_name,
                        a.type,
                        COUNT(po.id) as total_predictions,
                        AVG(CASE WHEN po.is_correct THEN 100.0 ELSE 0.0 END) as accuracy_rate,
                        AVG(po.return_score) as avg_return,
                        AVG(po.risk_adjusted_return) as avg_risk_adj_return
                    FROM agents a
                    JOIN agent_predictions ap ON a.id = ap.agent_id
                    LEFT JOIN prediction_outcomes po ON ap.id = po.prediction_id
                    WHERE ap.prediction_timestamp >= NOW() - INTERVAL '%s days'
                      AND po.id IS NOT NULL
                      AND a.is_active = true
                    GROUP BY a.id, a.name, a.display_name, a.type
                    HAVING COUNT(po.id) >= 5  -- Minimum predictions for ranking
                )
                SELECT *,
                       ROW_NUMBER() OVER (ORDER BY accuracy_rate DESC, avg_return DESC) as rank
                FROM agent_stats
                ORDER BY accuracy_rate DESC, avg_return DESC
                LIMIT $1
                """ % days_back,
                limit
            )
            
            return [dict(row) for row in results]
    
    # ============================================================================
    # FEATURE STORE
    # ============================================================================
    
    async def save_features(self, instrument_id: UUID4, 
                          features: Dict[str, Any],
                          feature_timestamp: Optional[datetime] = None) -> bool:
        """Save features to feature store"""
        if feature_timestamp is None:
            feature_timestamp = datetime.utcnow()
        
        async with self.get_connection() as conn:
            try:
                # Build dynamic insert query based on available features
                feature_columns = []
                feature_values = []
                placeholders = []
                
                # Standard feature mapping
                feature_mapping = {
                    'sma_10': features.get('sma_10'),
                    'sma_50': features.get('sma_50'),
                    'sma_200': features.get('sma_200'),
                    'rsi_14': features.get('rsi_14'),
                    'macd': features.get('macd'),
                    'bollinger_upper': features.get('bollinger_upper'),
                    'bollinger_lower': features.get('bollinger_lower'),
                    'volume_ratio': features.get('volume_ratio'),
                    'pe_ratio': features.get('pe_ratio'),
                    'pb_ratio': features.get('pb_ratio'),
                    'roe': features.get('roe'),
                    'debt_to_equity': features.get('debt_to_equity'),
                    'current_ratio': features.get('current_ratio'),
                    'revenue_growth': features.get('revenue_growth'),
                    'earnings_growth': features.get('earnings_growth'),
                    'news_sentiment': features.get('news_sentiment'),
                    'social_sentiment': features.get('social_sentiment'),
                    'insider_activity_score': features.get('insider_activity_score'),
                    'analyst_rating_avg': features.get('analyst_rating_avg'),
                    'market_beta': features.get('market_beta'),
                    'correlation_spy': features.get('correlation_spy'),
                    'sector_performance': features.get('sector_performance'),
                    'volatility_30d': features.get('volatility_30d')
                }
                
                # Add base columns
                feature_columns = ['instrument_id', 'feature_timestamp']
                feature_values = [instrument_id, feature_timestamp]
                placeholders = ['$1', '$2']
                
                param_count = 2
                for col, value in feature_mapping.items():
                    if value is not None:
                        feature_columns.append(col)
                        feature_values.append(value)
                        param_count += 1
                        placeholders.append(f'${param_count}')
                
                # Add custom features as JSON
                custom_features = {k: v for k, v in features.items() 
                                 if k not in feature_mapping}
                if custom_features:
                    feature_columns.append('custom_features')
                    feature_values.append(json.dumps(custom_features))
                    param_count += 1
                    placeholders.append(f'${param_count}')
                
                query = f"""
                INSERT INTO feature_store ({', '.join(feature_columns)})
                VALUES ({', '.join(placeholders)})
                ON CONFLICT (instrument_id, feature_timestamp) 
                DO UPDATE SET {', '.join([f'{col} = EXCLUDED.{col}' for col in feature_columns[2:]])}
                """
                
                await conn.execute(query, *feature_values)
                return True
                
            except Exception as e:
                logger.error(f"Failed to save features: {e}")
                return False
    
    # ============================================================================
    # SYSTEM HEALTH
    # ============================================================================
    
    async def log_system_health(self, component: str, status: str,
                              metrics: Optional[Dict[str, Any]] = None,
                              error_message: Optional[str] = None) -> bool:
        """Log system health status"""
        async with self.get_connection() as conn:
            try:
                await conn.execute(
                    """
                    INSERT INTO system_health (component, status, metrics, error_message)
                    VALUES ($1, $2, $3, $4)
                    """,
                    component, status, 
                    json.dumps(metrics) if metrics else None,
                    error_message
                )
                return True
            except Exception as e:
                logger.error(f"Failed to log system health: {e}")
                return False
    
    async def get_system_health_status(self, hours_back: int = 24) -> List[Dict[str, Any]]:
        """Get recent system health status"""
        async with self.get_connection() as conn:
            results = await conn.fetch(
                """
                SELECT component, status, metrics, error_message, health_timestamp
                FROM system_health
                WHERE health_timestamp >= NOW() - INTERVAL '%s hours'
                ORDER BY health_timestamp DESC
                """ % hours_back
            )
            
            return [dict(row) for row in results]

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

async def create_database_manager() -> DatabaseManager:
    """Create and initialize database manager"""
    db_manager = DatabaseManager()
    await db_manager.initialize()
    return db_manager

def json_serializer(obj):
    """JSON serializer for complex objects"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_usage():
    """Example usage of the database manager"""
    db = await create_database_manager()
    
    try:
        # Get all active agents
        agents = await db.get_all_active_agents()
        print(f"Found {len(agents)} active agents")
        
        # Get top performing agents
        top_agents = await db.get_top_performing_agents(limit=5)
        print(f"Top 5 performing agents: {[a['display_name'] for a in top_agents]}")
        
        # Log system health
        await db.log_system_health('api', 'healthy', {'response_time': 150})
        
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(example_usage())
