# All Aboard - AI Product Storyteller

Transform website URLs into professional slide decks with an interactive storyboard editor.

## Overview

This AI-powered hackathon project automatically:

1. Scrapes websites using Browser.cash Agent API
2. Generates editable storyboards using OpenAI GPT-4o
3. Creates professional presentations using Gamma API
4. Embeds presentations directly in the app for seamless viewing

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
cd allaboard
npm install
npm run dev
```

The frontend will run on `http://localhost:3001`

## Project Structure

```
all-aboard-codejam15/
├── allaboard/                   # Next.js frontend (MAIN APP)
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   ├── lib/                     # Utilities and API client
│   └── types/                   # TypeScript types
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── api/                 # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utilities
│   └── .env                     # Environment variables
│
└── README.md                    # This file
```

For detailed documentation, see `PROJECT_SUMMARY.md`.

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

## Documentation

- **`PROJECT_SUMMARY.md`** - Comprehensive project overview and technical details
- **`QUICK_START.md`** - Quick setup guide
- **`START_SERVERS.md`** - Server management commands

## Notes

- Browser.cash Agent API is used for intelligent web scraping with AI agents
- Gamma API endpoint: `https://public-api.gamma.app/v1.0/generations`
- Presentations are embedded using Gamma embed URLs: `https://gamma.app/embed/{id}`
- Currently supports website URLs only

## License

ISC
