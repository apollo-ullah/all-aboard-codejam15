# AI Product Demo Agent

An AI-powered web browsing agent that demonstrates company websites like a human salesman, complete with smooth cursor movements, screen recording, and timestamped narration for voice-over integration.

## 🎯 Project Overview

This project creates automated product demonstrations of company websites by:

1. **Reading company data** from JSON files (features, description, market info)
2. **Navigating the website** with human-like browsing behavior
3. **Demonstrating key features** intelligently using AI reasoning
4. **Recording everything** as a video with visible cursor movements
5. **Generating narration** with timestamps for voice-over integration

Perfect for creating product launch videos, sales demos, and marketing content automatically.

## ✨ Key Features

- 🤖 **AI-Powered Navigation** - Uses OpenAI GPT to decide what to demonstrate next
- 🎬 **Screen Recording** - Full 1080p video capture of the browsing session
- 🖱️ **Visible Cursor** - Smooth mouse movements visible in recordings
- 🎤 **Sales Narration** - Human-like commentary explaining each feature
- ⏱️ **Timestamp Logs** - JSON logs with precise timestamps for voice-over sync
- 🎯 **Feature-Focused** - Prioritizes important features from company data
- 📝 **Session Tracking** - Complete logs of all actions and decisions

## 📦 Installation

### Prerequisites

- Python 3.8+
- Windows/macOS/Linux
- Internet connection (for OpenAI API)

### Setup

1. **Clone/Download the project**
2. **Create virtual environment**:

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # macOS/Linux
```

3. **Install dependencies**:

```bash
pip install -r requirements.txt
playwright install chromium
```

## 🚀 Quick Start

### 1. Prepare Company Data

Create a JSON file with your company information (see `data/amazon_ca_input.json` for example):

```json
{
  "company_name": "Your Company",
  "website_url": "https://yourcompany.com",
  "description": "Brief description of what the company does",
  "key_features": [
    {
      "feature_name": "Feature Name",
      "description": "What this feature does",
      "importance": "high",
      "demo_priority": 1
    }
  ],
  "unique_selling_points": ["Why customers choose you"]
}
```

### 2. Run the Demo

**Enhanced Agent (Recommended)**

```bash
python enhanced_agent.py data/your_company_input.json
```

**Example with Amazon.ca:**

```bash
python enhanced_agent.py data/amazon_ca_input.json
```

### 3. View Outputs

After the demo completes, check:

- **📹 Video**: `demo_videos/` - Full screen recording
- **📝 Narration Log**: `demo_logs/` - JSON with timestamps and narration text

## 📂 Project Structure

```
hackathon-video-agent/
├── data/                          # Company input JSON files
│   ├── amazon_ca_input.json      # Example: Amazon Canada
│   └── shopify_input.json        # Example: Shopify
├── demo_videos/                   # Video recordings output
├── demo_logs/                     # Narration timestamp logs
├── enhanced_agent.py              # Main demo agent (recommended)
├── ai_demo_agent.py              # Advanced agent with full AI reasoning
├── run_demo.py                    # CLI runner for ai_demo_agent
├── web_agent.py                   # Base web automation class
└── requirements.txt               # Python dependencies
```

## 🎬 How It Works

### 1. Input Processing

The agent reads your company JSON file to understand:

- What features to demonstrate
- Priority order for demo flow
- Company description for narration context

### 2. AI Decision Making

Uses OpenAI GPT-4 to:

- Decide which feature to demonstrate next
- Generate natural, salesman-like narration
- Choose optimal timing for each action

### 3. Human-Like Browsing

- Smooth scrolling with gradual motion
- Visible mouse cursor movements
- Natural pacing between actions
- Realistic click animations

### 4. Output Generation

Creates two outputs:

- **Video file** (.webm format, 1920x1080)
- **Narration log** (JSON with timestamps)

## 📊 Narration Log Format

The generated JSON log contains:

```json
{
  "company": "Amazon Canada",
  "total_duration": 120.5,
  "features_demonstrated": ["Feature 1", "Feature 2"],
  "narrations": [
    {
      "timestamp": 0.0,
      "time_formatted": "00:00.000",
      "action": "Starting demonstration",
      "narration": "Welcome to Amazon.ca, where shopping is fast and easy!"
    }
  ]
}
```

Use these timestamps to sync voice-over audio with the video.

## 🛠️ Configuration

### OpenAI API Key

Edit the API key in `enhanced_agent.py` or pass as environment variable.

### Demo Duration

Default is 2 minutes. Modify in the code:

```python
if elapsed > 120:  # Change to desired seconds
    break
```

### Video Quality

Adjust in agent initialization:

```python
record_video_size={"width": 1920, "height": 1080}  # Change resolution
```

## 📋 Example Company Data Files

### Amazon.ca (E-commerce)

Demonstrates product catalog, search, reviews, and shopping features.

### Shopify (SaaS Platform)

Shows store setup, themes, payment processing, and analytics.

## 🎯 Use Cases

1. **Product Launch Videos** - Automate demo video creation
2. **Sales Presentations** - Generate consistent product demos
3. **Marketing Content** - Create walkthrough videos at scale
4. **Customer Onboarding** - Show features systematically
5. **Training Materials** - Create standardized training videos

## 🐛 Troubleshooting

**Issue: Video has no cursor visible**

- Make sure to run in non-headless mode (`headless=False`)
- The cursor is only visible when browser window is shown

**Issue: OpenAI API errors**

- Verify API key is valid
- Check internet connection
- Ensure sufficient API credits

**Issue: Website won't load**

- Try changing `wait_until` parameter to `'domcontentloaded'`
- Increase timeout values

**Issue: Choppy mouse movements**

- Reduce scroll steps for smoother motion
- Increase delays between actions

## 📝 Requirements

```
playwright==1.48.0
openai>=1.0.0
```

## 🎓 Tips for Best Results

1. **Prepare Good Input Data** - Clear feature descriptions help AI generate better narration
2. **Test on Simple Sites First** - Start with your demo site before complex production sites
3. **Adjust Demo Duration** - 1-2 minutes works best for engagement
4. **Review Narration Logs** - Edit timestamps if needed before voice-over
5. **Use High-Priority Features** - Focus on most important features first

## 📄 License

MIT License - Free to use and modify

---

**Built with ❤️ using Playwright and OpenAI GPT-4**
