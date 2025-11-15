import { useState } from 'react'
import PresentonService from './services/PresentonService'
import PDFViewer from './components/PDFViewer'
import LoadingSpinner from './components/LoadingSpinner'
import './App.css'

function App() {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGeneratePresentation = async () => {
    setLoading(true)
    setError(null)
    setPdfUrl(null)

    try {
      // Load the sample JSON data
      const response = await fetch('/sample.json')
      const jsonData = await response.json()

      // Generate presentation using Presenton API
      const pdfPath = await PresentonService.generatePresentation(jsonData)
      setPdfUrl(pdfPath)
    } catch (err) {
      setError(err.message || 'Failed to generate presentation')
      console.error('Error generating presentation:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Presenton PDF Viewer</h1>
        <p>Generate and view beautiful presentations</p>
      </header>

      <main className="app-main">
        {!pdfUrl && !loading && (
          <div className="welcome-section">
            <div className="welcome-card">
              <h2>Ready to create your presentation?</h2>
              <p>Click the button below to generate a PDF from your JSON data</p>
              <button 
                className="generate-btn"
                onClick={handleGeneratePresentation}
              >
                <span className="btn-icon">✨</span>
                Generate Presentation
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-section">
            <LoadingSpinner />
            <p className="loading-text">Creating your presentation...</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <div className="error-card">
              <h3>❌ Error</h3>
              <p>{error}</p>
              <button 
                className="retry-btn"
                onClick={handleGeneratePresentation}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {pdfUrl && !loading && (
          <div className="viewer-section">
            <div className="viewer-controls">
              <button 
                className="new-btn"
                onClick={() => setPdfUrl(null)}
              >
                ← New Presentation
              </button>
              <a 
                href={pdfUrl} 
                download="presentation.pdf"
                className="download-btn"
              >
                📥 Download PDF
              </a>
            </div>
            <PDFViewer pdfUrl={pdfUrl} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
