import React, { useState, useEffect } from 'react';
import { Plus, X, Palette } from 'lucide-react';
import { api } from '../../api';
import './NotesManager.css';

const NotesManager = () => {
    const [notes, setNotes] = useState([]);

    const colors = ['#fef3c7', '#bae6fd', '#bbf7d0', '#fbcfe8', '#e2e8f0'];

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        const data = await api.get('/note');
        if (data) setNotes(data);
    };

    const addNote = async () => {
        const payload = {
            text: '',
            color: colors[Math.floor(Math.random() * colors.length)]
        };
        const result = await api.post('/note', payload);
        if (result) {
            setNotes([result, ...notes]);
        }
    };

    const updateNote = async (id, text) => {
        // Optimistic update for UI feel
        setNotes(notes.map(n => n._id === id ? { ...n, text } : n));
        await api.put(`/note/${id}`, { text });
    };

    const deleteNote = async (id) => {
        const result = await api.delete(`/note/${id}`);
        if (result) {
            setNotes(notes.filter(n => n._id !== id));
        }
    };

    const changeColor = async (id, color) => {
        const result = await api.put(`/note/${id}`, { color });
        if (result) {
            setNotes(notes.map(n => n._id === id ? result : n));
        }
    };

    return (
        <div className="notes-container">
            <header className="notes-header">
                <h2>Quick Notes</h2>
                <button className="add-note-btn" onClick={addNote}>
                    <Plus size={20} /> Add Note
                </button>
            </header>

            <div className="notes-grid">
                {notes.map(note => (
                    <div
                        key={note._id}
                        className="note-card"
                        style={{ backgroundColor: note.color }}
                    >
                        <div className="note-actions">
                            <div className="color-picker">
                                <Palette size={14} className="palette-icon" />
                                <div className="color-options">
                                    {colors.map(c => (
                                        <div
                                            key={c}
                                            className="color-dot"
                                            style={{ backgroundColor: c }}
                                            onClick={() => changeColor(note._id, c)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => deleteNote(note._id)} className="delete-note-btn">
                                <X size={16} />
                            </button>
                        </div>
                        <textarea
                            value={note.text}
                            onChange={(e) => updateNote(note._id, e.target.value)}
                            placeholder="Type something..."
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotesManager;
