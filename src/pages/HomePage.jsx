import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { LiveTicker } from '../components/home/LiveTicker';
import { QuickStats } from '../components/home/QuickStats';
import { FeaturedSports } from '../components/home/FeaturedSports';
import { TournamentHighlights } from '../components/home/TournamentHighlights';
import { CTASection } from '../components/home/CTASection';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeroSection />
      <LiveTicker />
      <QuickStats />
      <FeaturedSports />
      <TournamentHighlights />
      <CTASection />
    </div>
  );
};
