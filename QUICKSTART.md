# Quick Start Guide

## Setup (First Time Only)

### 1. Backend Setup

```powershell
cd backend
npm install
copy .env.example .env
# Edit .env and add your Gamma API key
```

### 2. Frontend Setup

```powershell
cd frontend
npm install
```

## Running the Application

### Terminal 1 - Backend

```powershell
cd backend
npm run dev
```

Server runs on http://localhost:3001

### Terminal 2 - Frontend

```powershell
cd frontend
npm start
```

App opens on http://localhost:3000

## Getting Your Gamma API Key

1. Visit https://gamma.app
2. Sign up or log in
3. Go to Settings > API
4. Generate a new API key
5. Copy the key to your `.env` file

## Testing the Application

1. Open http://localhost:3000
2. The form should be pre-filled with sample data
3. Click "Generate Presentation"
4. Wait for the generation to complete (1-2 minutes)
5. View and download your PDF!

## Common Issues

**API Key Error**: Make sure `.env` file has `GAMMA_API_KEY=sk-gamma-...`

**Port in use**: Kill the process or change PORT in `.env`

**PDF not loading**: Check backend console for errors

---

Enjoy creating presentations! 🚀
