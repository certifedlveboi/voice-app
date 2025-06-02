// Import ElevenLabs SDK
import { Conversation } from 'https://cdn.jsdelivr.net/npm/@elevenlabs/client@latest/+esm';

// Get DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusBadge = document.getElementById('statusBadge');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const logContent = document.getElementById('logContent');
const agentIdInput = document.getElementById('agentId');
const apiKeyInput = document.getElementById('apiKey');

// Tab elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Notes and reminders elements
const notesList = document.getElementById('notesList');
const remindersList = document.getElementById('remindersList');
const notesCount = document.getElementById('notesCount');
const remindersCount = document.getElementById('remindersCount');

let conversation = null;
let isConnected = false;
let mediaStream = null;
let notes = [];
let reminders = [];
let refreshInterval = null;

// Configuration
const WEBHOOK_SERVER_URL = 'http://localhost:3000';

// Load saved configuration and data
window.addEventListener('DOMContentLoaded', () => {
    const savedAgentId = localStorage.getItem('elevenlabs_agent_id');
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    
    if (savedAgentId) agentIdInput.value = savedAgentId;
    if (savedApiKey) apiKeyInput.value = savedApiKey;
    
    // Initialize tab functionality
    initializeTabs();
    
    // Load notes and reminders from server
    loadDataFromServer();
    
    // Set up auto-refresh every 10 seconds
    refreshInterval = setInterval(loadDataFromServer, 10000);
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

// Tab functionality
function initializeTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(targetTab) {
    // Update tab buttons
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === targetTab);
    });
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${targetTab}-tab`);
    });
}

// Send contextual update to agent
function sendContextualUpdate(message) {
    if (conversation && isConnected) {
        try {
            conversation.sendContextualUpdate({
                text: message
            });
        } catch (error) {
            console.error('Failed to send contextual update:', error);
        }
    }
}

// Data loading functions
async function loadDataFromServer() {
    try {
        console.log('🔄 Loading data from server...');
        const response = await fetch(`${WEBHOOK_SERVER_URL}/api/notes-and-reminders`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 API Response:', result);
        
        if (result.success) {
            notes = result.data.notes || [];
            reminders = result.data.reminders || [];
            
            console.log('📝 Loaded notes:', notes.length);
            console.log('⏰ Loaded reminders:', reminders.length);
            
            renderNotes();
            renderReminders();
        } else {
            console.error('❌ Failed to load data:', result.error);
        }
    } catch (error) {
        console.error('💥 Error loading data from server:', error);
        // Could implement fallback to localStorage here
    }
}

// Note completion functionality
async function toggleNoteCompletion(noteId, completed) {
    try {
        const response = await fetch(`${WEBHOOK_SERVER_URL}/api/notes/${noteId}/complete`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: completed })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            const note = notes.find(n => n.id === noteId);
            if (note) {
                note.completed = completed;
                note.completed_at = completed ? new Date().toISOString() : null;
            }
            
            // Re-render notes
            renderNotes();
            
            // Inform agent
            const action = completed ? 'completed' : 'uncompleted';
            sendContextualUpdate(`User marked note "${note?.title || 'Unknown'}" as ${action}`);
        }
    } catch (error) {
        console.error('Error toggling note completion:', error);
    }
}

// Delete functions
async function deleteNote(noteId, type = 'note') {
    try {
        const endpoint = type === 'note' ? 'notes' : 'reminders';
        const response = await fetch(`${WEBHOOK_SERVER_URL}/api/${endpoint}/${noteId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from local state
            if (type === 'note') {
                notes = notes.filter(n => n.id !== noteId);
                renderNotes();
            } else {
                reminders = reminders.filter(r => r.id !== noteId);
                renderReminders();
            }
            
            // Inform agent
            sendContextualUpdate(`User deleted ${type}: "${result.title || 'item'}"`);
        }
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
    }
}

// Render functions
function renderNotes() {
    console.log('🎨 Rendering notes, count:', notes.length);
    notesCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
    
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>No notes yet</h3>
                <p>Say "Add a note" to get started!</p>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = notes.map(note => createNoteHTML(note)).join('');
    
    // Add event listeners for checkboxes and delete buttons
    notesList.querySelectorAll('.checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            const noteId = parseInt(e.target.closest('.item').dataset.noteId);
            const isCompleted = e.target.classList.contains('checked');
            toggleNoteCompletion(noteId, !isCompleted);
        });
    });
    
    notesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.target.closest('.item').dataset.noteId);
            if (confirm('Are you sure you want to delete this note?')) {
                deleteNote(noteId, 'note');
            }
        });
    });
}

