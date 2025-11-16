# AI Demo Video Generator 🎬

## Overview

The AI Demo Video Generator is an advanced feature that automatically creates professional product demo videos using AI-powered browser automation, GPT-4 Vision, and text-to-speech technology.

## Features

### 🤖 **AI-Powered Navigation**
- **GPT-4 Vision** analyzes your website in real-time
- Makes intelligent decisions about what to showcase
- Adapts to different website structures dynamically

### 🎯 **Human-Like Interactions**
- **Smooth cursor movements** with natural easing
- **Custom cursor overlay** for better visibility (red glowing cursor)
- **Idle movements** that simulate a real presenter pointing at content
- **Click animations** with smooth transitions

### 🎙️ **Professional Voice-Over**
- **OpenAI TTS** generates narration from your storyboard
- **6 voice options** (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- Synchronized with on-screen actions

### 📹 **High-Quality Recording**
- Full HD (1920x1080) video output
- WebM format with H.264 encoding
- Separate audio track for voice-over
- Video streaming and download support

## How It Works

### 1. **Storyboard to Script Conversion**
Your existing storyboard is automatically converted into a natural narration script:
- Title nodes → "Let's explore [content]"
- Problem nodes → "Here's the challenge: [content]"
- Solution nodes → "The solution is simple: [content]"
- Feature nodes → "Check out this feature: [content]"
- Benefit nodes → "This means [content]"

### 2. **Autonomous Browser Agent**
The AI agent:
1. Launches a browser with video recording
2. Navigates to your product website
3. Injects custom cursor overlay
4. Uses GPT-4 Vision to analyze each page
5. Decides optimal actions (search, click, scroll, navigate)
6. Executes actions with human-like timing
7. Continues until duration limit or script completion

### 3. **Voice-Over Generation**
- Full script is sent to OpenAI TTS API
- Audio generated with selected voice model
- Saved separately for post-processing flexibility

## Usage

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

This will install:
- `playwright@^1.48.0` - Browser automation
- Playwright browsers will be installed automatically

2. **Environment Variables**
Ensure your `.env` file has:
```env
OPENAI_KEY=your_openai_api_key_here  # Required for GPT-4 Vision + TTS
```

3. **Start Backend**
```bash
npm run dev
```

### Frontend Usage

1. **Generate a Storyboard** (existing flow)
   - Enter a website URL
   - Wait for storyboard generation
   - Edit storyboard as needed

2. **Generate Demo Video**
   - Click "Show Configuration" to customize:
     - **Duration**: 60s, 90s, 120s (recommended), or 180s
     - **Voice Model**: Choose from 6 AI voices
   - Click "Generate AI Demo Video"
   - Wait for generation (typically 2-3 minutes)

3. **Download Results**
   - Video file (WebM format)
   - Audio file (MP3 format)
   - Script file (JSON with timestamps)

## API Endpoints

### `POST /api/generate-demo-video`
Generate a demo video from a storyboard.

**Request Body:**
```json
{
  "url": "https://example.com",
  "storyboard": { /* Storyboard object */ },
  "duration": 120,
  "voiceModel": "alloy"
}
```

**Response:**
```json
{
  "success": true,
  "videoPath": "demo_videos/video-xxxxx.webm",
  "audioPath": "demo_logs/voiceover-xxxxx.mp3",
  "scriptPath": "demo_logs/demo_script-xxxxx.json",
  "duration": 118.5,
  "actionsCount": 12,
  "timestamp": "2025-11-16T02-30-45-123Z"
}
```

### `GET /api/demo-videos`
List all generated demo videos.

**Response:**
```json
{
  "videos": [
    {
      "filename": "video-xxxxx.webm",
      "path": "demo_videos/video-xxxxx.webm",
      "size": 15728640,
      "created": "2025-11-16T02:30:45.000Z"
    }
  ],
  "count": 1
}
```

### `GET /api/demo-videos/:filename`
Download or stream a specific video.

**Features:**
- Supports HTTP range requests for streaming
- Auto-downloads when accessed directly
- Video player compatible

## Technical Architecture

### Backend Service: `DemoVideoService.ts`

**Key Components:**

1. **Browser Management**
   - Uses Playwright Chromium
   - Configurable viewport (default 1920x1080)
   - Stealth mode (hides webdriver detection)
   - Video recording enabled from start

2. **Cursor System**
   - Custom DOM overlay (fixed positioned div)
   - Red glowing appearance with shadow effects
   - Z-index: 2147483647 (always on top)
   - Updated via `window.updateCursorPosition(x, y)`

3. **Movement Algorithms**
   - **`moveCursorTo(x, y, steps)`**: Smoothstep easing for natural motion
   - **`idleCursorMovement(duration)`**: Random small movements
   - **`smoothScroll(pixels)`**: Gradual scroll with cursor following
   - **`smoothClick(selector)`**: Move → pause → click → re-inject cursor

4. **AI Decision Engine**
   - Takes screenshot (base64 PNG)
   - Extracts page metadata (DOM query)
   - Sends to GPT-4o-mini with vision
   - Receives JSON action decision
   - Fallback to scroll if AI fails

5. **Action Execution**
   - `search`: Types query in search box
   - `click_link`: Clicks text-based link
   - `click_button`: Clicks button by text
   - `scroll`: Smooth vertical scroll
   - `wait`: Idle cursor movement

### Frontend Component: `DemoVideoGenerator.tsx`

**Features:**
- Configuration panel (collapsible)
- Duration selector (60s - 180s)
- Voice model selector with descriptions
- Progress indicator
- Error handling with user-friendly messages
- Download buttons for video + audio
- Info panel explaining the process

## Voice Models

| Voice | Gender | Tone | Best For |
|-------|--------|------|----------|
| **Alloy** | Neutral | Balanced | General purpose, professional |
| **Echo** | Male | Authoritative | Technical products, enterprise |
| **Fable** | Male | British, storytelling | Creative products, narratives |
| **Onyx** | Male | Deep, professional | Corporate, formal presentations |
| **Nova** | Female | Energetic | Consumer products, dynamic demos |
| **Shimmer** | Female | Soft, friendly | Lifestyle, wellness products |

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── DemoVideoService.ts    # Main video generation service
│   └── api/
│       └── routes.ts               # API endpoints
├── demo_videos/                    # Generated videos (gitignored)
├── demo_logs/                      # Scripts & audio (gitignored)
└── package.json

allaboard/
├── components/
│   └── DemoVideoGenerator.tsx     # Frontend UI component
└── lib/
    └── api.ts                      # API client methods
```

## Limitations & Considerations

### Performance
- **Generation time**: 2-3 minutes for 120s video
- **File sizes**: 10-20MB for 2-minute videos
- **Concurrent limit**: 1 video at a time (browser resource intensive)

### Browser Compatibility
- Requires Chromium (installed via Playwright)
- Headless mode available (set in `DemoVideoService.ts:64`)
- Some sites may block automation (rare)

### API Costs (OpenAI)
- **GPT-4o-mini Vision**: ~$0.01 per request (screenshot analysis)
- **TTS**: ~$0.015 per 1,000 characters
- Typical demo: $0.05 - $0.15 total cost

### Known Issues
1. **Sites with heavy JavaScript**: May require longer timeouts
2. **Modal popups**: Can interfere with navigation (handled gracefully)
3. **CAPTCHA/bot detection**: Very rare, but can block automation
4. **Dynamic content**: AI may miss lazy-loaded content

## Troubleshooting

### "Playwright browsers not installed"
```bash
cd backend
npx playwright install chromium
```

### "Video file not found"
Check that `demo_videos` directory exists and has write permissions.

### "Voice-over generation failed"
Verify `OPENAI_KEY` is set correctly in `.env` and has TTS API access.

### "Browser won't start in headless mode"
Try disabling headless mode in `DemoVideoService.ts:64`:
```typescript
headless: false
```

### "Actions are too fast/slow"
Adjust timing in:
- `moveCursorTo`: Change `steps` parameter (line 192)
- `idleCursorMovement`: Change `waitForTimeout` (line 213)
- `smoothClick`: Change pre/post delays (lines 517-518)

## Future Enhancements

### Planned Features
- [ ] Custom branding overlay (logo watermark)
- [ ] Zoom effects on important elements (OBS-style)
- [ ] Multiple video formats (MP4, AVI)
- [ ] Background music integration
- [ ] Script editing before generation
- [ ] Pause/resume capability
- [ ] Live preview during generation
- [ ] Batch generation (multiple URLs)
- [ ] Custom action sequences (user-defined script)
- [ ] A/B testing (generate multiple variants)

### Advanced Integrations
- [ ] YouTube auto-upload
- [ ] Vimeo integration
- [ ] Social media snippets (15s/30s/60s)
- [ ] Animated captions/subtitles
- [ ] Multi-language support
- [ ] Analytics tracking (viewer engagement)

## Examples

### Example 1: SaaS Product Demo
```typescript
{
  url: "https://www.notion.so",
  storyboard: {
    title: "Notion - All-in-one workspace",
    nodes: [
      { type: "title", content: "Notion combines notes, tasks, wikis, and databases" },
      { type: "feature", content: "Create pages with rich content blocks" },
      { type: "feature", content: "Collaborate in real-time with your team" },
      { type: "benefit", content: "Everything you need in one place" },
      { type: "cta", content: "Start organizing today" }
    ]
  },
  duration: 90,
  voiceModel: "nova"
}
```

**Output:**
- 90-second demo video
- AI navigates through Notion's homepage
- Searches for "templates", clicks on workspace features
- Voice-over explains each section
- Smooth cursor guides viewer attention

### Example 2: E-commerce Demo
```typescript
{
  url: "https://www.shopify.com",
  storyboard: {
    title: "Shopify - Start selling online",
    nodes: [
      { type: "problem", content: "Selling online is complicated" },
      { type: "solution", content: "Shopify makes it simple" },
      { type: "feature", content: "Beautiful store themes" },
      { type: "feature", content: "Powerful inventory management" },
      { type: "benefit", content: "Launch in minutes, not months" }
    ]
  },
  duration: 120,
  voiceModel: "echo"
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `npm run dev` output
3. Check browser console in frontend
4. Verify API keys are configured correctly

## Credits

Built with:
- **Playwright** - Microsoft's browser automation framework
- **OpenAI GPT-4 Vision** - Intelligent page analysis
- **OpenAI TTS** - Professional voice-over generation
- **Next.js 16** - Frontend framework
- **TypeScript** - Type-safe development

---

**Version:** 1.0.0
**Last Updated:** November 2025
**License:** MIT
