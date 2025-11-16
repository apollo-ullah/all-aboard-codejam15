# Video Generation Issues & Fixes

## Confirmed Issues

### ✅ Issue 1: FFmpeg Not Installed (CRITICAL)
**Status:** Confirmed - FFmpeg is not installed on Windows system
**Impact:** Videos generate without audio; audio merge fails silently
**Fix:** Install FFmpeg for Windows

#### Windows Installation:
1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your PATH environment variable
4. Restart terminal and verify: `ffmpeg -version`

#### Or use Chocolatey (if installed):
```powershell
choco install ffmpeg
```

#### Alternative: Use Node.js FFmpeg wrapper
We could modify the code to use `fluent-ffmpeg` which provides better error handling.

---

### ⚠️ Issue 2: Playwright Browsers May Not Be Installed
**Status:** Needs verification
**Impact:** Browser launch will fail
**Fix:**
```powershell
cd backend
npm run setup-playwright
```

---

### ⚠️ Issue 3: Browser Headless Mode
**Status:** Browser set to `headless: false` (line 149)
**Impact:** May fail on headless servers or Windows services
**Fix:** Change to `headless: true` for production

---

### ⚠️ Issue 4: Windows Path Handling
**Status:** Code uses Unix-style paths in some places
**Impact:** May cause issues with file paths on Windows
**Fix:** Use Node.js `path.join()` consistently (already done in most places)

---

## How to Test Video Generation

### 1. Check Prerequisites
```powershell
# Check FFmpeg
ffmpeg -version

# Check Playwright
cd backend
npx playwright --version
```

### 2. Install Missing Dependencies
```powershell
# Install Playwright browsers
cd backend
npm run setup-playwright

# Install FFmpeg (see Issue 1 above)
```

### 3. Verify Environment Variables
Make sure `backend/.env` has:
```env
OPENAI_KEY=sk-your-key-here
```

### 4. Test Video Generation
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd allaboard && npm run dev`
3. Navigate to http://localhost:3001
4. Generate a storyboard first
5. Click "Generate AI Demo Video"
6. Check backend console for errors

---

## Common Error Messages & Solutions

### "Failed to launch browser"
**Solution:** Run `npm run setup-playwright` in backend directory

### "FFmpeg not found" or silent audio merge failure
**Solution:** Install FFmpeg (see Issue 1 above)

### "OPENAI_KEY not configured"
**Solution:** Add `OPENAI_KEY` to `backend/.env`

### "ECONNREFUSED" or timeout errors
**Solution:** 
- Check backend is running on port 3000
- Check OpenAI API key is valid
- Increase timeout in `allaboard/lib/api.ts` (currently 300000ms = 5 minutes)

---

## Recommended Fixes Priority

1. **HIGH:** Install FFmpeg (blocks audio merge)
2. **HIGH:** Verify Playwright browsers installed
3. **MEDIUM:** Change headless mode to `true` for production
4. **LOW:** Add better error messages for Windows users
5. **LOW:** Increase API timeout for longer videos

---

## Testing Checklist

- [ ] FFmpeg installed and in PATH
- [ ] Playwright browsers installed
- [ ] OPENAI_KEY set in `.env`
- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Can generate storyboard
- [ ] Can generate video (check console for errors)
- [ ] Video file exists in `backend/demo_videos/`
- [ ] Audio file exists in `backend/demo_logs/`
- [ ] Merged video has audio track

