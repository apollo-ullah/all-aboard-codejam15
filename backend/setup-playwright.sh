#!/bin/bash

echo "🎬 Setting up Playwright for AI Demo Video Generator"
echo "=================================================="
echo ""

# Install Playwright browsers
echo "📦 Installing Playwright Chromium browser..."
npx playwright install chromium

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Playwright setup complete!"
    echo ""
    echo "You can now use the AI Demo Video Generator feature."
    echo "Make sure your .env file has OPENAI_KEY configured."
else
    echo ""
    echo "❌ Playwright setup failed"
    echo "Please run manually: npx playwright install chromium"
    exit 1
fi
