-- AI Hedge Fund Database Schema
-- Self-Improving ML System with Agent Performance Tracking
-- Created: 2025-01-14

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Agents Configuration Table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'fundamentals', 'technical', 'sentiment', 'personality'
    display_name VARCHAR(150) NOT NULL,
    specialty TEXT,
    description TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Instruments Table
CREATE TABLE instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    market VARCHAR(50) NOT NULL, -- 'US', 'NSE', 'BSE'
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PREDICTION & PERFORMANCE TRACKING
-- ============================================================================

-- Agent Predictions Table
CREATE TABLE agent_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    prediction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Core Prediction Data
    signal VARCHAR(20) NOT NULL CHECK (signal IN ('bullish', 'bearish', 'neutral')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning JSONB DEFAULT '{}',
    
    -- Market Context
    market_conditions JSONB DEFAULT '{}',
    financial_metrics JSONB DEFAULT '{}',
    price_data JSONB DEFAULT '{}',
    
    -- Prediction Specifics
    target_price DECIMAL(12,4),
    stop_loss DECIMAL(12,4),
    time_horizon_days INTEGER DEFAULT 30,
    position_size_pct DECIMAL(5,2),
    
    -- Metadata
    model_version VARCHAR(50),
    feature_vector JSONB DEFAULT '{}',
    external_factors JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'evaluated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prediction Outcomes Table
CREATE TABLE prediction_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES agent_predictions(id),
    
    -- Outcome Data
    outcome_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_signal VARCHAR(20) CHECK (actual_signal IN ('bullish', 'bearish', 'neutral')),
    actual_price_change DECIMAL(8,4),
    actual_return DECIMAL(8,4),
    max_favorable_move DECIMAL(8,4),
    max_adverse_move DECIMAL(8,4),
    
    -- Performance Metrics
    is_correct BOOLEAN,
    accuracy_score DECIMAL(5,2),
    return_score DECIMAL(8,4),
    risk_adjusted_return DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    
    -- Timing Analysis
    days_to_target INTEGER,
    early_exit_reason VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AGENT PERFORMANCE METRICS
-- ============================================================================

-- Agent Performance Summary Table
CREATE TABLE agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    instrument_id UUID REFERENCES instruments(id), -- NULL for overall performance
    
    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Core Metrics
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Return Metrics
    total_return DECIMAL(8,4) DEFAULT 0,
    average_return DECIMAL(8,4) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    avg_winning_return DECIMAL(8,4) DEFAULT 0,
    avg_losing_return DECIMAL(8,4) DEFAULT 0,
    
    -- Risk Metrics
    volatility DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    sortino_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Confidence Analysis
    avg_confidence DECIMAL(5,2) DEFAULT 0,
    confidence_accuracy_correlation DECIMAL(5,2) DEFAULT 0,
    
    -- Timing Analysis
    avg_days_to_target DECIMAL(5,2) DEFAULT 0,
    early_exit_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique periods per agent/instrument
    UNIQUE(agent_id, instrument_id, period_start, period_end)
);

-- ============================================================================
-- ML MODEL MANAGEMENT
-- ============================================================================

