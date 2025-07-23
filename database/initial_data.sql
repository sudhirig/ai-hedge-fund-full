-- Initial data for AI Hedge Fund Database
-- This file provides sample data and useful setup queries

-- Insert sample agent configurations (optional)
INSERT INTO agent_configurations (agent_name, config_data, created_at) VALUES
('Warren Buffett Agent', '{"risk_tolerance": "conservative", "investment_horizon": "long_term", "focus_sectors": ["consumer", "finance"]}', NOW()),
('Technical Analysis Agent', '{"indicators": ["RSI", "MACD", "SMA"], "timeframes": ["1d", "1w"], "signal_threshold": 0.7}', NOW()),
('Sentiment Analysis Agent', '{"news_sources": ["financial_news", "social_media"], "sentiment_weight": 0.6, "volume_threshold": 1000}', NOW());

-- Insert sample market metrics for common stocks
INSERT INTO market_metrics (ticker, metric_name, metric_value, metric_timestamp) VALUES
('AAPL', 'market_cap', 3000000000000, NOW() - INTERVAL '1 day'),
('AAPL', 'pe_ratio', 28.5, NOW() - INTERVAL '1 day'),
('AAPL', 'price', 175.50, NOW() - INTERVAL '1 day'),
('MSFT', 'market_cap', 2800000000000, NOW() - INTERVAL '1 day'),
('MSFT', 'pe_ratio', 35.2, NOW() - INTERVAL '1 day'),
('MSFT', 'price', 378.25, NOW() - INTERVAL '1 day'),
('GOOGL', 'market_cap', 1700000000000, NOW() - INTERVAL '1 day'),
('GOOGL', 'pe_ratio', 22.8, NOW() - INTERVAL '1 day'),
('GOOGL', 'price', 135.75, NOW() - INTERVAL '1 day');

-- Create views for common queries
CREATE OR REPLACE VIEW recent_predictions_summary AS
SELECT 
    ap.agent_name,
    ap.ticker,
    ap.signal,
    ap.confidence,
    ap.prediction_timestamp,
    po.actual_outcome,
    po.outcome_timestamp,
    CASE 
        WHEN po.actual_outcome IS NOT NULL THEN
            CASE 
                WHEN ap.signal = po.actual_outcome THEN 'correct'
                ELSE 'incorrect'
            END
        ELSE 'pending'
    END as prediction_status
FROM agent_predictions ap
LEFT JOIN prediction_outcomes po ON ap.prediction_id = po.prediction_id
WHERE ap.prediction_timestamp >= NOW() - INTERVAL '30 days'
ORDER BY ap.prediction_timestamp DESC;

CREATE OR REPLACE VIEW agent_performance_metrics AS
SELECT 
    agent_name,
    ticker,
    COUNT(*) as total_predictions,
    COUNT(CASE WHEN prediction_status = 'correct' THEN 1 END) as correct_predictions,
    COUNT(CASE WHEN prediction_status = 'incorrect' THEN 1 END) as incorrect_predictions,
    COUNT(CASE WHEN prediction_status = 'pending' THEN 1 END) as pending_predictions,
    ROUND(
        CASE 
            WHEN COUNT(CASE WHEN prediction_status IN ('correct', 'incorrect') THEN 1 END) > 0 THEN
                COUNT(CASE WHEN prediction_status = 'correct' THEN 1 END)::numeric / 
                COUNT(CASE WHEN prediction_status IN ('correct', 'incorrect') THEN 1 END) * 100
            ELSE 0
        END, 2
    ) as accuracy_percentage,
    AVG(confidence) as avg_confidence
FROM recent_predictions_summary
GROUP BY agent_name, ticker
ORDER BY accuracy_percentage DESC, total_predictions DESC;

