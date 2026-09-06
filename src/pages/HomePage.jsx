import React from 'react';
import { HomeHeroBanner } from '../components/home/HomeHeroBanner';
import { HomeLiveSection } from '../components/home/HomeLiveSection';
import { HomeRegistrationSection } from '../components/home/HomeRegistrationSection';
import { HomeScheduleSection } from '../components/home/HomeScheduleSection';
import { HomeAnnouncementsLeaderboardSection } from '../components/home/HomeAnnouncementsLeaderboardSection';
import { HomeLegacySection } from '../components/home/HomeLegacySection';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] transition-colors duration-200 overflow-x-hidden font-spatial-sans">
      {/* 0. Full-Screen Grand Trophy Presentation Hero Banner */}
      <HomeHeroBanner />

      {/* 1. Championship Live Matches Arena */}
      <HomeLiveSection />

      {/* 2. Active Championship Event Registration */}
      <HomeRegistrationSection />

      {/* 3. Official Upcoming Fixtures Schedule */}
      <HomeScheduleSection />

      {/* 4. Latest Announcements & Tournament Leaderboard Standings (2 Columns on Desktop) */}
      <HomeAnnouncementsLeaderboardSection />

      {/* 5. APEX Legacy Timeline with About Us CTA */}
      <HomeLegacySection />
    </div>
  );
};

