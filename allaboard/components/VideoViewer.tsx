import React, { useState, useEffect, useRef } from 'react';
import { Maximize, Download, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoViewerProps {
  videoUrl: string;
  videoFilename: string;
  duration?: number;
  onClose: () => void;
}

export default function VideoViewer({
  videoUrl,
  videoFilename,
  duration,
  onClose,
}: VideoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.target === document.body || e.target === videoRef.current) {
          toggleFullscreen();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'ArrowLeft') {
        seek(-10);
      } else if (e.key === 'ArrowRight') {
        seek(10);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, isPlaying, isMuted]);

  // Update video duration when metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        setVideoDuration(video.duration);
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, []);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (video) {
      if (!document.fullscreenElement) {
        video.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    window.open(videoUrl, '_blank');
  };

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      const newTime = (parseFloat(e.target.value) / 100) * video.duration;
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-play when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleCanPlay = () => {
        video.play().catch(() => {
          // Auto-play may be blocked by browser, that's okay
          setIsPlaying(false);
        });
      };
      video.addEventListener('canplay', handleCanPlay);
      return () => video.removeEventListener('canplay', handleCanPlay);
    }
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
            Demo Video
          </div>
          {duration && (
            <>
              <div className="h-6 w-px bg-gray-700"></div>
              <div className="text-xs text-gray-400">
                {formatTime(duration)} duration
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Toggle Mute (M)"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Fullscreen (F)"
          >
            <Maximize size={20} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Download"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full"
          controls={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlayPause}
              className="pointer-events-auto bg-black/70 hover:bg-black/90 rounded-full p-6 transition-all"
              title="Play (Space)"
            >
              <Play size={48} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {!isFullscreen && (
        <div className="bg-gray-900 text-white px-6 py-4 border-t border-gray-700">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#A9A4CC]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(videoDuration || duration || 0)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="p-2 hover:bg-gray-800 rounded transition-colors"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => seek(-10)}
                className="px-3 py-2 text-sm hover:bg-gray-800 rounded transition-colors"
                title="Rewind 10s (←)"
              >
                -10s
              </button>
              <button
                onClick={() => seek(10)}
                className="px-3 py-2 text-sm hover:bg-gray-800 rounded transition-colors"
                title="Forward 10s (→)"
              >
                +10s
              </button>
            </div>

            <div className="text-xs text-gray-400">
              Space: Play/Pause • ← →: Seek • M: Mute • F: Fullscreen • Esc: Close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

