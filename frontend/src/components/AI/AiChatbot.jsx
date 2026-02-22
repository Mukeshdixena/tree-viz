import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api';
import './AiChatbot.css';

const QUICK_ACTIONS = [
    { label: '📊 Analyze my week', question: 'Give me a detailed honest analysis of my discipline this week. What is working and what is failing?' },
    { label: '🎯 What to focus on today?', question: 'Based on my data, what is the single most important thing I should focus on today to improve my discipline?' },
    { label: '🔥 Roast my discipline', question: 'Be brutally honest and roast my discipline based on my actual data. Don\'t hold back.' },
    { label: '🗺️ Give me a plan', question: 'Create a concrete 7-day action plan to meaningfully improve my discipline score based on my weakest areas.' },
    { label: '💡 Why am I struggling?', question: 'Based on my behavioral patterns and failing areas, explain the likely root cause of my lack of discipline and how to overcome it scientifically.' },
];

function getScoreColor(score) {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}

function getScoreLabel(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Developing';
    if (score >= 40) return 'Struggling';
    if (score >= 20) return 'Critical';
    return 'No Data Yet';
}

const AiChatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [disciplineData, setDisciplineData] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // On mount: fetch discipline data and generate context-aware opening message
    useEffect(() => {
        const initialize = async () => {
            try {
                const data = await api.get('/stats/discipline');
                if (data) {
                    setDisciplineData(data);
                    // Generate a personalized opening from AI
                    const response = await api.post('/ai/discipline-insights', { context: data });
                    const openingContent = response?.content ||
                        `Your Discipline Score is **${data.disciplineScore}/100**. Let's work on improving it.`;
                    setMessages([{ role: 'assistant', content: openingContent, isOpening: true }]);
                } else {
                    setMessages([{ role: 'assistant', content: 'Hello! I am your personal Discipline Coach. Tell me about your goals and I will help you stay accountable.', isOpening: true }]);
                }
            } catch (err) {
                console.error('Failed to initialize discipline coach:', err);
                setMessages([{ role: 'assistant', content: 'Hello! I am your personal Discipline Coach. I encountered an issue loading your data. Ask me anything!', isOpening: true }]);
            } finally {
                setIsInitializing(false);
            }
        };
        initialize();
    }, []);

    const sendMessage = async (content) => {
        if (!content.trim() || isLoading) return;

        const userMessage = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let response;
            if (disciplineData) {
                // Use the discipline-aware endpoint for context-rich replies
                response = await api.post('/ai/discipline-insights', {
                    context: disciplineData,
                    question: content
                });
                if (response?.content) {
                    setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
                } else {
                    throw new Error('No content returned');
                }
            } else {
                // Fallback to generic chat
                const history = [...messages, userMessage];
                response = await api.aiChat(history);
                if (response?.content) {
                    setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error communicating with AI. Please ensure the backend is running.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => sendMessage(input);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (question) => {
        sendMessage(question);
    };

    const scoreColor = disciplineData ? getScoreColor(disciplineData.disciplineScore) : '#6366f1';
    const scoreLabel = disciplineData ? getScoreLabel(disciplineData.disciplineScore) : '';

    return (
        <div className="coach-container">
            {/* Left Panel: Stats Sidebar */}
            <aside className="coach-sidebar">
                <div className="coach-sidebar-header">
                    <div className="coach-avatar">
                        <motion.div
                            className="coach-avatar-ring"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        />
                        <span className="coach-avatar-icon">🧠</span>
                    </div>
                    <div>
                        <h2 className="coach-title">Discipline Coach</h2>
                        <div className="coach-status">
                            <div className="coach-status-dot" />
                            <span>AI-powered analysis</span>
                        </div>
                    </div>
                </div>

                {disciplineData && (
                    <motion.div
                        className="coach-score-panel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {/* Score Ring */}
                        <div className="coach-score-ring-wrap">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                                <motion.circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={scoreColor}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={314}
                                    strokeDashoffset={314}
                                    animate={{ strokeDashoffset: 314 - (disciplineData.disciplineScore / 100) * 314 }}
                                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                                    transform="rotate(-90 60 60)"
                                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }}
                                />
                                <text x="60" y="55" textAnchor="middle" fontSize="26" fontWeight="800" fill="white">
                                    {disciplineData.disciplineScore}
                                </text>
                                <text x="60" y="72" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)">
                                    /100
                                </text>
                            </svg>
                            <div className="coach-score-label" style={{ color: scoreColor }}>{scoreLabel}</div>
                        </div>

                        {/* Sub-scores */}
                        <div className="coach-sub-scores">
                            {[
                                { label: 'Habit Consistency', value: disciplineData.subScores.habitConsistency, color: '#f59e0b' },
                                { label: 'Planner Adherence', value: disciplineData.subScores.plannerAdherence, color: '#3b82f6' },
                                { label: 'Streak Health', value: disciplineData.subScores.streakScore, color: '#10b981' },
                                { label: 'Task Velocity', value: disciplineData.subScores.velocityScore, color: '#8b5cf6' },
                            ].map((item, i) => (
                                <div key={i} className="coach-sub-score-item">
                                    <div className="coach-sub-score-header">
                                        <span>{item.label}</span>
                                        <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                                    </div>
                                    <div className="coach-sub-score-bar">
                                        <motion.div
                                            className="coach-sub-score-fill"
                                            style={{ background: item.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            transition={{ duration: 1, ease: 'easeOut', delay: 0.6 + i * 0.1 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Streak */}
                        <div className="coach-streak-badge">
                            🔥 {disciplineData.streak}-day streak
                        </div>

                        {/* Failing Areas Summary */}
                        {disciplineData.failingHabits.length > 0 && (
                            <div className="coach-failing-mini">
                                <span className="coach-failing-label">⚠️ Habits missed (3 days)</span>
                                {disciplineData.failingHabits.slice(0, 3).map((h, i) => (
                                    <div key={i} className="coach-failing-item" style={{ borderLeftColor: h.color }}>
                                        {h.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Quick actions */}
                <div className="coach-quick-actions">
                    <p className="coach-quick-label">Quick Actions</p>
                    {QUICK_ACTIONS.map((action, i) => (
                        <motion.button
                            key={i}
                            className="coach-quick-btn"
                            onClick={() => handleQuickAction(action.question)}
                            disabled={isLoading || isInitializing}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.08 }}
                        >
                            {action.label}
                        </motion.button>
                    ))}
                </div>
            </aside>

            {/* Right Panel: Chat */}
            <div className="coach-chat-panel">
                <div className="coach-messages">
                    <AnimatePresence>
                        {isInitializing ? (
                            <motion.div
                                className="coach-initializing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                    style={{ fontSize: '2rem' }}
                                >
                                    🧠
                                </motion.div>
                                <p>Analyzing your discipline data...</p>
                            </motion.div>
                        ) : (
                            messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    className={`coach-message ${msg.role} ${msg.isOpening ? 'opening' : ''}`}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="coach-msg-avatar">🧠</div>
                                    )}
                                    <div className="coach-msg-bubble">
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i} style={{ margin: line === '' ? '0.5rem 0' : '0 0 0.25rem' }}>{line}</p>
                                        ))}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            className="coach-message assistant"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="coach-msg-avatar">🧠</div>
                            <div className="coach-msg-bubble coach-typing">
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="coach-input-area">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask your coach anything... (Enter to send)"
                        disabled={isLoading || isInitializing}
                        rows={1}
                        className="coach-input"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || isInitializing || !input.trim()}
                        className="coach-send-btn"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiChatbot;
