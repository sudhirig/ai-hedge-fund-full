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
        
        # Read and execute schema
        schema_path = Path(__file__).parent / 'schema.sql'
        if schema_path.exists():
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
            
            await conn.execute(schema_sql)
            print("✅ Database schema created successfully")
        else:
            print("⚠️  Schema file not found, skipping schema creation")
        
        # Read and execute initial data
        initial_data_path = Path(__file__).parent / 'initial_data.sql'
        if initial_data_path.exists():
            with open(initial_data_path, 'r') as f:
                initial_data_sql = f.read()
            
            await conn.execute(initial_data_sql)
            print("✅ Initial data populated successfully")
        else:
            print("⚠️  Initial data file not found, skipping data population")
        
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
