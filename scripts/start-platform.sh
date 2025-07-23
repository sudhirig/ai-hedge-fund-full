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
DATABASE_DIR="$PROJECT_DIR/database"
LOGS_DIR="$PROJECT_DIR/logs"

# Service configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
DATABASE_PORT=5432
HEALTH_CHECK_INTERVAL=30
MAX_RESTART_ATTEMPTS=3
DB_NAME="hedge_fund_db"
DB_USER="postgres"
DB_PASSWORD="password"

# PID files
BACKEND_PID_FILE="$PROJECT_DIR/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_DIR/.frontend.pid"
DATABASE_PID_FILE="$PROJECT_DIR/.database.pid"
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
    
    local missing_deps=()
    
    # Check required commands
    local required_commands=("node" "npm" "python3" "poetry" "curl" "lsof" "psql" "createdb" "pg_isready")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
            log_error "$cmd is not available"
        else
            log_success "$cmd is available"
        fi
    done
    
    # Check required directories
    local required_dirs=("$BACKEND_DIR" "$FRONTEND_DIR" "$DATABASE_DIR")
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            missing_deps+=("directory: $dir")
            log_error "Directory does not exist: $dir"
        else
            log_success "Directory exists: $dir"
        fi
    done
    
    # Check environment variables
    local required_env_vars=("FINANCIAL_DATASETS_API_KEY")
    local optional_env_vars=("ANTHROPIC_API_KEY" "OPENAI_API_KEY")
    
    # Load .env file if exists
    if [ -f "$PROJECT_DIR/.env" ]; then
        source "$PROJECT_DIR/.env"
        log_success ".env file loaded"
    fi
    
    for var in "${required_env_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_deps+=("env_var: $var")
            log_error "Required environment variable not set: $var"
        else
            log_success "Environment variable set: $var"
        fi
    done
    
    for var in "${optional_env_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_warning "Optional environment variable not set: $var"
        else
            log_success "Environment variable set: $var"
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    log_success "All prerequisites satisfied"
    return 0
}

