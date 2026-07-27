import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const TugOfWarRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Tug of War"
      minPlayers={8}
      maxPlayers={8}
    />
  );
};

export const validateTugOfWar = (step, formData) => {
  return validateTeamSport(step, formData, 8, 8);
};
