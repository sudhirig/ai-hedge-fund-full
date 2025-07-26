from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import subprocess
import sys
import json
import time
import re
from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import datetime
import asyncio

# Import database manager
try:
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from src.database.db_manager import DatabaseManager, AgentPrediction
    DB_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Database manager not available: {e}")
    DB_AVAILABLE = False

# Load environment variables from .env file
load_dotenv()

# Environment validation
def validate_environment():
    """Validate required environment variables and dependencies."""
    missing_vars = []
    warnings = []
    
    # Check required API keys
    if not os.getenv("FINANCIAL_DATASETS_API_KEY"):
        missing_vars.append("FINANCIAL_DATASETS_API_KEY")
    
    # Check optional LLM API keys
    if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        warnings.append("No LLM API keys found - LLM agents will not function")
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")
    
    return {"warnings": warnings}

# Validate environment on startup
try:
    env_status = validate_environment()
    if env_status["warnings"]:
        print("⚠️  Environment warnings:")
        for warning in env_status["warnings"]:
            print(f"   - {warning}")
except ValueError as e:
    print(f"❌ Environment validation failed: {e}")
    sys.exit(1)

app = FastAPI(
    title="AI Hedge Fund API",
    description="Advanced AI-powered hedge fund simulation with multi-agent analysis",
    version="1.0.0"
)

# Configure CORS middleware for production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://ai-hedge-fund-frontend.onrender.com",  # Render frontend
        "https://*.netlify.app",  # Netlify deployments
        "https://*.vercel.app",   # Vercel deployments
        "https://ai-hedge-fund-app.windsurf.build",  # Windsurf deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database manager instance
db_manager = None

# Track startup time for uptime monitoring
startup_time = time.time()

