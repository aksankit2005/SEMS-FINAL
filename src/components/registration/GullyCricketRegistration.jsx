import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const GullyCricketRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Gully Cricket"
      minPlayers={5}
      maxPlayers={8}
    />
  );
};

export const validateGullyCricket = (step, formData) => {
  return validateTeamSport(step, formData, 5, 8);
};

export default GullyCricketRegistration;
