import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import client from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import './SolvePage.css';

/* ── Language templates ─────────────────────────── */
const TEMPLATES = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,
  python: `def solution():
    # Write your solution here
    pass`,
  javascript: `/**
 * Write your solution here
 */
function solution() {

}`,
};

const LANG_MONACO = { cpp: 'cpp', python: 'python', javascript: 'javascript' };

const difficultyMeta = {
  easy:   { color: '#6DBF8A', label: 'Easy' },
  medium: { color: '#D4A83C', label: 'Medium' },
  hard:   { color: '#C05A4A', label: 'Hard' },
};

/* ── Helpers ─────────────────────────────────────── */
const parseProblemHTML = (raw) => {
  if (!raw) return { desc: '', example: '' };
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  
  let descText = '';
  let exampleText = '';
  let inExample = false;
  let inInput = false;

  Array.from(doc.body.childNodes).forEach(node => {
     let tagName = node.nodeName.toUpperCase();
     let text = node.textContent || '';
     let lowerTxt = text.toLowerCase().trim();
     
     if (tagName === 'H3' || tagName === 'H2' || tagName === 'H4' || tagName === 'H1' || tagName === 'B' || tagName === 'STRONG') {
         if (lowerTxt === 'problem statement' || lowerTxt === '<p> problem statement <p>' || lowerTxt === 'problem statement <p>') {
             return; // skip label
         } else if (lowerTxt === 'input' || lowerTxt.includes('input format')) {
             inInput = true;
             inExample = false;
             return;
         } else if (lowerTxt === 'output' || lowerTxt.includes('output format')) {
             inInput = true;
             inExample = false;
             return;
         } else if (lowerTxt === 'example' || lowerTxt === 'examples') {
             inInput = false;
             inExample = true;
             return;
         }
     }
     
     if (tagName === 'P' && (lowerTxt === 'problem statement' || lowerTxt === '<p> problem statement <p>' || lowerTxt === 'problem statement <p>')) {
         return; // skip
     }

     let parsedText = '';
     if (tagName === 'P' || tagName === 'DIV') {
         const clone = node.cloneNode(true);
         clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
         parsedText = clone.textContent;
     } else if (tagName === '#text') {
         parsedText = text;
     } else {
         const clone = node.cloneNode(true);
         if (clone.querySelectorAll) {
            clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
         }
         parsedText = clone.textContent;
     }

     if (inExample) {
         if (parsedText.trim()) exampleText += parsedText + '\n\n';
     } else if (!inInput) {
         let clean = parsedText.replace(/<p>\s*problem statement\s*(<p>|<\/p>)?/gi, '');
         if (clean.trim()) descText += clean + '\n\n';
     }
  });

  if (!descText.trim() && !exampleText.trim()) {
      let clean = doc.body.textContent || raw;
      clean = clean.replace(/<p>\s*problem statement\s*(<p>|<\/p>)?/gi, '');
      return { desc: clean.trim(), example: '' };
  }

  return { desc: descText.trim(), example: exampleText.trim() };
};

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
    'editorIndentGuide.background1': '#2A2010',
    'scrollbarSlider.background': '#2A2010',
  },
};

