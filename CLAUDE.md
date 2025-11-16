# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**All Aboard** (formerly STORYTEX) is a hackathon project that transforms website URLs into professional slide decks with an interactive storyboard editor. The application consists of two main components:

- **Allaboard** (Next.js 16 + React 19 + TypeScript): Full-featured frontend with beautiful glass-morphism UI, interactive storyboard canvas editor using React Flow, AI-powered editing assistant, and embedded Gamma presentation viewer
- **Backend** (Node.js + Express + TypeScript): API server handling web scraping (Browser.cash), storyboard generation (OpenAI GPT-4o), and slide generation (Gamma API)

## Development Commands

### Allaboard (Next.js Frontend)
```bash
cd allaboard
npm install
npm run dev         # Start Next.js dev server on port 3001
npm run build       # Build Next.js app for production
npm start           # Start production Next.js server
npm run lint        # Run ESLint
```

### Backend (Express API)
```bash
cd backend
npm install                    # Automatically runs Playwright install via postinstall
npm run dev                    # Start development server with hot reload on port 3000
npm run build                  # Build TypeScript to JavaScript
npm start                      # Start production server (requires build first)
npm run setup-playwright       # Manually install Playwright if needed
```

## Architecture & Key Components

### Frontend (`allaboard/`)

**Main Application** (`app/page.tsx`):
- URL input with glass-morphism design and parallax background
- Multiple modes: Speed, Simple, Advanced
- Stage-based workflow: input → scraping → storyboard editing → slide generation → presentation
- Real-time backend connection testing
- Error handling and user feedback
- 866 lines - comprehensive application logic with all workflow stages

**Components** (`allaboard/components/`):
- **StoryboardCanvas**: Main editing interface using React Flow for drag-and-drop storyboard editing
- **StoryNode**: Individual editable storyboard nodes with inline editing
- **StoryboardAssistant**: AI-powered editing assistant with chat interface
- **PresentationViewer**: Embedded Gamma presentation viewer with full-screen and keyboard navigation
- **DemoVideoGenerator**: AI-powered demo video generation interface with progress tracking
- **ScrapingProgress**: Real-time scraping progress visualization with stage indicators
- **AIInsightsPanel**: Display AI-generated insights about scraped content
- **TimeSavingsDisplay**: Visual representation of time saved by automation
- **Background**: Parallax background with animated elements
- **UI Components**: Radix UI components (button, input, select, textarea, etc.) in `components/ui/`

**Services & Utilities** (`allaboard/lib/`):
- **api.ts**: Axios-based API client for backend communication
- **narrativeArcs.ts**: YC and Finance narrative templates and reordering logic
- **validation.ts**: URL validation utilities
- **utils.ts**: Utility functions (cn helper for Tailwind)

**Types** (`allaboard/types/`):
- StoryNode, Storyboard, ScrapeResponse, GenerateSlidesResponse interfaces

### Backend Services (`backend/src/services/`)
- **LLMService**: OpenAI GPT-4o integration for storyboard generation from scraped content
- **BrowserCashService**: Web scraping using Browser.cash Agent API (`https://agent-api.browser.cash`)
- **SlideGenerator**: Gamma API integration for presentation generation (`https://public-api.gamma.app/v1.0/generations`)
- **StoryboardAssistantService**: AI assistant for storyboard editing
- **DemoVideoService**: AI-powered product demo video generator using GPT-4 Vision + Playwright + OpenAI TTS
- **TestDataService**: Test data management and fallback data for development/testing

### Data Flow
1. URL input → BrowserCash scraping (main page + up to 5 adjacent pages)
2. Scraped content → OpenAI GPT-4o → structured storyboard JSON
3. Interactive editing via React Flow canvas with drag-and-drop nodes
4. Optional: Apply narrative arc templates (YC or Finance style) via `applyNarrativeArc()`
5. Optional: AI assistant for storyboard improvements
6. Final storyboard → Gamma API → presentation with embed URL
7. Presentation embedded directly in app using `https://gamma.app/embed/{id}`

