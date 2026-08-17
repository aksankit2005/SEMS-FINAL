import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ChevronRight, ChevronLeft, Shield, Users, Calendar, Award, UserCheck, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const CricketGoLiveSetupModal = ({ match, targetVenue, onClose, onStartMatch }) => {
  const { addToast } = useToast();

  // Lock background scroll to hide navbar/sidebar when Go Live setup is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const isGully = Boolean(
    (match?.sportId || '').includes('gully') ||
    (match?.sport || '').includes('gully') ||
    (match?.sportName || '').includes('Gully') ||
    (match?.eventTitle || '').includes('Gully')
  );

  const defaultTeam1 = match?.team1 || (isGully ? 'MPEC Gully Strikers' : 'MPEC XI');
  const defaultTeam2 = match?.team2 || (isGully ? 'MIPS Box Kings' : 'PSIT Super Kings');

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Match Details
  const [matchDetails, setMatchDetails] = useState({
    tournamentName: match?.eventTitle || (isGully ? 'Official Gully & Box Cricket Championship 2026' : 'Inter-College T20 Cricket Championship 2026'),
    matchTitle: `${defaultTeam1} vs ${defaultTeam2}`,
    format: isGully ? '6-Overs Fast Box' : 'T20', // T10, T20, ODI, 6-Overs Fast Box, etc.
    totalOvers: isGully ? 6 : 20,
    venue: targetVenue || match?.tableNumber || (isGully ? 'Street Pitch Ground 1' : 'Cricket Ground 1'),
    date: match?.date || new Date().toISOString().split('T')[0],
    time: match?.time || '10:00 AM',
    tossWinner: defaultTeam1,
    tossDecision: 'Bat',
  });

  // Step 2: Team Details
  const [teamA, setTeamA] = useState({
    name: defaultTeam1,
    logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
    captain: `${defaultTeam1} Captain`,
  });

  const [teamB, setTeamB] = useState({
    name: defaultTeam2,
    logo: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=300&q=80',
    captain: `${defaultTeam2} Captain`,
  });

  // Step 3: Playing XI / Playing 6
  const squadSize = isGully ? 6 : 11;
  const subsSize = isGully ? 2 : 2;

  const [teamAPlayers, setTeamAPlayers] = useState(() => {
    return Array.from({ length: squadSize }, (_, i) => ({
      id: `TA-${i + 1}`,
      name: `${defaultTeam1} Player ${i + 1}`,
      isCaptain: i === 0,
      isKeeper: i === 1,
    }));
  });
  const [teamASubs, setTeamASubs] = useState(() => {
    return Array.from({ length: subsSize }, (_, i) => ({
      id: `TA-SUB${i + 1}`,
      name: `${defaultTeam1} Sub ${i + 1}`,
    }));
  });

  const [teamBPlayers, setTeamBPlayers] = useState(() => {
    return Array.from({ length: squadSize }, (_, i) => ({
      id: `TB-${i + 1}`,
      name: `${defaultTeam2} Player ${i + 1}`,
      isCaptain: i === 0,
      isKeeper: i === 1,
    }));
  });
  const [teamBSubs, setTeamBSubs] = useState(() => {
    return Array.from({ length: subsSize }, (_, i) => ({
      id: `TB-SUB${i + 1}`,
      name: `${defaultTeam2} Sub ${i + 1}`,
    }));
  });

  // Determine Batting Team & Bowling Team based on Toss
  const isTeamABattingFirst =
    (matchDetails.tossWinner === teamA.name && matchDetails.tossDecision === 'Bat') ||
    (matchDetails.tossWinner === teamB.name && matchDetails.tossDecision === 'Bowl');

  const battingTeamPlayers = isTeamABattingFirst ? teamAPlayers : teamBPlayers;
  const bowlingTeamPlayers = isTeamABattingFirst ? teamBPlayers : teamAPlayers;

  // Step 4: Opening Players
  const [openingStriker, setOpeningStriker] = useState('');
  const [openingNonStriker, setOpeningNonStriker] = useState('');
  const [openingBowler, setOpeningBowler] = useState('');

  // Auto-set defaults when entering step 4
  const prepareStep4Defaults = () => {
    if (!openingStriker && battingTeamPlayers.length > 0) {
      setOpeningStriker(battingTeamPlayers[0].name);
    }
    if (!openingNonStriker && battingTeamPlayers.length > 1) {
      setOpeningNonStriker(battingTeamPlayers[1].name);
    }
    if (!openingBowler && bowlingTeamPlayers.length > 0) {
      setOpeningBowler(bowlingTeamPlayers[bowlingTeamPlayers.length - 1].name);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!matchDetails.matchTitle.trim()) {
        addToast('Please enter match title', 'error');
        return;
      }
    }
    if (currentStep === 2) {
      if (!teamA.name.trim() || !teamB.name.trim()) {
        addToast('Please enter both Team A and Team B names', 'error');
        return;
      }
    }
    if (currentStep === 3) {
      const hasEmptyA = teamAPlayers.some((p) => !p.name.trim());
      const hasEmptyB = teamBPlayers.some((p) => !p.name.trim());
      if (hasEmptyA || hasEmptyB) {
        addToast(`Please fill all ${squadSize} player names for both teams`, 'error');
        return;
      }
      prepareStep4Defaults();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const isStep4Valid = Boolean(
    openingStriker &&
    openingNonStriker &&
    openingBowler &&
    openingStriker !== openingNonStriker
  );

  const handleFinalStartMatch = () => {
    if (!isStep4Valid) {
      addToast('Please select Striker, Non-Striker, and Opening Bowler', 'error');
      return;
    }

    const battingTeamName = isTeamABattingFirst ? teamA.name : teamB.name;
    const bowlingTeamName = isTeamABattingFirst ? teamB.name : teamA.name;

    const setupPayload = {
      matchDetails: {
        ...matchDetails,
        totalOvers: Number(matchDetails.totalOvers) || (isGully ? 6 : 20),
      },
      teamA,
      teamB,
      teamAPlayers,
      teamASubs,
      teamBPlayers,
      teamBSubs,
      battingTeamName,
      bowlingTeamName,
      openingStriker,
      openingNonStriker,
      openingBowler,
    };

    onStartMatch(setupPayload);
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden font-sans">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] p-5 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl">
              🏏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                  {isGully ? 'GULLY CRICKET GO-LIVE WIZARD' : 'T20 CRICKET GO-LIVE WIZARD'}
                </span>
                <span className="text-xs font-mono text-slate-400">Step {currentStep} of 4</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Live Match Pre-Game Configuration
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Tracker */}
        <div className="grid grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl shrink-0">
          {[
            { num: 1, title: '1. Match Details' },
            { num: 2, title: '2. Team Details' },
            { num: 3, title: isGully ? '3. Playing Squad' : '3. Playing XI' },
            { num: 4, title: '4. Opening Players' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num < currentStep) setCurrentStep(s.num);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition ${
                currentStep === s.num
                  ? 'bg-emerald-600 text-white shadow-md'
                  : currentStep > s.num
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Step Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
          
          {/* STEP 1: MATCH DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Step 1: Match & Tournament Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Tournament Name</label>
                  <input
                    type="text"
                    value={matchDetails.tournamentName}
                    onChange={(e) => setMatchDetails({ ...matchDetails, tournamentName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Match Title / Stage</label>
                  <input
                    type="text"
                    value={matchDetails.matchTitle}
                    onChange={(e) => setMatchDetails({ ...matchDetails, matchTitle: e.target.value })}
                    placeholder="e.g. MPEC XI vs PSIT Super Kings (Quarter-Final)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Total Overs Per Innings</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={matchDetails.totalOvers}
                    onChange={(e) => setMatchDetails({ ...matchDetails, totalOvers: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Venue / Ground</label>
                  <input
                    type="text"
                    readOnly
                    value={matchDetails.venue || (isGully ? 'Street Pitch Ground 1' : 'Cricket Ground 1')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={matchDetails.date}
                      onChange={(e) => setMatchDetails({ ...matchDetails, date: e.target.value })}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                    <input
                      type="text"
                      value={matchDetails.time}
                      onChange={(e) => setMatchDetails({ ...matchDetails, time: e.target.value })}
                      placeholder="09:00 AM"
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Toss Winner</label>
                  <select
                    value={matchDetails.tossWinner}
                    onChange={(e) => setMatchDetails({ ...matchDetails, tossWinner: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value={teamA.name}>{teamA.name}</option>
                    <option value={teamB.name}>{teamB.name}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Toss Decision</label>
                  <select
                    value={matchDetails.tossDecision}
                    onChange={(e) => setMatchDetails({ ...matchDetails, tossDecision: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="Bat">Elects to Bat First</option>
                    <option value="Bowl">Elects to Bowl First</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TEAM DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Step 2: Team Profiles & Captains
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Team A Box */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    TEAM A CONFIGURATION
                  </span>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Team Name</label>
                    <input
                      type="text"
                      value={teamA.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamA({ ...teamA, name: val });
                        if (matchDetails.tossWinner === teamA.name) {
                          setMatchDetails((prev) => ({ ...prev, tossWinner: val }));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Captain Name</label>
                    <input
                      type="text"
                      value={teamA.captain}
                      onChange={(e) => setTeamA({ ...teamA, captain: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Team B Box */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase text-green-600 dark:text-green-400">
                    TEAM B CONFIGURATION
                  </span>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Team Name</label>
                    <input
                      type="text"
                      value={teamB.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamB({ ...teamB, name: val });
                        if (matchDetails.tossWinner === teamB.name) {
                          setMatchDetails((prev) => ({ ...prev, tossWinner: val }));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-green-600 dark:text-green-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Captain Name</label>
                    <input
                      type="text"
                      value={teamB.captain}
                      onChange={(e) => setTeamB({ ...teamB, captain: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: PLAYING XI */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Step 3: Playing XI & Substitute Roster
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Team A Roster */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">{teamA.name} Playing 11</span>
                    <span className="text-[10px] font-mono text-slate-400">11 Players</span>
                  </div>

                  <div className="space-y-2">
                    {teamAPlayers.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...teamAPlayers];
                            updated[idx].name = e.target.value;
                            setTeamAPlayers(updated);
                          }}
                          placeholder={`Player ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Team A Substitutes */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Substitutes</span>
                    {teamASubs.map((sub, idx) => (
                      <input
                        key={sub.id}
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...teamASubs];
                          updated[idx].name = e.target.value;
                          setTeamASubs(updated);
                        }}
                        placeholder={`Sub ${idx + 1}`}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      />
                    ))}
                  </div>
                </div>

                {/* Team B Roster */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase">{teamB.name} Playing 11</span>
                    <span className="text-[10px] font-mono text-slate-400">11 Players</span>
                  </div>

                  <div className="space-y-2">
                    {teamBPlayers.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...teamBPlayers];
                            updated[idx].name = e.target.value;
                            setTeamBPlayers(updated);
                          }}
                          placeholder={`Player ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Team B Substitutes */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Substitutes</span>
                    {teamBSubs.map((sub, idx) => (
                      <input
                        key={sub.id}
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...teamBSubs];
                          updated[idx].name = e.target.value;
                          setTeamBSubs(updated);
                        }}
                        placeholder={`Sub ${idx + 1}`}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 4: OPENING PLAYERS */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Step 4: Select Opening Batsmen & Bowler
              </h3>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Toss Result: <span className="font-black">{matchDetails.tossWinner}</span> won toss & elected to <span className="font-black">{matchDetails.tossDecision}</span> first.
                Batting First: <span className="font-black">{isTeamABattingFirst ? teamA.name : teamB.name}</span> | Bowling First: <span className="font-black">{isTeamABattingFirst ? teamB.name : teamA.name}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Striker */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Opening Striker ⭐
                  </label>
                  <select
                    value={openingStriker}
                    onChange={(e) => setOpeningStriker(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="">Select Striker...</option>
                    {battingTeamPlayers.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Non-Striker */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Opening Non-Striker
                  </label>
                  <select
                    value={openingNonStriker}
                    onChange={(e) => setOpeningNonStriker(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">Select Non-Striker...</option>
                    {battingTeamPlayers
                      .filter((p) => p.name !== openingStriker)
                      .map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                  </select>
                </div>

                {/* Opening Bowler */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Opening Bowler
                  </label>
                  <select
                    value={openingBowler}
                    onChange={(e) => setOpeningBowler(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-amber-600 dark:text-amber-400"
                  >
                    <option value="">Select Bowler...</option>
                    {bowlingTeamPlayers.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 shrink-0">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalStartMatch}
              disabled={!isStep4Valid}
              className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 ${
                isStep4Valid
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30 cursor-pointer'
                  : 'bg-slate-400 dark:bg-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> Start Live Match
            </button>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};
