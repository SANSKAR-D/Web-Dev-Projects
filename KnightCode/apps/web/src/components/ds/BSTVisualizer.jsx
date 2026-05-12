import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BSTVisualizer = () => {
    // Array of nodes: { id, value, x, y, parentId }
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [animatingNodeId, setAnimatingNodeId] = useState(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    // Config for tree rendering
    const ROOT_X = 50; // percentage
    const ROOT_Y = 20; // px
    const Y_OFFSET = 60; // px per level
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const insertNode = async () => {
        if (!inputValue || nodes.length >= 25) {
            if (nodes.length >= 25) alert("Maximum size of 25 reached!");
            return;
        }

        const value = parseInt(inputValue, 10);
        setInputValue('');

        const newNodeId = generateId();

        if (nodes.length === 0) {
            // Root node
            setNodes([{ id: newNodeId, value, x: ROOT_X, y: ROOT_Y, level: 0 }]);
            return;
        }

        setIsInserting(true);
        let currIdx = 0; // index of root
        let currentX = ROOT_X;
        let currentY = ROOT_Y;
        let level = 0;
        let offset = 20; // initial x offset percentage
        
        let parentId = null;
        let finalX = ROOT_X;
        let finalY = ROOT_Y;

        // Traverse to find insertion point
        let currNode = nodes[0];
        while (true) {
            setAnimatingNodeId(currNode.id);
            await sleep(800);

            if (value < currNode.value) {
                // Go left
                const leftChild = nodes.find(n => n.parentId === currNode.id && n.isLeft);
                if (!leftChild) {
                    finalX = currNode.x - offset;
                    finalY = currNode.y + Y_OFFSET;
                    parentId = currNode.id;
                    break;
                } else {
                    currNode = leftChild;
                }
            } else {
                // Go right (allowing duplicates to right)
                const rightChild = nodes.find(n => n.parentId === currNode.id && !n.isLeft);
                if (!rightChild) {
                    finalX = currNode.x + offset;
                    finalY = currNode.y + Y_OFFSET;
                    parentId = currNode.id;
                    break;
                } else {
                    currNode = rightChild;
                }
            }
            offset = offset / 1.5; // decrease offset width deeper down
        }

        setAnimatingNodeId(null);
        
        const isLeft = value < currNode.value;

        setNodes(prev => [...prev, { id: newNodeId, value, x: finalX, y: finalY, parentId, isLeft }]);
        setEdges(prev => [...prev, { id: generateId(), from: currNode, to: { x: finalX, y: finalY } }]);
        setIsInserting(false);
    };

    const [isInserting, setIsInserting] = useState(false);

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <input 
                    type="number" 
                    className="action-input"
                    placeholder="Value..." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && insertNode()}
                    disabled={isInserting}
                />
                <button className="action-btn" onClick={insertNode} disabled={isInserting || !inputValue}>
                    Insert
                </button>
            </div>

            <div 
                className="ds-render-area" 
                style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '400px', 
                    background: 'rgba(13, 11, 9, 0.4)',
                    overflow: 'hidden'
                }}
            >
                {/* SVG for Edges */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {edges.map(edge => (
                        <motion.line
                            key={edge.id}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            x1={`${edge.from.x}%`}
                            y1={edge.from.y + 25} // offset for node center approx
                            x2={`${edge.to.x}%`}
                            y2={edge.to.y + 25}
                            stroke="#B8902A"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {/* Nodes */}
                <AnimatePresence>
                    {nodes.map(node => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="ds-node"
                            style={{
                                position: 'absolute',
                                left: `calc(${node.x}% - 25px)`, // center horizontally (50px width / 2)
                                top: `${node.y}px`,
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                zIndex: 10,
                                boxShadow: animatingNodeId === node.id ? '0 0 25px #E8C060' : '0 0 15px rgba(184, 144, 42, 0.2)',
                                borderColor: animatingNodeId === node.id ? '#E8C060' : '#B8902A',
                                transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
                            }}
                        >
                            {node.value}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BSTVisualizer;
