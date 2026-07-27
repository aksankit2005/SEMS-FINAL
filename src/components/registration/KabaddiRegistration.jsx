import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const KabaddiRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Kabaddi"
      minPlayers={7}
      maxPlayers={12}
    />
  );
};

export const validateKabaddi = (step, formData) => {
  return validateTeamSport(step, formData, 7, 12);
};
