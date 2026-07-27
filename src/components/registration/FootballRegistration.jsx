import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const FootballRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Football"
      minPlayers={11}
      maxPlayers={16}
    />
  );
};

export const validateFootball = (step, formData) => {
  return validateTeamSport(step, formData, 11, 16);
};
