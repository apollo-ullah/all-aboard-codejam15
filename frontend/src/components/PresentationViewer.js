import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PresentationViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PresentationViewer = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  return (
    <div className="presentation-viewer">
      <div className="viewer-controls">
        <div className="page-controls">
          <button 
            onClick={goToPrevPage} 
            disabled={pageNumber <= 1}
            className="control-btn"
            title="Previous page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="page-info">
            Page <strong>{pageNumber}</strong> of <strong>{numPages || '...'}</strong>
          </span>
          
          <button 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
            className="control-btn"
            title="Next page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="zoom-controls">
          <button 
            onClick={zoomOut} 
            disabled={scale <= 0.5}
            className="control-btn"
            title="Zoom out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          
          <button 
            onClick={resetZoom}
            className="control-btn zoom-display"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            onClick={zoomIn} 
            disabled={scale >= 2.0}
            className="control-btn"
            title="Zoom in"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="pdf-container">
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading presentation...</p>
          </div>
        )}
        
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="pdf-document"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            className="pdf-page"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      <div className="thumbnail-strip">
        {numPages && Array.from(new Array(numPages), (el, index) => (
          <div 
            key={`thumb_${index + 1}`}
            className={`thumbnail ${pageNumber === index + 1 ? 'active' : ''}`}
            onClick={() => setPageNumber(index + 1)}
          >
            <Document file={pdfUrl} loading="">
              <Page 
                pageNumber={index + 1} 
                width={120}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            <span className="thumbnail-number">{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresentationViewer;
