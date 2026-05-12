import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import client from '../../api/client';

const TEMPLATES = {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n\n    return 0;\n}`,
    python: `def solution():\n    # Write your solution here\n    pass`,
    javascript: `/**\n * Write your solution here\n */\nfunction solution() {\n\n}`
};

const LANG_MONACO = { cpp: 'cpp', python: 'python', javascript: 'javascript' };

const monacoTheme = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A7A5A', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'D4A83C' },
        { token: 'string', foreground: 'A8C878' },
        { token: 'number', foreground: 'C8A0E0' },
    ],
    colors: {
        'editor.background': '#0F0D0B',
        'editor.foreground': '#E0D0A0',
        'editorLineNumber.foreground': '#3A3020',
        'editorCursor.foreground': '#D4A83C',
        'editor.selectionBackground': '#3A2E1A',
        'editor.lineHighlightBackground': '#181410',
    },
};

const ArenaBattle = ({ socket, roomCode, playerId, questions, startTime, initialOpponentScore }) => {
    const [activeTab, setActiveTab] = useState(0); // 0, 1, 2
    const [lang, setLang] = useState('cpp');
    
    // Load from local storage or default
    const [codes, setCodes] = useState(() => {
        const saved = localStorage.getItem(`knightcode_arena_${roomCode}_codes`);
        return saved ? JSON.parse(saved) : [TEMPLATES.cpp, TEMPLATES.cpp, TEMPLATES.cpp];
    });
    
    const [solvedStates, setSolvedStates] = useState(() => {
        const saved = localStorage.getItem(`knightcode_arena_${roomCode}_solved`);
        return saved ? JSON.parse(saved) : [false, false, false];
    });

    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState([null, null, null]);
    const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
    const [opponentScore, setOpponentScore] = useState(initialOpponentScore || 0);

    const timerRef = useRef(null);

    // Sync codes to localStorage
    useEffect(() => {
        localStorage.setItem(`knightcode_arena_${roomCode}_codes`, JSON.stringify(codes));
    }, [codes, roomCode]);

    // Sync solved to localStorage
    useEffect(() => {
        localStorage.setItem(`knightcode_arena_${roomCode}_solved`, JSON.stringify(solvedStates));
    }, [solvedStates, roomCode]);

    // Timer logic
    useEffect(() => {
        if (!startTime) return;
        
        const updateTimer = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const remaining = (20 * 60) - elapsed;
            
            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(timerRef.current);
                socket.emit('timeUp', { roomCode });
            } else {
                setTimeLeft(remaining);
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => clearInterval(timerRef.current);
    }, [startTime, roomCode, socket]);

    // Socket listeners for opponent progress
    useEffect(() => {
        if (!socket) return;

        const handleProgress = (data) => {
            setOpponentScore(data.opponentScore);
        };

        socket.on('opponentProgress', handleProgress);
        return () => socket.off('opponentProgress', handleProgress);
    }, [socket]);

    const handleMount = (editor, monaco) => {
        monaco.editor.defineTheme('codex', monacoTheme);
        monaco.editor.setTheme('codex');
    };

    const handleLangChange = (e) => {
        const l = e.target.value;
        setLang(l);
        // We only overwrite if it's empty or still a template to avoid destroying user code
        const newCodes = [...codes];
        if (newCodes[activeTab] === TEMPLATES.cpp || newCodes[activeTab] === TEMPLATES.python || newCodes[activeTab] === TEMPLATES.javascript || !newCodes[activeTab]) {
            newCodes[activeTab] = TEMPLATES[l];
            setCodes(newCodes);
        }
    };

    const handleCodeChange = (val) => {
        const newCodes = [...codes];
        newCodes[activeTab] = val || '';
        setCodes(newCodes);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleSubmit = async () => {
        const currentQ = questions[activeTab];
        if (!currentQ || solvedStates[activeTab]) return;

        setSubmitting(true);
        const newResults = [...results];
        newResults[activeTab] = null;
        setResults(newResults);

        try {
            const qObj = currentQ.question;
            const res = await client.post('/problems/submit', {
                id: qObj._id,
                topic: currentQ.topic,
                difficulty: currentQ.difficulty,
                language: lang,
                code: codes[activeTab]
            });

            newResults[activeTab] = res.data;
            setResults([...newResults]);

            if (res.data.overallStatus === 'Accepted') {
                const newSolved = [...solvedStates];
                newSolved[activeTab] = true;
                setSolvedStates(newSolved);

                const newScore = newSolved.filter(s => s).length;
                socket.emit('progressUpdate', { roomCode, playerId, score: newScore });
            }
        } catch (err) {
            newResults[activeTab] = { overallStatus: 'Error', message: err.response?.data?.message || 'Submission failed.' };
            setResults([...newResults]);
        } finally {
            setSubmitting(false);
        }
    };

    const currentQuestion = questions[activeTab]?.question;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#F0E0B0' }}>
            {/* Header: Timer and Opponent Progress */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 20px',
                background: 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(184, 144, 42, 0.3)',
                fontFamily: "'Fira Code', monospace"
            }}>
                <div style={{ fontSize: '1.2rem', color: timeLeft <= 60 ? '#C05A4A' : '#D4A83C' }}>
                    <span style={{ marginRight: '10px' }}>⏳</span>
                    {formatTime(timeLeft)}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#8A7A5A', fontSize: '0.9rem' }}>Opponent:</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: i < opponentScore ? '#C05A4A' : 'transparent',
                                    border: '1px solid #C05A4A'
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Panel: Problem Description */}
                <div style={{ flex: 1, borderRight: '1px solid rgba(184, 144, 42, 0.3)', display: 'flex', flexDirection: 'column' }}>
                    {/* Question Tabs */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid #3A2E1A' }}>
                        {[0, 1, 2].map(i => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: activeTab === i ? 'rgba(184, 144, 42, 0.1)' : 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === i ? '2px solid #D4A83C' : '2px solid transparent',
                                    color: activeTab === i ? '#D4A83C' : '#8A7A5A',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Q{i + 1}
                                {solvedStates[i] && <span style={{ color: '#A8C878', fontSize: '0.8rem' }}>✓</span>}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif' }}>
                        <h2 style={{ color: '#E0D0A0', marginBottom: '15px' }}>{currentQuestion?.title}</h2>
                        <div style={{ whiteSpace: 'pre-wrap', color: '#C8B890', lineHeight: '1.6' }}>
                            {/* In a real scenario we might need to parse HTML, but assuming it's text/html */}
                            <div dangerouslySetInnerHTML={{ __html: currentQuestion?.description }} />
                        </div>
                        
                        {currentQuestion?.example && (
                            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #3A2E1A' }}>
                                <h4 style={{ color: '#A8C878', marginBottom: '10px' }}>Example:</h4>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: "'Fira Code', monospace", margin: 0, color: '#D4C8A0' }}>
                                    {currentQuestion.example}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3A2E1A' }}>
                        <select 
                            value={lang} 
                            onChange={handleLangChange}
                            style={{
                                background: 'transparent',
                                color: '#D4A83C',
                                border: '1px solid #D4A83C',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="cpp">C++</option>
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                        </select>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {results[activeTab] && (
                                <span style={{ 
                                    color: results[activeTab].overallStatus === 'Accepted' ? '#A8C878' : '#C05A4A',
                                    fontWeight: 'bold'
                                }}>
                                    {results[activeTab].overallStatus}
                                </span>
                            )}
                            <button 
                                onClick={handleSubmit}
                                disabled={submitting || solvedStates[activeTab]}
                                style={{
                                    padding: '6px 20px',
                                    background: solvedStates[activeTab] ? '#4A5A3A' : '#D4A83C',
                                    color: solvedStates[activeTab] ? '#8A9A7A' : '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: (submitting || solvedStates[activeTab]) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? 'Running...' : (solvedStates[activeTab] ? 'Solved' : 'Submit')}
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, position: 'relative' }}>
                        {solvedStates[activeTab] && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.7)',
                                zIndex: 10,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#A8C878',
                                fontSize: '2rem',
                                fontWeight: 'bold'
                            }}>
                                Solved! ✓
                            </div>
                        )}
                        <Editor
                            height="100%"
                            language={LANG_MONACO[lang]}
                            value={codes[activeTab]}
                            onChange={handleCodeChange}
                            onMount={handleMount}
                            options={{
                                fontSize: 14,
                                fontFamily: "'Fira Code', monospace",
                                minimap: { enabled: false },
                                lineNumbers: 'on',
                                tabSize: 4,
                                padding: { top: 12 }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArenaBattle;
