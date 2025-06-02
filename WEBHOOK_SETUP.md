# ElevenLabs Note & Reminder Agent Setup Guide

This guide will help you configure your ElevenLabs agent to manage notes and reminders in your web app through voice commands.

## 🚀 Quick Start

### Prerequisites
1. ✅ Webhook server running on port 3000
2. ✅ Public tunnel exposing your local server
3. ✅ ElevenLabs agent ID
4. ✅ Supabase database connected

### Current System Status
- **Webhook Server**: Running on http://localhost:3000
- **Public Tunnel**: https://neat-rabbits-go.loca.lt
- **Web App**: http://localhost:8000
- **Database**: Supabase (connected and ready)

## Step 1: Verify Your Setup

Check that your services are running:

```bash
# 1. Check webhook server
curl http://localhost:3000/

# 2. Check tunnel
curl https://neat-rabbits-go.loca.lt/

# 3. Check web app
curl http://localhost:8000/
```

## Step 2: Configure ElevenLabs Agent Tool

### Tool Configuration

**⚠️ IMPORTANT: Use these EXACT settings**

**Basic Settings:**
- **Name**: `add_note`
- **Description**: `Add a new note to save information or ideas`
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://neat-rabbits-go.loca.lt/webhook`

### Tool Parameters

**Configure exactly these 3 parameters in this order:**

#### Parameter 1: tool_name (REQUIRED)
- **Property Name**: `tool_name`
- **Data Type**: `String`
- **Identifier**: `tool_name`
- **Value Type**: `constant`
- **Default Value**: `add_note`
- **Description**: `The name of the tool to execute`

#### Parameter 2: content (REQUIRED)
- **Property Name**: `content`
- **Data Type**: `String`
- **Identifier**: `content`
- **Value Type**: `LLM prompt`
- **Description**: `The main content or text of the note`

#### Parameter 3: title (OPTIONAL)
- **Property Name**: `title`
- **Data Type**: `String`
- **Identifier**: `title`
- **Value Type**: `LLM prompt`
- **Description**: `Optional title for the note`

### Agent System Prompt (Recommended)

Add this to your agent's system prompt:

```
You are a voice-activated note-taking assistant. When users ask you to add, create, or save a note, use the add_note tool.

Examples:
- "Add a note about the meeting" → use add_note with content
- "Save this: buy groceries tomorrow" → use add_note with content
- "Create a note titled Work that says review documents" → use add_note with title and content

Always confirm when you've successfully added a note.
```

## Step 3: Test Your Configuration

### 🧪 Test Voice Commands

Try these exact commands:

1. **"Add a note that says: Buy groceries tomorrow"**
2. **"Create a note: Call the dentist at 3 PM"**
3. **"Save a note titled Work Tasks that says: Review project documentation"**

### ✅ Expected Behavior

1. **Agent Response**: "I've added your note titled [title]. You now have X notes."
2. **Web App**: Note appears at http://localhost:8000
3. **Server Logs**: Webhook call logged in terminal
4. **Database**: Note saved in Supabase

## Step 4: Verify Integration

### Check Server Logs
In your terminal, you should see:
```
🔍 [timestamp] POST /webhook
📋 FULL REQUEST DETAILS:
   Body: {
     "tool_name": "add_note",
     "content": "your note content",
     "title": "your note title"
   }
Tool called: add_note
Response: {
  "success": true,
  "data": {
    "message": "I've added your note..."
  }
}
```

### Check Web App
1. Open http://localhost:8000
2. Notes should appear in the "Notes & Reminders" section
3. The counter should update automatically

### Check Database
```bash
# Test the API directly
curl http://localhost:3000/api/notes-and-reminders
```

## 🔧 Troubleshooting

### ❌ Tool Not Being Triggered

**Check ElevenLabs Agent Dashboard:**
1. Go to your agent conversation history
2. Look for the `add_note` tool in the transcript
3. If it's not there, check your tool configuration

**Common Issues:**
- Tool name not exactly `add_note`
- Missing `tool_name` parameter with `constant` value
- Wrong parameter types (must be String, not Text)

### ❌ Webhook Not Being Called

**Test Webhook URL:**
```bash
curl -X POST https://neat-rabbits-go.loca.lt/webhook \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "add_note", "content": "test note", "title": "Test"}'
```

**Expected Response:**
```json
{"message":"I've added your note titled \"Test\". You now have 1 notes."}
```

**If this fails:**
1. Check tunnel is running: `ps aux | grep "lt --port 3000"`
2. Restart tunnel: `lt --port 3000`
3. Update webhook URL in ElevenLabs with new tunnel URL

### ❌ Notes Not Appearing in Web App

**Check API:**
```bash
curl http://localhost:3000/api/notes-and-reminders
```

**If empty:**
- Webhook might not be saving to database
- Check server logs for Supabase errors

**If has data but web app empty:**
- Refresh browser (F5)
- Check browser console for errors
- Web app auto-refreshes every 10 seconds

### ❌ Agent Asks for Title Every Time

This happens when ElevenLabs can't reach your webhook. Check:
1. Tunnel URL is correct and accessible
2. Webhook URL in ElevenLabs tool configuration
3. Tool parameters are configured correctly

## 🎯 Manual Testing

### Test Webhook Directly
```bash
# Test add_note
curl -X POST https://neat-rabbits-go.loca.lt/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "add_note",
    "content": "Manual test note",
    "title": "Test Title"
  }'

# Check if it worked
curl http://localhost:3000/api/notes-and-reminders
```

### Test Web App Integration
1. Add note via webhook (above)
2. Open http://localhost:8000
3. Note should appear within 10 seconds

## 📋 Configuration Checklist

- [ ] Webhook server running on port 3000
- [ ] Tunnel active at https://neat-rabbits-go.loca.lt
- [ ] ElevenLabs tool named exactly `add_note`
- [ ] Tool type set to `Webhook`
- [ ] Tool URL set to `https://neat-rabbits-go.loca.lt/webhook`
- [ ] Parameter 1: `tool_name` (String, constant, value: "add_note")
- [ ] Parameter 2: `content` (String, LLM prompt)
- [ ] Parameter 3: `title` (String, LLM prompt)
- [ ] Agent system prompt includes note-taking instructions

## 🆘 Still Having Issues?

1. **Check the server logs** - they show exactly what's happening
2. **Test the webhook manually** with curl commands above
3. **Verify ElevenLabs conversation transcript** shows tool calls
4. **Check tunnel is accessible** from outside your network

## 🎉 Success Indicators

When everything is working:
- ✅ Voice commands trigger webhook calls (visible in server logs)
- ✅ Notes appear in web app at http://localhost:8000
- ✅ Database contains your notes (check with API call)
- ✅ Agent confirms note creation in voice response

Your voice-activated note-taking system is ready! 🎤📝

## System Architecture

```
Voice Command → ElevenLabs Agent → Webhook Tool → Your Server → Supabase Database → Web App Display
```

## Additional Tools (Optional)

Once the basic `add_note` tool is working, you can add these additional tools:

### add_reminder Tool
Same configuration as `add_note` but with:
- **Name**: `add_reminder`
- **tool_name**: `add_reminder`
- Additional parameters: `date`, `time`

### get_notes Tool
- **Name**: `get_notes`
- **tool_name**: `get_notes`
- Parameters: `type`, `search`

## Support

If you encounter issues:
1. Check the server logs for detailed error information
2. Verify your ElevenLabs agent configuration matches exactly
3. Test the webhook URL manually
4. Ensure your tunnel is active and accessible 