import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { LiveTicker } from '../components/home/LiveTicker';
import { HomeScheduleSection } from '../components/home/HomeScheduleSection';
import { HomeAnnouncementsSection } from '../components/home/HomeAnnouncementsSection';
import { SportsProgrammeSection } from '../components/home/SportsProgrammeSection';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <HeroSection />
      <LiveTicker />
      <HomeScheduleSection />
      <HomeAnnouncementsSection />
      <SportsProgrammeSection />
    </div>
  );
};
