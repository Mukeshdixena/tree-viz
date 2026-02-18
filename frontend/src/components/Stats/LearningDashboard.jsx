import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, Clock, Trophy, Target, Zap } from 'lucide-react';
import { api } from '../../api';
import { subscribeToUpdates, unsubscribeFromUpdates } from '../../socket';
import './LearningDashboard.css';

const ProgressDonut = ({ percentage, color, label }) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="donut-chart">
            <svg width="120" height="120" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="var(--border-color)"
                    strokeWidth="8"
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                />
                <text
                    x="50"
                    y="50"
                    dy=".3em"
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="bold"
                    fill="var(--text-primary)"
                >
                    {percentage}%
                </text>
            </svg>
            <span className="donut-label">{label}</span>
        </div>
    );
};

const StatCard = ({ icon: Icon, title, value, color, delay }) => (
    <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
    >
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={24} />
        </div>
        <div className="stat-info">
            <h3>{value}</h3>
            <p>{title}</p>
        </div>
    </motion.div>
);

const LearningDashboard = () => {
    const [stats, setStats] = useState({
        totalHours: 0,
        streak: 0,
        completedGoals: 0,
        activeGoals: 0,
        topicMastery: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        const data = await api.get('/stats/dashboard');
        if (data) {
            setStats(data);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Subscribe to real-time updates
        subscribeToUpdates((payload) => {
            console.log('Real-time update received:', payload);
            fetchStats(); // Refresh dashboard on any data update
        });

        return () => {
            unsubscribeFromUpdates();
        };
    }, []);

    if (loading) {
        return <div className="loading-dots">Loading stats...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>My Learning Journey</h1>
                <p>Keep pushing your limits!</p>
            </header>

            <div className="stats-grid">
                <StatCard icon={Clock} title="Hours Invested" value={`${stats.totalHours}h`} color="#6366f1" delay={0.1} />
                <StatCard icon={Zap} title="Day Streak" value={stats.streak} color="#f59e0b" delay={0.2} />
                <StatCard icon={Trophy} title="Goals Crushed" value={stats.completedGoals} color="#10b981" delay={0.3} />
                <StatCard icon={Target} title="Active Targets" value={stats.activeGoals} color="#ec4899" delay={0.4} />
            </div>

            <div className="charts-section">
                <motion.div
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h3>Topic Mastery</h3>
                    <div className="donuts-container">
                        {stats.topicMastery.length > 0 ? stats.topicMastery.map((topic, index) => (
                            <ProgressDonut
                                key={index}
                                percentage={topic.percentage}
                                color={['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e'][index % 4]}
                                label={topic.label}
                            />
                        )) : (
                            <p className="empty-message">No roadmaps found to track mastery.</p>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    className="chart-card activity-feed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3>Recent Activity</h3>
                    <ul className="activity-list">
                        {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity, index) => (
                            <li key={index}>
                                <div className="activity-dot" style={{ backgroundColor: activity.type === 'task' ? '#6366f1' : '#10b981' }}></div>
                                <div>
                                    <strong>{activity.title}</strong>
                                    <span className="time">{new Date(activity.date).toLocaleString()}</span>
                                </div>
                            </li>
                        )) : (
                            <p className="empty-message">No recent activity recorded.</p>
                        )}
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default LearningDashboard;
