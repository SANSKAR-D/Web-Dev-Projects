import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SortingVisualizer = () => {
    const [array, setArray] = useState(() => {
        const saved = localStorage.getItem('kc_ds_sorting');
        return saved ? JSON.parse(saved) : [];
    });
    const [isSorting, setIsSorting] = useState(false);
    const [comparingIndices, setComparingIndices] = useState([]);
    const [sortedIndices, setSortedIndices] = useState([]);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const generateRandomArray = () => {
        if (isSorting) return;
        const newArray = [];
        for (let i = 0; i < 20; i++) { // Default to 20 to fit within 25 limit comfortably
            newArray.push({
                id: generateId(),
                value: Math.floor(Math.random() * 90) + 10 // values between 10 and 100
            });
        }
        setArray(newArray);
        setComparingIndices([]);
        setSortedIndices([]);
    };

    useEffect(() => {
        if (array.length === 0) {
            generateRandomArray();
        }
    }, []);

    useEffect(() => {
        if (array.length > 0) {
            localStorage.setItem('kc_ds_sorting', JSON.stringify(array));
        }
    }, [array]);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const bubbleSort = async () => {
        setIsSorting(true);
        let arr = [...array];
        let n = arr.length;
        let sorted = [];

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                setComparingIndices([j, j + 1]);
                await sleep(150); // Animation speed

                if (arr[j].value > arr[j + 1].value) {
                    // Swap
                    let temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    setArray([...arr]);
                    await sleep(150);
                }
            }
            sorted.push(n - i - 1);
            setSortedIndices([...sorted]);
        }
        sorted.push(0);
        setSortedIndices([...sorted]);
        setComparingIndices([]);
        setIsSorting(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <button className="action-btn" onClick={generateRandomArray} disabled={isSorting}>
                    Generate Random Array
                </button>
                <button className="action-btn" onClick={bubbleSort} disabled={isSorting || array.length === 0}>
                    Bubble Sort
                </button>
            </div>

            <div 
                className="ds-render-area" 
                style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: '5px', 
                    height: '250px',
                    padding: '20px',
                    background: 'rgba(13, 11, 9, 0.4)',
                    borderRadius: '8px'
                }}
            >
                {array.map((item, index) => {
                    let color = '#B8902A'; // Default gold
                    if (comparingIndices.includes(index)) {
                        color = '#E8C060'; // Highlight compare
                    } else if (sortedIndices.includes(index)) {
                        color = '#4CAF50'; // Green for sorted
                    }

                    return (
                        <motion.div
                            key={item.id}
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            style={{
                                width: '35px', // slightly wider to fit 3 digits if needed
                                height: `${item.value * 2}px`,
                                backgroundColor: color,
                                border: '1px solid rgba(0,0,0,0.5)',
                                borderRadius: '4px 4px 0 0',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start', // align to top of the bar
                                paddingTop: '5px', // padding from top
                                color: '#111',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                boxShadow: comparingIndices.includes(index) ? '0 0 15px rgba(232, 192, 96, 0.6)' : 'none'
                            }}
                        >
                            <span>{item.value}</span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default SortingVisualizer;
