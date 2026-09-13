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
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '../../utils/youtube';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const AdvancedLightboxViewer = ({ mediaList = [], initialIndex = 0, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
  const ytVideoId = extractYouTubeVideoId(currentMedia?.media_url);
  const isVideo = currentMedia ? (
    (currentMedia.media_type || '').toLowerCase() === 'video' ||
    Boolean(ytVideoId) ||
    (Boolean(currentMedia.media_url?.includes('drive.google.com')) && (currentMedia.media_type || '').toLowerCase() !== 'image')
  ) : false;
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

  // Zoom control helpers
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
      setScale(2);
    }
  };

  // Mouse Pan & Drag Handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
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

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (scale === 1) {
      if (isLeftSwipe) {
        handleNext();
      } else if (isRightSwipe) {
        handlePrev();
      }
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Download Trigger
  const handleDownload = () => {
    if (!currentMedia?.media_url) return;
    const extension = isVideo ? 'mp4' : 'jpg';
    const fileName = `${currentMedia.title || 'Apex_Sports_Gallery'}.${extension}`;
    triggerMediaDownload(currentMedia.media_url, fileName);
    showToast('Downloading original full-quality file...', 'info');
  };

  if (!currentMedia) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none animate-fade-in overflow-hidden transition-colors ${
        isDark ? 'bg-[#06070a]/96 backdrop-blur-2xl text-white' : 'bg-slate-50/98 backdrop-blur-2xl text-slate-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* 1. TOP CONTROL BAR */}
      <div className={`relative z-50 p-4 px-6 backdrop-blur-xl flex items-center justify-between shadow-2xl transition-colors ${
        isDark ? 'bg-[#0d0f18]/85 border-b border-white/10 text-white' : 'bg-white/90 border-b border-slate-200 text-slate-900 shadow-sm'
      }`}>
        
        {/* Left: Media Counter & Title */}
        <div className="flex items-center gap-4">
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-md flex items-center gap-1.5 ${
            isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-white shadow-sm'
          }`}>
            {isVideo ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
            <span>{currentIndex + 1} / {totalCount}</span>
          </div>

          <div className={`hidden sm:block border-l pl-4 ${isDark ? 'border-white/15' : 'border-slate-300'}`}>
            <h3 className={`text-sm font-black truncate max-w-md ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentMedia.title}
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              APEX Original High-Res Media
            </span>
          </div>
        </div>

        {/* Right: Action Buttons (Zoom, Download, Close) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Zoom Buttons (Images Only) */}
          {!isVideo && (
            <div className={`hidden md:flex items-center gap-1 p-1 rounded-2xl border ${
              isDark ? 'bg-[#131622] border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className={`p-2 rounded-xl disabled:opacity-30 transition cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className={`text-[11px] font-mono font-bold px-2 ${isDark ? 'text-amber-400' : 'text-blue-600'}`}>
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className={`p-2 rounded-xl disabled:opacity-30 transition cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {scale > 1 && (
                <button
                  onClick={resetZoom}
                  className="p-2 rounded-xl hover:bg-white/10 text-amber-400 transition cursor-pointer"
                  title="Reset Zoom (0)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Download Original File Button (Photos Only) */}
          {!isVideo && (
            <button
              onClick={handleDownload}
              className={`px-4 py-2 rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
              }`}
              title="Download Original Photo"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Original</span>
            </button>
          )}

          {/* Close Viewer */}
          <button
            onClick={onClose}
            className={`p-2.5 rounded-2xl transition active:scale-95 border cursor-pointer ${
              isDark 
                ? 'bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white border-white/10' 
                : 'bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white border-slate-200'
            }`}
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
            className={`absolute left-4 z-40 p-3.5 rounded-full border transition shadow-2xl hidden sm:flex items-center justify-center active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-[#0d0f18]/85 hover:bg-black border-white/15 text-white shadow-black/80' 
                : 'bg-white/90 hover:bg-white border-slate-300 text-slate-800 shadow-xl'
            }`}
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Media Container */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {isVideo ? (
            <div className={`relative w-full max-w-5xl h-[75vh] rounded-3xl overflow-hidden shadow-2xl border flex items-center justify-center bg-black ${
              isDark ? 'border-white/10' : 'border-slate-300'
            }`}>
              {ytVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={currentMedia.title || 'YouTube Video'}
                  className="w-full h-full border-0 aspect-video rounded-3xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : currentMedia.media_url?.includes('drive.google.com') ? (
                <iframe
                  src={getVideoEmbedUrl(currentMedia.media_url)}
                  title={currentMedia.title || 'Video'}
                  className="w-full h-full border-0 rounded-3xl"
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
                className={`max-w-[92vw] max-h-[82vh] w-auto h-auto object-contain rounded-2xl shadow-2xl pointer-events-none select-none border ${
                  isDark ? 'border-white/10 shadow-black/80' : 'border-slate-300 shadow-2xl'
                }`}
              />
            </div>
          )}
        </div>

        {/* Next Navigation Arrow (Desktop) */}
        {totalCount > 1 && (
          <button
            onClick={handleNext}
            className={`absolute right-4 z-40 p-3.5 rounded-full border transition shadow-2xl hidden sm:flex items-center justify-center active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-[#0d0f18]/85 hover:bg-black border-white/15 text-white shadow-black/80' 
                : 'bg-white/90 hover:bg-white border-slate-300 text-slate-800 shadow-xl'
            }`}
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

      </div>

      {/* 3. BOTTOM FOOTER & THUMBNAIL STRIP */}
      <div className={`relative z-50 p-4 backdrop-blur-xl border-t flex flex-col items-center gap-3 transition-colors ${
        isDark ? 'bg-[#0d0f18]/85 border-white/10 text-white' : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        
        {/* Caption Title on Mobile */}
        <div className="sm:hidden text-center px-4">
          <p className={`text-xs font-bold truncate max-w-[280px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentMedia.title}
          </p>
        </div>

        {/* Horizontal Mini Thumbnail Carousel */}
        {totalCount > 1 && (
          <div className="flex items-center gap-2 max-w-full overflow-x-auto p-1.5 no-scrollbar">
            {mediaList.map((item, idx) => {
              const itemIsVideo = (item.media_type || '').toLowerCase() === 'video' || Boolean(extractYouTubeVideoId(item.media_url));
              return (
                <button
                  key={item.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? isDark
                        ? 'border-amber-400 scale-110 shadow-lg shadow-amber-400/30 ring-2 ring-amber-400/50'
                        : 'border-slate-900 scale-110 shadow-lg shadow-slate-900/30 ring-2 ring-slate-900/40'
                      : isDark
                        ? 'border-white/10 opacity-50 hover:opacity-100 hover:scale-105'
                        : 'border-slate-300 opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {itemIsVideo ? (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center text-amber-400 relative">
                      <GoogleDriveImage
                        src={getVideoThumbnailUrl(item.media_url, item.cover_image)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/40" />
                      <Play className="w-4 h-4 text-amber-400 absolute z-10 fill-amber-400" />
                    </div>
                  ) : (
                    <GoogleDriveImage
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Helpful Keyboard Hint */}
        <p className={`hidden md:block text-[10px] font-medium tracking-wide ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Use <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'}`}>←</kbd> <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'}`}>→</kbd> keys to slide • Double click or scroll to Zoom • Press <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'}`}>Esc</kbd> to close
        </p>

      </div>

    </div>
  );
};
