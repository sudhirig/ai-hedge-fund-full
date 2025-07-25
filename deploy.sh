#!/bin/bash
# Automated Render Deployment Script

echo "🚀 AI Hedge Fund - Automated Render Deployment"
echo "=============================================="

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found!"
    exit 1
fi

echo "✅ render.yaml found"
echo "📋 Deployment will create:"
echo "   - PostgreSQL Database (ai-hedge-fund-db)"
echo "   - FastAPI Backend (ai-hedge-fund-backend)" 
echo "   - React Frontend (ai-hedge-fund-frontend)"
echo ""
echo "🔑 REQUIRED: Set these environment variables in Render dashboard:"
echo "   - ANTHROPIC_API_KEY"
echo "   - OPENAI_API_KEY" 
echo "   - FINANCIAL_DATASETS_API_KEY"
echo ""
echo "📖 Instructions:"
echo "1. Go to render.com and connect your GitHub repo"
echo "2. Render will auto-detect render.yaml and deploy everything"
echo "3. Set the API keys in environment variables"
echo "4. Database migration will run automatically"
echo ""
echo "🎉 Ready for deployment!"
