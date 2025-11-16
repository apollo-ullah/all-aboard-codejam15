# Integration Guide: Adding Demo Video Generator to Your UI

## Option 1: Add to Main Page (Recommended)

Add the Demo Video Generator component after the slide generation section in `allaboard/app/page.tsx`.

### Step 1: Import the Component

Add this import at the top of `allaboard/app/page.tsx`:

```typescript
import { DemoVideoGenerator } from '@/components/DemoVideoGenerator';
```

### Step 2: Add Component to UI

Find the section where slides are generated (around line 400-500), and add the DemoVideoGenerator after the presentation viewer:

```typescript
{/* Demo Video Generator - NEW FEATURE */}
{stage === 'editing' && currentStoryboard && currentUrl && (
  <div className="mt-8">
    <DemoVideoGenerator
      url={currentUrl}
      storyboard={currentStoryboard}
    />
  </div>
)}

{/* Or after presentation is generated */}
{stage === 'presentation' && currentStoryboard && currentUrl && (
  <div className="mt-8">
    <DemoVideoGenerator
      url={currentUrl}
      storyboard={currentStoryboard}
    />
  </div>
)}
```

### Step 3: Test

1. Start the app
2. Generate a storyboard
3. Look for the "AI Demo Video Generator" card
4. Click "Generate AI Demo Video"

## Option 2: Standalone Page

Create a dedicated demo video page at `allaboard/app/demo-video/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { DemoVideoGenerator } from '@/components/DemoVideoGenerator';
import { Storyboard } from '@/types';

export default function DemoVideoPage() {
  // You can fetch storyboards from local storage, API, or props
  const [url, setUrl] = useState('');
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          AI Demo Video Generator
        </h1>

        {/* URL Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Enter website URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
          />
        </div>

        {/* Demo Video Generator */}
        {url && storyboard && (
          <DemoVideoGenerator
            url={url}
            storyboard={storyboard}
          />
        )}
      </div>
    </div>
  );
}
```

Then access at: `http://localhost:3001/demo-video`

## Option 3: Modal/Dialog

Use the component in a modal for a cleaner UX:

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DemoVideoGenerator } from '@/components/DemoVideoGenerator';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

// Inside your component:
<Dialog>
  <DialogTrigger asChild>
    <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
      <Video className="mr-2 h-4 w-4" />
      Generate Demo Video
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>AI Demo Video Generator</DialogTitle>
    </DialogHeader>
    <DemoVideoGenerator
      url={currentUrl}
      storyboard={currentStoryboard}
    />
  </DialogContent>
</Dialog>
```

## Customization Examples

### Custom Button Styling

```typescript
// In DemoVideoGenerator.tsx, modify the generate button:
<Button
  onClick={handleGenerateVideo}
  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
  size="lg"
>
  <Play className="mr-2 h-5 w-5" />
  Create Demo Video
</Button>
```

### Auto-Generate on Storyboard Complete

```typescript
// In your main component:
useEffect(() => {
  if (currentStoryboard && autoGenerateVideo) {
    // Automatically trigger video generation
    generateVideo();
  }
}, [currentStoryboard]);
```

### Progress Callbacks

Modify `DemoVideoGenerator.tsx` to emit progress events:

```typescript
interface DemoVideoGeneratorProps {
  url: string;
  storyboard: Storyboard;
  onProgress?: (progress: string) => void;
  onComplete?: (result: GenerationResult) => void;
  onError?: (error: string) => void;
}

// Then use:
<DemoVideoGenerator
  url={url}
  storyboard={storyboard}
  onProgress={(msg) => console.log('Progress:', msg)}
  onComplete={(result) => console.log('Complete:', result)}
  onError={(err) => console.error('Error:', err)}
/>
```

## Advanced Integration

### Integration with Existing Workflow

```typescript
// After slides are generated, automatically offer demo video:
const handleSlidesGenerated = async (slides: GenerateSlidesResponse) => {
  // Show slides
  setPresentation(slides);

  // Ask user if they want a demo video
  const wantVideo = confirm('Slides generated! Generate a demo video too?');

  if (wantVideo) {
    // Trigger video generation
    await generateDemoVideo();
  }
};
```

### Batch Processing

```typescript
// Generate videos for multiple URLs:
const urls = ['https://airbnb.com', 'https://notion.so', 'https://shopify.com'];

