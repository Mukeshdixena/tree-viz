import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Trophy, Target, Zap, Flame, CheckCircle2,
    ChevronLeft, ChevronRight, Calendar, BarChart2,
    TrendingUp, BookOpen, Brain, Plus, Trash2, ListChecks
} from 'lucide-react';
import { api } from '../../api';
import { subscribeToUpdates, unsubscribeFromUpdates } from '../../socket';
import './LearningDashboard.css';

// ---- Sub-components ----

const StatCard = ({ icon: Icon, title, value, sub, color, delay }) => (
    <motion.div
        className="ld-stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ y: -4 }}
    >
        <div className="ld-stat-icon" style={{ background: color + '20', color }}>
            <Icon size={22} />
        </div>
        <div className="ld-stat-body">
            <span className="ld-stat-value">{value}</span>
            <span className="ld-stat-title">{title}</span>
            {sub && <span className="ld-stat-sub">{sub}</span>}
        </div>
    </motion.div>
);

const ProgressDonut = ({ percentage, color, label }) => {
    const r = 38;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <div className="ld-donut">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <motion.circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                />
                <text x="50" y="50" dy=".35em" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">
                    {percentage}%
                </text>
            </svg>
            <span className="ld-donut-label">{label}</span>
        </div>
    );
};

const WeekBar = ({ day, value, max, color }) => (
    <div className="ld-week-bar-col">
        <div className="ld-week-bar-track">
            <motion.div
                className="ld-week-bar-fill"
                style={{ background: color }}
                initial={{ height: 0 }}
                animate={{ height: max > 0 ? `${(value / max) * 100}%` : '0%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            />
        </div>
        <span className="ld-week-bar-label">{day}</span>
        <span className="ld-week-bar-val">{value}</span>
    </div>
);

// ---- Main Component ----

const LearningDashboard = () => {
    const [stats, setStats] = useState(null);
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showAddHabit, setShowAddHabit] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', color: '#14b8a6', unit: 'session', dailyTarget: 1 });
    // Inline editing of habit log value per habit
    const [editingValues, setEditingValues] = useState({});

    const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];
    const DONUT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#14b8a6'];
    const UNITS = ['session', 'hours', 'questions', 'pages', 'km', 'reps', 'minutes'];

    const fetchAll = async () => {
        try {
            const [statsData, habitsData] = await Promise.all([
                api.get('/stats/dashboard'),
                api.get('/habits'),
            ]);
            if (statsData) setStats(statsData);
            if (habitsData) setHabits(habitsData);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        subscribeToUpdates(() => fetchAll());
        return () => unsubscribeFromUpdates();
    }, []);

    const logHabitValue = async (habitId, value) => {
        const today = new Date().toISOString().split('T')[0];
        try {
            await api.post(`/habits/${habitId}/log`, { date: today, value: parseFloat(value) || 0 });
            fetchAll();
        } catch (err) {
            console.error('Error logging habit:', err);
        }
    };

    const addHabit = async () => {
        if (!newHabit.name.trim()) return;
        try {
            await api.post('/habits', { ...newHabit, icon: 'Zap' });
            setNewHabit({ name: '', color: '#14b8a6', unit: 'session', dailyTarget: 1 });
            setShowAddHabit(false);
            fetchAll();
        } catch (err) {
            console.error('Error adding habit:', err);
        }
    };

    const deleteHabit = async (id) => {
        if (!window.confirm('Delete this habit?')) return;
        try {
            await api.delete(`/habits/${id}`);
            fetchAll();
        } catch (err) {
            console.error('Error deleting habit:', err);
        }
    };

    const changeMonth = (offset) => {
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() + offset);
        setCurrentMonth(d);
    };

    const generateMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
        return days;
    };

    // Build weekly task data (last 7 days) - using habit log values
    const buildWeekData = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            const dStr = d.toISOString().split('T')[0];
            const completedHabits = habits.filter(h => {
                const val = h.logs && h.logs[dStr];
                const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0);
                return numVal > 0;
            }).length;
            return { day: days[d.getDay()], value: completedHabits, date: dStr };
        });
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const days = generateMonthDays();
    const weekData = buildWeekData();
    const maxWeekVal = Math.max(...weekData.map(w => w.value), 1);

    // Habit streak: count consecutive days habit was logged
    const calcHabitStreak = (logs) => {
        if (!logs) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const val = logs[dStr];
            const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0);
            if (numVal > 0) streak++;
            else break;
        }
        return streak;
    };

    const getHabitCumulativeTotal = (logs) => {
        if (!logs) return 0;
        return Object.values(logs).reduce((sum, v) => {
            const n = typeof v === 'boolean' ? (v ? 1 : 0) : (v || 0);
            return sum + n;
        }, 0);
    };

    const todayHabitsTotal = habits.length;
    const todayHabitsDone = habits.filter(h => {
        const val = h.logs && h.logs[todayStr];
        const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0);
        return numVal > 0;
    }).length;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => calcHabitStreak(h.logs))) : 0;

    // Count-type task stats (general — any task with a numeric target)
    const countStats = stats?.countStats;
    const countPct = countStats?.goal > 0 ? Math.min(100, Math.round((countStats.totalDone / countStats.goal) * 100)) : 0;

    if (loading) {
        return (
            <div className="ld-loading">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Zap size={32} color="var(--primary)" />
                </motion.div>
                <span>Loading your progress...</span>
            </div>
        );
    }

    return (
        <div className="ld-container">
            {/* ── Header ── */}
            <header className="ld-header">
                <div>
                    <h1>My Progress Hub</h1>
                    <p>Stay consistent. Track everything. Win every day.</p>
                </div>
                <div className="ld-header-date">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* ── Top Stats ── */}
            <section className="ld-stats-grid">
                <StatCard icon={Flame} title="Habit Streak" value={`${bestStreak}d`} sub="Longest active streak" color="#f59e0b" delay={0.1} />
                <StatCard icon={CheckCircle2} title="Today's Habits" value={`${todayHabitsDone}/${todayHabitsTotal}`} sub="Keep going!" color="#10b981" delay={0.15} />
                <StatCard icon={Trophy} title="Tasks Completed" value={stats?.completedGoals ?? 0} sub="All time" color="#3b82f6" delay={0.2} />
                <StatCard icon={Target} title="Active Tasks" value={stats?.activeGoals ?? 0} sub="In progress" color="#8b5cf6" delay={0.25} />
                <StatCard icon={ListChecks} title="Progress Made" value={countStats?.totalDone ?? 0} sub={`Goal: ${countStats?.goal ?? 0}`} color="#6366f1" delay={0.3} />
                <StatCard icon={TrendingUp} title="Day Streak" value={`${stats?.streak ?? 0}d`} sub="Journal + tasks" color="#ec4899" delay={0.35} />
            </section>

            {/* ── Task Progress Widget (all count-type tasks) ── */}
            {countStats && countStats.goal > 0 && (
                <motion.section className="ld-card ld-dsa-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                    <div className="ld-section-title" style={{ marginBottom: '1rem' }}>
                        <ListChecks size={18} color="#6366f1" />
                        <h2>Task Progress Tracker</h2>
                        <span className="ld-dsa-badge">{countPct}% overall</span>
                    </div>
                    <div className="ld-dsa-main">
                        <div className="ld-dsa-numbers">
                            <div className="ld-dsa-big">{countStats.totalDone}</div>
                            <div className="ld-dsa-of">/ {countStats.goal} total</div>
                            <div className="ld-dsa-avg">~{countStats.dailyAvg}/day avg</div>
                        </div>
                        <div className="ld-dsa-bar-wrap">
                            <div className="ld-dsa-bar-track">
                                <motion.div
                                    className="ld-dsa-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${countPct}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                />
                            </div>
                            <div className="ld-dsa-tasks">
                                {countStats.tasks.map((t, i) => (
                                    <div key={i} className="ld-dsa-task-row">
                                        <span className="ld-dsa-task-name">{t.title}</span>
                                        <span className="ld-dsa-task-count">{t.current}/{t.total} {t.unit}</span>
                                        <span className={`ld-dsa-task-status ${t.status}`}>{t.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* ── Main Grid ── */}
            <div className="ld-main-grid">

                {/* ── Habit Tracker ── */}
                <motion.section className="ld-card ld-habits-section"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="ld-section-header">
                        <div className="ld-section-title">
                            <Flame size={18} color="#f59e0b" />
                            <h2>Habit Tracker</h2>
                        </div>
                        <div className="ld-habit-controls">
                            <div className="ld-month-nav">
                                <button onClick={() => changeMonth(-1)} className="ld-nav-btn"><ChevronLeft size={16} /></button>
                                <span>{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                <button onClick={() => changeMonth(1)} className="ld-nav-btn"><ChevronRight size={16} /></button>
                            </div>
                            <button className="ld-add-habit-btn" onClick={() => setShowAddHabit(!showAddHabit)}>
                                <Plus size={14} /> Add
                            </button>
                        </div>
                    </div>

                    {/* Add habit inline form */}
                    <AnimatePresence>
                        {showAddHabit && (
                            <motion.div className="ld-add-habit-form"
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <input
                                    type="text"
                                    placeholder="Habit name (e.g. Meditate, Solve DSA)"
                                    value={newHabit.name}
                                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && addHabit()}
                                    autoFocus
                                    className="ld-habit-input"
                                />
                                <div className="ld-habit-meta-row">
                                    <div className="ld-habit-meta-group">
                                        <label>Daily Target</label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.5"
                                            value={newHabit.dailyTarget}
                                            onChange={e => setNewHabit({ ...newHabit, dailyTarget: parseFloat(e.target.value) || 1 })}
                                            className="ld-habit-num-input"
                                        />
                                    </div>
                                    <div className="ld-habit-meta-group">
                                        <label>Unit</label>
                                        <select
                                            value={newHabit.unit}
                                            onChange={e => setNewHabit({ ...newHabit, unit: e.target.value })}
                                            className="ld-habit-select"
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="ld-color-row">
                                    {COLORS.map(c => (
                                        <div key={c} className={`ld-color-dot ${newHabit.color === c ? 'active' : ''}`}
                                            style={{ background: c }}
                                            onClick={() => setNewHabit({ ...newHabit, color: c })} />
                                    ))}
                                </div>
                                <div className="ld-form-actions">
                                    <button onClick={() => setShowAddHabit(false)} className="ld-cancel-btn">Cancel</button>
                                    <button onClick={addHabit} className="ld-save-btn">Create Habit</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Today's habit log inputs */}
                    <div className="ld-today-habits">
                        <p className="ld-subsection-label">Today — Log Your Progress</p>
                        {habits.length === 0 && <p className="ld-empty">No habits yet. Add one above!</p>}
                        {habits.map(habit => {
                            const todayVal = (() => {
                                const raw = habit.logs && habit.logs[todayStr];
                                return typeof raw === 'boolean' ? (raw ? 1 : 0) : (raw || 0);
                            })();
                            const streak = calcHabitStreak(habit.logs);
                            const total = getHabitCumulativeTotal(habit.logs);
                            const target = habit.dailyTarget || 1;
                            const pct = Math.min(100, Math.round((todayVal / target) * 100));
                            const done = todayVal >= target;

                            return (
                                <div key={habit._id} className={`ld-habit-row ${done ? 'done' : ''}`}>
                                    <div className="ld-habit-color-dot" style={{ background: habit.color }} />
                                    <div className="ld-habit-info">
                                        <div className="ld-habit-top-row">
                                            <span className="ld-habit-name">{habit.name}</span>
                                            {streak > 0 && (
                                                <span className="ld-habit-streak" style={{ color: habit.color }}>
                                                    🔥 {streak}d
                                                </span>
                                            )}
                                        </div>
                                        <div className="ld-habit-progress-bar-track">
                                            <motion.div
                                                className="ld-habit-progress-bar-fill"
                                                style={{ background: habit.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6 }}
                                            />
                                        </div>
                                        <div className="ld-habit-meta">
                                            <span className="ld-habit-cumulative">Total: {total.toFixed(1)} {habit.unit || 'sessions'}</span>
                                            <span className="ld-habit-target">{todayVal}/{target} {habit.unit || 'sessions'} today</span>
                                        </div>
                                    </div>
                                    <div className="ld-habit-log-input-wrap">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            className="ld-habit-log-input"
                                            placeholder="0"
                                            value={editingValues[habit._id] !== undefined ? editingValues[habit._id] : (todayVal || '')}
                                            onChange={e => setEditingValues({ ...editingValues, [habit._id]: e.target.value })}
                                            onBlur={e => {
                                                if (editingValues[habit._id] !== undefined) {
                                                    logHabitValue(habit._id, editingValues[habit._id]);
                                                    setEditingValues(prev => {
                                                        const n = { ...prev };
                                                        delete n[habit._id];
                                                        return n;
                                                    });
                                                }
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    logHabitValue(habit._id, editingValues[habit._id] || 0);
                                                    setEditingValues(prev => {
                                                        const n = { ...prev };
                                                        delete n[habit._id];
                                                        return n;
                                                    });
                                                    e.target.blur();
                                                }
                                            }}
                                            style={{ '--hc': habit.color }}
                                        />
                                        <span className="ld-habit-log-unit">{habit.unit || 'sessions'}</span>
                                    </div>
                                    <button className="ld-habit-del" onClick={() => deleteHabit(habit._id)}><Trash2 size={13} /></button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Calendar grid */}
                    <div className="ld-habit-calendar">
                        <p className="ld-subsection-label">Monthly Overview</p>
                        <div className="ld-cal-weekdays">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
                        </div>
                        <div className="ld-cal-grid">
                            {days.map((date, idx) => {
                                if (!date) return <div key={idx} className="ld-cal-cell empty" />;
                                const dStr = date.toISOString().split('T')[0];
                                const isToday = dStr === todayStr;
                                const doneCount = habits.filter(h => {
                                    const val = h.logs && h.logs[dStr];
                                    const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0);
                                    return numVal > 0;
                                }).length;
                                const pct = habits.length > 0 ? doneCount / habits.length : 0;
                                const bg = pct === 0 ? 'transparent' :
                                    pct < 0.34 ? '#14b8a620' :
                                        pct < 0.67 ? '#14b8a650' : '#14b8a6';
                                return (
                                    <div key={idx} className={`ld-cal-cell ${isToday ? 'today' : ''}`}
                                        style={{ background: bg }}
                                        title={`${date.toDateString()}: ${doneCount}/${habits.length} habits`}>
                                        <span className="ld-cal-num">{date.getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="ld-cal-legend">
                            <span>Less</span>
                            <div className="ld-legend-dots">
                                {['transparent', '#14b8a620', '#14b8a650', '#14b8a6'].map((c, i) => (
                                    <div key={i} className="ld-legend-dot" style={{ background: c === 'transparent' ? 'var(--bg-tertiary)' : c }} />
                                ))}
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </motion.section>

                {/* ── Right Column ── */}
                <div className="ld-right-col">

                    {/* Weekly Activity */}
                    <motion.section className="ld-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <div className="ld-section-title" style={{ marginBottom: '1.5rem' }}>
                            <BarChart2 size={18} color="#3b82f6" />
                            <h2>Weekly Habit Activity</h2>
                        </div>
                        <div className="ld-week-bars">
                            {weekData.map((w, i) => (
                                <WeekBar key={i} day={w.day} value={w.value} max={maxWeekVal} color="var(--primary)" />
                            ))}
                        </div>
                        <p className="ld-chart-footnote">Habits logged per day (last 7 days)</p>
                    </motion.section>

                    {/* Roadmap Mastery */}
                    <motion.section className="ld-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <div className="ld-section-title" style={{ marginBottom: '1.5rem' }}>
                            <Brain size={18} color="#8b5cf6" />
                            <h2>Roadmap Mastery</h2>
                        </div>
                        <div className="ld-donuts">
                            {stats?.topicMastery?.length > 0 ? stats.topicMastery.map((t, i) => (
                                <ProgressDonut key={i} percentage={t.percentage} label={t.label} color={DONUT_COLORS[i % DONUT_COLORS.length]} />
                            )) : (
                                <p className="ld-empty">Complete some roadmap nodes to see mastery.</p>
                            )}
                        </div>
                    </motion.section>

                    {/* Recent Activity Feed */}
                    <motion.section className="ld-card"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                        <div className="ld-section-title" style={{ marginBottom: '1.25rem' }}>
                            <BookOpen size={18} color="#10b981" />
                            <h2>Recent Activity</h2>
                        </div>
                        <ul className="ld-activity-list">
                            {stats?.recentActivity?.length > 0 ? stats.recentActivity.slice(0, 8).map((a, i) => (
                                <li key={i} className="ld-activity-item">
                                    <div className="ld-activity-dot"
                                        style={{ background: a.type === 'task' ? '#6366f1' : a.type === 'journal' ? '#10b981' : '#f59e0b' }} />
                                    <div className="ld-activity-text">
                                        <strong>{a.title}</strong>
                                        <span>{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </li>
                            )) : (
                                <p className="ld-empty">No recent activity yet.</p>
                            )}
                        </ul>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default LearningDashboard;
