# 🚀 AI Hedge Fund Platform

**Enterprise-Grade AI Trading Analysis System**

A sophisticated, production-ready AI-powered hedge fund platform that employs **17+ AI agents** to analyze stocks and make intelligent trading decisions. This system combines the investment philosophies of legendary investors with advanced technical analysis, sentiment analysis, and risk management.

## 🌟 **Key Features**

### **🤖 Multi-Agent AI System**
- **17+ AI Agents** representing famous investors and analytical specialists
- **Real-time analysis** with sub-10-second response times
- **Consensus-driven decisions** with confidence scoring
- **Advanced reasoning** with detailed explanations

### **🎨 Professional Trading Interface**
- **React-based dashboard** with Material-UI components
- **Voice command system** with 50+ natural language patterns
- **Interactive visualizations** with React Flow agent networks
- **Real-time updates** and progressive loading

### **🗄️ Enterprise Database Integration**
- **PostgreSQL backend** with comprehensive analytics
- **Automatic prediction storage** and performance tracking
- **Advanced querying** and historical analysis
- **ML pipeline integration** for continuous improvement

### **☁️ Cloud-Ready Deployment**
- **Render.com integration** for production hosting
- **Docker containerization** for consistent environments
- **Auto-scaling capabilities** and health monitoring
- **CI/CD pipeline ready** with automated testing

## 🧠 **AI Agent Portfolio**

### **Famous Investor Personalities (11 Agents)**
1. **Warren Buffett Agent** - Value investing with long-term perspective
2. **Bill Ackman Agent** - Activist investing with bold positions
3. **Cathie Wood Agent** - Growth and innovation focus
4. **Charlie Munger Agent** - Quality businesses at fair prices
5. **Ben Graham Agent** - Deep value with margin of safety
6. **Phil Fisher Agent** - Growth investing with scuttlebutt analysis
7. **Stanley Druckenmiller Agent** - Macro opportunities and asymmetric bets
8. **Rakesh Jhunjhunwala Agent** - Indian market expertise
9. **Peter Lynch Agent** - Growth at reasonable price (GARP)
10. **Ray Dalio Agent** - Macro economic analysis
11. **George Soros Agent** - Reflexivity theory and market psychology

### **Analytical Specialists (6 Agents)**
1. **Fundamentals Agent** - Financial metrics and ratio analysis
2. **Technical Analysis Agent** - Chart patterns and indicators
3. **Sentiment Analysis Agent** - Market sentiment and news analysis
4. **Valuation Agent** - DCF models and intrinsic value calculations
5. **Risk Management Agent** - Portfolio risk and position sizing
6. **Portfolio Manager Agent** - Final decision making and order generation
    
<img width="1042" alt="Screenshot 2025-03-22 at 6 19 07 PM" src="https://github.com/user-attachments/assets/cbae3dcf-b571-490d-b0ad-3f0f035ac0d4" />


## 🎯 **Live Demo**

