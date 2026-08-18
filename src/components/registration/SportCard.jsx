import React, { useState } from 'react';
import { UnifiedSportCard } from '../common/UnifiedSportCard';
import { BadmintonRulesModal } from './BadmintonRulesDisplay';
import { computeEffectiveRegistrationStatus } from '../../utils/registrationLifecycle';

export const SportCard = ({ sport, onRegisterSelect }) => {
  const [showRulesModal, setShowRulesModal] = useState(false);

  const getSafeDate = (dStr, defaultStr) => {
    if (!dStr) return defaultStr;
    return dStr;
  };

  const startDate = getSafeDate(sport.regStartDate || sport.startDate, '2026-08-01');
  const endDate = getSafeDate(sport.regEndDate || sport.endDate, '2026-08-30');

  const regStatus = computeEffectiveRegistrationStatus({
    status: sport.status || 'Published',
    registrationOpen: sport.registrationOpen !== false,
    regStartDate: startDate,
    regEndDate: endDate,
    registeredCount: sport.registeredCount || sport.participantsCount,
    maxRegistrations: sport.maxRegistrations || sport.maxParticipants
  });
  const isOpen = regStatus.effectiveRegistrationOpen;

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
