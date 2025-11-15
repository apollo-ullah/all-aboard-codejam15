import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Download, X, Play, Pause, AlertCircle } from 'lucide-react';

// Component to handle Gamma embedding with multiple fallback methods
const GammaEmbedViewer = React.forwardRef<HTMLIFrameElement, { 
  presentationUrl: string; 
  embedUrl?: string;
}>(({ presentationUrl, embedUrl }, ref) => {
  const [embedMethod, setEmbedMethod] = useState<'iframe' | 'object' | 'new-window'>('iframe');
  const [embedError, setEmbedError] = useState(false);
  
  // Try to extract presentation ID and construct different embed URLs
  const getEmbedUrls = () => {
    const urls: { name: string; url: string }[] = [];
    
    // Extract ID from URL
    const idMatch = presentationUrl.match(/gamma\.app\/[^\/]+\/([a-zA-Z0-9_-]+)/);
    const presentationId = idMatch ? idMatch[1] : null;
    
    if (embedUrl) {
      urls.push({ name: 'API Embed URL', url: embedUrl });
    }
    
    if (presentationId) {
      // Try different embed URL formats
      urls.push({ name: 'Embed Format 1', url: `https://gamma.app/embed/${presentationId}` });
      urls.push({ name: 'Embed Format 2', url: `https://gamma.app/presentation/${presentationId}/embed` });
      urls.push({ name: 'Embed Format 3', url: `https://gamma.app/docs/${presentationId}?embed=true` });
    }
    
    // Add original URL with embed param
    urls.push({ 
      name: 'Original with embed param', 
      url: presentationUrl.includes('?') ? `${presentationUrl}&embed=true` : `${presentationUrl}?embed=true` 
    });
    
    return urls;
  };
  
  const embedUrls = getEmbedUrls();
  const currentUrl = embedUrls[0]?.url || presentationUrl;
  
  // Detect actual CSP errors (not cross-origin access issues)
  useEffect(() => {
    // Listen for actual CSP violations in the console
    const handleCSPError = (event: SecurityPolicyViolationEvent) => {
      if (event.violatedDirective === 'frame-ancestors') {
        console.warn('CSP frame-ancestors violation detected, switching to new window mode');
        setEmbedError(true);
      }
    };
    
    document.addEventListener('securitypolicyviolation', handleCSPError);
    
    // Don't check iframe contentDocument - it will always fail for cross-origin iframes
    // This is expected behavior, not an error. Only show error if iframe fails to load.
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPError);
    };
  }, [currentUrl]);
  

  // Show iframe with fallback option
  return (
    <div className="relative w-full h-full">
      {/* Try iframe first */}
      {embedMethod === 'iframe' && !embedError && (
        <iframe
          ref={ref}
          data-gamma-embed
          src={currentUrl}
          className="w-full h-full border-0"
          title="Gamma Presentation"
          allowFullScreen
          allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
          style={{ border: 'none' }}
          onLoad={() => {
            console.log('✅ Iframe loaded successfully');
            setEmbedError(false);
          }}
          onError={() => {
            console.warn('❌ Iframe failed to load');
            setEmbedError(true);
          }}
        />
      )}
      
      {/* Show fallback overlay if iframe fails or as backup */}
      {(embedError || embedMethod === 'new-window') && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm z-10">
          <div className="text-center space-y-6 max-w-md mx-auto p-8">
            <AlertCircle className="w-16 h-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold text-white mb-4">Embedding Blocked</h2>
            <p className="text-gray-300 mb-6">
              Gamma presentations cannot be embedded due to Content Security Policy restrictions. 
              Use the button below to open in a new window.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.open(presentationUrl, '_blank', 'width=1200,height=800')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Open Presentation in New Window
              </button>
              <button
                onClick={() => {
                  setEmbedError(false);
                  setEmbedMethod('iframe');
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
              >
                Try Iframe Again
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-4 space-y-1">
              <p>Testing URL: <code className="text-xs break-all bg-gray-800 px-2 py-1 rounded">{currentUrl}</code></p>
              <p>Presentation URL: <code className="text-xs break-all bg-gray-800 px-2 py-1 rounded">{presentationUrl}</code></p>
              {embedUrl && <p>Embed URL: <code className="text-xs break-all bg-gray-800 px-2 py-1 rounded">{embedUrl}</code></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GammaEmbedViewer.displayName = 'GammaEmbedViewer';

interface PresentationViewerProps {
  presentationUrl: string;
  embedUrl?: string;
  downloadUrl?: string;
  pdfUrl?: string;
  slideCount: number;
  onClose: () => void;
}

export default function PresentationViewer({
  presentationUrl,
  embedUrl,
  downloadUrl,
  pdfUrl,
  slideCount,
  onClose,
}: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else if (isPresenting) {
          setIsPresenting(false);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.target === document.body) {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, isFullscreen, isPresenting]);

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleNext = useCallback(() => {
    const newSlide = Math.min(currentSlide + 1, slideCount - 1);
    setCurrentSlide(newSlide);
    
    // Focus the iframe so keyboard navigation works
    // Note: Due to cross-origin restrictions, we can't programmatically control
    // the Gamma iframe, but focusing it allows the user to use arrow keys
    if (iframeRef.current) {
      iframeRef.current.focus();
      
      // Try postMessage (may not work due to CORS, but worth trying)
      try {
        if (iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
            type: 'navigate', 
            direction: 'next',
            slide: newSlide 
          }, '*');
        }
      } catch (e) {
        // Expected to fail due to CORS - this is normal
      }
    }
  }, [currentSlide, slideCount]);

  const handlePrevious = useCallback(() => {
    const newSlide = Math.max(currentSlide - 1, 0);
    setCurrentSlide(newSlide);
    
    // Focus the iframe so keyboard navigation works
    // Note: Due to cross-origin restrictions, we can't programmatically control
    // the Gamma iframe, but focusing it allows the user to use arrow keys
    if (iframeRef.current) {
      iframeRef.current.focus();
      
      // Try postMessage (may not work due to CORS, but worth trying)
      try {
        if (iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
            type: 'navigate', 
            direction: 'previous',
            slide: newSlide 
          }, '*');
        }
      } catch (e) {
        // Expected to fail due to CORS - this is normal
      }
    }
  }, [currentSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      // Fallback: open presentation in new tab
      window.open(presentationUrl, '_blank');
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
          <div className="h-6 w-px bg-gray-700"></div>
          <div className="text-sm font-medium">
            Slide {currentSlide + 1} of {slideCount}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPresenting(!isPresenting)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              isPresenting
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title="Start/Stop Presentation"
          >
            {isPresenting ? (
              <>
                <Pause size={16} />
                Stop Presenting
              </>
            ) : (
              <>
                <Play size={16} />
                Start Presenting
              </>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Fullscreen (F)"
          >
            <Maximize size={20} />
          </button>
          {downloadUrl && (
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Presentation Container */}
      <div className="flex-1 relative bg-gray-950 overflow-hidden">
        {/* Check if we have a PDF URL */}
        {pdfUrl || downloadUrl?.includes('.pdf') || downloadUrl?.includes('pdf') ? (
          // PDF Viewer
          <iframe
            src={pdfUrl || downloadUrl}
            className="w-full h-full border-0"
            title="Presentation PDF"
            allowFullScreen
          />
        ) : embedUrl || presentationUrl ? (
          // Try multiple embedding methods due to CSP restrictions
          <GammaEmbedViewer
            ref={iframeRef}
            presentationUrl={presentationUrl}
            embedUrl={embedUrl}
          />
        ) : (
          // Fallback: Show GAMMA presentation with options
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center space-y-6 max-w-md mx-auto p-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-4">Presentation Ready!</h2>
              <p className="text-gray-300 mb-6">
                Your slides have been generated successfully. Choose how you'd like to view them:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.open(presentationUrl, '_blank')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in GAMMA (Recommended)
                </button>
                
                {downloadUrl && (
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Presentation
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-400 mt-4">
                <p>💡 Tip: The GAMMA presentation opens in full-screen mode perfect for presenting!</p>
              </div>
            </div>
          </div>
        )}


        {/* Presentation Mode Overlay */}
        {isPresenting && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="text-sm font-medium">
                {currentSlide + 1} / {slideCount}
              </div>
            </div>
            {/* Invisible navigation buttons for keyboard */}
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-0 w-1/3 h-full cursor-w-resize"
              style={{ pointerEvents: 'auto' }}
            />
            <button
              onClick={handleNext}
              className="absolute right-0 top-0 w-1/3 h-full cursor-e-resize"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls (hidden in fullscreen and only shown with embeddable content) */}
      {!isFullscreen && (pdfUrl || downloadUrl?.includes('.pdf') || downloadUrl?.includes('pdf') || embedUrl || presentationUrl) && (
        <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Use arrow keys to navigate • F for fullscreen • Esc to exit
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentSlide === slideCount - 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

