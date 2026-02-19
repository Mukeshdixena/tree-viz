import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Save, Layout, Trash2, Plus, Zap, Coffee, Sunrise, Sun, Moon, Edit3, PlusCircle } from 'lucide-react';
import { api } from '../../api';
import './DayPlanner.css';

const ICON_MAP = {
    Sun: <Sun size={16} />,
    Moon: <Moon size={16} />,
    Sunrise: <Sunrise size={16} />,
    Coffee: <Coffee size={16} />,
    Zap: <Zap size={16} />,
};

const DayPlanner = () => {
    const [planner, setPlanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const [routines, setRoutines] = useState([]);
    const [showRoutines, setShowRoutines] = useState(false);
    const [isSavingRoutine, setIsSavingRoutine] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState(null);
    const [newRoutineName, setNewRoutineName] = useState('');

    const fetchPlanner = async (date) => {
        setLoading(true);
        try {
            const data = await api.get(`/planner?date=${date}`);
            if (data && data.blocks) {
                setPlanner(data);
            } else {
                console.error("Failed to fetch planner or invalid data structure", data);
            }
        } catch (error) {
            console.error("Error fetching planner:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutines = async () => {
        try {
            const data = await api.get('/routines');
            if (data) setRoutines(data);
        } catch (error) {
            console.error("Error fetching routines:", error);
        }
    };

    useEffect(() => {
        fetchPlanner(selectedDate);
        fetchRoutines();
    }, [selectedDate]);

    const handleUpdate = async (updatedPlanner) => {
        try {
            const result = await api.put('/planner', updatedPlanner);
            if (result && result.blocks) {
                setPlanner(result);
            } else {
                console.error("Failed to update planner or invalid data structure", result);
            }
        } catch (error) {
            console.error("Error updating planner:", error);
        }
    };

    const toggleBlockStatus = (index) => {
        const newBlocks = [...planner.blocks];
        newBlocks[index].completed = !newBlocks[index].completed;
        handleUpdate({ ...planner, blocks: newBlocks });
    };

    const updateBlockText = (index, field, value) => {
        const newBlocks = [...planner.blocks];
        newBlocks[index][field] = value;
        setPlanner({ ...planner, blocks: newBlocks });
    };

    const saveChanges = () => {
        handleUpdate(planner);
    };

    const addBlock = () => {
        const lastBlock = planner?.blocks?.[planner.blocks.length - 1];
        let nextStart = "09:00";
        let nextEnd = "10:00";

        if (lastBlock) {
            nextStart = lastBlock.endTime;
            const [h, m] = nextStart.split(':').map(Number);
            const nextH = h + 1 >= 24 ? 0 : h + 1;
            nextEnd = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }

        const newBlocks = [...(planner?.blocks || []), {
            startTime: nextStart,
            endTime: nextEnd,
            plan: '',
            reality: '',
            completed: false
        }];
        setPlanner({ ...planner, blocks: newBlocks });
        setSelectedBlockIndex(newBlocks.length - 1);
    };

    const removeBlock = (index) => {
        const newBlocks = planner.blocks.filter((_, i) => i !== index);
        setPlanner({ ...planner, blocks: newBlocks });
        if (selectedBlockIndex === index) {
            setSelectedBlockIndex(null);
        } else if (selectedBlockIndex > index) {
            setSelectedBlockIndex(selectedBlockIndex - 1);
        }
    };

    const applyRoutine = (routine) => {
        if (routine && routine.blocks) {
            const newBlocks = routine.blocks.map(b => ({
                ...b,
                reality: '',
                completed: false
            }));
            setPlanner({ ...planner, blocks: newBlocks });
            setShowRoutines(false);
        }
    };

    const saveAsRoutine = async () => {
        if (!newRoutineName.trim()) return;
        try {
            const routineData = {
                name: newRoutineName,
                icon: 'Sun',
                blocks: planner.blocks.map(({ startTime, endTime, plan }) => ({ startTime, endTime, plan }))
            };
            await api.post('/routines', routineData);
            setNewRoutineName('');
            setIsSavingRoutine(false);
            fetchRoutines();
        } catch (error) {
            console.error("Error saving routine:", error);
        }
    };

    const deleteRoutine = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/routines/${id}`);
            fetchRoutines();
        } catch (error) {
            console.error("Error deleting routine:", error);
        }
    };

    const handleUpdateRoutine = async () => {
        if (!editingRoutine.name.trim()) return;
        try {
            await api.put(`/routines/${editingRoutine._id}`, editingRoutine);
            setEditingRoutine(null);
            fetchRoutines();
        } catch (error) {
            console.error("Error updating routine:", error);
        }
    };

    const addBlockToRoutine = () => {
        const blocks = [...editingRoutine.blocks];
        const lastBlock = blocks[blocks.length - 1];
        let start = "09:00", end = "10:00";
        if (lastBlock) {
            start = lastBlock.endTime;
            const [h, m] = start.split(':').map(Number);
            end = `${(h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
        setEditingRoutine({
            ...editingRoutine,
            blocks: [...blocks, { startTime: start, endTime: end, plan: '' }]
        });
    };

    const updateRoutineBlock = (idx, field, val) => {
        const blocks = [...editingRoutine.blocks];
        blocks[idx][field] = val;
        setEditingRoutine({ ...editingRoutine, blocks });
    };

    const removeRoutineBlock = (idx) => {
        setEditingRoutine({
            ...editingRoutine,
            blocks: editingRoutine.blocks.filter((_, i) => i !== idx)
        });
    };

    const getDuration = (start, end) => {
        if (!start || !end) return '';
        try {
            const [sH, sM] = start.split(':').map(Number);
            const [eH, eM] = end.split(':').map(Number);
            let diff = (eH * 60 + eM) - (sH * 60 + sM);
            if (diff < 0) diff += 24 * 60;

            const h = Math.floor(diff / 60);
            const m = diff % 60;

            let res = [];
            if (h > 0) res.push(`${h}h`);
            if (m > 0) res.push(`${m}m`);
            return res.join(' ') || '0m';
        } catch (e) {
            return '';
        }
    };

    const calculateProgress = () => {
        if (!planner || !planner.blocks || !planner.blocks.length) return 0;
        const total = planner.blocks.filter(b => b.plan.trim() !== '').length;
        if (total === 0) return 0;
        const completed = planner.blocks.filter(b => b.plan.trim() !== '' && b.completed).length;
        return Math.round((completed / total) * 100);
    };

    const changeDate = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    if (loading && !planner) return <div className="p-8">Loading your day...</div>;
    if (!planner) return <div className="p-8">No planner data available. Try refreshing or selecting another date.</div>;

    const progress = calculateProgress();

    return (
        <div className="planner-container">
            <header className="planner-header">
                <div className="header-left">
                    <h1>Day Planner</h1>
                    <div className="date-controls">
                        <button onClick={() => changeDate(-1)} className="date-nav-btn"><ChevronLeft size={20} /></button>
                        <div className="current-date">
                            <Calendar size={18} />
                            <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <button onClick={() => changeDate(1)} className="date-nav-btn"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className="header-right">
                    <div className="routine-selector">
                        <button className="routine-trigger" onClick={() => setShowRoutines(!showRoutines)}>
                            <Zap size={18} />
                            Routines
                        </button>
                        <AnimatePresence>
                            {showRoutines && (
                                <motion.div
                                    className="routine-dropdown"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                >
                                    <div className="routine-header">
                                        <span>Your Routines</span>
                                        <button className="add-routine-minimal" onClick={() => setIsSavingRoutine(true)}>
                                            <Plus size={14} /> New
                                        </button>
                                    </div>
                                    <div className="routine-list">
                                        {routines.map((r) => (
                                            <div key={r._id} className="routine-item-wrapper">
                                                <button onClick={() => applyRoutine(r)} className="routine-option">
                                                    {ICON_MAP[r.icon] || <Sun size={16} />}
                                                    <span>{r.name}</span>
                                                </button>
                                                <div className="routine-actions">
                                                    <button className="routine-action-btn edit" onClick={(e) => { e.stopPropagation(); setEditingRoutine({ ...r }); setShowRoutines(false); }}>
                                                        <Edit3 size={12} />
                                                    </button>
                                                    <button className="routine-action-btn delete" onClick={(e) => deleteRoutine(r._id, e)}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="routine-divider"></div>
                                    <button onClick={() => setPlanner({ ...planner, blocks: [] })} className="routine-option clear-btn">
                                        <Trash2 size={16} />
                                        Clear All Blocks
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {isSavingRoutine && (
                            <motion.div
                                className="modal-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSavingRoutine(false)}
                            >
                                <motion.div
                                    className="routine-modal"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <h3>Save Current as Routine</h3>
                                    <input
                                        type="text"
                                        placeholder="Routine Name (e.g. Work Session)"
                                        value={newRoutineName}
                                        onChange={e => setNewRoutineName(e.target.value)}
                                        autoFocus
                                        className="modal-input"
                                    />
                                    <div className="modal-actions">
                                        <button onClick={() => setIsSavingRoutine(false)} className="cancel-btn">Cancel</button>
                                        <button onClick={saveAsRoutine} className="confirm-btn">Save Routine</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {editingRoutine && (
                            <motion.div
                                className="modal-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setEditingRoutine(null)}
                            >
                                <motion.div
                                    className="routine-modal routine-editor-modal"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <header className="modal-header">
                                        <h3>Edit Routine</h3>
                                        <button onClick={() => setEditingRoutine(null)} className="close-modal-btn">×</button>
                                    </header>

                                    <div className="modal-body">
                                        <div className="form-group">
                                            <label>Routine Name</label>
                                            <input
                                                type="text"
                                                value={editingRoutine.name}
                                                onChange={e => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
                                                className="modal-input"
                                            />
                                        </div>

                                        <div className="routine-blocks-editor">
                                            <label>Template Blocks</label>
                                            <div className="editor-blocks-list">
                                                {editingRoutine.blocks.map((block, idx) => (
                                                    <div key={idx} className="editor-block-item">
                                                        <input
                                                            type="time"
                                                            value={block.startTime}
                                                            onChange={e => updateRoutineBlock(idx, 'startTime', e.target.value)}
                                                            className="mini-time-input"
                                                        />
                                                        <span className="arrow">→</span>
                                                        <input
                                                            type="time"
                                                            value={block.endTime}
                                                            onChange={e => updateRoutineBlock(idx, 'endTime', e.target.value)}
                                                            className="mini-time-input"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={block.plan}
                                                            onChange={e => updateRoutineBlock(idx, 'plan', e.target.value)}
                                                            placeholder="Plan..."
                                                            className="mini-plan-input"
                                                        />
                                                        <button onClick={() => removeRoutineBlock(idx)} className="mini-delete-btn">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={addBlockToRoutine} className="mini-add-btn">
                                                <Plus size={14} /> Add Block
                                            </button>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button onClick={() => setEditingRoutine(null)} className="cancel-btn">Cancel</button>
                                        <button onClick={handleUpdateRoutine} className="confirm-btn">Update Routine</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="progress-status">
                        <div className="progress-label">Your Promise: {progress}% Met</div>
                        <div className="progress-bar-bg">
                            <motion.div
                                className="progress-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <button onClick={saveChanges} className="save-planner-btn">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </header>

            <main className="planner-main">
                <div className="time-blocks-grid">
                    {planner.blocks?.map((block, index) => (
                        <motion.div
                            key={index}
                            className={`time-block ${selectedBlockIndex === index ? 'active' : ''} ${block.completed ? 'completed' : ''}`}
                            onClick={() => setSelectedBlockIndex(index)}
                        >
                            <div className="time-col">
                                <input
                                    type="time"
                                    value={block.startTime}
                                    onChange={(e) => updateBlockText(index, 'startTime', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="time-input"
                                />
                                <div className="duration-tag">{getDuration(block.startTime, block.endTime)}</div>
                                <input
                                    type="time"
                                    value={block.endTime}
                                    onChange={(e) => updateBlockText(index, 'endTime', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="time-input"
                                />
                            </div>

                            <div className="plan-col">
                                <input
                                    type="text"
                                    placeholder="What's the plan?"
                                    value={block.plan}
                                    onChange={(e) => updateBlockText(index, 'plan', e.target.value)}
                                    className="plan-input"
                                />
                            </div>

                            <div className="block-actions">
                                <button
                                    className={`status-toggle ${block.completed ? 'is-done' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); toggleBlockStatus(index); }}
                                    title={block.completed ? "Mark as incomplete" : "Mark as completed"}
                                >
                                    {block.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                </button>
                                <button
                                    className="delete-block-btn"
                                    onClick={(e) => { e.stopPropagation(); removeBlock(index); }}
                                    title="Delete block"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    <motion.button
                        className="add-block-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addBlock}
                    >
                        <Plus size={20} />
                        Add Time Block
                    </motion.button>
                </div>

                <aside className="reality-sidebar">
                    <AnimatePresence mode="wait">
                        {selectedBlockIndex !== null ? (
                            <motion.div
                                key={selectedBlockIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="sidebar-content"
                            >
                                <div className="selected-block-info">
                                    <Clock size={16} />
                                    <span>{planner.blocks[selectedBlockIndex].startTime} - {planner.blocks[selectedBlockIndex].endTime}</span>
                                </div>
                                <div className="reality-section">
                                    <textarea
                                        placeholder="What happened during this hour? Record achievements, notes, or thoughts..."
                                        value={planner.blocks[selectedBlockIndex].reality}
                                        onChange={(e) => updateBlockText(selectedBlockIndex, 'reality', e.target.value)}
                                    />
                                </div>
                                <div className="sync-tip">
                                    Changes are saved when you click "Save Changes" above.
                                </div>
                            </motion.div>
                        ) : (
                            <div className="sidebar-empty">
                                <p>Select a time block to record what you actually did during that period.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </aside>
            </main>
        </div>
    );
};

export default DayPlanner;