# Initialize database
start_database() {
    log_header "INITIALIZING DATABASE"
    
    # Check if PostgreSQL is running
    if ! pg_isready -p $DATABASE_PORT > /dev/null 2>&1; then
        log "Starting PostgreSQL..."
        
        # Start PostgreSQL (different commands for different systems)
        if command -v brew &> /dev/null && brew services list | grep postgresql &> /dev/null; then
            brew services start postgresql > "$LOGS_DIR/database-start.log" 2>&1
        elif systemctl is-enabled postgresql &> /dev/null; then
            sudo systemctl start postgresql > "$LOGS_DIR/database-start.log" 2>&1
        elif service postgresql status &> /dev/null; then
            sudo service postgresql start > "$LOGS_DIR/database-start.log" 2>&1
        else
            log_warning "Could not automatically start PostgreSQL. Please start it manually."
        fi
        
        # Wait for PostgreSQL to start
        local attempt=1
        while [ $attempt -le 30 ]; do
            if pg_isready -p $DATABASE_PORT > /dev/null 2>&1; then
                log_success "PostgreSQL is running"
                break
            fi
            sleep 2
            ((attempt++))
        done
        
        if [ $attempt -gt 30 ]; then
            log_error "PostgreSQL failed to start within 60 seconds"
            return 1
        fi
    else
        log_success "PostgreSQL is already running"
    fi
    
    # Create database if it doesn't exist
    if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        log "Creating database: $DB_NAME"
        createdb $DB_NAME > "$LOGS_DIR/database-create.log" 2>&1
        
        if [ $? -eq 0 ]; then
            log_success "Database created: $DB_NAME"
        else
            log_error "Failed to create database: $DB_NAME"
            return 1
        fi
    else
        log_success "Database already exists: $DB_NAME"
    fi
    
    # Install database schema
    if [ -f "$DATABASE_DIR/schema.sql" ]; then
        log "Installing database schema..."
        psql -d $DB_NAME -f "$DATABASE_DIR/schema.sql" > "$LOGS_DIR/database-schema.log" 2>&1
        
        if [ $? -eq 0 ]; then
            log_success "Database schema installed successfully"
        else
            log_warning "Database schema installation had issues (may be normal if tables exist)"
        fi
    fi
    
    # Install aggregation schema
    if [ -f "$DATABASE_DIR/aggregation_schema.sql" ]; then
        log "Installing aggregation schema..."
        psql -d $DB_NAME -f "$DATABASE_DIR/aggregation_schema.sql" > "$LOGS_DIR/database-aggregation.log" 2>&1
        
        if [ $? -eq 0 ]; then
            log_success "Aggregation schema installed successfully"
        else
            log_warning "Aggregation schema installation had issues (may be normal if tables exist)"
        fi
    fi
    
    # Verify database connection and tables
    local table_count=$(psql -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
        log_success "Database verification successful ($table_count tables found)"
        return 0
    else
        log_error "Database verification failed"
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
# Enhanced health check function with retry logic
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local max_retries=3
    local retry_delay=2
    
    for ((i=1; i<=max_retries; i++)); do
        if curl -s --connect-timeout 5 --max-time 10 "$health_url" > /dev/null 2>&1; then
            return 0
        fi
        
        if [ $i -lt $max_retries ]; then
            log_warning "$service_name health check failed (attempt $i/$max_retries), retrying in ${retry_delay}s..."
            sleep $retry_delay
        fi
    done
    
    return 1
}

# Enhanced monitoring with better error handling and stability
monitor_services() {
    log_header "SERVICE MONITORING STARTED"
    log_info "Health check interval: ${HEALTH_CHECK_INTERVAL}s, Max restarts: $MAX_RESTART_ATTEMPTS"
    
    local backend_restarts=0
    local frontend_restarts=0
    local database_restarts=0
    local consecutive_failures=0
    local last_status_log=0
    
    while true; do
        sleep $HEALTH_CHECK_INTERVAL
        
        local services_status=""
        local all_healthy=true
        
        # Check database health with improved logic
        if ! pg_isready -p $DATABASE_PORT -t 10 > /dev/null 2>&1; then
            log_warning "Database health check failed"
            services_status+="Database ❌ "
            all_healthy=false
            
            if [ $database_restarts -lt $MAX_RESTART_ATTEMPTS ]; then
                log "Attempting database restart ($((database_restarts + 1))/$MAX_RESTART_ATTEMPTS)..."
                if start_database; then
                    log_success "Database restarted successfully"
                    database_restarts=0
                    services_status="Database ✅ "
                else
                    ((database_restarts++))
                    log_error "Database restart failed"
                fi
            else
                log_error "Database exceeded maximum restart attempts ($MAX_RESTART_ATTEMPTS)"
            fi
        else
            services_status+="Database ✅ "
            database_restarts=0
        fi
        
        # Check backend health with enhanced retry logic
        if [ -f "$BACKEND_PID_FILE" ]; then
            local backend_pid=$(cat "$BACKEND_PID_FILE")
            
            # Check if process is running
            if ! kill -0 $backend_pid 2>/dev/null; then
                log_warning "Backend process not running (PID: $backend_pid)"
                services_status+="Backend ❌ "
                all_healthy=false
                
                if [ $backend_restarts -lt $MAX_RESTART_ATTEMPTS ]; then
                    log "Attempting backend restart ($((backend_restarts + 1))/$MAX_RESTART_ATTEMPTS)..."
                    if start_backend; then
                        log_success "Backend restarted successfully"
                        backend_restarts=0
                        services_status="Backend ✅ "
                    else
                        ((backend_restarts++))
                        log_error "Backend restart failed"
                    fi
                else
                    log_error "Backend exceeded maximum restart attempts ($MAX_RESTART_ATTEMPTS)"
                fi
            # Check health endpoint with retries
            elif ! check_service_health "Backend" "http://localhost:$BACKEND_PORT/health"; then
                log_warning "Backend health endpoint failed after retries"
                services_status+="Backend ⚠️  "
                all_healthy=false
                
                # Only restart if health check fails multiple times consecutively
                ((consecutive_failures++))
                if [ $consecutive_failures -ge 3 ] && [ $backend_restarts -lt $MAX_RESTART_ATTEMPTS ]; then
                    log "Backend health failing consistently, attempting restart ($((backend_restarts + 1))/$MAX_RESTART_ATTEMPTS)..."
                    if start_backend; then
                        log_success "Backend restarted successfully"
                        backend_restarts=0
                        consecutive_failures=0
                        services_status="Backend ✅ "
                    else
                        ((backend_restarts++))
                        log_error "Backend restart failed"
                    fi
                fi
            else
                services_status+="Backend ✅ "
                backend_restarts=0
                consecutive_failures=0
            fi
        else
            log_warning "Backend PID file not found"
            services_status+="Backend ❌ "
            all_healthy=false
        fi
        
        # Check frontend health with improved logic
        if [ -f "$FRONTEND_PID_FILE" ]; then
            local frontend_pid=$(cat "$FRONTEND_PID_FILE")
            
            if ! kill -0 $frontend_pid 2>/dev/null; then
                log_warning "Frontend process not running (PID: $frontend_pid)"
                services_status+="Frontend ❌ "
                all_healthy=false
                
                if [ $frontend_restarts -lt $MAX_RESTART_ATTEMPTS ]; then
                    log "Attempting frontend restart ($((frontend_restarts + 1))/$MAX_RESTART_ATTEMPTS)..."
                    if start_frontend; then
                        log_success "Frontend restarted successfully"
                        frontend_restarts=0
                        services_status="Frontend ✅ "
                    else
                        ((frontend_restarts++))
                        log_error "Frontend restart failed"
                    fi
                else
                    log_error "Frontend exceeded maximum restart attempts ($MAX_RESTART_ATTEMPTS)"
                fi
            elif ! check_service_health "Frontend" "http://localhost:$FRONTEND_PORT"; then
                log_warning "Frontend health check failed after retries"
                services_status+="Frontend ⚠️  "
                all_healthy=false
            else
                services_status+="Frontend ✅ "
                frontend_restarts=0
            fi
        else
            log_warning "Frontend PID file not found"
            services_status+="Frontend ❌ "
            all_healthy=false
        fi
        
        # Check aggregation endpoints health (non-critical)
        if check_service_health "Aggregation" "http://localhost:$BACKEND_PORT/api/top-stocks"; then
            services_status+="Aggregation ✅ "
        else
            services_status+="Aggregation ⚠️  "
        fi
        
        # Log status more frequently if there are issues, less frequently if all is well
        local current_time=$(date +%s)
        local status_interval=300  # 5 minutes for healthy systems
        if [ "$all_healthy" = false ]; then
            status_interval=60  # 1 minute for unhealthy systems
        fi
        
        if [ $((current_time - last_status_log)) -ge $status_interval ]; then
            log_info "Platform status: $services_status"
            
            # Log detailed health information
            local db_tables=$(psql -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
            log_info "Database: $db_tables tables, Port: $DATABASE_PORT"
            log_info "Backend: Port $BACKEND_PORT, Frontend: Port $FRONTEND_PORT"
            
            # Log restart counters if any restarts have occurred
            if [ $backend_restarts -gt 0 ] || [ $frontend_restarts -gt 0 ] || [ $database_restarts -gt 0 ]; then
                log_info "Restart counters - Backend: $backend_restarts/$MAX_RESTART_ATTEMPTS, Frontend: $frontend_restarts/$MAX_RESTART_ATTEMPTS, Database: $database_restarts/$MAX_RESTART_ATTEMPTS"
            fi
            
            last_status_log=$current_time
        fi
        
        # Emergency shutdown if all services have exceeded restart attempts
        if [ $backend_restarts -ge $MAX_RESTART_ATTEMPTS ] && [ $frontend_restarts -ge $MAX_RESTART_ATTEMPTS ]; then
            log_error "All services have exceeded maximum restart attempts. Platform requires manual intervention."
            log_error "Check logs in $LOGS_DIR/ for detailed error information."
            break
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
            
            # Wait for graceful shutdown
            local timeout=10
            while [ $timeout -gt 0 ] && kill -0 $backend_pid 2>/dev/null; do
                sleep 1
                ((timeout--))
            done
            
            # Force kill if still running
            if kill -0 $backend_pid 2>/dev/null; then
                kill -KILL $backend_pid 2>/dev/null || true
            fi
            
            log_success "Backend stopped"
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
            log_success "Frontend stopped"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Note: PostgreSQL is typically a system service, so we don't stop it
    # Just clean up our database PID file if it exists
    if [ -f "$DATABASE_PID_FILE" ]; then
        rm -f "$DATABASE_PID_FILE"
        log_success "Database references cleaned"
    fi
    
    # Clean up platform PID
    rm -f "$PLATFORM_PID_FILE"
    
    log_success "🏁 Platform shutdown complete"
    log_info "Database remains running (system service)"
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
            
            # Enhanced database schema validation and auto-repair
            log "🔍 Validating database schema..."
            if ! python3 "$SCRIPT_DIR/validate_database_schema.py"; then
                log_error "Database schema validation failed"
                log_warning "Attempting automatic schema repair..."
                
                # Attempt to fix common schema issues automatically
                if python3 -c "
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def auto_repair_schema():
    load_dotenv()
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        print('❌ DATABASE_URL not found')
        return False
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Add missing columns that commonly cause issues
        await conn.execute('ALTER TABLE agent_predictions ADD COLUMN IF NOT EXISTS position_size_pct DECIMAL(5,2) DEFAULT 0.0;')
        await conn.execute('ALTER TABLE agent_predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;')
        await conn.execute('ALTER TABLE agent_predictions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;')
        
        # Verify the repair worked
        result = await conn.fetchval('SELECT COUNT(*) FROM information_schema.columns WHERE table_name = \'agent_predictions\' AND column_name = \'position_size_pct\';')
        
        await conn.close()
        
        if result > 0:
            print('✅ Schema auto-repair successful')
            return True
        else:
            print('❌ Schema auto-repair failed')
            return False
            
    except Exception as e:
        print(f'❌ Schema auto-repair error: {e}')
        return False

asyncio.run(auto_repair_schema())
"; then
                    log_success "Database schema auto-repair completed"
                    
                    # Re-validate after repair
                    if python3 "$SCRIPT_DIR/validate_database_schema.py"; then
                        log_success "Database schema validation passed after repair"
                    else
                        log_error "Schema validation still failing after auto-repair"
                        log_warning "This may cause prediction storage issues"
                        read -p "Continue with platform startup anyway? (y/N): " -n 1 -r
                        echo
                        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                            log_error "Platform startup aborted due to schema validation failure"
                            exit 1
                        fi
                    fi
                else
                    log_error "Database schema auto-repair failed"
                    log_warning "This may cause prediction storage issues"
                    read -p "Continue with platform startup anyway? (y/N): " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        log_error "Platform startup aborted due to schema validation failure"
                        exit 1
                    fi
                fi
            else
                log_success "Database schema validation passed"
            fi
            
            if check_prerequisites && start_database && start_backend && start_frontend; then
                log_success "🎉 Platform startup complete!"
                echo ""
                log_info "🌐 Frontend: http://localhost:$FRONTEND_PORT"
                log_info "🔧 Backend API: http://localhost:$BACKEND_PORT"
                log_info "🗄️  Database: localhost:$DATABASE_PORT/$DB_NAME"
                log_info "🏥 Health Check: http://localhost:$BACKEND_PORT/health"
                log_info "📈 Analytics: http://localhost:$BACKEND_PORT/api/top-stocks"
                log_info "🤖 Aggregation: http://localhost:$BACKEND_PORT/api/system-recommendations"
                log_info "📊 Logs: $LOGS_DIR/"
                echo ""
                log_info "🚀 AI Hedge Fund Platform with 17 agents is ready!"
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
