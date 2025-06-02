#!/usr/bin/env python3
"""
ElevenLabs Voice Conversation App - Python Implementation
A simple voice chat application using ElevenLabs Conversational AI
"""

import os
import signal
import sys
from typing import Optional
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface


class VoiceChatApp:
    def __init__(self, agent_id: str, api_key: Optional[str] = None):
        """
        Initialize the Voice Chat Application
        
        Args:
            agent_id: Your ElevenLabs agent ID
            api_key: Optional API key for private agents
        """
        self.agent_id = agent_id
        self.api_key = api_key
        self.conversation = None
        self.elevenlabs = None
        
        # Initialize ElevenLabs client
        if api_key:
            self.elevenlabs = ElevenLabs(api_key=api_key)
        else:
            self.elevenlabs = ElevenLabs()
    
    def on_agent_response(self, response: str):
        """Callback for agent responses"""
        print(f"\n🤖 Agent: {response}")
    
    def on_agent_response_correction(self, original: str, corrected: str):
        """Callback for agent response corrections"""
        print(f"\n🤖 Agent (corrected): {original} → {corrected}")
    
    def on_user_transcript(self, transcript: str):
        """Callback for user transcripts"""
        print(f"\n👤 You: {transcript}")
    
    def on_latency_measurement(self, latency_ms: float):
        """Callback for latency measurements"""
        print(f"\n⚡ Latency: {latency_ms}ms")
    
    def start(self):
        """Start the voice conversation"""
        print("🎙️  ElevenLabs Voice Chat")
        print("=" * 50)
        print(f"Agent ID: {self.agent_id}")
        print(f"Authentication: {'API Key' if self.api_key else 'Public Agent'}")
        print("=" * 50)
        print("\n🔊 Starting conversation...")
        print("Speak naturally - the agent will respond!")
        print("Press Ctrl+C to end the conversation.\n")
        
        try:
            # Create conversation instance
            self.conversation = Conversation(
                # API client and agent ID
                self.elevenlabs,
                self.agent_id,
                
                # Authentication required for private agents
                requires_auth=bool(self.api_key),
                
                # Use default audio interface (system mic/speakers)
                audio_interface=DefaultAudioInterface(),
                
                # Callbacks for conversation events
                callback_agent_response=self.on_agent_response,
                callback_agent_response_correction=self.on_agent_response_correction,
                callback_user_transcript=self.on_user_transcript,
                callback_latency_measurement=self.on_latency_measurement,
            )
            
            # Start the conversation session
            self.conversation.start_session()
            
            # Set up signal handler for clean shutdown
            signal.signal(signal.SIGINT, self._signal_handler)
            
            # Wait for conversation to end
            conversation_id = self.conversation.wait_for_session_end()
            
            print(f"\n✅ Conversation ended")
            print(f"Conversation ID: {conversation_id}")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            sys.exit(1)
    
    def _signal_handler(self, signum, frame):
        """Handle Ctrl+C for clean shutdown"""
        print("\n\n🛑 Ending conversation...")
        if self.conversation:
            self.conversation.end_session()


def main():
    """Main function to run the voice chat app"""
    print("Welcome to ElevenLabs Voice Chat!")
    print("-" * 50)
    
    # Get configuration from environment or user input
    agent_id = os.getenv("ELEVENLABS_AGENT_ID")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    if not agent_id:
        agent_id = input("Enter your Agent ID: ").strip()
        if not agent_id:
            print("❌ Agent ID is required!")
            sys.exit(1)
    
    # Ask about API key if not in environment
    if not api_key and not os.getenv("ELEVENLABS_API_KEY"):
        use_api_key = input("Is this a private agent? (y/n): ").lower()
        if use_api_key == 'y':
            api_key = input("Enter your API Key: ").strip()
    
    # Create and start the app
    app = VoiceChatApp(agent_id, api_key)
    app.start()


if __name__ == "__main__":
    main() 