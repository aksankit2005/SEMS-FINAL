import React, { createContext, useContext, useState } from 'react';
import { coordinatorApi } from '../services/coordinatorApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sems_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const DEFAULT_SAMPLE_REGISTRATIONS = [
    {
      id: "REG-1001",
      sportName: "Table Tennis",
      eventTitle: "Table Tennis Mens Singles Championship 2026",
      studentName: "Aarav Sharma",
      college: "MPEC Kanpur",
      category: "Singles",
      status: "VERIFIED",
      qrCode: "TT-AARAV-2026-MPEC",
      registrationDate: "2026-08-01",
      amountPaid: 300
    },
    {
      id: "REG-1002",
      sportName: "Badminton",
      eventTitle: "Badminton Mixed Doubles Championship 2026",
      studentName: "Aarav Sharma",
      college: "MPEC Kanpur",
      category: "Doubles",
      status: "APPROVED",
      qrCode: "BAD-AARAV-2026-MPEC",
      registrationDate: "2026-08-02",
      amountPaid: 600
    }
  ];

  const [userRegistrations, setUserRegistrations] = useState(() => {
    const saved = localStorage.getItem('sems_registrations');
    return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_REGISTRATIONS;
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
