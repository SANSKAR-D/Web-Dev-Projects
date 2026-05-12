import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar.jsx';
import SacredGeometryCanvas from '../components/three/SacredGeometryCanvas.jsx';
import ArenaLobby from '../components/arena/ArenaLobby.jsx';
import ArenaBattle from '../components/arena/ArenaBattle.jsx';
import ArenaResults from '../components/arena/ArenaResults.jsx';
import { io } from 'socket.io-client';
import usePageTitle from '../hooks/usePageTitle.js';

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const Arena = () => {
    usePageTitle('Arena');
    const [socket, setSocket] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [view, setView] = useState('lobby'); // 'lobby', 'battle', 'results'
    const [roomCode, setRoomCode] = useState('');
    const [questions, setQuestions] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [opponentScore, setOpponentScore] = useState(0);

    // Initialize or fetch Player ID
    useEffect(() => {
        let storedId = localStorage.getItem('knightcode_arena_player_id');
        if (!storedId) {
            storedId = generateUUID();
            localStorage.setItem('knightcode_arena_player_id', storedId);
        }
        setPlayerId(storedId);
    }, []);

    useEffect(() => {
        if (!playerId) return;

        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const newSocket = io(backendUrl);
        setSocket(newSocket);

        // Check for active room to reconnect
        const activeRoom = localStorage.getItem('knightcode_arena_active_room');
        if (activeRoom) {
            newSocket.emit('reconnectArena', { roomCode: activeRoom, playerId });
            setRoomCode(activeRoom);
        }

        return () => newSocket.close();
    }, [playerId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('matchReady', (data) => {
            socket.emit('startBattle', { roomCode: data.roomCode });
        });

        socket.on('battleStarted', (data) => {
            setQuestions(data.questions);
            setStartTime(data.startTime);
            setView('battle');
            localStorage.setItem('knightcode_arena_active_room', roomCode);
            localStorage.setItem(`knightcode_arena_${roomCode}_q`, JSON.stringify(data.questions));
            localStorage.setItem(`knightcode_arena_${roomCode}_start`, data.startTime.toString());
        });

        socket.on('reconnectSuccess', (data) => {
            if (data.status === 'playing') {
                setQuestions(data.questions);
                setStartTime(data.startTime);
                setOpponentScore(data.opponentScore);
                setView('battle');
                
                // Sync back to local storage just in case
                localStorage.setItem(`knightcode_arena_${roomCode}_q`, JSON.stringify(data.questions));
                localStorage.setItem(`knightcode_arena_${roomCode}_start`, data.startTime.toString());
            } else if (data.status === 'ready' || data.status === 'waiting') {
                setView('lobby');
            } else {
                handleLeaveArena(); // Clean up if finished or invalid
            }
        });

        socket.on('arenaError', (data) => {
            console.error('Arena Error:', data.message);
            if (data.message.includes('not found') || data.message.includes('not part')) {
                handleLeaveArena(); // Clean up invalid local storage
            }
        });

        socket.on('matchEnd', (data) => {
            setResultData(data);
            setView('results');
            // We keep the local storage until they explicitly click "Leave Arena" 
            // so they don't lose the result screen if they refresh.
            localStorage.setItem(`knightcode_arena_${roomCode}_result`, JSON.stringify(data));
        });

        socket.on('opponentDisconnected', (data) => {
            if (data?.explicit) {
                alert('Your opponent has left the Arena.');
            } else {
                alert('Your opponent disconnected, but they might return. The match continues!');
            }
        });

        return () => {
            socket.off('matchReady');
            socket.off('battleStarted');
            socket.off('reconnectSuccess');
            socket.off('arenaError');
            socket.off('matchEnd');
            socket.off('opponentDisconnected');
        };
    }, [socket, roomCode]);

    // Check if we need to restore a result screen on refresh
    useEffect(() => {
        if (!roomCode) return;
        const savedResult = localStorage.getItem(`knightcode_arena_${roomCode}_result`);
        if (savedResult && view !== 'results') {
            setResultData(JSON.parse(savedResult));
            setView('results');
        }
    }, [roomCode, view]);


    const handleRoomCreated = (code) => {
        setRoomCode(code);
        localStorage.setItem('knightcode_arena_active_room', code);
    };

    const handleRoomJoined = (code) => {
        setRoomCode(code);
        localStorage.setItem('knightcode_arena_active_room', code);
    };

    const handleLeaveArena = () => {
        if (socket && roomCode) {
            socket.emit('leaveArena', { roomCode });
        }
        
        // Clean up local storage
        if (roomCode) {
            localStorage.removeItem(`knightcode_arena_${roomCode}_q`);
            localStorage.removeItem(`knightcode_arena_${roomCode}_start`);
            localStorage.removeItem(`knightcode_arena_${roomCode}_codes`);
            localStorage.removeItem(`knightcode_arena_${roomCode}_solved`);
            localStorage.removeItem(`knightcode_arena_${roomCode}_result`);
        }
        localStorage.removeItem('knightcode_arena_active_room');
        
        setView('lobby');
        setRoomCode('');
        setQuestions([]);
        setStartTime(null);
        setResultData(null);
        setOpponentScore(0);
    };

    return (
        <div style={{ minHeight: '100vh', width: '100vw', background: '#0D0B09', position: 'relative', overflowX: 'hidden' }}>
            <SacredGeometryCanvas />

            {/* Ambient background decorations */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
                {/* Glowing orbs */}
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,60,0.07) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'orb1 8s ease-in-out infinite alternate' }} />
                <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,90,74,0.08) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'orb2 10s ease-in-out infinite alternate' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,144,42,0.04) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'orb3 12s ease-in-out infinite alternate' }} />

                {/* Subtle grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(184,144,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,144,42,0.03) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

                {/* Corner vignette */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

                {/* Floating particles */}
                {[...Array(12)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: `${2 + (i % 3)}px`,
                        height: `${2 + (i % 3)}px`,
                        borderRadius: '50%',
                        background: i % 2 === 0 ? 'rgba(212,168,60,0.5)' : 'rgba(192,90,74,0.4)',
                        left: `${(i * 8.3) % 100}%`,
                        top: `${(i * 13.7) % 100}%`,
                        animation: `float${(i % 3) + 1} ${6 + i}s ease-in-out infinite`,
                        boxShadow: `0 0 6px ${i % 2 === 0 ? 'rgba(212,168,60,0.6)' : 'rgba(192,90,74,0.5)'}`
                    }} />
                ))}
            </div>

            <style>{`
                @keyframes orb1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
                @keyframes orb2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,-40px) scale(1.15); } }
                @keyframes orb3 { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.08); } }
                @keyframes float1 { 0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; } 50% { transform: translateY(-30px) rotate(180deg); opacity: 1; } }
                @keyframes float2 { 0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; } 50% { transform: translateY(-50px) rotate(90deg); opacity: 0.9; } }
                @keyframes float3 { 0%,100% { transform: translateY(0px); opacity: 0.3; } 50% { transform: translateY(-20px); opacity: 0.8; } }
            `}</style>

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                
                <div style={{ flex: 1, padding: '20px', paddingTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '1200px', 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: view === 'battle' ? 'rgba(13, 11, 9, 0.8)' : 'transparent',
                        borderRadius: '16px',
                        border: view === 'battle' ? '1px solid rgba(184, 144, 42, 0.3)' : 'none',
                        overflow: 'hidden',
                        boxShadow: view === 'battle' ? '0 10px 40px rgba(0,0,0,0.8)' : 'none'
                    }}>
                        {view === 'lobby' && (
                            <ArenaLobby 
                                socket={socket} 
                                playerId={playerId}
                                onRoomCreated={handleRoomCreated}
                                onJoinRoom={handleRoomJoined} 
                            />
                        )}
                        {view === 'battle' && (
                            <ArenaBattle 
                                socket={socket} 
                                roomCode={roomCode}
                                playerId={playerId}
                                questions={questions}
                                startTime={startTime}
                                initialOpponentScore={opponentScore}
                            />
                        )}
                        {view === 'results' && (
                            <ArenaResults 
                                resultData={resultData}
                                currentId={playerId}
                                onPlayAgain={handleLeaveArena}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Arena;