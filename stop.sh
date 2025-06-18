#!/bin/bash

# AI Hedge Fund - Stop Script
echo "🛑 Stopping AI Hedge Fund services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill processes by PID files
if [ -f backend.pid ]; then
    backend_pid=$(cat backend.pid)
    if kill -0 $backend_pid 2>/dev/null; then
        echo -e "${YELLOW}Stopping backend (PID: $backend_pid)...${NC}"
        kill $backend_pid
        sleep 2
        if kill -0 $backend_pid 2>/dev/null; then
            kill -9 $backend_pid
        fi
    fi
    rm -f backend.pid
fi

if [ -f frontend.pid ]; then
    frontend_pid=$(cat frontend.pid)
    if kill -0 $frontend_pid 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend (PID: $frontend_pid)...${NC}"
        kill $frontend_pid
        sleep 2
        if kill -0 $frontend_pid 2>/dev/null; then
            kill -9 $frontend_pid
        fi
    fi
    rm -f frontend.pid
fi

# Cleanup any remaining processes
pkill -f "uvicorn.*api:app" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true

# Cleanup ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped${NC}"
