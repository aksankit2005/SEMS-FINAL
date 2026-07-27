import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const VolleyballRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Volleyball"
      minPlayers={6}
      maxPlayers={10}
    />
  );
};

export const validateVolleyball = (step, formData) => {
  return validateTeamSport(step, formData, 6, 10);
};
