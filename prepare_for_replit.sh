#!/bin/bash

# Create a directory for the optimized version
mkdir -p /Users/Gautam/ai-hedge-fund-replit

# Copy essential frontend files
echo "Copying frontend files..."
mkdir -p /Users/Gautam/ai-hedge-fund-replit/frontend/src
mkdir -p /Users/Gautam/ai-hedge-fund-replit/frontend/public

# Copy source files
cp -r /Users/Gautam/ai-hedge-fund\ backup/frontend/src/* /Users/Gautam/ai-hedge-fund-replit/frontend/src/
cp -r /Users/Gautam/ai-hedge-fund\ backup/frontend/public/* /Users/Gautam/ai-hedge-fund-replit/frontend/public/

# Copy essential configuration files
cp /Users/Gautam/ai-hedge-fund\ backup/frontend/package.json /Users/Gautam/ai-hedge-fund-replit/frontend/
cp /Users/Gautam/ai-hedge-fund\ backup/frontend/.env.example /Users/Gautam/ai-hedge-fund-replit/frontend/

# Copy backend files
echo "Copying backend files..."
mkdir -p /Users/Gautam/ai-hedge-fund-replit/backend

# Copy Python files
cp /Users/Gautam/ai-hedge-fund\ backup/backend/api.py /Users/Gautam/ai-hedge-fund-replit/backend/
cp /Users/Gautam/ai-hedge-fund\ backup/backend/Procfile /Users/Gautam/ai-hedge-fund-replit/backend/
cp /Users/Gautam/ai-hedge-fund\ backup/backend/render.yaml /Users/Gautam/ai-hedge-fund-replit/backend/

# Copy the pyproject.toml we created
cp /Users/Gautam/ai-hedge-fund\ backup/backend/pyproject.toml /Users/Gautam/ai-hedge-fund-replit/backend/

# Copy root configuration files
echo "Copying configuration files..."
cp /Users/Gautam/ai-hedge-fund\ backup/.replit /Users/Gautam/ai-hedge-fund-replit/
cp /Users/Gautam/ai-hedge-fund\ backup/replit.nix /Users/Gautam/ai-hedge-fund-replit/
cp /Users/Gautam/ai-hedge-fund\ backup/run.sh /Users/Gautam/ai-hedge-fund-replit/
cp /Users/Gautam/ai-hedge-fund\ backup/README.md /Users/Gautam/ai-hedge-fund-replit/

# Create a simplified package.json for the frontend with only essential dependencies
cat > /Users/Gautam/ai-hedge-fund-replit/frontend/package.json << 'EOL'
{
  "name": "ai-hedge-fund-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "proxy": "http://localhost:8000",
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOL

# Create a .gitignore file to exclude unnecessary files
cat > /Users/Gautam/ai-hedge-fund-replit/.gitignore << 'EOL'
# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Build
/frontend/build/
/frontend/dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOL

echo "Optimized project created at /Users/Gautam/ai-hedge-fund-replit"
echo "This version should be small enough to upload to Replit"
