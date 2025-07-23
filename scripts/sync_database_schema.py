#!/usr/bin/env python3
"""
Database Schema Synchronization Script

This script ensures that all database connections see the latest schema
by forcing connection pool refresh and validating critical columns.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
load_dotenv()

async def sync_database_schema():
    """Synchronize database schema across all connections"""
    try:
        from src.database.db_manager import DatabaseManager
        
        print("🔄 Starting database schema synchronization...")
        
        # Create fresh database manager
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        print("✅ Database connection established")
        
        # Force connection pool refresh
        await db_manager.close()
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        print("✅ Connection pool refreshed")
        
        # Validate critical schema elements
        async with db_manager.get_connection() as conn:
            # Check agent_predictions table
            predictions_columns = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'agent_predictions'
                AND column_name IN ('position_size_pct', 'agent_id', 'confidence', 'signal')
                ORDER BY column_name;
            """)
            
            required_predictions_columns = {'position_size_pct', 'agent_id', 'confidence', 'signal'}
            found_predictions_columns = {row['column_name'] for row in predictions_columns}
            
            print(f"📊 agent_predictions columns found: {found_predictions_columns}")
            
            if not required_predictions_columns.issubset(found_predictions_columns):
                missing = required_predictions_columns - found_predictions_columns
                raise Exception(f"Missing required columns in agent_predictions: {missing}")
            
            # Check agents table
            agents_columns = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'agents'
                AND column_name IN ('id', 'name', 'display_name', 'type')
                ORDER BY column_name;
            """)
            
            required_agents_columns = {'id', 'name', 'display_name', 'type'}
            found_agents_columns = {row['column_name'] for row in agents_columns}
            
            print(f"📊 agents columns found: {found_agents_columns}")
            
            if not required_agents_columns.issubset(found_agents_columns):
                missing = required_agents_columns - found_agents_columns
                raise Exception(f"Missing required columns in agents: {missing}")
            
            # Check instruments table
            instruments_columns = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'instruments'
                AND column_name IN ('id', 'ticker', 'name')
                ORDER BY column_name;
            """)
            
            required_instruments_columns = {'id', 'ticker', 'name'}
            found_instruments_columns = {row['column_name'] for row in instruments_columns}
            
            print(f"📊 instruments columns found: {found_instruments_columns}")
            
            if not required_instruments_columns.issubset(found_instruments_columns):
                missing = required_instruments_columns - found_instruments_columns
                raise Exception(f"Missing required columns in instruments: {missing}")
            
            # Test a sample prediction insertion
            print("🧪 Testing sample prediction insertion...")
            
            # Get a test agent and instrument
            agent = await conn.fetchrow("SELECT id, display_name FROM agents LIMIT 1")
            instrument = await conn.fetchrow("SELECT id, ticker FROM instruments LIMIT 1")
            
            if not agent or not instrument:
                raise Exception("No test agents or instruments found in database")
            
            # Test insertion (will be rolled back)
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
                agent['id'], instrument['id'], 'bullish', 75.0, '{}',
                '{}', '{}', '{}', None, None, 30, 5.0,
                '1.0', '{}', '{}'
                )
                
                print(f"✅ Test prediction inserted: {test_id}")
                
                # Rollback the transaction
                raise Exception("Test rollback")
        
        await db_manager.close()
        print("✅ Database schema synchronization completed successfully!")
        return True
        
    except Exception as e:
        if "Test rollback" in str(e):
            print("✅ Test insertion successful (rolled back as expected)")
            await db_manager.close()
            print("✅ Database schema synchronization completed successfully!")
            return True
        else:
            print(f"❌ Database schema synchronization failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    success = asyncio.run(sync_database_schema())
    sys.exit(0 if success else 1)
