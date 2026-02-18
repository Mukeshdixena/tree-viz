import React, { useState, useEffect } from 'react';
import { Calendar, PenTool, Save, Trash2 } from 'lucide-react';
import { api } from '../../api';
import './JournalEntry.css';

const JournalEntry = () => {
    const [entries, setEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [newMode, setNewMode] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        const data = await api.get('/journal');
        if (data) setEntries(data);
    };

    const handleSelect = (entry) => {
        setSelectedEntry(entry);
        setFormData({ title: entry.title, content: entry.content });
        setNewMode(false);
    };

    const startNew = () => {
        setSelectedEntry(null);
        setNewMode(true);
        setFormData({ title: '', content: '' });
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) return;

        if (newMode) {
            const payload = {
                date: new Date().toISOString().split('T')[0],
                ...formData
            };
            const result = await api.post('/journal', payload);
            if (result) {
                setEntries([result, ...entries]);
                setSelectedEntry(result);
                setNewMode(false);
            }
        } else {
            const result = await api.put(`/journal/${selectedEntry._id}`, formData);
            if (result) {
                const updated = entries.map(e => e._id === selectedEntry._id ? result : e);
                setEntries(updated);
                setSelectedEntry(result);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            await api.delete(`/journal/${id}`);
            setEntries(entries.filter(e => e._id !== id));
            if (selectedEntry?._id === id) {
                setSelectedEntry(null);
                setFormData({ title: '', content: '' });
            }
        }
    };

    return (
        <div className="journal-container">
            <aside className="journal-sidebar">
                <button className="new-entry-btn" onClick={startNew}>
                    <PenTool size={18} /> New Entry
                </button>
                <div className="entry-list">
                    {entries.map(entry => (
                        <div
                            key={entry._id}
                            className={`entry-item ${selectedEntry?._id === entry._id ? 'active' : ''}`}
                            onClick={() => handleSelect(entry)}
                        >
                            <div className="entry-meta">
                                <div className="entry-date"><Calendar size={14} /> {entry.date}</div>
                                <button
                                    className="delete-entry-mini"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(entry._id);
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="entry-title">{entry.title}</div>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="journal-editor">
                {(selectedEntry || newMode) ? (
                    <div className="editor-wrapper">
                        <input
                            type="text"
                            className="title-input"
                            placeholder="Entry Title..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                        <textarea
                            className="content-area"
                            placeholder="What's on your mind today?"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        />
                        <button className="save-btn" onClick={handleSave}>
                            <Save size={18} /> Save Entry
                        </button>
                    </div>
                ) : (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <p>Select an entry or start a new one to begin journaling.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

// Simple Fallback Icon
const BookOpen = ({ size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

export default JournalEntry;
