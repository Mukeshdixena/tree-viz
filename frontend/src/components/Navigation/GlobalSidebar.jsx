import React from 'react';
import { Target, CheckSquare, BookOpen, StickyNote, BarChart2, Settings, LogOut, Moon, Sun, Clock, Heart } from 'lucide-react';
import './GlobalSidebar.css';

const GlobalSidebar = ({ activeTab, onTabChange, onLogout, isDark, toggleTheme }) => {
    const navItems = [
        { id: 'goals', label: 'Goals', icon: Target },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'planner', label: 'Planner', icon: Clock },
        { id: 'habits', label: 'Habits', icon: Heart },
        { id: 'journal', label: 'Journal', icon: BookOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
        { id: 'stats', label: 'Progress', icon: BarChart2 },
    ];

    return (
        <div className="global-sidebar">
            <div className="app-logo">
                <div className="logo-icon">🚀</div>
            </div>

            <nav className="nav-menu">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange(item.id)}
                        title={item.label}
                    >
                        <item.icon size={24} strokeWidth={1.5} />
                        <span className="tooltip">{item.label}</span>
                        {activeTab === item.id && <div className="active-indicator" />}
                    </button>
                ))}
            </nav>

            <div className="bottom-actions">
                <button className="nav-item" onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}>
                    {isDark ? <Sun size={24} strokeWidth={1.5} /> : <Moon size={24} strokeWidth={1.5} />}
                </button>
                <button className="nav-item logout" onClick={onLogout} title="Logout">
                    <LogOut size={24} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};

export default GlobalSidebar;
