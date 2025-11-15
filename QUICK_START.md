# 🚀 QUICK START GUIDE

## ⚡ TL;DR - Get Running in 3 Steps

### 1️⃣ Add Your API Keys
```bash
# Edit backend/.env and add your real API keys
nano backend/.env

# Required:
# OPENAI_KEY=sk-proj-...
# GAMMA_API_KEY=...
```

### 2️⃣ Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
**Expected output:**
```
🚀 Server running on http://0.0.0.0:3000
📝 Health check: http://localhost:3000/health
✅ Ready to accept connections from Vite proxy
```

### 3️⃣ Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
**Expected output:**
```
VITE v6.0.5  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 4️⃣ Open Browser
```
http://localhost:5173
```

---

## 🎯 Application Features

### **Main Workflow:**
1. Enter a website URL (e.g., `https://www.ycombinator.com`)
2. Click "Start Scraping" → AI scrapes and generates storyboard
3. Edit storyboard nodes (drag, reorder, edit content)
4. Select style (YC or Finance)
5. Click "Generate Slides" → Creates presentation via GAMMA API
6. View embedded presentation

### **Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + React Flow
- **Backend:** Express 5 + TypeScript + OpenAI + GAMMA API
- **Scraping:** Browser.cash Agent API (or Puppeteer fallback)

---

## 🔧 Troubleshooting

### ❌ "Port 3000 is already in use"
**Solution:** Kill the process using port 3000
```bash
lsof -ti:3000 | xargs kill -9
```

### ❌ "Cannot connect to backend via Vite proxy"
**Checklist:**
1. ✅ Backend is running on port 3000 (`cd backend && npm run dev`)
2. ✅ Frontend is running on port 5173 (`cd frontend && npm run dev`)
3. ✅ No firewall blocking connections

### ❌ "OpenAI API error" or "GAMMA API error"
**Solution:** Check that API keys are valid in `backend/.env`
```bash
cat backend/.env
# Make sure OPENAI_KEY and GAMMA_API_KEY are set
```

### ❌ TypeScript errors during build
**Solution:** These are mostly warnings (unused imports). The app will still run.
To ignore: `npm run dev` (development mode doesn't enforce strict type checking)

---

## 📁 Codebase Overview

### **Backend (`/backend`)**
- **Entry:** `src/index.ts`
- **Routes:** `src/api/routes.ts`
- **Services:**
  - `BrowserCashService.ts` - Web scraping
  - `LLMService.ts` - OpenAI storyboard generation
  - `SlideGenerator.ts` - GAMMA API integration
  - `StoryboardAssistantService.ts` - AI chat assistant

### **Frontend (`/frontend`)**
- **Entry:** `src/main.tsx`
- **Main App:** `src/App.tsx`
- **Key Components:**
  - `UrlInput.tsx` - URL input form
  - `StoryboardCanvas.tsx` - Interactive node editor (React Flow)
  - `StoryboardAssistant.tsx` - AI chat panel
  - `PresentationViewer.tsx` - Embedded slides viewer
- **API Client:** `src/services/api.ts` (uses Vite proxy)

### **Allaboard (`/allaboard`)** - ⚠️ UI-only, not integrated
- Next.js app with alternative UI
- **NOT connected to backend**
- To run: `cd allaboard && npm run dev` (will use port 3000 by default - conflict!)

---

## 🐛 Known Issues

### **Minor Issues (Non-blocking):**
1. Some TypeScript warnings about unused imports
2. React Flow `connectionMode` type warning
3. `import.meta.env` type definition missing

### **Major Issues:**
1. **Duplicate frontend apps** - `frontend/` vs `allaboard/`
   - **Recommendation:** Use `frontend/` as main app, treat `allaboard/` as UI mockup
2. **Port conflicts** - Backend (3000) vs Next.js default (3000)
   - **Solution:** Change Next.js port to 3001 if needed

See `CODEBASE_DIAGNOSTIC_REPORT.md` for full details.

---

## 🎯 Hackathon Tips

### **Demo Script:**
1. Start both servers (backend + frontend)
2. Open `http://localhost:5173`
3. Enter a demo URL (e.g., your own project website)
4. Show scraping → storyboard generation
5. Demo interactive editing (drag nodes, edit content)
6. Show slide generation (via GAMMA)
7. Present embedded slides

### **Backup Plan (if APIs fail):**
- Use `allaboard/` Next.js app as UI mockup
- Show the design and explain the planned workflow
- Demo the interactive storyboard canvas offline

### **Time-saving Tips:**
- Pre-generate a storyboard before the demo (cache it)
- Have API keys ready and tested
- Use a fast, simple website for demo (not complex sites)
- Have screenshots/video recording as backup

---

## 📞 Need Help?

1. Check `CODEBASE_DIAGNOSTIC_REPORT.md` for detailed analysis
2. Check browser console for frontend errors (F12)
3. Check backend terminal for API errors
4. Test health endpoint: `curl http://localhost:3000/health`

---

## ✅ Pre-Demo Checklist

- [ ] Backend starts without errors (`npm run dev`)
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] Can access `http://localhost:5173` in browser
- [ ] API keys added to `backend/.env`
- [ ] Tested full workflow: URL → Scrape → Storyboard → Slides
- [ ] Prepared demo URL (simple, fast-loading website)
- [ ] Have backup screenshots/video
- [ ] Team knows how to restart servers if they crash

---

**Good luck with your hackathon! 🚀**
