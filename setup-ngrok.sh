#!/bin/bash

echo "🔧 Ngrok Setup Helper"
echo "===================="
echo ""

# Check if ngrok is configured
if ngrok config check 2>&1 | grep -q "Error reading configuration file"; then
    echo "❌ Ngrok is not configured yet."
    echo ""
    echo "To use ngrok, you need to:"
    echo "1. Sign up for a free account at https://ngrok.com/signup"
    echo "2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ngrok config add-authtoken YOUR_AUTHTOKEN"
    echo ""
    echo "Alternatively, you can use these free alternatives:"
    echo ""
    echo "Option 1: Use serveo.net (no signup required):"
    echo "  ssh -R 80:localhost:3000 serveo.net"
    echo ""
    echo "Option 2: Use localhost.run (no signup required):"
    echo "  ssh -R 80:localhost:3000 nokey@localhost.run"
    echo ""
    echo "Option 3: Use localtunnel (requires npm):"
    echo "  npm install -g localtunnel"
    echo "  lt --port 3000"
    echo ""
else
    echo "✅ Ngrok is configured!"
    echo "Starting ngrok tunnel..."
    ngrok http 3000
fi 