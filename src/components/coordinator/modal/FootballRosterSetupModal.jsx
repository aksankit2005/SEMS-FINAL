import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, UserCheck, Check, Edit2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const FootballRosterSetupModal = ({ match, targetVenue, onClose, onRosterSaved }) => {
  const { addToast } = useToast();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [team1Name, setTeam1Name] = useState(match?.team1 || 'Team 1');
  const [team2Name, setTeam2Name] = useState(match?.team2 || 'Team 2');

  // Default initial roster for Football (5 starters on pitch, 3 bench subs)
  const defaultRosterForTeam = (teamName, prefix) => [
    { id: `${prefix}-1`, name: `${teamName} Player 1`, jersey: '1', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-2`, name: `${teamName} Player 2`, jersey: '4', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-3`, name: `${teamName} Player 3`, jersey: '7', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-4`, name: `${teamName} Player 4`, jersey: '9', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-5`, name: `${teamName} Player 5`, jersey: '10', onCourt: true, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-6`, name: `${teamName} Sub 1`, jersey: '12', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-7`, name: `${teamName} Sub 2`, jersey: '14', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
    { id: `${prefix}-8`, name: `${teamName} Sub 3`, jersey: '17', onCourt: false, goals: 0, yellowCards: 0, redCard: false },
  ];

  const [roster1, setRoster1] = useState(
    match?.roster1 && match.roster1.length >= 5 ? match.roster1 : defaultRosterForTeam(team1Name, 'T1')
  );
  const [roster2, setRoster2] = useState(
    match?.roster2 && match.roster2.length >= 5 ? match.roster2 : defaultRosterForTeam(team2Name, 'T2')
  );

  const handleAddPlayer = (teamNum) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;
    const prefix = teamNum === 1 ? 'T1' : 'T2';

    if (list.length >= 8) {
      addToast(`Maximum 8 players allowed for ${currentTeam}`, 'error');
      return;
    }

    const nextJersey = String(Math.floor(Math.random() * 90) + 1);
    const newPlayer = {
      id: `${prefix}-${Date.now()}`,
      name: `${currentTeam} Player ${list.length + 1}`,
      jersey: nextJersey,
      onCourt: list.filter((p) => p.onCourt).length < 5,
      goals: 0,
      yellowCards: 0,
      redCard: false,
    };

    setList([...list, newPlayer]);
  };

  const handleRemovePlayer = (teamNum, id) => {
    const list = teamNum === 1 ? roster1 : roster2;
    const setList = teamNum === 1 ? setRoster1 : setRoster2;
    const currentTeam = teamNum === 1 ? team1Name : team2Name;

    if (list.length <= 5) {
      addToast(`Minimum 5 players required for ${currentTeam}`, 'error');
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

    if (!targetPlayer.onCourt && currentOnCourtCount >= 5) {
      addToast(`Exactly 5 players start on pitch for ${currentTeam}`, 'warning');
      return;
    }

    setList(
      list.map((p) => (p.id === id ? { ...p, onCourt: !p.onCourt } : p))
    );
  };

  const handleSaveAndGoLive = () => {
    const active1 = roster1.filter((p) => p.onCourt).length;
    const active2 = roster2.filter((p) => p.onCourt).length;

    if (active1 < 5) {
      addToast(`Please select 5 starting players for ${team1Name} (Currently ${active1})`, 'error');
      return;
    }
    if (active2 < 5) {
      addToast(`Please select 5 starting players for ${team2Name} (Currently ${active2})`, 'error');
      return;
    }

    onRosterSaved({
      team1Name,
      team2Name,
      roster1,
      roster2,
    });
    addToast('Football player rosters saved successfully! Match is going live...', 'success');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans text-slate-900 dark:text-slate-100">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>⚽ Setup Football Player Names & Roster</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Venue: <b className="text-emerald-500">{targetVenue}</b> &bull; Enter player names (5 Starting on pitch, bench subs).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Team 1 Section */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="text-sm font-black bg-transparent border-b border-dashed border-emerald-500 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Team 1 Name"
                />
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {roster1.filter((p) => p.onCourt).length} / 5 Starting
                </span>
              </div>

              <div className="space-y-2">
                {roster1.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      p.onCourt
                        ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/10'
                        : 'bg-white dark:bg-[#070B14] border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={p.jersey}
                        onChange={(e) => handleUpdatePlayer(1, p.id, 'jersey', e.target.value)}
                        placeholder="#"
                        className="w-10 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-center border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdatePlayer(1, p.id, 'name', e.target.value)}
                        placeholder="Player Name"
                        className="flex-1 px-3 py-1 rounded bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleOnCourt(1, p.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition ${
                          p.onCourt
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {p.onCourt ? 'Starting' : 'Bench'}
                      </button>
                      <button
                        onClick={() => handleRemovePlayer(1, p.id)}
                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {roster1.length < 8 && (
                <button
                  onClick={() => handleAddPlayer(1)}
                  className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Team 1 Player ({roster1.length}/8)</span>
                </button>
              )}
            </div>

            {/* Team 2 Section */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="text-sm font-black bg-transparent border-b border-dashed border-teal-500 text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Team 2 Name"
                />
                <span className="text-xs font-mono font-bold text-teal-500">
                  {roster2.filter((p) => p.onCourt).length} / 5 Starting
                </span>
              </div>

              <div className="space-y-2">
                {roster2.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      p.onCourt
                        ? 'bg-teal-500/10 border-teal-500/30 dark:bg-teal-500/10'
                        : 'bg-white dark:bg-[#070B14] border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={p.jersey}
                        onChange={(e) => handleUpdatePlayer(2, p.id, 'jersey', e.target.value)}
                        placeholder="#"
                        className="w-10 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-center border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdatePlayer(2, p.id, 'name', e.target.value)}
                        placeholder="Player Name"
                        className="flex-1 px-3 py-1 rounded bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleOnCourt(2, p.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition ${
                          p.onCourt
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {p.onCourt ? 'Starting' : 'Bench'}
                      </button>
                      <button
                        onClick={() => handleRemovePlayer(2, p.id)}
                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {roster2.length < 8 && (
                <button
                  onClick={() => handleAddPlayer(2)}
                  className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Team 2 Player ({roster2.length}/8)</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndGoLive}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>SAVE ROSTER & GO LIVE ON {targetVenue.toUpperCase()}</span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
