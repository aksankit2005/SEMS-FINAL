import React, { useState, useEffect } from 'react';
import { Search, Clock, Play, Tv, RefreshCw, Video } from 'lucide-react';
import { Footer } from '../../components/layout/Footer';
import { LiveMatchViewerModal } from '../../components/live/LiveMatchViewerModal';
import { coordinatorApi } from '../../services/coordinatorApi';
import { getSportConfig, resolveSportConfig } from '../../data/sportsConfig';

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
          const resolved = resolveSportConfig(m);
          uniqueMap[m.id] = {
            ...m,
            sportId: resolved.id,
            sportName: resolved.name,
            tableNumber: m.tableNumber || m.venue || resolved.venueOptions[0],
            matchTitle: m.matchTitle || `${m.team1} vs ${m.team2}`,
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
              const rawSportId = key.replace('sems_coord_matches_', '');
              const resolvedUpcomingSport = resolveSportConfig(rawSportId);
              list.forEach((m) => {
                if (m && m.status !== 'COMPLETED' && m.status !== 'FINISHED' && m.status !== 'running' && m.status !== 'live') {
                  const t1 = (m.team1 || '').trim().toLowerCase();
                  const t2 = (m.team2 || '').trim().toLowerCase();
                  if (mockNames.includes(t1) || mockNames.includes(t2)) return;
                  if (!upcomingList.some((u) => u.id === m.id)) {
                    upcomingList.push({
                      id: m.id || `M-${Math.random()}`,
                      sportId: resolvedUpcomingSport.id,
                      sportName: resolvedUpcomingSport.name,
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

  useEffect(() => {
    if (selectedMatch && selectedMatch.id) {
      const fresh = liveMatches.find((m) => m.id === selectedMatch.id);
      if (fresh) {
        setSelectedMatch((prev) => {
          if (
            prev &&
            prev.score1 === fresh.score1 &&
            prev.score2 === fresh.score2 &&
            prev.setsWon1 === fresh.setsWon1 &&
            prev.setsWon2 === fresh.setsWon2 &&
            JSON.stringify(prev.setsHistory) === JSON.stringify(fresh.setsHistory)
          ) {
            return prev;
          }
          return fresh;
        });
      }
    }
  }, [liveMatches]);



  // Helper to extract short college abbreviation
  const getShortCollege = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return null;
    const s = name.trim();
    if (s.toLowerCase().includes('maharana pratap engineering') || s.toLowerCase().includes('mpec')) return 'MPEC';
    if (s.toLowerCase().includes('madhav institute') || s.toLowerCase().includes('mips')) return 'MIPS';
    if (s.toLowerCase().includes('pharmacy') || s.toLowerCase().includes('mpcps')) return 'MPCPS';
    if (s.toLowerCase().includes('degree') || s.toLowerCase().includes('mpdc')) return 'MPDC';
    if (s.length <= 6) return s.toUpperCase();
    return s.split(' ').map((w) => w[0]).join('').toUpperCase();
  };

  const filteredLiveMatches = liveMatches.filter((m) => {
    const sportConfig = resolveSportConfig(m);
    const matchesSearch =
      !search ||
      m.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
      m.team1?.toLowerCase().includes(search.toLowerCase()) ||
      m.team2?.toLowerCase().includes(search.toLowerCase()) ||
      m.tableNumber?.toLowerCase().includes(search.toLowerCase()) ||
      m.venue?.toLowerCase().includes(search.toLowerCase()) ||
      sportConfig.name.toLowerCase().includes(search.toLowerCase());

    const matchesSport =
      selectedSport === 'All' ||
      sportConfig.id.toLowerCase() === selectedSport.toLowerCase() ||
      sportConfig.name.toLowerCase().includes(selectedSport.toLowerCase());

    return matchesSearch && matchesSport;
  });

  const filteredUpcomingMatches = upcomingMatches.filter((m) => {
    const sportConfig = resolveSportConfig(m);
    const matchesSearch =
      !search ||
      m.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
      m.team1?.toLowerCase().includes(search.toLowerCase()) ||
      m.team2?.toLowerCase().includes(search.toLowerCase()) ||
      m.venue?.toLowerCase().includes(search.toLowerCase());

    const matchesSport =
      selectedSport === 'All' ||
      sportConfig.id.toLowerCase() === selectedSport.toLowerCase() ||
      sportConfig.name.toLowerCase().includes(selectedSport.toLowerCase());

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
                const sportConfig = resolveSportConfig(m);

                return (
                  <div
                    key={m.id}
                    className="p-6 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] hover:border-blue-500/50 dark:hover:border-indigo-500/50 shadow-soft dark:shadow-xl transition space-y-4 group"
                  >
                    {/* Top Bar: Noticeable LIVE Badge & Court/Venue */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-mono font-black flex items-center gap-1.5 shadow-xs animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> 🔴 LIVE
                        </span>
                        {m.youtubeVideoId && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                            <Video className="w-3 h-3" /> STREAM
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        {m.tableNumber || m.venue || sportConfig.venueOptions[0]}
                      </span>
                    </div>

                    {/* Primary Heading: Sport Name (Largest), Match Title (A vs B), & Match ID */}
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black uppercase text-blue-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                        <span>{sportConfig.icon}</span>
                        <span>{sportConfig.name}</span>
                      </h2>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {m.matchTitle || `${m.team1} vs ${m.team2}`}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block pt-0.5">
                        Match ID: <strong className="text-slate-700 dark:text-slate-300">#{m.id}</strong>
                      </span>
                    </div>

                    {/* Prominent Spectator Score Box (No fallback MPEC/MIPS) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between shadow-inner">
                      <div className="space-y-0.5 max-w-[35%]">
                        {getShortCollege(m.college1) && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block">
                            {getShortCollege(m.college1)}
                          </span>
                        )}
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{m.team1}</p>
                      </div>

                      <div className="text-center font-mono font-black text-3xl sm:text-4xl text-blue-600 dark:text-indigo-400 tracking-tight px-2">
                        {m.score1} <span className="text-slate-400 dark:text-slate-600 text-2xl sm:text-3xl font-normal">:</span> {m.score2}
                      </div>

                      <div className="text-right space-y-0.5 max-w-[35%]">
                        {getShortCollege(m.college2) && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block">
                            {getShortCollege(m.college2)}
                          </span>
                        )}
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{m.team2}</p>
                      </div>
                    </div>

                    {/* Card Action Bar (Timer Completely Removed) */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {m.youtubeVideoId ? <Tv className="w-4 h-4 text-rose-300" /> : <Play className="w-4 h-4" />}
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

