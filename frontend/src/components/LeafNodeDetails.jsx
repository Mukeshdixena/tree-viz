import React, { useState, useEffect } from 'react';
import { Save, ExternalLink, Plus, Trash2, Calendar, Flag, BookOpen } from 'lucide-react';
import './LeafNodeDetails.css';

const LeafNodeDetails = ({ node, onUpdateNode }) => {
    const [notes, setNotes] = useState(node.notes || '');
    const [links, setLinks] = useState(node.links || []);
    const [priority, setPriority] = useState(node.priority || 'medium');
    const [dueDate, setDueDate] = useState(node.dueDate || '');

    useEffect(() => {
        setNotes(node.notes || '');
        setLinks(node.links || []);
        setPriority(node.priority || 'medium');
        setDueDate(node.dueDate || '');
    }, [node]);

    const handleSave = () => {
        onUpdateNode(node.name, {
            notes,
            links,
            priority,
            dueDate
        });
    };

    const addLink = () => {
        const title = prompt('Link Title:');
        const url = prompt('URL (starting with http):');
        if (title && url) {
            setLinks([...links, { title, url }]);
        }
    };

    const removeLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    return (
        <div className="leaf-details-container">
            <div className="details-header">
                <BookOpen size={20} className="details-icon" />
                <h3>Node Details: {node.name}</h3>
            </div>

            <div className="details-section">
                <label className="section-label">
                    <Flag size={14} /> Priority
                </label>
                <div className="priority-selector">
                    {['low', 'medium', 'high'].map(p => (
                        <button
                            key={p}
                            className={`priority-btn ${p} ${priority === p ? 'active' : ''}`}
                            onClick={() => setPriority(p)}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="details-section">
                <label className="section-label">
                    <Calendar size={14} /> Target Date
                </label>
                <input
                    type="date"
                    className="details-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
            </div>

            <div className="details-section">
                <label className="section-label">Notes</label>
                <textarea
                    className="details-textarea"
                    placeholder="Add your study notes or goal details here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="details-section">
                <div className="section-header-row">
                    <label className="section-label">Resources & Links</label>
                    <button className="add-link-btn" onClick={addLink}><Plus size={14} /></button>
                </div>
                <div className="links-list">
                    {links.map((link, idx) => (
                        <div key={idx} className="link-item">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-content">
                                <span className="link-title">{link.title}</span>
                                <ExternalLink size={12} />
                            </a>
                            <button className="remove-link-btn" onClick={() => removeLink(idx)}><Trash2 size={12} /></button>
                        </div>
                    ))}
                    {links.length === 0 && <span className="no-links">No links added.</span>}
                </div>
            </div>

            <div className="details-footer">
                <button className="save-details-btn" onClick={handleSave}>
                    <Save size={16} /> Save Progress Details
                </button>
            </div>
        </div>
    );
};

export default LeafNodeDetails;
