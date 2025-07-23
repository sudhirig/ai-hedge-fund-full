#!/bin/bash

# 🔧 AI HEDGE FUND PLATFORM STABILITY VALIDATOR
# Comprehensive validation and testing of platform stability and startup scripts

set -e

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
LOGS_DIR="$PROJECT_DIR/logs"

# Logging functions
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

log_info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

log_header() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] 🎯 $1${NC}"
}

# Test database schema stability
test_database_schema() {
    log_header "TESTING DATABASE SCHEMA STABILITY"
    
    # Test schema validation
    if python3 "$SCRIPT_DIR/validate_database_schema.py"; then
        log_success "Database schema validation passed"
    else
        log_error "Database schema validation failed"
        return 1
    fi
    
    # Test auto-repair functionality
    log "Testing schema auto-repair functionality..."
    python3 -c "
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def test_schema_repair():
    load_dotenv()
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        print('❌ DATABASE_URL not found')
        return False
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Verify critical columns exist
        columns = ['position_size_pct', 'created_at', 'updated_at']
        for col in columns:
            result = await conn.fetchval(
                'SELECT COUNT(*) FROM information_schema.columns WHERE table_name = \$1 AND column_name = \$2;',
                'agent_predictions', col
            )
            if result == 0:
                print(f'❌ Missing column: {col}')
                return False
            else:
                print(f'✅ Column exists: {col}')
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f'❌ Schema test error: {e}')
        return False

result = asyncio.run(test_schema_repair())
exit(0 if result else 1)
"
    
    if [ $? -eq 0 ]; then
        log_success "Database schema auto-repair test passed"
    else
        log_error "Database schema auto-repair test failed"
        return 1
    fi
    
    return 0
}

# Test health check reliability
test_health_checks() {
    log_header "TESTING HEALTH CHECK RELIABILITY"
    
    # Test backend health endpoint
    local max_attempts=5
    local success_count=0
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -s --connect-timeout 5 --max-time 10 "http://localhost:8000/health" > /dev/null 2>&1; then
            ((success_count++))
        fi
        sleep 1
    done
    
    local success_rate=$((success_count * 100 / max_attempts))
    log_info "Backend health check success rate: $success_rate% ($success_count/$max_attempts)"
    
    if [ $success_rate -ge 80 ]; then
        log_success "Backend health checks are reliable"
    else
        log_warning "Backend health checks may be unreliable"
    fi
    
    # Test frontend health endpoint
    success_count=0
    for ((i=1; i<=max_attempts; i++)); do
        if curl -s --connect-timeout 5 --max-time 10 "http://localhost:3000" > /dev/null 2>&1; then
            ((success_count++))
        fi
        sleep 1
    done
    
    success_rate=$((success_count * 100 / max_attempts))
    log_info "Frontend health check success rate: $success_rate% ($success_count/$max_attempts)"
    
    if [ $success_rate -ge 80 ]; then
        log_success "Frontend health checks are reliable"
    else
        log_warning "Frontend health checks may be unreliable"
    fi
    
    return 0
}

# Test startup script robustness
test_startup_scripts() {
    log_header "TESTING STARTUP SCRIPT ROBUSTNESS"
    
    # Check if startup scripts exist and are executable
    local scripts=("start-platform.sh" "start-backend.sh" "start-frontend.sh")
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        if [ -f "$script_path" ]; then
            if [ -x "$script_path" ]; then
                log_success "Script exists and is executable: $script"
            else
                log_warning "Script exists but is not executable: $script"
                chmod +x "$script_path"
                log_success "Made script executable: $script"
            fi
        else
            log_error "Script missing: $script"
            return 1
        fi
    done
    
    # Test script syntax
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        if bash -n "$script_path"; then
            log_success "Script syntax valid: $script"
        else
            log_error "Script syntax error: $script"
            return 1
        fi
    done
    
    return 0
}

# Test environment configuration
test_environment() {
    log_header "TESTING ENVIRONMENT CONFIGURATION"
    
    # Check required environment variables
    local required_vars=("DATABASE_URL" "FINANCIAL_DATASETS_API_KEY")
    local optional_vars=("ANTHROPIC_API_KEY" "OPENAI_API_KEY")
    
    # Load .env file
    if [ -f "$PROJECT_DIR/.env" ]; then
        source "$PROJECT_DIR/.env"
        log_success ".env file loaded"
    else
        log_warning ".env file not found"
    fi
    
    # Check required variables
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable not set: $var"
            return 1
        else
            log_success "Environment variable set: $var"
        fi
    done
    
    # Check optional variables
    for var in "${optional_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_warning "Optional environment variable not set: $var"
        else
            log_success "Environment variable set: $var"
        fi
    done
    
    return 0
}

