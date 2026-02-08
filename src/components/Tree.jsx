import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Circle } from 'lucide-react';
import './Tree.css';

const TreeNode = ({ node }) => {
    const [expanded, setExpanded] = useState(node.toggled || false);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="tree-node">
            <div
                className={`node-content ${expanded ? 'expanded' : ''} ${hasChildren ? 'has-children' : ''}`}
                onClick={() => setExpanded(!expanded)}
            >
                <span className="node-label">{node.name}</span>
                {hasChildren ? (
                    <motion.div
                        animate={{ rotate: expanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="icon-wrapper"
                    >
                        <ChevronRight size={16} color={expanded ? "#2563eb" : "#94a3b8"} />
                    </motion.div>
                ) : (
                    <div className="leaf-node-indicator">
                        <Circle size={8} fill="#cbd5e1" color="#cbd5e1" />
                    </div>
                )}
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
                                <TreeNode node={child} />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Tree({ data }) {
    return (
        <div className="tree-wrapper">
            <TreeNode node={data} />
        </div>
    );
}
