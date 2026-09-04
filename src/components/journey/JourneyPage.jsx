import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { JOURNEY_MILESTONES } from '../../data/journeyData';
import { JourneyHUD } from './JourneyHUD';
import { JourneyTimelineRail } from './JourneyTimelineRail';
import { JourneyMilestonesOverlay } from './JourneyMilestonesOverlay';
import '../../styles/spatialGallery.css';

export const JourneyPage = ({ onExit }) => {
  const navigate = useNavigate();
  const [activeMilestoneId, setActiveMilestoneId] = useState(1);
  const lastActiveRef = useRef(1);

  const handleExit = () => {
    if (typeof onExit === 'function') {
      onExit();
    } else {
      navigate('/about');
    }
  };

  const scrollToMilestone = (id) => {
    setActiveMilestoneId(id);
    const element = document.getElementById(`milestone-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Setup Intersection Observer to highlight active milestone while scrolling
  useEffect(() => {
    const handleScroll = () => {
      const milestoneElements = JOURNEY_MILESTONES.map((m) =>
        document.getElementById(`milestone-${m.id}`)
      );

      const viewportCenter = window.innerHeight / 2;
      let closestId = 1;
      let closestDistance = Infinity;

      milestoneElements.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elementCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = JOURNEY_MILESTONES[idx].id;
        }
      });

      if (closestId !== lastActiveRef.current) {
        lastActiveRef.current = closestId;
        setActiveMilestoneId(closestId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeMilestone =
    JOURNEY_MILESTONES.find((m) => m.id === activeMilestoneId) || JOURNEY_MILESTONES[0];

  return (
    <div className="relative min-h-screen spatial-nebula-dark text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden font-sans-clean">
      
      {/* Subtle SVG Film Grain Overlay */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20"
      />

      {/* Top Floating HUD */}
      <JourneyHUD
        activeMilestone={activeMilestone}
        totalCount={JOURNEY_MILESTONES.length}
        onExit={handleExit}
      />

      {/* Main Timeline & Content Layer */}
      <main className="relative z-10">
        <JourneyMilestonesOverlay
          milestones={JOURNEY_MILESTONES}
          activeMilestoneId={activeMilestoneId}
          onSelectMilestone={scrollToMilestone}
        />
      </main>

      {/* Vertical Rail on Desktop & Bottom Pill on Mobile */}
      <JourneyTimelineRail
        milestones={JOURNEY_MILESTONES}
        activeMilestoneId={activeMilestoneId}
        onSelectMilestone={scrollToMilestone}
      />

    </div>
  );
};

export default JourneyPage;
