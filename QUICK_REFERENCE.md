# Quick Reference Card

## 🚀 Quick Start

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Open: http://localhost:5173
```

## ✅ What's Fixed

1. **Vite Proxy Issue** - Removed `baseURL` from axios, using relative URLs
2. **Express 5 Compatibility** - Fixed `app.options('*')` wildcard error
3. **TypeScript PORT Error** - Converted to number: `Number(process.env.PORT)`
4. **Browser.cash API** - Fully working, integrated

## 🔑 Key Files

- `frontend/src/services/api.ts` - **NO baseURL!** Use relative URLs
- `frontend/vite.config.ts` - Proxy configured
- `backend/src/index.ts` - Server setup
- `backend/src/services/BrowserCashService.ts` - Web scraping

## ⚠️ Critical Rules

1. **NEVER use absolute URLs in axios when Vite proxy is configured**
   - ❌ `baseURL: 'http://localhost:3000'`
   - ✅ No baseURL, use `/api/scrape`

2. **Express 5: No wildcard in app.options()**
   - ❌ `app.options('*', ...)`
   - ✅ `app.options('/api/*', ...)`

3. **PORT must be number**
   - ❌ `const PORT = process.env.PORT || 3000`
   - ✅ `const PORT = Number(process.env.PORT) || 3000`

## 🐛 Common Issues

**ERR_NETWORK?**
- Check: No `baseURL` in axios
- Check: Using relative URLs (`/api/...`)
- Check: Both servers running

**Backend not receiving requests?**
- Check: Vite proxy config
- Check: Backend logs
- Check: Browser Network tab

## 📋 API Endpoints

- `GET /health` - Health check
- `GET /api/test-connection` - Connection test
- `POST /api/scrape` - Scrape website
- `POST /api/generate-slides` - Generate slides

## 🔗 Environment Variables

**Backend (.env):**
- `AGENT_API_KEY` - Browser.cash
- `OPENAI_KEY` - OpenAI
- `GAMMA_API_KEY` - GAMMA
- `PORT=3000`

## 📚 Full Documentation

See `PROJECT_STATUS_SUMMARY.md` for complete details.

