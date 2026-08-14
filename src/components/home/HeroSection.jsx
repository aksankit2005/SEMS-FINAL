import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, PlayCircle, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHeroSlides, DEFAULT_HERO_SLIDES } from '../../data/heroSlidesData';

export const HeroSection = () => {
  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
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

  // Auto-play timer (2 seconds interval)
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 2000);
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
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-1 pb-2 sm:pt-3 sm:pb-8 transition-colors duration-300 min-h-0">
      
      {/* Dynamic Background Image with Smooth Cross-Fade & Ambient Blur (Adapts to Light & Dark Theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out blur-2xl scale-110 ${
              idx === activeIndex ? 'opacity-30 dark:opacity-40 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/90 via-slate-50/70 to-slate-50 dark:from-slate-950/85 dark:via-slate-950/70 dark:to-slate-950 transition-colors duration-300" />
      </div>

      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-[350px] sm:h-[500px] bg-gradient-to-r from-blue-600/15 via-orange-500/15 to-amber-600/15 dark:from-blue-600/20 dark:via-orange-500/20 dark:to-amber-600/20 blur-3xl rounded-full pointer-events-none z-0" />

      <div className="w-full px-2 sm:px-4 lg:px-6 relative z-10">
        
        {/* Main Full-Width Hero Slider Box (All Controls INSIDE the Box) */}
        <div 
          className="flex items-center justify-center py-0 w-full mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Active Main Hero Card - Full Width Box */}
          <div className="w-full h-[480px] sm:h-[580px] md:h-[640px] lg:h-[680px] rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/90 group transition-all duration-500 shrink-0">
            
            {/* Background Image inside card */}
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
            
            {/* Top Right Counter Badge - INSIDE BOX */}
            <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-30 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-amber-400 font-mono font-bold text-xs sm:text-sm shadow-xl">
              {currentSlide.badge || `${activeIndex + 1} of ${slides.length}`}
            </div>

            {/* Bottom Content Box - INSIDE BOX */}
            <div className="absolute bottom-20 sm:bottom-24 left-4 right-4 sm:left-10 sm:right-10 z-20 space-y-2 sm:space-y-4 text-left">
              <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight leading-tight max-w-4xl drop-shadow-2xl">
                {currentSlide.title}
              </h1>

              <p className="text-xs sm:text-lg text-slate-200 font-normal leading-relaxed max-w-3xl line-clamp-2 drop-shadow-md">
                {currentSlide.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5 sm:gap-5">
                <Link
                  to={currentSlide.primaryBtnLink || '/registration'}
                  className="px-5 sm:px-9 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-base shadow-2xl shadow-orange-500/30 transition flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 shrink-0"
                >
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                  <span>{currentSlide.primaryBtnText || 'REGISTER NOW'}</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>

                <Link
                  to={currentSlide.secondaryBtnLink || '/live'}
                  className="px-5 sm:px-9 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white font-bold text-xs sm:text-base border border-slate-700/80 backdrop-blur-md transition flex items-center gap-2 shadow-xl active:scale-95 shrink-0"
                >
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 animate-pulse" />
                  <span>{currentSlide.secondaryBtnText || 'Watch Live'}</span>
                </Link>
              </div>
            </div>

            {/* Bottom Controls Bar - INSIDE THE BOX */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-7 sm:left-10 sm:right-10 z-30 flex items-center justify-between pointer-events-auto">
              
              {/* Bottom-Left Arrow Controls inside box */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md transition cursor-pointer shadow-xl active:scale-95"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-800 backdrop-blur-md transition cursor-pointer shadow-xl active:scale-95"
                  title="Next Slide"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Bottom-Right Counter & Dots inside box */}
              <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-900/85 border border-slate-700/80 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full backdrop-blur-md shadow-xl">
                <span className="text-[11px] sm:text-sm font-mono font-bold text-slate-300 mr-0.5 sm:mr-1">
                  {activeIndex + 1} of {slides.length}
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeIndex
                          ? 'w-4 sm:w-7 bg-gradient-to-r from-orange-500 to-amber-500'
                          : 'w-2 sm:w-2.5 bg-slate-700 hover:bg-slate-500'
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
    </div>
  );
};
