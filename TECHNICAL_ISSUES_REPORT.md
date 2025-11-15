# Technical Issues Report - Frontend-Backend Connectivity

**Date:** January 15, 2025  
**Project:** AI Product Storyteller  
**Status:** 🔴 **BLOCKING ISSUE - Frontend cannot connect to Backend**

---

## Executive Summary

We have a **critical connectivity issue** preventing our React frontend from communicating with our Express backend in the local development environment. The backend is running and accessible via `curl`, but browser-based requests from the frontend fail with `ERR_NETWORK` errors. This is blocking our entire development workflow.

**Key Finding:** The backend API works correctly when tested directly, but browser requests fail before reaching the server.

---

## System Architecture

### Technology Stack

**Frontend:**

- React 18 + TypeScript
- Vite (dev server on `http://localhost:5173`)
- Axios for HTTP requests
- React Flow for storyboard editor

**Backend:**

- Node.js + Express + TypeScript
- Express server on `http://localhost:3000`
- CORS enabled for cross-origin requests
- Integrates with:
  - Browser.cash Agent API (web scraping) ✅ Working
  - OpenAI GPT-4o (storyboard generation)
  - GAMMA API (slide generation)

### Communication Flow

```
Browser (localhost:5173)
    ↓ HTTP POST /api/scrape
    ↓ Axios request
    ↓ CORS preflight (OPTIONS)
    ↓
Express Backend (localhost:3000)
    ↓
Browser.cash Agent API
    ↓
OpenAI API
    ↓
Response back to frontend
```

---

## The Problem

### Primary Issue: Network Error (ERR_NETWORK)

**Symptom:**

- Frontend makes HTTP request to `http://localhost:3000/api/scrape`
- Request fails immediately with `AxiosError: Network Error`
- Error code: `ERR_NETWORK`
- No request logs appear in backend terminal
- Request never reaches the Express server

**Error Details:**

```javascript
AxiosError {
  message: 'Network Error',
  name: 'AxiosError',
  code: 'ERR_NETWORK',
  config: {
    method: 'post',
    url: '/api/scrape',
    baseURL: 'http://localhost:3000',
    timeout: 300000,
    headers: { 'Content-Type': 'application/json' }
  },
  request: XMLHttpRequest {
    readyState: 4,
    status: 0,  // ← No HTTP status (request never completed)
    statusText: ''
  }
}
```

### What Works vs. What Doesn't

✅ **Working:**

- Backend server starts successfully
- Backend responds to `curl` requests
- Backend health check works: `curl http://localhost:3000/health` → 200 OK
- Backend API endpoints work via `curl`
- Browser.cash Agent API integration works
- All backend services are functional

❌ **Not Working:**

- Browser-based requests from frontend
- Connection test from React app
- All API calls from frontend fail with ERR_NETWORK
- No requests appear in backend logs when called from browser

---

## Evidence & Logs

### 1. Backend Server Status

**Backend is running and accessible:**

```
🚀 Server running on http://localhost:3000
📝 Health check: http://localhost:3000/health
🔧 CORS Configuration: {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

### 2. Direct Backend Test (Works)

**Via curl:**

```bash
$ curl -v http://localhost:3000/health

* Connected to localhost (::1) port 3000
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:5173
< Access-Control-Allow-Credentials: true
< Content-Type: application/json

{"status":"ok","timestamp":"2025-11-15T03:41:35.188Z"}
```

**Result:** ✅ Backend is reachable and CORS headers are present

### 3. Frontend Request (Fails)

**Browser Console Logs:**

```
🔧 API Client Configuration:
   Base URL: http://localhost:3000
   Environment: development

📤 API Request: {
  method: 'POST',
  url: '/api/scrape',
  baseURL: 'http://localhost:3000',
  fullURL: 'http://localhost:3000/api/scrape',
  data: { url: 'https://cluely.com/' },
  timeout: 300000
}

