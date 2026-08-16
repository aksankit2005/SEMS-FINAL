import React, { useState } from 'react';
import { UnifiedSportCard } from '../common/UnifiedSportCard';
import { BadmintonRulesModal } from './BadmintonRulesDisplay';

export const SportCard = ({ sport, onRegisterSelect }) => {
  const [showRulesModal, setShowRulesModal] = useState(false);

  const getSafeDate = (dStr, defaultStr) => {
    if (!dStr) return defaultStr;
    return dStr;
  };

  const startDate = getSafeDate(sport.startDate, '2026-08-01');
  const endDate = getSafeDate(sport.endDate, '2026-08-30');

  const now = new Date();
  const startObj = new Date(startDate.includes('T') ? startDate : startDate + 'T00:00:00');
  const endObj = new Date(endDate.includes('T') ? endDate : endDate + 'T23:59:59');
  const isOpen = now >= startObj && now <= endObj;

  const activeEvent = {
    entryFee: typeof sport.entryFee === 'number' ? sport.entryFee : (typeof sport.teamFee === 'number' ? sport.teamFee : (sport.entryFee ?? sport.teamFee ?? 0)),
    regStartDate: startDate,
    regEndDate: endDate,
    tournStartDate: startDate,
    tournEndDate: endDate,
    venue: sport.venue || 'Central Arena'
  };

  return (
    <>
      <UnifiedSportCard
        sport={sport}
        activeEvent={activeEvent}
        isOpen={isOpen}
        onRulesClick={() => setShowRulesModal(true)}
        onRegisterClick={() => isOpen && onRegisterSelect(sport)}
      />

      <BadmintonRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        sportName={sport.name}
      />
    </>
  );
};
