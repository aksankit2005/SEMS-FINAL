import React from 'react';
import { BaseRacketRegistration, validateRacketSport } from './BaseRacketRegistration';

export const BadmintonRegistration = (props) => {
  return (
    <BaseRacketRegistration
      {...props}
      sportName="Badminton"
    />
  );
};

export const validateBadminton = (step, formData) => {
  return validateRacketSport(step, formData);
};