### API Endpoints
- `GET /health`: Health check endpoint
- `GET /api/test-connection`: Backend connectivity test
- `GET /api/test-scrape`: Quick test of scraping functionality with example.com
- `GET /api/test-browser-cash`: Test Browser.cash API connection and endpoint discovery
- `GET /api/test-demo-video`: Test demo video generation functionality
- `POST /api/scrape`: Scrape website and generate initial storyboard
- `POST /api/generate-slides`: Convert storyboard to presentation slides
- `POST /api/improve-storyboard`: AI assistant for storyboard editing
- `POST /api/generate-demo-video`: Generate AI-powered product demo video with voice-over
- `GET /api/demo-videos`: List available demo videos
- `GET /api/demo-videos/:filename`: Download or stream a demo video

## External Dependencies & APIs

**Required API Keys** (configured in `backend/.env`):
- `OPENAI_KEY`: OpenAI GPT-4o for storyboard generation and TTS (REQUIRED)
- `GAMMA_API_KEY`: Gamma API for slide generation (REQUIRED) (`https://public-api.gamma.app/v1.0/generations`)
- `AGENT_API_KEY`: Browser.cash Agent API for web scraping (OPTIONAL - will be used once API is fixed) (`https://agent-api.browser.cash`)
- `BROWSER_CASH_API_KEY`: Alternative Browser.cash API key (OPTIONAL)
- `BROWSER_CASH_BASE_URL`: Browser.cash API base URL (OPTIONAL - default: https://dash.browser.cash)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173, supports 3001)
- `PORT`: Backend port (default: 3000)
- `NODE_ENV`: Environment mode (default: development)

**Frontend Environment** (configured in `allaboard/.env.local`):
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)

**Core Libraries**:
- **Next.js 16.0.3**: React framework with Turbopack
- **React 19.2.0**: Latest React with improved performance
- **React Flow (reactflow)**: Canvas-based storyboard editor with drag-and-drop
- **Axios**: HTTP client for API communication
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, etc.)
- **Tailwind CSS 4.1.9**: Utility-first CSS framework
- **Lucide React**: Icon library
- **OpenAI SDK**: LLM integration and TTS for voice-overs (backend)
- **Express 5.1.0**: Backend web framework
- **Playwright 1.48.0**: Browser automation for AI demo videos (backend)

## Development Notes

- **Ports**: Backend runs on port 3000, frontend (allaboard) on port 3001
- **CORS**: Backend accepts requests from FRONTEND_URL (default: localhost:3001) and localhost:5173 (legacy Vite app)
- **TypeScript**: Used throughout with strict type checking
- **Styling**: Glass-morphism design with parallax background and custom animations
- **Storyboard Node Types**: title, problem, solution, feature, benefit, cta
- **Narrative Arcs**: YC (startup pitch) and Finance (corporate presentation) templates
- **No Test Suite**: Currently no automated tests configured
- **Dependencies**: Run with `--legacy-peer-deps` in allaboard due to React 19 compatibility

## Project Structure

