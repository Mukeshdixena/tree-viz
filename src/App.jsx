import React, { useState } from 'react';
import Tree from './components/Tree';
import Sidebar from './components/Sidebar';
import JSONEditor from './components/JSONEditor';
import { treeData as initialData } from './data';
import { Settings, X } from 'lucide-react';
import { toggleNodeChecked } from './utils';
import './App.css';

function App() {
  const [data, setData] = useState(initialData);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTreeIndex, setActiveTreeIndex] = useState(0);

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
  };

  const handleNodeToggle = (nodeName) => {
    const updatedData = toggleNodeChecked(data, nodeName);
    setData(updatedData);
  };

  const handleTreeSelect = (index) => {
    setActiveTreeIndex(index);
  };

  return (
    <div className={`App ${isSidebarOpen ? 'sidebar-open' : ''} ${isEditorOpen ? 'editor-open' : ''}`}>
      <Sidebar
        data={data}
        isOpen={isSidebarOpen}
        activeTreeIndex={activeTreeIndex}
        toggleSidebar={toggleSidebar}
        onToggle={handleNodeToggle}
        onTreeSelect={handleTreeSelect}
      />

      <main className="main-content">
        <button className="editor-toggle-btn" onClick={toggleEditor} title="Toggle JSON Editor">
          {isEditorOpen ? <X size={20} /> : <Settings size={20} />}
        </button>
        <div className="single-tree-container">
          {data[activeTreeIndex] && (
            <Tree
              key={activeTreeIndex}
              data={data[activeTreeIndex]}
              onToggle={handleNodeToggle}
            />
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
    </div>
  );
}

export default App;
