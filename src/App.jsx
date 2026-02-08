import React from 'react';
import Tree from './components/Tree';
import { treeData } from './data';
import './App.css';

function App() {
  return (
    <div className="App">
      <Tree data={treeData} />
    </div>
  );
}

export default App;
