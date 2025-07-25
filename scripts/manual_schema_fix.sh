#!/bin/bash
# Manual Database Schema Fix Script

echo "🔧 Manual Database Schema Fix"
echo "=============================="

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running or not accessible"
    echo "Please ensure PostgreSQL is running on localhost:5432"
    exit 1
fi

# Check database connection
echo "🧪 Testing database connection..."
if command -v psql >/dev/null 2>&1; then
    # Try to connect and fix schema
    echo "📊 Checking agents table structure..."
    
    # Create a temporary SQL file for the fix
    cat > /tmp/fix_schema.sql << 'EOF'
-- Fix missing columns in agents table
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check if type column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'type'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE agents ADD COLUMN type VARCHAR(50) DEFAULT 'fundamentals_agent';
        RAISE NOTICE 'Added type column to agents table';
    END IF;
    
    -- Add any other missing columns here
    -- You can add more ALTER TABLE statements as needed
END$$;
EOF

    echo "✅ Schema fix script created"
    echo "🎯 To apply the fix manually, run:"
    echo "   psql -d your_database_name -f /tmp/fix_schema.sql"
    
else
    echo "❌ psql command not found"
    echo "Please install PostgreSQL client tools or use your database management tool"
fi

echo "🔍 Alternative approaches:"
echo "1. Use pgAdmin or similar GUI tool to add the missing column"
echo "2. Run the SQL commands directly in your database"
echo "3. Check your DATABASE_URL environment variable"

echo ""
echo "📋 Manual SQL Commands to run:"
echo "=============================="
echo "ALTER TABLE agents ADD COLUMN type VARCHAR(50) DEFAULT 'fundamentals_agent';"
echo "-- Verify the fix:"
echo "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agents';"
