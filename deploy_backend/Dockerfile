# Use Python 3.12 as base image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Copy poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Configure poetry: don't create virtual environment (we're in a container)
RUN poetry config virtualenvs.create false

# Install dependencies (production only) - don't install current project as package
RUN poetry install --without dev --no-root

# Copy source code
COPY . .

# Make sure src directory is properly structured
RUN ls -la /app/src/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["poetry", "run", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
# Force Docker rebuild - Sun Jul 13 17:21:45 IST 2025
