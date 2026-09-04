import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Download, 
  Play, 
  Pause 
} from 'lucide-react';
import { GoogleDriveImage } from '../common/GoogleDriveImage';
import { getVideoThumbnailUrl, triggerMediaDownload } from '../../utils/googleDriveHelper';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const SpatialCoverFlow = ({ items = [], onOpenLightbox, event = null }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const { showToast } = useToast();

  const containerRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const lastWheelTimeRef = useRef(0);

  const total = items.length;

  useEffect(() => {
    if (activeIndex >= total && total > 0) {
      setActiveIndex(total - 1);
    }
  }, [total, activeIndex]);

  const navigateTo = useCallback((index) => {
    if (total === 0) return;
    const nextIdx = (index + total) % total;
    setActiveIndex(nextIdx);
  }, [total]);

  const handlePrev = useCallback(() => {
    navigateTo(activeIndex - 1);
  }, [activeIndex, navigateTo]);

  const handleNext = useCallback(() => {
    navigateTo(activeIndex + 1);
  }, [activeIndex, navigateTo]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoplay((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  useEffect(() => {
    if (isAutoplay && total > 1) {
      autoplayTimerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % total);
      }, 3500);
    } else if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isAutoplay, total]);

  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 260) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 15) {
      lastWheelTimeRef.current = now;
      if (delta > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const endX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 0;
    const diff = endX - startXRef.current;

    if (diff > 45) {
      handlePrev();
    } else if (diff < -45) {
      handleNext();
    }
  };



  if (!items || items.length === 0) {
    return null;
  }

  const activeItem = items[activeIndex] || items[0];
  const isVideo = (activeItem?.media_type || '').toLowerCase() === 'video' || extractYouTubeVideoId(activeItem?.media_url);

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      className="relative w-full flex-1 flex flex-col items-center justify-between select-none overflow-hidden py-4 sm:py-6"
    >
      {/* ─── 3D CYLINDRICAL VIEWPORT ─── */}
      <div className="spatial-coverflow-viewport w-full max-w-7xl relative flex-1 min-h-[380px] sm:min-h-[520px] md:min-h-[560px] flex items-center justify-center">
        
        {/* Floor Glow */}
        <div className={`absolute bottom-8 w-[280px] sm:w-[520px] h-20 sm:h-28 rounded-full z-0 ${
          isDark ? 'spatial-floor-glow-dark' : 'spatial-floor-glow-light'
        }`} />

        <div className="spatial-coverflow-track w-full flex items-center justify-center relative">
          {items.map((item, idx) => {
            const offset = idx - activeIndex;
            const absOffset = Math.abs(offset);

            if (absOffset > 4) return null;

            const isCenter = offset === 0;
            const isLeft = offset < 0;

            let translateX = 0;
            let translateZ = 0;
            let rotateY = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 50 - absOffset * 10;

            if (isCenter) {
              translateX = 0;
              translateZ = 130;
              rotateY = 0;
              scale = 1.05;
              opacity = 1;
              zIndex = 50;
            } else {
              const direction = isLeft ? -1 : 1;
              const arcAngle = Math.min(absOffset * 28, 50) * -direction;
              
              const screenW = typeof window !== 'undefined' ? window.innerWidth : 1024;
              const xStep = screenW < 420 ? 110 : screenW < 640 ? 145 : 250;
              translateX = offset * xStep;
              translateZ = -absOffset * 95 - 40;
              rotateY = arcAngle;
              scale = Math.max(1 - absOffset * 0.08, 0.72);
              opacity = Math.max(1 - absOffset * 0.2, 0.22);
            }

            const isItemVideo = (item.media_type || '').toLowerCase() === 'video' || extractYouTubeVideoId(item.media_url);
            const imageSrc = isItemVideo 
              ? getVideoThumbnailUrl(item.media_url, item.cover_image) 
              : item.media_url;

            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  if (!isCenter) {
                    navigateTo(idx);
                  }
                }}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  zIndex,
                  opacity,
                }}
                className={`spatial-flow-card absolute w-[260px] xs:w-[280px] sm:w-[360px] md:w-[410px] aspect-[3/4] rounded-[24px] sm:rounded-[34px] overflow-hidden cursor-pointer ${
                  isCenter 
                    ? isDark
                      ? 'ring-1 ring-white/30 shadow-[0_30px_70px_rgba(0,0,0,0.98)]'
                      : 'ring-1 ring-slate-300 shadow-[0_25px_60px_rgba(0,0,0,0.2)]'
                    : 'hover:opacity-75 shadow-2xl'
                }`}
              >
                {/* Media Image Layer */}
                <div className="w-full h-full relative bg-slate-950 overflow-hidden">
                  <GoogleDriveImage
                    src={imageSrc}
                    alt={item.title || 'Archive print'}
                    loading={absOffset <= 1 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent pointer-events-none" />

                  {/* Video Play Button Overlay */}
                  {isItemVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border border-white/30 transform group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 fill-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* ─── ACTIVE CENTER CARD OVERLAY ─── */}
                  {isCenter && (
                    <div className="absolute inset-0 p-4 sm:p-7 flex flex-col justify-between pointer-events-auto">
                      
                      {/* Top Action Pills: Sharp Non-Blurry Expand on Left, Download on Right */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenLightbox) {
                              onOpenLightbox(items, activeIndex);
                            }
                          }}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/90 hover:bg-black border border-white/40 text-white text-[11px] sm:text-xs font-black tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-2xl transition-all active:scale-95 cursor-pointer"
                          title="Expand Fullscreen Lightbox"
                        >
                          <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                          <span>Expand</span>
                        </button>

                        {!isItemVideo && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerMediaDownload(item.media_url, `${item.title || 'photo'}.jpg`);
                              showToast('Downloading fine-art photograph...', 'info');
                            }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/90 hover:bg-black border border-white/40 text-white flex items-center justify-center transition-all shadow-2xl cursor-pointer active:scale-95"
                            title="Download High-Res Print"
                          >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>

                      {/* Bottom Text Details: Clean Dynamic Title & Index Count */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2 sm:gap-3">
                          <h3 className="text-sm sm:text-lg md:text-xl font-black text-white tracking-wide leading-snug font-spatial-display uppercase line-clamp-2 drop-shadow-md">
                            {item.title || `${event?.event_name || 'Media'} #${idx + 1}`}
                          </h3>
                          <span className="text-[10px] sm:text-xs font-black text-slate-300 font-spatial-sans shrink-0 drop-shadow">
                            {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                    </div>
                  )}

                  {!isCenter && (
                    <div className="absolute inset-0 bg-slate-950/45 hover:bg-transparent transition-colors" />
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FLOATING SPATIAL CONTROLLER DOCK ─── */}
      <div className="w-full max-w-2xl px-2 sm:px-4 z-40 mt-2 sm:mt-4 mb-1 sm:mb-2">
        <div className={`rounded-full px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 shadow-2xl transition-colors ${
          isDark ? 'spatial-dock-dark' : 'spatial-dock-light'
        }`}>
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 shadow-md shrink-0 bg-slate-950 ${
              isDark ? 'ring-amber-400/60' : 'ring-slate-300'
            }`}>
              <GoogleDriveImage
                src={isVideo ? getVideoThumbnailUrl(activeItem?.media_url, activeItem?.cover_image) : activeItem?.media_url}
                alt="Active thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] sm:text-xs font-black truncate max-w-[80px] xs:max-w-[130px] sm:max-w-[200px] font-spatial-display uppercase ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {activeItem?.title || 'Fine-Art Photograph'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={handlePrev}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition active:scale-90 cursor-pointer ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="Previous Frame (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2">
              {items.slice(0, 10).map((_, dIdx) => (
                <button
                  key={dIdx}
                  onClick={() => navigateTo(dIdx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    dIdx === activeIndex 
                      ? isDark
                        ? 'w-7 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]'
                        : 'w-7 bg-slate-900 shadow-md'
                      : isDark
                        ? 'w-1.5 bg-white/25 hover:bg-white/50'
                        : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Jump to frame ${dIdx + 1}`}
                />
              ))}
              {total > 10 && (
                <span className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  +{total - 10}
                </span>
              )}
            </div>

            <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[9px] sm:text-[10px] font-black tracking-wider font-spatial-sans ${
              isDark 
                ? 'bg-white/10 border-white/10 text-slate-200' 
                : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </div>

            <button
              onClick={handleNext}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition active:scale-90 cursor-pointer ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="Next Frame (Right Arrow)"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setIsAutoplay((prev) => !prev)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition active:scale-90 cursor-pointer ${
                isAutoplay 
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]' 
                    : 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : isDark
                    ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white/80'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title={isAutoplay ? 'Pause Slideshow (Spacebar)' : 'Play Slideshow (Spacebar)'}
            >
              {isAutoplay ? <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" /> : <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
