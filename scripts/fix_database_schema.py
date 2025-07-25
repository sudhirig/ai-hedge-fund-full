#!/usr/bin/env python3
"""
Database Schema Fix Script
Fixes missing columns and schema validation issues
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the root directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.db_manager import DatabaseManager

async def fix_schema_issues():
    """Fix database schema issues"""
    print("🔧 Fixing database schema issues...")
    
    try:
        db = DatabaseManager()
        await db.initialize_pool()
        
        # Check current schema
        async with db.pool.acquire() as conn:
            # Check agents table structure
            result = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'agents'
                ORDER BY ordinal_position;
            """)
            
            print("📊 Current agents table structure:")
            for row in result:
                print(f"  - {row['column_name']}: {row['data_type']}")
            
            # Check if type column exists
            type_exists = await conn.fetchrow("""
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'agents' AND column_name = 'type';
            """)
            
            if not type_exists:
                print("❌ Missing 'type' column - adding it...")
                await conn.execute("""
                    ALTER TABLE agents 
                    ADD COLUMN type VARCHAR(50) DEFAULT 'fundamentals_agent';
                """)
                print("✅ Added 'type' column to agents table")
            
            # Add any other missing columns
            await conn.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                  WHERE table_name = 'agents' AND column_name = 'type') THEN
                        ALTER TABLE agents ADD COLUMN type VARCHAR(50) DEFAULT 'fundamentals_agent';
                    END IF;
                END$$;
            """)
            
        await db.close_pool()
        print("✅ Database schema fixes completed")
        
    except Exception as e:
        print(f"❌ Error fixing schema: {e}")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(fix_schema_issues())
