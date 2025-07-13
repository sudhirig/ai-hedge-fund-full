#!/bin/bash

# AI Hedge Fund - Enhanced Startup Script with Retry Logic
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_RETRIES=3
BACKEND_PORT=8000
FRONTEND_PORT=3000
HEALTH_CHECK_TIMEOUT=30

echo -e "${BLUE}🚀 AI Hedge Fund - Enhanced Startup${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to cleanup processes
cleanup_processes() {
    echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
    
    # Kill existing processes
    pkill -f "uvicorn.*api:app" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "node.*start" 2>/dev/null || true
    
    # Clean up ports
    if check_port $BACKEND_PORT; then
        echo -e "${YELLOW}🧹 Cleaning up port $BACKEND_PORT...${NC}"
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port $FRONTEND_PORT; then
        echo -e "${YELLOW}🧹 Cleaning up port $FRONTEND_PORT...${NC}"
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 2
}

# Function to validate environment
validate_environment() {
    echo -e "${BLUE}🔧 Validating environment...${NC}"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ .env file not found${NC}"
        exit 1
    fi
    
    # Source environment variables
    source .env
    
    # Check required API keys
    local missing_keys=()
    
    if [ -z "$FINANCIAL_DATASETS_API_KEY" ]; then
        missing_keys+=("FINANCIAL_DATASETS_API_KEY")
    fi
    
    if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  Warning: No LLM API keys found. LLM agents will not work.${NC}"
    fi
    
    if [ ${#missing_keys[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required environment variables: ${missing_keys[*]}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Install Python dependencies
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    if command -v poetry &> /dev/null; then
        echo -e "${GREEN}Using Poetry for dependency management...${NC}"
        poetry install --only=main
    else
        echo -e "${YELLOW}Poetry not found, using pip...${NC}"
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        fi
        if [ -f "backend/requirements.txt" ]; then
            pip install -r backend/requirements.txt
        fi
    fi
    
    # Install Node.js dependencies
    if [ -d "frontend" ]; then
        echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
        cd frontend
        npm install --silent
        cd ..
    fi
}

# Function to check backend health
check_backend_health() {
    local max_attempts=10
    local attempt=1
    
    echo -e "${BLUE}🏥 Checking backend health...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Waiting for backend (attempt $attempt/$max_attempts)...${NC}"
        sleep 3
        ((attempt++))
    done
    
    echo -e "${RED}❌ Backend health check failed${NC}"
    return 1
}

# Function to start backend with retry
start_backend() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo -e "${BLUE}🔧 Starting backend (attempt $attempt/$MAX_RETRIES)...${NC}"
        
        # Clean up any previous attempts
        pkill -f "uvicorn.*api:app" 2>/dev/null || true
        sleep 2
        
        # Validate backend directory and api.py exists
        if [ ! -f "backend/api.py" ]; then
            echo -e "${RED}❌ backend/api.py not found${NC}"
            return 1
        fi
        
        # Start backend with Poetry from project root for proper module resolution
        echo -e "${YELLOW}📡 Starting backend with Poetry...${NC}"
        nohup poetry run python -m uvicorn backend.api:app --host 0.0.0.0 --port $BACKEND_PORT --reload > backend.log 2>&1 &
        local backend_pid=$!
        echo $backend_pid > backend.pid
        
        # Progressive health checking with detailed error capture
        echo -e "${YELLOW}⏳ Waiting for backend initialization...${NC}"
        sleep 3
        
        # Check if process is still running
        if ! kill -0 $backend_pid 2>/dev/null; then
            echo -e "${RED}❌ Backend process died immediately${NC}"
            echo -e "${YELLOW}📋 Last 10 lines of backend.log:${NC}"
            tail -10 backend.log 2>/dev/null || echo "No log output"
            ((attempt++))
            continue
        fi
        
        # Check if port is listening
        local port_check_attempts=0
        while [ $port_check_attempts -lt 10 ]; do
            if check_port $BACKEND_PORT; then
                break
            fi
            sleep 1
            ((port_check_attempts++))
        done
        
        if [ $port_check_attempts -eq 10 ]; then
            echo -e "${RED}❌ Backend port $BACKEND_PORT not responding${NC}"
            echo -e "${YELLOW}📋 Backend log:${NC}"
            tail -10 backend.log 2>/dev/null || echo "No log output"
            kill $backend_pid 2>/dev/null || true
            ((attempt++))
            continue
        fi
        
        # Final health check with detailed error reporting
        if check_backend_health; then
            echo -e "${GREEN}✅ Backend started successfully (PID: $backend_pid, Port: $BACKEND_PORT)${NC}"
            return 0
        else
            echo -e "${RED}❌ Backend health check failed${NC}"
            echo -e "${YELLOW}📋 Backend log:${NC}"
            tail -10 backend.log 2>/dev/null || echo "No log output"
            kill $backend_pid 2>/dev/null || true
        fi
        
        echo -e "${RED}❌ Backend start failed (attempt $attempt/$MAX_RETRIES), retrying in 5s...${NC}"
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ Failed to start backend after $MAX_RETRIES attempts${NC}"
    echo -e "${YELLOW}📋 Final backend log:${NC}"
    tail -20 backend.log 2>/dev/null || echo "No log output available"
    return 1
}

# Function to start frontend with retry
start_frontend() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        echo -e "${BLUE}🎨 Starting frontend (attempt $attempt/$MAX_RETRIES)...${NC}"
        
        cd frontend
        nohup npm start > ../frontend.log 2>&1 &
        local frontend_pid=$!
        cd ..
        
        # Wait for frontend to start
        sleep 10
        
        if kill -0 $frontend_pid 2>/dev/null && check_port $FRONTEND_PORT; then
            echo -e "${GREEN}✅ Frontend started successfully (PID: $frontend_pid)${NC}"
            echo $frontend_pid > frontend.pid
            return 0
        fi
        
        echo -e "${RED}❌ Frontend start failed, retrying in 5s...${NC}"
        kill $frontend_pid 2>/dev/null || true
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ Failed to start frontend after $MAX_RETRIES attempts${NC}"
    return 1
}

