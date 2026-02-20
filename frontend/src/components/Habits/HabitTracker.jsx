import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, CheckCircle2, ChevronLeft, ChevronRight,
    Plus, Trash2, Zap, Flame, Edit3, Check, X
} from 'lucide-react';
import { api } from '../../api';
import './HabitTracker.css';

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];

const HabitTracker = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [newHabit, setNewHabit] = useState({ name: '', icon: 'Zap', color: '#14b8a6', trackingType: 'none' });
    const [editingHabit, setEditingHabit] = useState(null);
    const [showManualInput, setShowManualInput] = useState(null); // { habitId, dateStr, value }
    const tableBodyRef = useRef(null);

    const fetchHabits = async () => {
        setLoading(true);
        try {
            const data = await api.get('/habits');
            if (data) setHabits(data);
        } catch (error) {
            console.error('Error fetching habits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHabits(); }, []);

    const handleAddHabit = async () => {
        if (!newHabit.name.trim()) return;
        try {
            if (editingHabit) {
                await api.put(`/habits/${editingHabit._id}`, newHabit);
            } else {
                await api.post('/habits', newHabit);
            }
            setNewHabit({ name: '', icon: 'Zap', color: '#14b8a6', trackingType: 'none' });
            setShowAddModal(false);
            setEditingHabit(null);
            fetchHabits();
        } catch (error) {
            console.error('Error adding/editing habit:', error);
        }
    };

    const openEditModal = (habit) => {
        setEditingHabit(habit);
        setNewHabit({ name: habit.name, icon: habit.icon, color: habit.color, trackingType: habit.trackingType });
        setShowAddModal(true);
    };

    const toggleHabit = async (habit, dateStr) => {
        try {
            if (habit.trackingType === 'none') {
                await api.post(`/habits/${habit._id}/toggle`, { date: dateStr });
            } else {
                const currentVal = getDayTotal(habit.logs, dateStr);
                setShowManualInput({ habitId: habit._id, dateStr, value: currentVal });
                return;
            }
            fetchHabits();
        } catch (error) {
            console.error('Error toggling habit:', error);
        }
    };

    const handleSetProgress = async () => {
        if (!showManualInput) return;
        try {
            await api.post(`/habits/${showManualInput.habitId}/set-progress`, {
                date: showManualInput.dateStr,
                value: parseFloat(showManualInput.value)
            });
            setShowManualInput(null);
            fetchHabits();
        } catch (error) {
            console.error('Error setting progress:', error);
        }
    };

    const deleteHabit = async (id) => {
        if (!window.confirm('Delete this habit and all its history?')) return;
        try {
            await api.delete(`/habits/${id}`);
            fetchHabits();
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    const changeMonth = (offset) => {
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() + offset);
        setCurrentMonth(d);
    };

    // Build array of Date objects for every day in the current month
    const getMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const count = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: count }, (_, i) => new Date(year, month, i + 1));
    };

    const calcStreak = (logs) => {
        if (!logs) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const logEntries = logs[ds];
            if (logEntries && Array.isArray(logEntries) && logEntries.length > 0) streak++;
            else break;
        }
        return streak;
    };

    const getDayTotal = (logs, ds) => {
        const entries = logs?.[ds];
        if (!entries || !Array.isArray(entries)) return 0;
        return entries.reduce((acc, curr) => acc + curr.value, 0);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const monthDays = getMonthDays();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Summary row: how many habits done per day
    const dayTotals = monthDays.map(d => {
        const ds = d.toISOString().split('T')[0];
        return habits.filter(h => h.logs && h.logs[ds] && h.logs[ds].length > 0).length;
    });

    if (loading) {
        return (
            <div className="ht-loading">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Zap size={28} color="var(--primary)" />
                </motion.div>
                <span>Loading habits…</span>
            </div>
        );
    }

    return (
        <div className="ht-container">
            {/* Header */}
            <header className="ht-header">
                <div className="ht-header-left">
                    <Flame size={22} color="#f59e0b" />
                    <div>
                        <h1>Habit Tracker</h1>
                        <p>{habits.length} habit{habits.length !== 1 ? 's' : ''} tracked</p>
                    </div>
                </div>
                <div className="ht-header-right">
                    <div className="ht-month-nav">
                        <button className="ht-nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
                        <span>
                            <Calendar size={14} />
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button className="ht-nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
                    </div>
                    <button className="ht-add-btn" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add Habit
                    </button>
                </div>
            </header>

            {/* Table wrapper */}
            <div className="ht-table-wrapper">
                {habits.length === 0 ? (
                    <div className="ht-empty">
                        <Zap size={36} color="var(--primary)" opacity={0.4} />
                        <p>No habits yet. Click <strong>Add Habit</strong> to get started!</p>
                    </div>
                ) : (
                    <table className="ht-table">
                        <thead>
                            <tr>
                                <th className="ht-th-habit">Habit</th>
                                {monthDays.map(d => {
                                    const ds = d.toISOString().split('T')[0];
                                    const isToday = ds === todayStr;
                                    return (
                                        <th
                                            key={ds}
                                            className={`ht-th-day${isToday ? ' today' : ''}`}
                                            title={d.toDateString()}
                                        >
                                            <span className="ht-day-num">{d.getDate()}</span>
                                            <span className="ht-day-name">{dayNames[d.getDay()]}</span>
                                        </th>
                                    );
                                })}
                                <th className="ht-th-streak">Streak</th>
                                <th className="ht-th-total">Done</th>
                                <th className="ht-th-del"></th>
                            </tr>
                        </thead>
                        <tbody ref={tableBodyRef}>
                            {habits.map((habit, hIdx) => {
                                const streak = calcStreak(habit.logs);
                                const monthTotal = monthDays.filter(d => habit.logs && habit.logs[d.toISOString().split('T')[0]] && habit.logs[d.toISOString().split('T')[0]].length > 0).length;
                                return (
                                    <motion.tr
                                        key={habit._id}
                                        className="ht-row"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: hIdx * 0.04 }}
                                    >
                                        {/* Habit name cell */}
                                        <td className="ht-td-habit">
                                            <span
                                                className="ht-habit-dot"
                                                style={{ background: habit.color }}
                                            />
                                            <div className="ht-habit-actions">
                                                <button className="ht-row-action-btn" onClick={() => openEditModal(habit)}><Edit3 size={12} /></button>
                                                <button className="ht-row-action-btn delete" onClick={() => deleteHabit(habit._id)}><Trash2 size={12} /></button>
                                            </div>
                                            <span className="ht-habit-name">{habit.name}</span>
                                        </td>

                                        {/* Day cells */}
                                        {monthDays.map(d => {
                                            const ds = d.toISOString().split('T')[0];
                                            const done = !!(habit.logs && habit.logs[ds]);
                                            const isToday = ds === todayStr;
                                            const isFuture = d > new Date();
                                            const logsForDay = habit.logs?.[ds] || [];
                                            const timeString = logsForDay.length > 0
                                                ? logsForDay.map(l => new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })).join(', ')
                                                : '';
                                            return (
                                                <td
                                                    key={ds}
                                                    className={`ht-td-day${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`}
                                                    onClick={() => !isFuture && toggleHabit(habit, ds)}
                                                    title={`${habit.name} – ${d.toDateString()}${timeString ? '\nLogged at: ' + timeString : ''}`}
                                                >
                                                    <div
                                                        className={`ht-cell${done ? ' done' : ''}`}
                                                        style={done ? { background: habit.color + '22', borderColor: habit.color } : {}}
                                                    >
                                                        {done && (habit.trackingType === 'none' ? (
                                                            <CheckCircle2
                                                                size={14}
                                                                style={{ color: habit.color }}
                                                            />
                                                        ) : (
                                                            <span className="ht-cell-value" style={{ color: habit.color }}>
                                                                {getDayTotal(habit.logs, ds)}
                                                                {habit.trackingType === 'hours' ? 'h' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Streak */}
                                        <td className="ht-td-streak">
                                            {streak > 0 ? (
                                                <span className="ht-streak-badge" style={{ color: habit.color }}>
                                                    🔥 {streak}d
                                                </span>
                                            ) : <span className="ht-streak-zero">—</span>}
                                        </td>

                                        {/* Month total */}
                                        <td className="ht-td-total">
                                            <span className="ht-month-total" style={{ color: habit.color }}>
                                                {monthTotal}/{monthDays.length}
                                            </span>
                                        </td>

                                        {/* Delete */}
                                        <td className="ht-td-del">
                                            <button className="ht-del-btn" onClick={() => deleteHabit(habit._id)}>
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                        {/* Summary footer */}
                        <tfoot>
                            <tr className="ht-footer-row">
                                <td className="ht-td-habit ht-footer-label">Daily total</td>
                                {dayTotals.map((count, i) => {
                                    const pct = habits.length > 0 ? count / habits.length : 0;
                                    const ds = monthDays[i].toISOString().split('T')[0];
                                    const isToday = ds === todayStr;
                                    const bg = pct === 0 ? 'transparent'
                                        : pct < 0.34 ? '#14b8a630'
                                            : pct < 0.67 ? '#14b8a660'
                                                : '#14b8a6aa';
                                    return (
                                        <td
                                            key={i}
                                            className={`ht-td-day ht-footer-cell${isToday ? ' today' : ''}`}
                                            style={{ background: bg }}
                                            title={`${count}/${habits.length} habits`}
                                        >
                                            {count > 0 && (
                                                <span className="ht-footer-count">{count}</span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td colSpan={3} className="ht-footer-end">
                                    <div className="ht-legend">
                                        <span>Less</span>
                                        {['transparent', '#14b8a630', '#14b8a660', '#14b8a6aa'].map((c, i) => (
                                            <div key={i} className="ht-legend-dot"
                                                style={{ background: c === 'transparent' ? 'var(--bg-tertiary)' : c }} />
                                        ))}
                                        <span>More</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            {/* Add Habit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div className="ht-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="ht-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
                            <h3>{editingHabit ? 'Edit Habit' : 'New Habit'}</h3>
                            <div className="ht-form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Meditation"
                                    value={newHabit.name}
                                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
                                    autoFocus
                                />
                            </div>
                            <div className="ht-form-group">
                                <label>Tracking Type</label>
                                <select
                                    className="ht-select"
                                    value={newHabit.trackingType}
                                    onChange={e => setNewHabit({ ...newHabit, trackingType: e.target.value })}
                                >
                                    <option value="none">Checkbox (Yes/No)</option>
                                    <option value="count">Count (e.g. Pages, Glasses)</option>
                                    <option value="hours">Hours (e.g. Study, Meditation)</option>
                                </select>
                            </div>
                            {/* ... color row ... */}
                            <div className="ht-form-group">
                                <label>Color</label>
                                <div className="ht-color-row">
                                    {COLORS.map(c => (
                                        <div
                                            key={c}
                                            className={`ht-color-dot${newHabit.color === c ? ' active' : ''}`}
                                            style={{ background: c }}
                                            onClick={() => setNewHabit({ ...newHabit, color: c })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="ht-modal-actions">
                                <button className="ht-cancel-btn" onClick={() => { setShowAddModal(false); setEditingHabit(null); }}>Cancel</button>
                                <button className="ht-save-btn" onClick={handleAddHabit}>{editingHabit ? 'Save Changes' : 'Create Habit'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual Progress Setting Modal */}
            <AnimatePresence>
                {showManualInput && (
                    <motion.div className="ht-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="ht-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Set Progress</h3>
                                <button onClick={() => setShowManualInput(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                Correct your progress for {showManualInput.dateStr}
                            </p>
                            <div className="ht-form-group">
                                <label>Total Value</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Enter total amount"
                                    value={showManualInput.value}
                                    onChange={e => setShowManualInput({ ...showManualInput, value: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleSetProgress()}
                                    autoFocus
                                />
                            </div>
                            <div className="ht-modal-actions">
                                <button className="ht-save-btn" style={{ width: '100%' }} onClick={handleSetProgress}>Update Progress</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HabitTracker;
