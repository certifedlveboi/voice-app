#!/bin/bash

echo "🌐 Looking for tunnel URL..."
echo ""

# Try to find the localtunnel URL in recent output
# Since localtunnel runs in background, we'll look for its output
echo "Your webhook URL is likely one of these formats:"
echo ""
echo "📍 https://[random-subdomain].loca.lt/webhook"
echo ""
echo "To see the exact URL, check the terminal where localtunnel is running."
echo ""
echo "⚡ Quick Setup Guide for ElevenLabs:"
echo "1. The base URL will be something like: https://xxxxx.loca.lt"
echo "2. Your webhook endpoint will be: https://xxxxx.loca.lt/webhook"
echo "3. Use this URL when configuring tools in your ElevenLabs agent"
echo ""
echo "📝 Note: If the tunnel URL isn't visible, you can restart localtunnel with:"
echo "   pkill -f 'lt --port 3000' && lt --port 3000"
echo ""
echo "This will display the URL in the terminal." 