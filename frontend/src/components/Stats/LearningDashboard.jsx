import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, Clock, Trophy, Target, Zap, Flame, CheckCircle2,
    ChevronLeft, ChevronRight, Calendar, BarChart2,
    Star, TrendingUp, BookOpen, Brain, Coffee, Plus, Trash2, Edit3,
    Activity, Shield, PieChart, Layers, ArrowUpRight, ZapOff, Heart, Sunrise,
    AlertTriangle, Award, XCircle
} from 'lucide-react';
import { api } from '../../api';
import { subscribeToUpdates, unsubscribeFromUpdates } from '../../socket';
import './LearningDashboard.css';

// ── Discipline Score Ring ──────────────────────────────────────────────
const DisciplineScoreRing = ({ score, color }) => {
    const r = 52;
    const circ = 2 * Math.PI * r;
    return (
        <div className="ld-disc-ring-wrap">
            <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="10" />
                <motion.circle
                    cx="65" cy="65" r={r} fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ}
                    animate={{ strokeDashoffset: circ - (score / 100) * circ }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                    transform="rotate(-90 65 65)"
                    style={{ filter: `drop-shadow(0 0 10px ${color}80)` }}
                />
                <text x="65" y="60" textAnchor="middle" fontSize="28" fontWeight="800" fill="var(--text-primary)">{score}</text>
                <text x="65" y="78" textAnchor="middle" fontSize="12" fill="var(--text-muted)">/100</text>
            </svg>
        </div>
    );
};

// ── Sub-Score Bar ─────────────────────────────────────────────────────
const SubScoreBar = ({ label, value, color, weight, delay }) => (
    <div className="ld-sub-score">
        <div className="ld-sub-score-header">
            <span>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="ld-sub-score-weight">{weight}%</span>
                <span style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{value}</span>
            </div>
        </div>
        <div className="ld-sub-score-track">
            <motion.div
                className="ld-sub-score-fill"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay }}
            />
        </div>
    </div>
);

const ICON_MAP = {
    Zap: Zap,
    Activity: Activity,
    Target: Target,
    Flame: Flame,
    Clock: Clock,
    Book: Book,
    Trophy: Trophy,
    Star: Star,
    Brain: Brain,
    Coffee: Coffee,
    Heart: Heart,
};

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

// ── Badge definitions ────────────────────────────────────────────────
const BADGES = [
    { id: 'streak7', icon: '🔥', label: '7-Day Streak', desc: '7 consecutive active days', check: (d) => d.streak >= 7 },
    { id: 'streak30', icon: '🏆', label: '30-Day Warrior', desc: '30 consecutive active days', check: (d) => d.streak >= 30 },
    { id: 'habits100', icon: '💯', label: 'Perfect Habits', desc: 'All habits done today', check: (d, s) => s && s.todayHabitsDone > 0 && s.todayHabitsDone === s.todayHabitsTotal },
    { id: 'taskcrush', icon: '🎯', label: 'Task Crusher', desc: '10+ tasks completed', check: (d) => d.completedThisWeek >= 10 },
    { id: 'discpro', icon: '⚡️', label: 'Discipline Pro', desc: 'Score 70+ for a week', check: (d) => d.disciplineScore >= 70 },
    { id: 'planner80', icon: '📋', label: 'Planner Master', desc: 'Planner adherence > 80%', check: (d) => d.subScores?.plannerAdherence >= 80 },
    { id: 'earlybird', icon: '🌅', label: 'Early Bird', desc: 'Avg wake before 6:30 AM', check: (d, s) => s && s.avgWakeUp !== '--:--' && (() => { const [h, m] = s.avgWakeUp.split(':').map(Number); return h * 60 + m <= 390; })() },
    { id: 'consistent', icon: '🌟', label: 'Consistent', desc: 'Habit consistency > 90%', check: (d) => d.subScores?.habitConsistency >= 90 },
];

