#!/bin/bash

# 🚀 AI HEDGE FUND BACKEND STARTUP SCRIPT
# Robust startup with health checks, retries, and environment validation

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="/Users/Gautam/ai-hedge-fund backup/backend"
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=30
PORT=8000

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Check if port is available
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $PORT is already in use"
        log "Attempting to stop existing service..."
        
        # Try to gracefully stop existing service
        local pid=$(lsof -ti:$PORT)
        if [ ! -z "$pid" ]; then
            kill -TERM $pid 2>/dev/null || true
            sleep 3
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                kill -KILL $pid 2>/dev/null || true
                sleep 2
            fi
        fi
        
        # Check if port is now free
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_error "Could not free port $PORT"
            return 1
        else
            log_success "Port $PORT is now available"
        fi
    else
        log_success "Port $PORT is available"
    fi
    return 0
}

# Environment validation
validate_environment() {
    log "🔍 Validating environment..."
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        log_warning ".env file not found - creating from template"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Please configure your API keys in .env file"
        else
            log_error "No .env.example template found"
            return 1
        fi
    fi
    
    # Check for Poetry
    if ! command -v poetry &> /dev/null; then
        log_error "Poetry not found. Please install Poetry first:"
        log_error "curl -sSL https://install.python-poetry.org | python3 -"
        return 1
    fi
    
    # Check Python version
    local python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    log_success "Python version: $python_version"
    
    # Validate Poetry project
    if [ ! -f "pyproject.toml" ]; then
        log_error "pyproject.toml not found - not a valid Poetry project"
        return 1
    fi
    
    log_success "Environment validation passed"
    return 0
}

# Install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    cd "$BACKEND_DIR"
    
    # Update Poetry and install dependencies
    poetry install
    
    if [ $? -eq 0 ]; then
        log_success "Dependencies installed successfully"
        return 0
    else
        log_error "Failed to install dependencies"
        return 1
    fi
}

# Health check function
health_check() {
    local attempt=1
    log "🏥 Performing health check..."
    
    while [ $attempt -le $HEALTH_CHECK_TIMEOUT ]; do
        if curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
            log_success "Backend health check passed"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            log "Health check attempt $attempt/$HEALTH_CHECK_TIMEOUT..."
        fi
        
        sleep 1
        ((attempt++))
    done
    
    log_error "Backend health check failed after $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

# Start backend service
start_backend() {
    log "🚀 Starting backend service..."
    
    cd "$BACKEND_DIR"
    
    # Start the backend with Poetry
    poetry run uvicorn api:app --host 0.0.0.0 --port $PORT --reload &
    local backend_pid=$!
    
    # Wait a moment for startup
    sleep 3
    
    # Check if process is still running
    if ! kill -0 $backend_pid 2>/dev/null; then
        log_error "Backend process failed to start"
        return 1
    fi
    
    log_success "Backend service started (PID: $backend_pid)"
    echo $backend_pid > .backend_pid
    
    return 0
}

# Main startup routine with retries
start_with_retries() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "🎯 Startup attempt $attempt/$MAX_RETRIES"
        
        # Run startup sequence
        if validate_environment && install_dependencies && check_port && start_backend && health_check; then
            log_success "🎉 Backend startup successful!"
            log "🌐 Backend available at: http://localhost:$PORT"
            log "🏥 Health check: http://localhost:$PORT/health"
            return 0
        else
            log_error "Startup attempt $attempt failed"
            
            # Cleanup on failure
            if [ -f ".backend_pid" ]; then
                local pid=$(cat .backend_pid)
                kill -TERM $pid 2>/dev/null || true
                rm -f .backend_pid
            fi
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "⏳ Waiting 5 seconds before retry..."
                sleep 5
            fi
        fi
        
        ((attempt++))
    done
    
    log_error "🚫 Backend startup failed after $MAX_RETRIES attempts"
    return 1
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up..."
    if [ -f "$BACKEND_DIR/.backend_pid" ]; then
        local pid=$(cat "$BACKEND_DIR/.backend_pid")
        if kill -0 $pid 2>/dev/null; then
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            kill -KILL $pid 2>/dev/null || true
        fi
        rm -f "$BACKEND_DIR/.backend_pid"
    fi
}

# Handle script termination
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo ""
    log "🤖 AI HEDGE FUND BACKEND STARTUP"
    log "=================================="
    
    if start_with_retries; then
        log_success "🎯 Backend is ready for trading!"
        
        # Keep the script running to maintain the service
        log "📊 Monitoring backend service... (Press Ctrl+C to stop)"
        while true; do
            sleep 30
            if ! curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
                log_warning "Health check failed - attempting restart..."
                start_with_retries || break
            fi
        done
    else
        log_error "🚫 Failed to start backend service"
        exit 1
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
