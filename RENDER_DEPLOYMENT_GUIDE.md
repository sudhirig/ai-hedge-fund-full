# 🚀 Render Deployment Guide - AI Hedge Fund Platform

## 🎯 Why Render is Perfect for This Platform
- **Simple deployment** - fewer configuration steps
- **Reliable builds** - less prone to errors than Railway
- **Clear error messages** - easier debugging
- **Optimized configs** - pre-configured for your platform

## 📋 Prerequisites
- GitHub account
- Render account (free tier available)
- Your API keys ready

## 🚀 Step-by-Step Deployment

### Step 1: Push to GitHub
```bash
# If not already done
git init
git add .
git commit -m "AI Hedge Fund Platform - Render Ready"
git remote add origin https://github.com/yourusername/ai-hedge-fund.git
git push -u origin main
```

### Step 2: Deploy PostgreSQL Database
1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "PostgreSQL"
4. Name: `ai-hedge-fund-db`
5. Choose region closest to you
6. Select free tier or paid plan
7. Click "Create Database"
8. **Copy the DATABASE_URL** from database settings

### Step 3: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your `ai-hedge-fund` repository
4. **Root Directory**: `backend`
5. **Runtime**: Python 3
6. Render will auto-detect `render.yaml`

**Environment Variables to Add:**
```
DATABASE_URL=your_postgres_url_from_step_2
FINANCIAL_DATASETS_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ENVIRONMENT=production
DEBUG=false
```

### Step 4: Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Select your `ai-hedge-fund` repository
4. **Root Directory**: `frontend`
5. **Build Command**: `npm install && npm run build`
6. **Publish Directory**: `build`

**Environment Variables to Add:**
```
REACT_APP_API_URL=https://your-backend-name.onrender.com
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
NODE_VERSION=18
```

## 🔧 Configuration Files Created

### Backend (`backend/render.yaml`)
- Optimized Poetry installation
- Health check at `/health`
- Proper timeout settings
- Auto-scaling configuration

### Frontend (`frontend/render.yaml`)
- Static site deployment
- React Router support
- Security headers
- Automatic API URL configuration

## 💰 Cost Breakdown
- **PostgreSQL**: $7/month (or free tier with limitations)
- **Backend Web Service**: $7/month (or free tier)
- **Frontend Static Site**: $0/month (always free)
- **Total**: $0-14/month

## ✅ Post-Deployment Checklist
- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend loads: `https://your-frontend.onrender.com`
- [ ] Database connection working (check backend logs)
- [ ] API calls working between frontend and backend
- [ ] All environment variables set correctly

## 🔍 Troubleshooting Common Issues

### Backend Build Fails
- Check Poetry configuration in logs
- Verify all dependencies in `pyproject.toml`
- Ensure Python version is 3.9

### Frontend Build Fails
- Check Node.js version (should be 18)
- Verify all dependencies in `package.json`
- Check for any missing environment variables

### Database Connection Issues
- Verify DATABASE_URL is correctly set
- Check if database is in same region as backend
- Ensure database is running (not sleeping)

### API Connection Issues
- Verify REACT_APP_API_URL points to correct backend URL
- Check CORS settings if needed
- Ensure backend is responding to health checks

## 🚀 Automatic Deployments
- Push to `main` branch triggers automatic deployment
- Render rebuilds and redeploys automatically
- Check deployment logs for any issues

## 📈 Monitoring
- Render provides real-time logs for all services
- Monitor resource usage in dashboard
- Set up alerts for service failures

## 🎯 Success Indicators
1. **Backend**: Health endpoint returns 200 OK
2. **Frontend**: Application loads without errors
3. **Database**: Backend can connect and query
4. **Integration**: Frontend can make API calls to backend

## 🛠️ If You Encounter Issues
1. Check service logs in Render dashboard
2. Verify environment variables are set correctly
3. Ensure all services are in the same region
4. Contact Render support (they're very responsive)

## 🔄 Updating Your Deployment
- Push changes to GitHub
- Render automatically deploys
- Monitor logs during deployment
- Test functionality after deployment
