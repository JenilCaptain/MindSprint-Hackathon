#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd Back/server
npm install
npm run dev &
BACKEND_PID=$!

# Start the frontend server
echo "Starting frontend server..."
cd ../../Front
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend server started with PID: $BACKEND_PID"
echo "Frontend server started with PID: $FRONTEND_PID"
echo "Backend running on: http://localhost:5000"
echo "Frontend running on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to handle cleanup
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
