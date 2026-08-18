import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, PlayCircle, ChevronLeft } from 'lucide-react';
import { getHeroSlides, fetchHeroSlidesFromDB } from '../../data/heroSlidesData';

export const HeroSection = () => {
  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  // Auto-play timer (2.5 seconds interval)
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

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

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-2 pb-4 sm:pt-4 sm:pb-8 xl:py-6 transition-colors duration-300 min-h-0">
      
      {/* Dynamic Ambient Background Blur & Glow (Adapts to Light & Dark Theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out blur-3xl ${
              idx === activeIndex ? 'opacity-20 dark:opacity-35 scale-100' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/90 via-slate-50/75 to-slate-50 dark:from-slate-950/90 dark:via-slate-950/80 dark:to-slate-950 transition-colors duration-300" />
      </div>

      {/* Ambient Radial Accent Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[300px] sm:h-[450px] bg-gradient-to-r from-blue-500/10 via-amber-500/15 to-orange-500/10 dark:from-blue-600/15 dark:via-amber-500/20 dark:to-orange-600/15 blur-3xl rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 relative z-10">
        
        {/* Main Hero Card Container */}
        <div 
          className="flex items-center justify-center py-0 w-full mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Active Main Hero Card - Mobile Optimized (No Crop/Zoom) & 14" Laptop Responsive */}
          <div className="w-full h-[360px] xs:h-[400px] sm:h-[480px] md:h-[540px] lg:h-[580px] xl:h-[620px] rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/90 group transition-all duration-500 shrink-0 bg-slate-900">
            
            {/* Background Image inside card with mobile object position to avoid zooming */}
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center brightness-[1.05] contrast-[1.06] saturate-[1.08] group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000&q=80';
              }}
            />

            {/* Gradient Overlays set to 0% opacity (shadow removed completely) */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent pointer-events-none" />
            
            {/* Main Slide Content Area */}
            <div className="absolute bottom-16 xs:bottom-18 sm:bottom-22 md:bottom-24 left-3.5 right-3.5 xs:left-5 xs:right-5 sm:left-10 sm:right-10 z-20 space-y-1.5 xs:space-y-2 sm:space-y-4 text-left">
              <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white uppercase tracking-tight leading-tight max-w-4xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                {currentSlide.title}
              </h1>

              <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-white font-medium leading-relaxed max-w-3xl line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {currentSlide.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-1.5 sm:pt-3 flex flex-wrap items-center gap-2 sm:gap-4">
                <Link
                  to={currentSlide.primaryBtnLink || '/registration'}
                  className="px-4 xs:px-5 sm:px-8 py-2 xs:py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600/85 to-indigo-600/85 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs xs:text-sm sm:text-base shadow-xl shadow-blue-600/30 backdrop-blur-md transition flex items-center gap-1.5 sm:gap-2 transform hover:-translate-y-0.5 active:scale-95 shrink-0 border border-blue-400/30"
                >
                  <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                  <span>{currentSlide.primaryBtnText || 'REGISTER NOW'}</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </Link>

                <Link
                  to={currentSlide.secondaryBtnLink || '/live'}
                  className="px-4 xs:px-5 sm:px-8 py-2 xs:py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/70 hover:bg-white text-slate-900 dark:bg-slate-900/70 dark:hover:bg-slate-900 dark:text-white font-bold text-xs xs:text-sm sm:text-base border border-slate-200/70 dark:border-slate-700/70 backdrop-blur-md transition flex items-center gap-1.5 sm:gap-2 shadow-xl active:scale-95 shrink-0"
                >
                  <PlayCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-rose-500 animate-pulse" />
                  <span>{currentSlide.secondaryBtnText || 'Watch Live'}</span>
                </Link>
              </div>
            </div>

            {/* Bottom Controls Bar - Light & Dark Mode Compatible */}
            <div className="absolute bottom-3 left-3.5 right-3.5 sm:bottom-6 sm:left-10 sm:right-10 z-30 flex items-center justify-between pointer-events-auto">
              
              {/* Bottom-Left Arrow Navigation */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/70 hover:bg-white text-slate-900 dark:bg-slate-900/70 dark:hover:bg-slate-900 dark:text-white border border-slate-200/70 dark:border-slate-700/70 backdrop-blur-md transition cursor-pointer shadow-lg active:scale-95"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/70 hover:bg-white text-slate-900 dark:bg-slate-900/70 dark:hover:bg-slate-900 dark:text-white border border-slate-200/70 dark:border-slate-700/70 backdrop-blur-md transition cursor-pointer shadow-lg active:scale-95"
                  title="Next Slide"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Bottom-Right Slide Dots (No 1 of 5 Text) */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md shadow-lg">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeIndex
                        ? 'w-5 sm:w-7 bg-gradient-to-r from-blue-600 to-indigo-600'
                        : 'w-2 sm:w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'
                    }`}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
