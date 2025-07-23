# AI Hedge Fund - Database Integration Guide

## Overview

The AI Hedge Fund platform now includes a comprehensive PostgreSQL database integration that automatically stores all agent analysis results, enabling persistent storage, continuous learning, and advanced analytics capabilities.

## 🏗️ Architecture

### Database Components
- **PostgreSQL 15**: Primary database for storing agent predictions, outcomes, and analytics
- **PostgREST**: RESTful API layer providing direct database access
- **FastAPI Integration**: Automatic storage of analysis results via backend API
- **Redis** (optional): Caching layer for improved performance

### Key Features
- ✅ **Automatic Storage**: Every agent analysis is automatically stored in the database
- ✅ **Performance Tracking**: Track agent accuracy and performance over time
- ✅ **Market Analytics**: Consensus analysis, trends, and market insights
- ✅ **Continuous Learning**: Foundation for ML/AI improvement systems
- ✅ **RESTful Access**: Direct database access via PostgREST APIs
- ✅ **Health Monitoring**: System health tracking and diagnostics

## 📊 Database Schema

### Core Tables

#### `agent_predictions`
Stores all agent predictions and analysis results:
```sql
- prediction_id (SERIAL PRIMARY KEY)
- agent_name (VARCHAR) - Name of the AI agent
- ticker (VARCHAR) - Stock ticker symbol
- signal (VARCHAR) - bullish/bearish/neutral
- confidence (DECIMAL) - Confidence level (0.0-1.0)
- reasoning (TEXT) - Agent's reasoning
- prediction_timestamp (TIMESTAMP)
- date_range_start/end (DATE) - Analysis period
- initial_cash (INTEGER) - Analysis context
- metadata (JSONB) - Additional data
```

#### `prediction_outcomes`
Tracks actual outcomes for performance measurement:
```sql
- outcome_id (SERIAL PRIMARY KEY)
- prediction_id (INTEGER) - Links to agent_predictions
- actual_outcome (VARCHAR) - Actual market result  
- actual_price_change (DECIMAL) - Price movement
- outcome_timestamp (TIMESTAMP)
```

#### `market_metrics`
Stores market data and financial metrics:
```sql
- metric_id (SERIAL PRIMARY KEY)
- ticker (VARCHAR)
- metric_name (VARCHAR) - e.g., 'pe_ratio', 'market_cap'
- metric_value (DECIMAL)
- metric_timestamp (TIMESTAMP)
```

#### `agent_configurations`
Stores agent configuration and parameters:
```sql
- config_id (SERIAL PRIMARY KEY)
- agent_name (VARCHAR)
- config_data (JSONB) - Configuration parameters
- created_at (TIMESTAMP)
```

#### `system_health_logs`
System health and diagnostic logging:
```sql
- log_id (SERIAL PRIMARY KEY)
- component (VARCHAR) - System component
- status (VARCHAR) - healthy/degraded/error
- message (TEXT) - Status message
- details (JSONB) - Additional details
- log_timestamp (TIMESTAMP)
```

### Useful Views

#### `recent_predictions_summary`
Combines predictions with outcomes for easy analysis:
```sql
SELECT agent_name, ticker, signal, confidence, 
       prediction_timestamp, actual_outcome,
       prediction_status -- 'correct'/'incorrect'/'pending'
FROM recent_predictions_summary;
```

#### `agent_performance_metrics`
Agent performance statistics:
```sql
SELECT agent_name, ticker, total_predictions,
       correct_predictions, accuracy_percentage,
       avg_confidence
FROM agent_performance_metrics;
```

#### `market_consensus`
Market consensus by ticker:
```sql
SELECT ticker, bullish_percentage, bearish_percentage,
       neutral_percentage, avg_confidence, latest_prediction
FROM market_consensus;
```

## 🚀 Quick Start

### 1. Database Setup

#### Option A: Docker Compose (Recommended)
```bash
# Start all services including database
docker-compose up -d

# Check service health
docker-compose ps
curl http://localhost:8000/health
```

#### Option B: Manual Setup
```bash
# Initialize PostgreSQL database
./database/setup_database.sh

# Install Python dependencies  
pip install asyncpg psycopg2-binary

# Set environment variable
export DATABASE_URL="postgresql://ai_hedge_fund_user:secure_password_2024@localhost:5432/ai_hedge_fund"
```

### 2. Verify Integration
```bash
# Check backend health (includes database status)
curl http://localhost:8000/health

# Run analysis (automatically stores in database)
curl -X POST http://localhost:8000/api/run \
  -H "Content-Type: application/json" \
  -d '{"tickers": "AAPL", "start_date": "2024-01-01", "end_date": "2024-01-31", "initial_cash": 100000}'

# Check stored predictions
curl http://localhost:8000/api/analytics/predictions?limit=10
```

