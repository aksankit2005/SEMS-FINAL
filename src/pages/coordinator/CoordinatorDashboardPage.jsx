import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coordinatorApi } from '../../services/coordinatorApi';
import { CoordinatorHeader } from '../../components/coordinator/CoordinatorHeader';
import { EventsTab } from '../../components/coordinator/tabs/EventsTab';
import { MatchScheduleTab } from '../../components/coordinator/tabs/MatchScheduleTab';
import { LiveMatchControlTab } from '../../components/coordinator/tabs/LiveMatchControlTab';
import { ResultManagementTab } from '../../components/coordinator/tabs/ResultManagementTab';
import { TotalParticipationTab } from '../../components/coordinator/tabs/TotalParticipationTab';
import { useToast } from '../../context/ToastContext';

export const CoordinatorDashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(() => coordinatorApi.getCurrentUser());
  const [activeTab, setActiveTab] = useState('events');

  const [globalSearch, setGlobalSearch] = useState('');

  // Dynamic Data States
  const [matches, setMatches] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [mList, rList] = await Promise.all([
          coordinatorApi.getMatches(),
          coordinatorApi.getRegistrations(),
        ]);
        setMatches(mList);
        setRegistrations(rList);
      } catch (err) {
        addToast('Error loading operations console', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-150">
      
      {/* Top Header & Horizontal Tabs Navigation Bar */}
      <CoordinatorHeader
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
      />

      {/* Main Body - Single Flat Container Exposing Data Immediately */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto space-y-3">
        
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading {user?.sportName || 'Sports'} operations console...</p>
          </div>
        ) : (
          <>
            {activeTab === 'events' && (
              <EventsTab user={user} />
            )}

            {activeTab === 'schedule' && (
              <MatchScheduleTab
                matches={matches}
                user={user}
                onUpdateMatches={handleUpdateMatches}
                onNavigateToLive={(matchId) => {
                  setActiveTab('live-control');
                }}
                globalSearch={globalSearch}
              />
            )}


            {activeTab === 'live-control' && (
              <LiveMatchControlTab
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

