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
npm install
npm run dev         # Start development server with hot reload on port 3000
npm start           # Start production server (requires build first)
```

## Architecture & Key Components

### Frontend (`allaboard/`)

**Main Application** (`app/page.tsx`):
- URL input with glass-morphism design and parallax background
- Multiple modes: Speed, Simple, Advanced
- Stage-based workflow: input → scraping → storyboard editing → slide generation → presentation
- Real-time backend connection testing
- Error handling and user feedback

**Components** (`allaboard/components/`):
- **StoryboardCanvas**: Main editing interface using React Flow for drag-and-drop storyboard editing
- **StoryNode**: Individual editable storyboard nodes with inline editing
- **StoryboardAssistant**: AI-powered editing assistant with chat interface
- **PresentationViewer**: Embedded Gamma presentation viewer with full-screen and keyboard navigation
- **Background**: Parallax background with animated elements
- **UI Components**: Radix UI components (button, input, select, textarea, etc.)

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
- `POST /api/scrape`: Scrape website and generate initial storyboard
- `POST /api/generate-slides`: Convert storyboard to presentation slides
- `POST /api/improve-storyboard`: AI assistant for storyboard editing

## External Dependencies & APIs

**Required API Keys** (configured in `backend/.env`):
- `OPENAI_KEY`: OpenAI GPT-4o for storyboard generation (REQUIRED)
- `GAMMA_API_KEY`: Gamma API for slide generation (REQUIRED) (`https://public-api.gamma.app/v1.0/generations`)
- `AGENT_API_KEY`: Browser.cash Agent API for web scraping (OPTIONAL - will be used once API is fixed) (`https://agent-api.browser.cash`)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3001)
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
- **OpenAI SDK**: LLM integration (backend)
- **Express 5.1.0**: Backend web framework

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
│   │   ├── page.tsx        # Main application page (570+ lines)
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/             # Radix UI wrapper components
│   │   ├── background.tsx  # Parallax background
│   │   ├── StoryboardCanvas.tsx
│   │   ├── StoryNode.tsx
│   │   ├── StoryboardAssistant.tsx
│   │   ├── PresentationViewer.tsx
│   │   └── NarrativeArcButton.tsx
│   ├── lib/                # Utilities and services
│   │   ├── api.ts          # API client
│   │   ├── narrativeArcs.ts
│   │   ├── validation.ts
│   │   └── utils.ts
│   ├── types/              # TypeScript type definitions
│   └── package.json        # Dependencies
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── services/       # Business logic services
│   │   ├── api/            # API routes
│   │   ├── types/          # Type definitions
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Server entry point
│   └── .env.example        # Environment variables template
└── CLAUDE.md               # This file
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

3. **Start servers:**
   ```bash
   # Terminal 1: Start backend
   cd backend && npm run dev

   # Terminal 2: Start frontend
   cd allaboard && npm run dev
   ```

4. **Open app:**
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