**🌐 Production Platform**: [AI Hedge Fund on Render](https://ai-hedge-fund-frontend.onrender.com)

**Note**: The system simulates trading decisions and provides analysis - it does not execute real trades.

[![Twitter Follow](https://img.shields.io/twitter/follow/virattt?style=social)](https://twitter.com/virattt)

## ⚠️ **Disclaimer**

This project is for **educational and research purposes only**.

- 🚫 Not intended for real trading or investment
- 📋 No warranties or guarantees provided
- 📊 Past performance does not indicate future results
- 🛡️ Creator assumes no liability for financial losses
- 💼 Consult a financial advisor for investment decisions

By using this software, you agree to use it solely for learning and research purposes.

---

## 🚀 **Quick Start Guide**

### **🏃‍♂️ Enterprise Startup (Recommended)**

```bash
# Clone the repository
git clone https://github.com/sudhirig/ai-hedge-fund-full.git
cd ai-hedge-fund-full

# Enterprise startup with monitoring
./scripts/start-platform.sh
```

**What this does:**
- ✅ **Backend**: FastAPI server with 17 AI agents
- ✅ **Frontend**: React dashboard with professional UI
- ✅ **Database**: PostgreSQL with analytics
- ✅ **Health Monitoring**: Auto-restart and process supervision
- ✅ **Logging**: Comprehensive logs in `/logs/` directory

### **🛠️ Manual Development Setup**

#### **Prerequisites**
```bash
# Install Poetry (Python dependency management)
curl -sSL https://install.python-poetry.org | python3 -

# Install Node.js (for frontend)
# Download from https://nodejs.org/ or use package manager
```

#### **Backend Setup**
```bash
cd backend
poetry install
poetry run uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

#### **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

#### **Access Points**
- 🖥️ **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- 🔧 **Backend API**: [http://localhost:8000](http://localhost:8000)
- 📊 **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- 📚 **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📋 **Table of Contents**

- [🌟 Key Features](#-key-features)
- [🧠 AI Agent Portfolio](#-ai-agent-portfolio)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [💻 Usage Examples](#-usage-examples)
- [🎨 Professional Interface Features](#-professional-interface-features)
- [☁️ Cloud Deployment](#️-cloud-deployment)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [📊 Performance Optimization](#-performance-optimization)
- [🔧 Development](#-development)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ⚙️ **Environment Configuration**

### **Required API Keys**

Create a `.env` file in the project root:

```bash
# Copy example environment file
cp .env.example .env
```

**Essential API Keys:**
```bash
# LLM Providers (at least one required)
OPENAI_API_KEY=your-openai-api-key          # For GPT models
ANTHROPIC_API_KEY=your-anthropic-api-key    # For Claude models (recommended)
GROQ_API_KEY=your-groq-api-key              # For fast inference
DEEPSEEK_API_KEY=your-deepseek-api-key      # Alternative provider

# Financial Data
FINANCIAL_DATASETS_API_KEY=your-fd-api-key  # For comprehensive market data

# Database (for production)
DATABASE_URL=postgresql://user:pass@host:port/db  # PostgreSQL connection
```

**API Key Sources:**
- 🤖 **OpenAI**: [platform.openai.com](https://platform.openai.com/)
- 🧠 **Anthropic**: [console.anthropic.com](https://console.anthropic.com/) (Recommended for best performance)
- ⚡ **Groq**: [groq.com](https://groq.com/)
- 📊 **Financial Datasets**: [financialdatasets.ai](https://financialdatasets.ai/)

**Free Tier Available:**
- Financial data for AAPL, GOOGL, MSFT, NVDA, TSLA (no API key required)
- Other tickers require Financial Datasets API key

---

## 💻 **Usage Examples**

### **🖥️ Web Interface (Recommended)**

1. Start the platform: `./scripts/start-platform.sh`
2. Open browser: [http://localhost:3000](http://localhost:3000)
3. Navigate to **Professional Trading Interface**
4. Select stocks and run analysis

### **🎤 Voice Commands**

The platform supports 50+ natural language voice commands:

```
"Analyze Apple"                    → Run analysis on AAPL
"Compare Apple and Microsoft"      → Multi-stock comparison
"Talk to Warren Buffett"          → Switch to specific agent
"What's the market doing?"         → Market overview
"Should I buy Tesla?"             → Get buy recommendation
"Show my portfolio"               → Portfolio summary
```

### **⌨️ Command Line Interface**

```bash
# Single stock analysis
poetry run python src/main.py --ticker AAPL

# Multi-stock analysis
poetry run python src/main.py --ticker AAPL,MSFT,NVDA

# Historical analysis
poetry run python src/main.py --ticker AAPL --start-date 2024-01-01 --end-date 2024-03-01

# Show detailed reasoning
poetry run python src/main.py --ticker AAPL --show-reasoning

# Backtesting
poetry run python src/backtester.py --ticker AAPL,MSFT --start-date 2024-01-01 --end-date 2024-12-31
```

---

## 🎨 **Professional Interface Features**

### **📊 Dashboard Components**
- **Portfolio Summary**: Real-time portfolio metrics and performance
- **Agent Performance**: Individual agent tracking with confidence scores
- **Market Insights**: Signal distribution and high-confidence recommendations
- **Trading Decisions**: Interactive decision interface with execution simulation
- **Agent Network**: 3D visualization of agent relationships and collaboration

### **🔊 Voice Intelligence System**
- **Natural Language Processing**: 50+ command patterns across 8 categories
- **Smart Recognition**: Handles company names, ticker symbols, and agent names
- **Real-time Execution**: Voice commands trigger immediate actions
- **Contextual Understanding**: Falls back to contextual analysis for complex queries

### **📈 Interactive Visualizations**
- **React Flow Networks**: Agent collaboration and decision flow visualization
- **Real-time Charts**: Dynamic price and performance charts
- **Agent Timeline**: Step-by-step analysis process visualization
- **Confidence Indicators**: Visual confidence scoring and signal strength

### **🎛️ Professional Controls**
- **Multi-Stock Selection**: Up to 5 stocks with autocomplete
- **Preset Configurations**: Popular combinations (FAANG, Dow Jones, etc.)
- **Date Range Selection**: Historical analysis capabilities
- **Agent Selection**: Choose specific agents or use all 17

## Usage

### Running the Hedge Fund
```bash
poetry run python src/main.py --ticker AAPL,MSFT,NVDA
```

**Example Output:**
<img width="992" alt="Screenshot 2025-01-06 at 5 50 17 PM" src="https://github.com/user-attachments/assets/e8ca04bf-9989-4a7d-a8b4-34e04666663b" />

You can also specify a `--show-reasoning` flag to print the reasoning of each agent to the console.

```bash
poetry run python src/main.py --ticker AAPL,MSFT,NVDA --show-reasoning
```
You can optionally specify the start and end dates to make decisions for a specific time period.

```bash
poetry run python src/main.py --ticker AAPL,MSFT,NVDA --start-date 2024-01-01 --end-date 2024-03-01 
```

### Running the Backtester

```bash
poetry run python src/backtester.py --ticker AAPL,MSFT,NVDA
```

**Example Output:**
<img width="941" alt="Screenshot 2025-01-06 at 5 47 52 PM" src="https://github.com/user-attachments/assets/00e794ea-8628-44e6-9a84-8f8a31ad3b47" />

You can optionally specify the start and end dates to backtest over a specific time period.

```bash
poetry run python src/backtester.py --ticker AAPL,MSFT,NVDA --start-date 2024-01-01 --end-date 2024-03-01
```

## Deploying to Replit

This project can be deployed to Replit for easy sharing and collaboration. Follow these steps:

1. Create a new Replit project
2. Import your code from GitHub or upload the files directly
3. Replit will automatically detect the configuration from the `.replit` and `replit.nix` files
4. Click the "Run" button to start both the backend and frontend servers
5. The application will be available at your Replit URL

The application uses the following configuration for Replit:
- Backend: Python FastAPI running on port 8000
- Frontend: React app running on port 3000
- The `run.sh` script coordinates starting both services

### Replit Environment Variables

If you need to configure API keys or other sensitive information, add them as Replit Secrets in the project settings.

## Project Structure 
```
ai-hedge-fund/
├── src/
│   ├── agents/                   # Agent definitions and workflow
│   │   ├── bill_ackman.py        # Bill Ackman agent
│   │   ├── fundamentals.py       # Fundamental analysis agent
│   │   ├── portfolio_manager.py  # Portfolio management agent
│   │   ├── risk_manager.py       # Risk management agent
│   │   ├── sentiment.py          # Sentiment analysis agent
│   │   ├── technicals.py         # Technical analysis agent
│   │   ├── valuation.py          # Valuation analysis agent
│   │   ├── warren_buffett.py     # Warren Buffett agent
│   ├── tools/                    # Agent tools
│   │   ├── api.py                # API tools
│   ├── backtester.py             # Backtesting tools
│   ├── main.py # Main entry point
├── pyproject.toml
├── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

**Important**: Please keep your pull requests small and focused.  This will make it easier to review and merge.

## Feature Requests

If you have a feature request, please open an [issue](https://github.com/virattt/ai-hedge-fund/issues) and make sure it is tagged with `enhancement`.

## License

---

## 🛠️ **Development**

### **📋 Prerequisites**
- **Python 3.8+**: Required for backend development
- **Node.js 16+**: Required for frontend development
- **PostgreSQL 12+**: Database for production deployment
- **Poetry**: Python dependency management
- **Git**: Version control

### **🔧 Development Setup**

```bash
# Clone the repository
git clone https://github.com/your-username/ai-hedge-fund.git
cd ai-hedge-fund

# Backend setup
cd backend
poetry install
cp .env.example .env
# Edit .env with your API keys

# Frontend setup
cd ../frontend
npm install

# Start development servers
./scripts/start-platform.sh start
```

### **🧪 Testing**

```bash
# Backend tests
cd backend
poetry run pytest

# Frontend tests
cd frontend
npm test

# Integration tests
./scripts/run-tests.sh
```

### **📁 Project Structure**

```
ai-hedge-fund/
├── backend/                 # FastAPI backend
│   ├── src/                # Source code
│   │   ├── agents/         # AI agent implementations
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   └── api.py         # API endpoints
│   ├── tests/             # Backend tests
│   └── pyproject.toml     # Python dependencies
├── frontend/               # React frontend
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── config/        # Configuration
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
├── database/              # Database schemas and migrations
├── scripts/               # Deployment and utility scripts
├── docs/                  # Documentation
└── experiments/           # Performance optimization experiments
```

### **🔍 Code Quality**

```bash
# Python linting and formatting
poetry run black src/
poetry run flake8 src/
poetry run mypy src/

# JavaScript linting and formatting
npm run lint
npm run format
```

---

## 🤝 **Contributing**

### **🌟 How to Contribute**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the coding standards
4. **Add tests**: Ensure your changes are tested
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes

### **📝 Contribution Guidelines**

**Code Standards:**
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript
- Write comprehensive tests for new features
- Update documentation for API changes

**Commit Messages:**
- Use conventional commit format
- Be descriptive and concise
- Reference issues when applicable

**Pull Request Process:**
- Ensure all tests pass
- Update README if needed
- Request review from maintainers
- Address feedback promptly

### **🐛 Bug Reports**

When reporting bugs, please include:
- **Environment**: OS, Python/Node versions
- **Steps to reproduce**: Clear reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Logs**: Relevant error messages

### **💡 Feature Requests**

For new features, please provide:
- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Impact**: Who would benefit?

### **📚 Documentation**

Help improve documentation by:
- Fixing typos and grammar
- Adding examples and tutorials
- Improving API documentation
- Creating video tutorials

---

## ⚖️ **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 **Acknowledgments**

- **Famous Investors**: Inspired by the wisdom of Warren Buffett, Cathie Wood, and other legendary investors
- **Open Source Community**: Built with amazing open-source tools and libraries
- **Financial Data Providers**: Powered by high-quality financial data APIs
- **AI/ML Community**: Leveraging cutting-edge language models and AI research

---

## ⚠️ **Disclaimer**

**This platform is for educational and research purposes only. It does not provide financial advice and should not be used for actual trading decisions. Always consult with qualified financial advisors before making investment decisions. Past performance does not guarantee future results.**

---

<div align="center">

**🚀 Ready to revolutionize your investment analysis? Get started today! 🚀**

[**🌟 Star this repo**](https://github.com/your-username/ai-hedge-fund) • [**🐛 Report Bug**](https://github.com/your-username/ai-hedge-fund/issues) • [**💡 Request Feature**](https://github.com/your-username/ai-hedge-fund/issues)

</div>
