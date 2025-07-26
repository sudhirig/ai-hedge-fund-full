# 🚀 **AI Hedge Fund Platform - Deployment Guide**

*Complete deployment instructions for all supported platforms*  
*Updated: July 26, 2025*

---

## 🎯 **Quick Start - Recommended Deployment**

### **🥇 Render.com (Recommended)**

**Why Render?**
- ✅ **Zero Configuration**: Uses included `render.yaml` blueprint
- ✅ **Auto-scaling**: Handles traffic spikes automatically  
- ✅ **Reliable**: Fewer deployment errors than alternatives
- ✅ **Integrated**: Database, backend, and frontend in one platform

**One-Click Deployment:**
1. **Fork this repository** to your GitHub account
2. **Go to [render.com](https://render.com)** and sign up/login with GitHub
3. **Click "New +" → "Blueprint"**
4. **Select your forked repository**
5. **Add environment variables** (see below)
6. **Deploy** - Your platform will be live in 5-10 minutes!

**Required Environment Variables:**
```bash
# Financial Data API
FINANCIAL_DATASETS_API_KEY=your_key_here

# AI/LLM APIs (choose at least one)
ANTHROPIC_API_KEY=your_key_here        # Recommended
OPENAI_API_KEY=your_key_here           # Alternative
GROQ_API_KEY=your_key_here             # Fast inference

# Database (auto-configured by Render)
DATABASE_URL=auto_generated_by_render
```

---

## 🐳 **Docker Deployment**

### **Local Development**
```bash
# Clone and start
git clone https://github.com/your-username/ai-hedge-fund.git
cd ai-hedge-fund

# Start with Docker Compose
docker-compose up -d

# Access the platform
open http://localhost:3000
```

### **Production Docker**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d

# With custom environment
cp .env.example .env
# Edit .env with your API keys
docker-compose --env-file .env up -d
```

---

## 🛠️ **Manual Development Setup**

### **Prerequisites**
- **Python 3.8+** and **Poetry**
- **Node.js 16+** and **npm**
- **PostgreSQL 12+** (for production)

### **Backend Setup**
```bash
cd backend
poetry install
cp .env.example .env
# Edit .env with your API keys
poetry run uvicorn api:app --reload
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **Unified Development**
```bash
# Use our enterprise startup scripts
./scripts/start-platform.sh start

# Check status
./scripts/start-platform.sh status

# Stop all services
./scripts/start-platform.sh stop
```

---

## ☁️ **Alternative Cloud Platforms**

### **Vercel + Railway**
- **Frontend**: Deploy to Vercel for optimal React performance
- **Backend**: Deploy to Railway for Python/FastAPI hosting
- **Database**: Use Railway PostgreSQL or external provider

### **AWS/GCP/Azure**
- **Frontend**: S3/CloudFront, Cloud Storage, or Azure Static Web Apps
- **Backend**: ECS/Fargate, Cloud Run, or Azure Container Instances  
- **Database**: RDS, Cloud SQL, or Azure Database for PostgreSQL

### **DigitalOcean**
- **App Platform**: Full-stack deployment with managed database
- **Droplets**: VPS deployment with manual configuration
- **Managed Database**: PostgreSQL with automated backups

---

## 🔧 **Configuration Details**

### **Environment Variables Reference**

#### **Required APIs**
```bash
# Financial Data (Required)
FINANCIAL_DATASETS_API_KEY=your_key_here

# AI/LLM APIs (At least one required)
ANTHROPIC_API_KEY=your_key_here        # Claude models
OPENAI_API_KEY=your_key_here           # GPT models  
GROQ_API_KEY=your_key_here             # Fast inference
DEEPSEEK_API_KEY=your_key_here         # Alternative LLM
```

#### **Database Configuration**
```bash
# PostgreSQL (Production)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Local Development (SQLite fallback)
DATABASE_URL=sqlite:///./ai_hedge_fund.db
```

#### **Platform Configuration**
```bash
# Environment
ENVIRONMENT=production                  # or development
DEBUG=false                            # Set to true for debugging

# Security
SECRET_KEY=your_secret_key_here
CORS_ORIGINS=https://yourdomain.com
```

### **Health Check Endpoints**
```bash
# Backend health
GET /health

# Database connectivity  
GET /health/database

# API key validation
GET /health/apis
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Deployment Fails**
- ✅ **Check API keys**: Ensure all required keys are set
- ✅ **Verify repository**: Confirm latest code is pushed to GitHub
- ✅ **Review logs**: Check deployment logs for specific errors

#### **Backend Not Starting**
- ✅ **Database connection**: Verify DATABASE_URL is correct
- ✅ **Dependencies**: Ensure Poetry dependencies are installed
- ✅ **Port conflicts**: Check if port 8000 is available

#### **Frontend Build Errors**
- ✅ **Node version**: Use Node.js 16+ for compatibility
- ✅ **Clear cache**: Delete node_modules and package-lock.json
- ✅ **Environment**: Check REACT_APP_API_URL is set correctly

#### **Database Issues**
- ✅ **Schema migration**: Run database migrations if needed
- ✅ **Connection pool**: Restart backend to refresh connections
- ✅ **Permissions**: Verify database user has required permissions

### **Getting Help**
- 📖 **Documentation**: Check other guides in this repository
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Ask questions in GitHub Discussions

---

## 📊 **Performance Optimization**

### **Production Recommendations**
- **CDN**: Use CloudFront or similar for frontend assets
- **Caching**: Implement Redis for API response caching
- **Database**: Use connection pooling and read replicas
- **Monitoring**: Set up health checks and alerting

### **Scaling Considerations**
- **Horizontal Scaling**: Deploy multiple backend instances
- **Load Balancing**: Use nginx or cloud load balancers
- **Database Optimization**: Index optimization and query tuning
- **Asset Optimization**: Compress and optimize frontend assets

---

## ⚠️ **Security Best Practices**

### **API Key Management**
- 🔒 **Never commit API keys** to version control
- 🔒 **Use environment variables** for all sensitive data
- 🔒 **Rotate keys regularly** for security
- 🔒 **Limit API key permissions** to minimum required

### **Production Security**
- 🔒 **HTTPS only** - Never deploy without SSL/TLS
- 🔒 **CORS configuration** - Restrict origins to your domain
- 🔒 **Database security** - Use strong passwords and SSL connections
- 🔒 **Regular updates** - Keep dependencies up to date

---

## 📈 **Monitoring & Maintenance**

### **Health Monitoring**
```bash
# Automated health checks
curl https://your-backend.onrender.com/health

# Database connectivity
curl https://your-backend.onrender.com/health/database

# API functionality
curl https://your-backend.onrender.com/health/apis
```

### **Log Monitoring**
- **Backend Logs**: Monitor FastAPI application logs
- **Database Logs**: Track query performance and errors
- **Frontend Logs**: Monitor browser console for client errors

### **Performance Metrics**
- **Response Times**: API endpoint performance
- **Error Rates**: Track 4xx and 5xx responses
- **Resource Usage**: CPU, memory, and database utilization
- **User Analytics**: Track usage patterns and feature adoption

---

*This guide covers all deployment scenarios for the AI Hedge Fund platform. For specific issues or advanced configurations, refer to the platform documentation or create an issue on GitHub.*
