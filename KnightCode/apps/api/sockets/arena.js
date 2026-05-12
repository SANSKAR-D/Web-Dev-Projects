const Topic = require('../models/Problem.model');

// Store active arenas in memory
// Map of roomCode -> { 
//   p1: { playerId, socketId, score, timeFinished }, 
//   p2: { playerId, socketId, score, timeFinished }, 
//   status: 'waiting' | 'ready' | 'playing' | 'finished', 
//   questions: [], 
//   startTime: Date 
// }
const activeArenas = new Map();

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected to Arena:', socket.id);

        // 1. Create Arena
        socket.on('createArena', ({ playerId }) => {
            if (!playerId) return socket.emit('arenaError', { message: 'Player ID required' });
            
            const roomCode = generateRoomCode();
            activeArenas.set(roomCode, {
                p1: { playerId, socketId: socket.id, score: 0, timeFinished: null },
                p2: null,
                status: 'waiting',
                questions: [],
                startTime: null
            });
            
            socket.join(`arena_${roomCode}`);
            socket.emit('arenaCreated', { roomCode });
            console.log(`Arena ${roomCode} created by player ${playerId}`);
        });

        // 2. Join Arena
        socket.on('joinArena', ({ roomCode, playerId }) => {
            if (!playerId) return socket.emit('arenaError', { message: 'Player ID required' });
            const arena = activeArenas.get(roomCode);
            
            if (!arena) {
                return socket.emit('arenaError', { message: 'Arena not found. Check the code.' });
            }

            // Prevent joining as p2 if already p1
            if (arena.p1.playerId === playerId) {
                return socket.emit('arenaError', { message: 'You are already in this arena. Try reconnecting.' });
            }

            if (arena.status !== 'waiting' || arena.p2 !== null) {
                return socket.emit('arenaError', { message: 'Arena is already full or in progress.' });
            }

            // Join room
            socket.join(`arena_${roomCode}`);
            arena.p2 = { playerId, socketId: socket.id, score: 0, timeFinished: null };
            arena.status = 'ready';
            
            // Notify both players that match is ready
            io.to(`arena_${roomCode}`).emit('matchReady', { roomCode });
            console.log(`Player ${playerId} joined arena ${roomCode}`);
        });

        // 3. Reconnect Arena
        socket.on('reconnectArena', ({ roomCode, playerId }) => {
            const arena = activeArenas.get(roomCode);
            if (!arena) {
                return socket.emit('arenaError', { message: 'Arena no longer exists.' });
            }

            let isP1 = arena.p1?.playerId === playerId;
            let isP2 = arena.p2?.playerId === playerId;

            if (!isP1 && !isP2) {
                return socket.emit('arenaError', { message: 'You are not part of this arena.' });
            }

            // Update socketId
            if (isP1) arena.p1.socketId = socket.id;
            if (isP2) arena.p2.socketId = socket.id;

            socket.join(`arena_${roomCode}`);
            
            // Send back current state
            socket.emit('reconnectSuccess', {
                status: arena.status,
                questions: arena.questions,
                startTime: arena.startTime,
                myScore: isP1 ? arena.p1.score : arena.p2.score,
                opponentScore: isP1 ? (arena.p2?.score || 0) : arena.p1.score
            });

            console.log(`Player ${playerId} reconnected to arena ${roomCode}`);
        });

        // 4. Start Battle
        socket.on('startBattle', async ({ roomCode }) => {
            const arena = activeArenas.get(roomCode);
            if (!arena || arena.status !== 'ready') return;

            try {
                const randomQuestions = await Topic.aggregate([
                    { $unwind: "$difficulties" },
                    { $unwind: "$difficulties.questions" },
                    { $sample: { size: 3 } },
                    { $project: {
                        _id: 0,
                        topic: "$name",
                        difficulty: "$difficulties.level",
                        question: "$difficulties.questions"
                    }}
                ]);

                arena.questions = randomQuestions;
                arena.status = 'playing';
                arena.startTime = Date.now();

                io.to(`arena_${roomCode}`).emit('battleStarted', { 
                    questions: randomQuestions,
                    startTime: arena.startTime
                });
                
                console.log(`Battle started in arena ${roomCode}`);
            } catch (err) {
                console.error("Error fetching random questions:", err);
                io.to(`arena_${roomCode}`).emit('arenaError', { message: 'Failed to start battle. Database error.' });
            }
        });

        // 5. Progress Update
        socket.on('progressUpdate', ({ roomCode, playerId, score }) => {
            const arena = activeArenas.get(roomCode);
            if (!arena || arena.status !== 'playing') return;

            const isP1 = arena.p1.playerId === playerId;
            const player = isP1 ? arena.p1 : arena.p2;
            const opponentSocketId = isP1 ? arena.p2.socketId : arena.p1.socketId;

            player.score = score;

            if (score >= 3) {
                player.timeFinished = Date.now();
                arena.status = 'finished';
                
                io.to(`arena_${roomCode}`).emit('matchEnd', {
                    winnerId: player.playerId,
                    p1: arena.p1,
                    p2: arena.p2,
                    reason: 'All questions solved'
                });
                activeArenas.delete(roomCode);
                return;
            }

            // Relay progress to opponent
            if (opponentSocketId) {
                io.to(opponentSocketId).emit('opponentProgress', { opponentScore: score });
            }
        });

        // 6. Time Up
        socket.on('timeUp', ({ roomCode }) => {
            const arena = activeArenas.get(roomCode);
            if (!arena || arena.status !== 'playing') return;

            arena.status = 'finished';

            let winnerId = null;
            if (arena.p1.score > arena.p2.score) {
                winnerId = arena.p1.playerId;
            } else if (arena.p2.score > arena.p1.score) {
                winnerId = arena.p2.playerId;
            } else {
                winnerId = 'draw';
            }

            io.to(`arena_${roomCode}`).emit('matchEnd', {
                winnerId,
                p1: arena.p1,
                p2: arena.p2,
                reason: 'Time up'
            });
            activeArenas.delete(roomCode);
        });

        // 7. Handle Disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // We NO LONGER delete the arena on disconnect to allow reconnection.
            // The match will remain alive until timeUp is called or it finishes.
        });
        
        // 8. Leave Arena explicitly
        socket.on('leaveArena', ({ roomCode }) => {
            const arena = activeArenas.get(roomCode);
            if (arena) {
                // If someone explicitly leaves, we can notify the other and delete
                io.to(`arena_${roomCode}`).emit('opponentDisconnected', { explicit: true });
                activeArenas.delete(roomCode);
            }
        });
    });
};
