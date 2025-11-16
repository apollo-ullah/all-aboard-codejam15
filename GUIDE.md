# AI Product Demo Agent v2

🎬 **Fully automated product demonstrations powered by AI**

Create professional product demo videos automatically with AI-powered navigation, visible cursor tracking, and sales-style narration with timestamps.

## 🚀 What's New in v2

### Major Improvements:

- ✅ **Fullscreen Recording** - No cropping, perfect 1080p videos
- ✅ **Visible Cursor Overlay** - Custom red cursor visible in recordings
- ✅ **AI Vision** - GPT-4 Vision analyzes screenshots to make decisions
- ✅ **Dynamic Interactions** - Searches, clicks links, navigates pages
- ✅ **Shorter Sections** - Brief, engaging 5-10 second presentations per feature
- ✅ **Smart Salesman** - AI acts like a real product presenter

## 📦 Installation

```bash
# Install dependencies
pip install -r requirements.txt
playwright install chromium
```

## 🎯 Quick Start

### Run a Demo

```bash
python smart_agent.py data/github_input.json
```

**Available Demos:**

- `data/github_input.json` - GitHub platform demo
- `data/amazon_ca_input.json` - Amazon Canada e-commerce
- `data/shopify_input.json` - Shopify SaaS platform

### Create Your Own

1. **Create company JSON** (see template below)
2. **Run the agent**: `python smart_agent.py data/your_company.json`
3. **Get outputs**:
   - 📹 Video: `demo_videos/`
   - 📝 Narration log: `demo_logs/`

## 📋 Company JSON Template

```json
{
  "company_name": "Your Company",
  "website_url": "https://yourcompany.com",
  "description": "What your company does",
  "key_features": [
    {
      "feature_name": "Main Feature",
      "description": "What it does and why it matters",
      "importance": "high",
      "demo_priority": 1
    }
  ],
  "unique_selling_points": ["Why customers choose you"]
}
```

## 🎬 How It Works

### 1. AI Vision Analysis

The agent takes screenshots and uses GPT-4 Vision to:

- Analyze what's visible on the page
- Identify interactive elements (buttons, links, search boxes)
- Decide the best next action like a real salesman

### 2. Dynamic Interaction

Based on AI analysis, the agent can:

- **Search** for products/features
- **Click** on links and buttons
- **Navigate** between pages
- **Scroll** to show content
- **Highlight** key features

### 3. Cursor Visualization

A custom red cursor overlay:

- Shows smooth mouse movements
- Pulses when clicking
- Visible in all recordings
- Looks professional and human-like

### 4. Sales Narration

AI generates natural commentary:

- Explains each action
- Highlights value to customers
- Brief and engaging (max 20 words)
- Timestamped for voice-over sync

## 📊 Output Format

### Video (.webm)

- 1920x1080 fullscreen
- Smooth cursor movements
- Professional quality
- ~2 minutes duration

### Narration Log (JSON)

```json
{
  "company": "GitHub",
  "total_duration": 120.5,
  "actions_taken": ["searched:react", "clicked:first result"],
  "narrations": [
    {
      "timestamp": 5.23,
      "time_formatted": "00:05.230",
      "action": "search",
      "narration": "Let's find some amazing React projects!"
    }
  ]
}
```

## 🎯 Demo Examples

### GitHub Demo

Shows:

- Homepage navigation
- Exploring Solutions menu
- Clicking through Enterprise features
- GitHub Copilot pages
- Dynamic page exploration

### Amazon Demo

Shows:

- Homepage overview
- Product search functionality
- Category browsing
- Search results
- Product details

### Custom Sites

Works with any website - AI adapts to:

- E-commerce stores
- SaaS platforms
- Corporate websites
- Portfolio sites
- Landing pages

## 🛠️ Configuration

### Adjust Demo Duration

In `smart_agent.py`:

```python
if elapsed > 115:  # Change to desired seconds
    break
```

### Customize Cursor

Modify the cursor CSS in `cursor_script`:

```python
background: radial-gradient(circle, rgba(255,0,0,0.8) ...  # Change color
width: 24px;  # Change size
```

### API Settings

```python
model="gpt-4o-mini",  # or gpt-4o for better quality
temperature=0.7,  # Higher = more creative
max_tokens=200  # Narration length
```

## 🎨 Advanced Features

### Vision-Powered Decisions

The AI can "see" the page and make smart choices:

- Identifies search bars automatically
- Finds relevant product links
- Spots call-to-action buttons
- Navigates complex menus

### Human-Like Behavior

- Smooth cursor movements (20-step interpolation)
- Natural typing speed (80ms per character)
- Realistic pauses between actions
- Scroll animations

### Stealth Mode

Avoids bot detection:

- Removes webdriver flags
- Custom user agent
- Natural interaction timing
- Fullscreen mode

## 📈 Use Cases

1. **Product Launches** - Create demo videos for new features
2. **Sales Pitches** - Automated sales presentations
3. **Marketing Content** - Generate video content at scale
4. **Onboarding** - Customer training videos
5. **Documentation** - Visual feature walkthroughs
6. **Competitive Analysis** - Document competitor features

## 🐛 Troubleshooting

**Cursor not visible?**

- Cursor overlay auto-injects on page load
- Re-injected after each navigation
- Check console for injection errors

**AI making poor decisions?**

- Increase temperature for more creativity
- Add more detail to company JSON
- Use gpt-4o instead of gpt-4o-mini

**Site blocks automation?**

- Some sites (Amazon) have bot detection
- Try GitHub, public sites first
- Stealth mode helps but not guaranteed

**Video quality issues?**

- Recording is 1080p by default
- Increase resolution in config
- Check system resources

## 💡 Tips for Best Results

1. **Good Input Data** - Clear feature descriptions help AI understand what to showcase
2. **Test Sites First** - Try GitHub or simple sites before complex ones
3. **Review Logs** - Check narration timestamps before voice-over production
4. **Customize Narration** - Edit AI-generated text if needed
5. **Multiple Takes** - Run agent multiple times for different approaches

## 📁 Project Files

```
smart_agent.py          # Main v2 agent (USE THIS)
enhanced_agent.py       # v1 agent (fallback)
ai_demo_agent.py        # Original with advanced reasoning
run_demo.py             # CLI runner
web_agent.py            # Base automation library
data/                   # Company JSON inputs
demo_videos/            # Video outputs
demo_logs/              # Narration logs
```

## 🚀 Next Steps

After running a demo:

1. **Watch the video** in `demo_videos/`
2. **Review narration log** in `demo_logs/`
3. **Edit timestamps** if needed for voice-over
4. **Add voice-over** using narration text
5. **Publish** your automated demo!

## 📄 Requirements

```
playwright==1.48.0
openai>=1.0.0
```

Python 3.8+ required

## 🎓 Example Workflow

```bash
# 1. Create your company JSON
code data/mycompany_input.json

# 2. Run the agent
python smart_agent.py data/mycompany_input.json

# 3. View outputs
start demo_videos  # Open video folder
code demo_logs     # Review narration

# 4. Add voice-over (external tool)
# Use timestamps from JSON to sync audio

# 5. Done! You have a professional demo video
```

## 🤝 Contributing

This is a hackathon project - feel free to:

- Improve AI decision-making
- Add new interaction types
- Enhance cursor animations
- Support more AI models
- Add video editing features

---

**Built with ❤️ using Playwright, OpenAI GPT-4 Vision, and lots of AI magic**

**v2.0** - November 2025