-- ML Experiments Table
CREATE TABLE ml_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id),
    
    -- Experiment Configuration
    model_type VARCHAR(100) NOT NULL, -- 'LSTM', 'RandomForest', 'XGBoost', 'PPO'
    hyperparameters JSONB DEFAULT '{}',
    feature_config JSONB DEFAULT '{}',
    training_config JSONB DEFAULT '{}',
    
    -- Training Data
    training_start_date DATE NOT NULL,
    training_end_date DATE NOT NULL,
    validation_split DECIMAL(3,2) DEFAULT 0.2,
    
    -- Results
    training_accuracy DECIMAL(5,2),
    validation_accuracy DECIMAL(5,2),
    test_accuracy DECIMAL(5,2),
    model_metrics JSONB DEFAULT '{}',
    
    -- Model Artifacts
    model_path VARCHAR(500),
    model_size_mb DECIMAL(8,2),
    training_time_minutes DECIMAL(8,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'deployed')),
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Model Deployments Table
CREATE TABLE model_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ml_experiments(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    
    -- Deployment Info
    deployment_name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'production',
    
    -- A/B Testing
    traffic_percentage DECIMAL(5,2) DEFAULT 100.00,
    control_model_id UUID REFERENCES model_deployments(id),
    
    -- Performance Monitoring
    live_accuracy DECIMAL(5,2),
    live_return DECIMAL(8,4),
    prediction_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retired_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FEATURE ENGINEERING & DATA PIPELINE
-- ============================================================================

-- Feature Store Table
CREATE TABLE feature_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    feature_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Technical Features
    sma_10 DECIMAL(12,4),
    sma_50 DECIMAL(12,4),
    sma_200 DECIMAL(12,4),
    rsi_14 DECIMAL(8,4),
    macd DECIMAL(8,4),
    bollinger_upper DECIMAL(12,4),
    bollinger_lower DECIMAL(12,4),
    volume_ratio DECIMAL(8,4),
    
    -- Fundamental Features
    pe_ratio DECIMAL(8,4),
    pb_ratio DECIMAL(8,4),
    roe DECIMAL(8,4),
    debt_to_equity DECIMAL(8,4),
    current_ratio DECIMAL(8,4),
    revenue_growth DECIMAL(8,4),
    earnings_growth DECIMAL(8,4),
    
    -- Sentiment Features
    news_sentiment DECIMAL(5,2),
    social_sentiment DECIMAL(5,2),
    insider_activity_score DECIMAL(5,2),
    analyst_rating_avg DECIMAL(3,1),
    
    -- Market Features
    market_beta DECIMAL(8,4),
    correlation_spy DECIMAL(5,2),
    sector_performance DECIMAL(8,4),
    volatility_30d DECIMAL(8,4),
    
    -- Custom Features (JSON for flexibility)
    custom_features JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for instrument/timestamp
    UNIQUE(instrument_id, feature_timestamp)
);

-- ============================================================================
-- SYSTEM MONITORING & HEALTH
-- ============================================================================

-- System Health Table
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR(100) NOT NULL, -- 'api', 'database', 'ml_pipeline', 'data_source'
    health_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Health Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'down')),
    response_time_ms INTEGER,
    error_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Resource Usage
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    
    -- Component-Specific Metrics
    metrics JSONB DEFAULT '{}',
    
    -- Error Details
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Quality Monitoring Table
CREATE TABLE data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Quality Metrics
    total_records BIGINT,
    null_percentage DECIMAL(5,2),
    duplicate_percentage DECIMAL(5,2),
    outlier_percentage DECIMAL(5,2),
    
    -- Freshness
    latest_record_timestamp TIMESTAMP WITH TIME ZONE,
    data_lag_minutes INTEGER,
    
    -- Specific Checks
    quality_score DECIMAL(5,2), -- 0-100
    quality_issues JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Agent Predictions Indexes
CREATE INDEX idx_agent_predictions_agent_time ON agent_predictions(agent_id, prediction_timestamp DESC);
CREATE INDEX idx_agent_predictions_instrument_time ON agent_predictions(instrument_id, prediction_timestamp DESC);
CREATE INDEX idx_agent_predictions_signal ON agent_predictions(signal);
CREATE INDEX idx_agent_predictions_status ON agent_predictions(status);

-- Performance Indexes
CREATE INDEX idx_agent_performance_agent_period ON agent_performance(agent_id, period_end DESC);
CREATE INDEX idx_agent_performance_accuracy ON agent_performance(accuracy_rate DESC);
CREATE INDEX idx_agent_performance_return ON agent_performance(total_return DESC);

-- Feature Store Indexes
CREATE INDEX idx_feature_store_instrument_time ON feature_store(instrument_id, feature_timestamp DESC);
CREATE INDEX idx_feature_store_timestamp ON feature_store(feature_timestamp DESC);