```
all-aboard-codejam15/
├── allaboard/              # Next.js frontend application
│   ├── app/                # Next.js app directory
│   │   ├── page.tsx        # Main application page (866 lines)
│   │   ├── layout.tsx      # Root layout
│   │   ├── globals.css     # Global styles
│   │   └── favicon.ico     # Favicon
│   ├── components/         # React components
│   │   ├── ui/             # Radix UI wrapper components (5 components)
│   │   ├── background.tsx  # Parallax background
│   │   ├── StoryboardCanvas.tsx       # Interactive canvas editor
│   │   ├── StoryNode.tsx              # Individual node component
│   │   ├── StoryboardAssistant.tsx    # AI chat assistant
│   │   ├── PresentationViewer.tsx     # Gamma embed viewer
│   │   ├── DemoVideoGenerator.tsx     # Video generation UI
│   │   ├── ScrapingProgress.tsx       # Scraping progress display
│   │   ├── AIInsightsPanel.tsx        # AI insights display
│   │   └── TimeSavingsDisplay.tsx     # Time savings visualization
│   ├── lib/                # Utilities and services
│   │   ├── api.ts          # Axios API client
│   │   ├── narrativeArcs.ts # YC/Finance arc templates
│   │   ├── validation.ts   # URL validation
│   │   └── utils.ts        # General utilities
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Main type exports
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── services/       # Business logic services
│   │   │   ├── LLMService.ts
│   │   │   ├── BrowserCashService.ts
│   │   │   ├── SlideGenerator.ts
│   │   │   ├── StoryboardAssistantService.ts
│   │   │   ├── DemoVideoService.ts
│   │   │   └── TestDataService.ts
│   │   ├── api/            # API routes
│   │   │   └── routes.ts   # All API endpoints
│   │   ├── types/          # Type definitions
│   │   │   └── index.ts
│   │   ├── utils/          # Utilities
│   │   │   └── validation.ts
│   │   └── index.ts        # Server entry point
│   ├── demo_videos/        # Generated demo videos (gitignored)
│   ├── demo_logs/          # Demo generation logs (gitignored)
│   ├── .env.example        # Environment variables template
│   └── package.json        # Dependencies
├── CLAUDE.md               # This file - AI assistant guidance
├── README.md               # Project README
├── PROJECT_SUMMARY.md      # Comprehensive project documentation
├── QUICK_START.md          # Quick start guide
├── START_SERVERS.md        # Server management
├── DEMO_VIDEO_README.md    # Demo video feature docs
├── QUICKSTART_DEMO_VIDEO.md # Demo video quick start
└── INTEGRATION_GUIDE.md    # Integration documentation
```

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../allaboard && npm install --legacy-peer-deps
   ```

2. **Configure environment:**
   - Copy `backend/.env.example` to `backend/.env`
   - Add required API keys: OPENAI_KEY, GAMMA_API_KEY
   - Optionally add AGENT_API_KEY (Browser.cash - currently unused)
   - Optionally create `allaboard/.env.local` with NEXT_PUBLIC_API_URL if backend is not on localhost:3000

3. **Setup Playwright (for demo video generation):**
   ```bash
   cd backend
   npm run setup-playwright
   # Note: Playwright is also auto-installed via postinstall hook when you run npm install
   ```

4. **Start servers:**
   ```bash
   # Terminal 1: Start backend
   cd backend && npm run dev

   # Terminal 2: Start frontend
   cd allaboard && npm run dev
   ```

5. **Open app:**
   - Navigate to http://localhost:3001
   - Enter a website URL
   - Wait for AI to generate storyboard
   - Edit storyboard interactively
   - Generate slides with GAMMA

## Common Issues

- **CORS errors**: Ensure backend is running and CORS is configured for port 3001
- **API key errors**: Check all required API keys are set in `backend/.env`
- **Build errors**: Use `npm install --legacy-peer-deps` for allaboard
- **Network errors during build**: Google Fonts may fail in restricted networks (dev mode works fine)
- **Playwright installation fails**: Run `npm run setup-playwright` manually or install with `--with-deps` flag
- **Demo video generation fails**: Ensure Playwright Chromium is installed and OPENAI_KEY is configured
- **Browser.cash API issues**: The API is currently being tested; fallback test data is available via TestDataService

## Additional Documentation

This repository includes comprehensive documentation:
- **CLAUDE.md** (this file): AI assistant guidance and development workflows
- **README.md**: Project overview and quick start
- **PROJECT_SUMMARY.md**: Comprehensive technical documentation
- **QUICK_START.md**: Streamlined setup instructions
- **START_SERVERS.md**: Server management commands
- **DEMO_VIDEO_README.md**: Demo video generation feature documentation
- **QUICKSTART_DEMO_VIDEO.md**: Quick start for demo video feature
- **INTEGRATION_GUIDE.md**: Integration and API documentation

## Development Workflows

### Adding New Components
1. Create component in `allaboard/components/`
2. Use TypeScript with proper type annotations
3. Follow existing patterns (glass-morphism UI, Radix components)
4. Import and integrate in `app/page.tsx`

### Adding New API Endpoints
1. Add route handler in `backend/src/api/routes.ts`
2. Create/use appropriate service in `backend/src/services/`
3. Add types to `backend/src/types/index.ts` if needed
4. Update CORS configuration if needed
5. Add endpoint to API client in `allaboard/lib/api.ts`

### Adding New Services
1. Create service file in `backend/src/services/`
2. Follow TypeScript class-based pattern
3. Add error handling and logging
4. Export and import in routes.ts

## Testing & Debugging

### Testing Backend API
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test scraping
curl http://localhost:3000/api/test-scrape

# Test Browser.cash connection
curl http://localhost:3000/api/test-browser-cash

# Test demo video generation
curl http://localhost:3000/api/test-demo-video
```

### Frontend Debugging
- Check browser console for errors
- Verify backend connection indicator in UI
- Check Network tab for API call failures
- Inspect React Flow state in React DevTools

### Backend Debugging
- Check server console for errors and logs
- Review demo_logs/ for video generation logs
- Test individual services with test endpoints
- Verify environment variables are loaded correctly
