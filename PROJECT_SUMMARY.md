# 📊 All Aboard - Project Summary

**Last Updated:** 2025-11-15  
**Status:** ✅ Fully Operational

---

## 🎯 Project Overview

**All Aboard** (formerly STORYTEX) is an AI-powered platform that transforms websites into professional presentations. The application uses AI agents to scrape websites, generates structured storyboards with GPT-4o, and creates beautiful slide presentations using the Gamma API.

### Core Workflow

1. **Input** → User enters a website URL
2. **Scraping** → Browser.cash AI agents scrape the website intelligently
3. **Storyboard Generation** → GPT-4o analyzes content and creates a structured storyboard
4. **Interactive Editing** → User can edit, reorder, and refine the storyboard on an interactive canvas
5. **Slide Generation** → Gamma API creates professional presentations
6. **Embedded Viewing** → Presentations are displayed directly in the app using Gamma embed URLs

---

## 🏗️ Architecture

### **Frontend (`/allaboard`)**
- **Framework:** Next.js 15 with React
- **Port:** 3001 (configured to avoid conflicts)
- **Key Components:**
  - `page.tsx` - Main application entry point
  - `StoryboardCanvas.tsx` - Interactive React Flow-based storyboard editor
  - `StoryboardAssistant.tsx` - AI chat assistant for storyboard improvements
  - `PresentationViewer.tsx` - Embedded Gamma presentation viewer
  - `background.tsx` - Animated background component

### **Backend (`/backend`)**
- **Framework:** Node.js + Express + TypeScript
- **Port:** 3000
- **Services:**
  - `BrowserCashService.ts` - Web scraping using Browser.cash Agent API
  - `LLMService.ts` - OpenAI GPT-4o integration for storyboard generation
  - `SlideGenerator.ts` - Gamma API integration for slide generation
  - `StoryboardAssistantService.ts` - AI assistant chat functionality

### **API Endpoints**

- `GET /health` - Health check
- `GET /api/test-connection` - Backend connection test
- `POST /api/scrape` - Scrape website and generate storyboard
- `POST /api/generate-slides` - Generate slides from storyboard
- `POST /api/improve-storyboard` - AI assistant chat

---

## 🔧 Technical Implementation

### **Web Scraping (Browser.cash)**
- Uses Browser.cash Agent API (`https://agent-api.browser.cash`)
- Intelligently scrapes main page + adjacent pages (About, Features, etc.)
- Extracts structured content: title, description, links, metadata

### **Storyboard Generation (OpenAI)**
- Uses GPT-4o for content analysis
- Generates 8-12 storyboard nodes with:
  - Title and content
  - Speaker notes
  - Node types (title, problem, solution, feature, benefit, cta)
- Supports narrative arc templates (YC style, Finance style)

### **Slide Generation (Gamma API)**
- **Endpoint:** `https://public-api.gamma.app/v1.0/generations`
- **Polling Endpoint:** `https://public-api.gamma.app/v1.0/generations/{generationId}`
- Generates presentations with style-specific formatting
- **Embed URL Construction:** Automatically constructs `https://gamma.app/embed/{presentationId}` from presentation URL
- Presentations are embedded directly in the app using iframes

### **Presentation Embedding**
- Gamma presentations are embedded using iframe with embed URLs
- Handles Content Security Policy (CSP) gracefully
- Falls back to new window if embedding is blocked
- Supports full-screen viewing and keyboard navigation

---

## 📁 Project Structure

```
all-aboard-codejam15/
├── allaboard/                    # Next.js frontend (MAIN APP)
│   ├── app/
│   │   ├── page.tsx             # Main application page
│   │   └── layout.tsx           # App layout
│   ├── components/
│   │   ├── StoryboardCanvas.tsx # Interactive storyboard editor
│   │   ├── StoryboardAssistant.tsx # AI chat assistant
│   │   ├── PresentationViewer.tsx # Gamma presentation viewer
│   │   ├── StoryNode.tsx        # Storyboard node component
│   │   └── background.tsx       # Animated background
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   ├── narrativeArcs.ts    # Narrative arc templates
│   │   └── validation.ts       # Input validation
│   └── types/
│       └── index.ts             # TypeScript type definitions
│
├── backend/                      # Express backend
│   ├── src/
│   │   ├── index.ts             # Server entry point
│   │   ├── api/
│   │   │   └── routes.ts        # API route handlers
│   │   ├── services/
│   │   │   ├── BrowserCashService.ts
│   │   │   ├── LLMService.ts
│   │   │   ├── SlideGenerator.ts
│   │   │   └── StoryboardAssistantService.ts
│   │   └── utils/
│   │       └── validation.ts
│   └── .env                     # Environment variables (gitignored)
│
└── README.md                    # Main project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- API keys:
  - `AGENT_API_KEY` - Browser.cash Agent API
  - `OPENAI_KEY` - OpenAI API key
  - `GAMMA_API_KEY` - Gamma API key

### Setup

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../allaboard && npm install
   ```

2. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Start servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd allaboard && npm run dev
   ```

4. **Access application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

---

## ✨ Key Features

### 1. **Intelligent Web Scraping**
- AI-powered content extraction
- Multi-page analysis (main + adjacent pages)
- Context-aware content filtering

### 2. **Interactive Storyboard Editor**
- Drag-and-drop node reordering
- Inline editing of titles, content, and speaker notes
- Visual node type indicators
- React Flow-based canvas

### 3. **AI Storyboard Assistant**
- Chat interface for storyboard improvements
- Style-specific suggestions (YC or Finance)
- Real-time storyboard updates

### 4. **Narrative Arc Templates**
- YC-style pitch deck structure
- Finance-style presentation structure
- Automatic node reordering to match arc

### 5. **Embedded Presentation Viewer**
- Direct embedding of Gamma presentations
- Full-screen mode
- Keyboard navigation (arrow keys)
- Presentation mode with minimal UI

---

## 🔄 Recent Fixes & Improvements

### Gamma API Integration (Latest Session)
- ✅ Fixed endpoint to use correct Gamma API: `https://public-api.gamma.app/v1.0/generations`
- ✅ Removed invalid API parameters that caused 400 errors
- ✅ Implemented automatic embed URL construction from presentation URLs
- ✅ Fixed Content Security Policy handling for embedded presentations
- ✅ Removed false positive CSP error detection
- ✅ Cleaned up endpoint fallback logic (now uses correct endpoint directly)

### Code Cleanup
- ✅ Removed unused components: `ProgressIndicator`, `StyleSelector`, `NarrativeArcButton`
- ✅ Fixed broken imports
- ✅ Simplified endpoint logic

---

## 🐛 Known Issues & Limitations

1. **Gamma Embedding:** Some Gamma presentations may require public access to be embedded. The app handles this gracefully with fallback options.

2. **Port Configuration:** Frontend runs on port 3001 to avoid conflicts with backend (port 3000).

3. **Browser.cash API:** Requires valid API key and credits. Scraping may take 30-60 seconds depending on website complexity.

---

## 📝 Development Notes

### Environment Variables
```env
# Backend .env file
PORT=3000
AGENT_API_KEY=your_browser_cash_key
OPENAI_KEY=sk-proj-your_openai_key
GAMMA_API_KEY=your_gamma_key
BROWSER_CASH_BASE_URL=https://agent-api.browser.cash
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

### API Response Formats

**Storyboard Response:**
```typescript
{
  success: true,
  storyboard: {
    title: string,
    tagline: string,
    nodes: StoryNode[]
  },
  scrapedData: {
    mainPageTitle: string,
    pagesScraped: number
  }
}
```

**Slide Generation Response:**
```typescript
{
  success: true,
  presentationUrl: string,
  embedUrl?: string,
  downloadUrl?: string,
  pdfUrl?: string,
  slideCount: number
}
```

---

## 🎯 Future Enhancements

- [ ] Video generation support
- [ ] Export to PDF/PPTX
- [ ] Multiple presentation styles
- [ ] Collaborative editing
- [ ] Template library
- [ ] Analytics and usage tracking

---

## 📚 Documentation Files

- `README.md` - Main project documentation
- `QUICK_START.md` - Quick setup guide
- `START_SERVERS.md` - Server management commands
- `PROJECT_SUMMARY.md` - This file (comprehensive overview)

---

## 🏆 Hackathon Context

This project was built for a hackathon, demonstrating:
- AI-powered web scraping
- LLM-based content generation
- Interactive UI/UX design
- Third-party API integration
- Real-time presentation generation

**Tech Stack Highlights:**
- Next.js 15 (React)
- TypeScript
- Express.js
- React Flow (interactive canvas)
- Tailwind CSS
- Browser.cash Agent API
- OpenAI GPT-4o
- Gamma API

---

## 📞 Support

For issues or questions:
1. Check `QUICK_START.md` for setup instructions
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Verify API keys are correctly configured

---

**Built with ❤️ for the hackathon**

