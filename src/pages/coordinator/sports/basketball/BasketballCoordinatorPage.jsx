import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coordinatorApi } from '../../../../services/coordinatorApi';
import { CoordinatorHeader } from '../../../../components/coordinator/CoordinatorHeader';
import { ProfileTab } from '../../../../components/coordinator/tabs/ProfileTab';
import { BasketballEventsTab } from '../../../../components/coordinator/tabs/BasketballEventsTab';
import { BasketballMatchScheduleTab } from '../../../../components/coordinator/tabs/BasketballMatchScheduleTab';
import { BasketballLiveMatchControlTab } from '../../../../components/coordinator/tabs/BasketballLiveMatchControlTab';
import { ResultManagementTab } from '../../../../components/coordinator/tabs/ResultManagementTab';
import { TotalParticipationTab } from '../../../../components/coordinator/tabs/TotalParticipationTab';
import { useToast } from '../../../../context/ToastContext';

export const BasketballCoordinatorPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => {
    const current = coordinatorApi.getCurrentUser();
    if (current && current.assignedSport === 'basketball') return current;
    const preset = coordinatorApi.getPresetAccount ? coordinatorApi.getPresetAccount('basketball') : null;
    return preset || {
      username: 'coord_basketball',
      assignedSport: 'basketball',
      sportName: 'Basketball',
      coordinatorName: 'Michael Jordan Singh',
      email: 'basketball.coord@apex.edu'
    };
  });

  const [activeTab, setActiveTab] = useState('events');
  const [globalSearch, setGlobalSearch] = useState('');

  // Dynamic Data States
  const [matches, setMatches] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        const [mList, rList] = await Promise.all([
          coordinatorApi.getMatches(),
          coordinatorApi.getRegistrations(),
        ]);
        if (isMounted) {
          setMatches(mList);
          setRegistrations(rList);
        }
      } catch (err) {
        if (showLoading) addToast('Error loading basketball operations console', 'error');
      } finally {
        if (showLoading && isMounted) setLoading(false);
      }
    };

    if (user) {
      fetchAllData(true);

      // Real-time synchronization polling every 15 seconds
      const pollInterval = setInterval(() => {
        if (activeTab !== 'live') {
          fetchAllData(false);
        }
      }, 15000);

      return () => {
        isMounted = false;
        clearInterval(pollInterval);
      };
    }
  }, [user]);

  const handleLogout = () => {
    coordinatorApi.logout();
    addToast('Coordinator session ended', 'info');
    navigate('/coordinator/login');
  };

  const handleUpdateMatches = (updated) => {
    setMatches(updated);
    coordinatorApi.saveMatches(updated);
  };

  const handleUpdateRegistrations = (updated) => {
    setRegistrations(updated);
    coordinatorApi.saveRegistrations(updated);
  };

  const handleUpdateLiveScore = (matchId, scoreData) => {
    if (scoreData?.status === 'COMPLETED' || scoreData?.status === 'FINISHED') {
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } else {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...scoreData } : m)));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors duration-150">

      {/* Top Header & Horizontal Tabs Navigation Bar */}
      <CoordinatorHeader
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
      />

      {/* Main Body Container */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto space-y-3">

        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading Basketball operations console...</p>
          </div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                matches={matches}
                registrations={registrations}
                onLogout={handleLogout}
              />
            )}

            {activeTab === 'events' && (
              <BasketballEventsTab user={user} />
            )}

            {activeTab === 'schedule' && (
              <BasketballMatchScheduleTab
                matches={matches}
                user={user}
                onUpdateMatches={handleUpdateMatches}
                onNavigateToLive={() => {
                  setActiveTab('live-control');
                }}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'live-control' && (
              <BasketballLiveMatchControlTab
                matches={matches}
                user={user}
                onUpdateMatchScore={handleUpdateLiveScore}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'results' && (
              <ResultManagementTab
                user={user}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'participants' && (
              <TotalParticipationTab
                registrations={registrations}
                user={user}
                onUpdateRegistrations={handleUpdateRegistrations}
                globalSearch={globalSearch}
              />
            )}
          </>
        )}

      </main>

    </div>
  );
};