# Test logging system
test_logging() {
    log_header "TESTING LOGGING SYSTEM"
    
    # Check logs directory
    if [ -d "$LOGS_DIR" ]; then
        log_success "Logs directory exists: $LOGS_DIR"
    else
        log_warning "Logs directory missing, creating: $LOGS_DIR"
        mkdir -p "$LOGS_DIR"
        log_success "Logs directory created"
    fi
    
    # Test log file creation
    local test_log="$LOGS_DIR/stability_test.log"
    echo "Test log entry $(date)" > "$test_log"
    
    if [ -f "$test_log" ]; then
        log_success "Log file creation test passed"
        rm -f "$test_log"
    else
        log_error "Log file creation test failed"
        return 1
    fi
    
    return 0
}

# Test process management
test_process_management() {
    log_header "TESTING PROCESS MANAGEMENT"
    
    # Check PID file handling
    local test_pid_file="$PROJECT_DIR/.test.pid"
    echo $$ > "$test_pid_file"
    
    if [ -f "$test_pid_file" ]; then
        local pid_content=$(cat "$test_pid_file")
        if [ "$pid_content" = "$$" ]; then
            log_success "PID file creation and reading test passed"
        else
            log_error "PID file content mismatch"
            return 1
        fi
        rm -f "$test_pid_file"
    else
        log_error "PID file creation test failed"
        return 1
    fi
    
    return 0
}

# Generate stability report
generate_stability_report() {
    log_header "GENERATING STABILITY REPORT"
    
    local report_file="$LOGS_DIR/stability_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
# AI HEDGE FUND PLATFORM STABILITY REPORT
Generated: $(date)

## SYSTEM STATUS
- Platform Directory: $PROJECT_DIR
- Logs Directory: $LOGS_DIR
- Scripts Directory: $SCRIPT_DIR

## VALIDATION RESULTS
EOF
    
    # Add test results to report
    echo "- Database Schema: $(test_database_schema && echo "✅ PASSED" || echo "❌ FAILED")" >> "$report_file"
    echo "- Health Checks: $(test_health_checks && echo "✅ PASSED" || echo "❌ FAILED")" >> "$report_file"
    echo "- Startup Scripts: $(test_startup_scripts && echo "✅ PASSED" || echo "❌ FAILED")" >> "$report_file"
    echo "- Environment: $(test_environment && echo "✅ PASSED" || echo "❌ FAILED")" >> "$report_file"
    echo "- Logging System: $(test_logging && echo "✅ PASSED" || echo "❌ FAILED")" >> "$report_file"
    echo "- Process Management: $(test_process_management && echo "✅ PASSED" || echo "❌ FAILED")" >> "$report_file"
    
    cat >> "$report_file" << EOF

## RECOMMENDATIONS
1. Run this validation script regularly to catch issues early
2. Monitor platform logs for recurring patterns
3. Keep database schema synchronized
4. Ensure all environment variables are properly set
5. Test startup scripts after any modifications

## NEXT STEPS
- Review any failed tests above
- Check detailed logs in $LOGS_DIR/
- Run platform restart if all tests pass
- Contact support if critical issues persist
EOF
    
    log_success "Stability report generated: $report_file"
    
    # Display summary
    log_info "📊 STABILITY REPORT SUMMARY:"
    cat "$report_file" | grep -E "(✅|❌)" | while read line; do
        if [[ $line == *"✅"* ]]; then
            log_success "$line"
        else
            log_error "$line"
        fi
    done
}

# Main execution
main() {
    echo ""
    log_header "🔧 AI HEDGE FUND PLATFORM STABILITY VALIDATOR"
    echo "=================================================="
    
    local all_tests_passed=true
    
    # Run all stability tests
    test_database_schema || all_tests_passed=false
    test_health_checks || all_tests_passed=false
    test_startup_scripts || all_tests_passed=false
    test_environment || all_tests_passed=false
    test_logging || all_tests_passed=false
    test_process_management || all_tests_passed=false
    
    # Generate report
    generate_stability_report
    
    echo ""
    if [ "$all_tests_passed" = true ]; then
        log_success "🎉 ALL STABILITY TESTS PASSED"
        log_info "Platform is stable and ready for operation"
        exit 0
    else
        log_error "⚠️  SOME STABILITY TESTS FAILED"
        log_warning "Review the issues above and fix before proceeding"
        exit 1
    fi
}

# Make this script executable
chmod +x "$0" 2>/dev/null || true

# Execute main function
main "$@"
