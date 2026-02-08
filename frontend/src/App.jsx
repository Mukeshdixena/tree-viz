import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Tree from './components/Tree';
import Sidebar from './components/Sidebar';
import JSONEditor from './components/JSONEditor';
import Login from './components/Login';
import Modal from './components/Modal';
import { Settings, X, Loader2, LogOut } from 'lucide-react';
import { toggleNodeChecked, editNodeName, addNodeChild, deleteNodeInTree } from './utils';
import './App.css';

const API_BASE_URL = 'http://localhost:3001';

function MainApp() {
  const [data, setData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTreeIndex, setActiveTreeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert', 'confirm', 'prompt'
    onConfirm: () => { },
    defaultValue: '',
    hasInput: false,
    showSampleBtn: false
  });

  const showModal = (config) => {
    setModal({
      isOpen: true,
      title: config.title || 'Action Required',
      message: config.message || '',
      type: config.type || 'alert',
      onConfirm: config.onConfirm || (() => { }),
      defaultValue: config.defaultValue || '',
      hasInput: config.hasInput || false,
      showSampleBtn: config.showSampleBtn || false,
      placeholder: config.placeholder || ''
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Fetch initial data from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch(`${API_BASE_URL}/trees`)
      .then(res => res.json())
      .then(result => {
        if (result && result.length > 0) {
          setData(result);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch trees:', err);
        setLoading(false);
      });
  }, [navigate]);

  const syncWithBackend = async (newData) => {
    try {
      await fetch(`${API_BASE_URL}/trees/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (err) {
      console.error('Failed to sync with backend:', err);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleEditor = () => {
    setIsEditorOpen(!isEditorOpen);
  };

  const handleDataUpdate = (newTreeData) => {
    const newData = [...data];
    newData[activeTreeIndex] = newTreeData;
    setData(newData);
    syncWithBackend(newData);
  };

  const handleNodeToggle = (nodeName) => {
    const newData = [...data];
    const updatedTree = toggleNodeChecked(newData[activeTreeIndex], nodeName);
    newData[activeTreeIndex] = updatedTree;
    setData(newData);
    syncWithBackend(newData);
  };

  const handleNodeEdit = (oldName) => {
    showModal({
      title: 'Rename Node',
      message: `Enter a new name for "${oldName}":`,
      type: 'prompt',
      hasInput: true,
      defaultValue: oldName,
      onConfirm: (newName) => {
        if (newName && newName !== oldName) {
          const newData = [...data];
          const updatedTree = editNodeName(newData[activeTreeIndex], oldName, newName);
          newData[activeTreeIndex] = updatedTree;
          setData(newData);
          syncWithBackend(newData);
        }
      }
    });
  };

  const handleNodeAdd = (parentName) => {
    showModal({
      title: 'Add Child Node',
      message: `Enter name for the new step under "${parentName}":`,
      type: 'prompt',
      hasInput: true,
      placeholder: 'e.g. Advanced Routing',
      onConfirm: (childName) => {
        if (childName) {
          const newData = [...data];
          const updatedTree = addNodeChild(newData[activeTreeIndex], parentName, childName);
          newData[activeTreeIndex] = updatedTree;
          setData(newData);
          syncWithBackend(newData);
        }
      }
    });
  };

  const handleNodeDelete = (nodeName) => {
    showModal({
      title: 'Delete Node',
      message: `Are you sure you want to delete "${nodeName}" and all its sub-nodes?`,
      type: 'confirm',
      onConfirm: (confirmed) => {
        if (confirmed) {
          const newData = [...data];
          const updatedTree = deleteNodeInTree(newData[activeTreeIndex], nodeName);

          if (updatedTree === null) {
            // Removed the entire tree
            newData.splice(activeTreeIndex, 1);
            if (newData.length === 0) {
              setActiveTreeIndex(0);
            } else if (activeTreeIndex >= newData.length) {
              setActiveTreeIndex(newData.length - 1);
            }
          } else {
            newData[activeTreeIndex] = updatedTree;
          }

          setData(newData);
          syncWithBackend(newData);
        }
      }
    });
  };

  const handleTreeSelect = (index) => {
    setActiveTreeIndex(index);
  };

  const handleCreateTree = (name, isSample = false) => {
    const newTree = isSample ? {
      name: name || 'Sample Roadmap',
      toggled: true,
      checked: false,
      children: [
        { name: 'Foundations', checked: false, toggled: true, children: [{ name: 'Step 1: Setup', checked: true }, { name: 'Step 2: Config', checked: false }] },
        { name: 'Core Concepts', checked: false, toggled: false, children: [{ name: 'Advanced Logic', checked: false }] }
      ]
    } : {
      name: name || 'New Roadmap',
      toggled: true,
      checked: false,
      children: []
    };

    const newData = [...data, newTree];
    setData(newData);
    setActiveTreeIndex(newData.length - 1);
    syncWithBackend(newData);
  };

  const handleNewTreeClick = () => {
    showModal({
      title: 'New Roadmap',
      message: 'Give your new tree a name or start with a sample:',
      type: 'prompt',
      hasInput: true,
      defaultValue: 'My New Roadmap',
      showSampleBtn: true,
      onSample: () => handleCreateTree('Sample Roadmap', true),
      onConfirm: (name) => {
        if (name) handleCreateTree(name);
      }
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} />
        <span>Loading Roadmaps...</span>
      </div>
    );
  }

  return (
    <div className={`App ${isSidebarOpen ? 'sidebar-open' : ''} ${isEditorOpen ? 'editor-open' : ''}`}>
      <Sidebar
        data={data}
        isOpen={isSidebarOpen}
        activeTreeIndex={activeTreeIndex}
        toggleSidebar={toggleSidebar}
        onToggle={handleNodeToggle}
        onTreeSelect={handleTreeSelect}
        onAddTree={handleNewTreeClick}
        onNodeDelete={handleNodeDelete}
      />

      <main className="main-content">
        <div className="top-actions">
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
          <button className="editor-toggle-btn" onClick={toggleEditor} title="Toggle JSON Editor">
            {isEditorOpen ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>

        <div className="single-tree-container">
          {data[activeTreeIndex] ? (
            <Tree
              key={activeTreeIndex}
              data={data[activeTreeIndex]}
              onToggle={handleNodeToggle}
              onEdit={handleNodeEdit}
              onAdd={handleNodeAdd}
              onDelete={handleNodeDelete}
            />
          ) : (
            <div className="no-data">
              <h3>No Trees Found</h3>
              <p>Add a tree in the editor or use the "New Tree" button to get started.</p>
            </div>
          )}
        </div>
      </main>

      <aside className={`right-panel ${isEditorOpen ? 'open' : 'closed'}`}>
        {data[activeTreeIndex] && (
          <JSONEditor
            key={activeTreeIndex}
            data={data[activeTreeIndex]}
            onUpdate={handleDataUpdate}
          />
        )}
      </aside>

      <Modal
        {...modal}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onSample={() => {
          handleCreateTree('Sample Roadmap', true);
          setModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

