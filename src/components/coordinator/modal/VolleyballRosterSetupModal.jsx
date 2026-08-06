import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, UserCheck, Check } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const VolleyballRosterSetupModal = ({ match, targetVenue, onClose, onRosterSaved }) => {
  const { addToast } = useToast();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [team1Name, setTeam1Name] = useState(match?.team1 || 'Team A');
  const [team2Name, setTeam2Name] = useState(match?.team2 || 'Team B');

  // Default seed roster generator: 6 players on court, 4 players on bench (10 total)
  const defaultRosterForTeam = (teamName, prefix) => [
    { id: `${prefix}-1`, name: `${teamName} Player 1`, jersey: '1', onCourt: true, points: 0 },
    { id: `${prefix}-2`, name: `${teamName} Player 2`, jersey: '2', onCourt: true, points: 0 },
    { id: `${prefix}-3`, name: `${teamName} Player 3`, jersey: '3', onCourt: true, points: 0 },
    { id: `${prefix}-4`, name: `${teamName} Player 4`, jersey: '4', onCourt: true, points: 0 },
    { id: `${prefix}-5`, name: `${teamName} Player 5`, jersey: '5', onCourt: true, points: 0 },
    { id: `${prefix}-6`, name: `${teamName} Player 6`, jersey: '6', onCourt: true, points: 0 },
    { id: `${prefix}-7`, name: `${teamName} Sub 1`, jersey: '7', onCourt: false, points: 0 },
    { id: `${prefix}-8`, name: `${teamName} Sub 2`, jersey: '8', onCourt: false, points: 0 },
    { id: `${prefix}-9`, name: `${teamName} Sub 3`, jersey: '9', onCourt: false, points: 0 },
    { id: `${prefix}-10`, name: `${teamName} Sub 4`, jersey: '10', onCourt: false, points: 0 },
  ];

  const [roster1, setRoster1] = useState(
    match?.roster1 && match.roster1.length >= 6 ? match.roster1 : defaultRosterForTeam(team1Name, 'T1')
  );
  const [roster2, setRoster2] = useState(
    match?.roster2 && match.roster2.length >= 6 ? match.roster2 : defaultRosterForTeam(team2Name, 'T2')
  );

  const handleAddPlayer = (teamNum) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;
    const prefix = teamNum === 1 ? 'T1' : 'T2';

    if (list.length >= 10) {
      addToast(`Maximum 10 players allowed for ${currentTeam}`, 'error');
      return;
    }

    const nextJersey = String(list.length + 1);
    const newPlayer = {
      id: `${prefix}-${Date.now()}`,
      name: `${currentTeam} Player ${list.length + 1}`,
      jersey: nextJersey,
      onCourt: list.filter((p) => p.onCourt).length < 6,
      points: 0,
    };

    setList([...list, newPlayer]);
  };

  const handleRemovePlayer = (teamNum, id) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;

    if (list.length <= 6) {
      addToast(`Minimum 6 players required for ${currentTeam}`, 'error');
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

    const currentOnCourtCount = list.filter((p) => p.onCourt).length;

    if (!targetPlayer.onCourt && currentOnCourtCount >= 6) {
      addToast(`Exactly 6 players can be on court for ${currentTeam}`, 'warning');
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

    if (roster1.length < 6 || roster1.length > 10) {
      addToast(`Team 1 (${team1Name}) must have between 6 and 10 players`, 'error');
      return;
    }

    if (roster2.length < 6 || roster2.length > 10) {
      addToast(`Team 2 (${team2Name}) must have between 6 and 10 players`, 'error');
      return;
    }

    const onCourt1 = roster1.filter((p) => p.onCourt).length;
    const onCourt2 = roster2.filter((p) => p.onCourt).length;

    if (onCourt1 !== 6) {
      addToast(`Exactly 6 players must be selected for ${team1Name}'s Starting 6 (Currently selected: ${onCourt1})`, 'error');
      return;
    }

    if (onCourt2 !== 6) {
      addToast(`Exactly 6 players must be selected for ${team2Name}'s Starting 6 (Currently selected: ${onCourt2})`, 'error');
      return;
    }

    onRosterSaved({
      team1: team1Name.trim(),
      team2: team2Name.trim(),
      roster1,
      roster2,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400">
              PRE-GO-LIVE ROSTER CONFIGURATOR
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Volleyball Squad Roster Setup & Starting 6
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize Team Names, player names & jersey numbers (6–10 per squad) and select the Starting 6 on court for the selected Volleyball Court.
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
            <div className="space-y-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center justify-between border-b border-orange-500/20 pb-2 gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-mono font-bold text-orange-600 uppercase">Team 1 Name</span>
                  <input
                    type="text"
                    required
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="Team 1 Name"
                    className="w-full px-3 py-1 rounded-xl bg-white dark:bg-slate-950 border border-orange-500/30 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-sans"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-mono">
                    Starting 6: {roster1.filter((p) => p.onCourt).length}/6
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPlayer(1)}
                    className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {roster1.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                      player.onCourt
                        ? 'bg-orange-500/10 border-orange-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleOnCourt(1, player.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        player.onCourt
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      title={player.onCourt ? 'On Court (Starting 6)' : 'Bench / Substitute'}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">{player.onCourt ? 'COURT' : 'BENCH'}</span>
                    </button>

                    <div className="w-16">
                      <input
                        type="text"
                        required
                        value={player.jersey}
                        onChange={(e) => handleUpdatePlayer(1, player.id, 'jersey', e.target.value)}
                        placeholder="#"
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-center text-orange-600 dark:text-orange-400 focus:outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      required
                      value={player.name}
                      onChange={(e) => handleUpdatePlayer(1, player.id, 'name', e.target.value)}
                      placeholder={`Player Name`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />

                    {roster1.length > 6 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(1, player.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TEAM 2 ROSTER PANEL */}
            <div className="space-y-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2 gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Team 2 Name</span>
                  <input
                    type="text"
                    required
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    placeholder="Team 2 Name"
                    className="w-full px-3 py-1 rounded-xl bg-white dark:bg-slate-950 border border-blue-500/30 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono">
                    Starting 6: {roster2.filter((p) => p.onCourt).length}/6
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

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {roster2.map((player) => (
                  <div
                    key={player.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                      player.onCourt
                        ? 'bg-blue-500/10 border-blue-500/40 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleOnCourt(2, player.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        player.onCourt
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      title={player.onCourt ? 'On Court (Starting 6)' : 'Bench / Substitute'}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase">{player.onCourt ? 'COURT' : 'BENCH'}</span>
                    </button>

                    <div className="w-16">
                      <input
                        type="text"
                        required
                        value={player.jersey}
                        onChange={(e) => handleUpdatePlayer(2, player.id, 'jersey', e.target.value)}
                        placeholder="#"
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-center text-blue-600 dark:text-blue-400 focus:outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      required
                      value={player.name}
                      onChange={(e) => handleUpdatePlayer(2, player.id, 'name', e.target.value)}
                      placeholder={`Player Name`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />

                    {roster2.length > 6 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(2, player.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Buttons */}
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
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
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
