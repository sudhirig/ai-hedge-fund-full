#!/usr/bin/env python3
"""
AI Hedge Fund Database Initialization Script
Sets up the database schema for the AI Hedge Fund platform using Neon PostgreSQL
"""

import os
import sys
import asyncio
import asyncpg
from datetime import datetime
from dotenv import load_dotenv

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv()

# Database schema SQL
DATABASE_SCHEMA = """
-- ============================================================================
-- AI HEDGE FUND DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table - stores information about AI agents
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    agent_type VARCHAR(50) NOT NULL, -- 'fundamentals', 'technical', 'sentiment', etc.
    specialization TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instruments table - stores information about financial instruments (stocks, etc.)
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    market VARCHAR(50) DEFAULT 'US', -- 'US', 'NSE', 'BSE', etc.
    currency VARCHAR(10) DEFAULT 'USD',
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent predictions table - stores predictions made by agents
CREATE TABLE IF NOT EXISTS agent_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    signal VARCHAR(20) NOT NULL CHECK (signal IN ('bullish', 'bearish', 'neutral')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning JSONB NOT NULL,
    market_conditions JSONB DEFAULT '{}',
    financial_metrics JSONB DEFAULT '{}',
    price_data JSONB DEFAULT '{}',
    target_price DECIMAL(15,4),
    stop_loss DECIMAL(15,4),
    time_horizon_days INTEGER DEFAULT 30,
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prediction outcomes table - stores actual outcomes of predictions
CREATE TABLE IF NOT EXISTS prediction_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES agent_predictions(id) ON DELETE CASCADE,
    actual_signal VARCHAR(20) CHECK (actual_signal IN ('bullish', 'bearish', 'neutral')),
    actual_price_change DECIMAL(10,4),
    actual_return DECIMAL(10,4),
    max_favorable_move DECIMAL(10,4),
    max_adverse_move DECIMAL(10,4),
    is_correct BOOLEAN,
    accuracy_score DECIMAL(5,2),
    return_score DECIMAL(10,4),
    risk_adjusted_return DECIMAL(10,4),
    sharpe_ratio DECIMAL(10,4),
    days_to_target INTEGER,
    early_exit_reason TEXT,
    outcome_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent performance table - aggregated performance metrics
CREATE TABLE IF NOT EXISTS agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    instrument_id UUID REFERENCES instruments(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0,
    avg_confidence DECIMAL(5,2) DEFAULT 0,
    total_return DECIMAL(10,4) DEFAULT 0,
    avg_return DECIMAL(10,4) DEFAULT 0,
    sharpe_ratio DECIMAL(10,4) DEFAULT 0,
    max_drawdown DECIMAL(10,4) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    profit_factor DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feature store table - stores engineered features for ML models
CREATE TABLE IF NOT EXISTS feature_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL, -- 'technical', 'fundamental', 'sentiment', etc.
    features JSONB NOT NULL,
    feature_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model experiments table - tracks ML model experiments
CREATE TABLE IF NOT EXISTS model_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_name VARCHAR(200) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    hyperparameters JSONB NOT NULL,
    training_data_info JSONB NOT NULL,
    performance_metrics JSONB NOT NULL,
    model_path TEXT,
    is_deployed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System health table - monitors system status
CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'healthy', 'warning', 'error'
    metrics JSONB DEFAULT '{}',
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Agent predictions indexes
CREATE INDEX IF NOT EXISTS idx_agent_predictions_agent_id ON agent_predictions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_predictions_instrument_id ON agent_predictions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_agent_predictions_date ON agent_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_agent_predictions_signal ON agent_predictions(signal);

-- Prediction outcomes indexes
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_prediction_id ON prediction_outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_date ON prediction_outcomes(outcome_date);

-- Agent performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_period ON agent_performance(period_start, period_end);

-- Feature store indexes
CREATE INDEX IF NOT EXISTS idx_feature_store_instrument_id ON feature_store(instrument_id);
CREATE INDEX IF NOT EXISTS idx_feature_store_type ON feature_store(feature_type);
CREATE INDEX IF NOT EXISTS idx_feature_store_timestamp ON feature_store(feature_timestamp);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_component ON system_health(component);
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert all 17 AI agents
INSERT INTO agents (name, display_name, description, agent_type, specialization) VALUES
    ('fundamentals_agent', 'Fundamental Analysis Agent', 'Analyzes company fundamentals, financial ratios, and business metrics', 'fundamentals', 'Financial statement analysis, ratio analysis, business model evaluation'),
    ('technical_analyst_agent', 'Technical Analysis Agent', 'Performs technical analysis using price action, indicators, and chart patterns', 'technical', 'Chart patterns, technical indicators, price action analysis'),
    ('sentiment_agent', 'Sentiment Analysis Agent', 'Analyzes market sentiment, news, and social media sentiment', 'sentiment', 'News analysis, social sentiment, market psychology'),
    ('warren_buffett_agent', 'Warren Buffett Agent', 'Applies Warren Buffett''s value investing principles', 'expert', 'Value investing, long-term perspective, quality businesses'),
    ('bill_ackman_agent', 'Bill Ackman Agent', 'Follows Bill Ackman''s activist investing and deep research approach', 'expert', 'Activist investing, deep fundamental research, catalyst identification'),
    ('cathie_wood_agent', 'Cathie Wood Agent', 'Focuses on disruptive innovation and growth investing', 'expert', 'Innovation investing, growth stocks, disruptive technologies'),
    ('ben_graham_agent', 'Ben Graham Agent', 'Applies Benjamin Graham''s value investing methodology', 'expert', 'Deep value investing, margin of safety, contrarian approach'),
    ('charlie_munger_agent', 'Charlie Munger Agent', 'Uses Charlie Munger''s multidisciplinary thinking approach', 'expert', 'Multidisciplinary analysis, quality assessment, mental models'),
    ('phil_fisher_agent', 'Phil Fisher Agent', 'Applies Phil Fisher''s growth investing principles', 'expert', 'Growth investing, scuttlebutt method, quality growth companies'),
    ('stanley_druckenmiller_agent', 'Stanley Druckenmiller Agent', 'Uses macro-economic analysis and risk management', 'expert', 'Macro analysis, risk management, market timing'),
    ('portfolio_manager_agent', 'Portfolio Manager Agent', 'Makes final portfolio allocation and trading decisions', 'manager', 'Portfolio optimization, risk management, position sizing'),
    ('risk_manager_agent', 'Risk Management Agent', 'Manages portfolio risk and downside protection', 'risk', 'Risk assessment, downside protection, position sizing'),
    ('valuation_agent', 'Valuation Analysis Agent', 'Performs detailed company valuation using multiple methods', 'valuation', 'DCF modeling, relative valuation, asset-based valuation'),
    ('aswath_damodaran_agent', 'Aswath Damodaran Agent', 'Dean of Valuation at NYU Stern, focuses on disciplined valuation and corporate finance', 'expert', 'Valuation theory, corporate finance, story and numbers approach'),
    ('michael_burry_agent', 'Michael Burry Agent', 'The Big Short contrarian investor who hunts for deep value opportunities', 'expert', 'Contrarian investing, deep value analysis, market inefficiency identification'),
    ('peter_lynch_agent', 'Peter Lynch Agent', 'Legendary Fidelity manager who seeks ten-baggers in everyday businesses', 'expert', 'Growth at reasonable price, consumer insight, ten-bagger identification'),
    ('rakesh_jhunjhunwala_agent', 'Rakesh Jhunjhunwala Agent', 'The Big Bull of India, master of Indian equity markets', 'expert', 'Indian market expertise, long-term value creation, emerging market dynamics')
ON CONFLICT (name) DO NOTHING;

-- Insert sample instruments (major US stocks)
INSERT INTO instruments (ticker, name, market, currency, sector) VALUES
    ('AAPL', 'Apple Inc.', 'US', 'USD', 'Technology'),
    ('MSFT', 'Microsoft Corporation', 'US', 'USD', 'Technology'),
    ('GOOGL', 'Alphabet Inc.', 'US', 'USD', 'Technology'),
    ('AMZN', 'Amazon.com Inc.', 'US', 'USD', 'Consumer Discretionary'),
    ('TSLA', 'Tesla Inc.', 'US', 'USD', 'Consumer Discretionary'),
    ('NVDA', 'NVIDIA Corporation', 'US', 'USD', 'Technology'),
    ('META', 'Meta Platforms Inc.', 'US', 'USD', 'Technology'),
    ('NFLX', 'Netflix Inc.', 'US', 'USD', 'Communication Services'),
    ('ADBE', 'Adobe Inc.', 'US', 'USD', 'Technology'),
    ('CRM', 'Salesforce Inc.', 'US', 'USD', 'Technology')
ON CONFLICT (ticker) DO NOTHING;

"""

