import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ArenaLobby = ({ socket, playerId, onRoomCreated, onJoinRoom }) => {
    const [joinCode, setJoinCode] = useState('');
    const [status, setStatus] = useState('idle');
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCreateArena = () => {
        setStatus('creating');
        setError('');
        socket.emit('createArena', { playerId });
    };

    const handleJoinArena = () => {
        if (!joinCode || joinCode.length !== 6) {
            setError('Please enter a valid 6-character code.');
            return;
        }
        setStatus('joining');
        setError('');
        socket.emit('joinArena', { roomCode: joinCode.toUpperCase(), playerId });
        onJoinRoom(joinCode.toUpperCase());
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    React.useEffect(() => {
        if (!socket) return;

        const handleArenaCreated = (data) => {
            setRoomCode(data.roomCode);
            setStatus('waiting');
            onRoomCreated(data.roomCode);
        };

        const handleArenaError = (data) => {
            setError(data.message);
            setStatus('idle');
        };

        socket.on('arenaCreated', handleArenaCreated);
        socket.on('arenaError', handleArenaError);

        return () => {
            socket.off('arenaCreated', handleArenaCreated);
            socket.off('arenaError', handleArenaError);
        };
    }, [socket, onRoomCreated]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            color: '#F0E0B0',
            fontFamily: "'Fira Code', monospace",
            padding: '20px'
        }}>
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    background: 'rgba(13, 11, 9, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    padding: '48px 40px',
                    borderRadius: '20px',
                    border: '1px solid rgba(184, 144, 42, 0.2)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 30px rgba(184, 144, 42, 0.03)',
                    textAlign: 'center',
                    maxWidth: '440px',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Top gold accent line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent, #D4A83C, #E8C060, #D4A83C, transparent)'
                }} />

                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>⚔️</div>
                <h1 style={{ 
                    color: '#D4A83C', marginBottom: '8px', 
                    fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
                    fontSize: '1.8rem',
                    textShadow: '0 2px 20px rgba(212, 168, 60, 0.3)'
                }}>
                    Knight's Arena
                </h1>
                <p style={{ color: '#6A5A3A', fontSize: '0.8rem', marginBottom: '30px', letterSpacing: '1px' }}>
                    1v1 Battle · 3 Questions · 20 Minutes
                </p>

                <AnimatePresence mode="wait">
                    {status === 'waiting' ? (
                        <motion.div 
                            key="waiting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ padding: '10px 0' }}
                        >
                            <div style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '6px 14px', borderRadius: '20px',
                                background: 'rgba(109, 191, 138, 0.1)',
                                border: '1px solid rgba(109, 191, 138, 0.3)',
                                marginBottom: '20px'
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6DBF8A', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ color: '#6DBF8A', fontSize: '0.8rem' }}>Arena Active</span>
                            </div>

                            <p style={{ color: '#9A8060', marginBottom: '12px', fontSize: '0.85rem' }}>
                                Share this code with your opponent
                            </p>
                            
                            <motion.div 
                                onClick={copyCode}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    fontSize: '2.2rem',
                                    letterSpacing: '8px',
                                    fontWeight: 'bold',
                                    padding: '18px 24px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(212, 168, 60, 0.3)',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                    cursor: 'pointer',
                                    color: '#E8C060',
                                    transition: 'border-color 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                {roomCode}
                                <div style={{ 
                                    position: 'absolute', bottom: '-22px', left: '50%', transform: 'translateX(-50%)',
                                    fontSize: '0.7rem', color: copied ? '#6DBF8A' : '#5A4A3A',
                                    transition: 'color 0.2s ease'
                                }}>
                                    {copied ? '✓ Copied!' : 'Click to copy'}
                                </div>
                            </motion.div>

                            <motion.p 
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ color: '#D4C8A0', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '30px' }}
                            >
                                ⏳ Waiting for opponent...
                            </motion.p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="actions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                        >
                            <motion.button 
                                onClick={handleCreateArena}
                                disabled={status !== 'idle'}
                                whileHover={status === 'idle' ? { scale: 1.02 } : {}}
                                whileTap={status === 'idle' ? { scale: 0.98 } : {}}
                                style={{
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, rgba(212,168,60,0.15), rgba(212,168,60,0.05))',
                                    border: '1px solid rgba(212,168,60,0.4)',
                                    color: '#E8C060',
                                    borderRadius: '12px',
                                    cursor: status === 'idle' ? 'pointer' : 'not-allowed',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    fontFamily: "'Playfair Display', serif",
                                    letterSpacing: '1px',
                                    transition: 'all 0.3s ease',
                                    opacity: status !== 'idle' ? 0.5 : 1
                                }}
                            >
                                {status === 'creating' ? '⟳ Summoning Arena...' : '⚔ Create Arena'}
                            </motion.button>

                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px',
                                color: 'rgba(184,144,42,0.3)', fontSize: '0.7rem',
                                textTransform: 'uppercase', letterSpacing: '3px'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,144,42,0.2))' }} />
                                OR
                                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(184,144,42,0.2), transparent)' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    placeholder="ABCDEF"
                                    maxLength={6}
                                    style={{
                                        flex: 1,
                                        padding: '12px 14px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(184,144,42,0.2)',
                                        color: '#F0E0B0',
                                        borderRadius: '10px',
                                        textTransform: 'uppercase',
                                        textAlign: 'center',
                                        letterSpacing: '4px',
                                        fontSize: '1rem',
                                        fontFamily: "'Fira Code', monospace",
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(212,168,60,0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(184,144,42,0.2)'}
                                />
                                <motion.button 
                                    onClick={handleJoinArena}
                                    disabled={status !== 'idle' || !joinCode}
                                    whileHover={(status === 'idle' && joinCode) ? { scale: 1.03 } : {}}
                                    whileTap={(status === 'idle' && joinCode) ? { scale: 0.97 } : {}}
                                    style={{
                                        padding: '12px 22px',
                                        background: 'linear-gradient(135deg, #B8902A, #D4A83C)',
                                        border: 'none',
                                        color: '#0D0B09',
                                        borderRadius: '10px',
                                        cursor: status === 'idle' && joinCode ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        letterSpacing: '1px',
                                        opacity: (!joinCode || status !== 'idle') ? 0.5 : 1,
                                        transition: 'opacity 0.2s ease'
                                    }}
                                >
                                    {status === 'joining' ? '...' : 'Join'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ 
                                marginTop: '20px', color: '#C05A4A', fontSize: '0.85rem',
                                padding: '10px 16px', borderRadius: '10px',
                                background: 'rgba(192, 90, 74, 0.1)',
                                border: '1px solid rgba(192, 90, 74, 0.2)'
                            }}
                        >
                            ⚠ {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.5); }
                }
            `}</style>
        </div>
    );
};

export default ArenaLobby;
