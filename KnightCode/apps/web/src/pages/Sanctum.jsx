import React, { useRef, useEffect, useState } from 'react';
import './Sanctum.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';

const tomes = [
  { id: 1, numeral: 'I', title: 'Array' },
  { id: 2, numeral: 'II', title: 'String' },
  { id: 3, numeral: 'III', title: 'Hash Table' },
  { id: 4, numeral: 'IV', title: 'Two Pointers' },
  { id: 5, numeral: 'V', title: 'Sliding Window' },
  { id: 6, numeral: 'VI', title: 'Stack' },
  { id: 7, numeral: 'VII', title: 'Linked List' },
  { id: 8, numeral: 'VIII', title: 'Binary Search' },
  { id: 9, numeral: 'IX', title: 'Sorting' },
  { id: 10, numeral: 'X', title: 'Tree' },
  { id: 11, numeral: 'XI', title: 'Heap' },
  { id: 12, numeral: 'XII', title: 'Greedy' },
  { id: 13, numeral: 'XIII', title: 'Backtracking' },
  { id: 14, numeral: 'XIV', title: 'Graph' },
  { id: 15, numeral: 'XV', title: 'Dynamic Programming' }
];

// SVG dimensions
const SVG_WIDTH = 600;
const NODE_RADIUS = 65;
const NODE_SPACING_Y = 220;
const MARGIN_TOP = 100;

// Path goes: center-top → right → left → right → left … 
// Nodes sit at points where path changes direction
const LEFT_X = 160;
const CENTER_X = SVG_WIDTH / 2;
const RIGHT_X = SVG_WIDTH - 160;

function getNodePositions() {
  const positions = [];
  for (let i = 0; i < tomes.length; i++) {
    const y = MARGIN_TOP + i * NODE_SPACING_Y;
    let x;
    if (i === 0) {
      x = CENTER_X; // First node at center
    } else {
      // Alternate: odd → right, even → left
      x = i % 2 === 1 ? RIGHT_X : LEFT_X;
    }
    positions.push({ x, y });
  }
  return positions;
}

function buildSmoothPath(positions) {
  if (positions.length < 2) return '';
  let d = `M ${positions[0].x} ${positions[0].y}`;
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

const nodePositions = getNodePositions();
const curvePath = buildSmoothPath(nodePositions);
const svgHeight = MARGIN_TOP + (tomes.length - 1) * NODE_SPACING_Y + 120;

const Sanctum = () => {
  const navigate = useNavigate();
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const handleNodeClick = (tome) => {
    navigate(`/difficulty?topic=${encodeURIComponent(tome.title)}`);
  };

  return (
    <div className="sanctum">
      <div className="sanctum-bg-container">
        <SacredGeometryCanvas />
        <div className="sanctum-vignette" />
      </div>

      <Navbar />

      <div className="sanctum-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="sanctum-header"
        >
          <h1 className="sanctum-title">The Path of Mastery</h1>
          <p className="sanctum-subtitle">Follow the ancient scrolls. Click a tome to enter the Arena.</p>
        </motion.div>

        {/* Everything in one SVG so coordinates match perfectly */}
        <svg
          className="pathway-svg"
          viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
          preserveAspectRatio="xMidYMin meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="path-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8C060" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#B8902A" stopOpacity="0.4" />
            </linearGradient>
            <radialGradient id="node-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#211A0E" />
              <stop offset="100%" stopColor="#0D0B09" />
            </radialGradient>
          </defs>

          {/* Glow behind path */}
          <path
            d={curvePath}
            fill="none"
            stroke="#E8C060"
            strokeWidth="8"
            filter="url(#gold-glow)"
            strokeLinecap="round"
            opacity="0.2"
          />

          {/* Animated main path */}
          <motion.path
            ref={pathRef}
            d={curvePath}
            fill="none"
            stroke="url(#path-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={pathLength || 1}
            strokeDashoffset={pathLength || 0}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />

          {/* Nodes — rendered as SVG groups at exact path positions */}
          {tomes.map((tome, index) => {
            const pos = nodePositions[index];
            const r = NODE_RADIUS;

            return (
              <motion.g
                key={tome.id}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.6,
                  delay: 0.04 * index,
                  type: 'spring',
                  stiffness: 180,
                  damping: 14
                }}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNodeClick(tome)}
                className="tome-node-group"
              >
                {/* Outer glow ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 4}
                  fill="none"
                  stroke="#E8C060"
                  strokeWidth="2"
                  opacity="0.2"
                  className="tome-glow-ring"
                />

                {/* Main circle bg */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill="url(#node-bg)"
                  stroke="#B8902A"
                  strokeWidth="1.5"
                  className="tome-circle"
                />

                {/* Gold top accent arc */}
                <path
                  d={`M ${pos.x - r * 0.6} ${pos.y - r + 4} A ${r} ${r} 0 0 1 ${pos.x + r * 0.6} ${pos.y - r + 4}`}
                  fill="none"
                  stroke="#E8C060"
                  strokeWidth="2"
                  opacity="0.5"
                  strokeLinecap="round"
                />

                {/* Roman numeral */}
                <text
                  x={pos.x}
                  y={pos.y - 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="tome-numeral-text"
                >
                  {tome.numeral}
                </text>

                {/* Topic name */}
                <foreignObject
                  x={pos.x - r + 10}
                  y={pos.y}
                  width={(r - 10) * 2}
                  height={r}
                >
                  <div className="tome-name-wrap">
                    {tome.title}
                  </div>
                </foreignObject>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default Sanctum;
