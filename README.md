# ElevenLabs Voice Conversation App

A simple web-based voice conversation application using ElevenLabs' Conversational AI API. This app allows you to have real-time voice conversations with an AI agent, featuring both speech-to-text and text-to-speech capabilities in a single API.

## Features

- 🎙️ Real-time voice conversations
- 🗣️ Speech-to-text transcription
- 🔊 Text-to-speech synthesis
- 💬 Conversation history display
- 🚀 Low latency (~75ms with Flash model)
- 🌐 Works directly in the browser
- 💾 Saves configuration locally

## Prerequisites

Before using this app, you need:

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **Conversational AI Agent**: Create an agent in your ElevenLabs dashboard
3. **Agent ID**: Get this from your agent settings
4. **API Key** (optional): Only needed for private agents

## Setup Instructions

### Step 1: Create an ElevenLabs Agent

1. Log into your [ElevenLabs account](https://elevenlabs.io)
2. Navigate to the "Conversational AI" section
3. Click "Create Agent"
4. Configure your agent:
   - Choose a voice (use your Voice ID if you have one)
   - Select an LLM (Gemini, Claude, OpenAI, etc.)
   - Set up the agent's personality and instructions
   - Configure any tools or knowledge base if needed
5. Save your agent and copy the **Agent ID**

### Step 2: Get Your API Key (for private agents)

1. Go to your ElevenLabs dashboard
2. Navigate to "API Keys" section
3. Create or copy your API key
4. Keep it secure!

### Step 3: Run the Application

#### Option 1: Using a Local Web Server (Recommended)

```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Or using any other local web server
```

Then open `http://localhost:8000` in your browser.

#### Option 2: Using a CDN-hosted Version

Simply open `index.html` in a modern web browser. Note that some browsers may have CORS restrictions when opening files directly.

## How to Use

1. **Enter Configuration**:
   - Paste your Agent ID in the first input field
   - (Optional) Enter your API key if using a private agent

2. **Start Conversation**:
   - Click "Start Conversation"
   - Allow microphone access when prompted
   - Wait for the "Connected" status

3. **Talk with the AI**:
   - Simply speak naturally
   - The agent will listen, process, and respond
   - Watch the conversation history update in real-time

4. **End Conversation**:
   - Click "Stop Conversation" when done

## Features Explained

### Real-time Processing
The app uses ElevenLabs' WebSocket API for ultra-low latency communication:
- Speech is transcribed as you talk
- AI responses are generated and spoken immediately
- Intelligent turn-taking prevents interruptions

### Voice Models
ElevenLabs offers different models:
- **Flash v2.5**: Ultra-low latency (~75ms), 32 languages
- **Multilingual v2**: Highest quality, 29 languages

### Conversation History
All transcripts are displayed in the conversation log:
- Blue messages: Your speech
- Purple messages: Agent responses

## Configuration Storage
The app saves your Agent ID and API key locally in your browser for convenience. Clear your browser data to remove saved configuration.

## Troubleshooting

### "Failed to start conversation"
- Check your Agent ID is correct
- Ensure your agent is active in the ElevenLabs dashboard
- For private agents, verify your API key

### No audio/microphone issues
- Ensure you've granted microphone permissions
- Check your microphone is working in system settings
- Try using headphones to avoid echo

### Connection drops
- Check your internet connection
- Verify your ElevenLabs account has available credits
- Try refreshing the page

## Security Notes

⚠️ **Important**: 
- Never share your API key publicly
- For production apps, use a backend server to handle API authentication
- The current implementation stores the API key in browser localStorage

## Advanced Usage

### Customizing the Agent

In your ElevenLabs dashboard, you can:
- Change the voice and voice settings
- Modify the agent's personality and instructions
- Add tools for external API calls
- Upload knowledge base documents
- Set up conversation flow rules

### Integration Options

This is a basic implementation. You can extend it with:
- Backend authentication server
- Session management
- Audio recording and playback controls
- Visual voice activity indicators
- Multi-language support
- Custom UI themes

## Pricing

ElevenLabs Conversational AI pricing:
- **Free tier**: 10 minutes/month
- **Paid plans**: Starting at $0.08/minute
- Includes LLM, STT, and TTS costs

## Resources

- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [Conversational AI Guide](https://elevenlabs.io/docs/conversational-ai/overview)
- [API Reference](https://elevenlabs.io/docs/api-reference/introduction)
- [Voice Library](https://elevenlabs.io/voice-library)

## License

This project is provided as-is for educational purposes. Please refer to ElevenLabs' terms of service for API usage.

## Support

For issues with:
- This app: Check the troubleshooting section above
- ElevenLabs API: Contact [ElevenLabs support](https://elevenlabs.io/help)
- Agent configuration: Refer to the [documentation](https://elevenlabs.io/docs) 