❌ API Error Details: {
  message: 'Network Error',
  code: 'ERR_NETWORK',
  name: 'AxiosError',
  request: {
    readyState: 4,
    status: 0,
    statusText: ''
  }
}
```

**Backend Terminal:**

- ❌ **NO logs appear** - request never reaches backend
- No request logging
- No CORS preflight logs
- Server shows no activity

### 4. Network Tab Analysis

**Browser DevTools Network Tab:**

- Request shows as "failed" (red)
- Status: `(failed) net::ERR_FAILED` or `ERR_NETWORK`
- No HTTP status code
- Request blocked before reaching server
- No CORS preflight request visible

---

## What We've Tried

### 1. CORS Configuration ✅

**Attempted:**

- Explicit CORS configuration with all methods
- Explicit OPTIONS handler for preflight requests
- Allowed all necessary headers
- Set `credentials: true` (then tried `false`)
- Added `maxAge` for preflight caching

**Result:** ❌ No change - requests still don't reach server

**Code:**

```typescript
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
```

### 2. Axios Configuration ✅

**Attempted:**

- Set `withCredentials: false`
- Increased timeout to 5 minutes
- Added explicit headers
- Verified base URL configuration

**Result:** ❌ No change

**Code:**

```typescript
const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 300000,
  withCredentials: false,
});
```

### 3. Connection Test Endpoint ✅

**Attempted:**

- Created `/api/test-connection` endpoint
- Test connection on app mount
- Test connection before scraping

**Result:** ❌ Connection test also fails with ERR_NETWORK

### 4. Extensive Logging ✅

**Attempted:**

- Request/response interceptors in Axios
- Detailed error logging
- Backend request logging middleware
- CORS preflight logging

**Result:** ✅ Logging works, but shows requests never reach backend

### 5. Port Verification ✅

**Attempted:**

- Verified backend on port 3000
- Verified frontend on port 5173
- Tested with `curl` to confirm ports work
- Checked for port conflicts

**Result:** ✅ Ports are correct and accessible

### 6. Environment Variables ✅

**Attempted:**

- Verified `VITE_API_URL` in frontend
- Verified `FRONTEND_URL` in backend
- Checked `.env` files
- Hardcoded URLs to eliminate env issues

**Result:** ✅ Configuration is correct

### 7. Vite Proxy Configuration ⚠️ **KEY FINDING**

**Discovered:**

- Vite proxy IS configured in `vite.config.ts`:
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  }
  ```

**Issue:**

- Frontend is using **absolute URL** (`http://localhost:3000/api/scrape`)
- Should use **relative URL** (`/api/scrape`) to use Vite proxy
- Proxy only works with relative URLs

**Result:** ⚠️ **Potential root cause identified**

### 7. Browser Testing ✅

**Attempted:**

- Tested in Chrome
- Tested in Firefox
- Cleared browser cache
- Disabled browser extensions
- Tested in incognito mode

**Result:** ❌ Same error in all browsers

### 8. Network/Firewall Checks ✅

**Attempted:**

- Verified no firewall blocking localhost
- Checked macOS network settings
- Verified localhost resolution (127.0.0.1 vs ::1)
- Tested with both IPv4 and IPv6

**Result:** ✅ Network appears fine (curl works)

---

## What's Still Failing

### Critical Issues

1. **❌ Browser requests never reach backend**

   - No logs in backend terminal
   - No CORS preflight requests
   - Request fails at browser level

2. **❌ ERR_NETWORK with no HTTP status**

   - Status code: 0 (not a valid HTTP status)
   - Suggests request blocked before network layer

3. **❌ No CORS preflight visible**
   - OPTIONS request should appear first
   - No OPTIONS request in network tab
   - Suggests request blocked before CORS check

### Possible Root Causes (Hypotheses)

1. **Browser Security Policy**

   - Mixed content issues?
   - CORS preflight blocked by browser?
   - Browser extension interfering?

2. **Vite Dev Server Configuration**

   - Proxy configuration needed?
   - Vite not forwarding requests correctly?
   - Dev server CORS issues?

3. **macOS Network Stack**

   - IPv6 vs IPv4 resolution?
   - Localhost routing issue?
   - Network interface binding?

4. **Express Server Binding**

   - Server not binding to correct interface?
   - Only listening on IPv6?
   - Port binding issue?

5. **Axios/XMLHttpRequest Issue**
   - Axios configuration problem?
   - Browser XMLHttpRequest blocked?
   - Adapter selection issue?

---

## Diagnostic Information

### System Information

- **OS:** macOS 25.1.0 (Darwin)
- **Node.js:** (version from package.json)
- **Browser:** Chrome/Firefox (latest)
- **Backend Port:** 3000
- **Frontend Port:** 5173

### Network Configuration

```bash
# Localhost resolution
$ ping localhost
PING localhost (127.0.0.1): 56 data bytes

# Port check
$ lsof -i :3000
# Shows Express server listening

$ lsof -i :5173
# Shows Vite dev server listening
```

### Backend Server Binding

**Current:** `app.listen(3000, ...)`

**Question:** Should we explicitly bind to `0.0.0.0` or `127.0.0.1`?

