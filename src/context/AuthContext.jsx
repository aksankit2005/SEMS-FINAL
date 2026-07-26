import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sems_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState(() => {
    const saved = localStorage.getItem('sems_registrations');
    return saved ? JSON.parse(saved) : [
      {
        receiptId: "REC-SEMS-88912",
        sportName: "Badminton",
        category: "Mens Singles",
        participantName: "Rahul Sharma",
        college: "St. Xavier's College",
        email: "rahul.s@stxaviers.edu",
        feePaid: 400,
        status: "CONFIRMED",
        date: "2026-07-26",
        passCode: "PASS-BADM-991"
      }
    ];
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
    const updated = [registrationData, ...userRegistrations];
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
