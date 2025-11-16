# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**All Aboard** is an AI-powered platform that democratizes storytelling for builders. It transforms website URLs into professional presentations using AI agents for scraping, GPT-4o for storyboard generation, and Gamma API for slide creation.

The application consists of:
- **Frontend (`allaboard/`)**: Next.js 16 + React 19 + TypeScript with glass-morphism UI, React Flow canvas editor, and embedded presentation viewer
- **Backend (`backend/`)**: Node.js + Express + TypeScript API handling web scraping, storyboard generation, and slide generation

## Development Commands

### Backend (Express API)
```bash
cd backend
npm install
npm run dev              # Start dev server with hot reload on port 3000
npm run build            # Build TypeScript to dist/
npm start                # Start production server (requires build first)
npm run setup-playwright # Install Playwright for demo video generation
```

### Frontend (Next.js)
```bash
cd allaboard
npm install --legacy-peer-deps  # Use --legacy-peer-deps due to React 19
npm run dev              # Start Next.js dev server on port 3001
npm run build            # Build Next.js app for production
npm start                # Start production Next.js server
npm run lint             # Run ESLint
```

### Testing & Debugging
There is currently **no test suite** configured. For debugging:
- Check backend logs in the terminal where `npm run dev` is running
- Check browser console (F12) for frontend errors
- Test backend health: `curl http://localhost:3000/health`
- Test backend connection from frontend: visit http://localhost:3001 and check connection status

## Environment Setup

### Required API Keys
Configure `backend/.env` with:
```bash
# Copy from example
cd backend
cp .env.example .env

# Required keys:
OPENAI_KEY=sk-proj-...        # OpenAI GPT-4o for storyboard generation
GAMMA_API_KEY=...             # Gamma API for slide generation
AGENT_API_KEY=...             # Browser.cash Agent API for web scraping

# Optional:
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

### Frontend Environment (Optional)
Create `allaboard/.env.local` only if backend is not on localhost:3000:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Architecture & Data Flow

### High-Level Flow
1. **URL Input** → User enters website URL in frontend
2. **Web Scraping** → BrowserCashService scrapes main page + up to 5 adjacent pages using Browser.cash Agent API
3. **Storyboard Generation** → LLMService (OpenAI GPT-4o) analyzes scraped content and generates 8-12 structured storyboard nodes
4. **Interactive Editing** → User edits storyboard on React Flow canvas (drag, reorder, edit inline)
5. **Optional: Narrative Arc** → Apply YC or Finance presentation templates via `applyNarrativeArc()`
6. **Optional: AI Assistant** → StoryboardAssistantService provides chat-based editing suggestions
7. **Slide Generation** → SlideGenerator calls Gamma API to create professional presentation
8. **Embedded Viewing** → Presentation displayed in iframe using `https://gamma.app/embed/{id}`

### Backend Services (`backend/src/services/`)

**Core Services:**
- **BrowserCashService**: Web scraping using Browser.cash Agent API (`https://agent-api.browser.cash`)
- **LLMService**: OpenAI GPT-4o integration for analyzing scraped content and generating structured storyboards
- **SlideGenerator**: Gamma API integration (`https://public-api.gamma.app/v1.0/generations`) for presentation generation
- **StoryboardAssistantService**: AI chat assistant for storyboard improvements
- **DemoVideoService**: AI-powered product demo video generator using GPT-4 Vision + Playwright + OpenAI TTS

**Key Technical Details:**
- All services use async/await patterns
- Error handling with try/catch and detailed error messages
- API polling for long-running tasks (Gamma API generation)
- Automatic embed URL construction from Gamma presentation URLs

### Frontend Architecture (`allaboard/`)

**Main Application (`app/page.tsx`):**
- 570+ line component managing stage-based workflow
- Stages: input → scraping → storyboard editing → slide generation → presentation
- Real-time backend connection testing
- Glass-morphism design with parallax background