-- System Health Indexes
CREATE INDEX idx_system_health_component_time ON system_health(component, health_timestamp DESC);
CREATE INDEX idx_system_health_status ON system_health(status);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for agents table
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate agent performance metrics
CREATE OR REPLACE FUNCTION calculate_agent_performance(
    p_agent_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_instrument_id UUID DEFAULT NULL
)
RETURNS TABLE(
    accuracy_rate DECIMAL(5,2),
    total_return DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    win_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH prediction_stats AS (
        SELECT 
            ap.id,
            ap.signal,
            ap.confidence,
            po.is_correct,
            po.return_score,
            po.risk_adjusted_return
        FROM agent_predictions ap
        LEFT JOIN prediction_outcomes po ON ap.id = po.prediction_id
        WHERE ap.agent_id = p_agent_id
          AND ap.prediction_timestamp::date BETWEEN p_start_date AND p_end_date
          AND (p_instrument_id IS NULL OR ap.instrument_id = p_instrument_id)
          AND po.id IS NOT NULL
    )
    SELECT 
        ROUND(AVG(CASE WHEN ps.is_correct THEN 100.0 ELSE 0.0 END), 2) as accuracy_rate,
        ROUND(AVG(ps.return_score), 4) as total_return,
        ROUND(
            CASE 
                WHEN STDDEV(ps.return_score) > 0 
                THEN AVG(ps.return_score) / STDDEV(ps.return_score)
                ELSE 0 
            END, 4
        ) as sharpe_ratio,
        ROUND(AVG(CASE WHEN ps.return_score > 0 THEN 100.0 ELSE 0.0 END), 2) as win_rate
    FROM prediction_stats ps;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default agents
INSERT INTO agents (name, type, display_name, specialty, description) VALUES
('fundamentals_agent', 'fundamentals', 'Fundamental Analysis Agent', 'Financial Statement Analysis', 'Analyzes company fundamentals, ratios, and financial health'),
('technical_analyst_agent', 'technical', 'Technical Analysis Agent', 'Price Pattern Recognition', 'Identifies technical patterns, trends, and momentum indicators'),
('sentiment_agent', 'sentiment', 'Market Sentiment Agent', 'News & Social Analysis', 'Processes news sentiment and market psychology indicators'),
('warren_buffett_agent', 'personality', 'Warren Buffett Agent', 'Value Investing', 'Focuses on undervalued companies with strong moats and management'),
('bill_ackman_agent', 'personality', 'Bill Ackman Agent', 'Activist Investing', 'Identifies undervalued companies with catalyst potential'),
('cathie_wood_agent', 'personality', 'Cathie Wood Agent', 'Innovation Investing', 'Focuses on disruptive technology and innovation themes'),
('stanley_druckenmiller_agent', 'personality', 'Stanley Druckenmiller Agent', 'Macro Trading', 'Top-down macro analysis with concentrated positions'),
('charlie_munger_agent', 'personality', 'Charlie Munger Agent', 'Mental Models', 'Applies multidisciplinary thinking and mental models'),
('phil_fisher_agent', 'personality', 'Phil Fisher Agent', 'Growth Investing', 'Identifies companies with superior growth potential'),
('ben_graham_agent', 'personality', 'Ben Graham Agent', 'Deep Value', 'Classic value investing with margin of safety focus'),
('aswath_damodaran_agent', 'personality', 'Aswath Damodaran Agent', 'Valuation Expert', 'Dean of Valuation with disciplined story and numbers approach'),
('michael_burry_agent', 'personality', 'Michael Burry Agent', 'Contrarian Value', 'Big Short contrarian hunting for deep value opportunities'),
('peter_lynch_agent', 'personality', 'Peter Lynch Agent', 'Ten-Bagger Hunter', 'Practical investor seeking growth in everyday businesses'),
('rakesh_jhunjhunwala_agent', 'personality', 'Rakesh Jhunjhunwala Agent', 'The Big Bull of India', 'Indian market specialist with growth and momentum focus'),
('portfolio_manager_agent', 'portfolio', 'Portfolio Manager Agent', 'Risk Management', 'Manages overall portfolio allocation and risk'),
('risk_manager_agent', 'risk', 'Risk Management Agent', 'Risk Assessment', 'Monitors and manages portfolio risk exposure'),
('valuation_agent', 'valuation', 'Valuation Agent', 'Intrinsic Value', 'Calculates intrinsic value using multiple valuation models');

-- Insert sample instruments
INSERT INTO instruments (ticker, name, market, currency, sector) VALUES
('AAPL', 'Apple Inc.', 'US', 'USD', 'Technology'),
('MSFT', 'Microsoft Corporation', 'US', 'USD', 'Technology'),
('GOOGL', 'Alphabet Inc.', 'US', 'USD', 'Technology'),
('TSLA', 'Tesla Inc.', 'US', 'USD', 'Consumer Discretionary'),
('RELIANCE.NS', 'Reliance Industries Ltd.', 'NSE', 'INR', 'Energy'),
('TCS.NS', 'Tata Consultancy Services Ltd.', 'NSE', 'INR', 'Technology'),
('INFY.NS', 'Infosys Ltd.', 'NSE', 'INR', 'Technology'),
('HDFCBANK.NS', 'HDFC Bank Ltd.', 'NSE', 'INR', 'Financial Services');

-- Create initial system health record
INSERT INTO system_health (component, status, metrics) VALUES
('database', 'healthy', '{"version": "1.0", "tables_created": true}');

COMMIT;
