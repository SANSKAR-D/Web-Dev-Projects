import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import client from '../api/client.js';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || 'easy';
  const meta = difficultyMeta[difficulty] || difficultyMeta.easy;

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'solution' | 'discussion'
  const [lang, setLang] = useState('cpp');
  const [code, setCode] = useState(TEMPLATES.cpp);

  /* Fetch full question */
  useEffect(() => {
    if (!id || !topic || !difficulty) return;
    setLoading(true);
    client.get('/problems/question', { params: { id, topic, difficulty } })
      .then(res => {
        setQuestion(res.data);
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

  const handleMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme('codex', monacoTheme);
    monaco.editor.setTheme('codex');
  }, []);

  const handleLangChange = (e) => {
    const l = e.target.value;
    setLang(l);
    setCode(TEMPLATES[l] || '');
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
          </div>

          {/* Content */}
          <div className="solve-left-content">
            {loading ? (
              <div className="solve-loading">Unearthing the ancient scroll…</div>
            ) : error ? (
              <div className="solve-loading" style={{ color: '#C05A4A' }}>{error}</div>
            ) : activeTab === 'description' ? (
              <DescriptionTab question={question} meta={meta} />
            ) : activeTab === 'solution' ? (
              <SolutionTab question={question} />
            ) : (
              <DiscussionTab />
            )}
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
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          <div className="solve-editor-footer">
            {question?.link && (
              <a
                href={question.link}
                target="_blank"
                rel="noopener noreferrer"
                className="solve-lc-link"
              >
                ↗ Open on LeetCode
              </a>
            )}
            <button
              className="solve-btn solve-btn-run"
              onClick={() => navigate(`/forge?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`)}
            >
              ← Back
            </button>
            <button className="solve-btn solve-btn-submit">Submit</button>
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
    <p className="solve-description">{question?.description || 'No description available.'}</p>

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

    {question?.testCases?.find(tc => !tc.hidden) && (
      <>
        <hr className="solve-divider" />
        <p className="solve-section-label">Example</p>
        {(() => {
          const tc = question.testCases.find(tc => !tc.hidden);
          return (
            <div className="solve-testcase">
              <div className="solve-testcase-label">Example 1</div>
              <div className="solve-testcase-row">
                <span className="solve-testcase-key">Input:</span>
                <span className="solve-testcase-val">{String(tc.input)}</span>
              </div>
              <div className="solve-testcase-row">
                <span className="solve-testcase-key">Expected Output:</span>
                <span className="solve-testcase-val">{String(tc.expectedOutput)}</span>
              </div>
            </div>
          );
        })()}
      </>
    )}
  </>
);

/* ── Solution sub-component ─────────────────────── */
const SolutionTab = ({ question }) => {
  const sol = question?.solution;
  if (!sol) {
    return (
      <p style={{ color: '#6A5A3A', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}>
        No solution available for this problem.
      </p>
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

export default SolvePage;
