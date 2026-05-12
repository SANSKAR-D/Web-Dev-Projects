import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#0D0B09',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F0E0B0',
          fontFamily: "'Playfair Display', serif",
          padding: '40px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠</div>
          <h1 style={{ color: '#D4A83C', fontSize: '2rem', marginBottom: '12px' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8A7A5A', fontFamily: "'Fira Code', monospace", fontSize: '0.9rem', marginBottom: '30px', textAlign: 'center', maxWidth: '500px' }}>
            An unexpected error occurred. The kingdom's scribes have been notified.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/home';
            }}
            style={{
              padding: '12px 30px',
              background: 'linear-gradient(90deg, #B8902A, #E8C060)',
              color: '#0D0B09',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
