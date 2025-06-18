#!/bin/bash

# Create a .env file for the frontend to connect to the backend
echo "Setting up environment..."
cd frontend
echo "REACT_APP_API_URL=http://localhost:8000" > .env
cd ..

# Install dependencies for backend
echo "Installing backend dependencies..."
cd backend
pip install poetry
poetry config virtualenvs.create false
poetry install

# Install dependencies for frontend
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Start the backend server
echo "Starting backend server..."
cd ../backend
uvicorn api:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Give the backend a moment to start up
sleep 5

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
NODE_OPTIONS=--openssl-legacy-provider npm start &
FRONTEND_PID=$!

# Print URLs
echo "\n\n=================================================="
echo "Backend API running at: http://localhost:8000"
echo "Frontend running at: http://localhost:3000"
echo "==================================================\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
