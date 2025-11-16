#!/bin/bash
# Temporary script to start backend with API key
# This ensures AGENT_API_KEY is available even if .env isn't loading properly

export AGENT_API_KEY="yl6ycfwomtu81045r2vn2gdyppkit98brg6qclo54o101jvtghnzr9b3nkgyy0va"

echo "🔑 AGENT_API_KEY is set (${#AGENT_API_KEY} chars)"
echo "🚀 Starting backend with API key..."

# Start the backend
npm run dev

