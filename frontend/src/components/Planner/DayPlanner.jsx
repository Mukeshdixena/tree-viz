import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Save, Layout } from 'lucide-react';
import { api } from '../../api';
import './DayPlanner.css';

const DayPlanner = () => {
    const [planner, setPlanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);

    const fetchPlanner = async (date) => {
        setLoading(true);
        const data = await api.get(`/planner?date=${date}`);
        if (data) setPlanner(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchPlanner(selectedDate);
    }, [selectedDate]);

    const handleUpdate = async (updatedPlanner) => {
        const result = await api.put('/planner', updatedPlanner);
        if (result) setPlanner(result);
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
                    {planner?.blocks.map((block, index) => (
                        <motion.div
                            key={index}
                            className={`time-block ${selectedBlockIndex === index ? 'active' : ''} ${block.completed ? 'completed' : ''}`}
                            onClick={() => setSelectedBlockIndex(index)}
                        >
                            <div className="time-col">
                                <span className="start-time">{block.startTime}</span>
                                <div className="time-divider"></div>
                                <span className="end-time">{block.endTime}</span>
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

                            <button
                                className={`status-toggle ${block.completed ? 'is-done' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleBlockStatus(index); }}
                            >
                                {block.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </button>
                        </motion.div>
                    ))}
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