## 📡 API Endpoints

### Backend Analytics APIs

#### `GET /api/analytics/performance`
Get agent performance analytics
```bash
curl "http://localhost:8000/api/analytics/performance?days=30&agent_name=Warren%20Buffett%20Agent"
```

**Parameters:**
- `days` (int): Time period (default: 30)
- `agent_name` (optional): Filter by specific agent
- `ticker` (optional): Filter by specific ticker

**Response:**
```json
{
  "status": "success",
  "data": {
    "accuracy": 0.75,
    "total_predictions": 20,
    "correct_predictions": 15,
    "avg_confidence": 0.68
  }
}
```

#### `GET /api/analytics/predictions`
Get recent agent predictions
```bash
curl "http://localhost:8000/api/analytics/predictions?limit=50&ticker=AAPL"
```

**Parameters:**
- `limit` (int): Number of records (default: 100)
- `agent_name` (optional): Filter by agent
- `ticker` (optional): Filter by ticker

#### `GET /api/analytics/consensus/{ticker}`
Get consensus analysis for a ticker
```bash
curl "http://localhost:8000/api/analytics/consensus/AAPL?days=7"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "bullish_percentage": 60.0,
    "bearish_percentage": 25.0,
    "neutral_percentage": 15.0,
    "avg_confidence": 0.72,
    "total_predictions": 20
  }
}
```

#### `GET /api/analytics/trends`
Get market trends from stored data
```bash
curl "http://localhost:8000/api/analytics/trends?days=30"
```

#### `POST /api/analytics/outcome`
Record prediction outcome for performance tracking
```bash
curl -X POST http://localhost:8000/api/analytics/outcome \
  -H "Content-Type: application/json" \
  -d '{"prediction_id": 123, "actual_outcome": "bullish", "actual_price_change": 0.05}'
```

### PostgREST Direct Database APIs

PostgREST provides direct RESTful access to database tables:

#### Get Predictions
```bash
# All recent predictions
curl "http://localhost:3001/agent_predictions?limit=10&order=prediction_timestamp.desc"

# Filter by agent
curl "http://localhost:3001/agent_predictions?agent_name=eq.Warren%20Buffett%20Agent"

# Filter by ticker and signal
curl "http://localhost:3001/agent_predictions?ticker=eq.AAPL&signal=eq.bullish"
```

#### Get Performance Data
```bash
# Agent performance summary
curl "http://localhost:3001/agent_performance_metrics"

# Market consensus
curl "http://localhost:3001/market_consensus?ticker=eq.AAPL"
```

#### Custom Queries
```bash
# Get agent accuracy
curl -X POST "http://localhost:3001/rpc/get_agent_accuracy" \
  -H "Content-Type: application/json" \
  -d '{"p_agent_name": "Warren Buffett Agent", "p_days": 30}'

# Get market trend
curl -X POST "http://localhost:3001/rpc/get_market_trend" \
  -H "Content-Type: application/json" \
  -d '{"p_ticker": "AAPL", "p_days": 7}'
```

## 🔧 Configuration

### Environment Variables

#### Backend Configuration
```bash
# Database connection
DATABASE_URL="postgresql://ai_hedge_fund_user:secure_password_2024@localhost:5432/ai_hedge_fund"

# API Keys (existing)
FINANCIAL_DATASETS_API_KEY="your_api_key"
ANTHROPIC_API_KEY="your_api_key"
OPENAI_API_KEY="your_api_key"
```

#### Docker Environment
```bash
# In docker-compose.yml or .env file
POSTGRES_DB=ai_hedge_fund
POSTGRES_USER=ai_hedge_fund_user  
POSTGRES_PASSWORD=secure_password_2024
PGRST_DB_URI=postgres://ai_hedge_fund_user:secure_password_2024@postgres:5432/ai_hedge_fund
```

### Connection Settings
```python
# In Python code
from database.db_manager import DatabaseManager

db_manager = DatabaseManager(
    database_url="postgresql://ai_hedge_fund_user:secure_password_2024@localhost:5432/ai_hedge_fund"
)
await db_manager.connect()
```

## 📈 Usage Examples

### 1. Run Analysis and Check Storage
```python
import requests

# Run analysis
response = requests.post('http://localhost:8000/api/run', json={
    "tickers": "AAPL,MSFT",
    "start_date": "2024-01-01", 
    "end_date": "2024-01-31",
    "initial_cash": 100000
})

print(f"Stored {response.json()['metadata']['stored_predictions']} predictions")

# Check stored predictions
predictions = requests.get('http://localhost:8000/api/analytics/predictions?limit=5')
print(predictions.json()['data'])
```

