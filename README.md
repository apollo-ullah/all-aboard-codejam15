# AI Product Storyteller

Transform website URLs into professional slide decks with an interactive storyboard editor.

## Overview

This AI-powered hackathon project automatically:

1. Scrapes websites using Browser.cash Agent API
2. Generates editable storyboards using OpenAI GPT
3. Creates professional presentations using GAMMA API

## Features

- ✅ Website URL input and validation
- ✅ Browser.cash agent scraping (main page + up to 5 adjacent pages)
- ✅ LLM storyboard generation (8-12 nodes)
- ✅ Interactive storyboard canvas editor (drag, reorder, edit)
- ✅ Style selector (YC or Finance toggle)
- ✅ GAMMA API integration with style-specific prompts
- ✅ Download generated PPTX

## Tech Stack

- **Frontend**: React + TypeScript, React Flow, Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Web Scraping**: Browser.cash Agent API
- **LLM**: OpenAI GPT-4o
- **Slide Generation**: GAMMA API v1.0

## Setup

### Prerequisites

- Node.js 20+ and npm
- API keys for:
  - Browser.cash Agent API (https://browser.cash) - For web scraping
  - OpenAI (https://platform.openai.com) - For storyboard generation
  - GAMMA API - For slide generation

### Backend Setup

```bash
cd backend
cp .env.example .env
# Add your API keys to .env
npm install
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
ai-product-storyteller/
├── frontend/                    # React app
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API client
│   │   ├── types/              # TypeScript types
│   │   └── App.tsx
│   └── package.json
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── api/                # API routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   └── index.ts
│   └── package.json
│
├── .env.example
└── README.md
```

## API Endpoints

### POST /api/scrape

Scrapes a website and generates a storyboard.

**Request:**

```json
{
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "success": true,
  "storyboard": {
    "title": "...",
    "tagline": "...",
    "nodes": [...]
  },
  "scrapedData": {
    "mainPageTitle": "...",
    "pagesScraped": 5
  }
}
```

### POST /api/generate-slides

Generates slides from an edited storyboard.

**Request:**

```json
{
  "storyboard": {...},
  "style": "YC" | "Finance"
}
```

**Response:**

```json
{
  "success": true,
  "downloadUrl": "https://...",
  "slideCount": 10
}
```

## Development

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- Browser.cash Agent API is used for intelligent web scraping with AI agents
- GAMMA API v1.0 endpoints may need verification
- Currently supports website URLs only (GitHub support coming later)

## License

ISC
