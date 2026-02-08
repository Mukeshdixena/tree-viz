import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Plus, Pencil, Trash2, Clock, Circle, FileText } from 'lucide-react';
import { calculateProgress } from '../utils';
import './Tree.css';

const TreeNode = ({ node, onToggle, onEdit, onAdd, onDelete, onStatusChange, onSelectNode }) => {
    const [expanded, setExpanded] = useState(node.toggled || false);
    const hasChildren = node.children && node.children.length > 0;
    const progress = calculateProgress(node);

    const handleNodeClick = (e) => {
        if (hasChildren) {
            setExpanded(!expanded);
        } else {
            handleStatusCycle(e);
        }
    };

    const handleStatusCycle = (e) => {
        e.stopPropagation();
        if (hasChildren) return;

        const currentStatus = node.status || (node.checked ? 'done' : 'todo');
        let nextStatus = 'todo';
        if (currentStatus === 'todo') nextStatus = 'in-progress';
        else if (currentStatus === 'in-progress') nextStatus = 'done';
        else nextStatus = 'todo';

        onStatusChange(node.name, nextStatus);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(node.name);
    };

    const handleAdd = (e) => {
        e.stopPropagation();
        onAdd(node.name);
        setExpanded(true);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(node.name);
    };

    const handleSelect = (e) => {
        e.stopPropagation();
        onSelectNode(node);
    };

    const renderStatusIcon = () => {
        const status = node.status || (node.checked ? 'done' : 'todo');
        switch (status) {
            case 'done': return <div className="status-icon done"><Check size={12} strokeWidth={4} /></div>;
            case 'in-progress': return <div className="status-icon in-progress"><Clock size={12} strokeWidth={3} /></div>;
            default: return <div className="status-icon todo"><Circle size={12} strokeWidth={2} /></div>;
        }
    };

    return (
        <div className="tree-node">
            <div
                className={`node-content ${expanded ? 'expanded' : ''} ${hasChildren ? 'has-children' : 'leaf'} ${progress.percentage === 100 ? 'completed' : ''} status-${node.status || 'todo'}`}
                onClick={handleNodeClick}
            >
                <div className="node-info">
                    {!hasChildren && (
                        <div className="node-status-trigger" onClick={handleStatusCycle}>
                            {renderStatusIcon()}
                        </div>
                    )}
                    <div className="node-label-group">
                        <span className="node-label">{node.name}</span>
                        {node.notes && <FileText size={10} className="node-has-notes" />}
                    </div>
                </div>

                <div className="node-actions-overlay">
                    <button className="node-action-btn edit" onClick={handleEdit} title="Edit Name"><Pencil size={12} /></button>
                    <button className="node-action-btn details" onClick={handleSelect} title="View Details"><FileText size={12} /></button>
                    <button className="node-action-btn add" onClick={handleAdd} title="Add Child"><Plus size={12} /></button>
                    <button className="node-action-btn delete" onClick={handleDelete} title="Delete Node"><Trash2 size={12} /></button>
                </div>

                {hasChildren ? (
                    <div className="node-meta">
                        <div className="progress-mini">
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${progress.percentage}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">{progress.percentage}%</span>
                        </div>
                        <motion.div
                            animate={{ rotate: expanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="icon-wrapper"
                        >
                            <ChevronRight size={16} color={expanded ? "#2563eb" : "#94a3b8"} />
                        </motion.div>
                    </div>
                ) : null}
            </div>

            <AnimatePresence>
                {expanded && hasChildren && (
                    <motion.div
                        className="children-container"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {node.children.map((child, index) => (
                            <div key={index} className="child-wrapper">
                                <TreeNode
                                    node={child}
                                    onToggle={onToggle}
                                    onEdit={onEdit}
                                    onAdd={onAdd}
                                    onDelete={onDelete}
                                    onStatusChange={onStatusChange}
                                    onSelectNode={onSelectNode}
                                />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Tree({ data, onToggle, onEdit, onAdd, onDelete, onStatusChange, onSelectNode }) {
    return (
        <div className="tree-wrapper">
            <TreeNode
                node={data}
                onToggle={onToggle}
                onEdit={onEdit}
                onAdd={onAdd}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onSelectNode={onSelectNode}
            />
        </div>
    );
}

