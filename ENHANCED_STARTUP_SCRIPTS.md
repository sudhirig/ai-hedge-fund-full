# Enhanced Startup Scripts with Database Schema Synchronization

## Overview

The AI Hedge Fund platform startup scripts have been enhanced with comprehensive database schema validation and synchronization logic to prevent the schema inconsistency issues that previously caused backend prediction storage failures.

## Key Enhancements

### 1. Database Schema Validation Script
**File**: `scripts/validate_database_schema.py`

**Purpose**: Ensures database schema consistency before backend startup

**Features**:
- ✅ Connection pool refresh and synchronization
- ✅ Critical table schema validation (`agent_predictions`, `agents`, `instruments`)
- ✅ Column existence verification (`position_size_pct`, `agent_id`, `confidence`, etc.)
- ✅ Database connectivity testing
- ✅ Test prediction insertion capability
- ✅ Comprehensive validation reporting
- ✅ JSON validation report generation

**Validation Checks**:
- `agent_predictions` table: `position_size_pct`, `agent_id`, `confidence`, `signal`, `reasoning`
- `agents` table: `id`, `name`, `display_name`, `type`, `is_active`
- `instruments` table: `id`, `ticker`, `name`, `market`, `currency`

### 2. Enhanced Backend Startup Script
**File**: `scripts/start-backend.sh`

**New Features**:
- ✅ Database schema validation as first step
- ✅ Interactive continuation prompt on schema validation failure
- ✅ Enhanced error handling and logging
- ✅ Retry logic with schema validation on each attempt

**Startup Sequence**:
1. **Database Schema Validation** (NEW)
2. Environment validation
3. Dependency installation
4. Port availability check
5. Backend service startup
6. Health check validation

### 3. Enhanced Platform Startup Script
**File**: `scripts/start-platform.sh`

**New Features**:
- ✅ Database schema validation before service startup
- ✅ Interactive continuation prompt on validation failure
- ✅ Comprehensive logging of validation results

**Startup Sequence**:
1. Logging setup
2. **Database Schema Validation** (NEW)
3. Prerequisites check
4. Database startup
5. Backend startup
6. Frontend startup
7. Service monitoring

## Usage

### Individual Backend Startup
```bash
# Enhanced backend startup with schema validation
./scripts/start-backend.sh
```

### Full Platform Startup
```bash
# Enhanced platform startup with schema validation
./scripts/start-platform.sh start
```

### Manual Schema Validation
```bash
# Run schema validation independently
python3 scripts/validate_database_schema.py
```

## Validation Report

The schema validation generates a comprehensive JSON report at:
```
logs/schema_validation_report.json
```

**Sample Report**:
```json
{
  "timestamp": "2025-07-18T05:12:17.140472",
  "status": "success",
  "database_connection": "healthy",
  "schema_validation": "passed",
  "agent_predictions_table": "validated",
  "agents_table": "validated",
  "instruments_table": "validated",
  "prediction_insertion": "tested",
  "statistics": {
    "active_agents": 29,
    "instruments": 2,
    "predictions": 302
  }
}
```

## Error Handling

### Schema Validation Failure
If schema validation fails, the startup scripts will:
1. Display detailed error information
2. Prompt user for continuation decision
3. Allow manual override if needed
4. Generate failure report for debugging

### Interactive Prompts
```bash
Database schema validation failed
This may cause prediction storage issues
Continue with backend startup anyway? (y/N):
```

## Benefits

### 1. Prevents Prediction Storage Failures
- Ensures `position_size_pct` column availability
- Validates all critical database schema elements
- Prevents schema inconsistency issues

### 2. Enhanced Reliability
- Connection pool synchronization
- Comprehensive validation before startup
- Detailed error reporting and logging

### 3. Better Developer Experience
- Clear validation feedback
- Interactive error handling
- Comprehensive documentation

### 4. Production Readiness
- Automated schema validation
- Robust error handling
- Comprehensive logging and reporting

## Technical Details

### Database Connection Pool Synchronization
The validation script forces connection pool refresh to ensure all connections see the latest schema:

```python
# Force connection pool refresh
await db_manager.close()
db_manager = DatabaseManager()
await db_manager.initialize()
```

### Schema Validation Logic
Critical columns are validated using information_schema queries:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agent_predictions'
AND column_name IN ('position_size_pct', 'agent_id', 'confidence', 'signal', 'reasoning')
```

### Test Insertion Capability
A test prediction is inserted and rolled back to verify database operations:

```python
async with conn.transaction():
    test_id = await conn.fetchval("""
        INSERT INTO agent_predictions (...) VALUES (...)
        RETURNING id
    """, ...)
    # Transaction is automatically rolled back
    raise Exception("Test rollback - schema validation complete")
```

## Resolution of Previous Issues

### Root Cause Addressed
- **Database schema inconsistency** across connection pools
- **Missing `position_size_pct` column** visibility
- **Silent prediction storage failures**

### Solution Implemented
- **Connection pool synchronization** before startup
- **Comprehensive schema validation** with detailed reporting
- **Interactive error handling** with user control
- **Automated validation** integrated into startup process

## Status

✅ **COMPLETE**: Enhanced startup scripts with database schema synchronization
✅ **TESTED**: Schema validation working correctly
✅ **INTEGRATED**: Both backend and platform startup scripts enhanced
✅ **DOCUMENTED**: Comprehensive documentation and usage guide

The enhanced startup scripts now provide robust database schema validation and synchronization, preventing the prediction storage failures that previously occurred due to schema inconsistencies.

**Date**: July 18, 2025
**Status**: Production Ready
