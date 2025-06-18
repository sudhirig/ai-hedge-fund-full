# AI Hedge Fund Backend

This is the backend API for the AI Hedge Fund project. It provides the simulation engine and API endpoints for the frontend application.

## Getting Started

1. Make sure you have Poetry installed: https://python-poetry.org/docs/#installation
2. Install dependencies:
   ```
   cd backend
   poetry install
   ```
3. Run the API server:
   ```
   poetry run uvicorn api:app --reload
   ```

## Deployment Options

### Deploying to Heroku

1. Create a Heroku account at [heroku.com](https://www.heroku.com/)
2. Install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
3. Login to Heroku: `heroku login`
4. Create a new Heroku app: `heroku create ai-hedge-fund-api`
5. Add the Python buildpack: `heroku buildpacks:set heroku/python`
6. Deploy the backend:
   ```
   git subtree push --prefix backend heroku main
   ```

### Deploying to Render

1. Create a Render account at [render.com](https://render.com/)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `pip install poetry && poetry install`
   - Start Command: `poetry run uvicorn api:app --host 0.0.0.0 --port $PORT`
   - Set the root directory to `/backend`

### Deploying to DigitalOcean App Platform

1. Create a DigitalOcean account at [digitalocean.com](https://www.digitalocean.com/)
2. Create a new App
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `pip install poetry && poetry install`
   - Run Command: `poetry run uvicorn api:app --host 0.0.0.0 --port $PORT`
   - Set the source directory to `/backend`

## CORS Configuration

The API is configured to allow requests from all origins. For production, you may want to restrict this to only your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Environment Variables

The backend doesn't currently use environment variables, but you can add them for configuration as needed.
