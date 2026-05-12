import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StackQueueVisualizer = ({ mode }) => {
    // Mode can be 'Stack' or 'Queue'
    const isStack = mode === 'Stack';
    
    const [items, setItems] = useState([
        { id: '1', value: 10 },
        { id: '2', value: 25 },
        { id: '3', value: 42 }
    ]);
    const [inputValue, setInputValue] = useState('');

    // Reset items when mode changes to show a clean state for the new structure
    useEffect(() => {
        setItems([
            { id: '1', value: 10 },
            { id: '2', value: 25 },
            { id: '3', value: 42 }
        ]);
        setInputValue('');
    }, [mode]);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handlePushEnqueue = () => {
        if (!inputValue || items.length >= 25) {
            if (items.length >= 25) alert("Maximum size of 25 reached!");
            return;
        }
        // For Stack, push to top (end of array)
        // For Queue, enqueue to rear (end of array)
        setItems([...items, { id: generateId(), value: parseInt(inputValue, 10) }]);
        setInputValue('');
    };

    const handlePopDequeue = () => {
        if (items.length === 0) return;
        
        if (isStack) {
            // Stack Pop: Remove from top (end of array)
            setItems(items.slice(0, -1));
        } else {
            // Queue Dequeue: Remove from front (start of array)
            setItems(items.slice(1));
        }
    };

    // Determine layout and animation styles based on mode
    const containerStyle = isStack 
        ? { flexDirection: 'column-reverse', justifyContent: 'flex-start', paddingBottom: '20px', borderLeft: '2px solid #B8902A', borderRight: '2px solid #B8902A', borderBottom: '2px solid #B8902A', width: '100px', height: '300px' }
        : { flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: '20px', borderTop: '2px solid #B8902A', borderBottom: '2px solid #B8902A', width: '400px', height: '100px', overflowX: 'auto' };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <input 
                    type="number" 
                    className="action-input"
                    placeholder="Value..." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePushEnqueue()}
                />
                <button className="action-btn" onClick={handlePushEnqueue}>
                    {isStack ? 'Push' : 'Enqueue'}
                </button>
                <button className="action-btn" onClick={handlePopDequeue}>
                    {isStack ? 'Pop' : 'Dequeue'}
                </button>
            </div>

            <div 
                className="ds-render-area" 
                style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    alignItems: 'center', 
                    ...containerStyle,
                    position: 'relative',
                    background: 'rgba(13, 11, 9, 0.4)'
                }}
            >
                {/* Labels for container boundaries */}
                {isStack && (
                    <div style={{ position: 'absolute', bottom: '-25px', color: '#9A8060', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                        Bottom
                    </div>
                )}
                {!isStack && (
                    <div style={{ position: 'absolute', left: '-40px', color: '#9A8060', fontSize: '0.8rem' }}>
                        Front
                    </div>
                )}
                {!isStack && (
                    <div style={{ position: 'absolute', right: '-40px', color: '#9A8060', fontSize: '0.8rem' }}>
                        Rear
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={isStack ? { opacity: 0, y: -50 } : { opacity: 0, x: 50 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={isStack ? { opacity: 0, y: -50 } : { opacity: 0, x: -50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="ds-node"
                            style={{ 
                                width: '60px', 
                                height: '60px', 
                                flexShrink: 0,
                                // Highlight top/front element
                                borderColor: (isStack && index === items.length - 1) || (!isStack && index === 0) ? '#E8C060' : '#B8902A',
                                boxShadow: (isStack && index === items.length - 1) || (!isStack && index === 0) ? '0 0 20px rgba(232, 192, 96, 0.4)' : ''
                            }}
                        >
                            {item.value}
                            {isStack && index === items.length - 1 && (
                                <span className="ds-index" style={{ color: '#E8C060', bottom: 'auto', top: '-25px' }}>Top</span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StackQueueVisualizer;
