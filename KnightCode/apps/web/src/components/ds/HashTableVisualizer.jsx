import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NUM_BUCKETS = 5;

const HashTableVisualizer = () => {
    // Array of arrays (buckets)
    const [buckets, setBuckets] = useState(Array.from({ length: NUM_BUCKETS }, () => []));
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [hashAnimation, setHashAnimation] = useState(null); // { key, hashIndex }

    const getTotalElements = () => buckets.reduce((acc, bucket) => acc + bucket.length, 0);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Simple hash function for visualization
    const hashString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash += str.charCodeAt(i);
        }
        return hash % NUM_BUCKETS;
    };

    const handleInsert = async () => {
        if (!inputKey || !inputValue || getTotalElements() >= 25) {
            if (getTotalElements() >= 25) alert("Maximum size of 25 reached!");
            return;
        }

        const keyToInsert = inputKey;
        const valToInsert = inputValue;
        setInputKey('');
        setInputValue('');
        
        // 1. Animate hashing process
        const hashIndex = hashString(keyToInsert);
        setHashAnimation({ key: keyToInsert, hashIndex });
        
        // Wait for animation to show
        await new Promise(r => setTimeout(r, 1000));
        
        // 2. Insert into bucket
        setHashAnimation(null);
        setBuckets(prevBuckets => {
            const newBuckets = [...prevBuckets];
            
            // Check if key exists to update value
            const existingNodeIndex = newBuckets[hashIndex].findIndex(n => n.key === keyToInsert);
            if (existingNodeIndex !== -1) {
                newBuckets[hashIndex][existingNodeIndex].value = valToInsert;
            } else {
                newBuckets[hashIndex] = [...newBuckets[hashIndex], { id: generateId(), key: keyToInsert, value: valToInsert }];
            }
            return newBuckets;
        });
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <input 
                    type="text" 
                    className="action-input"
                    placeholder="Key..." 
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    style={{ width: '80px' }}
                />
                <input 
                    type="text" 
                    className="action-input"
                    placeholder="Value..." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                    style={{ width: '100px' }}
                />
                <button className="action-btn" onClick={handleInsert} disabled={hashAnimation !== null}>
                    Put (Key, Value)
                </button>
            </div>

            {/* Hash Function Formula */}
            <div style={{ color: '#9A8060', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '10px' }}>
                Hash Function: <span style={{ color: '#F0E0B0' }}>h(key) = sum(charCodeAt(char)) % {NUM_BUCKETS}</span>
            </div>

            {/* Hashing Animation Display */}
            <div style={{ height: '40px', marginBottom: '20px', color: '#E8C060', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                <AnimatePresence>
                    {hashAnimation && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            hash("{hashAnimation.key}") ➜ Index {hashAnimation.hashIndex}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="ds-render-area" style={{ flexDirection: 'column', gap: '35px', alignItems: 'center', width: '100%', overflowX: 'auto', padding: '30px 20px' }}>
                {buckets.map((bucket, bucketIndex) => (
                    <div key={bucketIndex} style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '800px' }}>
                        {/* Bucket Label/Head */}
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            background: '#332610', 
                            border: '2px solid #B8902A', 
                            color: '#F0E0B0', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            boxShadow: hashAnimation?.hashIndex === bucketIndex ? '0 0 20px #E8C060' : 'none',
                            transition: 'box-shadow 0.3s ease'
                        }}>
                            {bucketIndex}
                        </div>

                        {/* Chain */}
                        <AnimatePresence mode="popLayout">
                            {bucket.map((node, nodeIndex) => (
                                <React.Fragment key={node.id}>
                                    {/* Thread Arrow */}
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: '30px' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        style={{ 
                                            height: '2px', 
                                            background: '#B8902A',
                                            position: 'relative'
                                        }}
                                    >
                                         <div style={{
                                            position: 'absolute',
                                            right: '-5px',
                                            top: '-4px',
                                            width: 0,
                                            height: 0,
                                            borderTop: '5px solid transparent',
                                            borderBottom: '5px solid transparent',
                                            borderLeft: '8px solid #B8902A'
                                        }}></div>
                                    </motion.div>

                                    {/* Node */}
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.5, x: -20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="ds-node"
                                        style={{ 
                                            width: 'auto', 
                                            minWidth: '80px', 
                                            height: '40px', 
                                            padding: '0 10px', 
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        <span style={{ color: '#E8C060' }}>{node.key}</span>
                                        <span style={{ color: '#9A8060' }}>:</span>
                                        <span>{node.value}</span>
                                    </motion.div>
                                </React.Fragment>
                            ))}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HashTableVisualizer;
