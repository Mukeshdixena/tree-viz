import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Save, Layout, Trash2, Plus, Zap, Coffee, Sunrise, Sun, Moon } from 'lucide-react';
import { api } from '../../api';
import './DayPlanner.css';

const ROUTINES = {
    weekday: {
        name: 'Weekday',
        icon: <Sun size={16} />,
        blocks: [
            { startTime: "07:00", endTime: "08:00", plan: "Morning Routine", reality: "", completed: false },
            { startTime: "08:00", endTime: "09:00", plan: "Deep Work / Focus", reality: "", completed: false },
            { startTime: "09:00", endTime: "13:00", plan: "Primary Work Block", reality: "", completed: false },
            { startTime: "13:00", endTime: "14:00", plan: "Lunch Break", reality: "", completed: false },
            { startTime: "14:00", endTime: "17:00", plan: "Secondary Work Block", reality: "", completed: false },
            { startTime: "17:00", endTime: "18:00", plan: "Exercise / Wind down", reality: "", completed: false },
            { startTime: "18:00", endTime: "22:00", plan: "Family / Personal Time", reality: "", completed: false },
        ]
    },
    weekend: {
        name: 'Weekend',
        icon: <Moon size={16} />,
        blocks: [
            { startTime: "09:00", endTime: "10:00", plan: "Slow Morning", reality: "", completed: false },
            { startTime: "10:00", endTime: "13:00", plan: "Hobbies / Errands", reality: "", completed: false },
            { startTime: "13:00", endTime: "15:00", plan: "Family Lunch", reality: "", completed: false },
            { startTime: "15:00", endTime: "18:00", plan: "Relaxation / Outing", reality: "", completed: false },
            { startTime: "18:00", endTime: "22:00", plan: "Evening Leisure", reality: "", completed: false },
        ]
    },
    wokeuplate: {
        name: 'Woke Up Late',
        icon: <Coffee size={16} />,
        blocks: [
            { startTime: "10:30", endTime: "11:30", plan: "Quick Catchup", reality: "", completed: false },
            { startTime: "11:30", endTime: "13:30", plan: "Focused Sprint", reality: "", completed: false },
            { startTime: "13:30", endTime: "14:30", plan: "Lunch", reality: "", completed: false },
            { startTime: "14:30", endTime: "18:00", plan: "Remaining Tasks", reality: "", completed: false },
        ]
    },
    early4am: {
        name: '4:00 AM Routine',
        icon: <Sunrise size={16} />,
        blocks: [
            { startTime: "04:00", endTime: "05:00", plan: "Exercise / Workout", reality: "", completed: false },
            { startTime: "05:00", endTime: "06:00", plan: "Reading / Planning", reality: "", completed: false },
            { startTime: "06:00", endTime: "08:00", plan: "Deep Focus Session 1", reality: "", completed: false },
            { startTime: "08:00", endTime: "09:00", plan: "Breakfast", reality: "", completed: false },
            { startTime: "09:00", endTime: "12:00", plan: "Work Session 2", reality: "", completed: false },
        ]
    }
};

const DayPlanner = () => {
    const [planner, setPlanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const [showRoutines, setShowRoutines] = useState(false);

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

    useEffect(() => {
        fetchPlanner(selectedDate);
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

    const applyRoutine = (routineKey) => {
        const routine = ROUTINES[routineKey];
        if (routine) {
            setPlanner({ ...planner, blocks: routine.blocks });
            setShowRoutines(false);
        }
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
                                    {Object.entries(ROUTINES).map(([key, r]) => (
                                        <button key={key} onClick={() => applyRoutine(key)} className="routine-option">
                                            {r.icon}
                                            {r.name}
                                        </button>
                                    ))}
                                    <div className="routine-divider"></div>
                                    <button onClick={() => setPlanner({ ...planner, blocks: [] })} className="routine-option clear-btn">
                                        <Trash2 size={16} />
                                        Clear All Blocks
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
