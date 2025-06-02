#!/usr/bin/env node
/**
 * ElevenLabs Agent Tools Server
 * This server provides webhook endpoints for the ElevenLabs agent to interact with notes
 * 
 * To use this with your agent:
 * 1. Run this server: node agent-tools-server.js
 * 2. Use ngrok or similar to expose it to the internet
 * 3. Configure your agent with these tools in the ElevenLabs dashboard
 */

const http = require('http');
const url = require('url');

// In-memory storage for notes (in production, use a database)
let notes = [];

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

// Tool endpoints
const tools = {
    // Add a note
    '/add-note': (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { content, type = 'note' } = JSON.parse(body);
                const note = {
                    id: Date.now(),
                    content,
                    type,
                    timestamp: new Date().toISOString()
                };
                notes.unshift(note);
                
                sendJsonResponse(res, 200, {
                    success: true,
                    message: `I've added your ${type}: "${content}"`,
                    note
                });
            } catch (error) {
                sendJsonResponse(res, 400, {
                    success: false,
                    message: 'Invalid request'
                });
            }
        });
    },
    
    // Get all notes
    '/get-notes': (req, res) => {
        const urlParts = url.parse(req.url, true);
        const type = urlParts.query.type;
        
        let filteredNotes = notes;
        if (type) {
            filteredNotes = notes.filter(n => n.type === type);
        }
        
        sendJsonResponse(res, 200, {
            success: true,
            notes: filteredNotes,
            count: filteredNotes.length
        });
    },
    
    // Delete a note
    '/delete-note': (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { noteId } = JSON.parse(body);
                const noteIndex = notes.findIndex(n => n.id === noteId);
                
                if (noteIndex !== -1) {
                    const deletedNote = notes.splice(noteIndex, 1)[0];
                    sendJsonResponse(res, 200, {
                        success: true,
                        message: `I've deleted the ${deletedNote.type}: "${deletedNote.content}"`
                    });
                } else {
                    sendJsonResponse(res, 404, {
                        success: false,
                        message: 'Note not found'
                    });
                }
            } catch (error) {
                sendJsonResponse(res, 400, {
                    success: false,
                    message: 'Invalid request'
                });
            }
        });
    },
    
    // Clear all notes
    '/clear-notes': (req, res) => {
        const count = notes.length;
        notes = [];
        sendJsonResponse(res, 200, {
            success: true,
            message: `I've cleared all ${count} notes and reminders`
        });
    }
};

// Create server
const server = http.createServer((req, res) => {
    const pathname = url.parse(req.url).pathname;
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    // Route to appropriate tool
    if (tools[pathname]) {
        tools[pathname](req, res);
    } else {
        sendJsonResponse(res, 404, {
            success: false,
            message: 'Tool not found'
        });
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Agent Tools Server running on http://localhost:${PORT}`);
    console.log('\n📝 Available tools:');
    console.log('  - POST /add-note     { content: string, type?: "note"|"reminder" }');
    console.log('  - GET  /get-notes    ?type=note|reminder');
    console.log('  - POST /delete-note  { noteId: number }');
    console.log('  - POST /clear-notes');
    console.log('\n💡 To expose this server to the internet for your agent:');
    console.log('  1. Install ngrok: npm install -g ngrok');
    console.log('  2. Run: ngrok http 3001');
    console.log('  3. Use the https URL in your agent configuration');
}); 