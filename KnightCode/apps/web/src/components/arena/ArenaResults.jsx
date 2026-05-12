import React from 'react';
import { motion } from 'framer-motion';

const ArenaResults = ({ resultData, currentId, onPlayAgain }) => {
    
    // resultData has: { winnerId, p1: {playerId, score, timeFinished}, p2: {playerId, score, timeFinished}, reason }
    const { winnerId, p1, p2, reason } = resultData;
    
    const isP1 = p1.playerId === currentId;
    const myData = isP1 ? p1 : p2;
    const oppData = isP1 ? p2 : p1;

    let title = "Match Over";
    let color = "#D4A83C"; // Gold

    if (winnerId === 'draw') {
        title = "It's a Draw!";
        color = "#A0A0A0"; // Silver
    } else if (winnerId === currentId) {
        title = "Victory!";
        color = "#A8C878"; // Green
    } else {
        title = "Defeat!";
        color = "#C05A4A"; // Red
    }

    const formatTime = (timeTakenMs) => {
        if (!timeTakenMs) return '--:--';
        const seconds = Math.floor(timeTakenMs / 1000);
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            color: '#F0E0B0',
            fontFamily: "'Fira Code', monospace"
        }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: 'rgba(13, 11, 9, 0.9)',
                    padding: '50px',
                    borderRadius: '16px',
                    border: `2px solid ${color}`,
                    boxShadow: `0 10px 40px rgba(0,0,0,0.8), inset 0 0 30px ${color}33`,
                    textAlign: 'center',
                    maxWidth: '500px',
                    width: '100%'
                }}
            >
                <h1 style={{ color: color, marginBottom: '10px', fontFamily: 'Playfair Display, serif', fontSize: '3rem' }}>
                    {title}
                </h1>
                <p style={{ color: '#8A7A5A', marginBottom: '30px', fontStyle: 'italic' }}>
                    {reason}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', gap: '20px' }}>
                    {/* You */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ color: '#D4A83C', marginBottom: '15px' }}>You</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>{myData.score}/3</div>
                        <div style={{ color: '#8A7A5A', fontSize: '0.9rem' }}>Solved</div>
                    </div>

                    {/* Opponent */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ color: '#D4A83C', marginBottom: '15px' }}>Opponent</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>{oppData.score}/3</div>
                        <div style={{ color: '#8A7A5A', fontSize: '0.9rem' }}>Solved</div>
                    </div>
                </div>

                <button 
                    onClick={onPlayAgain}
                    style={{
                        padding: '12px 30px',
                        background: color,
                        border: 'none',
                        color: '#0D0B09',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        transition: 'opacity 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = 0.8}
                    onMouseOut={(e) => e.target.style.opacity = 1}
                >
                    Leave Arena
                </button>
            </motion.div>
        </div>
    );
};

export default ArenaResults;
