import React from 'react';
import { BaseTeamRegistration, validateTeamSport } from './BaseTeamRegistration';

export const BasketballRegistration = (props) => {
  return (
    <BaseTeamRegistration
      {...props}
      sportName="Basketball"
      minPlayers={5}
      maxPlayers={10}
    />
  );
};

export const validateBasketball = (step, formData) => {
  return validateTeamSport(step, formData, 5, 10);
};
