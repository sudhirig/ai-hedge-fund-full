# 🔔 **Better Stack Monitoring Setup**

*Critical external monitoring for Render backend stability*  
*Implementation Priority: IMMEDIATE*

---

## 🎯 **Why This is Critical**

**Current Problem:**
- Backend goes down without warning
- Users report issues before you know about them
- No visibility into performance degradation
- Manual monitoring is unreliable

**Solution:**
- Proactive alerts before user impact
- Performance trend monitoring
- Automatic incident detection
- 24/7 monitoring coverage

---

## 📋 **Setup Instructions**

### **Step 1: Create Better Stack Account**
1. Go to [betterstack.com](https://betterstack.com)
2. Sign up for free trial (14 days)
3. Choose "Uptime Monitoring" plan ($29/month after trial)

### **Step 2: Add Monitoring Endpoints**

**Primary Health Check:**
```
URL: https://ai-hedge-fund-backend.onrender.com/health
Method: GET
Check Interval: 30 seconds
Timeout: 10 seconds
Expected Status: 200
```

**API Functionality Check:**
```
URL: https://ai-hedge-fund-backend.onrender.com/api/agents
Method: GET
Check Interval: 60 seconds
Timeout: 15 seconds
Expected Status: 200
```

**Frontend Availability:**
```
URL: https://ai-hedge-fund-frontend.onrender.com/
Method: GET
Check Interval: 60 seconds
Timeout: 10 seconds
Expected Status: 200
```

### **Step 3: Configure Alert Thresholds**

**Critical Alerts (Immediate):**
- Downtime > 30 seconds
- Response time > 10 seconds
- HTTP errors (4xx/5xx)
- SSL certificate issues

**Warning Alerts (5 minutes):**
- Response time > 5 seconds
- Intermittent failures (>10% error rate)
- Performance degradation trends

### **Step 4: Set Up Notification Channels**

**Email Alerts:**
```
Primary: your-email@domain.com
Escalation: backup-email@domain.com
```

**Slack Integration (Optional):**
```
Webhook URL: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
Channel: #alerts or #backend-monitoring
```

**SMS Alerts (Critical Only):**
```
Phone: +1-XXX-XXX-XXXX
For: Downtime > 2 minutes
```

---

## ⚡ **Quick Setup Script**

**Better Stack API Configuration:**
```bash
# Install Better Stack CLI (optional)
npm install -g @betterstack/cli

# Configure monitoring via API
curl -X POST "https://uptime.betterstack.com/api/v2/monitors" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monitor": {
      "url": "https://ai-hedge-fund-backend.onrender.com/health",
      "monitor_type": "status",
      "check_frequency": 30,
      "request_timeout": 10,
      "confirmation_period": 30,
      "monitor_group_id": null,
      "pronounceable_name": "AI Hedge Fund Backend Health",
      "recovery_period": 60,
      "verify_ssl": true,
      "check_regions": ["us", "eu"],
      "expected_status_codes": [200],
      "policy_id": null
    }
  }'
```

---

## 🚨 **Alert Configuration**

### **Incident Response Matrix**

| Alert Type | Response Time | Action |
|------------|---------------|---------|
| **Backend Down** | Immediate | Check Render dashboard, restart if needed |
| **High Response Time** | 5 minutes | Monitor trends, scale if persistent |
| **SSL Issues** | 1 hour | Check certificate renewal |
| **Frontend Down** | 5 minutes | Check deployment status |

### **Escalation Policy**
```
Level 1: Email alert immediately
Level 2: SMS after 2 minutes downtime
Level 3: Slack notification for team
Level 4: Phone call after 5 minutes (critical)
```

---

## 📊 **Monitoring Dashboard**

**Key Metrics to Track:**
- **Uptime Percentage** (target: >99.5%)
- **Response Time** (target: <3 seconds)
- **Error Rate** (target: <1%)
- **Availability Trends** (daily/weekly)

**Performance Baselines:**
```
Health Check: <500ms
API Calls: <3 seconds
Frontend Load: <2 seconds
Database Queries: <1 second
```

---

## 🔧 **Integration with Render**

**Render Webhook Integration:**
```javascript
// Add to render.yaml (optional)
services:
  - type: web
    name: ai-hedge-fund-backend
    # ... existing config
    envVars:
      - key: BETTERSTACK_WEBHOOK_URL
        value: "https://uptime.betterstack.com/webhooks/YOUR_WEBHOOK_ID"
```

**Health Check Enhancement:**
```python
# Add to backend/api.py health endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check with Better Stack integration."""
    try:
        health_data = {
            "status": "healthy",
            "timestamp": time.time(),
            "instance_id": os.getenv("RENDER_INSTANCE_ID", "unknown"),
            "version": "1.0.0",
            "uptime": get_uptime(),
            "memory_usage": get_memory_usage(),
            "database": await check_database_health(),
            "external_apis": await check_external_apis()
        }
        
        # Send metrics to Better Stack (optional)
        if os.getenv("BETTERSTACK_WEBHOOK_URL"):
            await send_metrics_to_betterstack(health_data)
        
        return health_data
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "error": str(e),
                "timestamp": time.time()
            }
        )
```

---

## 💰 **Cost Justification**

**Better Stack Pricing:**
- **Free Trial**: 14 days (start immediately)
- **Pro Plan**: $29/month
- **Value**: Prevents revenue loss from undetected downtime

**ROI Calculation:**
```
Cost of 1 hour downtime: $X (user frustration, lost opportunities)
Better Stack cost per hour: $0.04 ($29/month ÷ 720 hours)
Break-even: Prevents >1 hour downtime per month
```

---

## 🚀 **Implementation Timeline**

**Today (30 minutes):**
1. Create Better Stack account
2. Add 3 monitoring endpoints
3. Configure email alerts
4. Test alert delivery

**This Week:**
1. Fine-tune alert thresholds
2. Add Slack integration
3. Set up escalation policies
4. Create monitoring dashboard

---

## ✅ **Success Metrics**

**Week 1:**
- [ ] Zero undetected outages
- [ ] <2 minute alert response time
- [ ] 100% alert delivery success

**Month 1:**
- [ ] >99.5% uptime achieved
- [ ] <30 second incident detection
- [ ] Proactive issue prevention

---

## 🔗 **Quick Links**

- **Better Stack Dashboard**: [app.betterstack.com](https://app.betterstack.com)
- **Documentation**: [docs.betterstack.com](https://docs.betterstack.com)
- **API Reference**: [betterstack.com/docs/uptime/api](https://betterstack.com/docs/uptime/api)
- **Status Page**: Create public status page for transparency

---

**🎯 IMMEDIATE ACTION REQUIRED:**
**Go to betterstack.com RIGHT NOW and set up monitoring for your backend. This is the single most important improvement you can make today.**
