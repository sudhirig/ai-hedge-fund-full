#!/bin/bash
# AI Hedge Fund Database Setup Script
# Creates PostgreSQL database and user for the AI Hedge Fund platform

set -e

DB_NAME="ai_hedge_fund_db"
DB_USER="ai_hedge_fund_user"
DB_PASSWORD="${DB_PASSWORD:-ai_hedge_fund_secure_password_2025}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "🚀 Setting up AI Hedge Fund Database..."

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL service first:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database and user (as postgres superuser)
echo "📝 Creating database and user..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "
DO \$\$
BEGIN
    -- Create database if not exists
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE $DB_NAME;
        RAISE NOTICE 'Database $DB_NAME created successfully';
    ELSE
        RAISE NOTICE 'Database $DB_NAME already exists';
    END IF;
    
    -- Create user if not exists
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'User $DB_USER created successfully';
    ELSE
        RAISE NOTICE 'User $DB_USER already exists';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
" 2>/dev/null || echo "Note: Some operations may require PostgreSQL superuser privileges"

# Apply schema
echo "🏗️  Applying database schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/schema.sql"

echo "✅ Schema applied successfully"

# Create PostgREST user and roles
echo "🔐 Setting up PostgREST authentication..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
-- Create web_anon role for PostgREST
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
        RAISE NOTICE 'Role web_anon created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '$DB_PASSWORD';
        RAISE NOTICE 'Role authenticator created successfully';
    END IF;
END
\$\$;

-- Grant necessary permissions
GRANT web_anon TO authenticator;
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_anon;

-- Grant future table permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO web_anon;

-- Create JWT check function
CREATE OR REPLACE FUNCTION public.check_jwt() RETURNS void AS \$\$
BEGIN
    -- Basic JWT validation placeholder
    -- In production, implement proper JWT validation
    NULL;
END;
\$\$ LANGUAGE plpgsql;
"

# Test database connection
echo "🧪 Testing database connection..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    'Database connection successful!' as status,
    current_database() as database,
    current_user as user,
    version() as postgresql_version;

-- Count tables
SELECT 
    count(*) as total_tables,
    'Schema loaded successfully' as message
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
" --quiet

echo ""
echo "🎉 AI Hedge Fund Database Setup Complete!"
echo ""
echo "📊 Database Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""
echo "🔗 Connection String:"
echo "   postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start PostgREST: postgrest database/postgrest.conf"
echo "   2. Update .env file with database credentials"
echo "   3. Run the AI Hedge Fund backend with database integration"
echo ""
