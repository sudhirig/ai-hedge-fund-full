#!/bin/bash

# 🚀 AI HEDGE FUND PLATFORM ORCHESTRATOR
# Complete platform startup with backend, frontend, and health monitoring

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
LOGS_DIR="$PROJECT_DIR/logs"

# Service configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
HEALTH_CHECK_INTERVAL=30
MAX_RESTART_ATTEMPTS=3

# PID files
BACKEND_PID_FILE="$PROJECT_DIR/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.frontend.pid"
PLATFORM_PID_FILE="$PROJECT_DIR/.platform.pid"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOGS_DIR/platform.log"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOGS_DIR/platform.log"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOGS_DIR/platform.log"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOGS_DIR/platform.log"
}

log_info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "$LOGS_DIR/platform.log"
}

log_header() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] 🎯 $1${NC}" | tee -a "$LOGS_DIR/platform.log"
}

# Setup logging directory
setup_logging() {
    mkdir -p "$LOGS_DIR"
    
    # Rotate logs if they get too large
    if [ -f "$LOGS_DIR/platform.log" ] && [ $(stat -f%z "$LOGS_DIR/platform.log" 2>/dev/null || stat -c%s "$LOGS_DIR/platform.log" 2>/dev/null || echo 0) -gt 10485760 ]; then
        mv "$LOGS_DIR/platform.log" "$LOGS_DIR/platform.log.old"
    fi
    
    log_info "Logging initialized: $LOGS_DIR/platform.log"
}

# Check system prerequisites
check_prerequisites() {
    log_header "SYSTEM PREREQUISITES CHECK"
    
    local issues=0
    
    # Check required commands
    local required_commands=("node" "npm" "python3" "poetry" "curl" "lsof")
    
    for cmd in "${required_commands[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            log_success "$cmd is available"
        else
            log_error "$cmd is not installed"
            ((issues++))
        fi
    done
    
    # Check directory structure
    local required_dirs=("$BACKEND_DIR" "$FRONTEND_DIR")
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_success "Directory exists: $dir"
        else
            log_error "Directory missing: $dir"
            ((issues++))
        fi
    done
    
    if [ $issues -eq 0 ]; then
        log_success "All prerequisites satisfied"
        return 0
    else
        log_error "$issues prerequisite issues found"
        return 1
    fi
}

# Start backend service
start_backend() {
    log_header "STARTING BACKEND SERVICE"
    
    cd "$BACKEND_DIR"
    
    # Stop existing backend if running
    if [ -f "$BACKEND_PID_FILE" ]; then
        local old_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 $old_pid 2>/dev/null; then
            log "Stopping existing backend (PID: $old_pid)..."
            kill -TERM $old_pid 2>/dev/null || true
            sleep 3
            kill -KILL $old_pid 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Install dependencies
    log "Installing backend dependencies..."
    poetry install > "$LOGS_DIR/backend-install.log" 2>&1
    
    if [ $? -ne 0 ]; then
        log_error "Failed to install backend dependencies"
        return 1
    fi
    
    # Start backend
    log "Starting backend server..."
    poetry run uvicorn api:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "$LOGS_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    # Wait for backend to start
    local attempt=1
    while [ $attempt -le 30 ]; do
        if curl -s -f "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
            log_success "Backend started successfully (PID: $backend_pid)"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    log_error "Backend failed to start within 60 seconds"
    return 1
}

# Start frontend service
start_frontend() {
    log_header "STARTING FRONTEND SERVICE"
    
    cd "$FRONTEND_DIR"
    
    # Stop existing frontend if running
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local old_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $old_pid 2>/dev/null; then
            log "Stopping existing frontend (PID: $old_pid)..."
            kill -TERM $old_pid 2>/dev/null || true
            sleep 3
            kill -KILL $old_pid 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Clean and install dependencies
    log "Installing frontend dependencies..."
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install --silent > "$LOGS_DIR/frontend-install.log" 2>&1
    
    if [ $? -ne 0 ]; then
        log_error "Failed to install frontend dependencies"
        return 1
    fi
    
    # Start frontend
    log "Starting frontend server..."
    BROWSER=none PORT=$FRONTEND_PORT FAST_REFRESH=false GENERATE_SOURCEMAP=false npm start > "$LOGS_DIR/frontend.log" 2>&1 &
    local frontend_pid=$!
    
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # Wait for frontend to start
    local attempt=1
    while [ $attempt -le 60 ]; do
        if curl -s -f "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend started successfully (PID: $frontend_pid)"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    log_error "Frontend failed to start within 120 seconds"
    return 1
}

