import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ListTree, Check } from 'lucide-react';
import { calculateProgress } from '../utils';
import './Sidebar.css';

const SidebarNode = ({ node, depth = 0, onToggle, isRoot = false, isActive = false, onSelect }) => {
    const [isOpen, setIsOpen] = useState(node.toggled || false);
    const hasChildren = node.children && node.children.length > 0;
    const progress = calculateProgress(node);

    const toggleOpen = (e) => {
        e.stopPropagation();
        if (isRoot) {
            onSelect();
            setIsOpen(!isOpen);
        } else if (hasChildren) {
            setIsOpen(!isOpen);
        } else {
            onToggle(node.name);
        }
    };

    return (
        <div className={`sidebar-node ${isRoot ? 'root-node' : ''} ${isActive ? 'selected' : ''}`}>
            <div
                className={`sidebar-node-content ${isOpen ? 'active' : ''} ${progress.percentage === 100 ? 'completed' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={toggleOpen}
            >
                <div className="sidebar-node-prefix">
                    {hasChildren ? (
                        <div className="toggle-icon">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                    ) : (
                        <div className={`checkbox-sm ${node.checked ? 'checked' : ''}`}>
                            {node.checked && <Check size={10} strokeWidth={4} />}
                        </div>
                    )}
                </div>
                <span className="sidebar-node-label">{node.name}</span>
                {hasChildren && progress.percentage > 0 && (
                    <span className="sidebar-progress-badge">{progress.percentage}%</span>
                )}
            </div>
            {isOpen && hasChildren && (
                <div className="sidebar-children">
                    {node.children.map((child, index) => (
                        <SidebarNode key={index} node={child} depth={depth + 1} onToggle={onToggle} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar({ data, isOpen, activeTreeIndex, toggleSidebar, onToggle, onTreeSelect }) {
    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="sidebar-title">
                    <ListTree size={20} className="sidebar-title-icon" />
                    <span>Tree Explorer</span>
                </div>
            </div>
            <div className="sidebar-content">
                <div className="sidebar-tree-list">
                    {data.map((tree, index) => (
                        <div key={index} className="sidebar-tree-section">
                            <SidebarNode
                                node={tree}
                                onToggle={onToggle}
                                isRoot={true}
                                isActive={index === activeTreeIndex}
                                onSelect={() => onTreeSelect(index)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                {isOpen ? <ChevronRight size={18} className="rotate-180" /> : <ChevronRight size={18} />}
            </button>
        </aside>
    );
}