**Key Components (`components/`):**
- **StoryboardCanvas**: React Flow-based drag-and-drop canvas editor for storyboard nodes
- **StoryNode**: Individual editable storyboard node with inline editing capabilities
- **StoryboardAssistant**: AI-powered chat assistant for storyboard improvements
- **PresentationViewer**: Embedded Gamma presentation viewer with full-screen and keyboard navigation
- **Background**: Parallax background with animated elements
- **DemoVideoGenerator**: UI for AI-powered demo video generation

**Libraries & Utilities (`lib/`):**
- **api.ts**: Axios-based API client with error handling
- **narrativeArcs.ts**: YC and Finance narrative templates with reordering logic (defines optimal slide order for each style)
- **validation.ts**: URL validation utilities
- **utils.ts**: Utility functions (cn helper for Tailwind classes)

**Storyboard Node Types:**
- `title`: Opening/title slides
- `problem`: Problem statement slides
- `solution`: Solution overview slides
- `feature`: Feature/functionality slides
- `benefit`: Benefits/results slides
- `cta`: Call-to-action/closing slides

### API Endpoints

**Backend Routes (`/api`):**
- `GET /health` - Health check endpoint
- `GET /api/test-connection` - Backend connectivity test
- `POST /api/scrape` - Scrape website and generate initial storyboard
  - Request: `{ url: string }`
  - Returns: `{ success: boolean, storyboard: Storyboard, scrapedData: {...} }`
- `POST /api/generate-slides` - Convert storyboard to presentation
  - Request: `{ storyboard: Storyboard, style: 'YC' | 'Finance' }`
  - Returns: `{ success: boolean, presentationUrl: string, embedUrl: string, downloadUrl: string, slideCount: number }`
- `POST /api/improve-storyboard` - AI assistant for storyboard editing
  - Request: `{ storyboard: Storyboard, userMessage: string, style: 'YC' | 'Finance' }`
  - Returns: `{ success: boolean, updatedStoryboard: Storyboard, assistantMessage: string }`
- `POST /api/generate-demo-video` - Generate AI-powered product demo video
- `GET /api/demo-videos` - List available demo videos
- `GET /api/demo-videos/:filename` - Download or stream demo video

## Key Technical Patterns

### Narrative Arc System
The application uses narrative arc templates to optimize presentation structure:
- **YC Arc**: Startup pitch style (Problem → Solution → Market → Product → Traction → Team → Ask)
- **Finance Arc**: Corporate presentation style (Executive Summary → Market Analysis → Financials → Strategy → Risk → Recommendations)
- Implemented in `allaboard/lib/narrativeArcs.ts`
- Nodes can be automatically reordered to match the selected arc

### Presentation Embedding
- Gamma presentations are embedded using iframe with embed URLs
- Automatic conversion from presentation URLs to embed URLs: `https://gamma.app/docs/{id}` → `https://gamma.app/embed/{id}`
- Handles Content Security Policy (CSP) gracefully with fallback to new window
- Full-screen mode and keyboard navigation supported

### React Flow Canvas
- Interactive drag-and-drop interface for storyboard editing
- Nodes can be reordered by dragging
- Inline editing with auto-save to parent state
- Visual indicators for node types (color-coded)

## External API Dependencies

### Browser.cash Agent API
- **Endpoint**: `https://agent-api.browser.cash`
- **Purpose**: AI-powered intelligent web scraping
- **Usage**: Scrapes main page + discovers and scrapes up to 5 adjacent pages (About, Features, etc.)
- **Authentication**: Bearer token via AGENT_API_KEY

### OpenAI API
- **Model**: GPT-4o (gpt-4o)
- **Purpose**: Storyboard generation from scraped content, AI assistant for editing
- **Usage**: Text generation with structured JSON output for storyboards
- **Authentication**: API key via OPENAI_KEY

### Gamma API
- **Endpoint**: `https://public-api.gamma.app/v1.0/generations`
- **Purpose**: Professional presentation generation from storyboards
- **Usage**: POST to create generation, then poll for completion status
- **Authentication**: API key via GAMMA_API_KEY
- **Note**: Returns presentation URL which is converted to embed URL for in-app viewing

