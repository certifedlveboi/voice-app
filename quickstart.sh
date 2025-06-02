#!/bin/bash

echo "🚀 ElevenLabs Voice Chat Quick Start"
echo "===================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if running the Python version
if [ "$1" == "python" ]; then
    echo "📦 Setting up Python environment..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ Virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "🎙️  Starting Python voice chat..."
    echo ""
    
    # Run the Python app
    python voice_chat.py
    
else
    # Run the web version
    echo "🌐 Starting web server for browser-based chat..."
    echo ""
    echo "📋 Instructions:"
    echo "1. The web server will start on http://localhost:8000"
    echo "2. Open this URL in your browser"
    echo "3. Enter your Agent ID and optionally your API key"
    echo "4. Click 'Start Conversation' to begin"
    echo ""
    
    # Check if Python http.server is available
    if command -v python3 &> /dev/null; then
        echo "🚀 Starting server..."
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        echo "🚀 Starting server..."
        python -m SimpleHTTPServer 8000
    else
        echo "❌ No Python web server available."
        echo "Please install Python or use another web server."
        exit 1
    fi
fi 