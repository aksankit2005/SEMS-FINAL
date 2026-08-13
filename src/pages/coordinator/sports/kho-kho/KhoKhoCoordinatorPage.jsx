import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coordinatorApi } from '../../../../services/coordinatorApi';
import { CoordinatorHeader } from '../../../../components/coordinator/CoordinatorHeader';
import { ProfileTab } from '../../../../components/coordinator/tabs/ProfileTab';
import { KhoKhoEventsTab } from '../../../../components/coordinator/tabs/KhoKhoEventsTab';
import { KhoKhoMatchScheduleTab } from '../../../../components/coordinator/tabs/KhoKhoMatchScheduleTab';
import { KhoKhoLiveMatchControlTab } from '../../../../components/coordinator/tabs/KhoKhoLiveMatchControlTab';
import { KhoKhoResultManagementTab } from '../../../../components/coordinator/tabs/KhoKhoResultManagementTab';
import { KhoKhoTotalParticipationTab } from '../../../../components/coordinator/tabs/KhoKhoTotalParticipationTab';
import { useToast } from '../../../../context/ToastContext';

export const KhoKhoCoordinatorPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => {
    const current = coordinatorApi.getCurrentUser();
    if (current && (current.assignedSport === 'kho-kho' || current.assignedSport === 'kho_kho')) return current;
    const preset = coordinatorApi.getPresetAccount ? coordinatorApi.getPresetAccount('kho-kho') : null;
    return preset || {
      username: 'coord_kho_kho',
      assignedSport: 'kho-kho',
      sportName: 'Kho-Kho',
      coordinatorName: 'Sunita Jadhav',
      email: 'khokho.coord@sems.edu'
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
        if (showLoading) addToast('Error loading Kho-Kho operations console', 'error');
      } finally {
        if (showLoading && isMounted) setLoading(false);
      }
    };

    if (user) {
      fetchAllData(true);

      const pollInterval = setInterval(() => {
        fetchAllData(false);
      }, 5000);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-amber-500 selection:text-white transition-colors duration-150">

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
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading Kho-Kho operations console...</p>
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
              <KhoKhoEventsTab user={user} />
            )}

            {activeTab === 'schedule' && (
              <KhoKhoMatchScheduleTab
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
              <KhoKhoLiveMatchControlTab
                matches={matches}
                user={user}
                onUpdateMatchScore={handleUpdateLiveScore}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'results' && (
              <KhoKhoResultManagementTab
                user={user}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'participants' && (
              <KhoKhoTotalParticipationTab
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
