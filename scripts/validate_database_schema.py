#!/usr/bin/env python3
"""
Enhanced Database Schema Validation and Synchronization Script

This script ensures database schema consistency before backend startup,
preventing the schema inconsistency issues that caused prediction storage failures.
"""

import asyncio
import sys
import os
from pathlib import Path
import json
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
load_dotenv()

async def validate_and_sync_database_schema():
    """Validate and synchronize database schema for startup"""
    try:
        print("🔄 Starting database schema validation and synchronization...")
        
        from src.database.db_manager import DatabaseManager
        
        # Create fresh database manager
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        print("✅ Database connection established")
        
        # Force connection pool refresh to ensure latest schema
        print("🔄 Refreshing database connection pool...")
        await db_manager.close()
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        print("✅ Connection pool refreshed")
        
        # Validate critical schema elements
        print("🧪 Validating database schema...")
        
        async with db_manager.get_connection() as conn:
            # Check agent_predictions table schema
            predictions_result = await conn.fetch("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'agent_predictions'
                AND column_name IN ('position_size_pct', 'agent_id', 'confidence', 'signal', 'reasoning')
                ORDER BY column_name;
            """)
            
            required_predictions_columns = {
                'position_size_pct', 'agent_id', 'confidence', 'signal', 'reasoning'
            }
            found_predictions_columns = {row['column_name'] for row in predictions_result}
            
            print(f"📊 agent_predictions columns validated: {len(found_predictions_columns)}/{len(required_predictions_columns)}")
            
            if not required_predictions_columns.issubset(found_predictions_columns):
                missing = required_predictions_columns - found_predictions_columns
                raise Exception(f"❌ Missing required columns in agent_predictions: {missing}")
            
            # Check agents table schema
            agents_result = await conn.fetch("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'agents'
                AND column_name IN ('id', 'name', 'display_name', 'type', 'is_active')
                ORDER BY column_name;
            """)
            
            required_agents_columns = {'id', 'name', 'display_name', 'type', 'is_active'}
            found_agents_columns = {row['column_name'] for row in agents_result}
            
            print(f"📊 agents columns validated: {len(found_agents_columns)}/{len(required_agents_columns)}")
            
            if not required_agents_columns.issubset(found_agents_columns):
                missing = required_agents_columns - found_agents_columns
                raise Exception(f"❌ Missing required columns in agents: {missing}")
            
            # Check instruments table schema
            instruments_result = await conn.fetch("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'instruments'
                AND column_name IN ('id', 'ticker', 'name', 'market', 'currency')
                ORDER BY column_name;
            """)
            
            required_instruments_columns = {'id', 'ticker', 'name', 'market', 'currency'}
            found_instruments_columns = {row['column_name'] for row in instruments_result}
            
            print(f"📊 instruments columns validated: {len(found_instruments_columns)}/{len(required_instruments_columns)}")
            
            if not required_instruments_columns.issubset(found_instruments_columns):
                missing = required_instruments_columns - found_instruments_columns
                raise Exception(f"❌ Missing required columns in instruments: {missing}")
            
            # Test database connectivity and basic operations
            print("🧪 Testing database operations...")
            
            # Count existing records
            agent_count = await conn.fetchval("SELECT COUNT(*) FROM agents WHERE is_active = true;")
            instrument_count = await conn.fetchval("SELECT COUNT(*) FROM instruments;")
            prediction_count = await conn.fetchval("SELECT COUNT(*) FROM agent_predictions;")
            
            print(f"📊 Database statistics:")
            print(f"  Active agents: {agent_count}")
            print(f"  Instruments: {instrument_count}")
            print(f"  Predictions: {prediction_count}")
            
            # Test a sample prediction insertion (will be rolled back)
            print("🧪 Testing prediction insertion capability...")
            
            if agent_count > 0 and instrument_count > 0:
                # Get sample agent and instrument
                agent = await conn.fetchrow("SELECT id, display_name FROM agents WHERE is_active = true LIMIT 1;")
                instrument = await conn.fetchrow("SELECT id, ticker FROM instruments LIMIT 1;")
                
                if agent and instrument:
                    # Test insertion in a transaction (will be rolled back)
                    async with conn.transaction():
                        test_id = await conn.fetchval("""
                            INSERT INTO agent_predictions (
                                agent_id, instrument_id, signal, confidence, reasoning,
                                market_conditions, financial_metrics, price_data,
                                target_price, stop_loss, time_horizon_days, position_size_pct,
                                model_version, feature_vector, external_factors
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                            RETURNING id
                        """,
                        agent['id'], instrument['id'], 'bullish', 50.0, '{"test": "schema_validation"}',
                        '{}', '{}', '{}', None, None, 30, None,
                        '1.0', '{}', '{}'
                        )
                        
                        print(f"✅ Test prediction insertion successful: {test_id}")
                        
                        # Rollback the transaction
                        raise Exception("Test rollback - schema validation complete")
            else:
                print("⚠️  No agents or instruments found - skipping insertion test")
        
        await db_manager.close()
        
        # Generate validation report
        validation_report = {
            "timestamp": datetime.now().isoformat(),
            "status": "success",
            "database_connection": "healthy",
            "schema_validation": "passed",
            "agent_predictions_table": "validated",
            "agents_table": "validated", 
            "instruments_table": "validated",
            "prediction_insertion": "tested",
            "statistics": {
                "active_agents": agent_count,
                "instruments": instrument_count,
                "predictions": prediction_count
            }
        }
        
        # Save validation report
        report_path = project_root / "logs" / "schema_validation_report.json"
        report_path.parent.mkdir(exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(validation_report, f, indent=2)
        
        print(f"✅ Validation report saved: {report_path}")
        print("🎉 Database schema validation and synchronization completed successfully!")
        
        return True
        
    except Exception as e:
        if "Test rollback" in str(e):
            print("✅ Test insertion successful (rolled back as expected)")
            
            # Generate success report
            validation_report = {
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "database_connection": "healthy",
                "schema_validation": "passed",
                "test_insertion": "successful"
            }
            
            report_path = project_root / "logs" / "schema_validation_report.json"
            report_path.parent.mkdir(exist_ok=True)
            
            with open(report_path, 'w') as f:
                json.dump(validation_report, f, indent=2)
            
            print("🎉 Database schema validation and synchronization completed successfully!")
            return True
        else:
            print(f"❌ Database schema validation failed: {e}")
            
            # Generate failure report
            validation_report = {
                "timestamp": datetime.now().isoformat(),
                "status": "failed",
                "error": str(e),
                "database_connection": "unknown",
                "schema_validation": "failed"
            }
            
            report_path = project_root / "logs" / "schema_validation_report.json"
            report_path.parent.mkdir(exist_ok=True)
            
            with open(report_path, 'w') as f:
                json.dump(validation_report, f, indent=2)
            
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    success = asyncio.run(validate_and_sync_database_schema())
    sys.exit(0 if success else 1)
