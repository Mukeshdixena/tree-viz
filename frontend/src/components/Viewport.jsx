import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import './Viewport.css';

const Viewport = ({ children }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setScale(prev => Math.min(Math.max(prev + delta, 0.5), 2));
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <div
            className="viewport-container"
            ref={containerRef}
        >
            <motion.div
                className="viewport-content"
                drag
                dragMomentum={false}
                animate={{
                    scale,
                    x: position.x,
                    y: position.y
                }}
                onDragEnd={(_, info) => {
                    setPosition({
                        x: position.x + info.delta.x,
                        y: position.y + info.delta.y
                    });
                }}
                style={{ cursor: 'grab' }}
                whileTap={{ cursor: 'grabbing' }}
            >
                {children}
            </motion.div>

            <div className="viewport-controls">
                <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={18} /></button>
                <button onClick={handleReset} title="Reset View"><Maximize size={18} /></button>
                <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={18} /></button>
                <div className="zoom-level">{Math.round(scale * 100)}%</div>
            </div>
        </div>
    );
};

export default Viewport;
