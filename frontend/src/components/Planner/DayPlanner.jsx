import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, Save, Layout, Trash2, Plus, Zap, Coffee, Sunrise, Sun, Moon, Edit3, PlusCircle, Flame, Sparkles, Send } from 'lucide-react';
import Modal from '../Modal';
import { api } from '../../api';
import { subscribeToUpdates, unsubscribeFromUpdates } from '../../socket';
import './DayPlanner.css';

const ICON_MAP = {
    Sun: <Sun size={16} />,
    Moon: <Moon size={16} />,
    Sunrise: <Sunrise size={16} />,
    Coffee: <Coffee size={16} />,
    Zap: <Zap size={16} />,
    Layout: <Layout size={16} />,
};

const TAGS = {
    'none': { label: 'No Tag', color: '#94a3b8', bg: '#f1f5f9' },
    'meditation': { label: 'Meditation', color: '#8b5cf6', bg: '#f5f3ff' },
    'fitness': { label: 'Fitness', color: '#ef4444', bg: '#fef2f2' },
    'dsa': { label: 'DSA', color: '#3b82f6', bg: '#eff6ff' },
    'english': { label: 'English', color: '#f59e0b', bg: '#fffbeb' },
    'work': { label: 'Work', color: '#10b981', bg: '#ecfdf5' },
    'study': { label: 'Study', color: '#6366f1', bg: '#eef2ff' },
    'rest': { label: 'Rest', color: '#64748b', bg: '#f8fafc' },
    'family': { label: 'Family', color: '#ec4899', bg: '#fdf2f8' },
};

const PRESETS = [
    { label: 'Sleep', plan: 'Sleep', icon: 'Moon' },
    { label: 'Work', plan: 'Work Session', icon: 'Sun' },
    { label: 'DSA', plan: 'DSA Practice', icon: 'Zap' },
    { label: 'English', plan: 'English Learning', icon: 'Layout' },
    { label: 'Fitness', plan: 'Exercise / Gym', icon: 'Zap' },
    { label: 'Rest', plan: 'Rest / Break', icon: 'Coffee' },
];

