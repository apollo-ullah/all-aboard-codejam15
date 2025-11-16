# All Aboard - Startup Guide

## Quick Start (Recommended)

### Option 1: Use the Start Script (Easiest)
```bash
./start-servers.sh
```

This will:
- Check for dependencies and install if needed
- Kill any existing processes on ports 3000/3001
- Start both backend and frontend
- Show you the URLs to access

Press `Ctrl+C` to stop both servers.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd allaboard
npm run dev
```

## First-Time Setup

### 1. Configure Environment Variables

The backend `.env` file already exists with API keys. Verify it has:

```bash
cat backend/.env
```

Should show:
- `AGENT_API_KEY` - Browser.cash Agent API key ✅
- `OPENAI_KEY` - OpenAI API key ✅
- `GAMMA_API_KEY` - Gamma API key ✅
- `PORT=3000`
- `FRONTEND_URL=http://localhost:3001`

### 2. Install Dependencies (if not already installed)

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd allaboard
npm install --legacy-peer-deps
```

Note: Use `--legacy-peer-deps` for the frontend due to React 19 compatibility.

### 3. Optional: Setup Playwright (for demo videos)

```bash
cd backend
npm run setup-playwright
```

## Accessing the Application

Once both servers are running:

- **Frontend (Main App):** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Backend Won't Start

1. Check if .env file exists:
   ```bash
   ls backend/.env
   ```

2. Verify API keys are set:
   ```bash
   grep -E "OPENAI_KEY|GAMMA_API_KEY|AGENT_API_KEY" backend/.env
   ```

3. Check for TypeScript compilation errors:
   ```bash
   cd backend
   npm run build
   ```

### Frontend Won't Start

1. Check TypeScript compilation:
   ```bash
   cd allaboard
   npx tsc --noEmit
   ```

2. Try reinstalling dependencies:
   ```bash
   cd allaboard
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

### Cannot Connect to Backend

1. Verify backend is running on port 3000:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check backend logs in terminal for errors

3. Verify CORS is configured for port 3001 (it should be by default)

## Development Workflow

### Running Tests

There is currently **no test suite** configured.

### Linting

**Frontend:**
```bash
cd allaboard
npm run lint
```

Note: ESLint may not be fully configured, but TypeScript checks work.

### Building for Production

**Backend:**
```bash
cd backend
npm run build    # Compiles to dist/
npm start        # Runs production build
```

**Frontend:**
```bash
cd allaboard
npm run build    # Creates .next/ production build
npm start        # Runs production server
```

## Common Issues Fixed

### ✅ TypeScript Compilation Errors
- Fixed `connectionMode` type error in StoryboardCanvas
- Fixed missing `message` property in StoryboardAssistant
- Fixed useRef initialization with undefined

### ✅ Environment Configuration
- Updated `FRONTEND_URL` in backend `.env` from `localhost:5173` to `localhost:3001`
- Verified all required API keys are present

### ✅ Port Conflicts
- Backend runs on port 3000
- Frontend runs on port 3001 (configured in package.json)
- CORS accepts both ports

## API Endpoints

Test the backend with these endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Test connection
curl http://localhost:3000/api/test-connection

# Scrape website (POST)
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (Next.js) - http://localhost:3001    │
│  - React 19 + TypeScript                        │
│  - Glass-morphism UI                            │
│  - React Flow canvas editor                     │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP/REST API
                  │
┌─────────────────▼───────────────────────────────┐
│  Backend (Express) - http://localhost:3000     │
│  - Node.js + TypeScript                         │
│  - Web scraping (Browser.cash)                  │
│  - Storyboard generation (OpenAI GPT-4o)        │
│  - Slide generation (Gamma API)                 │
└─────────────────────────────────────────────────┘
```

## Next Steps

1. Open http://localhost:3001 in your browser
2. Enter a website URL (e.g., https://www.ycombinator.com)
3. Click "Start" to scrape and generate a storyboard
4. Edit the storyboard on the canvas (drag, reorder, edit nodes)
5. Generate slides with Gamma API
6. View the embedded presentation

## Need Help?

- Check backend terminal for API errors
- Check browser console (F12) for frontend errors
- Review WARP.md for detailed architecture documentation
- Check existing documentation:
  - README.md - Project overview
  - PROJECT_SUMMARY.md - Technical details
  - QUICK_START.md - Setup guide
