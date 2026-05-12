import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ArrayVisualizer = () => {
    // State to hold the array elements. We use objects with unique IDs for Framer Motion to track them properly.
    const [array, setArray] = useState([
        { id: '1', value: 10 },
        { id: '2', value: 25 },
        { id: '3', value: 42 },
        { id: '4', value: 8 },
        { id: '5', value: 99 }
    ]);
    const [inputValue, setInputValue] = useState('');

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handlePush = () => {
        if (!inputValue || array.length >= 25) {
            if (array.length >= 25) alert("Maximum size of 25 reached!");
            return;
        }
        setArray([...array, { id: generateId(), value: parseInt(inputValue, 10) }]);
        setInputValue('');
    };

    const handlePop = () => {
        if (array.length === 0) return;
        setArray(array.slice(0, -1));
    };

    const handleUnshift = () => {
        if (!inputValue || array.length >= 25) {
            if (array.length >= 25) alert("Maximum size of 25 reached!");
            return;
        }
        setArray([{ id: generateId(), value: parseInt(inputValue, 10) }, ...array]);
        setInputValue('');
    };

    const handleShift = () => {
        if (array.length === 0) return;
        setArray(array.slice(1));
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
                    onKeyDown={(e) => e.key === 'Enter' && handlePush()}
                />
                <button className="action-btn" onClick={handlePush}>Push (End)</button>
                <button className="action-btn" onClick={handlePop}>Pop (End)</button>
                <button className="action-btn" onClick={handleUnshift}>Unshift (Start)</button>
                <button className="action-btn" onClick={handleShift}>Shift (Start)</button>
            </div>

            <div className="ds-render-area" style={{ flexWrap: 'wrap', gap: '40px 10px', marginTop: '10px' }}>
                <AnimatePresence mode="popLayout">
                    {array.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.5, y: -50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="ds-node"
                            style={{ width: '60px', height: '60px', position: 'relative' }}
                        >
                            {item.value}
                            <span className="ds-index">{index}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ArrayVisualizer;
