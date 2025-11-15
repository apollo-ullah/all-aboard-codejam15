# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Product Storyteller is a hackathon project that transforms website URLs into professional slide decks with an interactive storyboard editor. The application consists of three main components:

- **Frontend** (React + TypeScript + Vite): Interactive storyboard canvas editor using React Flow
- **Backend** (Node.js + Express + TypeScript): API server handling web scraping and AI generation  
- **Allaboard** (Next.js): Additional frontend component (appears to be a separate Next.js app)

## Development Commands

### Backend (Express API)
```bash
cd backend
npm install
npm run dev          # Start development server with hot reload on port 3000
npm run build        # Compile TypeScript to dist/
npm start           # Start production server from dist/
```

### Frontend (React + Vite)  
```bash
cd frontend
npm install
npm run dev         # Start Vite dev server on port 5173
npm run build       # Build for production (runs tsc && vite build)
npm run preview     # Preview production build
```

### Allaboard (Next.js)
```bash
cd allaboard
npm install
npm run dev         # Start Next.js dev server
npm run build       # Build Next.js app
npm start          # Start production Next.js server
npm run lint       # Run ESLint
```

## Architecture & Key Components

### Backend Services (`backend/src/services/`)
- **LLMService**: OpenAI GPT-4o integration for storyboard generation from scraped content
- **BrowserCashService**: Web scraping using Browser.cash Agent API
- **SlideGenerator**: GAMMA API integration for presentation generation
- **StoryboardAssistantService**: AI assistant for storyboard editing

### Frontend Components (`frontend/src/components/`)
- **StoryboardCanvas**: Main editing interface using React Flow for drag-and-drop storyboard editing
- **StoryNode**: Individual editable storyboard nodes
- **StoryboardAssistant**: AI-powered editing assistant
- **PresentationViewer**: Embedded presentation viewer with download functionality

### Data Flow
1. URL input → BrowserCash scraping (main page + up to 5 adjacent pages)
2. Scraped content → OpenAI GPT-4o → structured storyboard JSON
3. Interactive editing via React Flow canvas
4. Final storyboard → GAMMA API → downloadable PPTX

### API Endpoints
- `POST /api/scrape`: Scrape website and generate initial storyboard
- `POST /api/generate-slides`: Convert storyboard to presentation slides
- `GET /api/test-connection`: Backend connectivity test

## External Dependencies & APIs

**Required API Keys** (configured in backend/.env):
- `OPENAI_API_KEY`: OpenAI GPT-4o for storyboard generation
- `BROWSER_CASH_API_KEY`: Browser.cash Agent API for web scraping
- `GAMMA_API_KEY`: GAMMA API v1.0 for slide generation

**Core Libraries**:
- React Flow (reactflow): Canvas-based storyboard editor
- OpenAI SDK: LLM integration
- Axios: HTTP client for API communication
- Tailwind CSS: UI styling
- Lucide React: Icon library

## Development Notes

- Backend runs on port 3000, frontend on port 5173
- CORS configured for development with frontend origin
- TypeScript used throughout with strict type checking
- No test suite currently configured
- Frontend includes debug functionality (test data loading)
- Storyboard nodes have specific types: title, problem, solution, feature, benefit, cta