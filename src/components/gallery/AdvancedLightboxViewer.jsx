import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ImageIcon, 
  Video, 
  Sparkles,
  Share2
} from 'lucide-react';
import { GoogleDriveImage } from '../common/GoogleDriveImage';
import { getVideoThumbnailUrl, getVideoEmbedUrl, triggerMediaDownload } from '../../utils/googleDriveHelper';
import { useToast } from '../../context/ToastContext';

export const AdvancedLightboxViewer = ({ mediaList = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Interactive Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch Swipe State for Mobile
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Video State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const { showToast } = useToast();

  const currentMedia = mediaList[currentIndex] || null;
  const isVideo = currentMedia?.media_type === 'video';
  const totalCount = mediaList.length;

  // Reset zoom and pan whenever current media item changes
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
  }, [totalCount]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
  }, [totalCount]);

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scrolling when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleNext, handlePrev, onClose, resetZoom]);

  // Zoom Controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    if (isVideo) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Pan / Drag handlers when zoomed in
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (scale > 1) return; // Ignore swipe if zoomed in
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Download Trigger
  const handleDownload = () => {
    if (!currentMedia) return;
    const extension = isVideo ? 'mp4' : 'jpg';
    const fileName = `${currentMedia.title || 'Apex_Sports_Gallery'}.${extension}`;
    triggerMediaDownload(currentMedia.media_url, fileName);
    showToast('Downloading original full-quality file...', 'info');
  };

  if (!currentMedia) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-fade-in overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* 1. TOP GLASSMORPHISM CONTROL BAR */}
      <div className="relative z-50 p-4 px-6 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shadow-2xl">
        
        {/* Left: Media Counter & Title */}
        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded-full bg-blue-600/90 backdrop-blur-md text-xs font-black tracking-widest uppercase shadow-md flex items-center gap-1.5">
            {isVideo ? <Video className="w-3.5 h-3.5 text-orange-300" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />}
            <span>{currentIndex + 1} / {totalCount}</span>
          </div>

          <div className="hidden sm:block border-l border-slate-700/60 pl-4">
            <h3 className="text-sm font-black text-white truncate max-w-md">
              {currentMedia.title}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              APEX Original High-Res Media
            </span>
          </div>
        </div>

        {/* Right: Action Buttons (Zoom, Download, Close) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Zoom Buttons (Images Only) */}
          {!isVideo && (
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-2 rounded-xl hover:bg-slate-700/80 disabled:opacity-30 text-slate-300 hover:text-white transition"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-[11px] font-mono font-bold px-2 text-blue-400">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="p-2 rounded-xl hover:bg-slate-700/80 disabled:opacity-30 text-slate-300 hover:text-white transition"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {scale > 1 && (
                <button
                  onClick={resetZoom}
                  className="p-2 rounded-xl hover:bg-slate-700/80 text-orange-400 transition"
                  title="Reset Zoom (0)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Download Original File Button */}
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2 active:scale-95"
            title="Download Original File"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Original</span>
          </button>

          {/* Close Viewer */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700/60"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* 2. MAIN MEDIA STAGE (Preserves Original Aspect Ratio, No Cropping) */}
      <div 
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >

        {/* Previous Navigation Arrow (Desktop) */}
        {totalCount > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-40 p-3.5 rounded-full bg-slate-900/70 backdrop-blur-xl border border-slate-700/80 text-white hover:bg-blue-600 hover:scale-110 transition shadow-2xl hidden sm:flex items-center justify-center active:scale-95"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Media Container */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {isVideo ? (
            <div className="relative w-full max-w-5xl h-[75vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center">
              {currentMedia.media_url?.includes('drive.google.com') ? (
                <iframe
                  src={getVideoEmbedUrl(currentMedia.media_url)}
                  title={currentMedia.title}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentMedia.media_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain rounded-2xl"
                />
              )}
            </div>
          ) : (
            /* IMAGE DISPLAY: 100% Original Aspect Ratio, Fit in Viewport, No Cropping */
            <div
              className="transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
              }}
              onDoubleClick={handleDoubleClick}
            >
              <GoogleDriveImage
                src={currentMedia.media_url}
                alt={currentMedia.title}
                loading="eager"
                className="max-w-[92vw] max-h-[82vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800/50 pointer-events-none select-none"
              />
            </div>
          )}
        </div>

        {/* Next Navigation Arrow (Desktop) */}
        {totalCount > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-40 p-3.5 rounded-full bg-slate-900/70 backdrop-blur-xl border border-slate-700/80 text-white hover:bg-blue-600 hover:scale-110 transition shadow-2xl hidden sm:flex items-center justify-center active:scale-95"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

      </div>

      {/* 3. BOTTOM GLASSMORPHISM FOOTER & THUMBNAIL STRIP */}
      <div className="relative z-50 p-4 bg-slate-900/60 backdrop-blur-xl border-t border-slate-800/80 flex flex-col items-center gap-3">
        
        {/* Caption Title on Mobile */}
        <div className="sm:hidden text-center px-4">
          <p className="text-xs font-bold text-white truncate max-w-[280px]">
            {currentMedia.title}
          </p>
        </div>

        {/* Horizontal Mini Thumbnail Carousel */}
        {totalCount > 1 && (
          <div className="flex items-center gap-2 max-w-full overflow-x-auto p-1.5 no-scrollbar">
            {mediaList.map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 ${
                  idx === currentIndex
                    ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/50'
                    : 'border-slate-800 opacity-50 hover:opacity-100 hover:scale-105'
                }`}
              >
                {item.media_type === 'video' ? (
                  <div className="w-full h-full bg-slate-950 flex items-center justify-center text-orange-400 relative">
                    <GoogleDriveImage
                      src={getVideoThumbnailUrl(item.media_url, item.cover_image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40" />
                    <Play className="w-4 h-4 text-orange-400 absolute z-10 fill-orange-400" />
                  </div>
                ) : (
                  <GoogleDriveImage
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Helpful Keyboard Hint */}
        <p className="hidden md:block text-[10px] text-slate-400 font-medium tracking-wide">
          Use <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">←</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">→</kbd> keys to slide • Double click or scroll to Zoom • Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">Esc</kbd> to close
        </p>

      </div>

    </div>
  );
};
