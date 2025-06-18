# AI Hedge Fund - Stability & Process Management Guide

## 🚀 Available Startup Methods

### 1. Enhanced Run Script (Recommended for Development)
```bash
./run.sh
```
**Features:**
- ✅ Automatic retry logic (3 attempts per service)
- ✅ Health checks and validation
- ✅ Process monitoring and auto-restart
- ✅ Graceful shutdown (Ctrl+C)
- ✅ Colored output and detailed logging

### 2. PM2 Process Manager (Recommended for Production)
```bash
# Install PM2 globally (one-time setup)
npm install -g pm2

# Start services with PM2
./pm2-start.sh

# PM2 commands
pm2 list                 # Show running processes
pm2 logs                 # Show logs from all processes
pm2 restart all          # Restart all services
pm2 stop all             # Stop all services
pm2 delete all           # Remove all processes
pm2 monit                # Real-time monitoring
```

**PM2 Benefits:**
- ✅ Automatic restart on crashes
- ✅ Process monitoring and memory management
- ✅ Log management with rotation
- ✅ Cluster mode support
- ✅ System startup integration

### 3. Simple Stop Script
```bash
./stop.sh
```
Cleanly stops all services and cleans up processes.

## 🛠️ Stability Improvements Implemented

### 1. **Environment Validation**
- Validates required API keys on startup
- Warns about missing optional dependencies
- Fails fast with clear error messages

### 2. **Enhanced Error Handling**
- Graceful degradation when LLM APIs fail
- Detailed error responses with context
- Timeout protection (5-minute simulation limit)
- Comprehensive logging

### 3. **Health Monitoring**
- `/health` endpoint for system status
- Checks API keys, dependencies, and file existence
- Returns detailed diagnostic information

### 4. **Process Management**
- Automatic retry logic for failed starts
- Process monitoring and auto-restart
- Clean shutdown handling
- PID file management

### 5. **Improved Logging**
- Separate log files for backend and frontend
- Timestamped entries
- Error categorization

## 🔧 Troubleshooting

### Common Issues & Solutions

**Backend fails to start:**
```bash
# Check health status
curl http://localhost:8000/health

# Check logs
tail -f backend.log
tail -f logs/backend-error.log  # If using PM2
```

**Frontend connection issues:**
```bash
# Check if frontend is running
lsof -i :3000

# Check logs
tail -f frontend.log
tail -f logs/frontend-error.log  # If using PM2
```

**API key errors:**
```bash
# Verify .env file
cat .env | grep -E "(OPENAI|ANTHROPIC|FINANCIAL)_API_KEY"

# Test keys manually
source .env && python3 -c "
import os
print('OpenAI:', bool(os.getenv('OPENAI_API_KEY')))
print('Anthropic:', bool(os.getenv('ANTHROPIC_API_KEY')))
print('Financial:', bool(os.getenv('FINANCIAL_DATASETS_API_KEY')))
"
```

## 📊 System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   Enhanced run.sh   │    │     PM2 Manager     │
│  • Retry Logic      │    │  • Auto-restart     │
│  • Health Checks    │    │  • Monitoring       │
│  • Process Monitor  │    │  • Log Management   │
└──────────┬──────────┘    └──────────┬──────────┘
           │                          │
           └──────────┬─────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Backend API          │
        │  • Environment Validation │
        │  • Health Endpoint        │
        │  • Enhanced Error Handling│
        │  • Timeout Protection     │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   AI Simulation Engine    │
        │  • 13 Specialized Agents  │
        │  • Real Financial Data    │
        │  • LLM Integration        │
        └───────────────────────────┘
```

## 🎯 Best Practices

1. **Use PM2 for production deployments**
2. **Monitor logs regularly**: `pm2 logs` or `tail -f *.log`
3. **Check health endpoint**: `curl localhost:8000/health`
4. **Keep API keys secure and updated**
5. **Use the enhanced run.sh for development**
6. **Set up PM2 startup for automatic boot**: `pm2 startup`

## 🚨 Emergency Recovery

If everything fails:
```bash
# Nuclear option - clean slate restart
./stop.sh
pkill -f "node\|python\|uvicorn" || true
lsof -ti:3000,8000 | xargs kill -9 2>/dev/null || true
sleep 5
./run.sh
```