### Playwright
- **Purpose**: Browser automation for AI demo video generation
- **Setup**: Run `npm run setup-playwright` in backend
- **Usage**: Automated website navigation and screenshot capture for video generation

## Development Notes

### Port Configuration
- **Backend**: Port 3000 (configurable via PORT in .env)
- **Frontend**: Port 3001 (hardcoded in package.json to avoid conflicts)
- **CORS**: Backend accepts requests from localhost:3001 and localhost:5173 (legacy)

### TypeScript Configuration
- Strict type checking enabled in both frontend and backend
- Types defined in `types/` directories in each package
- Shared types: `StoryNode`, `Storyboard`, `ScrapeResponse`, `GenerateSlidesResponse`

### Styling
- Tailwind CSS 4.1.9 with custom glass-morphism components
- Radix UI components for accessible UI primitives (dialogs, dropdowns, etc.)
- Lucide React for icons
- Custom animations and parallax effects

### React 19 Compatibility
- Frontend uses React 19.2.0 (latest)
- Some dependencies may have peer dependency warnings
- Use `npm install --legacy-peer-deps` when installing allaboard dependencies

### Common Issues
- **CORS errors**: Ensure backend is running and CORS is configured for port 3001
- **API key errors**: Verify all required keys are set in `backend/.env`
- **Build errors with `--legacy-peer-deps`**: This is expected due to React 19; dev mode works fine
- **Network errors during build**: Google Fonts may fail in restricted networks (dev mode works fine)
- **Port conflicts**: Backend must be on 3000, frontend on 3001

## Project Structure

```
all-aboard-codejam15/
├── allaboard/                  # Next.js frontend (MAIN APP)
│   ├── app/
│   │   ├── page.tsx            # Main application (570+ lines)
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # Radix UI wrapper components
│   │   ├── StoryboardCanvas.tsx
│   │   ├── StoryNode.tsx
│   │   ├── StoryboardAssistant.tsx
│   │   ├── PresentationViewer.tsx
│   │   ├── DemoVideoGenerator.tsx
│   │   └── background.tsx
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── narrativeArcs.ts    # YC/Finance templates
│   │   ├── validation.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts            # TypeScript types
│
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── api/
│   │   │   └── routes.ts       # API route handlers
│   │   ├── services/
│   │   │   ├── BrowserCashService.ts
│   │   │   ├── LLMService.ts
│   │   │   ├── SlideGenerator.ts
│   │   │   ├── StoryboardAssistantService.ts
│   │   │   └── DemoVideoService.ts
│   │   ├── types/              # Type definitions
│   │   └── utils/              # Utilities
│   ├── demo_videos/            # Generated demo videos
│   ├── demo_logs/              # Demo generation logs
│   └── .env                    # Environment variables (gitignored)
│
└── Documentation files:
    ├── README.md               # Main project documentation
    ├── CLAUDE.md               # Claude-specific guidance
    ├── PROJECT_SUMMARY.md      # Comprehensive project overview
    ├── QUICK_START.md          # Quick setup guide
    └── DEMO_VIDEO_README.md    # Demo video feature documentation
```

## Quick Start Workflow

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../allaboard && npm install --legacy-peer-deps
   ```

2. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add: OPENAI_KEY, GAMMA_API_KEY, AGENT_API_KEY
   ```

3. **Setup Playwright (optional, for demo videos):**
   ```bash
   cd backend
   npm run setup-playwright
   ```

4. **Start servers (two terminals):**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd allaboard && npm run dev
   ```

5. **Access application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## Hackathon Context

Built for a hackathon to demonstrate:
- AI-powered web scraping with Browser.cash Agent API
- LLM-based content generation and structuring
- Interactive UI/UX with React Flow canvas
- Third-party API integration (Gamma API)
- Real-time presentation generation and embedding

Mission: Democratize storytelling for technical founders, students, and indie hackers by automating the creation of professional presentations from their projects.