async def initialize_database():
    """Initialize the AI Hedge Fund database schema"""
    
    try:
        # Get database connection string
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not found")
        
        print(f"🔌 Connecting to Neon PostgreSQL database...")
        
        # Connect to database
        conn = await asyncpg.connect(database_url)
        
        print(f"✅ Connected successfully to database")
        print(f"📋 Initializing database schema...")
        
        # Execute schema creation
        await conn.execute(DATABASE_SCHEMA)
        
        print(f"✅ Database schema initialized successfully")
        
        # Test the setup by counting agents
        agent_count = await conn.fetchval("SELECT COUNT(*) FROM agents")
        instrument_count = await conn.fetchval("SELECT COUNT(*) FROM instruments")
        
        print(f"📊 Database initialization complete:")
        print(f"   - {agent_count} AI agents registered")
        print(f"   - {instrument_count} instruments available")
        print(f"   - All tables and indexes created")
        
        # Close connection
        await conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

async def test_connection():
    """Test database connection and basic operations"""
    
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not found")
        
        print(f"🧪 Testing database connection...")
        
        conn = await asyncpg.connect(database_url)
        
        # Test basic query
        result = await conn.fetchrow("SELECT version() as db_version")
        print(f"✅ Database connection successful")
        print(f"📋 PostgreSQL version: {result['db_version'][:50]}...")
        
        # Test our tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        print(f"📊 Available tables:")
        for table in tables:
            print(f"   - {table['table_name']}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 AI HEDGE FUND DATABASE SETUP")
    print("=" * 60)
    
    # Initialize database
    success = asyncio.run(initialize_database())
    
    if success:
        print("\n" + "=" * 60)
        print("🧪 TESTING DATABASE CONNECTION")
        print("=" * 60)
        
        # Test connection
        asyncio.run(test_connection())
        
        print("\n" + "=" * 60)
        print("✅ DATABASE SETUP COMPLETE!")
        print("=" * 60)
        print("Your AI Hedge Fund database is ready for use.")
        print("You can now start the backend and begin storing agent analysis data.")
    else:
        print("\n" + "=" * 60)
        print("❌ DATABASE SETUP FAILED!")
        print("=" * 60)
        print("Please check the error messages above and try again.")