# Data mapping helper function
async def map_to_agent_prediction(db_manager, agent_name: str, ticker: str, agent_data: dict, analysis_timestamp) -> AgentPrediction:
    """Map API prediction data to AgentPrediction model format"""
    try:
        # Debug: Check database manager state
        print(f"🔍 Debug: db_manager type: {type(db_manager)}")
        print(f"🔍 Debug: db_manager._pool: {db_manager._pool is not None if db_manager else 'None'}")
        
        # Get agent_id from agent_name (try both name and display_name)
        print(f"🔍 Debug: Looking up agent: '{agent_name}'")
        agent_info = await db_manager.get_agent_by_name(agent_name)
        
        # If not found by name, try by display_name
        if not agent_info:
            print(f"🔍 Debug: Agent not found by name, trying display_name lookup...")
            async with db_manager.get_connection() as conn:
                result = await conn.fetchrow(
                    "SELECT * FROM agents WHERE display_name = $1 AND is_active = true",
                    agent_name
                )
                agent_info = dict(result) if result else None
        
        print(f"🔍 Debug: Agent lookup result: {agent_info is not None}")
        
        if not agent_info:
            # Debug: List all available agents
            try:
                all_agents = await db_manager.get_all_active_agents()
                print(f"🔍 Debug: Available agents ({len(all_agents)}):")
                for i, agent in enumerate(all_agents[:5]):  # Show first 5
                    print(f"  {i+1}. '{agent['name']}' (display: '{agent.get('display_name', 'N/A')}')") 
            except Exception as debug_e:
                print(f"🔍 Debug: Error listing agents: {debug_e}")
            
            raise ValueError(f"Agent not found: {agent_name}")
        
        agent_id = agent_info['id']
        print(f"🔍 Debug: Found agent_id: {agent_id}")
        
        # Get instrument_id from ticker
        instrument_info = await db_manager.get_instrument_by_ticker(ticker)
        if not instrument_info:
            # Create instrument if it doesn't exist
            instrument_id = await db_manager.create_instrument_if_not_exists(
                ticker=ticker,
                name=ticker,  # Use ticker as name for now
                market='US',
                currency='USD'
            )
        else:
            instrument_id = instrument_info['id']
        
        # Create AgentPrediction object with proper data mapping
        prediction = AgentPrediction(
            agent_id=agent_id,
            instrument_id=instrument_id,
            signal=agent_data['signal'],
            confidence=float(agent_data['confidence']),
            reasoning={'text': agent_data['reasoning']},  # Convert string to dict
            market_conditions={},  # Default empty dict
            financial_metrics={},  # Default empty dict
            price_data={},  # Default empty dict
            target_price=None,  # Default None
            stop_loss=None,  # Default None
            time_horizon_days=30,  # Default 30 days
            position_size_pct=None,  # Default None
            model_version="1.0",  # Default version
            feature_vector={},  # Default empty dict
            external_factors={}  # Default empty dict
        )
        
        return prediction
        
    except Exception as e:
        print(f"⚠️  Error mapping prediction data for {agent_name}/{ticker}: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    global db_manager
    try:
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        # Run database migration to ensure schema is up to date
        await run_database_migration(db_manager)
        
        # Force database schema synchronization
        await synchronize_database_schema(db_manager)
        
        print("✅ Database connection established")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        raise

async def run_database_migration(db_manager: DatabaseManager):
    """Run database migration to create schema and add missing columns"""
    try:
        print("🔧 Running comprehensive database migration...")
        
        # First, create the complete schema if tables don't exist
        await create_database_schema(db_manager)
        
        # Then, add any missing columns to existing tables
        await add_missing_columns_to_tables(db_manager)
        
        print("✅ Database migration completed successfully")
        
    except Exception as e:
        print(f"⚠️  Database migration warning: {e}")
        # Don't raise - allow startup to continue with warnings

async def create_database_schema(db_manager: DatabaseManager):
    """Create the complete database schema if it doesn't exist"""
    try:
        print("🏠 Creating database schema...")
        
        async with db_manager.get_connection() as conn:
            # Check if core tables exist
            result = await conn.fetchval(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'agents'"
            )
            
            if result == 0:
                print("🛠️  Core tables not found, creating complete schema...")
                
                # Read and execute the complete schema
                import os
                from pathlib import Path
                
                # Get the schema file path
                current_dir = Path(__file__).parent.parent
                schema_path = current_dir / 'database' / 'schema.sql'
                
                if schema_path.exists():
                    with open(schema_path, 'r') as f:
                        schema_sql = f.read()
                    
                    # Execute schema creation
                    await conn.execute(schema_sql)
                    print("✅ Complete database schema created successfully")
                    
                    # Also run initial data
                    initial_data_path = current_dir / 'database' / 'initial_data.sql'
                    if initial_data_path.exists():
                        with open(initial_data_path, 'r') as f:
                            initial_data_sql = f.read()
                        await conn.execute(initial_data_sql)
                        print("✅ Initial data populated successfully")
                else:
                    print("⚠️  Schema file not found, skipping schema creation")
            else:
                print("ℹ️  Core tables already exist, skipping schema creation")
                
    except Exception as e:
        print(f"⚠️  Schema creation warning: {e}")

async def add_missing_columns_to_tables(db_manager: DatabaseManager):
    """Add any missing columns to existing tables"""
    try:
        print("🔧 Checking for missing columns...")
        
        # Define missing columns that need to be added
        missing_columns = [
            # agent_predictions table
            ("agent_predictions", "position_size_pct", "DECIMAL(5,4) DEFAULT 0.0"),
            ("agent_predictions", "model_version", "VARCHAR(50) DEFAULT 'v1.0'"),
            ("agent_predictions", "feature_vector", "JSONB DEFAULT '{}'"),
            ("agent_predictions", "external_factors", "JSONB DEFAULT '{}'"),
            
            # agents table
            ("agents", "type", "VARCHAR(50) DEFAULT 'hedge_fund'"),
            ("agents", "model_version", "VARCHAR(50) DEFAULT 'v1.0'"),
            ("agents", "risk_tolerance", "VARCHAR(20) DEFAULT 'moderate'"),
            
            # prediction_outcomes table
            ("prediction_outcomes", "market_conditions", "JSONB DEFAULT '{}'"),
            ("prediction_outcomes", "external_factors", "JSONB DEFAULT '{}'"),
            
            # agent_performance table
            ("agent_performance", "risk_adjusted_return", "DECIMAL(10,6) DEFAULT 0.0"),
            ("agent_performance", "max_drawdown", "DECIMAL(10,6) DEFAULT 0.0"),
            ("agent_performance", "volatility", "DECIMAL(10,6) DEFAULT 0.0"),
        ]
        
        async with db_manager.get_connection() as conn:
            for table_name, column_name, column_definition in missing_columns:
                try:
                    # Check if column exists
                    result = await conn.fetchval(
                        """
                        SELECT COUNT(*) 
                        FROM information_schema.columns 
                        WHERE table_name = $1 AND column_name = $2
                        """,
                        table_name, column_name
                    )
                    
                    if result == 0:
                        # Column doesn't exist, add it
                        alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
                        await conn.execute(alter_sql)
                        print(f"✅ Added column '{column_name}' to table '{table_name}'")
                    else:
                        print(f"ℹ️  Column '{column_name}' already exists in table '{table_name}'")
                        
                except Exception as e:
                    print(f"⚠️  Warning: Could not add column '{column_name}' to table '{table_name}': {e}")
        
        print("✅ Database migration completed successfully")
        
    except Exception as e:
        print(f"⚠️  Database migration warning: {e}")
        # Don't raise - allow startup to continue with warnings

async def synchronize_database_schema(db_manager: DatabaseManager):
    """Ensure database schema is synchronized across all connections"""
    try:
        print("🔄 Synchronizing database schema...")
        
        # Force connection pool refresh
        await db_manager.close()
        await db_manager.initialize()
        
        # Validate critical schema elements
        async with db_manager.get_connection() as conn:
            # Check if position_size_pct column exists
            result = await conn.fetchval("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'agent_predictions' 
                AND column_name = 'position_size_pct';
            """)
            
            if result == 0:
                print("⚠️  Warning: Critical column 'position_size_pct' not found in agent_predictions table")
                print("ℹ️  This should have been fixed by migration - platform may have reduced functionality")
            else:
                print("✅ Critical schema elements validated successfully")
            
            print("✅ Database schema synchronized successfully")
            
    except Exception as e:
        print(f"❌ Database schema synchronization failed: {e}")
        raise



# Agent Configuration Models
class AgentConfig(BaseModel):
    """Global agent configuration parameters"""
    confidence_threshold: Optional[float] = 0.6
    analysis_depth: Optional[int] = 5
    risk_tolerance: Optional[str] = "moderate"  # conservative, moderate, aggressive
    time_horizon: Optional[int] = 30  # days
    
class AgentWeights(BaseModel):
    """Weights for different analysis components"""
    technical: Optional[float] = 0.3
    fundamental: Optional[float] = 0.4
    sentiment: Optional[float] = 0.3
    valuation: Optional[float] = 0.0  # Auto-calculated if not provided
    
class TechnicalConfig(BaseModel):
    """Technical analysis specific configuration"""
    lookback_period: Optional[int] = 20
    rsi_period: Optional[int] = 14
    ma_short: Optional[int] = 20
    ma_long: Optional[int] = 50
    volume_threshold: Optional[float] = 1.5
    trend_weight: Optional[float] = 0.4
    momentum_weight: Optional[float] = 0.3
    volume_weight: Optional[float] = 0.3
    
class RiskConfig(BaseModel):
    """Risk management specific configuration"""
    max_position_size: Optional[float] = 0.1  # 10% of portfolio
    stop_loss_threshold: Optional[float] = 0.05  # 5%
    volatility_lookback: Optional[int] = 30
    correlation_threshold: Optional[float] = 0.7
    
class SentimentConfig(BaseModel):
    """Sentiment analysis specific configuration"""
    news_weight: Optional[float] = 0.6
    insider_weight: Optional[float] = 0.4
    sentiment_threshold: Optional[float] = 0.1
    news_lookback_days: Optional[int] = 7
    
class AgentSpecificConfig(BaseModel):
    """Agent-specific configuration parameters"""
    technical: Optional[TechnicalConfig] = None
    risk: Optional[RiskConfig] = None
    sentiment: Optional[SentimentConfig] = None
    
class FullAgentConfig(BaseModel):
    """Complete agent configuration structure"""
    global_config: Optional[AgentConfig] = None
    weights: Optional[AgentWeights] = None
    agent_specific: Optional[AgentSpecificConfig] = None
    enabled_agents: Optional[List[str]] = None

class RunRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int
    agent_config: Optional[FullAgentConfig] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class AgentChatRequest(BaseModel):
    agent_name: str
    message: str
    chat_history: Optional[List[ChatMessage]] = Field(default_factory=list)

@app.get("/health")
async def health_check():
    """Optimized health check endpoint for Render reliability."""
    import gc
    
    # Try to import psutil, fallback gracefully if not available
    try:
        import psutil
        psutil_available = True
    except ImportError:
        psutil_available = False
    
    try:
        # Get memory usage for monitoring (if psutil available)
        if psutil_available:
            memory_info = psutil.virtual_memory()
            memory_usage_mb = psutil.Process().memory_info().rss / 1024 / 1024
            memory_percent = round(memory_info.percent, 2)
        else:
            memory_usage_mb = 0.0
            memory_percent = 0.0
        
        # Quick environment check (no file system operations)
        env_status = {
            "financial_api": bool(os.getenv("FINANCIAL_DATASETS_API_KEY")),
            "anthropic_api": bool(os.getenv("ANTHROPIC_API_KEY")),
            "openai_api": bool(os.getenv("OPENAI_API_KEY"))
        }
        
        # Quick startup check - if server just started, be more lenient
        uptime_seconds = time.time() - startup_time
        is_starting_up = uptime_seconds < 30  # First 30 seconds after startup
        
        # Lightweight dependency check (already imported)
        dependencies = {
            "main_script": True,  # If we're running, main script exists
            "pandas": True  # Already imported at startup
        }
        
        # Quick database status (no expensive queries)
        database_status = {"available": False}
        if db_manager:
            try:
                # During startup, use shorter timeout for database checks
                timeout_duration = 2.0 if is_starting_up else 5.0
                
                # Quick agent count check (efficient query)
                agent_count = await asyncio.wait_for(
                    db_manager.get_agent_count(), 
                    timeout=timeout_duration
                )
                database_status = {
                    "available": True,
                    "connected": True,
                    "agent_count": agent_count,
                    "startup_mode": is_starting_up
                }
            except asyncio.TimeoutError:
                database_status = {
                    "available": True,
                    "connected": False,
                    "error": "Database timeout during startup" if is_starting_up else "Database timeout",
                    "startup_mode": is_starting_up
                }
            except Exception as e:
                database_status = {
                    "available": True,
                    "connected": False,
                    "error": str(e)[:100],  # Truncate long errors
                    "startup_mode": is_starting_up
                }
        
        # Overall health status
        all_critical_healthy = (
            env_status["financial_api"] and
            (env_status["anthropic_api"] or env_status["openai_api"])
        )
        
        # Force garbage collection to prevent memory buildup
        gc.collect()
        
        return {
            "status": "healthy" if all_critical_healthy else "degraded",
            "timestamp": time.time(),
            "uptime_seconds": time.time() - startup_time,
            "memory_usage_mb": round(memory_usage_mb, 2),
            "memory_percent": memory_percent,
            "psutil_available": psutil_available,
            "environment": env_status,
            "dependencies": dependencies,
            "database": database_status,
            "version": "1.0.0"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": time.time()
        }

# Import the new aggregation system services
try:
    from backend.services.aggregation_service import AggregationService
    from backend.services.verdict_service import VerdictService
    from backend.services.analytics_service import AnalyticsService
    AGGREGATION_AVAILABLE = True
except ImportError as e:
    print(f"  Aggregation services not available: {e}")
    AGGREGATION_AVAILABLE = False

# Agent Aggregation System API endpoints
@app.post("/api/aggregate-results")
async def aggregate_agent_results(tickers: List[str], period_type: str = "monthly"):
    """
    Aggregate agent outputs for specified stocks over a time period.
    
    Args:
        tickers: List of stock tickers to aggregate
        period_type: "monthly" or "quarterly"
    
    Returns:
        Aggregation results with consolidated agent outputs
    """
    if not AGGREGATION_AVAILABLE:
        return {"error": "Aggregation services not available"}
    
    try:
        aggregation_service = AggregationService(db_manager)
        results = await aggregation_service.aggregate_period_results(
            tickers=tickers,
            period_type=period_type
        )
        return {"status": "success", "data": results}
    except Exception as e:
        return {"error": f"Aggregation failed: {str(e)}"}

@app.post("/api/generate-verdict")
async def generate_portfolio_verdict(period_id: str, custom_criteria: Optional[Dict] = None):
    """
    Generate portfolio manager verdict for a specific aggregation period.
    
    Args:
        period_id: ID of the aggregation period
        custom_criteria: Optional custom verdict criteria
    
    Returns:
        Portfolio manager verdict with recommendations
    """
    if not AGGREGATION_AVAILABLE:
        return {"error": "Verdict services not available"}
    
    try:
        verdict_service = VerdictService(db_manager)
        verdict = await verdict_service.generate_verdict(
            period_id=period_id,
            custom_criteria=custom_criteria
        )
        return {"status": "success", "verdict": verdict}
    except Exception as e:
        return {"error": f"Verdict generation failed: {str(e)}"}

@app.get("/api/top-stocks")
async def get_top_stocks(period_type: str = "monthly", limit: int = 10, criteria: str = "overall_score"):
    """
    Get top-ranked stocks based on aggregated agent analysis.
    
    Args:
        period_type: "monthly" or "quarterly"
        limit: Number of top stocks to return
        criteria: Ranking criteria ("overall_score", "consensus", "confidence")
    
    Returns:
        Top stocks with rankings and scores
    """
    if not AGGREGATION_AVAILABLE:
        return {"error": "Analytics services not available"}
    
    try:
        analytics_service = AnalyticsService(db_manager)
        top_stocks = await analytics_service.get_top_stocks(
            period_type=period_type,
            limit=limit,
            criteria=criteria
        )
        return {"status": "success", "data": top_stocks}
    except Exception as e:
        return {"error": f"Top stocks analysis failed: {str(e)}"}

@app.get("/api/system-recommendations")
async def get_system_recommendations(period_type: str = "monthly", limit: int = 5):
    """
    Get system-wide investment recommendations based on aggregated analysis.
    
    Args:
        period_type: "monthly" or "quarterly"
        limit: Number of recommendations to return
    
    Returns:
        System recommendations with detailed rationale
    """
    if not AGGREGATION_AVAILABLE:
        return {"error": "Analytics services not available"}
    
    try:
        analytics_service = AnalyticsService(db_manager)
        recommendations = await analytics_service.get_system_recommendations(
            period_type=period_type,
            limit=limit
        )
        return {"status": "success", "recommendations": recommendations}
    except Exception as e:
        return {"error": f"System recommendations failed: {str(e)}"}

@app.get("/api/aggregation-periods")
async def get_aggregation_periods(period_type: str = "monthly", limit: int = 12):
    """
    Get available aggregation periods with summary statistics.
    
    Args:
        period_type: "monthly" or "quarterly"
        limit: Number of periods to return
    
    Returns:
        Available periods with summary data
    """
    if not AGGREGATION_AVAILABLE:
        return {"error": "Analytics services not available"}
    
    try:
        analytics_service = AnalyticsService(db_manager)
        periods = await analytics_service.get_aggregation_periods(
            period_type=period_type,
            limit=limit
        )
        return {"status": "success", "periods": periods}
    except Exception as e:
        return {"error": f"Periods retrieval failed: {str(e)}"}

@app.get("/api/agent-consensus")
async def get_agent_consensus(ticker: str, period_type: str = "monthly", periods: int = 6):
    """
    Get agent consensus analysis for a specific stock over multiple periods.
    
    Args:
        ticker: Stock ticker symbol
        period_type: "monthly" or "quarterly"
        periods: Number of periods to analyze
    
    Returns:
        Consensus analysis with trends and agreement levels
    """
    if not AGGREGATION_AVAILABLE:
        return {"error": "Analytics services not available"}
    
    try:
        analytics_service = AnalyticsService(db_manager)
        consensus = await analytics_service.get_agent_consensus(
            ticker=ticker,
            period_type=period_type,
            periods=periods
        )
        return {"status": "success", "consensus": consensus}
    except Exception as e:
        return {"error": f"Consensus analysis failed: {str(e)}"}

# Database API endpoints for retrieving stored analysis data
@app.get("/api/analytics/performance")
async def get_agent_performance(days: int = 30, agent_name: Optional[str] = None, ticker: Optional[str] = None):
    """Get agent performance analytics over the specified time period"""
    if not db_manager:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        performance_data = await db_manager.get_agent_performance_summary(
            days=days, 
            agent_name=agent_name, 
            ticker=ticker
        )
        return {
            "status": "success",
            "data": performance_data,
            "metadata": {
                "days": days,
                "agent_filter": agent_name,
                "ticker_filter": ticker
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrieve performance data: {str(e)}"
        }

@app.get("/api/analytics/predictions")
async def get_recent_predictions(limit: int = 100, agent_name: Optional[str] = None, ticker: Optional[str] = None):
    """Get recent agent predictions with optional filtering"""
    if not db_manager:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        predictions = await db_manager.get_recent_predictions(
            limit=limit,
            agent_name=agent_name,
            ticker=ticker
        )
        return {
            "status": "success",
            "data": predictions,
            "metadata": {
                "limit": limit,
                "agent_filter": agent_name,
                "ticker_filter": ticker,
                "count": len(predictions)
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrieve predictions: {str(e)}"
        }

@app.get("/api/analytics/consensus/{ticker}")
async def get_consensus_analysis(ticker: str, days: int = 7):
    """Get consensus analysis for a specific ticker over recent days"""
    if not db_manager:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        consensus_data = await db_manager.get_consensus_analysis(ticker=ticker, days=days)
        return {
            "status": "success",
            "data": consensus_data,
            "metadata": {
                "ticker": ticker,
                "days": days
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrieve consensus analysis: {str(e)}"
        }

@app.get("/api/analytics/trends")
async def get_market_trends(days: int = 30):
    """Get market trends and patterns from stored agent data"""
    if not db_manager:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        trends_data = await db_manager.get_market_trends(days=days)
        return {
            "status": "success",
            "data": trends_data,
            "metadata": {
                "days": days
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrieve market trends: {str(e)}"
        }

@app.post("/api/analytics/outcome")
async def record_prediction_outcome(prediction_id: int, actual_outcome: str, actual_price_change: Optional[float] = None):
    """Record the actual outcome of a prediction for performance tracking"""
    if not db_manager:
        return {
            "status": "error",
            "message": "Database not available"
        }
    
    try:
        outcome_data = {
            'prediction_id': prediction_id,
            'actual_outcome': actual_outcome,
            'actual_price_change': actual_price_change,
            'outcome_timestamp': datetime.now()
        }
        
        await db_manager.record_prediction_outcome(outcome_data)
        return {
            "status": "success",
            "message": "Prediction outcome recorded successfully",
            "data": {
                "prediction_id": prediction_id,
                "outcome": actual_outcome
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to record outcome: {str(e)}"
        }

@app.post("/api/run")
async def run_simulation(req: RunRequest):
    try:
        # Validate inputs
        if not req.tickers:
            raise ValueError("At least one ticker must be provided")
        
        # Get the absolute path to main.py
        current_dir = Path(__file__).parent
        main_py_path = current_dir.parent / "src" / "main.py"
        
        if not main_py_path.exists():
            raise FileNotFoundError(f"main.py not found at {main_py_path}")
        
        # Hybrid approach: Try Poetry first, fallback to direct Python
        # This ensures compatibility with both local development and Render deployment
        
        # Prepare environment with comprehensive Python path
        env = os.environ.copy()
        env['PYTHONPATH'] = str(current_dir.parent)
        
        # Check if we're in a Poetry environment or Render deployment
        is_render_deployment = os.getenv('RENDER') == 'true' or os.getenv('ENVIRONMENT') == 'production'
        poetry_available = False
        
        if not is_render_deployment:
            # Check if Poetry is available for local development
            try:
                poetry_check = subprocess.run(['poetry', '--version'], capture_output=True, timeout=5)
                poetry_available = poetry_check.returncode == 0
            except (subprocess.TimeoutExpired, FileNotFoundError):
                poetry_available = False
        
        if poetry_available and not is_render_deployment:
            # Use Poetry for local development
            cmd = [
                "poetry", "run", "python", str(main_py_path),
                "--tickers", req.tickers,
                "--start-date", req.start_date,
                "--end-date", req.end_date,
                "--initial-cash", str(req.initial_cash),
                "--show-reasoning",
                "--no-interactive"
            ]
            print(f"🐍 Using Poetry environment for subprocess execution")
        else:
            # Use direct Python for Render deployment or when Poetry is not available
            python_executable = sys.executable or "python3"
            cmd = [
                python_executable, str(main_py_path),
                "--tickers", req.tickers,
                "--start-date", req.start_date,
                "--end-date", req.end_date,
                "--initial-cash", str(req.initial_cash),
                "--show-reasoning",
                "--no-interactive"
            ]
            print(f"🐍 Using direct Python execution (Render deployment or Poetry unavailable)")
            print(f"🔧 Python executable: {python_executable}")
        
        print(f"🚀 Starting simulation with command: {' '.join(cmd)}")
        print(f"📁 Working directory: {current_dir.parent}")
        print(f"🌍 Environment: {'Render' if is_render_deployment else 'Local'}")
        
        # Run the simulation with timeout and proper error handling
        try:
            print(f"🔍 Debug: Environment variables set:")
            print(f"   PYTHONPATH: {env.get('PYTHONPATH', 'Not set')}")
            print(f"   ENVIRONMENT: {env.get('ENVIRONMENT', 'Not set')}")
            print(f"   RENDER: {env.get('RENDER', 'Not set')}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes timeout
                cwd=current_dir.parent,
                env=env  # Use enhanced environment
            )
            
            if result.returncode != 0:
                error_msg = f"Simulation failed with return code {result.returncode}"
                if result.stderr:
                    error_msg += f". Error: {result.stderr[:500]}"
                
                return {
                    "status": "error",
                    "message": error_msg,
                    "details": {
                        "stdout": result.stdout[-1000:] if result.stdout else "",
                        "stderr": result.stderr[-1000:] if result.stderr else "",
                        "return_code": result.returncode
                    }
                }
            
            # Parse the output
            output = result.stdout
            if not output.strip():
                return {
                    "status": "error",
                    "message": "No output received from simulation",
                    "details": {"stderr": result.stderr[-500:] if result.stderr else ""}
                }
            
            print(f"✅ Simulation completed successfully. Output length: {len(output)} chars")
            
            # Parse agent debug logs with more flexible patterns
            # Try multiple patterns to match different output formats
            agent_pattern_1 = r'🔍 LLM DEBUG - Agent: ([\w_]+), Attempt: \d+[\s\S]*?📄 Raw Result: signal=\'([^\']*)\' confidence=([\d.]+) reasoning=(["\'][\s\S]*?)(?=🔍|✅|$)'
            agent_pattern_2 = r'Agent: ([\w_]+)[\s\S]*?Signal: ([\w]+)[\s\S]*?Confidence: ([\d.]+)[\s\S]*?Reasoning: ([\s\S]*?)(?=Agent:|$)'
            agent_pattern_3 = r'([\w_]+_agent)[\s\S]*?signal["\']?\s*[:=]\s*["\']?([\w]+)["\']?[\s\S]*?confidence["\']?\s*[:=]\s*([\d.]+)[\s\S]*?reasoning["\']?\s*[:=]\s*["\']([\s\S]*?)["\']?(?=\w+_agent|$)'
            
            agent_matches = []
            agent_matches.extend(re.findall(agent_pattern_1, output))
            agent_matches.extend(re.findall(agent_pattern_2, output))
            agent_matches.extend(re.findall(agent_pattern_3, output))
            
            agents = {}
            tickers = req.tickers.split(',') if ',' in req.tickers else [req.tickers]
            
            print(f"🔍 FLOW: Found {len(agent_matches)} agent matches using flexible patterns")
            
            for agent_name, signal, confidence, reasoning in agent_matches:
                # Convert agent_name from snake_case to display name
                display_name = agent_name.replace('_', ' ').title().replace(' Agent', ' Agent')
                
                # Clean up reasoning text - remove quotes and escape characters
                reasoning_text = reasoning.strip('"\'')
                if reasoning_text.startswith('"') and reasoning_text.endswith('"'):
                    reasoning_text = reasoning_text[1:-1]
                
                # Create agent data structure for each ticker
                agent_data = {}
                for ticker in tickers:
                    agent_data[ticker] = {
                        "signal": signal,
                        "confidence": float(confidence),
                        "reasoning": reasoning_text
                    }
                
                agents[display_name] = agent_data

            print(f"🔍 FLOW: About to parse portfolio decisions...")
            
            # Parse portfolio manager decisions with multiple patterns
            portfolio_patterns = [
                r'🔍 LLM DEBUG - Agent: portfolio_management_agent[\s\S]*?📄 Raw Result: decisions=\{([\s\S]*?)\}[\s\S]*?(?=🔍|✅|$)',
                r'portfolio_management_agent[\s\S]*?decisions[\s\S]*?\{([\s\S]*?)\}',
                r'Portfolio Manager[\s\S]*?decisions[\s\S]*?\{([\s\S]*?)\}'
            ]
            
            portfolio_match = None
            for pattern in portfolio_patterns:
                portfolio_match = re.search(pattern, output, re.IGNORECASE)
                if portfolio_match:
                    break
            
            decisions = {}
            if portfolio_match:
                print(f"🔍 FLOW: Found portfolio match, parsing decisions...")
                # Parse the portfolio decision data structure
                decision_text = portfolio_match.group(1)
                # Extract ticker decisions - look for 'TICKER': PortfolioDecision(...)
                ticker_patterns = [
                    r"'([A-Z]+)':\s*PortfolioDecision\(action='([^']*)',\s*quantity=([\d]+),\s*confidence=([\d.]+),\s*reasoning=\"([^\"]*)\"",
                    r'([A-Z]+)[\s\S]*?action[\s\S]*?([A-Z]+)[\s\S]*?quantity[\s\S]*?([\d]+)[\s\S]*?confidence[\s\S]*?([\d.]+)',
                    r'([A-Z]+)[\s\S]*?(BUY|SELL|HOLD)'
                ]
                
                ticker_matches = []
                for ticker_pattern in ticker_patterns:
                    ticker_matches.extend(re.findall(ticker_pattern, decision_text))
                    if ticker_matches:
                        break
                
                for match in ticker_matches:
                    if len(match) >= 5:  # Full match with all fields
                        ticker, action, quantity, confidence, reasoning = match[:5]
                        decisions[ticker] = {
                            'action': action.upper(),
                            'quantity': int(quantity),
                            'confidence': float(confidence),
                            'reasoning': reasoning
                        }
                    elif len(match) >= 2:  # Basic match with ticker and action
                        ticker, action = match[:2]
                        decisions[ticker] = {
                            'action': action.upper(),
                            'quantity': 100,  # Default quantity
                            'confidence': 0.7,  # Default confidence
                            'reasoning': 'Parsed from simplified output'
                        }
                
                print(f"🔍 FLOW: Parsed {len(decisions)} portfolio decisions")
            else:
                print(f"🔍 FLOW: No portfolio match found")
                # Create fallback decisions based on agent signals if no portfolio manager found
                if agents:
                    print(f"🔍 FLOW: Creating fallback decisions from {len(agents)} agent signals")
                    for ticker in tickers:
                        # Aggregate agent signals for this ticker
                        buy_signals = sum(1 for agent_data in agents.values() 
                                        if ticker in agent_data and agent_data[ticker]['signal'].upper() in ['BUY', 'BULLISH'])
                        sell_signals = sum(1 for agent_data in agents.values() 
                                         if ticker in agent_data and agent_data[ticker]['signal'].upper() in ['SELL', 'BEARISH'])
                        
                        if buy_signals > sell_signals:
                            action = 'BUY'
                            confidence = min(0.9, 0.5 + (buy_signals / len(agents)) * 0.4)
                        elif sell_signals > buy_signals:
                            action = 'SELL'
                            confidence = min(0.9, 0.5 + (sell_signals / len(agents)) * 0.4)
                        else:
                            action = 'HOLD'
                            confidence = 0.5
                        
                        decisions[ticker] = {
                            'action': action,
                            'quantity': 100,
                            'confidence': round(confidence, 2),
                            'reasoning': f'Aggregated from {len(agents)} agent signals: {buy_signals} buy, {sell_signals} sell'
                        }
                    print(f"🔍 FLOW: Created {len(decisions)} fallback decisions")

            print(f"🔍 FLOW: About to start database storage section...")
            
            # Setup database error logging
            import logging
            db_logger = logging.getLogger('database_errors')
            if not db_logger.handlers:
                handler = logging.FileHandler('/tmp/database_errors.log')
                formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
                handler.setFormatter(formatter)
                db_logger.addHandler(handler)
                db_logger.setLevel(logging.ERROR)
            
            # Store analysis results in database if available
            stored_predictions = []
            print(f"🔍 Database manager status: {db_manager is not None}")
            print(f"🔍 Database manager type: {type(db_manager)}")
            db_logger.info(f"Database manager status: {db_manager is not None}")
            
            if db_manager:
                try:
                    print(f"🔍 Starting database storage for {len(agents)} agents and {len(tickers)} tickers")
                    db_logger.info(f"Starting database storage for {len(agents)} agents and {len(tickers)} tickers")
                    analysis_timestamp = datetime.now()
                    
                    # Store agent predictions
                    for agent_name, agent_data in agents.items():
                        for ticker in tickers:
                            if ticker in agent_data:
                                try:
                                    print(f"🔍 Processing {agent_name}/{ticker}...")
                                    db_logger.info(f"Processing {agent_name}/{ticker}...")
                                    
                                    # Map API data to AgentPrediction model format
                                    prediction = await map_to_agent_prediction(
                                        db_manager, agent_name, ticker, agent_data[ticker], analysis_timestamp
                                    )
                                    print(f"🔍 Mapped prediction object: {type(prediction)}")
                                    db_logger.info(f"Mapped prediction object: {type(prediction)} for {agent_name}/{ticker}")
                                    
                                    # Log prediction details before saving
                                    db_logger.info(f"Prediction details: agent_id={getattr(prediction, 'agent_id', 'None')}, instrument_id={getattr(prediction, 'instrument_id', 'None')}, signal={getattr(prediction, 'signal', 'None')}")
                                    
                                    # Store prediction in database
                                    prediction_id = await db_manager.save_agent_prediction(prediction)
                                    stored_predictions.append({
                                        'prediction_id': prediction_id,
                                        'agent': agent_name,
                                        'ticker': ticker,
                                    })
                                    print(f"✅ Stored prediction for {agent_name}/{ticker}: {prediction_id}")
                                    db_logger.info(f"Successfully stored prediction for {agent_name}/{ticker}: {prediction_id}")
                                    
                                except Exception as e:
                                    error_msg = f"Failed to store prediction for {agent_name}/{ticker}: {e}"
                                    print(f"⚠️  {error_msg}")
                                    db_logger.error(error_msg)
                                    import traceback
                                    full_traceback = traceback.format_exc()
                                    print(f"⚠️  Full traceback: {full_traceback}")
                                    db_logger.error(f"Full traceback for {agent_name}/{ticker}: {full_traceback}")
                                    # Continue with other predictions even if one fails
                    
                    # Store portfolio decisions
                    db_logger.info(f"Starting portfolio decision storage for {len(decisions)} decisions")
                    for ticker, decision in decisions.items():
                        try:
                            print(f"🔍 Processing portfolio decision for {ticker}...")
                            db_logger.info(f"Processing portfolio decision for {ticker}: {decision}")
                            
                            # Create proper decision data structure for mapping
                            decision_data = {
                                'signal': decision['action'].lower(),
                                'confidence': decision['confidence'],
                                'reasoning': {
                                    'action': decision['action'],
                                    'quantity': decision['quantity'],
                                    'reasoning': decision['reasoning']
                                }
                            }
                            
                            # Map portfolio decision to AgentPrediction object
                            # Use fallback agent if Portfolio Manager doesn't exist
                            portfolio_agent_name = 'Portfolio Manager'
                            try:
                                prediction = await map_to_agent_prediction(
                                    db_manager, portfolio_agent_name, ticker, decision_data, analysis_timestamp
                                )
                            except ValueError as e:
                                if "Agent not found" in str(e):
                                    # Fallback: use a generic agent name or create portfolio decisions without agent mapping
                                    print(f"⚠️  Portfolio Manager agent not found, using fallback approach")
                                    # Skip storing portfolio decisions as agent predictions since agent doesn't exist
                                    continue
                                else:
                                    raise
                            db_logger.info(f"Mapped portfolio decision object: {type(prediction)} for {ticker}")
                            
                            # Log prediction details before saving
                            db_logger.info(f"Portfolio prediction details: agent_id={getattr(prediction, 'agent_id', 'None')}, instrument_id={getattr(prediction, 'instrument_id', 'None')}, signal={getattr(prediction, 'signal', 'None')}")
                            
                            # Store prediction in database
                            prediction_id = await db_manager.save_agent_prediction(prediction)
                            stored_predictions.append({
                                'prediction_id': prediction_id,
                                'agent': 'Portfolio Manager',
                                'ticker': ticker,
                                'action': decision['action']
                            })
                            print(f"✅ Stored portfolio decision for {ticker}: {prediction_id}")
                            db_logger.info(f"Successfully stored portfolio decision for {ticker}: {prediction_id}")
                            
                        except Exception as e:
                            error_msg = f"Failed to store portfolio decision for {ticker}: {e}"
                            print(f"⚠️  {error_msg}")
                            db_logger.error(error_msg)
                            import traceback
                            full_traceback = traceback.format_exc()
                            print(f"⚠️  Full traceback: {full_traceback}")
                            db_logger.error(f"Full traceback for portfolio decision {ticker}: {full_traceback}")
                            # Continue with other decisions even if one fails
                    
                    print(f"✅ Stored {len(stored_predictions)} predictions in database")
                    db_logger.info(f"Successfully stored {len(stored_predictions)} predictions in database")
                    
                except Exception as e:
                    error_msg = f"Failed to store analysis results in database: {e}"
                    print(f"⚠️  {error_msg}")
                    db_logger.error(error_msg)
                    import traceback
                    full_traceback = traceback.format_exc()
                    print(f"⚠️  Full database storage traceback: {full_traceback}")
                    db_logger.error(f"Full database storage traceback: {full_traceback}")
                    # Continue without database storage
            else:
                print(f"⚠️  Database manager not available - skipping prediction storage")
                db_logger.warning("Database manager not available - skipping prediction storage")
            
            return {
                "status": "success", 
                "data": {
                    'agents': agents,
                    'decisions': decisions,
                    'raw': output
                },
                "metadata": {
                    "execution_time": "N/A",  # Could add timing
                    "tickers": req.tickers,
                    "date_range": f"{req.start_date} to {req.end_date}",
                    "stored_predictions": len(stored_predictions) if stored_predictions else 0,
                    "database_enabled": db_manager is not None
                }
            }
            
        except subprocess.TimeoutExpired:
            return {
                "status": "error",
                "message": "Simulation timed out after 5 minutes",
                "details": {"timeout": 300}
            }
        
        except subprocess.SubprocessError as e:
            return {
                "status": "error",
                "message": f"Subprocess execution failed: {str(e)}",
                "details": {"subprocess_error": str(e)}
            }
            
    except FileNotFoundError as e:
        return {
            "status": "error",
            "message": "Simulation script not found",
            "details": {"file_error": str(e)}
        }
        
    except ValueError as e:
        print(f"❌ ValueError in simulation: {e}")
        import traceback
        print(f"❌ ValueError traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": f"Invalid input: {str(e)}",
            "details": {"validation_error": str(e)}
        }
        
    except Exception as e:
        print(f"❌ Unexpected error in simulation: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "message": "An unexpected error occurred",
            "details": {
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        }

@app.post("/api/agent-chat")
async def agent_chat(req: AgentChatRequest):
    """
    Process a chat message sent to an AI agent and return a response.
    This simulates the agent's personality and investment strategy.
    """
    # In a production environment, this would call an LLM API or other AI service
    # For now, we'll use a simple rule-based approach to simulate different agent personalities
    
    agent_name = req.agent_name
    message = req.message.lower()
    
    # Simple response generation based on agent personality and message content
    if "stock" in message or "invest" in message:
        responses = {
            "Warren Buffett Agent": "When I look at a stock, I focus on its intrinsic value and competitive advantage. I prefer companies with consistent earnings, low debt, and strong management. Remember, the stock market is a device for transferring money from the impatient to the patient.",
            "Cathie Wood Agent": "I look for disruptive innovation and exponential growth opportunities. Companies leading in areas like AI, genomics, robotics, and blockchain have tremendous potential. The key is to identify technologies that will change the world in the next 5-10 years.",
            "Ben Graham Agent": "I always emphasize margin of safety. Look for stocks trading below their intrinsic value, with strong balance sheets and consistent earnings. Remember, investment is most intelligent when it is most businesslike.",
            "Technical Analyst": "I'd analyze the price patterns, moving averages, and momentum indicators for this stock. The current chart shows key support and resistance levels that could inform your entry and exit points.",
            "Fundamental Analysis Agent": "Let's examine the company's financial statements, particularly the P/E ratio, debt-to-equity ratio, and free cash flow. These metrics will help us determine if the stock is fairly valued."
        }
        response = responses.get(agent_name, "That's an interesting question about stocks. Let me analyze that for you...")
    
    elif "market" in message or "economy" in message:
        responses = {
            "Warren Buffett Agent": "Be fearful when others are greedy, and greedy when others are fearful. Market timing is futile - focus on buying wonderful companies at fair prices instead of trying to predict short-term market movements.",
            "Cathie Wood Agent": "I believe we're in the midst of several innovation platforms that will transform the global economy. Short-term market volatility is noise - the long-term trajectory of innovative technologies is upward.",
            "Ben Graham Agent": "The market is a voting machine in the short run, but a weighing machine in the long run. Focus on the intrinsic value of businesses rather than market sentiment.",
            "Technical Analyst": "Market trends can be identified through various technical indicators. Currently, I'm seeing patterns that suggest momentum in the broader indices.",
            "Fundamental Analysis Agent": "The overall market valuation metrics like the Shiller PE ratio and total market cap to GDP can give us insights into whether the market as a whole is overvalued or undervalued."
        }
        response = responses.get(agent_name, "The market is a complex system influenced by many factors. Here's my analysis...")
    
    else:
        # Default responses
        responses = {
            "Warren Buffett Agent": "I focus on long-term value investing. The best investments are in companies with strong economic moats, consistent earnings, and good management that you can hold for decades.",
            "Cathie Wood Agent": "I'm looking for companies at the forefront of disruptive innovation that will change the way the world works. These high-growth opportunities often come with volatility, but the long-term potential is tremendous.",
            "Ben Graham Agent": "As a value investor, I always look for a margin of safety. The intelligent investor is a realist who sells to optimists and buys from pessimists.",
            "Technical Analyst": "I focus on price patterns and market trends rather than company fundamentals. The charts often reveal information that isn't yet reflected in the fundamentals.",
            "Fundamental Analysis Agent": "I believe in thorough analysis of financial statements and business models. Understanding the numbers behind a company is essential for making informed investment decisions."
        }
        response = responses.get(agent_name, "That's an interesting question. Let me analyze that from my investment perspective...")
    
    return {"response": response}

class BacktestRequest(BaseModel):
    tickers: str
    start_date: str
    end_date: str
    initial_cash: int
    margin_requirement: float = 0.0
    selected_analysts: List[str] = Field(default_factory=list)

@app.post("/api/backtest")
async def run_backtest(req: BacktestRequest):
    try:
        # Import our standalone backtester
        from backend.standalone_backtester import run_standalone_backtest
        
        # Parse ticker list from comma-separated string
        tickers = req.tickers
        
        # Print debugging info
        print(f"\n\nRunning backtest with: {tickers}, {req.start_date} to {req.end_date}")
        
        # Run the standalone backtester with real portfolio simulation
        try:
            print("Running standalone backtest...")
            result = run_standalone_backtest(
                tickers=tickers,
                start_date=req.start_date,
                end_date=req.end_date,
                initial_capital=float(req.initial_cash),
                margin_requirement=float(req.margin_requirement or 0.0)
            )
            print(f"Backtest result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
            print(f"Portfolio values: {len(result.get('portfolio_values', [])) if isinstance(result.get('portfolio_values'), list) else 'Not available'}")
            print(f"Trades: {len(result.get('trades', [])) if isinstance(result.get('trades'), list) else 'Not available'}")
            
            # Return the formatted result
            return result
            
        except Exception as e:
            import traceback
            print(f"Error in standalone backtester: {e}")
            print(traceback.format_exc())
            
            # Fall back to simplified response
            return {
                "error": f"Error running backtest: {str(e)}",
                "portfolio_values": [],
                "performance_metrics": {},
                "trades": [],
                "agent_outputs": {},
                "raw": ""
            }
            
    except Exception as e:
        # Handle any other errors
        import traceback
        print(f"Error in API endpoint: {e}")
        print(traceback.format_exc())
        return {
            "error": f"API error: {str(e)}",
            "portfolio_values": [],
            "performance_metrics": {},
            "trades": [],
            "agent_outputs": {},
            "raw": ""
        }

# Server startup
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", "8000"))
    
    print(f"🚀 Starting AI Hedge Fund Backend on port {port}")
    print(f"📊 Health check: http://localhost:{port}/health")
    print(f"📈 API endpoints available at: http://localhost:{port}/docs")
    
    # Start the server
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Set to True for development
        log_level="info"
    )
