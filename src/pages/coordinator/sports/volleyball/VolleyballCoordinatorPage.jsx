import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coordinatorApi } from '../../../../services/coordinatorApi';
import { CoordinatorHeader } from '../../../../components/coordinator/CoordinatorHeader';
import { ProfileTab } from '../../../../components/coordinator/tabs/ProfileTab';
import { VolleyballEventsTab } from '../../../../components/coordinator/tabs/VolleyballEventsTab';
import { VolleyballMatchScheduleTab } from '../../../../components/coordinator/tabs/VolleyballMatchScheduleTab';
import { VolleyballLiveMatchControlTab } from '../../../../components/coordinator/tabs/VolleyballLiveMatchControlTab';
import { VolleyballResultManagementTab } from '../../../../components/coordinator/tabs/VolleyballResultManagementTab';
import { VolleyballTotalParticipationTab } from '../../../../components/coordinator/tabs/VolleyballTotalParticipationTab';
import { useToast } from '../../../../context/ToastContext';

export const VolleyballCoordinatorPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => {
    const current = coordinatorApi.getCurrentUser();
    if (current && current.assignedSport === 'volleyball') return current;
    const preset = coordinatorApi.getPresetAccount ? coordinatorApi.getPresetAccount('volleyball') : null;
    return preset || {
      username: 'coord_volleyball',
      assignedSport: 'volleyball',
      sportName: 'Volleyball',
      coordinatorName: 'Siddharth Rao',
      email: 'volleyball.coord@apex.edu'
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
        if (showLoading) addToast('Error loading volleyball operations console', 'error');
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
            <p className="text-xs font-mono text-slate-400">Loading Volleyball operations console...</p>
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
              <VolleyballEventsTab user={user} />
            )}

            {activeTab === 'schedule' && (
              <VolleyballMatchScheduleTab
                matches={matches}
                user={user}
                onUpdateMatches={handleUpdateMatches}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'live-control' && (
              <VolleyballLiveMatchControlTab
                matches={matches}
                user={user}
                onUpdateMatchScore={handleUpdateLiveScore}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'results' && (
              <VolleyballResultManagementTab
                user={user}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'participants' && (
              <VolleyballTotalParticipationTab
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
