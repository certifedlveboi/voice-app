// Import ElevenLabs SDK
import { Conversation } from 'https://cdn.jsdelivr.net/npm/@elevenlabs/client@latest/+esm';

// Get DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const agentStatus = document.getElementById('agentStatus');
const agentMode = document.getElementById('agentMode');
const logContent = document.getElementById('logContent');
const agentIdInput = document.getElementById('agentId');
const apiKeyInput = document.getElementById('apiKey');
const notesList = document.getElementById('notesList');
const noteCount = document.getElementById('noteCount');

let conversation = null;
let isConnected = false;
let mediaStream = null;
let notes = [];
let refreshInterval = null;

// Configuration
const WEBHOOK_SERVER_URL = 'http://localhost:3000';

// Load saved configuration and notes
window.addEventListener('DOMContentLoaded', () => {
    const savedAgentId = localStorage.getItem('elevenlabs_agent_id');
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    
    if (savedAgentId) agentIdInput.value = savedAgentId;
    if (savedApiKey) apiKeyInput.value = savedApiKey;
    
    // Load notes from Supabase via webhook server
    loadNotesFromServer();
    
    // Set up auto-refresh every 10 seconds when connected
    refreshInterval = setInterval(loadNotesFromServer, 10000);
});

// Save configuration when changed
agentIdInput.addEventListener('change', () => {
    localStorage.setItem('elevenlabs_agent_id', agentIdInput.value);
});

apiKeyInput.addEventListener('change', () => {
    if (apiKeyInput.value) {
        localStorage.setItem('elevenlabs_api_key', apiKeyInput.value);
    } else {
        localStorage.removeItem('elevenlabs_api_key');
    }
});

// Send contextual update to agent
function sendContextualUpdate(message) {
    if (conversation && isConnected) {
        try {
            // Send a contextual update to inform the agent about the action
            conversation.sendContextualUpdate({
                text: message
            });
        } catch (error) {
            console.error('Failed to send contextual update:', error);
        }
    }
}

// Notes Management Functions - Updated to use Supabase
async function loadNotesFromServer() {
    try {
        console.log('🔄 Loading notes from server...');
        const response = await fetch(`${WEBHOOK_SERVER_URL}/api/notes-and-reminders`);
        console.log('📡 API Response status:', response.status);
        
        const result = await response.json();
        console.log('📦 API Response data:', result);
        
        if (result.success) {
            // Convert to the format the UI expects
            notes = [];
            
            // Add notes
            if (result.data.notes) {
                console.log('📝 Processing', result.data.notes.length, 'notes');
                result.data.notes.forEach(note => {
                    notes.push({
                        id: note.id,
                        content: note.content || '',
                        title: note.title || 'Untitled Note',
                        type: 'note',
                        timestamp: note.created_at,
                        isNew: false
                    });
                });
            }
            
            // Add reminders
            if (result.data.reminders) {
                console.log('⏰ Processing', result.data.reminders.length, 'reminders');
                result.data.reminders.forEach(reminder => {
                    notes.push({
                        id: reminder.id,
                        content: `${reminder.notes || ''} ${reminder.date ? `(${new Date(reminder.date).toLocaleDateString()})` : ''}`,
                        title: reminder.title || 'Untitled Reminder',
                        type: 'reminder',
                        timestamp: reminder.date,
                        isNew: false
                    });
                });
            }
            
            console.log('🎯 Total notes array length:', notes.length);
            console.log('📋 Notes array contents:', notes);
            renderNotes();
        } else {
            console.error('❌ Failed to load notes:', result.error);
        }
    } catch (error) {
        console.error('💥 Error loading notes from server:', error);
        // Fallback to localStorage if server is not available
        loadNotes();
    }
}

function loadNotes() {
    // Fallback to localStorage
    const savedNotes = localStorage.getItem('voice_assistant_notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        renderNotes();
    }
}

function saveNotes() {
    // Keep localStorage as backup
    localStorage.setItem('voice_assistant_notes', JSON.stringify(notes));
    renderNotes();
}

function addNote(content, type = 'note') {
    const note = {
        id: Date.now(),
        content: content,
        type: type,
        timestamp: new Date().toISOString(),
        isNew: true
    };
    notes.unshift(note);
    saveNotes();
    
    // Refresh from server after a short delay to get the actual saved note
    setTimeout(() => {
        loadNotesFromServer();
    }, 1000);
    
    // Remove the 'new' class after animation
    setTimeout(() => {
        const noteElement = document.querySelector(`[data-note-id="${note.id}"]`);
        if (noteElement) {
            noteElement.classList.remove('new');
        }
    }, 500);
    
    return note;
}

function deleteNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        notes = notes.filter(n => n.id !== noteId);
        saveNotes();
        // Inform the agent about the deletion
        sendContextualUpdate(`User deleted ${note.type}: "${note.content}"`);
    }
}

function clearAllNotes() {
    const count = notes.length;
    notes = [];
    saveNotes();
    // Inform the agent
    sendContextualUpdate(`User cleared all ${count} notes and reminders`);
}

function renderNotes() {
    console.log('🎨 Rendering notes, current count:', notes.length);
    noteCount.textContent = `${notes.length} item${notes.length !== 1 ? 's' : ''}`;
    
    if (notes.length === 0) {
        console.log('📄 No notes to display, showing empty state');
        notesList.innerHTML = `
            <div class="empty-notes">
                No notes yet. Try saying "Add a note" or "Create a reminder"!
            </div>
        `;
        return;
    }
    
    console.log('📋 Rendering', notes.length, 'notes in the UI');
    notesList.innerHTML = notes.map(note => `
        <div class="note-item ${note.type === 'reminder' ? 'reminder' : ''} ${note.isNew ? 'new' : ''}" data-note-id="${note.id}">
            <button class="delete-note" onclick="window.deleteNoteHandler(${note.id})" title="Delete note">×</button>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-meta">
                <span class="note-type ${note.type === 'reminder' ? 'reminder' : ''}">${note.type}</span>
                <span>${formatDate(note.timestamp)}</span>
            </div>
        </div>
    `).join('');
    console.log('✅ Notes rendered successfully');
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

// Global delete handler
window.deleteNoteHandler = function(noteId) {
    deleteNote(noteId);
};

// Process voice commands
function processVoiceCommand(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Add note command
    if (lowerTranscript.includes('add a note') || lowerTranscript.includes('add note')) {
        const noteMatch = transcript.match(/add (?:a )?note:?\s*(.+)/i);
        if (noteMatch && noteMatch[1]) {
            const note = addNote(noteMatch[1].trim(), 'note');
            // Send contextual update to agent
            sendContextualUpdate(`Successfully added note: "${note.content}". User now has ${notes.length} total notes.`);
            return `I've added your note: "${note.content}"`;
        }
        return "What would you like me to note down?";
    }
    
    // Create reminder command
    if (lowerTranscript.includes('create a reminder') || lowerTranscript.includes('create reminder') || lowerTranscript.includes('remind me')) {
        const reminderMatch = transcript.match(/(?:create (?:a )?reminder|remind me):?\s*(.+)/i);
        if (reminderMatch && reminderMatch[1]) {
            const reminder = addNote(reminderMatch[1].trim(), 'reminder');
            // Send contextual update to agent
            sendContextualUpdate(`Successfully added reminder: "${reminder.content}". User now has ${notes.filter(n => n.type === 'reminder').length} reminders.`);
            return `I've created your reminder: "${reminder.content}"`;
        }
        return "What would you like me to remind you about?";
    }
    
    // Read notes command
    if (lowerTranscript.includes('read my notes') || lowerTranscript.includes('read notes') || lowerTranscript.includes('what are my notes')) {
        const noteItems = notes.filter(n => n.type === 'note');
        if (noteItems.length === 0) {
            sendContextualUpdate('User requested to read notes but has none.');
            return "You don't have any notes yet.";
        }
        const notesList = noteItems.slice(0, 5).map((n, i) => `${i + 1}. ${n.content}`).join('. ');
        sendContextualUpdate(`User has ${noteItems.length} notes. Reading the first ${Math.min(5, noteItems.length)}.`);
        return `Here are your notes: ${notesList}`;
    }
    
    // Read reminders command
    if (lowerTranscript.includes('read my reminders') || lowerTranscript.includes('read reminders') || lowerTranscript.includes('what are my reminders')) {
        const reminderItems = notes.filter(n => n.type === 'reminder');
        if (reminderItems.length === 0) {
            sendContextualUpdate('User requested to read reminders but has none.');
            return "You don't have any reminders yet.";
        }
        const remindersList = reminderItems.slice(0, 5).map((r, i) => `${i + 1}. ${r.content}`).join('. ');
        sendContextualUpdate(`User has ${reminderItems.length} reminders. Reading the first ${Math.min(5, reminderItems.length)}.`);
        return `Here are your reminders: ${remindersList}`;
    }
    
    // Clear all notes command
    if (lowerTranscript.includes('clear all notes') || lowerTranscript.includes('delete all notes')) {
        if (notes.length === 0) {
            sendContextualUpdate('User tried to clear notes but had none.');
            return "You don't have any notes to clear.";
        }
        const count = notes.length;
        clearAllNotes();
        return `I've cleared all ${count} notes and reminders.`;
    }
    
    // Delete last note command
    if (lowerTranscript.includes('delete the last note') || lowerTranscript.includes('delete last note')) {
        if (notes.length === 0) {
            sendContextualUpdate('User tried to delete last note but had none.');
            return "You don't have any notes to delete.";
        }
        const lastNote = notes[0];
        deleteNote(lastNote.id);
        return `I've deleted your last ${lastNote.type}: "${lastNote.content}"`;
    }
    
    return null;
}

// Add log entry to conversation history
function addLogEntry(text, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${type === 'user' ? 'You' : 'Agent'}: ${text}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Update UI status
function updateStatus(connected, mode = 'listening') {
    isConnected = connected;
    
    if (connected) {
        statusIndicator.className = `status-indicator ${mode === 'speaking' ? 'speaking' : 'connected'}`;
        statusText.textContent = 'Connected';
        agentStatus.style.display = 'block';
        agentMode.textContent = mode;
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Disconnected';
        agentStatus.style.display = 'none';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// Start conversation
async function startConversation() {
    const agentId = agentIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    if (!agentId) {
        alert('Please enter your Agent ID');
        return;
    }
    
    try {
        // Request microphone permission with echo cancellation
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
            } 
        });
        
        // Clear previous conversation log
        logContent.innerHTML = '';
        addLogEntry('Starting conversation...', 'agent');
        addLogEntry('🎧 Tip: Use headphones to avoid echo/feedback issues!', 'agent');
        addLogEntry('📝 I can help you manage notes and reminders. Just ask!', 'agent');
        
        // Configuration options
        const options = {
            agentId: agentId,
            // Add audio settings to prevent echo
            audioConfig: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            onConnect: () => {
                console.log('Connected to ElevenLabs');
                updateStatus(true);
                addLogEntry('Connected! You can start speaking.', 'agent');
                
                // Send initial context about current notes
                const noteCount = notes.filter(n => n.type === 'note').length;
                const reminderCount = notes.filter(n => n.type === 'reminder').length;
                sendContextualUpdate(`User has ${noteCount} notes and ${reminderCount} reminders stored.`);
            },
            onDisconnect: (code, reason) => {
                console.log('Disconnected:', code, reason);
                updateStatus(false);
                addLogEntry('Conversation ended.', 'agent');
                // Clean up media stream
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    mediaStream = null;
                }
            },
            onMessage: (message) => {
                console.log('Message received:', message);
            },
            onError: (error) => {
                console.error('Error:', error);
                addLogEntry(`Error: ${error.message || 'Connection failed'}`, 'agent');
                updateStatus(false);
                // Clean up media stream on error
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    mediaStream = null;
                }
            },
            onModeChange: (mode) => {
                console.log('Mode changed:', mode);
                updateStatus(true, mode.mode);
            },
            onUserTranscript: (transcript) => {
                if (transcript && transcript.trim()) {
                    addLogEntry(transcript, 'user');
                    
                    // Process voice commands locally
                    const commandResponse = processVoiceCommand(transcript);
                    if (commandResponse) {
                        // Show local response but don't speak it - let the agent respond naturally
                        console.log('Command processed locally:', commandResponse);
                    }
                }
            },
            onAgentResponse: (response) => {
                if (response && response.trim()) {
                    addLogEntry(response, 'agent');
                }
            }
        };
        
        // If API key is provided, we'll need to get a signed URL
        if (apiKey) {
            // For private agents, you would typically get a signed URL from your backend
            // For this demo, we'll use the API key directly (note: in production, never expose API keys in frontend)
            console.log('Using API key for private agent');
            // Note: The ElevenLabs SDK handles authentication internally
        }
        
        // Start the conversation session
        conversation = await Conversation.startSession(options);
        
    } catch (error) {
        console.error('Failed to start conversation:', error);
        alert(`Failed to start conversation: ${error.message}`);
        updateStatus(false);
        // Clean up media stream on error
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
    }
}

// Stop conversation
async function stopConversation() {
    if (conversation) {
        try {
            await conversation.endSession();
            conversation = null;
        } catch (error) {
            console.error('Error stopping conversation:', error);
        }
    }
    
    // Clean up media stream
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    updateStatus(false);
}

// Event listeners
startBtn.addEventListener('click', startConversation);
stopBtn.addEventListener('click', stopConversation);

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (conversation) {
        conversation.endSession();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
}); 