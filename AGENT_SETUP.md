# ElevenLabs Agent Setup Guide for Notes & Reminders

This guide will help you configure your ElevenLabs Conversational AI agent to handle notes and reminders through voice commands.

## Overview

Your voice assistant can now:
- ✅ Add notes and reminders through voice commands
- ✅ Read back your notes and reminders
- ✅ Delete notes
- ✅ Clear all notes
- ✅ Display notes in real-time in the UI

## Setup Options

### Option 1: Client-Side Only (Simple, Currently Implemented)

The current implementation processes voice commands directly in the browser. This works immediately without any additional setup!

**How it works:**
- Voice commands are processed in JavaScript
- Notes are stored in browser localStorage
- No server required
- Works offline once loaded

**Supported Commands:**
- "Add a note: [your note content]"
- "Create a reminder: [your reminder content]"
- "Read my notes"
- "Read my reminders"
- "Clear all notes"
- "Delete the last note"

### Option 2: Agent with Tools (Advanced, More Natural)

For a more natural conversation experience, you can configure your ElevenLabs agent with custom tools.

#### Step 1: Configure Agent System Prompt

In your ElevenLabs dashboard, update your agent's system prompt:

```
You are a helpful voice assistant that can manage notes and reminders for the user. 

You have access to the following capabilities:
- Adding notes and reminders
- Reading back saved notes and reminders
- Deleting specific notes
- Clearing all notes

When the user asks you to add a note or reminder, listen carefully to what they want to save and confirm it back to them.

Be conversational and natural in your responses. For example:
- Instead of saying "I've added your note", say something like "Got it! I've saved that for you."
- When reading notes, present them in a natural, conversational way.

Always be helpful and proactive. If the user seems to be trying to use a notes feature, guide them on how to phrase their request.
```

#### Step 2: Add Tools to Your Agent (Optional)

If you want to use server-side tools:

1. **Run the tools server:**
   ```bash
   node agent-tools-server.js
   ```

2. **Expose it to the internet using ngrok:**
   ```bash
   npx ngrok http 3001
   ```

3. **Configure tools in ElevenLabs dashboard:**

   **Tool 1: Add Note**
   - Name: `add_note`
   - Description: "Add a note or reminder for the user"
   - URL: `https://your-ngrok-url.ngrok.io/add-note`
   - Method: POST
   - Parameters:
     - `content` (string, required): The note content
     - `type` (string, optional): Either "note" or "reminder"

   **Tool 2: Get Notes**
   - Name: `get_notes`
   - Description: "Retrieve user's notes or reminders"
   - URL: `https://your-ngrok-url.ngrok.io/get-notes`
   - Method: GET
   - Parameters:
     - `type` (string, optional): Filter by "note" or "reminder"

   **Tool 3: Delete Note**
   - Name: `delete_note`
   - Description: "Delete a specific note"
   - URL: `https://your-ngrok-url.ngrok.io/delete-note`
   - Method: POST
   - Parameters:
     - `noteId` (number, required): The ID of the note to delete

   **Tool 4: Clear Notes**
   - Name: `clear_notes`
   - Description: "Clear all notes and reminders"
   - URL: `https://your-ngrok-url.ngrok.io/clear-notes`
   - Method: POST

## Example Conversations

### Adding Notes
- **You:** "Add a note: Call John tomorrow at 3 PM"
- **Agent:** "I've saved that note for you!"

### Creating Reminders
- **You:** "Remind me to buy groceries"
- **Agent:** "I've created a reminder to buy groceries."

### Reading Notes
- **You:** "What are my notes?"
- **Agent:** "Here are your notes: 1. Call John tomorrow at 3 PM. 2. Finish project proposal."

### Managing Notes
- **You:** "Delete the last note"
- **Agent:** "I've deleted your last note about finishing the project proposal."

## Tips for Natural Conversation

1. **Be flexible with phrasing** - The agent understands variations like:
   - "Take a note"
   - "Remember this"
   - "Make a reminder"
   - "What did I ask you to remember?"

2. **Use context** - The agent can understand context:
   - "Add that to my notes"
   - "Remind me about that later"

3. **Combine actions** - You can have natural conversations:
   - "I need to call Sarah tomorrow. Can you add that to my reminders?"
   - "What notes do I have? ... Okay, delete the second one."

## Troubleshooting

### Notes not appearing in UI
- Refresh the page to ensure the latest JavaScript is loaded
- Check browser console for any errors
- Ensure localStorage is not disabled in your browser

### Voice commands not recognized
- Speak clearly and wait for the agent to finish listening
- Try rephrasing your command
- Check that your microphone is working properly

### Agent not understanding commands
- Make sure your agent's system prompt includes information about note-taking capabilities
- Use more explicit commands like "Add a note" or "Create a reminder"

## Future Enhancements

Consider these improvements:
- Add due dates to reminders
- Categorize notes with tags
- Search through notes
- Export notes to other apps
- Set up notifications for reminders

---

For more information about ElevenLabs Conversational AI, visit the [official documentation](https://elevenlabs.io/docs/conversational-ai/overview). 