import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coordinatorApi } from '../../../../services/coordinatorApi';
import { CoordinatorHeader } from '../../../../components/coordinator/CoordinatorHeader';
import { ProfileTab } from '../../../../components/coordinator/tabs/ProfileTab';
import { TugOfWarEventsTab } from '../../../../components/coordinator/tabs/TugOfWarEventsTab';
import { TugOfWarMatchScheduleTab } from '../../../../components/coordinator/tabs/TugOfWarMatchScheduleTab';
import { TugOfWarLiveMatchControlTab } from '../../../../components/coordinator/tabs/TugOfWarLiveMatchControlTab';
import { TugOfWarResultManagementTab } from '../../../../components/coordinator/tabs/TugOfWarResultManagementTab';
import { TugOfWarTotalParticipationTab } from '../../../../components/coordinator/tabs/TugOfWarTotalParticipationTab';
import { useToast } from '../../../../context/ToastContext';

export const TugOfWarCoordinatorPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => {
    const current = coordinatorApi.getCurrentUser();
    if (current && current.assignedSport === 'tug-of-war') return current;
    const preset = coordinatorApi.getPresetAccount ? coordinatorApi.getPresetAccount('tug-of-war') : null;
    return preset || {
      username: 'coord_tug_of_war',
      assignedSport: 'tug-of-war',
      sportName: 'Tug of War',
      coordinatorName: 'Vikram Singh',
      email: 'tugofwar.coord@apex.edu'
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
        if (showLoading) addToast('Error loading tug of war operations console', 'error');
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
      setMatches((prev) => {
        const updated = prev.filter((m) => m.id !== matchId);
        coordinatorApi.saveMatches(updated);
        return updated;
      });
    } else {
      setMatches((prev) => {
        const updated = prev.map((m) => (m.id === matchId ? { ...m, ...scoreData } : m));
        coordinatorApi.saveMatches(updated);
        return updated;
      });
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
            <p className="text-xs font-mono text-slate-400">Loading Tug of War operations console...</p>
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
              <TugOfWarEventsTab user={user} />
            )}

            {activeTab === 'schedule' && (
              <TugOfWarMatchScheduleTab
                matches={matches}
                user={user}
                onUpdateMatches={handleUpdateMatches}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'live-control' && (
              <TugOfWarLiveMatchControlTab
                matches={matches}
                user={user}
                onUpdateMatchScore={handleUpdateLiveScore}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'results' && (
              <TugOfWarResultManagementTab
                user={user}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'participants' && (
              <TugOfWarTotalParticipationTab
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
