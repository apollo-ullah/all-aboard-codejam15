#!/bin/bash
# Setup script for backend .env file

echo "🔧 Setting up backend .env file..."

# Check if .env exists
if [ -f .env ]; then
  echo "⚠️  .env file already exists"
  read -p "Do you want to update it? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping .env setup"
    exit 0
  fi
fi

# Create .env from .env.example if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
fi

# Update AGENT_API_KEY if it's commented out or missing
if ! grep -q "^AGENT_API_KEY=" .env || grep -q "^#.*AGENT_API_KEY" .env; then
  echo ""
  echo "📝 Please add your API keys to backend/.env:"
  echo ""
  echo "Required keys:"
  echo "  - AGENT_API_KEY (Browser.cash Agent API)"
  echo "  - OPENAI_KEY (OpenAI API)"
  echo "  - GAMMA_API_KEY (Gamma API)"
  echo ""
  echo "Example:"
  echo "  AGENT_API_KEY=your_key_here"
  echo "  OPENAI_KEY=your_key_here"
  echo "  GAMMA_API_KEY=your_key_here"
  echo ""
  echo "After adding keys, restart the backend server."
else
  echo "✅ AGENT_API_KEY is configured in .env"
fi