CREATE OR REPLACE VIEW market_consensus AS
SELECT 
    ticker,
    COUNT(*) as total_predictions,
    COUNT(CASE WHEN signal = 'bullish' THEN 1 END) as bullish_count,
    COUNT(CASE WHEN signal = 'bearish' THEN 1 END) as bearish_count,
    COUNT(CASE WHEN signal = 'neutral' THEN 1 END) as neutral_count,
    ROUND(COUNT(CASE WHEN signal = 'bullish' THEN 1 END)::numeric / COUNT(*) * 100, 1) as bullish_percentage,
    ROUND(COUNT(CASE WHEN signal = 'bearish' THEN 1 END)::numeric / COUNT(*) * 100, 1) as bearish_percentage,
    ROUND(COUNT(CASE WHEN signal = 'neutral' THEN 1 END)::numeric / COUNT(*) * 100, 1) as neutral_percentage,
    AVG(confidence) as avg_confidence,
    MAX(prediction_timestamp) as latest_prediction
FROM agent_predictions
WHERE prediction_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY ticker
ORDER BY total_predictions DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON agent_predictions(prediction_timestamp);
CREATE INDEX IF NOT EXISTS idx_predictions_agent_ticker ON agent_predictions(agent_name, ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_signal ON agent_predictions(signal);
CREATE INDEX IF NOT EXISTS idx_outcomes_timestamp ON prediction_outcomes(outcome_timestamp);
CREATE INDEX IF NOT EXISTS idx_market_metrics_ticker_timestamp ON market_metrics(ticker, metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health_logs(log_timestamp);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_agent_accuracy(p_agent_name TEXT, p_ticker TEXT DEFAULT NULL, p_days INTEGER DEFAULT 30)
RETURNS TABLE(accuracy_percent NUMERIC, total_predictions INTEGER, correct_predictions INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(
            CASE 
                WHEN COUNT(CASE WHEN rps.prediction_status IN ('correct', 'incorrect') THEN 1 END) > 0 THEN
                    COUNT(CASE WHEN rps.prediction_status = 'correct' THEN 1 END)::numeric / 
                    COUNT(CASE WHEN rps.prediction_status IN ('correct', 'incorrect') THEN 1 END) * 100
                ELSE 0
            END, 2
        ) as accuracy_percent,
        COUNT(*)::INTEGER as total_predictions,
        COUNT(CASE WHEN rps.prediction_status = 'correct' THEN 1 END)::INTEGER as correct_predictions
    FROM recent_predictions_summary rps
    WHERE rps.agent_name = p_agent_name
    AND (p_ticker IS NULL OR rps.ticker = p_ticker)
    AND rps.prediction_timestamp >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_market_trend(p_ticker TEXT, p_days INTEGER DEFAULT 7)
RETURNS TABLE(trend_direction TEXT, confidence_trend NUMERIC, prediction_count INTEGER) AS $$
DECLARE
    bullish_pct NUMERIC;
    bearish_pct NUMERIC;
    neutral_pct NUMERIC;
BEGIN
    SELECT 
        ROUND(COUNT(CASE WHEN signal = 'bullish' THEN 1 END)::numeric / COUNT(*) * 100, 1),
        ROUND(COUNT(CASE WHEN signal = 'bearish' THEN 1 END)::numeric / COUNT(*) * 100, 1),
        ROUND(COUNT(CASE WHEN signal = 'neutral' THEN 1 END)::numeric / COUNT(*) * 100, 1)
    INTO bullish_pct, bearish_pct, neutral_pct
    FROM agent_predictions ap
    WHERE ap.ticker = p_ticker
    AND ap.prediction_timestamp >= NOW() - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN bullish_pct > bearish_pct AND bullish_pct > neutral_pct THEN 'bullish'
            WHEN bearish_pct > bullish_pct AND bearish_pct > neutral_pct THEN 'bearish'
            ELSE 'neutral'
        END as trend_direction,
        AVG(ap.confidence) as confidence_trend,
        COUNT(*)::INTEGER as prediction_count
    FROM agent_predictions ap
    WHERE ap.ticker = p_ticker
    AND ap.prediction_timestamp >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Insert system health log entry to mark database initialization
INSERT INTO system_health_logs (component, status, message, details, log_timestamp) VALUES
('database', 'healthy', 'Database initialized successfully', '{"initial_setup": true, "version": "1.0.0"}', NOW());

COMMIT;
