import React from 'react';

/**
 * JourneyTransitionPortal
 * Provides an optional smooth atmospheric portal transition wrapper
 */
export const JourneyTransitionPortal = ({ children, isEntering = false }) => {
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isEntering ? 'opacity-0 scale-98 blur-sm' : 'opacity-100 scale-100 blur-0'
      }`}
    >
      {children}
    </div>
  );
};
