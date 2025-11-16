# AI Demo Video Generator

## Overview

The AI Demo Video Generator creates professional product demonstration videos using:
- **GPT-4 Vision** for intelligent website navigation
- **Playwright** for browser automation and screen recording
- **OpenAI TTS** for voice-over generation
- **Natural cursor movements** that simulate human interaction

## Features

- ✅ Autonomous AI-driven website navigation
- ✅ Smooth, human-like cursor movements with custom overlay
- ✅ GPT-4 Vision analyzes pages and decides next actions
- ✅ Voice-over generated from storyboard content
- ✅ Full HD (1920x1080) screen recording
- ✅ Configurable duration and voice models
- ✅ Download video and audio separately

## Setup

### 1. Install Playwright Browsers

The Playwright package is already in `package.json`, but you need to install the browsers:

```bash
cd backend
npm run setup-playwright
```

Or manually:

```bash
cd backend
npx playwright install chromium
```

### 2. Verify Installation

```bash
npx playwright --version
# Should output: Version 1.48.0 (or higher)
```

### 3. Required Environment Variables

Make sure you have `OPENAI_KEY` in your `backend/.env` file:

```env
OPENAI_KEY=sk-your-openai-api-key-here
```

## Usage

### From the Frontend

1. Generate a storyboard from a website URL
2. Click the **🎬 Demo Video** button in the storyboard editor
3. Configure options (optional):
   - Duration: 60-180 seconds
   - Voice model: alloy, echo, fable, onyx, nova, shimmer
4. Click **Generate AI Demo Video**
5. Wait for the video to be generated (this takes time!)
6. Download the video and audio files

### From the API

```bash
POST /api/generate-demo-video
Content-Type: application/json

{
  "url": "https://example.com",
  "storyboard": { /* your storyboard object */ },
  "duration": 120,
  "voiceModel": "alloy"
}
```

Response:
```json
{
  "success": true,
  "videoPath": "demo_videos/recording-xyz.webm",
  "audioPath": "demo_logs/voiceover_xyz.mp3",
  "scriptPath": "demo_logs/demo_script_xyz.json",
  "duration": 125.3,
  "actionsCount": 8,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## How It Works

1. **Browser Launch**: Chromium browser starts with video recording enabled
2. **Navigation**: Browser navigates to the target URL
3. **Cursor Overlay**: Custom red cursor overlay is injected for visibility
4. **AI Navigation Loop**:
   - GPT-4 Vision takes a screenshot
   - Analyzes the page content and available interactions
   - Decides the next best action (search, click, scroll, etc.)
   - Executes the action with smooth cursor movements
   - Records narration based on storyboard
5. **Voice-over Generation**: OpenAI TTS creates voice-over from script
6. **Save Results**: Video, audio, and script are saved to disk

## Configuration Options

### Duration
- **60 seconds**: Quick overview
- **120 seconds**: Standard demo (recommended)
- **180 seconds**: Detailed walkthrough

### Voice Models
- **alloy**: Neutral, balanced voice
- **echo**: Male, authoritative
- **fable**: British accent, storytelling
- **onyx**: Deep, professional male
- **nova**: Female, energetic
- **shimmer**: Soft, friendly female

## Output Files

### Video (`demo_videos/`)
- Format: WebM
- Resolution: 1920x1080
- Frame rate: 60 FPS (cursor movements)
- Average size: 5-20 MB per minute

### Audio (`demo_logs/`)
- Format: MP3
- Quality: TTS-1 standard
- Sample rate: 24 kHz

### Script (`demo_logs/`)
- Format: JSON
- Contains:
  - Full narration log with timestamps
  - Actions taken
  - URL and metadata

## API Endpoints

### Generate Demo Video
```
POST /api/generate-demo-video
```

### List Demo Videos
```
GET /api/demo-videos
```

Returns:
```json
{
  "videos": [
    {
      "filename": "recording-xyz.webm",
      "path": "demo_videos/recording-xyz.webm",
      "size": 15234567,
      "created": "2024-01-15T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Download Demo Video
```
GET /api/demo-videos/:filename
```

Supports HTTP range requests for streaming in browsers.

## Troubleshooting

### "Failed to launch browser"
```bash
cd backend
npm run setup-playwright
```

### "OPENAI_KEY not configured"
Add your OpenAI API key to `backend/.env`:
```env
OPENAI_KEY=sk-your-key-here
```

### Video generation takes too long
- Reduce duration to 60 seconds
- Use simpler websites
- Check your internet connection (AI needs to call OpenAI API)

### Browser doesn't close after generation
The cleanup should happen automatically. If it doesn't, check the logs for errors.

### Cursor overlay not visible
This is usually fine - the overlay is injected via JavaScript and may not work on all sites. The video will still be recorded.

## Performance Tips

1. **Use headless mode for production**: Edit `DemoVideoService.ts` line 136:
   ```typescript
   headless: true, // Changed from false
   ```

2. **Reduce video resolution**: Modify the `videoWidth` and `videoHeight` options

3. **Shorten duration**: Use 60 seconds instead of 120 for faster generation

4. **Limit AI actions**: The AI will automatically stop after 8-10 actions

## Architecture

```
DemoVideoService.ts (main service)
├── generateDemoVideo()
│   ├── startBrowser()              # Launch Chromium with recording
│   ├── navigateToWebsite()         # Go to URL
│   ├── injectCursorOverlay()       # Add visible cursor
│   ├── runAutonomousDemo()         # AI navigation loop
│   │   ├── aiDecideNextAction()   # GPT-4 Vision analysis
│   │   └── executeAction()        # Perform clicks, scrolls, etc.
│   ├── generateVoiceOver()         # OpenAI TTS
│   └── saveResults()               # Save video/audio/script
```

## Cost Estimates

Per 2-minute demo video:
- **GPT-4o-mini Vision**: ~8-10 API calls × $0.01 = ~$0.08-0.10
- **TTS-1**: ~500 characters × $0.015/1K chars = ~$0.008
- **Total**: ~$0.09 per video

## Future Enhancements

- [ ] Real-time progress updates via WebSocket
- [ ] Video preview in browser
- [ ] Custom script editing before generation
- [ ] Multiple video quality options
- [ ] Background music integration
- [ ] Subtitle generation
- [ ] Video editing (trim, merge, effects)

## Support

For issues or questions, check:
1. Backend logs: Look for errors in the console
2. Demo logs: Check `demo_logs/` for script files
3. Playwright docs: https://playwright.dev/
4. OpenAI TTS docs: https://platform.openai.com/docs/guides/text-to-speech
