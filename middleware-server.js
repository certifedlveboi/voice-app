#!/usr/bin/env node
/**
 * Middleware Server for ElevenLabs Voice Assistant
 * 
 * This server acts as an intermediary between your web app and ElevenLabs,
 * allowing you to intercept and process commands while maintaining conversation context.
 */

const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3002;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.AGENT_ID;

// In-memory storage
let notes = [];
let conversations = new Map();

// Helper to send JSON response
function sendJsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Note management functions
function addNote(content, type = 'note') {
    const note = {
        id: Date.now(),
        content,
        type,
        timestamp: new Date().toISOString()
    };
    notes.unshift(note);
    return note;
}

function getNotes(type = null) {
    if (type) {
        return notes.filter(n => n.type === type);
    }
    return notes;
}

function deleteNote(noteId) {
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
        return notes.splice(index, 1)[0];
    }
    return null;
}

function clearNotes() {
    const count = notes.length;
    notes = [];
    return count;
}

// Process user input and extract commands
function processUserInput(text, sessionId) {
    const lowerText = text.toLowerCase();
    let response = null;
    let action = null;
    
    // Add note
    if (lowerText.includes('add a note') || lowerText.includes('add note')) {
        const noteMatch = text.match(/add (?:a )?note:?\s*(.+)/i);
        if (noteMatch && noteMatch[1]) {
            const note = addNote(noteMatch[1].trim(), 'note');
            action = { type: 'add_note', note };
            response = `I've added your note: "${note.content}". You now have ${notes.length} items saved.`;
        }
    }
    
    // Create reminder
    else if (lowerText.includes('create a reminder') || lowerText.includes('remind me')) {
        const reminderMatch = text.match(/(?:create (?:a )?reminder|remind me):?\s*(.+)/i);
        if (reminderMatch && reminderMatch[1]) {
            const reminder = addNote(reminderMatch[1].trim(), 'reminder');
            action = { type: 'add_reminder', reminder };
            response = `I've created your reminder: "${reminder.content}".`;
        }
    }
    
    // Read notes
    else if (lowerText.includes('read my notes') || lowerText.includes('what are my notes')) {
        const noteItems = getNotes('note');
        action = { type: 'read_notes', count: noteItems.length };
        if (noteItems.length === 0) {
            response = "You don't have any notes yet.";
        } else {
            const notesList = noteItems.slice(0, 5).map((n, i) => `${i + 1}. ${n.content}`).join('. ');
            response = `Here are your notes: ${notesList}`;
        }
    }
    
    // Read reminders
    else if (lowerText.includes('read my reminders')) {
        const reminderItems = getNotes('reminder');
        action = { type: 'read_reminders', count: reminderItems.length };
        if (reminderItems.length === 0) {
            response = "You don't have any reminders yet.";
        } else {
            const remindersList = reminderItems.slice(0, 5).map((r, i) => `${i + 1}. ${r.content}`).join('. ');
            response = `Here are your reminders: ${remindersList}`;
        }
    }
    
    // Clear notes
    else if (lowerText.includes('clear all notes')) {
        const count = clearNotes();
        action = { type: 'clear_notes', count };
        response = `I've cleared all ${count} notes and reminders.`;
    }
    
    // Delete last note
    else if (lowerText.includes('delete the last note')) {
        if (notes.length > 0) {
            const deleted = deleteNote(notes[0].id);
            action = { type: 'delete_note', note: deleted };
            response = `I've deleted your last ${deleted.type}: "${deleted.content}"`;
        } else {
            response = "You don't have any notes to delete.";
        }
    }
    
    return { response, action };
}

// Create HTTP server for REST endpoints
const server = http.createServer((req, res) => {
    const pathname = url.parse(req.url).pathname;
    
    // Handle CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    // Get notes
    if (pathname === '/api/notes' && req.method === 'GET') {
        sendJsonResponse(res, 200, { notes });
    }
    
    // Get conversation session
    else if (pathname === '/api/session' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { agentId } = JSON.parse(body);
                const sessionId = Date.now().toString();
                
                // Create session data
                conversations.set(sessionId, {
                    agentId,
                    created: new Date().toISOString(),
                    notes: []
                });
                
                sendJsonResponse(res, 200, { sessionId });
            } catch (error) {
                sendJsonResponse(res, 400, { error: 'Invalid request' });
            }
        });
    }
    
    // Process user input
    else if (pathname === '/api/process' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { sessionId, userInput } = JSON.parse(body);
                const { response, action } = processUserInput(userInput, sessionId);
                
                sendJsonResponse(res, 200, {
                    response,
                    action,
                    notes: notes.slice(0, 10) // Send recent notes
                });
            } catch (error) {
                sendJsonResponse(res, 400, { error: 'Invalid request' });
            }
        });
    }
    
    else {
        sendJsonResponse(res, 404, { error: 'Not found' });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Middleware Server running on http://localhost:${PORT}`);
    console.log('\n📝 This server provides:');
    console.log('  - Command processing for notes and reminders');
    console.log('  - Session management');
    console.log('  - Integration point between UI and ElevenLabs');
    console.log('\n💡 To use:');
    console.log('  1. Set ELEVENLABS_API_KEY and AGENT_ID environment variables');
    console.log('  2. Modify your web app to send requests here instead of directly to ElevenLabs');
    console.log('  3. This server will process commands and manage state');
}); 