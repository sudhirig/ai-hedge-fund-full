#!/usr/bin/env python3
"""
Automated Database Migration for Render Deployment
Runs the complete schema setup and initial data population
"""

import os
import sys
import asyncio
import asyncpg
from pathlib import Path

async def add_missing_columns(conn):
    """Add any missing columns to existing tables"""
    print("🔧 Checking and adding missing columns...")
    
    # Define missing columns that need to be added
    missing_columns = [
        # agent_predictions table
        ("agent_predictions", "position_size_pct", "DECIMAL(5,4) DEFAULT 0.0"),
        ("agent_predictions", "model_version", "VARCHAR(50) DEFAULT 'v1.0'"),
        ("agent_predictions", "feature_vector", "JSONB DEFAULT '{}'"),
        ("agent_predictions", "external_factors", "JSONB DEFAULT '{}'"),
        
        # agents table
        ("agents", "type", "VARCHAR(50) DEFAULT 'hedge_fund'"),
        ("agents", "model_version", "VARCHAR(50) DEFAULT 'v1.0'"),
        ("agents", "risk_tolerance", "VARCHAR(20) DEFAULT 'moderate'"),
        
        # prediction_outcomes table
        ("prediction_outcomes", "market_conditions", "JSONB DEFAULT '{}'"),
        ("prediction_outcomes", "external_factors", "JSONB DEFAULT '{}'"),
        
        # agent_performance table
        ("agent_performance", "risk_adjusted_return", "DECIMAL(10,6) DEFAULT 0.0"),
        ("agent_performance", "max_drawdown", "DECIMAL(10,6) DEFAULT 0.0"),
        ("agent_performance", "volatility", "DECIMAL(10,6) DEFAULT 0.0"),
    ]
    
    for table_name, column_name, column_definition in missing_columns:
        try:
            # Check if column exists
            result = await conn.fetchval(
                """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
                """,
                table_name, column_name
            )
            
            if result == 0:
                # Column doesn't exist, add it
                alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
                await conn.execute(alter_sql)
                print(f"✅ Added column '{column_name}' to table '{table_name}'")
            else:
                print(f"ℹ️  Column '{column_name}' already exists in table '{table_name}'")
                
        except Exception as e:
            print(f"⚠️  Warning: Could not add column '{column_name}' to table '{table_name}': {e}")

async def run_migration():
    """Run the complete database migration"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    print("🚀 Starting AI Hedge Fund Database Migration...")
    
    try:
        # Connect to database
        conn = await asyncpg.connect(database_url)
        print("✅ Connected to PostgreSQL database")
        
        # First, try to create the complete schema (for new databases)
        schema_path = Path(__file__).parent / 'schema.sql'
        if schema_path.exists():
            try:
                with open(schema_path, 'r') as f:
                    schema_sql = f.read()
                
                await conn.execute(schema_sql)
                print("✅ Database schema created successfully")
            except Exception as e:
                print(f"ℹ️  Schema already exists or partial creation: {e}")
                # Continue with migration - this is expected for existing databases
        
        # Add any missing columns to existing tables
        await add_missing_columns(conn)
        
        # Read and execute initial data
        initial_data_path = Path(__file__).parent / 'initial_data.sql'
        if initial_data_path.exists():
            try:
                with open(initial_data_path, 'r') as f:
                    initial_data_sql = f.read()
                
                await conn.execute(initial_data_sql)
                print("✅ Initial data populated successfully")
            except Exception as e:
                print(f"ℹ️  Initial data already exists or partial population: {e}")
        
        # Verify tables were created
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        print(f"✅ Migration complete! Created {len(tables)} tables:")
        for table in tables:
            print(f"   - {table['table_name']}")
        
        await conn.close()
        print("🎉 Database migration successful!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_migration())
