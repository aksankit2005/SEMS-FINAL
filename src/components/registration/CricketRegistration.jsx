import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const CricketRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Cricket"
      minPlayers={11}
      maxPlayers={15}
    />
  );
};

export const validateCricket = (step, formData) => {
  return validateTeamSport(step, formData, 11, 15);
};