# Health monitoring function
monitor_services() {
    log_header "SERVICE MONITORING STARTED"
    
    local backend_restarts=0
    local frontend_restarts=0
    
    while true; do
        sleep $HEALTH_CHECK_INTERVAL
        
        # Check backend health
        if [ -f "$BACKEND_PID_FILE" ]; then
            local backend_pid=$(cat "$BACKEND_PID_FILE")
            
            if ! kill -0 $backend_pid 2>/dev/null || ! curl -s -f "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
                log_warning "Backend health check failed"
                
                if [ $backend_restarts -lt $MAX_RESTART_ATTEMPTS ]; then
                    log "Attempting backend restart ($((backend_restarts + 1))/$MAX_RESTART_ATTEMPTS)..."
                    if start_backend; then
                        log_success "Backend restarted successfully"
                        backend_restarts=0
                    else
                        ((backend_restarts++))
                        log_error "Backend restart failed"
                    fi
                else
                    log_error "Backend exceeded maximum restart attempts"
                fi
            fi
        fi
        
        # Check frontend health
        if [ -f "$FRONTEND_PID_FILE" ]; then
            local frontend_pid=$(cat "$FRONTEND_PID_FILE")
            
            if ! kill -0 $frontend_pid 2>/dev/null || ! curl -s -f "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
                log_warning "Frontend health check failed"
                
                if [ $frontend_restarts -lt $MAX_RESTART_ATTEMPTS ]; then
                    log "Attempting frontend restart ($((frontend_restarts + 1))/$MAX_RESTART_ATTEMPTS)..."
                    if start_frontend; then
                        log_success "Frontend restarted successfully"
                        frontend_restarts=0
                    else
                        ((frontend_restarts++))
                        log_error "Frontend restart failed"
                    fi
                else
                    log_error "Frontend exceeded maximum restart attempts"
                fi
            fi
        fi
        
        # Log status every 5 minutes
        if [ $(($(date +%s) % 300)) -lt $HEALTH_CHECK_INTERVAL ]; then
            log_info "Platform status: Backend ✅ Frontend ✅"
        fi
    done
}

# Status function
show_status() {
    echo ""
    log_header "AI HEDGE FUND PLATFORM STATUS"
    echo "================================================="
    
    # Backend status
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 $backend_pid 2>/dev/null && curl -s -f "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
            log_success "Backend: HEALTHY (PID: $backend_pid, Port: $BACKEND_PORT)"
        else
            log_error "Backend: UNHEALTHY"
        fi
    else
        log_warning "Backend: NOT RUNNING"
    fi
    
    # Frontend status
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $frontend_pid 2>/dev/null && curl -s -f "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend: HEALTHY (PID: $frontend_pid, Port: $FRONTEND_PORT)"
        else
            log_error "Frontend: UNHEALTHY"
        fi
    else
        log_warning "Frontend: NOT RUNNING"
    fi
    
    echo "================================================="
    echo ""
}

# Cleanup function
cleanup() {
    log_header "PLATFORM SHUTDOWN"
    
    # Stop backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 $backend_pid 2>/dev/null; then
            log "Stopping backend (PID: $backend_pid)..."
            kill -TERM $backend_pid 2>/dev/null || true
            sleep 3
            kill -KILL $backend_pid 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Stop frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $frontend_pid 2>/dev/null; then
            log "Stopping frontend (PID: $frontend_pid)..."
            kill -TERM $frontend_pid 2>/dev/null || true
            sleep 3
            kill -KILL $frontend_pid 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Remove platform PID file
    rm -f "$PLATFORM_PID_FILE"
    
    log_success "Platform shutdown complete"
}

# Handle script termination
trap cleanup EXIT INT TERM

# Main execution
main() {
    case "${1:-start}" in
        "start")
            echo ""
            log_header "🤖 AI HEDGE FUND PLATFORM STARTUP"
            echo "=============================================="
            
            # Store platform PID
            echo $$ > "$PLATFORM_PID_FILE"
            
            setup_logging
            
            if check_prerequisites && start_backend && start_frontend; then
                log_success "🎉 Platform startup complete!"
                echo ""
                log_info "🌐 Frontend: http://localhost:$FRONTEND_PORT"
                log_info "🔧 Backend API: http://localhost:$BACKEND_PORT"
                log_info "🏥 Health Check: http://localhost:$BACKEND_PORT/health"
                log_info "📊 Logs: $LOGS_DIR/"
                echo ""
                
                monitor_services
            else
                log_error "🚫 Platform startup failed"
                exit 1
            fi
            ;;
        "status")
            show_status
            ;;
        "stop")
            cleanup
            ;;
        "restart")
            cleanup
            sleep 2
            exec "$0" start
            ;;
        *)
            echo "Usage: $0 {start|status|stop|restart}"
            exit 1
            ;;
    esac
}

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