### 2. Track Agent Performance
```python
# Get Warren Buffett agent performance
performance = requests.get(
    'http://localhost:8000/api/analytics/performance?agent_name=Warren%20Buffett%20Agent&days=30'
)

data = performance.json()['data']
print(f"Accuracy: {data['accuracy']}%")
print(f"Total Predictions: {data['total_predictions']}")
```

### 3. Market Consensus Analysis
```python
# Get consensus for Apple
consensus = requests.get('http://localhost:8000/api/analytics/consensus/AAPL?days=7')
data = consensus.json()['data']

print(f"AAPL Consensus:")
print(f"  Bullish: {data['bullish_percentage']}%")
print(f"  Bearish: {data['bearish_percentage']}%")
print(f"  Neutral: {data['neutral_percentage']}%")
```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint
```bash
curl http://localhost:8000/health
```

**Response includes:**
```json
{
  "status": "healthy",
  "database": {
    "available": true,
    "connected": true,
    "tables_exist": true
  },
  "environment": {...},
  "dependencies": {...}
}
```

### Database Health Monitoring
```sql
-- Check recent system health
SELECT * FROM system_health_logs 
WHERE log_timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY log_timestamp DESC;

-- Check prediction storage rate
SELECT DATE(prediction_timestamp) as date, 
       COUNT(*) as predictions_stored
FROM agent_predictions 
WHERE prediction_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(prediction_timestamp)
ORDER BY date DESC;
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection manually
psql -h localhost -p 5432 -U ai_hedge_fund_user -d ai_hedge_fund

# Restart database service
docker-compose restart postgres
```

#### Tables Don't Exist
```bash
# Reinitialize database schema
docker-compose down -v  # Remove volumes
docker-compose up -d postgres  # Recreate with fresh schema
```

#### PostgREST API Not Working
```bash
# Check PostgREST health
curl http://localhost:3001/

# Check PostgREST logs
docker-compose logs postgrest
```

#### No Predictions Being Stored
```bash
# Check backend logs
docker-compose logs backend

# Verify database connection in health check
curl http://localhost:8000/health | jq '.database'

# Check if db_manager is available
grep -n "Database manager not available" backend/api.py
```

### Performance Optimization

#### Database Indexes
```sql
-- Additional indexes for better performance
CREATE INDEX CONCURRENTLY idx_predictions_composite 
ON agent_predictions(ticker, agent_name, prediction_timestamp DESC);

CREATE INDEX CONCURRENTLY idx_outcomes_prediction 
ON prediction_outcomes(prediction_id, outcome_timestamp DESC);
```

#### Connection Pooling
```python
# In production, use connection pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?min_size=5&max_size=20"
```

## 🎯 Next Steps

### Continuous Learning Integration
The database foundation enables advanced ML/AI features:

1. **Performance-Based Agent Weighting**: Adjust agent influence based on accuracy
2. **Market Pattern Recognition**: Identify successful prediction patterns
3. **Adaptive Confidence Scoring**: Improve confidence calibration over time
4. **Meta-Learning**: Learn which agents perform best in different market conditions

### Advanced Analytics
Leverage stored data for insights:

1. **Market Sentiment Tracking**: Historical sentiment trends
2. **Agent Specialization Analysis**: Which agents excel at specific sectors/conditions
3. **Consensus Reliability**: How well consensus predictions perform
4. **Risk Assessment**: Correlation between confidence levels and accuracy

### Integration Examples
```python
# Example: Get best performing agent for a ticker
best_agent = requests.get(
    'http://localhost:8000/api/analytics/performance?ticker=AAPL&days=90'
).json()['data']['best_agent']

# Example: Weighted consensus based on historical accuracy
weighted_consensus = calculate_weighted_consensus(
    predictions=recent_predictions,
    weights=agent_performance_weights
)
```

## 📚 References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)
- [FastAPI Database Integration](https://fastapi.tiangolo.com/tutorial/sql-databases/)
- [Docker Compose Guide](https://docs.docker.com/compose/)

---

## 📞 Support

For issues with database integration:

1. Check the health endpoint: `curl http://localhost:8000/health`
2. Review Docker logs: `docker-compose logs`
3. Verify environment variables and connection strings
4. Check database schema with: `psql -h localhost -U ai_hedge_fund_user -d ai_hedge_fund -c "\dt"`

**Database integration is now fully operational and ready for production use! 🚀**
