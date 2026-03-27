import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import client from '../api/client.js';
import './ProblemsPage.css';

const difficultyMeta = {
  easy:   { glyph: '✦',   color: '#6DBF8A', label: 'Easy' },
  medium: { glyph: '✦✦',  color: '#D4A83C', label: 'Medium' },
  hard:   { glyph: '✦✦✦', color: '#C05A4A', label: 'Hard' },
};

const ProblemsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || 'easy';
  const meta = difficultyMeta[difficulty] || difficultyMeta.easy;

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.get('/problems', {
          params: { topic, difficulty }
        });
        setProblems(res.data);
      } catch (err) {
        console.error('Failed to fetch problems:', err);
        setError('Failed to load problems. Is the API running?');
      } finally {
        setLoading(false);
      }
    };

    if (topic && difficulty) {
      fetchProblems();
    }
  }, [topic, difficulty]);

  return (
    <div className="problems-page">
      <div className="problems-bg">
        <SacredGeometryCanvas />
        <div className="problems-vignette" />
      </div>

      <Navbar />

      <div className="problems-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="problems-header"
        >
          <button className="back-btn" onClick={() => navigate(`/difficulty?topic=${encodeURIComponent(topic)}`)}>
            ← Back to Difficulty
          </button>

          <h1 className="problems-title">{topic}</h1>
          <div className="problems-difficulty-badge" style={{ color: meta.color, borderColor: meta.color }}>
            <span>{meta.glyph}</span> {meta.label}
          </div>
          <p className="problems-count">
            {loading ? 'Loading...' : `${problems.length} problem${problems.length !== 1 ? 's' : ''} — sorted by acceptance`}
          </p>
        </motion.div>

        {loading ? (
          <div className="loading-state">
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Unearthing scrolls from the archives...
            </motion.p>
          </div>
        ) : error ? (
          <div className="no-problems">
            <p>{error}</p>
          </div>
        ) : problems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="no-problems"
          >
            <p>No scrolls found for this trial. Choose another path.</p>
          </motion.div>
        ) : (
          <div className="problems-grid">
            {problems.map((problem, i) => (
              <motion.div
                key={problem._id || problem.serialNo}
                className="problem-card"
                onClick={() => navigate(`/solve?id=${problem._id}&topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`)}
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * Math.min(i, 15) }}
                whileHover={{ y: -4 }}
              >
                <div className="problem-card-top" style={{ justifyContent: 'flex-end' }}>
                  <span className="problem-acceptance" style={{ color: meta.color }}>
                    ⚱ {problem.acceptance}
                  </span>
                </div>
                <h3 className="problem-title">{problem.title}</h3>
                <div className="problem-card-bottom">
                  <span className="problem-diff-glyph" style={{ color: meta.color }}>{meta.glyph}</span>
                  <span className="problem-link-arrow">Solve →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemsPage;
