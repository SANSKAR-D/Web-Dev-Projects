import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BinarySearchVisualizer = () => {
    const [array, setArray] = useState([]);
    const [target, setTarget] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Pointers
    const [left, setLeft] = useState(-1);
    const [right, setRight] = useState(-1);
    const [mid, setMid] = useState(-1);
    const [found, setFound] = useState(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const generateSortedArray = () => {
        if (isSearching) return;
        const newArray = [];
        let current = 5;
        for (let i = 0; i < 20; i++) { // Max 25, using 20
            current += Math.floor(Math.random() * 8) + 1;
            newArray.push({ id: generateId(), value: current });
        }
        setArray(newArray);
        setLeft(-1);
        setRight(-1);
        setMid(-1);
        setFound(null);
    };

    useEffect(() => {
        generateSortedArray();
    }, []);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const binarySearch = async () => {
        if (!target) return;
        const targetValue = parseInt(target, 10);
        setIsSearching(true);
        setFound(null);

        let l = 0;
        let r = array.length - 1;

        setLeft(l);
        setRight(r);
        await sleep(1000);

        while (l <= r) {
            let m = Math.floor((l + r) / 2);
            setMid(m);
            await sleep(1000);

            if (array[m].value === targetValue) {
                setFound(m);
                setIsSearching(false);
                return;
            }

            if (array[m].value < targetValue) {
                l = m + 1;
                setLeft(l);
            } else {
                r = m - 1;
                setRight(r);
            }
            await sleep(1000);
        }

        setFound(false);
        setIsSearching(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <button className="action-btn" onClick={generateSortedArray} disabled={isSearching}>
                    New Sorted Array
                </button>
                <input 
                    type="number" 
                    className="action-input"
                    placeholder="Target Value..." 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && binarySearch()}
                    disabled={isSearching}
                />
                <button className="action-btn" onClick={binarySearch} disabled={isSearching || !target}>
                    Search
                </button>
            </div>

            <div style={{ height: '30px', color: '#F0E0B0', marginBottom: '20px', fontFamily: 'monospace' }}>
                {found === false && "Target not found in array."}
                {found !== null && found !== false && `Target found at index ${found}!`}
            </div>

            <div className="ds-render-area" style={{ flexWrap: 'wrap', gap: '60px 10px', marginTop: '20px' }}>
                {array.map((item, index) => {
                    let isLeft = index === left;
                    let isRight = index === right;
                    let isMid = index === mid;
                    let isFound = index === found;
                    
                    let bg = 'linear-gradient(135deg, rgba(232, 192, 96, 0.1) 0%, rgba(184, 144, 42, 0.05) 100%)';
                    let borderColor = '#B8902A';
                    
                    if (isFound) {
                        bg = 'rgba(76, 175, 80, 0.4)'; // Green
                        borderColor = '#4CAF50';
                    } else if (isMid) {
                        bg = 'rgba(232, 192, 96, 0.4)'; // Bright Gold
                        borderColor = '#E8C060';
                    } else if (index < left || index > right && left !== -1 && right !== -1) {
                        bg = 'rgba(0,0,0,0.5)'; // Dimmed (eliminated from search space)
                        borderColor = '#333';
                    }

                    return (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            {/* Pointers Container */}
                            <div style={{ height: '20px', display: 'flex', gap: '2px', position: 'absolute', top: '-25px' }}>
                                {isLeft && <span style={{ color: '#E8C060', fontSize: '0.7rem', fontWeight: 'bold' }}>L↓</span>}
                                {isMid && <span style={{ color: '#4CAF50', fontSize: '0.7rem', fontWeight: 'bold' }}>M↓</span>}
                                {isRight && <span style={{ color: '#E8C060', fontSize: '0.7rem', fontWeight: 'bold' }}>R↓</span>}
                            </div>

                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="ds-node"
                                style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    background: bg,
                                    borderColor: borderColor,
                                    color: (index < left || index > right && left !== -1 && right !== -1) ? '#666' : '#F0E0B0'
                                }}
                            >
                                {item.value}
                                <span className="ds-index">{index}</span>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BinarySearchVisualizer;
