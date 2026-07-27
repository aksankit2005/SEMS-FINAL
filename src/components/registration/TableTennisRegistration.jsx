import React from 'react';
import { BaseRacketRegistration, validateRacketSport } from './BaseRacketRegistration';

export const TableTennisRegistration = (props) => {
  return (
    <BaseRacketRegistration
      {...props}
      sportName="Table Tennis"
    />
  );
};

export const validateTableTennis = (step, formData) => {
  return validateRacketSport(step, formData);
};
