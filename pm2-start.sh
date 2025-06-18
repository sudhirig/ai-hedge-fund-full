#!/bin/bash

# AI Hedge Fund - PM2 Startup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AI Hedge Fund - PM2 Startup${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Stop any existing processes
echo -e "${YELLOW}🧹 Stopping existing PM2 processes...${NC}"
pm2 stop hedge-fund-backend hedge-fund-frontend 2>/dev/null || true
pm2 delete hedge-fund-backend hedge-fund-frontend 2>/dev/null || true

# Validate environment
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
if command -v poetry &> /dev/null; then
    poetry install --no-dev
else
    pip install -r backend/requirements.txt
fi

cd frontend && npm install --silent && cd ..

# Start services with PM2
echo -e "${BLUE}🔧 Starting services with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (optional)
echo -e "${YELLOW}⚙️  Setting up PM2 startup (requires sudo)...${NC}"
read -p "Setup PM2 to auto-start on system boot? (y/N): " setup_startup
if [[ $setup_startup =~ ^[Yy]$ ]]; then
    pm2 startup
    echo -e "${GREEN}✅ PM2 startup configured. Run the command shown above with sudo.${NC}"
fi

# Show status
echo -e "\n${GREEN}🎉 AI Hedge Fund is running with PM2!${NC}"
pm2 list
echo -e "\n${YELLOW}📜 Useful PM2 commands:${NC}"
echo -e "${YELLOW}   pm2 list          - Show running processes${NC}"
echo -e "${YELLOW}   pm2 logs          - Show all logs${NC}"
echo -e "${YELLOW}   pm2 restart all   - Restart all services${NC}"
echo -e "${YELLOW}   pm2 stop all      - Stop all services${NC}"
echo -e "${YELLOW}   pm2 monit         - Monitor processes${NC}"
