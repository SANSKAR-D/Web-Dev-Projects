import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Fixed graph layout for visualization
const GRAPH_NODES = {
    A: { id: 'A', x: 50, y: 10 },
    B: { id: 'B', x: 20, y: 40 },
    C: { id: 'C', x: 80, y: 40 },
    D: { id: 'D', x: 10, y: 80 },
    E: { id: 'E', x: 40, y: 80 },
    F: { id: 'F', x: 60, y: 80 },
    G: { id: 'G', x: 90, y: 80 },
};

const GRAPH_EDGES = [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'B', to: 'E' },
    { from: 'C', to: 'F' },
    { from: 'C', to: 'G' },
    { from: 'E', to: 'F' }, // Creates a cycle/cross-edge
];

// Adjacency list
const adjList = {
    A: ['B', 'C'],
    B: ['A', 'D', 'E'],
    C: ['A', 'F', 'G'],
    D: ['B'],
    E: ['B', 'F'],
    F: ['C', 'E'],
    G: ['C']
};

const GraphVisualizer = () => {
    const [visited, setVisited] = useState(() => {
        const saved = localStorage.getItem('kc_ds_graph_visited');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('kc_ds_graph_visited', JSON.stringify(visited));
    }, [visited]);
    const [current, setCurrent] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const reset = () => {
        if (isRunning) return;
        setVisited([]);
        setCurrent(null);
    };

    const runBFS = async () => {
        setIsRunning(true);
        setVisited([]);
        setCurrent(null);

        let queue = ['A'];
        let visitedSet = new Set(['A']);
        let visitedArray = [];

        while (queue.length > 0) {
            let node = queue.shift();
            setCurrent(node);
            await sleep(1000);

            visitedArray.push(node);
            setVisited([...visitedArray]);

            for (let neighbor of adjList[node]) {
                if (!visitedSet.has(neighbor)) {
                    visitedSet.add(neighbor);
                    queue.push(neighbor);
                }
            }
            await sleep(500);
        }
        
        setCurrent(null);
        setIsRunning(false);
    };

    const runDFS = async () => {
        setIsRunning(true);
        setVisited([]);
        setCurrent(null);

        let visitedSet = new Set();
        let visitedArray = [];

        const dfsRecursive = async (node) => {
            visitedSet.add(node);
            setCurrent(node);
            await sleep(1000);

            visitedArray.push(node);
            setVisited([...visitedArray]);

            for (let neighbor of adjList[node]) {
                if (!visitedSet.has(neighbor)) {
                    await sleep(500);
                    await dfsRecursive(neighbor);
                }
            }
        };

        await dfsRecursive('A');
        
        setCurrent(null);
        setIsRunning(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ds-action-panel">
                <button className="action-btn" onClick={runBFS} disabled={isRunning}>
                    Run BFS (from A)
                </button>
                <button className="action-btn" onClick={runDFS} disabled={isRunning}>
                    Run DFS (from A)
                </button>
                <button className="action-btn" onClick={reset} disabled={isRunning}>
                    Reset
                </button>
            </div>

            <div style={{ height: '30px', color: '#F0E0B0', marginBottom: '20px', fontFamily: 'monospace' }}>
                Visited Order: {visited.join(' ➔ ')}
            </div>

            <div 
                className="ds-render-area" 
                style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '500px',
                    height: '400px', 
                    background: 'rgba(13, 11, 9, 0.4)',
                    overflow: 'hidden',
                    borderRadius: '8px'
                }}
            >
                {/* Edges */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {GRAPH_EDGES.map((edge, idx) => {
                        const fromNode = GRAPH_NODES[edge.from];
                        const toNode = GRAPH_NODES[edge.to];
                        
                        // Check if edge connects two visited nodes
                        const isVisitedEdge = visited.includes(edge.from) && visited.includes(edge.to);
                        
                        return (
                            <line
                                key={idx}
                                x1={`${fromNode.x}%`}
                                y1={`${fromNode.y}%`}
                                x2={`${toNode.x}%`}
                                y2={`${toNode.y}%`}
                                stroke={isVisitedEdge ? "#E8C060" : "#B8902A"}
                                strokeWidth={isVisitedEdge ? "3" : "1"}
                                style={{ transition: 'stroke 0.5s ease, stroke-width 0.5s ease', opacity: 0.5 }}
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {Object.values(GRAPH_NODES).map(node => {
                    const isVisited = visited.includes(node.id);
                    const isCurrent = current === node.id;
                    
                    let bg = 'linear-gradient(135deg, rgba(232, 192, 96, 0.1) 0%, rgba(184, 144, 42, 0.05) 100%)';
                    let borderColor = '#B8902A';
                    
                    if (isCurrent) {
                        bg = 'rgba(232, 192, 96, 0.4)'; // Bright Gold
                        borderColor = '#E8C060';
                    } else if (isVisited) {
                        bg = 'rgba(76, 175, 80, 0.4)'; // Green for visited
                        borderColor = '#4CAF50';
                    }

                    return (
                        <motion.div
                            key={node.id}
                            className="ds-node"
                            style={{
                                position: 'absolute',
                                left: `calc(${node.x}% - 25px)`, // center horizontally
                                top: `calc(${node.y}% - 25px)`, // center vertically
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                zIndex: 10,
                                background: bg,
                                borderColor: borderColor,
                                boxShadow: isCurrent ? '0 0 25px #E8C060' : (isVisited ? '0 0 15px rgba(76, 175, 80, 0.5)' : '0 0 15px rgba(184, 144, 42, 0.2)'),
                                transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
                            }}
                        >
                            {node.id}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default GraphVisualizer;
