#!/bin/bash

# Start All Aboard - Backend and Frontend Servers
# This script starts both the backend and frontend in separate processes

set -e

echo "🚀 Starting All Aboard servers..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo "Please create backend/.env with your API keys:"
    echo "  cd backend"
    echo "  cp .env.example .env"
    echo "  # Edit .env and add your API keys"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not installed. Installing...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "allaboard/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed. Installing...${NC}"
    cd allaboard && npm install --legacy-peer-deps && cd ..
fi

# Kill any existing processes on ports 3000 and 3001
echo "🧹 Cleaning up any existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Starting backend on port 3000...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

echo ""
echo -e "${GREEN}✅ Starting frontend on port 3001...${NC}"
cd allaboard && npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}🎉 Both servers are starting!${NC}"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C and kill both processes
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
