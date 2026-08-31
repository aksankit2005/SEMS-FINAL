import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, PlayCircle } from 'lucide-react';
import { getHeroSlides, fetchHeroSlidesFromDB } from '../../data/heroSlidesData';

export const HeroSection = () => {
  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeIndex, setActiveIndex] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const mouseStartX = useRef(0);
  const mouseEndX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    // Fetch fresh slides from database on mount to guarantee user sync
    fetchHeroSlidesFromDB().then((freshSlides) => {
      if (freshSlides && Array.isArray(freshSlides) && freshSlides.length > 0) {
        setSlides(freshSlides);
      }
    });

    const handleUpdate = () => {
      setSlides(getHeroSlides());
    };

    window.addEventListener('sems_slides_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('sems_slides_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Continuous auto-play timer (slides always advance every 2.5 seconds)
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [slides.length, activeIndex]);

  if (!slides || slides.length === 0) return null;

  const prevIndex = (activeIndex - 1 + slides.length) % slides.length;
  const nextIndex = (activeIndex + 1) % slides.length;

  const currentSlide = slides[activeIndex];

  const handlePrev = () => {
    setActiveIndex(prevIndex);
  };

  const handleNext = () => {
    setActiveIndex(nextIndex);
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    
    // Check horizontal swipe threshold (50px) and ensure horizontal motion dominates vertical scroll
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext(); // Swiped left -> next slide
      } else {
        handlePrev(); // Swiped right -> previous slide
      }
    }
  };

  // Mouse Drag Swipe Handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    mouseStartX.current = e.clientX;
    mouseEndX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    mouseEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diffX = mouseStartX.current - mouseEndX.current;
    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 text-white min-h-0 select-none">

      {/* Main Full-Width Hero Slider Container */}
      <div
        className="w-full h-[360px] xs:h-[400px] sm:h-[480px] md:h-[540px] lg:h-[580px] xl:h-[620px] 2xl:h-[680px] relative overflow-hidden group cursor-grab active:cursor-grabbing"
        onMouseLeave={() => {
          isDragging.current = false;
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background Image inside card - Full Bleed Edge to Edge */}
        <img
          key={currentSlide.id || currentSlide.image || activeIndex}
          src={currentSlide.image}
          alt={currentSlide.title || 'APEX Sports Tournament'}
          className="w-full h-full object-cover object-center brightness-[1.05] contrast-[1.06] saturate-[1.08] group-hover:scale-105 transition-all duration-700 select-none pointer-events-none"
          draggable="false"
        />

        {/* Gradient Overlays for Readability and Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none z-10" />

        {/* Main Slide Content Area */}
        <div className="absolute bottom-14 xs:bottom-16 sm:bottom-20 md:bottom-22 left-0 right-0 z-20 pointer-events-none">
          <div className="w-full max-w-[1600px] mx-auto px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 space-y-1.5 xs:space-y-2 sm:space-y-4 text-left">
            <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white uppercase tracking-tight leading-tight max-w-4xl drop-shadow-2xl pointer-events-auto">
              {currentSlide.title}
            </h1>

            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-slate-100 font-normal leading-relaxed max-w-3xl line-clamp-2 drop-shadow-md pointer-events-auto">
              {currentSlide.description}
            </p>

            {/* Action Buttons */}
            <div className="pt-1.5 sm:pt-3 flex flex-wrap items-center gap-2 sm:gap-4 pointer-events-auto">
              <Link
                to={currentSlide.primaryBtnLink || '/registration'}
                className="px-4 xs:px-5 sm:px-8 py-2 xs:py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs xs:text-sm sm:text-base shadow-xl shadow-blue-600/30 transition flex items-center gap-1.5 sm:gap-2 transform hover:-translate-y-0.5 active:scale-95 shrink-0"
              >
                <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                <span>{currentSlide.primaryBtnText || 'REGISTER NOW'}</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </Link>

              <Link
                to={currentSlide.secondaryBtnLink || '/live'}
                className="px-4 xs:px-5 sm:px-8 py-2 xs:py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-transparent hover:bg-white/10 text-white font-bold text-xs xs:text-sm sm:text-base border border-white/40 hover:border-white/80 backdrop-blur-xs transition flex items-center gap-1.5 sm:gap-2 active:scale-95 shrink-0"
              >
                <PlayCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-rose-500 animate-pulse" />
                <span>{currentSlide.secondaryBtnText || 'Watch Live'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom-Right Slide Indicators / Dots - Clean without background box or border */}
        <div className="absolute bottom-3.5 right-4 sm:bottom-6 sm:right-8 lg:right-12 z-30 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${idx === activeIndex
                ? 'w-6 sm:w-8 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md'
                : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              title={`Go to slide ${idx + 1}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>

    </section>
  );
};