const LearningDashboard = () => {
    const [stats, setStats] = useState(null);
    const [disciplineData, setDisciplineData] = useState(null);
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showAddHabit, setShowAddHabit] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', color: '#14b8a6', trackingType: 'none' });
    const [editingHabit, setEditingHabit] = useState(null);
    const [manualEntry, setManualEntry] = useState(null); // { habitId, name, value, date }

    const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];
    const DONUT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#14b8a6'];

    const fetchAll = async () => {
        try {
            const [statsData, habitsData, discData] = await Promise.all([
                api.get('/stats/dashboard'),
                api.get('/habits'),
                api.get('/stats/discipline'),
            ]);
            if (statsData) setStats(statsData);
            if (habitsData) setHabits(habitsData);
            if (discData) setDisciplineData(discData);
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

    const toggleHabit = async (habitId) => {
        const today = new Date().toISOString().split('T')[0];
        const habit = habits.find(h => h._id === habitId);
        if (!habit) return;

        try {
            if (habit.trackingType === 'none') {
                await api.post(`/habits/${habitId}/toggle`, { date: today });
            } else {
                const dayTotal = (habit.logs?.[today] || []).reduce((acc, c) => acc + c.value, 0);
                setManualEntry({ habitId, name: habit.name, value: dayTotal, date: today });
            }
            fetchAll();
        } catch (err) {
            console.error('Error toggling habit:', err);
        }
    };

    const addHabit = async () => {
        if (!newHabit.name.trim()) return;
        try {
            if (editingHabit) {
                await api.put(`/habits/${editingHabit._id}`, newHabit);
            } else {
                await api.post('/habits', { ...newHabit, icon: 'Zap' });
            }
            setNewHabit({ name: '', color: '#14b8a6', trackingType: 'none' });
            setEditingHabit(null);
            setShowAddHabit(false);
            fetchAll();
        } catch (err) {
            console.error('Error adding/editing habit:', err);
        }
    };

    const handleSetProgress = async () => {
        if (!manualEntry) return;
        try {
            await api.post(`/habits/${manualEntry.habitId}/set-progress`, {
                date: manualEntry.date,
                value: parseFloat(manualEntry.value)
            });
            setManualEntry(null);
            fetchAll();
        } catch (err) {
            console.error('Error setting manual progress:', err);
        }
    };

    const openEdit = (habit) => {
        setEditingHabit(habit);
        setNewHabit({ name: habit.name, color: habit.color, trackingType: habit.trackingType });
        setShowAddHabit(true);
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

    // Build weekly task data (last 7 days)
    const buildWeekData = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            const dStr = d.toISOString().split('T')[0];
            const logEntries = habits.filter(h => h.logs && h.logs[dStr] && h.logs[dStr].length > 0);
            const completedHabits = logEntries.length;
            return { day: days[d.getDay()], value: completedHabits, date: dStr };
        });
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const days = generateMonthDays();
    const weekData = buildWeekData();
    const maxWeekVal = Math.max(...weekData.map(w => w.value), 1);

    // Habit streak: count consecutive days habit was done
    const calcHabitStreak = (logs) => {
        if (!logs) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            if (logs[dStr] && Array.isArray(logs[dStr]) && logs[dStr].length > 0) streak++;
            else break;
        }
        return streak;
    };

    const todayHabitsTotal = habits.length;
    const todayHabitsDone = habits.filter(h => h.logs && h.logs[todayStr] && h.logs[todayStr].length > 0).length;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => calcHabitStreak(h.logs))) : 0;
    const maxHabitTotal = stats?.habitStats?.length ? Math.max(...stats.habitStats.map(h => h.total), 1) : 1;

    // Badge computation
    const statsForBadges = { ...stats, todayHabitsDone, todayHabitsTotal: habits.length };
    const earnedBadges = BADGES.filter(b => disciplineData ? b.check(disciplineData, statsForBadges) : false);

    // Discipline score color
    const discScore = disciplineData?.disciplineScore ?? 0;
    const discColor = discScore >= 70 ? '#10b981' : discScore >= 40 ? '#f59e0b' : '#ef4444';
    const discLabel = discScore >= 85 ? 'Excellent' : discScore >= 70 ? 'Strong' : discScore >= 55 ? 'Developing' : discScore >= 40 ? 'Struggling' : discScore >= 10 ? 'Critical' : 'No Data Yet';

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

            {/* ── Discipline Score Card ── */}
            {disciplineData && (
                <motion.section className="ld-discipline-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="ld-disc-left">
                        <DisciplineScoreRing score={discScore} color={discColor} />
                        <div className="ld-disc-info">
                            <span className="ld-disc-label-badge" style={{ background: discColor + '20', color: discColor }}>{discLabel}</span>
                            <h2 className="ld-disc-title">Discipline Score</h2>
                            <p className="ld-disc-sub">Computed from habit consistency, planner adherence, streak, and task velocity.</p>
                            <div className="ld-disc-streak">
                                <Flame size={16} color="#f59e0b" />
                                <span>Current streak: <strong>{disciplineData.streak} days</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="ld-disc-right">
                        <SubScoreBar label="Habit Consistency" value={disciplineData.subScores.habitConsistency} color="#f59e0b" weight={40} delay={0.5} />
                        <SubScoreBar label="Planner Adherence" value={disciplineData.subScores.plannerAdherence} color="#3b82f6" weight={30} delay={0.6} />
                        <SubScoreBar label="Streak Health" value={disciplineData.subScores.streakScore} color="#10b981" weight={20} delay={0.7} />
                        <SubScoreBar label="Task Velocity" value={disciplineData.subScores.velocityScore} color="#8b5cf6" weight={10} delay={0.8} />
                    </div>
                </motion.section>
            )}

            {/* ── Top Stats ── */}
            <section className="ld-stats-grid">
                <StatCard icon={Flame} title="Habit Streak" value={`${bestStreak}d`} sub="Longest active streak" color="#f59e0b" delay={0.1} />
                <StatCard icon={CheckCircle2} title="Today's Habits" value={`${todayHabitsDone}/${todayHabitsTotal}`} sub="Keep going!" color="#10b981" delay={0.15} />
                <StatCard icon={Trophy} title="Tasks Completed" value={stats?.completedGoals ?? 0} sub="All time" color="#3b82f6" delay={0.2} />
                <StatCard icon={Target} title="Active Roadmaps" value={stats?.activeGoals ?? 0} sub="In progress" color="#8b5cf6" delay={0.25} />
                <StatCard icon={Clock} title="Study Hours" value={`${stats?.totalHours ?? 0}h`} sub="Total invested" color="#6366f1" delay={0.3} />
                <StatCard icon={TrendingUp} title="Day Streak" value={`${stats?.streak ?? 0}d`} sub="Journal + tasks" color="#ec4899" delay={0.35} />
                <StatCard icon={Sunrise} title="Morning Wakeup" value={stats?.todayWakeUp ?? '--:--'} sub={`Avg: ${stats?.avgWakeUp ?? '--:--'}`} color="#f59e0b" delay={0.4} />
            </section>

            {/* ── Habit Totals (All-time) ── */}
            {stats?.habitStats?.length > 0 && (
                <section className="ld-habit-totals-section">
                    <div className="ld-ht-grid">
                        {stats.habitStats.map((h, i) => {
                            const Icon = ICON_MAP[h.icon] || Zap;
                            return (
                                <motion.div
                                    key={h._id}
                                    className="ld-ht-card"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + (i * 0.05) }}
                                >
                                    <div className="ld-ht-card-icon" style={{ background: h.color + '15', color: h.color }}>
                                        <Icon size={14} />
                                    </div>
                                    <div className="ld-ht-card-content">
                                        <span className="ld-ht-card-label">{h.name}</span>
                                        <div className="ld-ht-card-main">
                                            <span className="ld-ht-card-val">{h.total}</span>
                                            <span className="ld-ht-card-unit">
                                                {h.trackingType === 'hours' ? 'hrs' : h.trackingType === 'count' ? 'units' : 'times'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ld-ht-card-progress-mini">
                                        <div className="ld-ht-card-bar" style={{ background: h.color, width: `${(h.total / maxHabitTotal) * 100}%`, opacity: 0.5 }} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Main Grid ── */}
            <div className="ld-main-grid">

                {/* ── Habit Calendar & List ── */}
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
                                    placeholder="Habit name (e.g. Read 20 pages)"
                                    value={newHabit.name}
                                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && addHabit()}
                                    autoFocus
                                    className="ld-habit-input"
                                />
                                <div className="ld-form-row">
                                    <div className="ld-color-row">
                                        {COLORS.map(c => (
                                            <div key={c} className={`ld-color-dot ${newHabit.color === c ? 'active' : ''}`}
                                                style={{ background: c }}
                                                onClick={() => setNewHabit({ ...newHabit, color: c })} />
                                        ))}
                                    </div>
                                    <select
                                        className="ld-habit-select"
                                        value={newHabit.trackingType}
                                        onChange={e => setNewHabit({ ...newHabit, trackingType: e.target.value })}
                                    >
                                        <option value="none">Yes/No</option>
                                        <option value="count">Count (Pages/Units)</option>
                                        <option value="hours">Hours (Timer)</option>
                                    </select>
                                </div>
                                <div className="ld-form-actions">
                                    <button onClick={() => { setShowAddHabit(false); setEditingHabit(null); }} className="ld-cancel-btn">Cancel</button>
                                    <button onClick={addHabit} className="ld-save-btn">{editingHabit ? 'Save Changes' : 'Create Habit'}</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 7-day habit table */}
                    {habits.length === 0 ? (
                        <p className="ld-empty">No habits yet. Add one above!</p>
                    ) : (
                        <div className="ld-habit-table-wrap">
                            <table className="ld-habit-table">
                                <thead>
                                    <tr>
                                        <th className="ld-ht-habit-col">Habit</th>
                                        {weekData.map((w, i) => (
                                            <th key={i} className={`ld-ht-day-col${w.date === todayStr ? ' today' : ''}`}>
                                                <span className="ld-ht-day-name">{w.day}</span>
                                                <span className="ld-ht-day-num">{new Date(w.date).getDate()}</span>
                                            </th>
                                        ))}
                                        <th className="ld-ht-streak-col">Streak</th>
                                        <th className="ld-ht-del-col"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habits.map(habit => {
                                        const streak = calcHabitStreak(habit.logs);
                                        return (
                                            <tr key={habit._id} className="ld-ht-row">
                                                <td className="ld-ht-habit-cell">
                                                    <span className="ld-ht-dot" style={{ background: habit.color }} />
                                                    <div className="ld-ht-actions">
                                                        <button className="ld-row-action-btn" onClick={() => openEdit(habit)}><Edit3 size={11} /></button>
                                                        <button className="ld-row-action-btn delete" onClick={() => deleteHabit(habit._id)}><Trash2 size={11} /></button>
                                                    </div>
                                                    <span className="ld-ht-name">{habit.name}</span>
                                                </td>
                                                {weekData.map((w, i) => {
                                                    const done = !!(habit.logs && habit.logs[w.date] && habit.logs[w.date].length > 0);
                                                    const isToday = w.date === todayStr;
                                                    return (
                                                        <td
                                                            key={i}
                                                            className={`ld-ht-cell-td${isToday ? ' today' : ''}`}
                                                            onClick={() => isToday && toggleHabit(habit._id)}
                                                            title={`${habit.name} – ${w.date}`}
                                                        >
                                                            <div
                                                                className={`ld-ht-cell${done ? ' done' : ''}${isToday ? ' clickable' : ''}`}
                                                                style={done ? { background: habit.color + '25', borderColor: habit.color } : {}}
                                                            >
                                                                {done && (habit.trackingType === 'none' ?
                                                                    <CheckCircle2 size={12} style={{ color: habit.color }} /> :
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: habit.color }}>
                                                                        {(habit.logs[w.date] || []).reduce((acc, c) => acc + c.value, 0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="ld-ht-streak-cell">
                                                    {streak > 0
                                                        ? <span style={{ color: habit.color, fontWeight: 700, fontSize: '0.78rem' }}>🔥{streak}d</span>
                                                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                                                    }
                                                </td>
                                                <td className="ld-ht-del-cell">
                                                    <button className="ld-habit-del" onClick={() => deleteHabit(habit._id)}><Trash2 size={12} /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

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
                                const doneCount = habits.filter(h => h.logs && h.logs[dStr] && h.logs[dStr].length > 0).length;
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
                        <p className="ld-chart-footnote">Habits completed per day (last 7 days)</p>
                    </motion.section>

                    {/* Topic Mastery */}
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

            {/* ── Bottom Section: Deep Insights & Timeline ── */}
            <div className="ld-bottom-section">

                {/* Detailed Analysis */}
                <motion.section className="ld-card ld-full-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <div className="ld-section-title" style={{ marginBottom: '2rem' }}>
                        <Activity size={20} color="var(--primary)" />
                        <h2>Consistency Analytics</h2>
                    </div>

                    <div className="ld-insight-grid">
                        <div className="ld-insight-item">
                            <span className="ld-insight-label">Productive Focus</span>
                            <span className="ld-insight-value">{stats?.totalHours > 50 ? 'Elite' : 'Stable'}</span>
                            <span className="ld-insight-desc">Based on your cumulative {stats?.totalHours || 0} study hours.</span>
                        </div>
                        <div className="ld-insight-item">
                            <span className="ld-insight-label">Peak Performance</span>
                            <span className="ld-insight-value">
                                {weekData.sort((a, b) => b.value - a.value)[0]?.day}s
                            </span>
                            <span className="ld-insight-desc">You are most consistent during the weekend.</span>
                        </div>
                        <div className="ld-insight-item">
                            <span className="ld-insight-label">Habit Versatility</span>
                            <span className="ld-insight-value">{(habits.filter(h => h.trackingType !== 'none').length / (habits.length || 1) * 100).toFixed(0)}%</span>
                            <span className="ld-insight-desc">Percentage of complex/numeric habits vs simple toggles.</span>
                        </div>
                        <div className="ld-insight-item">
                            <span className="ld-insight-label">Goal Velocity</span>
                            <span className="ld-insight-value">+{stats?.completedGoals > 0 ? (stats.completedGoals / 7).toFixed(1) : 0}</span>
                            <span className="ld-insight-desc">Tasks completed per day on average this week.</span>
                        </div>
                    </div>
                </motion.section>

                {/* Extended History / Activity Feed */}
                <motion.section className="ld-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                    <div className="ld-section-title" style={{ marginBottom: '1.5rem' }}>
                        <Layers size={18} color="#ec4899" />
                        <h2>Detailed Activity Feed</h2>
                    </div>
                    <div className="ld-timeline">
                        {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((a, i) => (
                            <div key={i} className="ld-activity-item" style={{ marginBottom: '1.25rem' }}>
                                <div className="ld-activity-dot"
                                    style={{
                                        background: a.type === 'task' ? '#6366f1' : a.type === 'journal' ? '#10b981' : '#f59e0b',
                                        width: '12px', height: '12px', marginTop: '6px'
                                    }} />
                                <div className="ld-activity-text">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.95rem' }}>{a.title}</strong>
                                        <ArrowUpRight size={12} color="var(--text-muted)" />
                                    </div>
                                    <span style={{ fontSize: '0.78rem' }}>
                                        {new Date(a.date).toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <p className="ld-empty">No detailed activity records yet.</p>
                        )}
                    </div>
                </motion.section>

                {/* Mini Visualization / Shield */}
                <motion.section className="ld-card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                    <div className="ld-section-title" style={{ marginBottom: '1.5rem' }}>
                        <Shield size={18} color="#10b981" />
                        <h2>System Health</h2>
                    </div>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <PieChart size={120} color="var(--primary-light)" strokeWidth={1} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {todayHabitsTotal > 0 ? Math.round((todayHabitsDone / todayHabitsTotal) * 100) : 100}%
                                </span>
                            </div>
                        </div>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            You've completed <strong>{todayHabitsDone}</strong> of your <strong>{todayHabitsTotal}</strong> habits today.
                            {todayHabitsDone === todayHabitsTotal ? " Perfect score!" : " Keep pushing to finish the list."}
                        </p>
                    </div>
                </motion.section>
            </div>

            {/* ── Where You're Falling Behind ── */}
            {disciplineData && (disciplineData.failingHabits.length > 0 || disciplineData.failingPlannerDays.length > 0 || disciplineData.stuckTasks.length > 0) && (
                <motion.section className="ld-failing-section"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                    <div className="ld-section-title" style={{ marginBottom: '1.5rem' }}>
                        <AlertTriangle size={20} color="#ef4444" />
                        <h2 style={{ color: '#ef4444' }}>Where You're Falling Behind</h2>
                    </div>
                    <div className="ld-failing-grid">
                        {disciplineData.failingHabits.length > 0 && (
                            <div className="ld-failing-col">
                                <h3 className="ld-failing-col-title">
                                    <XCircle size={14} color="#ef4444" /> Habits Missed (3+ days)
                                </h3>
                                {disciplineData.failingHabits.map((h, i) => (
                                    <motion.div key={i} className="ld-failing-item" style={{ borderLeftColor: h.color || '#ef4444' }}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                                        <span className="ld-failing-dot" style={{ background: h.color || '#ef4444' }} />
                                        <span>{h.name}</span>
                                        <span className="ld-failing-days">0 / 3 days</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {disciplineData.failingPlannerDays.length > 0 && (
                            <div className="ld-failing-col">
                                <h3 className="ld-failing-col-title">
                                    <XCircle size={14} color="#f59e0b" /> Weak Planner Days (&lt;50%)
                                </h3>
                                {disciplineData.failingPlannerDays.map((d, i) => (
                                    <motion.div key={i} className="ld-failing-item" style={{ borderLeftColor: '#f59e0b' }}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                                        <span>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        <span className="ld-failing-days" style={{ color: '#f59e0b' }}>{d.completion}% done</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {disciplineData.stuckTasks.length > 0 && (
                            <div className="ld-failing-col">
                                <h3 className="ld-failing-col-title">
                                    <XCircle size={14} color="#8b5cf6" /> Stuck Tasks (7+ days)
                                </h3>
                                {disciplineData.stuckTasks.map((t, i) => (
                                    <motion.div key={i} className="ld-failing-item" style={{ borderLeftColor: '#8b5cf6' }}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                                        <span>{t.title}</span>
                                        <span className="ld-failing-days" style={{ color: '#8b5cf6' }}>stalled</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>
            )}

            {/* ── Achievement Badges ── */}
            <motion.section className="ld-badges-section"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                <div className="ld-section-title" style={{ marginBottom: '1.5rem' }}>
                    <Award size={20} color="#f59e0b" />
                    <h2>Achievement Badges</h2>
                    <span className="ld-badge-count">{earnedBadges.length}/{BADGES.length} earned</span>
                </div>
                <div className="ld-badge-grid">
                    {BADGES.map((badge, i) => {
                        const earned = disciplineData ? badge.check(disciplineData, statsForBadges) : false;
                        return (
                            <motion.div
                                key={badge.id}
                                className={`ld-badge-card ${earned ? 'earned' : 'locked'}`}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.05 * i }}
                                whileHover={{ y: earned ? -4 : 0 }}
                                title={badge.desc}
                            >
                                <span className="ld-badge-icon">{badge.icon}</span>
                                <span className="ld-badge-label">{badge.label}</span>
                                <span className="ld-badge-desc">{badge.desc}</span>
                                {earned && <div className="ld-badge-earned-glow" />}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>

            {/* Manual Entry Modal */}

            <AnimatePresence>
                {manualEntry && (
                    <div className="ld-modal-overlay">
                        <motion.div className="ld-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <h3>Correct Progress</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                Set total for <strong>{manualEntry.name}</strong> on {manualEntry.date}
                            </p>
                            <div className="ld-habit-input-group">
                                <input
                                    type="number"
                                    step="any"
                                    value={manualEntry.value}
                                    onChange={e => setManualEntry({ ...manualEntry, value: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleSetProgress()}
                                    autoFocus
                                    className="ld-habit-input-field"
                                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', marginBottom: '1rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="ld-save-btn" style={{ flex: 1 }} onClick={handleSetProgress}>Save</button>
                                    <button className="ld-cancel-btn" style={{ flex: 1 }} onClick={() => setManualEntry(null)}>Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LearningDashboard;
