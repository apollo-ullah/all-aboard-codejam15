# Browser.cash API Setup Guide

## 🎯 Problem Identified

**Web scraping has never been working because `AGENT_API_KEY` is missing from your `.env` file.**

## ✅ Solution: 3 Simple Steps

### Step 1: Get Your API Key

1. Go to **https://ai.browser.cash**
2. **Sign up** or **Log in**
3. Find your **API Key** in the dashboard
4. Copy the API key (it should be a long string)

### Step 2: Add API Key to `.env`

1. Open the file: `backend/.env`
2. Add this line (replace with your actual key):
   ```bash
   AGENT_API_KEY=your_actual_api_key_here
   ```
3. Save the file

Your `.env` file should look something like:
```bash
PORT=3000
FRONTEND_URL=http://localhost:3001
OPENAI_API_KEY=sk-...
AGENT_API_KEY=bc_1234567890abcdef...  # <-- YOUR BROWSERCASH KEY
NODE_ENV=development
```

### Step 3: Restart the Backend

Run this command:
```bash
cd /Users/adyanullah/Documents/GitHub/all-aboard-codejam15/backend
chmod +x restart-backend.sh
./restart-backend.sh
```

Or manually:
```bash
# Stop backend
lsof -ti:3000 | xargs kill -9

# Start backend
cd backend
npm run dev
```

## 🧪 Test It Works

After adding the API key and restarting, run the test script:

```bash
cd backend
node test-browsercash-ceo.js
```

You should see:
```
✅ Task created successfully!
🔄 Polling task status...
✅ Task completed successfully!
✅ Browser.cash API is WORKING!
```

## 📊 Code Status

**Good News:** Your code is already using the correct format from the CEO!

✅ Using `agent: 'gemini'`  
✅ Using `mode: 'text'`  
✅ Using `stepLimit: 25`  
✅ Correct API endpoint: `https://agent-api.browser.cash/v1/task/create`  
✅ Correct polling endpoint: `https://agent-api.browser.cash/v1/task/{taskId}`  

**The ONLY thing missing is the API key in `.env`**

## 🚀 After Setup

Once the API key is added:

1. **Reload your frontend** (browser refresh)
2. **Try scraping a simple URL** like:
   - https://www.ycombinator.com
   - https://stripe.com
   - Any simple company website

3. **Avoid complex pages initially** - The Ollama GitHub page is MASSIVE and may timeout even with a working API

## ⚠️ Important Notes

- **2-minute timeout**: If a page is too complex, it will timeout after 2 minutes
- **Simple pages first**: Test with simple sites before trying complex ones
- **Check logs**: Watch backend logs with `tail -f /tmp/backend.log`
- **API key security**: Never commit `.env` to git (it's already in `.gitignore`)

## 🐛 Troubleshooting

### If test script says "API Key Missing":
- Double-check `.env` file has the line
- Make sure there are no spaces around the `=` sign
- Restart the backend after adding the key

### If API returns 401/403:
- API key is invalid or expired
- Check your Browser.cash dashboard for the correct key
- Make sure you copied the entire key (no truncation)

### If task times out:
- Try a simpler URL
- Complex pages with lots of JavaScript may take longer
- GitHub repos with 100k+ stars are very difficult to scrape

## 📧 CEO's Confirmation

The CEO confirmed the API is working as expected. He provided an example script which matches the format already in our code. Once the API key is added, everything should work!

**Example from CEO:**
```javascript
{
  agent: 'gemini',
  prompt: 'go to URL and do X',
  mode: 'text',
  stepLimit: 25
}
```

**Our code (already correct):**
```typescript
{
  agent: 'gemini',
  prompt: prompt,
  mode: 'text',
  stepLimit: 25
}
```

✅ **Everything matches!** Just add the API key and you're good to go.