/* ── Component ───────────────────────────────────── */
const SolvePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'sanskar.20253248@mnnit.ac.in';

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || 'easy';
  const meta = difficultyMeta[difficulty] || difficultyMeta.easy;

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'example' | 'solution' | 'discussion' | 'admin'
  const [lang, setLang] = useState('cpp');
  const [code, setCode] = useState(TEMPLATES.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);

  // New Custom Test Runner States
  const [customTestCases, setCustomTestCases] = useState([{ input: '' }]);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [runTestResult, setRunTestResult] = useState(null);
  const [runningTest, setRunningTest] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState('testcases'); // 'testcases' | 'result'

  /* Fetch full question */
  const fetchQuestionData = useCallback(() => {
    if (!id || !topic || !difficulty) return;
    setLoading(true);
    client.get('/problems/question', { params: { id, topic, difficulty } })
      .then(res => {
        const data = res.data;
        if (data && data.description) {
            const parsed = parseProblemHTML(data.description);
            data.description = parsed.desc;
            data.example = parsed.example || data.example;
        }
        setQuestion(data);
        setIsSolutionRevealed(false);
        // Seed custom testcases
        if (data && data.testCases) {
           const sampleTcs = data.testCases.filter(tc => !tc.hidden).map(tc => ({ input: String(tc.input || '') }));
           if (sampleTcs.length > 0) {
             setCustomTestCases(sampleTcs.slice(0, 8));
           }
        }
        // Seed editor with solution language if available
        const solLang = res.data?.solution?.language;
        if (solLang && TEMPLATES[solLang]) {
          setLang(solLang);
          setCode(TEMPLATES[solLang]);
        }
      })
      .catch(() => setError('Failed to load problem.'))
      .finally(() => setLoading(false));
  }, [id, topic, difficulty]);

  useEffect(() => {
    fetchQuestionData();
  }, [fetchQuestionData]);

  const handleMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme('codex', monacoTheme);
    monaco.editor.setTheme('codex');
  }, []);

  const handleLangChange = (e) => {
    const l = e.target.value;
    setLang(l);
    setCode(TEMPLATES[l] || '');
  };

  const handleSubmit = async () => {
    if (!id || !topic || !difficulty) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await client.post('/problems/submit', {
        id,
        topic,
        difficulty,
        language: lang,
        code
      });
      setResult(res.data);
    } catch (err) {
      setResult({ overallStatus: 'Error', message: err.response?.data?.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunTestCases = async () => {
    if (!id || !topic || !difficulty) return;
    setRunningTest(true);
    setRunTestResult(null);
    setShowConsole(true);
    setConsoleTab('result');
    try {
      const res = await client.post('/problems/run', {
        language: lang,
        code,
        testCases: customTestCases
      });
      setRunTestResult(res.data);
    } catch (err) {
      setRunTestResult({ overallStatus: 'Error', message: err.response?.data?.message || 'Run failed.' });
    } finally {
      setRunningTest(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="solve-page">

      <div className="solve-body">
        {/* ── Left Panel ── */}
        <div className="solve-left">
          {/* Tabs */}
          <div className="solve-left-tabs">
            <button
              className={`solve-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`solve-tab-btn ${activeTab === 'example' ? 'active' : ''}`}
              onClick={() => setActiveTab('example')}
            >
              Example
            </button>
            <button
              className={`solve-tab-btn ${activeTab === 'solution' ? 'active' : ''}`}
              onClick={() => setActiveTab('solution')}
            >
              Solution
            </button>
            <button
              className={`solve-tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
              onClick={() => setActiveTab('discussion')}
            >
              Discussion
            </button>
            {isAdmin && (
               <button
                 className={`solve-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                 onClick={() => setActiveTab('admin')}
                 style={{ color: activeTab === 'admin' ? '#C05A4A' : '#A05A4A', borderBottomColor: activeTab === 'admin' ? '#C05A4A' : 'transparent' }}
               >
                 ⚙ Edit
               </button>
            )}
          </div>

          {/* Content */}
          <div className="solve-left-content">
            {loading ? (
              <div className="solve-loading">Unearthing the ancient scroll…</div>
            ) : error ? (
              <div className="solve-loading" style={{ color: '#C05A4A' }}>{error}</div>
            ) : activeTab === 'description' ? (
              <DescriptionTab question={question} meta={meta} />
            ) : activeTab === 'example' ? (
              <ExampleTab question={question} />
            ) : activeTab === 'solution' ? (
              <SolutionTab 
                question={question} 
                revealed={isSolutionRevealed} 
                onReveal={() => setIsSolutionRevealed(true)} 
              />
            ) : activeTab === 'discussion' ? (
              <DiscussionTab />
            ) : activeTab === 'admin' && isAdmin ? (
              <AdminEditTab question={question} topic={topic} difficulty={difficulty} id={id} onRefresh={fetchQuestionData} />
            ) : null}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="solve-right">
          <div className="solve-editor-header">
            <span className="solve-editor-label">Code</span>
            <select className="solve-lang-select" value={lang} onChange={handleLangChange}>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="solve-editor-wrap">
            <Editor
              height="100%"
              language={LANG_MONACO[lang]}
              value={code}
              onChange={val => setCode(val || '')}
              onMount={handleMount}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                tabSize: 4,
                wordWrap: 'off',
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          <AnimatePresence>
            {showConsole && (
              <motion.div 
                className="solve-testcases-console" 
                initial={{ height: 0 }}
                animate={{ height: '300px' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <motion.div
                  initial={{ y: 300 }}
                  animate={{ y: 0 }}
                  exit={{ y: 300 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ height: '300px' }}
                >
                  <div className="solve-console-header">
                    <button
                      className={`solve-console-tab ${consoleTab === 'testcases' ? 'active' : ''}`}
                      onClick={() => setConsoleTab('testcases')}
                    >
                      Testcases
                    </button>
                    <button
                      className={`solve-console-tab ${consoleTab === 'result' ? 'active' : ''}`}
                      onClick={() => setConsoleTab('result')}
                    >
                      Run Result
                    </button>
                    <button className="solve-console-close" onClick={() => setShowConsole(false)}>✕</button>
                  </div>
                  <div className="solve-console-body">
                    {consoleTab === 'testcases' ? (
                      <div>
                        <div className="solve-tc-tabs">
                          {customTestCases.map((_, i) => (
                            <button
                              key={i}
                              className={`solve-tc-tab ${activeTestCaseIndex === i ? 'active' : ''}`}
                              onClick={() => setActiveTestCaseIndex(i)}
                            >
                              Case {i + 1}
                            </button>
                          ))}
                          {customTestCases.length < 8 && (
                            <button
                              className="solve-tc-tab-add"
                              onClick={() => {
                                setCustomTestCases([...customTestCases, { input: '' }]);
                                setActiveTestCaseIndex(customTestCases.length);
                              }}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                        {customTestCases.length > 0 && customTestCases[activeTestCaseIndex] !== undefined && (
                          <textarea
                            className="solve-tc-textarea"
                            value={customTestCases[activeTestCaseIndex].input}
                            onChange={(e) => {
                              const newTcs = [...customTestCases];
                              newTcs[activeTestCaseIndex].input = e.target.value;
                              setCustomTestCases(newTcs);
                            }}
                            placeholder="Enter custom input here..."
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        {runningTest ? (
                          <div className="solve-loading">Scribing Runes...</div>
                        ) : runTestResult ? (
                          <div>
                            {runTestResult.overallStatus === 'Error' ? (
                               <div className="solve-run-status error">{runTestResult.message}</div>
                            ) : (
                               <>
                                 <div className="solve-run-status success">Execution Completed</div>
                                 {runTestResult.testResults && runTestResult.testResults.map((tr, i) => (
                                   <div key={i} className="solve-run-tc-result">
                                     <span className="solve-run-label">Case {i + 1}</span>
                                     <div className="solve-run-box">
                                       <span style={{color: '#8A7A5A'}}>Input:</span><br/>
                                       {tr.input}
                                     </div>
                                     <div className="solve-run-box">
                                       <span style={{color: '#8A7A5A'}}>Output:</span><br/>
                                       {tr.actual}
                                     </div>
                                   </div>
                                 ))}
                               </>
                            )}
                          </div>
                        ) : (
                          <div className="solve-console-empty">
                            Click "Run" to test your code against the custom testcases.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="solve-editor-footer">
            {result && (
              <div className={`solve-result-overlay ${result.overallStatus === 'Accepted' ? 'success' : 'failure'}`}>
                <div className="solve-result-header">
                  <span className="solve-result-status">{result.overallStatus}</span>
                  <button className="solve-result-close" onClick={() => setResult(null)}>✕</button>
                </div>
                {result.testResults ? (
                  <div className="solve-test-results">
                    {result.testResults.map((tr, i) => (
                      <div key={i} className={`solve-test-item ${tr.status === 'Accepted' ? 'passed' : 'failed'}`}>
                        <span>Test Case {i + 1}: {tr.status}</span>
                        {!tr.hidden && tr.status !== 'Accepted' && (
                          <div className="solve-test-details">
                            <div>Input: {tr.input}</div>
                            <div>Expected: {tr.expected}</div>
                            <div>Actual: {tr.actual}</div>
                          </div>
                        )}
                        {tr.hidden && <span> (Hidden)</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="solve-result-message">{result.message}</div>
                )}
              </div>
            )}
            {question?.link && (
              <a
                href={question.link}
                target="_blank"
                rel="noopener noreferrer"
                className="solve-lc-link"
              >
                ↗ Open on Polygon
              </a>
            )}
            <button 
              className="solve-btn solve-btn-run"
              onClick={() => {
                 setShowConsole(prev => !prev);
                 if (!showConsole && consoleTab !== 'result') {
                    setConsoleTab('testcases');
                 }
              }}
              style={{ marginRight: 'auto', marginLeft: question?.link ? '20px' : '0' }}
            >
              Console
            </button>
            <button
              className="solve-btn solve-btn-run"
              onClick={() => navigate(`/forge?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`)}
            >
              ← Back
            </button>
            <button
              className="solve-btn solve-btn-run"
              onClick={handleRunTestCases}
              disabled={runningTest || submitting}
            >
              {runningTest ? 'Running…' : 'Run '}
            </button>
            <button 
              className="solve-btn solve-btn-submit" 
              onClick={handleSubmit}
              disabled={submitting || runningTest}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Description sub-component ─────────────────── */
const DescriptionTab = ({ question, meta }) => (
  <>
    <h1 className="solve-problem-title">{question?.title}</h1>
    <span
      className="solve-difficulty-badge"
      style={{ color: meta.color, borderColor: meta.color }}
    >
      {meta.label}
    </span>

    <hr className="solve-divider" />

    <p className="solve-section-label">Problem Statement</p>
    <div className="solve-description" style={{ whiteSpace: 'pre-wrap' }}>
      {question?.description || 'No description available.'}
    </div>

    {question?.constraints?.length > 0 && (
      <>
        <hr className="solve-divider" />
        <p className="solve-section-label">Constraints</p>
        <ul className="solve-constraints-list">
          {question.constraints.map((c, i) => (
            <li key={i}>{String(c)}</li>
          ))}
        </ul>
      </>
    )}
  </>
);

/* ── Example sub-component ─────────────────────── */
const ExampleTab = ({ question }) => (
  <>
    {question?.example ? (
      <>
        <p className="solve-section-label">Example Scenario</p>
        <div className="solve-description" style={{ whiteSpace: 'pre-wrap', fontFamily: "'Fira Code', 'Courier New', monospace", background: '#181410', padding: '16px', borderRadius: '8px', border: '1px solid #3A2E1A' }}>
          {question.example}
        </div>
      </>
    ) : (
      <p style={{ color: '#6A5A3A', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}>
        No specific example scenario found.
      </p>
    )}
    
    {question?.testCases?.length > 0 && (
      <>
        <hr className="solve-divider" />
        <p className="solve-section-label">Sample Data</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {question.testCases.filter(tc => !tc.hidden).map((tc, index) => (
            <div key={index} className="solve-testcase">
              <div className="solve-testcase-label">Sample {index + 1}</div>
              <div className="solve-testcase-row">
                <span className="solve-testcase-key">Input:</span>
                <span className="solve-testcase-val">{String(tc.input)}</span>
              </div>
              <div className="solve-testcase-row">
                <span className="solve-testcase-key">Expected:</span>
                <span className="solve-testcase-val">{String(tc.expectedOutput)}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </>
);

/* ── Solution sub-component ─────────────────────── */
const SolutionTab = ({ question, revealed, onReveal }) => {
  const sol = question?.solution;
  if (!sol) {
    return (
      <p style={{ color: '#6A5A3A', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}>
        No solution available for this problem.
      </p>
    );
  }

  if (!revealed) {
    return (
      <div className="solve-solution-warning" style={{
        background: '#181410',
        border: '1px solid #3A2E1A',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        marginTop: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px', color: '#D4A83C' }}>📜</div>
        <h2 style={{ 
          fontFamily: 'Playfair Display, serif', 
          color: '#D4A83C', 
          fontSize: '1.6rem', 
          fontStyle: 'italic',
          marginBottom: '16px' 
        }}>Seeker, beware!</h2>
        <p style={{ 
          color: '#D4C8A0', 
          fontFamily: 'IM Fell English, serif', 
          lineHeight: '1.6', 
          marginBottom: '24px',
          fontSize: '1.1rem'
        }}>
          Thou art about to gaze upon the ancient solution transcripts. 
          Dost thou truly wish to exploit the arcane knowledge and sacrifice the sacred fun of solving this trial by thine own hand?
        </p>
        <button 
          className="solve-btn solve-btn-submit" 
          style={{ width: 'auto', padding: '10px 24px', fontSize: '0.9rem' }}
          onClick={onReveal}
        >
          Reveal the Ancient Scroll
        </button>
      </div>
    );
  }

  const langLabel = { cpp: 'C++', python: 'Python', javascript: 'JavaScript' }[sol.language] || sol.language;
  return (
    <>
      <div className="solve-solution-meta">
        {sol.language && (
          <div className="solve-solution-meta-item">
            <span className="solve-solution-meta-key">Language</span>
            <span className="solve-solution-meta-val">{langLabel}</span>
          </div>
        )}
        {sol.timeComplexity && (
          <div className="solve-solution-meta-item">
            <span className="solve-solution-meta-key">Time</span>
            <span className="solve-solution-meta-val">{sol.timeComplexity}</span>
          </div>
        )}
        {sol.spaceComplexity && (
          <div className="solve-solution-meta-item">
            <span className="solve-solution-meta-key">Space</span>
            <span className="solve-solution-meta-val">{sol.spaceComplexity}</span>
          </div>
        )}
      </div>

      {sol.explanation && (
        <>
          <p className="solve-section-label">Approach</p>
          <div className="solve-solution-explanation">{sol.explanation}</div>
        </>
      )}

      {sol.code && (
        <>
          <p className="solve-section-label">Code</p>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #2E2718' }}>
            <Editor
              height="340px"
              language={sol.language === 'cpp' ? 'cpp' : sol.language || 'cpp'}
              value={sol.code}
              options={{
                readOnly: true,
                fontSize: 13,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'off',
                padding: { top: 10 },
              }}
              onMount={(editor, monaco) => {
                monaco.editor.defineTheme('codex', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    { token: 'keyword', foreground: 'D4A83C' },
                    { token: 'string', foreground: 'A8C878' },
                    { token: 'comment', foreground: '6A7A5A', fontStyle: 'italic' },
                    { token: 'number', foreground: 'C8A0E0' },
                  ],
                  colors: {
                    'editor.background': '#0F0D0B',
                    'editor.foreground': '#E0D0A0',
                    'editorLineNumber.foreground': '#3A3020',
                  },
                });
                monaco.editor.setTheme('codex');
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

/* ── Discussion sub-component ───────────────────── */
const DiscussionTab = () => (
  <>
    <p className="solve-section-label">Discussion</p>

    {/* Pinned message */}
    <div style={{
      background: '#181410',
      border: '1px solid #3A2E1A',
      borderLeft: '3px solid #D4A83C',
      borderRadius: '8px',
      padding: '14px 16px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{
          background: '#D4A83C22',
          color: '#D4A83C',
          fontFamily: 'IM Fell English, serif',
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '20px',
          border: '1px solid #D4A83C55',
        }}>📌 Pinned</span>
        <span style={{ color: '#6A5A3A', fontFamily: 'IM Fell English, serif', fontSize: '0.82rem' }}>
          KnightCode Sage
        </span>
      </div>
      <p style={{
        color: '#D4C8A0',
        fontFamily: 'IM Fell English, serif',
        fontSize: '1rem',
        lineHeight: '1.7',
        margin: 0,
      }}>
        ⚔️ Only the solution with the <strong style={{ color: '#D4A83C' }}>best time complexity</strong> has been submitted here.
        All other approaches will result in a <strong style={{ color: '#C05A4A' }}>Time Limit Exceeded (TLE)</strong>.
        Study the solution's time &amp; space complexity carefully before attempting to optimise further.
      </p>
    </div>

    <p style={{ color: '#4A3A2A', fontFamily: 'IM Fell English, serif', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', marginTop: '24px' }}>
      Community discussion coming soon…
    </p>
  </>
);

/* ── Admin Edit sub-component ───────────────────── */
const AdminEditTab = ({ question, topic, difficulty, id, onRefresh }) => {
  const [desc, setDesc] = useState(question?.description || '');
  const [example, setExample] = useState(question?.example || '');
  const [constraints, setConstraints] = useState(
    (question?.constraints || []).join('\n')
  );
  const [testCases, setTestCases] = useState(JSON.parse(JSON.stringify(question?.testCases || [])));
  const [solution, setSolution] = useState(question?.solution || { language: 'cpp', timeComplexity: '', spaceComplexity: '', explanation: '', code: '' });
  const [saving, setSaving] = useState(false);

  // When question changes (due to refresh), update local state
  useEffect(() => {
    if (question) {
      setDesc(question.description || '');
      setExample(question.example || '');
      setConstraints((question.constraints || []).join('\n'));
      setTestCases(JSON.parse(JSON.stringify(question.testCases || [])));
      setSolution(question.solution || { language: 'cpp', timeComplexity: '', spaceComplexity: '', explanation: '', code: '' });
    }
  }, [question]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
         description: desc,
         example,
         constraints: constraints.split('\n').map(c => c.trim()).filter(c => c),
         testCases,
         solution
      };
      await client.put('/problems/question', { id, topic, difficulty, updates });
      alert('Problem Updated! ⚔️');
      onRefresh();
    } catch (err) {
      alert('Error saving. 💀');
    } finally {
      setSaving(false);
    }
  };

  const updateTc = (index, field, val) => {
    const newTc = [...testCases];
    newTc[index][field] = val;
    setTestCases(newTc);
  };
  const addTc = () => setTestCases([...testCases, { input: '', expectedOutput: '', hidden: false }]);
  const removeTc = (index) => setTestCases(testCases.filter((_, i) => i !== index));

  return (
    <div className="admin-edit-container">
       <h2 style={{ color: '#D4A83C', marginTop: 0 }}>⚙️ Reforge Problem</h2>
       <p className="solve-section-label">Raw Description (HTML/Text)</p>
       <textarea value={desc} onChange={e => setDesc(e.target.value)} className="admin-textarea" rows={8} />

       <p className="solve-section-label">Example Scenario</p>
       <textarea value={example} onChange={e => setExample(e.target.value)} className="admin-textarea" rows={6} />

       <p className="solve-section-label">Constraints (One per line)</p>
       <textarea value={constraints} onChange={e => setConstraints(e.target.value)} className="admin-textarea" rows={4} />

       <hr className="solve-divider" />
       <p className="solve-section-label">Test Cases</p>
       {testCases.map((tc, i) => (
         <div key={i} className="admin-tc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{color: '#D4A83C', fontWeight: 'bold'}}>Case {i+1}</span>
               <button onClick={() => removeTc(i)} style={{ background: '#C05A4A', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>✕ Remove</button>
            </div>
            <label>Input:</label>
            <textarea value={tc.input || ''} onChange={e => updateTc(i, 'input', e.target.value)} className="admin-textarea" rows={2} />
            <label>Expected Output:</label>
            <textarea value={tc.expectedOutput || ''} onChange={e => updateTc(i, 'expectedOutput', e.target.value)} className="admin-textarea" rows={2} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer' }}>
               <input type="checkbox" checked={tc.hidden || false} onChange={e => updateTc(i, 'hidden', e.target.checked)} />
               Hidden Test Case
            </label>
         </div>
       ))}
       <button onClick={addTc} className="solve-tab-btn" style={{ marginBottom: '20px', border: '1px solid #D4A83C', width: 'fit-content' }}>+ Add Testcase</button>

       <hr className="solve-divider" />
       <p className="solve-section-label">Optimal Solution Data</p>
       <label style={{color: '#8A7A5A', fontSize: '0.8rem'}}>Language:</label>
       <input value={solution.language || ''} onChange={e => setSolution({...solution, language: e.target.value})} className="admin-input" />
       <label style={{color: '#8A7A5A', fontSize: '0.8rem'}}>Time Complexity:</label>
       <input value={solution.timeComplexity || ''} onChange={e => setSolution({...solution, timeComplexity: e.target.value})} className="admin-input" />
       <label style={{color: '#8A7A5A', fontSize: '0.8rem'}}>Space Complexity:</label>
       <input value={solution.spaceComplexity || ''} onChange={e => setSolution({...solution, spaceComplexity: e.target.value})} className="admin-input" />
       <label style={{color: '#8A7A5A', fontSize: '0.8rem'}}>Explanation:</label>
       <textarea value={solution.explanation || ''} onChange={e => setSolution({...solution, explanation: e.target.value})} className="admin-textarea" rows={4} />
       <label style={{color: '#8A7A5A', fontSize: '0.8rem'}}>Code:</label>
       <textarea value={solution.code || ''} onChange={e => setSolution({...solution, code: e.target.value})} className="admin-textarea" rows={8} style={{ fontFamily: 'monospace' }} />

       <button onClick={handleSave} disabled={saving} className="solve-btn solve-btn-submit" style={{ width: '100%', marginTop: '30px', padding: '12px' }}>
         {saving ? 'Forging...' : 'Save All Changes'}
       </button>
    </div>
  );
};

export default SolvePage;
