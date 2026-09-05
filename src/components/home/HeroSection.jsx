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
    <section className="relative w-full overflow-hidden bg-[#070A13] text-white min-h-0 select-none font-spatial-sans border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">

      {/* Main Full-Width Hero Slider Container */}
      <div
        className="w-full h-[380px] xs:h-[420px] sm:h-[480px] md:h-[540px] lg:h-[580px] xl:h-[620px] relative overflow-hidden group cursor-grab active:cursor-grabbing"
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
        {/* Background Authentic Sport Image - Edge to Edge with Fine Atmosphere */}
        <img
          key={currentSlide.id || currentSlide.image || activeIndex}
          src={currentSlide.image}
          alt={currentSlide.title || 'APEX Sports Championship'}
          className="w-full h-full object-cover object-center brightness-[0.82] contrast-[1.08] saturate-[1.05] transition-all duration-700 select-none pointer-events-none"
          draggable="false"
        />

        {/* Dignified Editorial Shadow/Depth Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A13] via-[#070A13]/60 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A13]/90 via-[#070A13]/40 to-transparent pointer-events-none z-10" />

        {/* Split Editorial Content Area */}
        <div className="absolute bottom-12 xs:bottom-14 sm:bottom-18 md:bottom-20 left-0 right-0 z-20 pointer-events-none">
          <div className="w-full max-w-[1600px] mx-auto px-4 xs:px-6 sm:px-10 lg:px-12 xl:px-16 space-y-2 sm:space-y-3 text-left">
            
            {/* Useful Sport / Event Badge Label */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-xs border border-white/15 text-xs font-mono font-medium tracking-wider text-[#F3D78A] pointer-events-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A98B57]" />
              <span className="uppercase">{currentSlide.sport || 'APEX Inter-College Championship 2026'}</span>
            </div>

            {/* Large Dignified Serif Sport Title */}
            <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal font-spatial-display text-white uppercase tracking-tight leading-tight max-w-4xl drop-shadow-md pointer-events-auto">
              {currentSlide.title}
            </h1>

            {/* Action Buttons (Solid, Non-Gradient, Restrained 8px Radius) */}
            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-2.5 sm:gap-4 pointer-events-auto">
              <Link
                to={currentSlide.primaryBtnLink || '/registration'}
                className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-lg bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center gap-2 active:scale-98 shrink-0 min-h-[44px]"
              >
                <Trophy className="w-4 h-4 text-white" />
                <span>Register Your Team</span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </Link>

              <Link
                to={currentSlide.secondaryBtnLink || '/live'}
                className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 hover:border-white/50 backdrop-blur-xs transition-all flex items-center gap-2 active:scale-98 shrink-0 min-h-[44px]"
              >
                <PlayCircle className="w-4 h-4 text-[#FDA4AF]" />
                <span>Watch Live Scoreboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom-Right Slide Indicators - Clean & Restrained */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 lg:right-12 z-30 flex items-center gap-2 pointer-events-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? 'w-7 bg-[#8B5CF6] dark:bg-[#B8A5E5]'
                  : 'w-2 bg-white/30 hover:bg-white/60'
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
