#!/bin/bash

# 🚀 AI HEDGE FUND FRONTEND STARTUP SCRIPT
# Robust startup with health checks, retries, and dependency validation

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="/Users/Gautam/ai-hedge-fund backup/frontend"
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=60
PORT=3000
BACKEND_PORT=8000

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
        log "Attempting to stop existing frontend service..."
        
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

# Check backend connectivity
check_backend() {
    log "🔗 Checking backend connectivity..."
    
    local attempt=1
    local max_attempts=10
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
            log_success "Backend is running and healthy"
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            log_warning "Backend not available - will continue checking..."
        fi
        
        if [ $((attempt % 3)) -eq 0 ]; then
            log "Backend check attempt $attempt/$max_attempts..."
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log_warning "Backend not available - frontend will start but may have limited functionality"
    return 0  # Don't fail frontend startup due to backend issues
}

# Environment validation
validate_environment() {
    log "🔍 Validating environment..."
    
    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js first"
        return 1
    fi
    
    local node_version=$(node --version 2>&1)
    log_success "Node.js version: $node_version"
    
    # Check npm version
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install npm first"
        return 1
    fi
    
    local npm_version=$(npm --version 2>&1)
    log_success "npm version: $npm_version"
    
    # Check package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json not found - not a valid Node.js project"
        return 1
    fi
    
    # Check for critical files
    if [ ! -f "src/App.js" ]; then
        log_error "src/App.js not found - invalid React project structure"
        return 1
    fi
    
    log_success "Environment validation passed"
    return 0
}

# Install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    cd "$FRONTEND_DIR"
    
    # Clean install to avoid conflicts
    if [ -d "node_modules" ]; then
        log "Cleaning existing node_modules..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
    fi
    
    # Install dependencies
    npm install --silent
    
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
    log "🏥 Performing frontend health check..."
    
    while [ $attempt -le $HEALTH_CHECK_TIMEOUT ]; do
        if curl -s -f "http://localhost:$PORT" > /dev/null 2>&1; then
            log_success "Frontend health check passed"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log "Health check attempt $attempt/$HEALTH_CHECK_TIMEOUT..."
        fi
        
        sleep 1
        ((attempt++))
    done
    
    log_error "Frontend health check failed after $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

# Start frontend service
start_frontend() {
    log "🚀 Starting frontend service..."
    
    cd "$FRONTEND_DIR"
    
    # Set environment variables for stable startup
    export BROWSER=none
    export PORT=$PORT
    export FAST_REFRESH=false
    export GENERATE_SOURCEMAP=false
    
    # Start the frontend
    npm start &
    local frontend_pid=$!
    
    # Wait a moment for startup
    sleep 5
    
    # Check if process is still running
    if ! kill -0 $frontend_pid 2>/dev/null; then
        log_error "Frontend process failed to start"
        return 1
    fi
    
    log_success "Frontend service started (PID: $frontend_pid)"
    echo $frontend_pid > .frontend_pid
    
    return 0
}

# Check for compilation errors
check_compilation() {
    log "🔧 Checking for compilation..."
    
    local attempt=1
    local max_attempts=30
    
    while [ $attempt -le $max_attempts ]; do
        # Check if React dev server has compiled successfully
        if curl -s "http://localhost:$PORT" | grep -q "react" 2>/dev/null; then
            log_success "Frontend compiled successfully"
            return 0
        fi
        
        if [ $((attempt % 10)) -eq 0 ]; then
            log "Compilation check attempt $attempt/$max_attempts..."
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log_warning "Could not verify compilation - frontend may still be starting"
    return 0  # Don't fail on compilation check
}

# Main startup routine with retries
start_with_retries() {
    local attempt=1
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "🎯 Frontend startup attempt $attempt/$MAX_RETRIES"
        
        # Run startup sequence
        if validate_environment && install_dependencies && check_port && check_backend && start_frontend && health_check && check_compilation; then
            log_success "🎉 Frontend startup successful!"
            log "🌐 Frontend available at: http://localhost:$PORT"
            log "🌐 Network access: http://$(ipconfig getifaddr en0 2>/dev/null || echo 'localhost'):$PORT"
            return 0
        else
            log_error "Frontend startup attempt $attempt failed"
            
            # Cleanup on failure
            if [ -f ".frontend_pid" ]; then
                local pid=$(cat .frontend_pid)
                kill -TERM $pid 2>/dev/null || true
                rm -f .frontend_pid
            fi
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                log "⏳ Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
        
        ((attempt++))
    done
    
    log_error "🚫 Frontend startup failed after $MAX_RETRIES attempts"
    return 1
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up..."
    if [ -f "$FRONTEND_DIR/.frontend_pid" ]; then
        local pid=$(cat "$FRONTEND_DIR/.frontend_pid")
        if kill -0 $pid 2>/dev/null; then
            kill -TERM $pid 2>/dev/null || true
            sleep 3
            kill -KILL $pid 2>/dev/null || true
        fi
        rm -f "$FRONTEND_DIR/.frontend_pid"
    fi
}

# Handle script termination
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo ""
    log "💻 AI HEDGE FUND FRONTEND STARTUP"
    log "=================================="
    
    if start_with_retries; then
        log_success "🎯 Frontend is ready for trading!"
        
        # Keep the script running to maintain the service
        log "📊 Monitoring frontend service... (Press Ctrl+C to stop)"
        while true; do
            sleep 60
            if ! curl -s -f "http://localhost:$PORT" > /dev/null 2>&1; then
                log_warning "Frontend health check failed - attempting restart..."
                start_with_retries || break
            fi
        done
    else
        log_error "🚫 Failed to start frontend service"
        exit 1
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
