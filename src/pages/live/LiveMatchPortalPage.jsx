import React, { useState, useEffect } from 'react';
import { Search, Clock, Play, Tv, RefreshCw, Video } from 'lucide-react';
import { Footer } from '../../components/layout/Footer';
import { LiveMatchViewerModal } from '../../components/live/LiveMatchViewerModal';
import { coordinatorApi } from '../../services/coordinatorApi';
import { getSportConfig } from '../../data/sportsConfig';

export const LiveMatchPortalPage = () => {
  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      const publicLive = await coordinatorApi.getPublicLiveMatches();
      const localActiveStr = localStorage.getItem('sems_active_live_matches');
      let localActiveList = [];

      if (localActiveStr) {
        try {
          const parsed = JSON.parse(localActiveStr);
          localActiveList = Object.values(parsed).filter(
            (m) => m && (m.status === 'running' || m.status === 'live')
          );
        } catch (e) {}
      }

      // Merge backend matches & local active matches (removing duplicate IDs)
      const combined = [...(publicLive || []), ...localActiveList];
      const uniqueMap = {};
      combined.forEach((m) => {
        if (m && m.id && (m.status === 'running' || m.status === 'live')) {
          uniqueMap[m.id] = {
            ...m,
            sportId: m.sportId || 'table-tennis',
            sportName: m.sportName || 'TABLE TENNIS',
            tableNumber: m.tableNumber || m.venue || 'Table 1',
            matchTitle: m.matchTitle || `${m.team1} vs ${m.team2}`,
            liveTimer: m.liveTimer || '14:32',
          };
        }
      });

      setLiveMatches(Object.values(uniqueMap));

      // Dynamic upcoming scheduled matches fetching (purging mock names)
      const upcomingList = [];
      const mockNames = [
        '1', '2', 'a', 'b', 'player 1', 'player 2', 'player 3', 'player 4', 'team 1', 'team 2', 'team a', 'team b', 'albert', 'romi',
        'aarav sharma (mpec)', 'rohan gupta (mips)', 'ankur dixit (mpcps)', 'aditya singh (mpec)',
        'aagaz khan (mpcps kn142)', 'shiv prakash (mpcps kn142)', 'kapil verma (mpcps kn142)', 'anubhav sachan (mpcps kn142)',
        'kapil verma', 'anubhav sachan', 'team a', 'team b', 'team 1', 'team 2', 'player / team a', 'player / team b'
      ];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sems_coord_matches_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              const sportId = key.replace('sems_coord_matches_', '');
              list.forEach((m) => {
                if (m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'running' && m.status !== 'live') {
                  const t1 = (m.team1 || '').trim().toLowerCase();
                  const t2 = (m.team2 || '').trim().toLowerCase();
                  if (mockNames.includes(t1) || mockNames.includes(t2)) return;
                  if (!upcomingList.some((u) => u.id === m.id)) {
                    upcomingList.push({
                      id: m.id || `M-${Math.random()}`,
                      sportId,
                      matchTitle: m.matchTitle || `${m.team1} vs ${m.team2}`,
                      team1: m.team1,
                      team2: m.team2,
                      venue: m.tableNumber || m.venue || 'Court 1',
                      time: m.time || '05:30 PM',
                      date: m.date || 'Today'
                    });
                  }
                }
              });
            }
          } catch (e) {}
        }
      }
      setUpcomingMatches(upcomingList);
    } catch (err) {
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(() => fetchScores(), 1500);
    const handleRefresh = () => fetchScores();
    window.addEventListener('sems_matches_updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sems_matches_updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  const filteredLiveMatches = liveMatches.filter((m) => {
    const matchesSearch =
      !search ||
      m.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
      m.team1?.toLowerCase().includes(search.toLowerCase()) ||
      m.team2?.toLowerCase().includes(search.toLowerCase()) ||
      m.tableNumber?.toLowerCase().includes(search.toLowerCase()) ||
      m.venue?.toLowerCase().includes(search.toLowerCase());

    const matchesSport =
      selectedSport === 'All' ||
      m.sportId?.toLowerCase() === selectedSport.toLowerCase() ||
      m.sportName?.toLowerCase().includes(selectedSport.toLowerCase());

    return matchesSearch && matchesSport;
  });

  const filteredUpcomingMatches = upcomingMatches.filter((m) => {
    const matchesSearch =
      !search ||
      m.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
      m.team1?.toLowerCase().includes(search.toLowerCase()) ||
      m.team2?.toLowerCase().includes(search.toLowerCase()) ||
      m.venue?.toLowerCase().includes(search.toLowerCase());

    const matchesSport =
      selectedSport === 'All' ||
      m.sportId?.toLowerCase() === selectedSport.toLowerCase() ||
      m.sportName?.toLowerCase().includes(selectedSport.toLowerCase());

    return matchesSearch && matchesSport;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      
      {/* Live Spectator Header */}
      <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  SEMS 2026 Spectator Live Match Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                  🔴 LIVE AUTO-SYNC
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search live match, player, court..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* Sport / Game Filter Bar */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Filter Live Matches & Schedule by Sport
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { id: 'All', name: 'All Games', icon: '🏆' },
              { id: 'badminton', name: 'Badminton', icon: '🏸' },
              { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
              { id: 'cricket', name: 'Cricket', icon: '🏏' },
              { id: 'football', name: 'Football', icon: '⚽' },
              { id: 'basketball', name: 'Basketball', icon: '🏀' },
              { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
              { id: 'chess', name: 'Chess', icon: '♟️' },
              { id: 'kabaddi', name: 'Kabaddi', icon: '🤼' },
              { id: 'kho-kho', name: 'Kho-Kho', icon: '🏃' },
              { id: 'athletics', name: 'Athletics', icon: '🏃‍♂️' },
            ].map((s) => {
              const isSelected = selectedSport.toLowerCase() === s.id.toLowerCase();
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSport(s.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-md shadow-blue-600/25 dark:shadow-indigo-600/30'
                      : 'bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Live Matches Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Currently Live Matches ({filteredLiveMatches.length})
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-spin" /> Real-Time Coordinator Sync
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-2">
              <div className="w-8 h-8 border-2 border-blue-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Loading live scores from server...</p>
            </div>
          ) : filteredLiveMatches.length === 0 ? (
            
            /* Empty State */
            <div className="py-16 px-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] text-center space-y-3 shadow-soft dark:shadow-xl">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto text-2xl">
                🏟️
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Live Matches Currently</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {selectedSport !== 'All'
                  ? `There are no live ${selectedSport} matches active right now.`
                  : 'There are no matches actively being played right now. Check back shortly or view upcoming scheduled matches below.'}
              </p>
            </div>

          ) : (

            /* Live Match Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredLiveMatches.map((m) => {
                const sportConfig = getSportConfig(m.sportId || 'table-tennis');

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-blue-500/50 dark:hover:border-indigo-500/50 shadow-soft dark:shadow-xl transition space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                          🔴 LIVE
                        </span>
                        {m.youtubeVideoId && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" /> STREAM
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {m.tableNumber || m.venue || sportConfig.venueOptions[0]}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-wider">
                        {sportConfig.icon} {sportConfig.name} • #{m.id}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{m.matchTitle || `${m.team1} vs ${m.team2}`}</h3>
                    </div>

                    {/* Spectator Score Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{m.college1 || 'MPEC'}</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{m.team1}</p>
                      </div>

                      <div className="text-center font-mono font-black text-2xl text-blue-600 dark:text-indigo-400">
                        {m.score1} : {m.score2}
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{m.college2 || 'MIPS'}</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{m.team2}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {m.liveTimer || '14:32'}
                      </span>

                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {m.youtubeVideoId ? <Tv className="w-3.5 h-3.5 text-rose-300" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{m.youtubeVideoId ? 'Watch Live Stream' : 'View Live Scoreboard'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          )}
        </div>

        {/* Upcoming Matches Section */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <span>📅</span> Upcoming Tournament Schedule ({filteredUpcomingMatches.length})
          </h2>

          {filteredUpcomingMatches.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B]">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No upcoming matches scheduled currently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredUpcomingMatches.map((up) => (
                <div key={up.id} className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-blue-600 dark:text-indigo-400">{up.time}</span>
                    <span className="font-mono">{up.venue}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{up.matchTitle}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{up.team1} vs {up.team2}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>


      {/* Spectator Detailed Viewer Modal */}
      {selectedMatch && (
        <LiveMatchViewerModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
};

