import React, { useState, useEffect } from 'react';
import './App.css';
import GeneratorForm from './components/GeneratorForm';
import PresentationViewer from './components/PresentationViewer';
import StatusPanel from './components/StatusPanel';

function App() {
  const [generationId, setGenerationId] = useState(null);
  const [status, setStatus] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [gammaUrl, setGammaUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Poll for generation status
  useEffect(() => {
    if (!generationId || status === 'completed' || status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generation/${generationId}`);
        const data = await response.json();

        setStatus(data.status);

        if (data.status === 'completed') {
          if (data.localPdfUrl) {
            setPdfUrl(`http://localhost:3001${data.localPdfUrl}`);
          }
          if (data.gammaUrl) {
            setGammaUrl(data.gammaUrl);
          }
          setIsGenerating(false);
        } else if (data.status === 'failed') {
          setError('Generation failed. Please try again.');
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Failed to check generation status');
        setIsGenerating(false);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [generationId, status]);

  const handleGenerate = async (payload) => {
    setIsGenerating(true);
    setError(null);
    setPdfUrl(null);
    setGammaUrl(null);
    setGenerationId(null);
    setStatus(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate presentation');
      }

      setGenerationId(data.generationId);
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGenerationId(null);
    setStatus(null);
    setPdfUrl(null);
    setGammaUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7z" fill="url(#gradient)" />
            <path d="M14 14h7v7h-7v-7z" fill="url(#gradient2)" />
            <defs>
              <linearGradient id="gradient" x1="3" y1="3" x2="10" y2="10" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="gradient2" x1="14" y1="14" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
          <h1>Gamma AI Presentation Generator</h1>
        </div>
        <p className="subtitle">Create stunning presentations with AI</p>
      </header>

      <main className="App-main">
        <div className="container">
          {!pdfUrl ? (
            <div className="generator-section">
              <GeneratorForm 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating}
              />
              
              {(isGenerating || error) && (
                <StatusPanel
                  status={status}
                  error={error}
                  generationId={generationId}
                />
              )}
            </div>
          ) : (
            <div className="viewer-section">
              <div className="viewer-header">
                <h2>Your Presentation is Ready!</h2>
                <div className="viewer-actions">
                  {gammaUrl && (
                    <a 
                      href={gammaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View in Gamma
                    </a>
                  )}
                  <a 
                    href={pdfUrl} 
                    download 
                    className="btn btn-secondary"
                  >
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </a>
                  <button onClick={handleReset} className="btn btn-primary">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Generate New
                  </button>
                </div>
              </div>
              
              <PresentationViewer pdfUrl={pdfUrl} />
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>Powered by Gamma AI • Built with React & Node.js</p>
      </footer>
    </div>
  );
}

export default App;
