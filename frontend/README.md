# AI Hedge Fund Frontend

This is the frontend React app for the AI Hedge Fund project. It provides a modern, interactive UI/UX to showcase the platform's capabilities: agent runs, backtests, portfolio simulation, and more.

## Features
- Run multi-agent hedge fund simulations
- Visualize portfolio and agent signals
- Interactive stock/portfolio selection
- View reasoning, confidence, and signal breakdowns
- Beautiful, modern Material UI design

## Getting Started

1. `cd frontend`
2. `npm install`
3. `npm start`

## Deployment

### Deploying to Netlify

1. Create a Netlify account at [netlify.com](https://www.netlify.com/)
2. Install the Netlify CLI: `npm install -g netlify-cli`
3. Login to Netlify: `netlify login`
4. Deploy from the frontend directory:
   ```
   cd frontend
   netlify deploy
   ```
5. Follow the prompts to set up your site
6. For production deployment: `netlify deploy --prod`

### Environment Configuration

The application uses environment variables for configuration:

- `REACT_APP_API_URL`: URL of the backend API (e.g., "https://your-backend-api.com")

You can set these in the Netlify dashboard under Site settings > Build & deploy > Environment variables.

---

The frontend expects the Python backend to be running and accessible via HTTP API endpoints. For production deployment, you'll need to deploy the backend to a server and configure the frontend to use that backend URL.
