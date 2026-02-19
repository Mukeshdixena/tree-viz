import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import GlobalSidebar from './components/Navigation/GlobalSidebar';
import RoadmapTracker from './components/Goals/RoadmapTracker';
import TaskBoard from './components/Tasks/TaskBoard';
import JournalEntry from './components/Journal/JournalEntry';
import NotesManager from './components/Notes/NotesManager';
import LearningDashboard from './components/Stats/LearningDashboard';
import DayPlanner from './components/Planner/DayPlanner';
import HabitTracker from './components/Habits/HabitTracker';
import './App.css';

// Wrapper to handle layout with sidebar
const MainLayout = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('roadmap');

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname.substring(1);
    if (path) {
      setActiveTab(path);
    }
  }, [location]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/${tabId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={`app-container ${isDark ? 'dark' : ''}`}>
      <GlobalSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Navigate to="/roadmap" replace />} />
          <Route path="/roadmap" element={<RoadmapTracker />} />
          <Route path="/tasks" element={<TaskBoard />} />
          <Route path="/journal" element={<JournalEntry />} />
          <Route path="/planner" element={<DayPlanner />} />
          <Route path="/habits" element={<HabitTracker />} />
          <Route path="/notes" element={<NotesManager />} />
          <Route path="/stats" element={<LearningDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout isDark={isDark} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