function renderReminders() {
    console.log('🎨 Rendering reminders, count:', reminders.length);
    remindersCount.textContent = `${reminders.length} reminder${reminders.length !== 1 ? 's' : ''}`;
    
    if (reminders.length === 0) {
        remindersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h3>No reminders yet</h3>
                <p>Say "Create a reminder" to get started!</p>
            </div>
        `;
        return;
    }
    
    remindersList.innerHTML = reminders.map(reminder => createReminderHTML(reminder)).join('');
    
    // Add event listeners for delete buttons
    remindersList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reminderId = parseInt(e.target.closest('.item').dataset.reminderId);
            if (confirm('Are you sure you want to delete this reminder?')) {
                deleteNote(reminderId, 'reminder');
            }
        });
    });
}

function createNoteHTML(note) {
    const isCompleted = note.completed || false;
    const completedClass = isCompleted ? 'completed' : '';
    const checkedClass = isCompleted ? 'checked' : '';
    
    return `
        <div class="item ${completedClass}" data-note-id="${note.id}">
            <div class="item-header">
                <div class="checkbox ${checkedClass}">
                    ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="item-title">${escapeHtml(note.title || 'Untitled Note')}</div>
                <div class="item-actions">
                    <button class="action-btn delete-btn" title="Delete note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-content">${escapeHtml(note.content || '')}</div>
            <div class="item-meta">
                <span class="item-type">note</span>
                <span class="item-date">${formatDate(note.created_at)}</span>
            </div>
        </div>
    `;
}

function createReminderHTML(reminder) {
    const reminderDate = reminder.date ? new Date(reminder.date) : null;
    const isUpcoming = reminderDate && reminderDate > new Date();
    
    return `
        <div class="item" data-reminder-id="${reminder.id}">
            <div class="item-header">
                <div class="item-title">${escapeHtml(reminder.title || 'Untitled Reminder')}</div>
                <div class="item-actions">
                    <button class="action-btn delete-btn" title="Delete reminder">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-content">${escapeHtml(reminder.notes || '')}</div>
            <div class="item-meta">
                <span class="item-type reminder">reminder</span>
                <span class="item-date ${isUpcoming ? 'reminder-date' : ''}">
                    ${reminderDate ? formatDate(reminder.date) : 'No date set'}
                </span>
            </div>
        </div>
    `;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Conversation logging
function addLogEntry(text, type) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = text;
    
    // Clear empty state if it exists
    const emptyState = logContent.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Status management
function updateStatus(connected, mode = 'listening') {
    isConnected = connected;
    
    statusBadge.className = 'status-badge';
    statusIcon.className = 'fas fa-circle';
    
    if (connected) {
        if (mode === 'speaking') {
            statusBadge.classList.add('speaking');
            statusIcon.className = 'fas fa-microphone';
            statusText.textContent = 'Speaking';
        } else {
            statusBadge.classList.add('connected');
            statusIcon.className = 'fas fa-microphone';
            statusText.textContent = 'Listening';
        }
    } else {
        statusText.textContent = 'Disconnected';
    }
    
    startBtn.disabled = connected;
    stopBtn.disabled = !connected;
}

// Voice conversation management
async function startConversation() {
    try {
        const agentId = agentIdInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!agentId) {
            alert('Please enter your Agent ID');
            return;
        }
        
        console.log('Starting conversation with agent:', agentId);
        
        // Request microphone permission
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            console.log('Microphone access granted');
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Microphone access is required for voice chat. Please allow microphone access and try again.');
            return;
        }
        
        // Initialize conversation
        const config = {
            agentId: agentId,
            onConnect: () => {
                console.log('Connected to agent');
                updateStatus(true, 'listening');
                addLogEntry('Connected to voice assistant', 'agent');
            },
            onDisconnect: () => {
                console.log('Disconnected from agent');
                updateStatus(false);
                addLogEntry('Disconnected from voice assistant', 'agent');
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                updateStatus(false);
                addLogEntry(`Error: ${error.message}`, 'agent');
            },
            onMessage: (message) => {
                console.log('Agent message:', message);
                addLogEntry(message.text, 'agent');
                
                // Check if this might be a notification about notes/reminders
                if (message.text.includes('note') || message.text.includes('reminder')) {
                    // Refresh data after a short delay
                    setTimeout(() => {
                        loadDataFromServer();
                    }, 1000);
                }
            },
            onUserTranscript: (transcript) => {
                console.log('User transcript:', transcript);
                addLogEntry(transcript, 'user');
            },
            onAgentModeChange: (mode) => {
                console.log('Agent mode changed:', mode);
                updateStatus(true, mode === 'speaking' ? 'speaking' : 'listening');
            }
        };
        
        if (apiKey) {
            config.apiKey = apiKey;
        }
        
        conversation = new Conversation(config);
        await conversation.startSession({ audio: true });
        
        console.log('Conversation started successfully');
        
    } catch (error) {
        console.error('Failed to start conversation:', error);
        updateStatus(false);
        
        let errorMessage = 'Failed to start conversation. ';
        if (error.message.includes('401')) {
            errorMessage += 'Please check your Agent ID and API Key.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage += 'Please check your internet connection.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

async function stopConversation() {
    if (conversation) {
        try {
            await conversation.endSession();
            conversation = null;
            console.log('Conversation ended');
        } catch (error) {
            console.error('Error ending conversation:', error);
        }
    }
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        console.log('Microphone stream stopped');
    }
    
    updateStatus(false);
}

// Event listeners
startBtn.addEventListener('click', startConversation);
stopBtn.addEventListener('click', stopConversation);

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    if (conversation) {
        conversation.endSession().catch(console.error);
    }
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
});

// Initialize status
updateStatus(false); 