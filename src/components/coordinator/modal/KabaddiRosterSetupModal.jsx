import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Check, UserCheck } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const KabaddiRosterSetupModal = ({ match, targetVenue, onClose, onRosterSaved }) => {
  const { addToast } = useToast();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [team1Name, setTeam1Name] = useState(match?.team1 || 'MPEC');
  const [team2Name, setTeam2Name] = useState(match?.team2 || 'MIPS');

  const defaultKabaddiRoster = (teamName, prefix) => [
    { id: `${prefix}-1`, name: `${teamName} Player 1`, jersey: '01', position: 'Raider', onCourt: true },
    { id: `${prefix}-2`, name: `${teamName} Player 2`, jersey: '02', position: 'Defender', onCourt: true },
    { id: `${prefix}-3`, name: `${teamName} Player 3`, jersey: '03', position: 'All Rounder', onCourt: true },
    { id: `${prefix}-4`, name: `${teamName} Player 4`, jersey: '05', position: 'Raider', onCourt: true },
    { id: `${prefix}-5`, name: `${teamName} Player 5`, jersey: '07', position: 'Defender', onCourt: true },
    { id: `${prefix}-6`, name: `${teamName} Player 6`, jersey: '09', position: 'Defender', onCourt: true },
    { id: `${prefix}-7`, name: `${teamName} Player 7`, jersey: '11', position: 'Raider', onCourt: true },
    { id: `${prefix}-8`, name: `${teamName} Sub 1`, jersey: '30', position: 'Defender', onCourt: false },
    { id: `${prefix}-9`, name: `${teamName} Sub 2`, jersey: '33', position: 'Raider', onCourt: false },
  ];

  const [roster1, setRoster1] = useState(() => {
    if (match?.playerStats1 && match.playerStats1.length >= 7) return match.playerStats1;
    return defaultKabaddiRoster(team1Name, 'T1');
  });

  const [roster2, setRoster2] = useState(() => {
    if (match?.playerStats2 && match.playerStats2.length >= 7) return match.playerStats2;
    return defaultKabaddiRoster(team2Name, 'T2');
  });

  useEffect(() => {
    if (!match?.eventId) return;
    const fetchRegisteredRosters = async () => {
      try {
        const eligible = await coordinatorApi.getEligibleCompetitors(match.eventId);
        if (!eligible || !eligible.teams || eligible.teams.length === 0) return;

        const findTeam = (name, id) => {
          return eligible.teams.find((t) => (id && (t.id === id || t.registrationId === id)) || t.teamName === name || t.displayName === name);
        };

        const t1 = findTeam(match.team1, match.team1Id);
        const t2 = findTeam(match.team2, match.team2Id);

        if (t1 && Array.isArray(t1.members) && t1.members.length > 0) {
          const mapped1 = t1.members.map((m, idx) => ({
            id: `T1-${m.id || idx + 1}`,
            name: m.name || `Player ${idx + 1}`,
            jersey: String(idx + 1).padStart(2, '0'),
            position: idx % 3 === 0 ? 'Raider' : idx % 3 === 1 ? 'Defender' : 'All Rounder',
            onCourt: idx < 7,
          }));
          setRoster1(mapped1);
        }

        if (t2 && Array.isArray(t2.members) && t2.members.length > 0) {
          const mapped2 = t2.members.map((m, idx) => ({
            id: `T2-${m.id || idx + 1}`,
            name: m.name || `Player ${idx + 1}`,
            jersey: String(idx + 1).padStart(2, '0'),
            position: idx % 3 === 0 ? 'Raider' : idx % 3 === 1 ? 'Defender' : 'All Rounder',
            onCourt: idx < 7,
          }));
          setRoster2(mapped2);
        }
      } catch (err) {
        console.warn('Could not auto-populate registered kabaddi rosters:', err);
      }
    };
    fetchRegisteredRosters();
  }, [match?.eventId, match?.team1, match?.team2, match?.team1Id, match?.team2Id]);

  const handleAddPlayer = (teamNum) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;
    const prefix = teamNum === 1 ? 'T1' : 'T2';

    if (list.length >= 12) {
      addToast(`Maximum 12 players allowed for ${currentTeam}`, 'error');
      return;
    }

    const nextJersey = String(Math.floor(Math.random() * 90) + 1).padStart(2, '0');
    const newPlayer = {
      id: `${prefix}-${Date.now()}`,
      name: `${currentTeam} Player ${list.length + 1}`,
      jersey: nextJersey,
      position: 'Raider',
      onCourt: list.filter((p) => p.onCourt !== false).length < 7,
    };

    setList([...list, newPlayer]);
  };

  const handleRemovePlayer = (teamNum, id) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;

    if (list.length <= 7) {
      addToast(`Minimum 7 players required for ${currentTeam}`, 'error');
      return;
    }

    setList(list.filter((p) => p.id !== id));
  };

  const handleUpdatePlayer = (teamNum, id, field, value) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;

    setList(
      list.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleToggleOnCourt = (teamNum, id) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;

    const targetPlayer = list.find((p) => p.id === id);
    if (!targetPlayer) return;

    const currentOnCourtCount = list.filter((p) => p.onCourt !== false).length;

    if (targetPlayer.onCourt === false && currentOnCourtCount >= 7) {
      addToast(`Exactly 7 players can be on court for ${currentTeam}`, 'warning');
      return;
    }

    setList(
      list.map((p) => (p.id === id ? { ...p, onCourt: !p.onCourt } : p))
    );
  };

  const handleSaveRoster = (e) => {
    e.preventDefault();

    if (!team1Name.trim() || !team2Name.trim()) {
      addToast('Please enter both Team 1 Name and Team 2 Name', 'error');
      return;
    }

    if (roster1.length < 7 || roster1.length > 12) {
      addToast(`Team 1 (${team1Name}) must have between 7 and 12 players`, 'error');
      return;
    }

    if (roster2.length < 7 || roster2.length > 12) {
      addToast(`Team 2 (${team2Name}) must have between 7 and 12 players`, 'error');
      return;
    }

    const onCourt1 = roster1.filter((p) => p.onCourt !== false).length;
    const onCourt2 = roster2.filter((p) => p.onCourt !== false).length;

    if (onCourt1 !== 7) {
      addToast(`Exactly 7 players must be selected for ${team1Name}'s Starting 7 (Currently: ${onCourt1})`, 'error');
      return;
    }

    if (onCourt2 !== 7) {
      addToast(`Exactly 7 players must be selected for ${team2Name}'s Starting 7 (Currently: ${onCourt2})`, 'error');
      return;
    }

    const playerStats1 = roster1.map((p, idx) => ({
      id: p.id || idx + 1,
      name: p.name.trim() || `Player ${idx + 1}`,
      jersey: p.jersey || `0${idx + 1}`,
      position: p.position || 'Raider',
      onCourt: p.onCourt !== false,
      raidPts: p.raidPts || 0,
      tacklePts: p.tacklePts || 0,
      bonusPts: p.bonusPts || 0,
      superRaid: p.superRaid || 0,
      superTackle: p.superTackle || 0,
      total: (p.raidPts || 0) + (p.tacklePts || 0) + (p.bonusPts || 0),
    }));

    const playerStats2 = roster2.map((p, idx) => ({
      id: p.id || idx + 1,
      name: p.name.trim() || `Player ${idx + 1}`,
      jersey: p.jersey || `0${idx + 1}`,
      position: p.position || 'Defender',
      onCourt: p.onCourt !== false,
      raidPts: p.raidPts || 0,
      tacklePts: p.tacklePts || 0,
      bonusPts: p.bonusPts || 0,
      superRaid: p.superRaid || 0,
      superTackle: p.superTackle || 0,
      total: (p.raidPts || 0) + (p.tacklePts || 0) + (p.bonusPts || 0),
    }));

    onRosterSaved({
      team1: team1Name.trim(),
      team2: team2Name.trim(),
      playerStats1,
      playerStats2,
      score1: 0,
      score2: 0,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
              PRE-GO-LIVE ROSTER CONFIGURATOR
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Kabaddi Squad Roster Setup & Starting 7
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize Team Names, player names & jersey numbers (7-12 per squad) and select the Starting 7 on court for {targetVenue}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveRoster} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TEAM 1 ROSTER PANEL */}
            <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-amber-500/20 pb-3 gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-mono font-bold text-amber-600 uppercase">Team 1 Name</span>
                  <input
                    type="text"
                    required
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="Team 1 Name (e.g. MPEC)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-500/30 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    Starting 7: {roster1.filter((p) => p.onCourt !== false).length}/7
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPlayer(1)}
                    className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {roster1.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition ${
                      player.onCourt !== false
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleOnCourt(1, player.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                        player.onCourt !== false
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      title={player.onCourt !== false ? 'On Court (Starting 7)' : 'Bench / Substitute'}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">{player.onCourt !== false ? 'COURT' : 'BENCH'}</span>
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        required
                        value={player.jersey}
                        onChange={(e) => handleUpdatePlayer(1, player.id, 'jersey', e.target.value)}
                        placeholder="#"
                        className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-center text-amber-600 dark:text-amber-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={player.name}
                        onChange={(e) => handleUpdatePlayer(1, player.id, 'name', e.target.value)}
                        placeholder={`Player Name`}
                        className="flex-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={player.position}
                        onChange={(e) => handleUpdatePlayer(1, player.id, 'position', e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Raider">Raider</option>
                        <option value="Defender">Defender</option>
                        <option value="All Rounder">All Rounder</option>
                      </select>

                      {roster1.length > 7 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(1, player.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TEAM 2 ROSTER PANEL */}
            <div className="space-y-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-blue-500/20 pb-3 gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Team 2 Name</span>
                  <input
                    type="text"
                    required
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    placeholder="Team 2 Name (e.g. MIPS)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-blue-500/30 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    Starting 7: {roster2.filter((p) => p.onCourt !== false).length}/7
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPlayer(2)}
                    className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {roster2.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition ${
                      player.onCourt !== false
                        ? 'bg-blue-500/10 border-blue-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleOnCourt(2, player.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                        player.onCourt !== false
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      title={player.onCourt !== false ? 'On Court (Starting 7)' : 'Bench / Substitute'}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">{player.onCourt !== false ? 'COURT' : 'BENCH'}</span>
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        required
                        value={player.jersey}
                        onChange={(e) => handleUpdatePlayer(2, player.id, 'jersey', e.target.value)}
                        placeholder="#"
                        className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-center text-blue-600 dark:text-blue-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={player.name}
                        onChange={(e) => handleUpdatePlayer(2, player.id, 'name', e.target.value)}
                        placeholder={`Player Name`}
                        className="flex-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={player.position}
                        onChange={(e) => handleUpdatePlayer(2, player.id, 'position', e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Raider">Raider</option>
                        <option value="Defender">Defender</option>
                        <option value="All Rounder">All Rounder</option>
                      </select>

                      {roster2.length > 7 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(2, player.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Team Names, Rosters & Start Live Match
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
