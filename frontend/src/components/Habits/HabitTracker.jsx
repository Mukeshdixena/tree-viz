import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Circle, ChevronLeft, ChevronRight, Plus, Trash2, Zap, Edit3, Heart, Target, Flame } from 'lucide-react';
import { api } from '../../api';
import './HabitTracker.css';

const HabitTracker = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', icon: 'Zap', color: '#14b8a6' });

    const fetchHabits = async () => {
        setLoading(true);
        try {
            const data = await api.get('/habits');
            if (data) setHabits(data);
        } catch (error) {
            console.error("Error fetching habits:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    const handleAddHabit = async () => {
        if (!newHabit.name.trim()) return;
        try {
            await api.post('/habits', newHabit);
            setNewHabit({ name: '', icon: 'Zap', color: '#14b8a6' });
            setShowAddModal(false);
            fetchHabits();
        } catch (error) {
            console.error("Error adding habit:", error);
        }
    };

    const toggleHabit = async (habitId, dateStr) => {
        try {
            await api.post(`/habits/${habitId}/toggle`, { date: dateStr });
            fetchHabits();
        } catch (error) {
            console.error("Error toggling habit:", error);
        }
    };

    const deleteHabit = async (id) => {
        if (!window.confirm("Delete this habit and all its history?")) return;
        try {
            await api.delete(`/habits/${id}`);
            fetchHabits();
        } catch (error) {
            console.error("Error deleting habit:", error);
        }
    };

    const generateMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
        return days;
    };

    const changeMonth = (offset) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        setCurrentMonth(newMonth);
    };

    if (loading) return <div className="p-8">Loading your habits...</div>;

    const days = generateMonthDays();
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="habit-tracker-container">
            <header className="habit-header">
                <div className="header-left">
                    <h1>Habit Tracker</h1>
                    <div className="month-nav">
                        <button onClick={() => changeMonth(-1)} className="nav-btn"><ChevronLeft size={20} /></button>
                        <span className="current-month">
                            <Calendar size={18} />
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="nav-btn"><ChevronRight size={20} /></button>
                    </div>
                </div>
                <button className="add-habit-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Habit
                </button>
            </header>

            <main className="habit-content">
                <div className="habits-sidebar">
                    <h3>Your Habits</h3>
                    <div className="habits-list">
                        {habits.map(habit => (
                            <div key={habit._id} className="habit-card">
                                <div className="habit-info">
                                    <div className="habit-icon" style={{ backgroundColor: habit.color + '20', color: habit.color }}>
                                        <Zap size={16} />
                                    </div>
                                    <div className="habit-details">
                                        <span className="habit-name">{habit.name}</span>
                                        <span className="habit-streak">
                                            <Flame size={12} /> {Object.keys(habit.logs).length} days total
                                        </span>
                                    </div>
                                </div>
                                <button className="delete-mini" onClick={() => deleteHabit(habit._id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="habit-view-area">
                    <div className="habit-calendar-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="calendar-weekday">{day}</div>
                        ))}
                        {days.map((date, idx) => {
                            if (!date) return <div key={idx} className="calendar-day empty"></div>;
                            const dStr = date.toISOString().split('T')[0];
                            const isToday = dStr === todayStr;

                            return (
                                <div key={idx} className={`calendar-day ${isToday ? 'today' : ''}`}>
                                    <span className="day-number">{date.getDate()}</span>
                                    <div className="day-habits">
                                        {habits.map(habit => (
                                            <div
                                                key={habit._id}
                                                className={`habit-toggle-dot ${habit.logs[dStr] ? 'done' : ''}`}
                                                style={{ '--habit-color': habit.color }}
                                                title={`${habit.name}: ${habit.logs[dStr] ? 'Done' : 'Pending'}`}
                                            >
                                                {habit.logs[dStr] && <CheckCircle2 size={10} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="habit-modal"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                        >
                            <h3>Create New Habit</h3>
                            <div className="form-group">
                                <label>Habit Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Morning Run"
                                    value={newHabit.name}
                                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Color Theme</label>
                                <div className="color-presets">
                                    {['#14b8a6', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'].map(c => (
                                        <div
                                            key={c}
                                            className={`color-swatch ${newHabit.color === c ? 'active' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setNewHabit({ ...newHabit, color: c })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button className="save-btn" onClick={handleAddHabit}>Create Habit</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HabitTracker;
