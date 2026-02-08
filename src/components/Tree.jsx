import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { calculateProgress } from '../utils';
import './Tree.css';

const TreeNode = ({ node, onToggle }) => {
    const [expanded, setExpanded] = useState(node.toggled || false);
    const hasChildren = node.children && node.children.length > 0;
    const progress = calculateProgress(node);

    const handleNodeClick = (e) => {
        if (hasChildren) {
            setExpanded(!expanded);
        } else {
            onToggle(node.name);
        }
    };

    return (
        <div className="tree-node">
            <div
                className={`node-content ${expanded ? 'expanded' : ''} ${hasChildren ? 'has-children' : 'leaf'} ${progress.percentage === 100 ? 'completed' : ''}`}
                onClick={handleNodeClick}
            >
                <div className="node-info">
                    {!hasChildren && (
                        <div className={`checkbox ${node.checked ? 'checked' : ''}`}>
                            {node.checked && <Check size={12} strokeWidth={3} />}
                        </div>
                    )}
                    <span className="node-label">{node.name}</span>
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
                                <TreeNode node={child} onToggle={onToggle} />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Tree({ data, onToggle }) {
    return (
        <div className="tree-wrapper">
            <TreeNode node={data} onToggle={onToggle} />
        </div>
    );
}

