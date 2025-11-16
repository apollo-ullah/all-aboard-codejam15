# Quick Start: AI Demo Video Generator 🎬

## Installation (5 minutes)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# This will install Playwright automatically
# Now install the Chromium browser
npm run setup-playwright

cd ..
```

### 2. Verify Environment Variables

Make sure `backend/.env` has:
```env
OPENAI_KEY=your_openai_api_key_here
```

The demo video feature requires OpenAI API access for:
- GPT-4 Vision (page analysis)
- Text-to-Speech (voice-over)

### 3. Start the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd allaboard
npm run dev
```

## Usage (3 steps)

### Step 1: Generate a Storyboard
1. Open http://localhost:3001
2. Enter any website URL (e.g., "airbnb.com")
3. Click "Generate" and wait for storyboard

### Step 2: Generate Demo Video
1. Scroll down to find the **"AI Demo Video Generator"** section
2. (Optional) Click "Show Configuration" to customize:
   - Duration: 60s - 180s
   - Voice: Choose from 6 AI voices
3. Click **"Generate AI Demo Video"**
4. Wait 2-3 minutes for generation

### Step 3: Download & Share
1. Click "Download Video" to get the WebM file
2. Click "Download Audio" to get the MP3 voice-over
3. Share your AI-generated product demo!

## What You Get

- ✅ **HD Video** (1920x1080, WebM format)
- ✅ **AI Voice-Over** (MP3, professional narration)
- ✅ **Action Script** (JSON with timestamps)
- ✅ **Smart Navigation** (AI decides what to showcase)
- ✅ **Human-Like Cursor** (Smooth, natural movements)

## Example Output

For a 2-minute demo of Airbnb.com, you'll get:
- Video showing AI browsing the site
- Clicking on listings, searching locations
- Smooth cursor pointing at features
- Professional voice explaining each section
- ~15MB video file ready to share

## Troubleshooting

**"Playwright browsers not installed"**
```bash
cd backend
npm run setup-playwright
```

**"Demo video generation failed"**
- Check that backend is running
- Verify OPENAI_KEY in .env
- Check browser console for errors

**"Video download fails"**
- Video is saved in `backend/demo_videos/`
- Audio in `backend/demo_logs/`
- Check folder permissions

## Next Steps

See [DEMO_VIDEO_README.md](./DEMO_VIDEO_README.md) for:
- Complete API documentation
- Advanced configuration options
- Voice model descriptions
- Technical architecture details
- Customization guide

---

**Questions?** Check the main README or the detailed DEMO_VIDEO_README.md
