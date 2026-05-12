import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ArenaLobby = ({ socket, playerId, onRoomCreated, onJoinRoom }) => {
    const [joinCode, setJoinCode] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'creating', 'waiting', 'joining'
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

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

    // Listen for socket events specific to the lobby
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
            fontFamily: "'Fira Code', monospace"
        }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'rgba(13, 11, 9, 0.8)',
                    padding: '40px',
                    borderRadius: '16px',
                    border: '1px solid rgba(184, 144, 42, 0.3)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(184, 144, 42, 0.05)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '100%'
                }}
            >
                <h1 style={{ color: '#D4A83C', marginBottom: '30px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>
                    Knight's Arena
                </h1>

                {status === 'idle' || status === 'creating' || status === 'joining' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <button 
                            onClick={handleCreateArena}
                            disabled={status !== 'idle'}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid #D4A83C',
                                color: '#D4A83C',
                                borderRadius: '4px',
                                cursor: status === 'idle' ? 'pointer' : 'not-allowed',
                                fontSize: '1.1rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {status === 'creating' ? 'Summoning Arena...' : 'Create Arena'}
                        </button>

                        <div style={{ margin: '10px 0', color: '#6A5A3A' }}>OR</div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter 6-char Code"
                                maxLength={6}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid #3A2E1A',
                                    color: '#F0E0B0',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    textAlign: 'center',
                                    letterSpacing: '2px'
                                }}
                            />
                            <button 
                                onClick={handleJoinArena}
                                disabled={status !== 'idle' || !joinCode}
                                style={{
                                    padding: '10px 20px',
                                    background: '#D4A83C',
                                    border: 'none',
                                    color: '#0D0B09',
                                    borderRadius: '4px',
                                    cursor: status === 'idle' && joinCode ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold'
                                }}
                            >
                                {status === 'joining' ? '...' : 'Join'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ color: '#A8C878', marginBottom: '15px' }}>Arena Created!</h3>
                        <p style={{ color: '#9A8060', marginBottom: '10px' }}>Share this code with your opponent:</p>
                        <div style={{
                            fontSize: '2rem',
                            letterSpacing: '5px',
                            fontWeight: 'bold',
                            padding: '15px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px dashed #D4A83C',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            {roomCode}
                        </div>
                        <p style={{ color: '#D4C8A0', fontSize: '0.9rem', fontStyle: 'italic' }} className="pulsing-text">
                            Waiting for opponent to join...
                        </p>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '20px', color: '#C05A4A', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ArenaLobby;