```typescript
// Current
app.listen(PORT, () => { ... });

// Alternative
app.listen(PORT, '0.0.0.0', () => { ... });
// or
app.listen(PORT, '127.0.0.1', () => { ... });
```

---

## Questions for Advisor

### 1. Network Layer

- **Q:** Why would `curl` work but browser requests fail?
- **Q:** Is there a difference in how browsers handle localhost vs command-line tools?
- **Q:** Should we explicitly bind Express to `127.0.0.1` instead of default?

### 2. CORS & Preflight

- **Q:** Why aren't CORS preflight (OPTIONS) requests appearing?
- **Q:** Is the request being blocked before CORS even runs?
- **Q:** Should we configure Vite to proxy requests instead of direct calls?

### 3. Vite Configuration ⚠️ **CRITICAL**

- **Q:** We have Vite proxy configured - should frontend use relative URLs (`/api/scrape`) instead of absolute URLs (`http://localhost:3000/api/scrape`)?
- **Q:** Is the proxy configuration correct? Should we remove `baseURL` from axios?
- **Q:** Are there known issues with Vite proxy and axios baseURL conflicts?

### 4. Browser Behavior

- **Q:** What could cause ERR_NETWORK with status 0?
- **Q:** Are there browser security policies blocking localhost requests?
- **Q:** Should we test with a different HTTP client (fetch instead of axios)?

### 5. Express Configuration

- **Q:** Should Express listen on a specific interface?
- **Q:** Are there middleware ordering issues?
- **Q:** Should we add explicit error handling for connection issues?

### 6. Alternative Approaches

- **Q:** Should we use Vite proxy configuration?
- **Q:** Should we use `fetch` instead of `axios`?
- **Q:** Should we test with a different port?
- **Q:** Should we use a different development setup?

---

## Recommended Next Steps

### Immediate Actions

1. **Fix Vite Proxy Usage** ⚠️ **HIGH PRIORITY**

   - **Issue:** Frontend uses absolute URL, but Vite proxy requires relative URLs
   - **Fix:** Remove `baseURL` from axios or change to relative paths

   ```typescript
   // Option 1: Remove baseURL, use relative URLs
   const apiClient = axios.create({
     // baseURL: 'http://localhost:3000', // ← Remove this
     headers: { "Content-Type": "application/json" },
     timeout: 300000,
   });
   // Then use: apiClient.post('/api/scrape', ...)

   // Option 2: Keep baseURL but ensure proxy handles it
   // (May need to adjust vite.config.ts)
   ```

2. **Test Explicit Server Binding**

   ```typescript
   app.listen(PORT, '127.0.0.1', () => { ... });
   ```

3. **Test with Fetch Instead of Axios**

   - Rule out axios-specific issues
   - Test native browser fetch API

4. **Check Vite Dev Server Logs**

   - Look for proxy/request forwarding issues
   - Check for CORS-related warnings

5. **Test Different Ports**
   - Rule out port-specific issues
   - Test with non-standard ports

### Long-term Solutions

1. **Implement Vite Proxy** (if recommended)
2. **Add Request Middleware** for better debugging
3. **Set up Production-like Environment** for testing
4. **Document Working Configuration** once resolved

---

## Code References

### Key Files

- **Backend Server:** `backend/src/index.ts`
- **Backend Routes:** `backend/src/api/routes.ts`
- **Frontend API Client:** `frontend/src/services/api.ts`
- **Frontend App:** `frontend/src/App.tsx`
- **Vite Config:** `frontend/vite.config.ts`

### Relevant Code Sections

**Backend CORS:**

```typescript:backend/src/index.ts
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
```

**Frontend API Client:**

```typescript:frontend/src/services/api.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // ← This might conflict with Vite proxy
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
  withCredentials: false
});
```

**Vite Proxy Configuration:**

```typescript:frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**⚠️ Potential Issue:** Axios is using absolute URL (`http://localhost:3000`) which bypasses Vite proxy. Should use relative URL (`/api`) to leverage proxy.

---

## Conclusion

We have a **blocking issue** where browser-based HTTP requests from our React frontend cannot reach our Express backend, despite the backend being fully functional and accessible via command-line tools. The error suggests the request is being blocked at the browser/network layer before it reaches the server.

**We need guidance on:**

1. Why browser requests fail when curl works
2. Whether Vite proxy configuration is needed
3. Express server binding configuration
4. Alternative approaches to resolve this

**Impact:** This is blocking all frontend-backend communication and preventing us from testing the full application workflow.

---

**Thank you for your help!** 🙏
