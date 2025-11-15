import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Download, X, Play, Pause } from 'lucide-react';

interface PresentationViewerProps {
  presentationUrl: string;
  embedUrl?: string;
  downloadUrl?: string;
  slideCount: number;
  onClose: () => void;
}

export default function PresentationViewer({
  presentationUrl,
  embedUrl,
  downloadUrl,
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

  const handleNext = useCallback(() => {
    setCurrentSlide(prev => Math.min(prev + 1, slideCount - 1));
  }, [slideCount]);

  const handlePrevious = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

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
        {embedUrl ? (
          // Use embed URL if available (better for presentation mode)
          <iframe
            src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}slide=${currentSlide + 1}`}
            className="w-full h-full border-0"
            title="Gamma Presentation"
            allowFullScreen
          />
        ) : (
          // Fallback: Use presentation URL in iframe
          <iframe
            src={presentationUrl}
            className="w-full h-full border-0"
            title="Gamma Presentation"
            allowFullScreen
          />
        )}

        {/* Navigation Overlay (only visible when not presenting) */}
        {!isPresenting && (
          <>
            {/* Previous Button */}
            {currentSlide > 0 && (
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                title="Previous slide (←)"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next Button */}
            {currentSlide < slideCount - 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                title="Next slide (→)"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Slide Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
              {Array.from({ length: slideCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-white w-8'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  title={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
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

      {/* Bottom Controls (hidden in fullscreen) */}
      {!isFullscreen && (
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

