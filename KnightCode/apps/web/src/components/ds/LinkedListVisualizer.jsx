import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LinkedListVisualizer = () => {
    const [list, setList] = useState(() => {
        const saved = localStorage.getItem('kc_ds_linkedlist');
        return saved ? JSON.parse(saved) : [
            { id: '1', value: 10 },
            { id: '2', value: 25 },
            { id: '3', value: 42 }
        ];
    });
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        localStorage.setItem('kc_ds_linkedlist', JSON.stringify(list));
    }, [list]);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const appendNode = () => {
        if (!inputValue || list.length >= 25) {
            if (list.length >= 25) alert("Maximum size of 25 reached!");
            return;
        }
        setList([...list, { id: generateId(), value: parseInt(inputValue, 10) }]);
        setInputValue('');
    };

    const prependNode = () => {
        if (!inputValue || list.length >= 25) {
            if (list.length >= 25) alert("Maximum size of 25 reached!");
            return;
        }
        setList([{ id: generateId(), value: parseInt(inputValue, 10) }, ...list]);
        setInputValue('');
    };

    const deleteHead = () => {
        if (list.length === 0) return;
        setList(list.slice(1));
    };

    const deleteTail = () => {
        if (list.length === 0) return;
        setList(list.slice(0, -1));
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <input 
                    type="number" 
                    className="action-input"
                    placeholder="Value..." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && appendNode()}
                />
                <button className="action-btn" onClick={appendNode}>Append (Tail)</button>
                <button className="action-btn" onClick={prependNode}>Prepend (Head)</button>
                <button className="action-btn" onClick={deleteHead}>Delete Head</button>
                <button className="action-btn" onClick={deleteTail}>Delete Tail</button>
            </div>

            <div className="ds-render-area" style={{ flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                <AnimatePresence mode="popLayout">
                    {list.map((node, index) => (
                        <React.Fragment key={node.id}>
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.5, x: -50 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="ds-node"
                                style={{ width: '60px', height: '60px', borderRadius: '50%' }}
                            >
                                {node.value}
                            </motion.div>
                            
                            {/* The Pointer (Astral Thread) */}
                            {index < list.length - 1 && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: '40px' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    style={{ 
                                        height: '2px', 
                                        background: 'linear-gradient(90deg, #B8902A 0%, rgba(184, 144, 42, 0) 100%)',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Arrow Head */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '-5px',
                                        top: '-4px',
                                        width: 0,
                                        height: 0,
                                        borderTop: '5px solid transparent',
                                        borderBottom: '5px solid transparent',
                                        borderLeft: '8px solid rgba(184, 144, 42, 0.5)'
                                    }}></div>
                                </motion.div>
                            )}
                        </React.Fragment>
                    ))}
                    
                    {/* Null terminator */}
                    {list.length > 0 && (
                         <motion.div
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ 
                                color: '#9A8060', 
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                            }}
                        >
                            NULL
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LinkedListVisualizer;
