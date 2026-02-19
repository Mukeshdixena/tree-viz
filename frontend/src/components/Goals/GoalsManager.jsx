import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Plus, Trash2, TrendingUp, Calendar, CheckCircle2,
    ChevronDown, ChevronUp, Zap, Edit3, X, Flag
} from 'lucide-react';
import { api } from '../../api';
import './GoalsManager.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];
const UNITS = ['questions', 'books', 'hours', 'pages', 'km', 'sessions', 'tasks', 'videos', 'days', 'units'];

const GoalDonut = ({ current, total, color, size = 100 }) => {
    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    const r = (size / 2) - 8;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;
    return (
        <div className="gm-donut-wrap">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth="7" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <text x={size / 2} y={size / 2} dy=".35em" textAnchor="middle"
                    fontSize={size > 90 ? "18" : "14"} fontWeight="800" fill="var(--text-primary)">
                    {pct}%
                </text>
            </svg>
        </div>
    );
};

const GoalCard = ({ goal, onLog, onDelete, onEdit }) => {
    const [logAmount, setLogAmount] = useState('');
    const [showLog, setShowLog] = useState(false);
    const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
    const remaining = Math.max(0, (goal.targetValue || 0) - (goal.currentValue || 0));
    const isDone = pct >= 100;

    const handleLog = () => {
        const amount = parseFloat(logAmount);
        if (!amount || isNaN(amount)) return;
        onLog(goal._id, amount);
        setLogAmount('');
        setShowLog(false);
    };

    // Build last 7 days bar chart from logs
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dStr = d.toISOString().split('T')[0];
        const val = Number(goal.logs?.[dStr] || 0);
        return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), val };
    });
    const maxVal = Math.max(...last7.map(d => d.val), 1);

    return (
        <motion.div className={`gm-card ${isDone ? 'done' : ''}`}
            style={{ '--goal-color': goal.color }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            layout>
            <div className="gm-card-header">
                <div className="gm-card-top">
                    <div className="gm-color-bar" style={{ background: goal.color }} />
                    <div className="gm-card-meta">
                        <h3 className="gm-card-title">{goal.title}</h3>
                        {goal.description && <p className="gm-card-desc">{goal.description}</p>}
                        <div className="gm-card-tags">
                            {goal.dueDate && (
                                <span className="gm-tag">
                                    <Calendar size={11} /> {goal.dueDate}
                                </span>
                            )}
                            <span className="gm-tag">
                                <Flag size={11} /> {goal.unit}
                            </span>
                            {isDone && <span className="gm-tag done-tag"><CheckCircle2 size={11} /> Completed!</span>}
                        </div>
                    </div>
                    <div className="gm-donut-area">
                        <GoalDonut current={goal.currentValue || 0} total={goal.targetValue || 0} color={goal.color} />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="gm-progress-section">
                    <div className="gm-progress-labels">
                        <span className="gm-progress-current">{goal.currentValue || 0} {goal.unit}</span>
                        <span className="gm-progress-total">Goal: {goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="gm-progress-track">
                        <motion.div
                            className="gm-progress-fill"
                            style={{ background: goal.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                    {!isDone && (
                        <p className="gm-remaining">{remaining} {goal.unit} remaining</p>
                    )}
                </div>

                {/* Milestones */}
                {goal.milestones && goal.milestones.length > 0 && (
                    <div className="gm-milestones">
                        {goal.milestones.map((m, i) => (
                            <div key={i} className={`gm-milestone ${m.achieved ? 'achieved' : ''}`}
                                title={`${m.label}: ${m.targetValue} ${goal.unit}`}>
                                <div className="gm-milestone-dot" style={{ background: m.achieved ? goal.color : undefined }} />
                                <span>{m.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mini weekly bar chart */}
                <div className="gm-weekly-bars">
                    {last7.map((d, i) => (
                        <div key={i} className="gm-bar-col">
                            <div className="gm-bar-track">
                                <motion.div
                                    className="gm-bar-fill"
                                    style={{ background: goal.color }}
                                    initial={{ height: 0 }}
                                    animate={{ height: d.val > 0 ? `${(d.val / maxVal) * 100}%` : '0%' }}
                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                />
                            </div>
                            <span className="gm-bar-label">{d.label[0]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="gm-card-actions">
                <button className="gm-log-btn" onClick={() => setShowLog(!showLog)}
                    style={{ color: goal.color, borderColor: goal.color + '40' }}>
                    <TrendingUp size={14} /> Log Progress
                </button>
                <button className="gm-edit-btn" onClick={() => onEdit(goal)}><Edit3 size={14} /></button>
                <button className="gm-del-btn" onClick={() => onDelete(goal._id)}><Trash2 size={14} /></button>
            </div>

            <AnimatePresence>
                {showLog && (
                    <motion.div className="gm-log-panel"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <input
                            type="number"
                            placeholder={`Amount in ${goal.unit}...`}
                            value={logAmount}
                            onChange={e => setLogAmount(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLog()}
                            className="gm-log-input"
                            autoFocus
                        />
                        <button className="gm-log-confirm" onClick={handleLog}
                            style={{ background: goal.color }}>+ Add</button>
                        <button className="gm-log-cancel" onClick={() => setShowLog(false)}>Cancel</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ---- Create / Edit Goal Form ----
const GoalForm = ({ initial, onSave, onCancel }) => {
    const [form, setForm] = useState(initial || {
        title: '', description: '', unit: 'units', targetValue: 100, color: '#3b82f6', dueDate: '',
        milestones: []
    });

    const addMilestone = () => {
        setForm(f => ({
            ...f,
            milestones: [...(f.milestones || []), { label: '', targetValue: Math.round(f.targetValue / 2) }]
        }));
    };

    const updateMilestone = (i, field, val) => {
        const ms = [...form.milestones];
        ms[i][field] = val;
        setForm(f => ({ ...f, milestones: ms }));
    };

    const removeMilestone = (i) => {
        setForm(f => ({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) }));
    };

    return (
        <motion.div className="gm-form-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}>
            <motion.div className="gm-form"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}>
                <div className="gm-form-header">
                    <h2>{initial?._id ? 'Edit Goal' : 'New Long-Term Goal'}</h2>
                    <button className="gm-close-btn" onClick={onCancel}><X size={18} /></button>
                </div>

                <div className="gm-form-body">
                    <div className="gm-field">
                        <label>Goal Title *</label>
                        <input className="gm-input" placeholder="e.g. Read 52 books, Solve 500 questions, Run 365 km"
                            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                    </div>

                    <div className="gm-field">
                        <label>Description (optional)</label>
                        <input className="gm-input" placeholder="Why does this goal matter?"
                            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>

                    <div className="gm-field-row">
                        <div className="gm-field">
                            <label>Target Value *</label>
                            <input className="gm-input" type="number" min="1"
                                value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: parseFloat(e.target.value) || 0 }))} />
                        </div>
                        <div className="gm-field">
                            <label>Unit</label>
                            <select className="gm-input gm-select"
                                value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="gm-field">
                            <label>Due Date</label>
                            <input className="gm-input" type="date"
                                value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                        </div>
                    </div>

                    <div className="gm-field">
                        <label>Color</label>
                        <div className="gm-color-row">
                            {COLORS.map(c => (
                                <div key={c} className={`gm-color-dot ${form.color === c ? 'active' : ''}`}
                                    style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                            ))}
                        </div>
                    </div>

                    <div className="gm-field">
                        <div className="gm-field-header">
                            <label>Milestones (optional)</label>
                            <button onClick={addMilestone} className="gm-add-milestone-btn"><Plus size={12} /> Add</button>
                        </div>
                        {(form.milestones || []).map((m, i) => (
                            <div key={i} className="gm-milestone-row">
                                <input className="gm-input gm-milestone-label" placeholder="Label (e.g. Halfway)"
                                    value={m.label} onChange={e => updateMilestone(i, 'label', e.target.value)} />
                                <input className="gm-input gm-milestone-val" type="number" placeholder="At value"
                                    value={m.targetValue} onChange={e => updateMilestone(i, 'targetValue', parseFloat(e.target.value))} />
                                <span className="gm-milestone-unit">{form.unit}</span>
                                <button onClick={() => removeMilestone(i)} className="gm-del-milestone"><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="gm-form-footer">
                    <button className="gm-cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="gm-save-btn" onClick={() => onSave(form)}
                        disabled={!form.title.trim() || !form.targetValue}
                        style={{ background: form.color }}>
                        {initial?._id ? 'Save Changes' : 'Create Goal'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ---- Main Component ----
const GoalsManager = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    const fetch = async () => {
        try {
            const data = await api.get('/goals');
            if (data) setGoals(data);
        } catch (err) {
            console.error('Failed to fetch goals', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const handleSave = async (form) => {
        try {
            if (form._id) {
                await api.put(`/goals/${form._id}`, form);
            } else {
                await api.post('/goals', form);
            }
            setShowForm(false);
            setEditingGoal(null);
            fetch();
        } catch (err) {
            console.error('Error saving goal', err);
        }
    };

    const handleLog = async (goalId, amount) => {
        try {
            await api.post(`/goals/${goalId}/log`, { amount });
            fetch();
        } catch (err) {
            console.error('Error logging goal progress', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this goal?')) return;
        try {
            await api.delete(`/goals/${id}`);
            fetch();
        } catch (err) {
            console.error('Error deleting goal', err);
        }
    };

    const totalProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => {
            const pct = g.targetValue > 0 ? Math.min(100, (g.currentValue || 0) / g.targetValue * 100) : 0;
            return sum + pct;
        }, 0) / goals.length)
        : 0;

    const completedGoals = goals.filter(g => (g.currentValue || 0) >= (g.targetValue || 1)).length;

    if (loading) {
        return (
            <div className="gm-loading">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Target size={32} color="var(--primary)" />
                </motion.div>
                <span>Loading your goals...</span>
            </div>
        );
    }

    return (
        <div className="gm-container">
            {/* Header */}
            <header className="gm-header">
                <div>
                    <h1>Long-Term Goals</h1>
                    <p>Big ambitions. Measured progress. One step at a time.</p>
                </div>
                <button className="gm-new-btn" onClick={() => { setEditingGoal(null); setShowForm(true); }}>
                    <Plus size={18} /> New Goal
                </button>
            </header>

            {/* Summary row */}
            {goals.length > 0 && (
                <div className="gm-summary-row">
                    <div className="gm-summary-card">
                        <span className="gm-summary-val">{goals.length}</span>
                        <span className="gm-summary-label">Total Goals</span>
                    </div>
                    <div className="gm-summary-card">
                        <span className="gm-summary-val">{completedGoals}</span>
                        <span className="gm-summary-label">Achieved</span>
                    </div>
                    <div className="gm-summary-card">
                        <span className="gm-summary-val">{totalProgress}%</span>
                        <span className="gm-summary-label">Avg Progress</span>
                    </div>
                    <div className="gm-summary-card">
                        <span className="gm-summary-val">{goals.length - completedGoals}</span>
                        <span className="gm-summary-label">In Progress</span>
                    </div>
                </div>
            )}

            {/* Goals grid */}
            {goals.length === 0 ? (
                <div className="gm-empty">
                    <Target size={48} color="var(--text-muted)" />
                    <h3>No goals yet</h3>
                    <p>Create your first long-term goal and start tracking your journey toward it.</p>
                    <button className="gm-new-btn" onClick={() => setShowForm(true)}>
                        <Plus size={16} /> Create Goal
                    </button>
                </div>
            ) : (
                <div className="gm-grid">
                    {goals.map(goal => (
                        <GoalCard
                            key={goal._id}
                            goal={goal}
                            onLog={handleLog}
                            onDelete={handleDelete}
                            onEdit={(g) => { setEditingGoal(g); setShowForm(true); }}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <GoalForm
                        initial={editingGoal}
                        onSave={handleSave}
                        onCancel={() => { setShowForm(false); setEditingGoal(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default GoalsManager;
