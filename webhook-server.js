const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gpvyzpdpoiqusqlolghd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwdnl6cGRwb2lxdXNxbG9sZ2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDA3MjcsImV4cCI6MjA2MTI3NjcyN30.PRPlAe1anTDPKB1k97k6cMNpCKwGmR-fgf4WhkKRbX0';
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Comprehensive logging middleware - capture EVERYTHING
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 [${timestamp}] ${req.method} ${req.path}`);
    console.log('📋 FULL REQUEST DETAILS:');
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   Query:', JSON.stringify(req.query, null, 2));
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    console.log('   Content-Type:', req.get('Content-Type'));
    console.log('   User-Agent:', req.get('User-Agent'));
    console.log('   Origin:', req.get('Origin'));
    console.log('   Referer:', req.get('Referer'));
    console.log('🔍 END REQUEST DETAILS\n');
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'ElevenLabs Note & Reminder Webhook Server is running',
        endpoints: {
            webhook: '/webhook',
            health: '/',
            tools: '/tools',
            view: '/view'
        }
    });
});

// Main webhook endpoint for ElevenLabs agent tools
app.post('/webhook', async (req, res) => {
    try {
        console.log('\n=== WEBHOOK CALL RECEIVED ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Query:', JSON.stringify(req.query, null, 2));
        
        // ElevenLabs standard format: all parameters are sent flat at the top level
        const {
            tool_name,
            content,
            title,
            date,
            time,
            type,
            search,
            id,
            completed,
            conversation_id = 'default_conv',
            agent_id = 'default_agent',
            ...otherParams
        } = req.body;
        
        console.log(`Tool called: ${tool_name}`);
        console.log(`Conversation ID: ${conversation_id}`);
        console.log(`Parameters:`, { content, title, date, time, type, search, id, completed, ...otherParams });

        // Handle different tool calls
        let response;
        switch (tool_name) {
            case 'add_note':
                response = await handleAddNote({ content, title }, conversation_id);
                break;
            
            case 'add_reminder':
                response = await handleAddReminder({ content, title, date, time }, conversation_id);
                break;
            
            case 'modify_note':
                response = await handleModifyNote({ id, title, content }, conversation_id);
                break;
            
            case 'complete_note':
                response = await handleCompleteNote({ id, title, completed }, conversation_id);
                break;
            
            case 'delete_note':
                response = await handleDeleteNote({ id, title }, conversation_id);
                break;
            
            case 'get_notes':
                response = await handleGetNotes({ type, search }, conversation_id);
                break;
            
            default:
                response = {
                    success: false,
                    error: `Unknown tool: ${tool_name}. Available tools: add_note, add_reminder, modify_note, complete_note, delete_note, get_notes`
                };
        }

        console.log('Response:', JSON.stringify(response, null, 2));
        console.log('=== END WEBHOOK CALL ===\n');

        // Send response back to ElevenLabs in the expected format
        if (response.success) {
            res.json(response.data);
        } else {
            res.status(400).json({
                error: response.error
            });
        }

    } catch (error) {
        console.error('Webhook error:', error);
        console.log('=== END WEBHOOK CALL (ERROR) ===\n');
        res.status(500).json({
            error: error.message
        });
    }
});

// Tool implementations using Supabase
async function handleAddNote(parameters, conversationId) {
    try {
        const { title, content } = parameters;
        
        const noteData = {
            user_id: DEFAULT_USER_ID,
            title: title || 'Untitled Note',
            content: content || '',
            category: 'general',
            priority: 'medium'
        };
        
        const { data, error } = await supabase
            .from('notes')
            .insert([noteData])
            .select()
            .single();
            
        if (error) {
            console.error('Supabase error adding note:', error);
            return {
                success: false,
                error: error.message
            };
        }
        
        // Get total notes count
        const { count } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', DEFAULT_USER_ID);
        
        return {
            success: true,
            data: {
                message: `I've added your note titled "${data.title}". You now have ${count} notes.`
            }
        };
    } catch (error) {
        console.error('Error in handleAddNote:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleAddReminder(parameters, conversationId) {
    try {
        const { title, content, date, time } = parameters;
        
        // Combine date and time into a single timestamp
        let reminderDate = new Date();
        if (date) {
            reminderDate = new Date(date);
            if (time) {
                const [hours, minutes] = time.split(':').map(Number);
                reminderDate.setHours(hours, minutes, 0, 0);
            }
        }
        
        const reminderData = {
            user_id: DEFAULT_USER_ID,
            title: title || 'Untitled Reminder',
            date: reminderDate.toISOString(),
            category: 'general',
            priority: 'medium',
            notes: content || ''
        };
        
        const { data, error } = await supabase
            .from('reminders')
            .insert([reminderData])
            .select()
            .single();
            
        if (error) {
            console.error('Supabase error adding reminder:', error);
            return {
                success: false,
                error: error.message
            };
        }
        
        // Get total reminders count
        const { count } = await supabase
            .from('reminders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', DEFAULT_USER_ID);
        
        let responseMessage = `I've added your reminder "${data.title}".`;
        if (date && time) {
            responseMessage += ` It's scheduled for ${date} at ${time}.`;
        } else if (date) {
            responseMessage += ` It's scheduled for ${date}.`;
        }
        responseMessage += ` You now have ${count} reminders.`;
        
        return {
            success: true,
            data: {
                message: responseMessage
            }
        };
    } catch (error) {
        console.error('Error in handleAddReminder:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleModifyNote(parameters, conversationId) {
    try {
        const { id, title, content } = parameters;
        
        let query = supabase.from('notes').select('*').eq('user_id', DEFAULT_USER_ID);
        
        if (id) {
            query = query.eq('id', id);
        } else if (title) {
            query = query.ilike('title', `%${title}%`);
        } else {
            return {
                success: false,
                error: "Please provide either an ID or title to modify the note"
            };
        }
        
        const { data: existingNotes, error: selectError } = await query;
        
        if (selectError) {
            console.error('Supabase error finding note:', selectError);
            return {
                success: false,
                error: selectError.message
            };
        }
        
        if (!existingNotes || existingNotes.length === 0) {
            return {
                success: true,
                data: {
                    message: "I couldn't find that note to modify. Can you be more specific about which note you want to change?",
                    note: null
                }
            };
        }
        
        const noteToUpdate = existingNotes[0];
        const updateData = { updated_at: new Date().toISOString() };
        
        if (title && title !== noteToUpdate.title) updateData.title = title;
        if (content) updateData.content = content;
        
        const { data, error } = await supabase
            .from('notes')
            .update(updateData)
            .eq('id', noteToUpdate.id)
            .select()
            .single();
            
        if (error) {
            console.error('Supabase error updating note:', error);
            return {
                success: false,
                error: error.message
            };
        }
        
        return {
            success: true,
            data: {
                message: `I've updated your note "${data.title}". The changes have been saved.`,
                note: data
            }
        };
    } catch (error) {
        console.error('Error in handleModifyNote:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleDeleteNote(parameters, conversationId) {
    try {
        const { id, title } = parameters;
        
        if (!id && !title) {
            return {
                success: false,
                error: 'Please provide either note ID or title to delete'
            };
        }
        
        let query = supabase.from('notes').delete().eq('user_id', DEFAULT_USER_ID);
        
        if (id) {
            query = query.eq('id', id);
        } else if (title) {
            query = query.eq('title', title);
        }
        
        const { data, error } = await query.select().single();
        
        if (error) {
            console.error('Supabase error deleting note:', error);
            
            // Try deleting from reminders table if not found in notes
            let reminderQuery = supabase.from('reminders').delete().eq('user_id', DEFAULT_USER_ID);
            
            if (id) {
                reminderQuery = reminderQuery.eq('id', id);
            } else if (title) {
                reminderQuery = reminderQuery.eq('title', title);
            }
            
            const { data: reminderData, error: reminderError } = await reminderQuery.select().single();
            
            if (reminderError) {
                return {
                    success: false,
                    error: `Could not find note or reminder to delete. Error: ${error.message}`
                };
            }
            
            return {
                success: true,
                data: {
                    message: `I've deleted the reminder titled "${reminderData.title}".`
                }
            };
        }
        
        return {
            success: true,
            data: {
                message: `I've deleted the note titled "${data.title}".`
            }
        };
    } catch (error) {
        console.error('Error in handleDeleteNote:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleCompleteNote(parameters, conversationId) {
    try {
        const { id, title, completed } = parameters;
        
        if (!id && !title) {
            return {
                success: false,
                error: 'Please provide either note ID or title to complete'
            };
        }
        
        const isCompleted = completed === true || completed === 'true' || completed === '1';
        
        // First, try to find and update the note
        let query = supabase.from('notes').select('*').eq('user_id', DEFAULT_USER_ID);
        
        if (id) {
            query = query.eq('id', id);
        } else if (title) {
            query = query.eq('title', title);
        }
        
        const { data: existingNotes, error: findError } = await query;
        
        if (findError || !existingNotes || existingNotes.length === 0) {
            return {
                success: false,
                error: 'Could not find the note to complete'
            };
        }
        
        const noteToUpdate = existingNotes[0];
        
        // Update the note with completed status
        const { data, error } = await supabase
            .from('notes')
            .update({ 
                completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null
            })
            .eq('id', noteToUpdate.id)
            .select()
            .single();
        
        if (error) {
            console.error('Supabase error completing note:', error);
            return {
                success: false,
                error: error.message
            };
        }
        
        const action = isCompleted ? 'completed' : 'uncompleted';
        return {
            success: true,
            data: {
                message: `I've marked the note "${data.title}" as ${action}.`
            }
        };
    } catch (error) {
        console.error('Error in handleCompleteNote:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function handleGetNotes(parameters, conversationId) {
    try {
        const { type, search } = parameters;
        
        let notesQuery = supabase.from('notes').select('*').eq('user_id', DEFAULT_USER_ID);
        let remindersQuery = supabase.from('reminders').select('*').eq('user_id', DEFAULT_USER_ID);
        
        // Apply search filter if provided
        if (search) {
            const searchTerm = `%${search}%`;
            notesQuery = notesQuery.or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`);
            remindersQuery = remindersQuery.or(`title.ilike.${searchTerm},notes.ilike.${searchTerm}`);
        }
        
        let notes = [];
        let reminders = [];
        
        if (type === 'notes' || !type) {
            const { data: notesData, error: notesError } = await notesQuery.order('created_at', { ascending: false });
            if (notesError) {
                console.error('Supabase error getting notes:', notesError);
                return {
                    success: false,
                    error: notesError.message
                };
            }
            notes = notesData || [];
        }
        
        if (type === 'reminders' || !type) {
            const { data: remindersData, error: remindersError } = await remindersQuery.order('date', { ascending: true });
            if (remindersError) {
                console.error('Supabase error getting reminders:', remindersError);
                return {
                    success: false,
                    error: remindersError.message
                };
            }
            reminders = remindersData || [];
        }
        
        let message;
        if (type === 'notes') {
            message = `You have ${notes.length} notes. `;
            if (notes.length > 0) {
                message += `Here are your recent notes: ${notes.slice(0, 3).map(n => n.title).join(', ')}.`;
            }
        } else if (type === 'reminders') {
            message = `You have ${reminders.length} reminders. `;
            if (reminders.length > 0) {
                message += `Here are your upcoming reminders: ${reminders.slice(0, 3).map(r => r.title).join(', ')}.`;
            }
        } else {
            message = `You have ${notes.length} notes and ${reminders.length} reminders. `;
            if (notes.length > 0 || reminders.length > 0) {
                const recent = [...notes.slice(0, 2), ...reminders.slice(0, 1)];
                message += `Your recent items: ${recent.map(item => item.title).join(', ')}.`;
            }
        }
        
        if (notes.length === 0 && reminders.length === 0) {
            message = "You don't have any notes or reminders yet. Would you like to add some?";
        }
        
        return {
            success: true,
            data: {
                message,
                notes,
                reminders,
                total: notes.length + reminders.length
            }
        };
    } catch (error) {
        console.error('Error in handleGetNotes:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// REST API endpoints for the web app to fetch notes/reminders
app.get('/api/notes', async (req, res) => {
    try {
        const { data: notes, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data: notes || [] });
    } catch (error) {
        console.error('Error in /api/notes:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reminders', async (req, res) => {
    try {
        const { data: reminders, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching reminders:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data: reminders || [] });
    } catch (error) {
        console.error('Error in /api/reminders:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notes-and-reminders', async (req, res) => {
    try {
        const [notesResult, remindersResult] = await Promise.all([
            supabase
                .from('notes')
                .select('*')
                .eq('user_id', DEFAULT_USER_ID)
                .order('created_at', { ascending: false }),
            supabase
                .from('reminders')
                .select('*')
                .eq('user_id', DEFAULT_USER_ID)
                .order('date', { ascending: true })
        ]);

        if (notesResult.error) {
            console.error('Error fetching notes:', notesResult.error);
            return res.status(500).json({ error: notesResult.error.message });
        }

        if (remindersResult.error) {
            console.error('Error fetching reminders:', remindersResult.error);
            return res.status(500).json({ error: remindersResult.error.message });
        }

        res.json({
            success: true,
            data: {
                notes: notesResult.data || [],
                reminders: remindersResult.data || [],
                total: (notesResult.data?.length || 0) + (remindersResult.data?.length || 0)
            }
        });
    } catch (error) {
        console.error('Error in /api/notes-and-reminders:', error);
        res.status(500).json({ error: error.message });
    }
});

// List available tools endpoint
app.get('/tools', (req, res) => {
    res.json({
        tools: [
            {
                name: 'add_note',
                description: 'Add a new note',
                parameters: {
                    title: {
                        type: 'string',
                        description: 'Title of the note',
                        required: false
                    },
                    content: {
                        type: 'string',
                        description: 'Content of the note',
                        required: true
                    }
                }
            },
            {
                name: 'add_reminder',
                description: 'Add a new reminder with optional date/time',
                parameters: {
                    title: {
                        type: 'string',
                        description: 'Title of the reminder',
                        required: false
                    },
                    content: {
                        type: 'string',
                        description: 'Content of the reminder',
                        required: true
                    },
                    date: {
                        type: 'string',
                        description: 'Date for the reminder (YYYY-MM-DD format)',
                        required: false
                    },
                    time: {
                        type: 'string',
                        description: 'Time for the reminder (HH:MM format)',
                        required: false
                    }
                }
            },
            {
                name: 'modify_note',
                description: 'Modify an existing note',
                parameters: {
                    id: {
                        type: 'string',
                        description: 'ID of the note to modify',
                        required: false
                    },
                    title: {
                        type: 'string',
                        description: 'New or existing title to find and modify the note',
                        required: false
                    },
                    content: {
                        type: 'string',
                        description: 'New content for the note',
                        required: false
                    }
                }
            },
            {
                name: 'delete_note',
                description: 'Delete a note or reminder',
                parameters: {
                    id: {
                        type: 'string',
                        description: 'ID of the note to delete',
                        required: false
                    },
                    title: {
                        type: 'string',
                        description: 'Title of the note to delete',
                        required: false
                    }
                }
            },
            {
                name: 'get_notes',
                description: 'Retrieve and analyze notes/reminders',
                parameters: {
                    type: {
                        type: 'string',
                        description: 'Type to retrieve: "notes", "reminders", or "all"',
                        required: false
                    },
                    search: {
                        type: 'string',
                        description: 'Search term to filter notes/reminders',
                        required: false
                    }
                }
            }
        ]
    });
});

// Web interface to view notes and reminders
app.get('/view', (req, res) => {
    const conversationId = req.query.conv || 'voice_conv_001';
    // Implementation of getView using Supabase
    // This function should return the HTML content for the view page
    // For example: res.send(html);
});

// New API endpoint for completing notes from the UI
app.patch('/api/notes/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;
        
        const isCompleted = completed === true || completed === 'true';
        
        const { data, error } = await supabase
            .from('notes')
            .update({ 
                completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null
            })
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating note completion:', error);
            return res.status(500).json({ error: error.message });
        }
        
        if (!data) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json({ 
            success: true, 
            data: data,
            message: `Note ${isCompleted ? 'completed' : 'uncompleted'} successfully`
        });
    } catch (error) {
        console.error('Error in /api/notes/:id/complete:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete note endpoint for UI
app.delete('/api/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
            .select()
            .single();
        
        if (error) {
            console.error('Error deleting note:', error);
            return res.status(500).json({ error: error.message });
        }
        
        if (!data) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error in /api/notes/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete reminder endpoint for UI
app.delete('/api/reminders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('reminders')
            .delete()
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
            .select()
            .single();
        
        if (error) {
            console.error('Error deleting reminder:', error);
            return res.status(500).json({ error: error.message });
        }
        
        if (!data) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Reminder deleted successfully'
        });
    } catch (error) {
        console.error('Error in /api/reminders/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Note & Reminder Webhook server running on http://localhost:${PORT}`);
    console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`🔧 Available tools: http://localhost:${PORT}/tools`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
    });
}); 