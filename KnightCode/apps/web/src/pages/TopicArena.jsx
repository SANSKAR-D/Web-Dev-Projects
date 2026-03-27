import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import './TopicArena.css';

const difficulties = [
  {
    level: 'easy',
    label: 'Easy',
    glyph: '✦',
    color: '#6DBF8A',
    description: 'Warm up thy blade with fundamental challenges.',
  },
  {
    level: 'medium',
    label: 'Medium',
    glyph: '✦✦',
    color: '#D4A83C',
    description: 'Test thy mettle against worthy opponents.',
  },
  {
    level: 'hard',
    label: 'Hard',
    glyph: '✦✦✦',
    color: '#C05A4A',
    description: 'Only the bravest dare face these ancient trials.',
  },
];

const TopicArena = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || 'Unknown';

  const handleSelect = (difficulty) => {
    navigate(`/forge?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`);
  };

  return (
    <div className="topic-arena">
      <div className="topic-arena-bg">
        <SacredGeometryCanvas />
        <div className="topic-arena-vignette" />
      </div>

      <Navbar />

      <div className="topic-arena-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="topic-arena-header"
        >
          <button className="back-btn" onClick={() => navigate('/sanctum')}>
            ← Back to Path
          </button>
          <h1 className="topic-arena-title">{topic}</h1>
          <p className="topic-arena-subtitle">Choose thy trial difficulty</p>
        </motion.div>

        <div className="difficulty-grid">
          {difficulties.map((d, i) => (
            <motion.button
              key={d.level}
              className={`difficulty-card difficulty-${d.level}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 * i }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(d.level)}
            >
              <span className="diff-glyph" style={{ color: d.color }}>{d.glyph}</span>
              <h2 className="diff-label" style={{ color: d.color }}>{d.label}</h2>
              <p className="diff-desc">{d.description}</p>
              <span className="diff-arrow">Enter →</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicArena;
