# 🚀 How to Start the Servers

## Quick Commands

### **Option 1: Two Separate Terminals (RECOMMENDED)**

**Terminal 1 - Backend:**
```bash
cd /home/user/all-aboard-codejam15/backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/user/all-aboard-codejam15/frontend && npm run dev
```

Then open: **http://localhost:5173**

---

### **Option 2: Background Processes**

```bash
# Start backend in background
cd /home/user/all-aboard-codejam15/backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd /home/user/all-aboard-codejam15/frontend && npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Open: http://localhost:5173"

# To stop later:
# kill $BACKEND_PID $FRONTEND_PID
```

---

### **Option 3: Using screen/tmux**

```bash
# Using screen
screen -S backend -dm bash -c "cd /home/user/all-aboard-codejam15/backend && npm run dev"
screen -S frontend -dm bash -c "cd /home/user/all-aboard-codejam15/frontend && npm run dev"

# Attach to see logs:
# screen -r backend
# screen -r frontend

# Detach: Ctrl+A, then D
```

---

## Port Usage

| Service | Port | URL |
|---------|------|-----|
| Backend | 3000 | http://localhost:3000 |
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Allaboard (Next.js) | 3001 | http://localhost:3001 (if needed) |

---

## Stop Servers

### **Kill by Port:**
```bash
# Stop backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Stop frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### **Kill by Process Name:**
```bash
pkill -f "node.*backend"
pkill -f "vite"
```

---

## Health Checks

### **Backend:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### **Frontend:**
```bash
curl http://localhost:5173
# Expected: HTML response
```

### **Backend API Test:**
```bash
curl http://localhost:5173/api/test-connection
# Expected: {"success":true,"message":"Backend is reachable"}
```

---

## Troubleshooting

### ❌ "Port already in use"
```bash
# Find what's using the port
lsof -i :3000
lsof -i :5173

# Kill it
lsof -ti:3000 | xargs kill -9
```

### ❌ "Module not found"
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### ❌ "Cannot connect to backend"
1. Check backend is running: `curl http://localhost:3000/health`
2. Check frontend is running: `curl http://localhost:5173`
3. Check Vite proxy in `frontend/vite.config.ts`