const DayPlanner = () => {
    const [planner, setPlanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [routines, setRoutines] = useState([]);
    const [showRoutines, setShowRoutines] = useState(false);
    const [isSavingRoutine, setIsSavingRoutine] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState(null);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [viewMode, setViewMode] = useState('day'); // 'day' or 'month'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthData, setMonthData] = useState([]);
    const [habits, setHabits] = useState([]);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
        onConfirm: () => { },
    });
    const [manualHabitLog, setManualHabitLog] = useState(null); // { habitId, name, value, date }
    const [aiPlanPrompt, setAiPlanPrompt] = useState('');
    const [isAiPlanning, setIsAiPlanning] = useState(false);
    const [aiLogPrompt, setAiLogPrompt] = useState('');
    const [isAiLogging, setIsAiLogging] = useState(false);

    const showModal = (config) => {
        setModal({
            isOpen: true,
            title: config.title || 'Action Required',
            message: config.message || '',
            type: config.type || 'alert',
            onConfirm: config.onConfirm || (() => { }),
        });
    };

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

    const fetchTasks = async () => {
        try {
            const data = await api.get('/task');
            if (data) setTasks(data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const fetchHabits = async () => {
        try {
            const data = await api.get('/habits');
            if (data) setHabits(data);
        } catch (error) {
            console.error("Error fetching habits:", error);
        }
    };

    const fetchMonthData = async (monthDate) => {
        try {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const data = await api.get(`/planner/month?year=${year}&month=${month}`);
            if (data) setMonthData(data);
        } catch (error) {
            console.error("Error fetching month data:", error);
        }
    };

    useEffect(() => {
        fetchPlanner(selectedDate);
        fetchRoutines();
        fetchTasks();
        fetchHabits();

        subscribeToUpdates((update) => {
            if (update.type === 'task' || update.type === 'planner' || update.type === 'habit') {
                if (update.type === 'task') fetchTasks();
                if (update.type === 'planner' && update.date === selectedDate) fetchPlanner(selectedDate);
                if (update.type === 'habit') fetchHabits();
            }
        });

        return () => {
            unsubscribeFromUpdates();
        };
    }, [selectedDate]);

    useEffect(() => {
        fetchMonthData(currentMonth);
    }, [currentMonth]);

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

    const handleAiPlan = async () => {
        if (!aiPlanPrompt.trim()) return;
        setIsAiPlanning(true);
        try {
            const hasExistingPlan = planner && planner.blocks && planner.blocks.length > 0;
            const result = await api.post('/ai/generate-plan', {
                prompt: aiPlanPrompt,
                currentPlan: hasExistingPlan ? planner : null
            });
            if (result && result.blocks) {
                const newPlanner = {
                    ...planner,
                    wakeUpTime: result.wakeUpTime || planner.wakeUpTime,
                    blocks: result.blocks.map(b => ({
                        ...b,
                        reality: '',
                        completed: 0,
                        tag: b.tag || 'none'
                    }))
                };
                setPlanner(newPlanner);
                setAiPlanPrompt('');
                // Optionally auto-save
                // handleUpdate(newPlanner);
            }
        } catch (error) {
            console.error("AI Planning failed:", error);
            showModal({ title: 'AI Error', message: 'Failed to generate plan. Please try again.' });
        } finally {
            setIsAiPlanning(false);
        }
    };

    const handleAiLog = async () => {
        if (!aiLogPrompt.trim()) return;
        setIsAiLogging(true);
        try {
            const result = await api.post('/ai/log-progress', {
                plan: { blocks: planner.blocks },
                prompt: aiLogPrompt
            });

            if (result && result.blocks) {
                const newBlocks = [...planner.blocks];
                result.blocks.forEach(update => {
                    const idx = update.index;
                    if (newBlocks[idx]) {
                        newBlocks[idx].reality = update.reality;
                        newBlocks[idx].completed = update.completed;
                    }
                });
                setPlanner({ ...planner, blocks: newBlocks });
                setAiLogPrompt('');
            }
        } catch (error) {
            console.error("AI Logging failed:", error);
            showModal({ title: 'AI Error', message: 'Failed to process AI progress log.' });
        } finally {
            setIsAiLogging(false);
        }
    };

    const toggleHabit = async (habit) => {
        try {
            if (habit.trackingType === 'none') {
                await api.post(`/habits/${habit._id}/toggle`, { date: selectedDate });
            } else {
                const increment = habit.trackingType === 'hours' ? 0.5 : 1;
                await api.post(`/habits/${habit._id}/progress`, { date: selectedDate, value: increment });
            }
            fetchHabits();
        } catch (error) {
            console.error("Error toggling habit:", error);
        }
    };

    const logHabitProgress = async (habitId, value) => {
        try {
            await api.post(`/habits/${habitId}/progress`, { date: selectedDate, value });
            fetchHabits();
        } catch (error) {
            console.error("Error logging habit progress:", error);
        }
    };

    const setHabitValue = async (habitId, value) => {
        try {
            await api.post(`/habits/${habitId}/set-progress`, { date: selectedDate, value });
            setManualHabitLog(null);
            fetchHabits();
        } catch (error) {
            console.error("Error setting habit value:", error);
        }
    };

    const getHabitDayTotal = (logs, dateStr) => {
        const entries = logs?.[dateStr];
        if (!entries || !Array.isArray(entries)) return 0;
        return entries.reduce((acc, curr) => acc + curr.value, 0);
    };

    const updateDayTask = (idx, field, val) => {
        const newDayTasks = [...(planner.dayTasks || [])];
        newDayTasks[idx][field] = val;
        setPlanner({ ...planner, dayTasks: newDayTasks });
    };

    const addDayTask = () => {
        const newDayTasks = [...(planner.dayTasks || []), { taskId: '', progressMade: 0 }];
        setPlanner({ ...planner, dayTasks: newDayTasks });
    };

    const removeDayTask = (idx) => {
        const newDayTasks = (planner.dayTasks || []).filter((_, i) => i !== idx);
        setPlanner({ ...planner, dayTasks: newDayTasks });
    };

    const updateBlockCompletion = (index, value) => {
        const newBlocks = [...planner.blocks];
        newBlocks[index].completed = value;
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
            tag: 'none',
            target: '',
            reality: '',
            completed: 0
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
                completed: 0
            }));
            setPlanner({ ...planner, blocks: newBlocks });
            setShowRoutines(false);
            setSelectedBlockIndex(null);
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

    const deleteRoutine = async (id, name, e) => {
        e.stopPropagation();
        showModal({
            title: 'Delete Routine',
            message: `Are you sure you want to delete the routine "${name}"? This action cannot be undone.`,
            type: 'confirm',
            onConfirm: async (confirmed) => {
                if (confirmed) {
                    try {
                        await api.delete(`/routines/${id}`);
                        fetchRoutines();
                    } catch (error) {
                        console.error("Error deleting routine:", error);
                    }
                }
            }
        });
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

    const applyPreset = (blockIdx, preset) => {
        const newBlocks = [...planner.blocks];
        newBlocks[blockIdx].plan = preset.plan;
        setPlanner({ ...planner, blocks: newBlocks });
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
        const validBlocks = planner.blocks.filter(b => b.plan.trim() !== '');
        const total = validBlocks.length;
        if (total === 0) return 0;
        const totalCompletion = validBlocks.reduce((acc, b) => acc + (Number(b.completed) || 0), 0);
        return Math.round(totalCompletion / total);
    };

    const changeDate = (days) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
    };

    const goToToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        setCurrentMonth(new Date());
    };

    const generateMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Padding for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(new Date(year, month, d));
        }
        return days;
    };

    const changeMonth = (offset) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        setCurrentMonth(newMonth);
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!date) return false;
        const dStr = date.toISOString().split('T')[0];
        return dStr === selectedDate;
    };

    const handleDayClick = (date) => {
        if (!date) return;
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setViewMode('day');
    };

    if (loading && !planner) return <div className="p-8">Loading your day...</div>;
    if (!planner) return <div className="p-8">No planner data available. Try refreshing or selecting another date.</div>;

    const progress = calculateProgress();

    return (
        <div className="planner-container">
            <header className="planner-header">
                <div className="header-left">
                    <div className="title-row">
                        <h1>Day Planner</h1>
                        <div className="view-toggles">
                            <button
                                className={`view-toggle-btn ${viewMode === 'day' ? 'active' : ''}`}
                                onClick={() => setViewMode('day')}
                            >
                                Day
                            </button>
                            <button
                                className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                                onClick={() => setViewMode('month')}
                            >
                                Month
                            </button>
                        </div>
                    </div>

                    <div className="date-controls">
                        <button
                            className="today-btn"
                            onClick={goToToday}
                        >
                            Today
                        </button>
                        <div className="date-nav-group">
                            {viewMode === 'day' ? (
                                <>
                                    <button onClick={() => changeDate(-1)} className="date-nav-btn"><ChevronLeft size={20} /></button>
                                    <div className="current-date">
                                        <Calendar size={18} />
                                        <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <button onClick={() => changeDate(1)} className="date-nav-btn"><ChevronRight size={20} /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => changeMonth(-1)} className="date-nav-btn"><ChevronLeft size={20} /></button>
                                    <div className="current-date">
                                        <Calendar size={18} />
                                        <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <button onClick={() => changeMonth(1)} className="date-nav-btn"><ChevronRight size={20} /></button>
                                </>
                            )}
                        </div>
                    </div>



                    {viewMode === 'day' && (
                        <div className="wake-up-section">
                            <div className="wake-up-card">
                                <Sunrise size={20} className="wake-up-icon" />
                                <div className="wake-up-info">
                                    <span className="wake-up-label">Wake Up Time</span>
                                    <input
                                        type="time"
                                        value={planner?.wakeUpTime || ''}
                                        onChange={(e) => setPlanner({ ...planner, wakeUpTime: e.target.value })}
                                        className="wake-up-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
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
                                                    <button className="routine-action-btn delete" onClick={(e) => deleteRoutine(r._id, r.name, e)}>
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
                    {viewMode === 'day' && (
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
                    )}
                    {viewMode === 'day' && (
                        <button onClick={saveChanges} className="save-planner-btn">
                            <Save size={18} />
                            Save Changes
                        </button>
                    )}
                </div>
            </header>

            <main className="planner-main-container">
                {viewMode === 'day' && (
                    <>
                        <div className="habits-overview">
                            <div className="habits-label">
                                <Flame size={18} />
                                <span>Today's Habits</span>
                            </div>
                            <div className="habits-chips-list">
                                {habits.map(habit => {
                                    const dayTotal = getHabitDayTotal(habit.logs, selectedDate);
                                    const isDone = dayTotal > 0;
                                    return (
                                        <div key={habit._id} className="habit-chip-container">
                                            <button
                                                className={`habit-chip ${isDone ? 'done' : ''}`}
                                                style={{ '--habit-color': habit.color, '--habit-bg': habit.color + '20' }}
                                                onClick={() => toggleHabit(habit)}
                                            >
                                                <div className="habit-icon-mini">
                                                    <Zap size={14} />
                                                </div>
                                                <div className="habit-info-mini">
                                                    <span className="habit-name-mini">{habit.name}</span>
                                                    {habit.trackingType !== 'none' && (
                                                        <span className="habit-progress-mini">
                                                            {dayTotal}{habit.trackingType === 'hours' ? 'h' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {habit.trackingType === 'none' && (isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />)}
                                                {habit.trackingType !== 'none' && (
                                                    <div
                                                        className="habit-edit-val-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setManualHabitLog({ habitId: habit._id, name: habit.name, value: dayTotal, date: selectedDate });
                                                        }}
                                                    >
                                                        <Edit3 size={14} />
                                                    </div>
                                                )}
                                            </button>

                                            {habit.trackingType !== 'none' && (
                                                <div className="habit-quick-actions">
                                                    {habit.trackingType === 'count' ? (
                                                        <div className="quick-btn-group">
                                                            <button onClick={() => logHabitProgress(habit._id, 1)}>+1</button>
                                                            <button onClick={() => logHabitProgress(habit._id, 5)}>+5</button>
                                                            <button className="reset-btn" onClick={() => api.post(`/habits/${habit._id}/toggle`, { date: selectedDate }).then(fetchHabits)} title="Reset Today">×</button>
                                                        </div>
                                                    ) : (
                                                        <div className="quick-btn-group">
                                                            <button onClick={() => logHabitProgress(habit._id, 0.5)}>+30m</button>
                                                            <button onClick={() => logHabitProgress(habit._id, 1)}>+1h</button>
                                                            <button className="reset-btn" onClick={() => api.post(`/habits/${habit._id}/toggle`, { date: selectedDate }).then(fetchHabits)} title="Reset Today">×</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {habits.length === 0 && <span className="no-habits-text">No habits tracked yet. Add some in the Habit Tracker!</span>}
                            </div>
                        </div>

                        <div className="day-tasks-overview">
                            <div className="habits-label">
                                <CheckCircle2 size={18} />
                                <span>Task Progress</span>
                            </div>
                            <div className="day-tasks-grid">
                                <AnimatePresence>
                                    {(planner.dayTasks || []).map((dt, idx) => {
                                        const linkedTask = tasks.find(t => t._id === dt.taskId);
                                        const overallProgress = linkedTask ? Math.round((linkedTask.targetCurrent / linkedTask.targetTotal) * 100) : 0;

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="day-task-card"
                                            >
                                                <div className="card-header-row">
                                                    <select
                                                        value={dt.taskId || ''}
                                                        onChange={(e) => updateDayTask(idx, 'taskId', e.target.value)}
                                                        className="day-task-select"
                                                    >
                                                        <option value="">Select Task...</option>
                                                        {tasks.filter(t => t.status !== 'done').map(t => (
                                                            <option key={t._id} value={t._id}>{t.title}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={() => removeDayTask(idx)} className="day-task-remove-btn">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="card-input-row">
                                                    <div className="input-with-label">
                                                        <label>Logged Today</label>
                                                        <div className="mini-progress-input">
                                                            <input
                                                                type="number"
                                                                value={dt.progressMade || ''}
                                                                onChange={(e) => updateDayTask(idx, 'progressMade', parseInt(e.target.value) || 0)}
                                                                placeholder="0"
                                                            />
                                                            <span className="unit-label">{linkedTask?.targetValue || 'pts'}</span>
                                                        </div>
                                                    </div>

                                                    {linkedTask && (
                                                        <div className="overall-summary">
                                                            <label>Total Cap</label>
                                                            <div className="summary-val">
                                                                <span>{linkedTask.targetCurrent}</span>
                                                                <span className="divider">/</span>
                                                                <span>{linkedTask.targetTotal}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {linkedTask && (
                                                    <div className="card-footer-progress">
                                                        <div className="mini-progress-track">
                                                            <motion.div
                                                                className="mini-progress-fill"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(overallProgress, 100)}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                            />
                                                        </div>
                                                        <span className="progress-percent">{overallProgress}%</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: 'var(--bg-secondary)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={addDayTask}
                                    className="day-task-add-card"
                                >
                                    <PlusCircle size={20} />
                                    <span>Log Progress</span>
                                </motion.button>
                            </div>
                        </div>
                    </>
                )}
                <div className="planner-main">
                    {viewMode === 'day' ? (
                        <>
                            <div className="time-blocks-grid">
                                <div className="ai-plan-input-container sticky-top">
                                    <div className={`ai-input-wrapper ${isAiPlanning ? 'loading' : ''}`}>
                                        <Sparkles size={20} className="ai-icon" />
                                        <textarea
                                            placeholder="What's your plan for today? Type it naturally..."
                                            value={aiPlanPrompt}
                                            onChange={(e) => setAiPlanPrompt(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAiPlan();
                                                }
                                            }}
                                            disabled={isAiPlanning}
                                            className="ai-textarea"
                                        />
                                        <button
                                            className="ai-send-btn"
                                            onClick={handleAiPlan}
                                            disabled={isAiPlanning || !aiPlanPrompt.trim()}
                                        >
                                            {isAiPlanning ? <div className="ai-spinner-small"></div> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                                {planner.blocks?.map((block, index) => (
                                    <motion.div
                                        key={index}
                                        className={`time-block ${selectedBlockIndex === index ? 'active' : ''} ${block.completed === 100 ? 'completed' : ''} ${block.completed > 0 && block.completed < 100 ? 'partial' : ''}`}
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
                                            <span className="time-sep">-</span>
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
                                <div className="ai-log-input-container sticky-top">
                                    <div className={`ai-input-wrapper ${isAiLogging ? 'loading' : ''}`}>
                                        <Sparkles size={18} className="ai-icon" />
                                        <textarea
                                            placeholder="What did you achieve? (e.g. I did the work session and 1hr gym)"
                                            value={aiLogPrompt}
                                            onChange={(e) => setAiLogPrompt(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAiLog();
                                                }
                                            }}
                                            disabled={isAiLogging}
                                            className="ai-textarea"
                                        />
                                        <button
                                            className="ai-send-btn"
                                            onClick={handleAiLog}
                                            disabled={isAiLogging || !aiLogPrompt.trim()}
                                        >
                                            {isAiLogging ? <div className="ai-spinner-small"></div> : <Send size={14} />}
                                        </button>
                                    </div>
                                </div>
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

                                            <div className="completion-status-sidebar">
                                                <div className="label-row">
                                                    <label>Completion Status</label>
                                                    <span className="percent-display">{planner.blocks[selectedBlockIndex].completed}%</span>
                                                </div>
                                                <div className="slider-container">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        value={planner.blocks[selectedBlockIndex].completed || 0}
                                                        onChange={(e) => updateBlockCompletion(selectedBlockIndex, parseInt(e.target.value))}
                                                        className="completion-slider"
                                                        style={{
                                                            '--progress': `${planner.blocks[selectedBlockIndex].completed}%`,
                                                            '--slider-active-color': planner.blocks[selectedBlockIndex].completed === 100 ? 'var(--completion-100)' :
                                                                planner.blocks[selectedBlockIndex].completed >= 50 ? 'var(--completion-75)' :
                                                                    planner.blocks[selectedBlockIndex].completed > 0 ? 'var(--completion-50)' : 'var(--text-muted)'
                                                        }}
                                                    />
                                                    <div className="slider-track-marks">
                                                        {[0, 25, 50, 75, 100].map(mark => (
                                                            <span key={mark} className="mark"></span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="reality-section">
                                                <div className="task-link-group">
                                                    <label>Link to Task</label>
                                                    <select
                                                        value={planner.blocks[selectedBlockIndex].taskId || ''}
                                                        onChange={(e) => updateBlockText(selectedBlockIndex, 'taskId', e.target.value)}
                                                        className="sidebar-select"
                                                    >
                                                        <option value="">No linked task</option>
                                                        {tasks.filter(t => t.status !== 'done').map(t => (
                                                            <option key={t._id} value={t._id}>{t.title}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {planner.blocks[selectedBlockIndex].taskId && (
                                                    <div className="progress-input-group">
                                                        <div className="label-row">
                                                            <label>Progress Made</label>
                                                            {tasks.find(t => t._id === planner.blocks[selectedBlockIndex].taskId) && (
                                                                <span className="task-overall-mini">
                                                                    Overall: {tasks.find(t => t._id === planner.blocks[selectedBlockIndex].taskId).targetCurrent} / {tasks.find(t => t._id === planner.blocks[selectedBlockIndex].taskId).targetTotal}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="progress-input-wrapper">
                                                            <input
                                                                type="number"
                                                                placeholder="Amount done..."
                                                                value={planner.blocks[selectedBlockIndex].progressMade || ''}
                                                                onChange={(e) => updateBlockText(selectedBlockIndex, 'progressMade', parseInt(e.target.value) || 0)}
                                                            />
                                                            <span>{tasks.find(t => t._id === planner.blocks[selectedBlockIndex].taskId)?.targetValue || 'units'}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <label>Notes / Reality</label>
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
                        </>
                    ) : (
                        <div className="month-view-container">
                            <div className="calendar-grid">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="calendar-weekday">{day}</div>
                                ))}
                                {generateMonthDays().map((date, idx) => (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
                                        onClick={() => handleDayClick(date)}
                                    >
                                        {date && (
                                            <>
                                                <span className="day-number">{date.getDate()}</span>
                                                <div className="day-indicators">
                                                    {monthData.find(d => d.date === date.toISOString().split('T')[0])?.tags.slice(0, 3).map((tag, tIdx) => (
                                                        <div
                                                            key={tIdx}
                                                            className="day-dot"
                                                            style={{ backgroundColor: TAGS[tag]?.color }}
                                                        />
                                                    ))}
                                                </div>
                                                {monthData.find(d => d.date === date.toISOString().split('T')[0])?.totalBlocks > 0 && (
                                                    <div className="day-progress-mini">
                                                        <div
                                                            className="day-progress-bar"
                                                            style={{
                                                                width: `${(monthData.find(d => d.date === date.toISOString().split('T')[0]).completedBlocks / monthData.find(d => d.date === date.toISOString().split('T')[0]).totalBlocks) * 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            {/* Manual Habit Log Modal */}
            <AnimatePresence>
                {manualHabitLog && (
                    <div className="modal-overlay">
                        <div className="routine-modal" style={{ maxWidth: '380px' }}>
                            <div className="modal-header">
                                <h3>Correct Progress</h3>
                                <button className="close-modal-btn" onClick={() => setManualHabitLog(null)}>×</button>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Set total for <strong>{manualHabitLog.name}</strong> on {selectedDate}
                            </p>
                            <div className="form-group">
                                <label>Actual Value</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        step="any"
                                        className="modal-input"
                                        value={manualHabitLog.value}
                                        onChange={(e) => setManualHabitLog({ ...manualHabitLog, value: e.target.value })}
                                        autoFocus
                                    />
                                    <button
                                        className="save-planner-btn"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => setHabitValue(manualHabitLog.habitId, parseFloat(manualHabitLog.value))}
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <Modal
                {...modal}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default DayPlanner;
