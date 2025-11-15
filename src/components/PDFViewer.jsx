import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './PDFViewer.css'

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

function PDFViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  function previousPage() {
    changePage(-1)
  }

  function nextPage() {
    changePage(1)
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0))
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5))
  }

  function resetZoom() {
    setScale(1.0)
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <div className="page-controls">
          <button
            className="control-btn"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {pageNumber} of {numPages}
          </span>
          <button
            className="control-btn"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
          >
            Next →
          </button>
        </div>

        <div className="zoom-controls">
          <button className="control-btn" onClick={zoomOut}>
            🔍−
          </button>
          <button className="control-btn" onClick={resetZoom}>
            {Math.round(scale * 100)}%
          </button>
          <button className="control-btn" onClick={zoomIn}>
            🔍+
          </button>
        </div>
      </div>

      <div className="pdf-container">
        <div className="pdf-document">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="pdf-loading">
                <div className="spinner"></div>
                <p>Loading PDF...</p>
              </div>
            }
            error={
              <div className="pdf-error">
                <p>Failed to load PDF file.</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page"
            />
          </Document>
        </div>
      </div>

      {numPages > 1 && (
        <div className="page-thumbnails">
          <p>Quick Navigation:</p>
          <div className="thumbnail-grid">
            {Array.from(new Array(numPages), (el, index) => (
              <button
                key={`page_${index + 1}`}
                className={`thumbnail-btn ${
                  pageNumber === index + 1 ? 'active' : ''
                }`}
                onClick={() => setPageNumber(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PDFViewer