for (const url of urls) {
  const storyboard = await api.scrapeWebsite(url, 'standard');
  await api.generateDemoVideo(url, storyboard.storyboard);
}
```

### Custom Voice Selection by Product Type

```typescript
const getOptimalVoice = (url: string): VoiceModel => {
  if (url.includes('tech') || url.includes('saas')) return 'echo';
  if (url.includes('fashion') || url.includes('lifestyle')) return 'nova';
  if (url.includes('finance') || url.includes('corporate')) return 'onyx';
  return 'alloy'; // default
};

<DemoVideoGenerator
  url={url}
  storyboard={storyboard}
  voiceModel={getOptimalVoice(url)}
/>
```

## Backend Customization

### Adjust Cursor Behavior

In `backend/src/services/DemoVideoService.ts`:

```typescript
// Line 192: Slower cursor movement
await this.moveCursorTo(targetX, targetY, 50); // Was: 25

// Line 213: More idle movement
await this.page.waitForTimeout(500); // Was: 200

// Line 214: Bigger idle movements
const offsetX = Math.floor(Math.random() * 120) - 60; // Was: 60 - 30
```

### Change Video Quality

```typescript
// Line 70: Higher resolution
viewport: { width: 2560, height: 1440 } // Was: 1920x1080

// Line 67: Change format (requires additional setup)
recordVideo: {
  dir: this.videosDir,
  size: { width: 3840, height: 2160 }, // 4K
}
```

### Add Custom Actions

```typescript
// Add to executeAction() method:
case 'highlight':
  // Add highlight overlay to element
  await this.page.evaluate(`
    const element = document.querySelector('${target}');
    element.style.boxShadow = '0 0 20px rgba(255,0,0,0.8)';
  `);
  break;

case 'zoom':
  // Zoom into specific element
  await this.page.evaluate(`
    const element = document.querySelector('${target}');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.transform = 'scale(1.2)';
  `);
  break;
```

## Testing

### Test the Service Directly

```bash
cd backend
npx ts-node -e "
import { DemoVideoService } from './src/services/DemoVideoService';

const service = new DemoVideoService({
  openaiApiKey: process.env.OPENAI_KEY!
});

service.generateDemoVideo({
  url: 'https://example.com',
  storyboard: {
    title: 'Test Demo',
    nodes: [
      { id: '1', type: 'title', content: 'Welcome to our product', position: { x: 0, y: 0 } }
    ]
  },
  duration: 30
}).then(result => {
  console.log('Video generated:', result);
});
"
```

### Mock API Responses

For testing without OpenAI API calls:

```typescript
// In DemoVideoService.ts, replace aiDecideNextAction():
private async aiDecideNextAction(): Promise<NavigationDecision | null> {
  // Mock responses for testing
  const mockActions = [
    { action_type: 'scroll', target: '300', reason: 'test', narration: 'Scrolling down' },
    { action_type: 'wait', reason: 'test', narration: 'Pausing' },
    { action_type: 'click_link', target: 'About', reason: 'test', narration: 'Clicking About' }
  ];

  return mockActions[this.actionsTaken.length % mockActions.length];
}
```

## Production Checklist

Before deploying to production:

- [ ] Set `headless: true` in `DemoVideoService.ts:64`
- [ ] Add rate limiting to `/api/generate-demo-video` endpoint
- [ ] Implement video storage cleanup (delete old videos)
- [ ] Add authentication to video download endpoint
- [ ] Configure CDN for video delivery
- [ ] Set up monitoring for long-running video jobs
- [ ] Add queue system for concurrent video requests
- [ ] Implement video compression (optional)
- [ ] Add watermark/branding (optional)
- [ ] Set up automatic video expiration

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [OpenAI TTS Guide](https://platform.openai.com/docs/guides/text-to-speech)
- [GPT-4 Vision](https://platform.openai.com/docs/guides/vision)
- [WebM Format](https://www.webmproject.org/)

---

**Need help?** See DEMO_VIDEO_README.md for full documentation
