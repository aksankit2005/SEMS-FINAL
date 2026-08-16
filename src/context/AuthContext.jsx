import React, { createContext, useContext, useState } from 'react';
import { coordinatorApi } from '../services/coordinatorApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sems_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userRegistrations, setUserRegistrations] = useState(() => {
    const saved = localStorage.getItem('sems_registrations');
    return saved ? JSON.parse(saved) : [];
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('sems_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sems_user');
  };

  const addRegistration = (registrationData) => {
    const updated = [registrationData, ...userRegistrations.filter(r => r.id !== registrationData.id)];
    setUserRegistrations(updated);
    localStorage.setItem('sems_registrations', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        userRegistrations,
        addRegistration
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
