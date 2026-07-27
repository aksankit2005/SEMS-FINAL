import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const KhoKhoRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Kho Kho"
      minPlayers={9}
      maxPlayers={12}
    />
  );
};

export const validateKhoKho = (step, formData) => {
  return validateTeamSport(step, formData, 9, 12);
};
