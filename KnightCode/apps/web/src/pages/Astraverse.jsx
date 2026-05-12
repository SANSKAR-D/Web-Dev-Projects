import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import ArrayVisualizer from '../components/ds/ArrayVisualizer.jsx';
import LinkedListVisualizer from '../components/ds/LinkedListVisualizer.jsx';
import StackQueueVisualizer from '../components/ds/StackQueueVisualizer.jsx';
import SortingVisualizer from '../components/ds/SortingVisualizer.jsx';
import HashTableVisualizer from '../components/ds/HashTableVisualizer.jsx';
import BinarySearchVisualizer from '../components/ds/BinarySearchVisualizer.jsx';
import BSTVisualizer from '../components/ds/BSTVisualizer.jsx';
import GraphVisualizer from '../components/ds/GraphVisualizer.jsx';
import './Astraverse.css';

const Astraverse = () => {
    const [activeDS, setActiveDS] = useState(() => {
        return localStorage.getItem('knightcode_astraverse_ds') || 'Array';
    });

    useEffect(() => {
        localStorage.setItem('knightcode_astraverse_ds', activeDS);
    }, [activeDS]);

    const dsOptions = ['Array', 'Linked List', 'Stack', 'Queue', 'Sorting', 'Binary Search', 'BST', 'Graph'];

    const renderVisualizer = () => {
        switch (activeDS) {
            case 'Array':
                return <ArrayVisualizer />;
            case 'Linked List':
                return <LinkedListVisualizer />;
            case 'Stack':
                return <StackQueueVisualizer mode="Stack" />;
            case 'Queue':
                return <StackQueueVisualizer mode="Queue" />;
            case 'Sorting':
                return <SortingVisualizer />;
            case 'Binary Search':
                return <BinarySearchVisualizer />;
            case 'BST':
                return <BSTVisualizer />;
            case 'Graph':
                return <GraphVisualizer />;
            default:
                return <ArrayVisualizer />;
        }
    };

    return (
        <div className="astraverse-container">
            <SacredGeometryCanvas />
            <Navbar />
            
            <div className="astraverse-header">
                <h1 className="astraverse-title">The Astraverse</h1>
                <p className="astraverse-subtitle">Visualize the geometry of logic</p>
            </div>

            <div className="ds-controls">
                {dsOptions.map((ds) => (
                    <button
                        key={ds}
                        className={`ds-btn ${activeDS === ds ? 'active' : ''}`}
                        onClick={() => setActiveDS(ds)}
                    >
                        {ds}
                    </button>
                ))}
            </div>

            <div className="visualizer-container">
                {renderVisualizer()}
            </div>
        </div>
    );
};

export default Astraverse;