# Function to show status
show_status() {
    echo -e "\n${GREEN}🎉 AI Hedge Fund is running!${NC}"
    echo -e "${GREEN}📊 Frontend: http://localhost:$FRONTEND_PORT${NC}"
    echo -e "${GREEN}🔧 Backend API: http://localhost:$BACKEND_PORT${NC}"
    echo -e "${GREEN}📋 API Docs: http://localhost:$BACKEND_PORT/docs${NC}"
    echo -e "\n${YELLOW}📜 Logs:${NC}"
    echo -e "${YELLOW}   Backend: tail -f backend.log${NC}"
    echo -e "${YELLOW}   Frontend: tail -f frontend.log${NC}"
    echo -e "\n${YELLOW}🛑 To stop: ./stop.sh${NC}"
}

# Main execution
main() {
    cleanup_processes
    validate_environment
    install_dependencies
    
    if start_backend && start_frontend; then
        show_status
        
        # Keep script running to monitor processes
        echo -e "\n${BLUE}🔍 Monitoring processes... (Press Ctrl+C to stop)${NC}"
        while true; do
            sleep 30
            
            # Check if processes are still running
            if [ -f backend.pid ] && ! kill -0 $(cat backend.pid) 2>/dev/null; then
                echo -e "${RED}❌ Backend process died, restarting...${NC}"
                start_backend
            fi
            
            if [ -f frontend.pid ] && ! kill -0 $(cat frontend.pid) 2>/dev/null; then
                echo -e "${RED}❌ Frontend process died, restarting...${NC}"
                start_frontend
            fi
        done
    else
        echo -e "${RED}❌ Failed to start services${NC}"
        exit 1
    fi
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}🛑 Shutting down...${NC}"; cleanup_processes; exit 0' INT

# Detect environment and run
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
