import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCcw, Trophy, AlertCircle, RefreshCw, UserCheck, Activity, 
  Maximize2, Minimize2, Play, Pause, ChevronRight, FileText, CheckCircle2, 
  Award, Shield, HelpCircle, Edit3, ArrowLeftRight
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { CricketScorecardModal } from './CricketScorecardModal';

export const CricketLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  // Fullscreen toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Lock background scroll on mount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Setup initial setup data or defaults
  const setupData = match?.setupData || {};
  const teamA = setupData.teamA?.name || match?.team1 || 'Team A';
  const teamB = setupData.teamB?.name || match?.team2 || 'Team B';

  const battingTeamNameInitial = setupData.battingTeamName || teamA;
  const bowlingTeamNameInitial = setupData.bowlingTeamName || teamB;

  // Innings state: 1 or 2
  const [currentInnings, setCurrentInnings] = useState(match?.currentInnings || 1);
  const [battingTeam, setBattingTeam] = useState(battingTeamNameInitial);
  const [bowlingTeam, setBowlingTeam] = useState(bowlingTeamNameInitial);

  const isGully = Boolean(
    (match?.sportId || '').includes('gully') ||
    (match?.sport || '').includes('gully') ||
    (match?.sportName || '').includes('Gully') ||
    (match?.eventTitle || '').includes('Gully')
  );

  const totalOversMax = setupData.matchDetails?.totalOvers || (isGully ? 6 : 20);

  // Score states
  const [runs, setRuns] = useState(match?.score1 || 0);
  const [wickets, setWickets] = useState(match?.wickets1 || 0);
  const [legalBalls, setLegalBalls] = useState(match?.legalBalls || 0); // Total legal balls bowled
  const [oversFormatted, setOversFormatted] = useState(match?.overs1 || '0.0');

  // Target for 2nd innings
  const [targetRuns, setTargetRuns] = useState(match?.targetRuns || null);
  const [firstInningsScore, setFirstInningsScore] = useState(match?.firstInningsScore || null);

  // Extras counter
  const [extras, setExtras] = useState(match?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });

  // Helper for case-insensitive team matching
  const norm = (str) => String(str || '').trim().toLowerCase();

  // Squads and Substitute Lists State
  const defaultSquadLength = isGully ? 6 : 11;
  const defaultSubsLength = isGully ? 2 : 4;
  const [teamAPlayerList, setTeamAPlayerList] = useState(
    setupData.teamAPlayers || Array.from({ length: defaultSquadLength }, (_, i) => ({ name: `${teamA} Player ${i + 1}` }))
  );
  const [teamBPlayerList, setTeamBPlayerList] = useState(
    setupData.teamBPlayers || Array.from({ length: defaultSquadLength }, (_, i) => ({ name: `${teamB} Player ${i + 1}` }))
  );

  const [teamASubsList, setTeamASubsList] = useState(
    setupData.teamASubs || Array.from({ length: defaultSubsLength }, (_, i) => ({ name: `${teamA} Sub ${i + 1}` }))
  );
  const [teamBSubsList, setTeamBSubsList] = useState(
    setupData.teamBSubs || Array.from({ length: defaultSubsLength }, (_, i) => ({ name: `${teamB} Sub ${i + 1}` }))
  );

  const currentBattingSquad = norm(battingTeam) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
  const currentBowlingSquad = norm(bowlingTeam) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

  const currentBattingSubs = norm(battingTeam) === norm(teamA) ? teamASubsList : teamBSubsList;
  const currentBowlingSubs = norm(bowlingTeam) === norm(teamA) ? teamASubsList : teamBSubsList;

  // Tactical Substitute Modal State
  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [substituteDetails, setSubstituteDetails] = useState({
    team: 'batting',
    outgoingPlayer: '',
    incomingPlayer: '',
    customSubName: '',
  });

  // Striker & Non-Striker stats
  const [striker, setStriker] = useState(match?.striker || { name: setupData.openingStriker || currentBattingSquad[0]?.name || 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
  const [nonStriker, setNonStriker] = useState(match?.nonStriker || { name: setupData.openingNonStriker || currentBattingSquad[1]?.name || 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });

  // Bowler stats
  const [bowler, setBowler] = useState(match?.bowler || { name: setupData.openingBowler || currentBowlingSquad[currentBowlingSquad.length - 1]?.name || 'Bowler', overs: '0.0', maidens: 0, runs: 0, wickets: 0, legalBalls: 0 });

  // Recent 6 balls history ticker
  const [recentBalls, setRecentBalls] = useState(match?.recentBalls || []);
  const [commentaryLog, setCommentaryLog] = useState(match?.commentaryLog || []);

  // Free hit state
  const [isFreeHit, setIsFreeHit] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Scorecards storage for innings 1 & 2
  const [battingCard1, setBattingCard1] = useState(match?.battingCard1 || []);
  const [bowlingCard1, setBowlingCard1] = useState(match?.bowlingCard1 || []);
  const [battingCard2, setBattingCard2] = useState(match?.battingCard2 || []);
  const [bowlingCard2, setBowlingCard2] = useState(match?.bowlingCard2 || []);

  // Wicket & Bowler Selection Modals
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketDetails, setWicketDetails] = useState({ whoOut: 'striker', dismissal: 'Bowled', fielder: '', newBatsman: '' });

  const [nextBowlerModalOpen, setNextBowlerModalOpen] = useState(false);
  const [newBowlerName, setNewBowlerName] = useState('');
  const [lastOverBowlerName, setLastOverBowlerName] = useState('');

  const [inningsBreakModalOpen, setInningsBreakModalOpen] = useState(false);
  const [showFullScorecard, setShowFullScorecard] = useState(false);
  const [matchEndedModal, setMatchEndedModal] = useState(false);
  const [matchWinnerResult, setMatchWinnerResult] = useState('');

  // Undo Stack History
  const [historyStack, setHistoryStack] = useState([]);

  const parseOversToBalls = (oversStr, defaultLegalBalls = 0) => {
    if (typeof defaultLegalBalls === 'number' && defaultLegalBalls > 0) return defaultLegalBalls;
    if (!oversStr || typeof oversStr !== 'string') return 0;
    const parts = oversStr.split('.');
    const o = parseInt(parts[0], 10) || 0;
    const b = parseInt(parts[1], 10) || 0;
    return o * 6 + b;
  };

  // Calculate Overs formatted from total legal balls
  const formatOvers = (balls) => {
    const num = Number(balls);
    if (isNaN(num) || num <= 0) return '0.0';
    const o = Math.floor(num / 6);
    const b = num % 6;
    return `${o}.${b}`;
  };

  // Calculate CRR
  const currentRunRate = legalBalls > 0 ? ((runs / (legalBalls / 6))).toFixed(2) : '0.00';

  // Calculate RRR (2nd Innings)
  const remainingRuns = targetRuns ? Math.max(0, targetRuns - runs) : 0;
  const remainingBalls = Math.max(0, (totalOversMax * 6) - legalBalls);
  const requiredRunRate = remainingBalls > 0 && targetRuns ? ((remainingRuns / (remainingBalls / 6))).toFixed(2) : '0.00';

  // Current Partnership
  const partnershipRuns = (striker?.runs || 0) + (nonStriker?.runs || 0);
  const partnershipBalls = (striker?.balls || 0) + (nonStriker?.balls || 0);

  // Push State to History Stack for Undo
  const pushStateToUndo = () => {
    setHistoryStack((prev) => [
      ...prev,
      {
        runs,
        wickets,
        legalBalls,
        oversFormatted,
        extras: { ...extras },
        striker: { ...striker },
        nonStriker: { ...nonStriker },
        bowler: { ...bowler },
        recentBalls: [...recentBalls],
        commentaryLog: [...commentaryLog],
        isFreeHit,
        battingCard1: [...battingCard1],
        bowlingCard1: [...bowlingCard1],
        battingCard2: [...battingCard2],
        bowlingCard2: [...bowlingCard2],
      },
    ]);
  };

  // Sync current live score to backend server and local storage
  const syncLiveState = async (
    r = runs, w = wickets, lb = legalBalls, ov = oversFormatted,
    st = striker, nst = nonStriker, bw = bowler, rb = recentBalls,
    comm = commentaryLog, ex = extras, inn = currentInnings
  ) => {
    const payload = {
      score1: inn === 1 ? r : (firstInningsScore || 0),
      wickets1: inn === 1 ? w : (match?.wickets1 || 0),
      overs1: inn === 1 ? ov : (match?.overs1 || '0.0'),

      score2: inn === 2 ? r : 0,
      wickets2: inn === 2 ? w : 0,
      overs2: inn === 2 ? ov : '0.0',

      currentInnings: inn,
      battingTeam,
      bowlingTeam,
      legalBalls: lb,
      targetRuns,
      firstInningsScore,
      extras: ex,
      striker: st,
      nonStriker: nst,
      bowler: bw,
      recentBalls: rb,
      commentaryLog: comm,
      battingCard1,
      bowlingCard1,
      battingCard2,
      bowlingCard2,
      status: 'running',
    };

    try {
      await coordinatorApi.updateMatchScoring(match.id, payload);
      if (onMatchUpdated) onMatchUpdated(match.id, payload);
    } catch (err) {
      console.warn('Sync live score error', err);
    }
  };

  // Auto-generate Commentary Line
  const generateCommentary = (type, val, extraType = '') => {
    const bName = bowler.name;
    const sName = striker.name;

    if (type === 'RUN') {
      if (val === 0) return `${bName} to ${sName}, no run. Good length delivery, defended cleanly.`;
      if (val === 1) return `${bName} to ${sName}, 1 run. Tipped into the gap for a quick single.`;
      if (val === 2) return `${bName} to ${sName}, 2 runs. Driven down to deep cover, excellent running!`;
      if (val === 3) return `${bName} to ${sName}, 3 runs. Worked off the pads past mid-wicket!`;
      if (val === 4) return `FOUR! ${bName} to ${sName}, boundary! Swept away past fine leg with supreme timing!`;
      if (val === 6) return `SIX! ${bName} to ${sName}, HUGE SIX! High and handsome over long-on!`;
    }
    if (type === 'EXTRA') {
      if (extraType === 'WIDE') return `WIDE! ${bName} strays down the leg side. Extra run added.`;
      if (extraType === 'NO_BALL') return `NO BALL! ${bName} oversteps the crease! Free Hit awarded next ball!`;
      if (extraType === 'BYE') return `BYE! ${bName} to ${sName}, ball beats everyone and batsmen take a run.`;
      if (extraType === 'LEG_BYE') return `LEG BYE! Off the pad into the off side for a single.`;
    }
    if (type === 'WICKET') {
      return `WICKET! ${bName} gets ${sName}! Out (${val}). Massive breakthrough for ${bowlingTeam}!`;
    }
    return `${bName} to ${sName}. Ball completed.`;
  };

  // Record a Delivery (Normal runs 0, 1, 2, 3, 4, 6)
  const handleScoreRun = (runVal) => {
    if (isPaused) {
      addToast('Match is currently PAUSED. Click Resume to score', 'warning');
      return;
    }

    pushStateToUndo();

    const newRuns = runs + runVal;
    const newLegalBalls = legalBalls + 1;
    const newOvers = formatOvers(newLegalBalls);

    // Update Striker
    const updatedStriker = {
      ...striker,
      runs: striker.runs + runVal,
      balls: striker.balls + 1,
      fours: runVal === 4 ? striker.fours + 1 : striker.fours,
      sixes: runVal === 6 ? striker.sixes + 1 : striker.sixes,
    };

    // Update Bowler
    const newBowlerBalls = bowler.legalBalls + 1;
    const updatedBowler = {
      ...bowler,
      legalBalls: newBowlerBalls,
      overs: formatOvers(newBowlerBalls),
      runs: bowler.runs + runVal,
    };

    // Update recent balls ticker
    const ballTag = runVal === 0 ? '●' : `${runVal}`;
    const updatedRecent = [...recentBalls, ballTag].slice(-6);

    // Commentary
    const commText = generateCommentary('RUN', runVal);
    const updatedComm = [{ id: Date.now(), over: newOvers, text: commText, runs: runVal }, ...commentaryLog];

    // Reset Free Hit if active
    if (isFreeHit) setIsFreeHit(false);

    setRuns(newRuns);
    setLegalBalls(newLegalBalls);
    setOversFormatted(newOvers);
    setStriker(updatedStriker);
    setBowler(updatedBowler);
    setRecentBalls(updatedRecent);
    setCommentaryLog(updatedComm);

    // Sync active bowler into bowling card
    if (currentInnings === 1) {
      setBowlingCard1((prev) => [...prev.filter((b) => b.name !== updatedBowler.name), updatedBowler]);
    } else {
      setBowlingCard2((prev) => [...prev.filter((b) => b.name !== updatedBowler.name), updatedBowler]);
    }

    // Check Odd runs -> Swap Striker & Non-Striker
    let finalStriker = updatedStriker;
    let finalNonStriker = nonStriker;

    if (runVal % 2 !== 0) {
      finalStriker = nonStriker;
      finalNonStriker = updatedStriker;
      setStriker(finalStriker);
      setNonStriker(finalNonStriker);
    }

    // Check End of 2nd Innings Target
    if (currentInnings === 2 && targetRuns && newRuns >= targetRuns) {
      const winner = `${battingTeam} won by ${10 - wickets} wickets!`;
      setMatchWinnerResult(winner);
      setMatchEndedModal(true);
      syncLiveState(newRuns, wickets, newLegalBalls, newOvers, finalStriker, finalNonStriker, updatedBowler, updatedRecent, updatedComm);
      return;
    }

    // Check End of Over (6 legal balls)
    if (newLegalBalls % 6 === 0) {
      // Over completed -> Swap Strike for new over
      setStriker(finalNonStriker);
      setNonStriker(finalStriker);
      setNextBowlerModalOpen(true);
    }

    // Check End of Innings Overs limit
    if (newLegalBalls >= totalOversMax * 6) {
      handleEndInnings(newRuns, wickets, newOvers);
      return;
    }

    syncLiveState(newRuns, wickets, newLegalBalls, newOvers, finalStriker, finalNonStriker, updatedBowler, updatedRecent, updatedComm);
  };

  // Record Extras (Wide, No Ball, Bye, Leg Bye)
  const handleScoreExtra = (extraType) => {
    if (isPaused) {
      addToast('Match is currently PAUSED. Click Resume to score', 'warning');
      return;
    }

    pushStateToUndo();

    let addedRuns = 1;
    let isLegal = false;
    let newFreeHit = false;

    const newExtras = { ...extras };

    if (extraType === 'WIDE') {
      newExtras.wides += 1;
      newExtras.total += 1;
    } else if (extraType === 'NO_BALL') {
      newExtras.noBalls += 1;
      newExtras.total += 1;
      newFreeHit = true;
    } else if (extraType === 'BYE') {
      newExtras.byes += 1;
      newExtras.total += 1;
      isLegal = true;
    } else if (extraType === 'LEG_BYE') {
      newExtras.legByes += 1;
      newExtras.total += 1;
      isLegal = true;
    }

    const newRuns = runs + addedRuns;
    const newLegalBalls = isLegal ? legalBalls + 1 : legalBalls;
    const newOvers = formatOvers(newLegalBalls);

    const tag = extraType === 'WIDE' ? 'WD' : extraType === 'NO_BALL' ? 'NB' : extraType === 'BYE' ? 'B1' : 'LB1';
    const updatedRecent = [...recentBalls, tag].slice(-6);

    const commText = generateCommentary('EXTRA', 1, extraType);
    const updatedComm = [{ id: Date.now(), over: newOvers, text: commText, runs: addedRuns }, ...commentaryLog];

    // Bowler stats
    const updatedBowler = {
      ...bowler,
      runs: bowler.runs + addedRuns,
      legalBalls: isLegal ? bowler.legalBalls + 1 : bowler.legalBalls,
      overs: formatOvers(isLegal ? bowler.legalBalls + 1 : bowler.legalBalls),
    };

    setRuns(newRuns);
    setExtras(newExtras);
    setLegalBalls(newLegalBalls);
    setOversFormatted(newOvers);
    setBowler(updatedBowler);
    setRecentBalls(updatedRecent);
    setCommentaryLog(updatedComm);
    if (newFreeHit) setIsFreeHit(true);

    if (currentInnings === 2 && targetRuns && newRuns >= targetRuns) {
      const winner = `${battingTeam} won by ${10 - wickets} wickets!`;
      setMatchWinnerResult(winner);
      setMatchEndedModal(true);
      return;
    }

    if (isLegal && newLegalBalls % 6 === 0) {
      setStriker(nonStriker);
      setNonStriker(striker);
      setNextBowlerModalOpen(true);
    }

    syncLiveState(newRuns, wickets, newLegalBalls, newOvers, striker, nonStriker, updatedBowler, updatedRecent, updatedComm, newExtras);
  };

  // Open Wicket Popup Modal
  const handleInitiateWicket = (dismissalType) => {
    if (isPaused) {
      addToast('Match is currently PAUSED', 'warning');
      return;
    }

    // Available unused batsmen from squad
    const usedNames = [striker.name, nonStriker.name, ...battingCard1.map((b) => b.name), ...battingCard2.map((b) => b.name)];
    const available = currentBattingSquad.filter((p) => !usedNames.includes(p.name));

    setWicketDetails({
      whoOut: 'striker',
      dismissal: dismissalType,
      fielder: '',
      newBatsman: available[0]?.name || `Batsman ${wickets + 3}`,
    });
    setWicketModalOpen(true);
  };

  // Confirm Wicket
  const handleConfirmWicket = () => {
    const activeBattingCard = currentInnings === 1 ? battingCard1 : battingCard2;
    const isAlreadyOut = activeBattingCard.some((b) => b.name.trim().toLowerCase() === (wicketDetails.newBatsman || '').trim().toLowerCase());
    if (isAlreadyOut) {
      addToast(`⛔ Player "${wicketDetails.newBatsman}" is already OUT and cannot bat again!`, 'error');
      return;
    }

    pushStateToUndo();

    const isStrikerOut = wicketDetails.whoOut === 'striker';
    const outPlayer = isStrikerOut ? striker : nonStriker;
    const newWickets = wickets + 1;

    const newLegalBalls = legalBalls + 1;
    const newOvers = formatOvers(newLegalBalls);

    const dismissalText = wicketDetails.fielder
      ? `${wicketDetails.dismissal} (${wicketDetails.fielder})`
      : wicketDetails.dismissal;

    const recordedBatterObj = {
      name: outPlayer.name,
      runs: outPlayer.runs,
      balls: outPlayer.balls + (isStrikerOut ? 1 : 0),
      fours: outPlayer.fours,
      sixes: outPlayer.sixes,
      dismissal: `${dismissalText} b ${bowler.name}`,
    };

    if (currentInnings === 1) {
      setBattingCard1((prev) => [...prev, recordedBatterObj]);
    } else {
      setBattingCard2((prev) => [...prev, recordedBatterObj]);
    }

    // Bowler Wickets update
    const updatedBowler = {
      ...bowler,
      wickets: bowler.wickets + 1,
      legalBalls: bowler.legalBalls + 1,
      overs: formatOvers(bowler.legalBalls + 1),
    };

    const newIncomingBatter = {
      name: wicketDetails.newBatsman || `Batsman ${newWickets + 2}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
    };

    if (isStrikerOut) {
      setStriker(newIncomingBatter);
    } else {
      setNonStriker(newIncomingBatter);
    }

    const updatedRecent = [...recentBalls, 'W'].slice(-6);
    const commText = generateCommentary('WICKET', dismissalText);
    const updatedComm = [{ id: Date.now(), over: newOvers, text: commText, runs: 0 }, ...commentaryLog];

    setWickets(newWickets);
    setLegalBalls(newLegalBalls);
    setOversFormatted(newOvers);
    setBowler(updatedBowler);
    setRecentBalls(updatedRecent);
    setCommentaryLog(updatedComm);
    setWicketModalOpen(false);

    // Check All Out (10 Wickets)
    if (newWickets >= 10) {
      handleEndInnings(runs, 10, newOvers);
      return;
    }

    if (newLegalBalls % 6 === 0) {
      setNextBowlerModalOpen(true);
    }

    syncLiveState(runs, newWickets, newLegalBalls, newOvers, isStrikerOut ? newIncomingBatter : striker, isStrikerOut ? nonStriker : newIncomingBatter, updatedBowler, updatedRecent, updatedComm);
    addToast(`☝️ WICKET! ${outPlayer.name} ${dismissalText}. New batsman: ${newIncomingBatter.name}`, 'error');
  };

  // Confirm Next Bowler Selection
  const handleConfirmNextBowler = () => {
    if (!newBowlerName.trim()) return;

    const trimmedName = newBowlerName.trim();

    // Rule: Bowler cannot bowl 2 consecutive overs!
    // bowler.name is the active bowler who just finished bowling the over.
    const justFinishedBowler = bowler.name;
    if (justFinishedBowler && trimmedName.toLowerCase() === justFinishedBowler.toLowerCase()) {
      addToast(`⛔ ${trimmedName} cannot bowl 2 consecutive overs! Please select another bowler.`, 'warning');
      return;
    }

    const currentBowlingCard = currentInnings === 1 ? bowlingCard1 : bowlingCard2;
    const existing = currentBowlingCard.find((b) => b.name === trimmedName);

    // Record previous bowler to card with updated overs
    const prevBowlerObj = {
      ...bowler,
      overs: formatOvers(bowler.legalBalls || 0),
    };

    if (currentInnings === 1) {
      setBowlingCard1((prev) => [...prev.filter((b) => b.name !== bowler.name), prevBowlerObj]);
    } else {
      setBowlingCard2((prev) => [...prev.filter((b) => b.name !== bowler.name), prevBowlerObj]);
    }

    setLastOverBowlerName(bowler.name);

    const nextBowlerObj = existing
      ? {
          ...existing,
          legalBalls: parseOversToBalls(existing.overs, existing.legalBalls),
        }
      : {
          name: trimmedName,
          overs: '0.0',
          maidens: 0,
          runs: 0,
          wickets: 0,
          legalBalls: 0,
        };

    setBowler(nextBowlerObj);
    setNextBowlerModalOpen(false);
    addToast(`🏏 Next Bowler: ${nextBowlerObj.name}`, 'info');
  };

  // Tactical Substitute Confirmation Handler
  const handleConfirmSubstitution = () => {
    const isBattingSub = substituteDetails.team === 'batting';
    const targetTeamName = isBattingSub ? battingTeam : bowlingTeam;
    const outgoing = substituteDetails.outgoingPlayer;
    const incoming = substituteDetails.customSubName.trim() || substituteDetails.incomingPlayer;

    if (!outgoing || !incoming) {
      addToast('Please select outgoing player and incoming substitute player', 'warning');
      return;
    }

    pushStateToUndo();

    const isTargetTeamA = isBattingSub ? (norm(battingTeam) === norm(teamA)) : (norm(bowlingTeam) === norm(teamA));
    if (isTargetTeamA) {
      setTeamAPlayerList((prev) => prev.map((p) => (p.name === outgoing ? { ...p, name: incoming } : p)));
    } else {
      setTeamBPlayerList((prev) => prev.map((p) => (p.name === outgoing ? { ...p, name: incoming } : p)));
    }

    // Update active on-field players if substituted
    if (striker.name === outgoing) setStriker((prev) => ({ ...prev, name: incoming }));
    if (nonStriker.name === outgoing) setNonStriker((prev) => ({ ...prev, name: incoming }));
    if (bowler.name === outgoing) setBowler((prev) => ({ ...prev, name: incoming }));

    // Commentary Log entry
    const commText = `🔄 Tactical Substitute: ${incoming} came in for ${outgoing} (${targetTeamName}).`;
    const updatedComm = [{ id: Date.now(), over: oversFormatted, text: commText, runs: 0 }, ...commentaryLog];
    setCommentaryLog(updatedComm);

    setSubstituteModalOpen(false);
    setSubstituteDetails({ team: 'batting', outgoingPlayer: '', incomingPlayer: '', customSubName: '' });
    addToast(`🔄 Tactical Substitute: ${incoming} in for ${outgoing} (${targetTeamName})`, 'success');
  };

  // End Innings & Switch to 2nd Innings or End Match
  const handleEndInnings = (finalRuns = runs, finalWickets = wickets, finalOvers = oversFormatted) => {
    if (currentInnings === 1) {
      const calculatedTarget = finalRuns + 1;
      setFirstInningsScore(finalRuns);
      setTargetRuns(calculatedTarget);
      setInningsBreakModalOpen(true);
    } else {
      let result = '';
      if (finalRuns >= (targetRuns || 0)) {
        result = `${battingTeam} won by ${10 - finalWickets} wickets!`;
      } else if (finalRuns < (targetRuns || 0) - 1) {
        result = `${bowlingTeam} won by ${(targetRuns - 1) - finalRuns} runs!`;
      } else {
        result = `Match Tied! Super Over required.`;
      }
      setMatchWinnerResult(result);
      setMatchEndedModal(true);
    }
  };

  const handleStartSecondInnings = () => {
    setCurrentInnings(2);
    setBattingTeam(bowlingTeamNameInitial);
    setBowlingTeam(battingTeamNameInitial);

    setRuns(0);
    setWickets(0);
    setLegalBalls(0);
    setOversFormatted('0.0');

    const nextBattingSquad = (norm(bowlingTeamNameInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList) || [];
    const nextBowlingSquad = (norm(battingTeamNameInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList) || [];

    setStriker({ name: nextBattingSquad[0]?.name || 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
    setNonStriker({ name: nextBattingSquad[1]?.name || 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
    setBowler({ name: nextBowlingSquad[nextBowlingSquad.length - 1]?.name || 'Bowler', overs: '0.0', maidens: 0, runs: 0, wickets: 0, legalBalls: 0 });

    setRecentBalls([]);
    setInningsBreakModalOpen(false);
    addToast(`🏏 2nd Innings Started! ${bowlingTeamNameInitial} needs ${targetRuns} runs to win.`, 'success');
  };

  // Undo Last Ball
  const handleUndo = () => {
    if (historyStack.length === 0) {
      addToast('Nothing to undo', 'info');
      return;
    }

    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((s) => s.slice(0, s.length - 1));

    setRuns(prev.runs);
    setWickets(prev.wickets);
    setLegalBalls(prev.legalBalls);
    setOversFormatted(prev.oversFormatted);
    setExtras(prev.extras);
    setStriker(prev.striker);
    setNonStriker(prev.nonStriker);
    setBowler(prev.bowler);
    setRecentBalls(prev.recentBalls);
    setCommentaryLog(prev.commentaryLog);
    setIsFreeHit(prev.isFreeHit);
    setBattingCard1(prev.battingCard1);
    setBowlingCard1(prev.bowlingCard1);
    setBattingCard2(prev.battingCard2);
    setBowlingCard2(prev.bowlingCard2);

    addToast('↩️ Undid last ball delivery', 'info');
  };

  // Swap Striker / Non-Striker manually
  const handleSwapStriker = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
    addToast('Swapped Striker & Non-Striker', 'info');
  };

  // Finish Match manually
  const handleFinishMatchNow = async () => {
    const result = window.prompt(
      'Enter Final Match Result / Winner String:',
      matchWinnerResult || `${battingTeam} won by ${10 - wickets} wickets!`
    );
    if (!result) return;

    const finalScore1 = currentInnings === 1 ? runs : (firstInningsScore !== null && firstInningsScore !== undefined ? firstInningsScore : (match?.score1 || 0));
    const finalScore2 = currentInnings === 2 ? runs : (match?.score2 || 0);
    const finalWickets1 = currentInnings === 1 ? wickets : (match?.wickets1 !== undefined ? match.wickets1 : 0);
    const finalWickets2 = currentInnings === 2 ? wickets : (match?.wickets2 !== undefined ? match.wickets2 : 0);
    const finalOvers1 = currentInnings === 1 ? oversFormatted : (match?.overs1 || '0.0');
    const finalOvers2 = currentInnings === 2 ? oversFormatted : (match?.overs2 || '0.0');

    const completedObj = {
      ...match,
      status: 'COMPLETED',
      winner: result,
      score1: finalScore1,
      score2: finalScore2,
      wickets1: finalWickets1,
      wickets2: finalWickets2,
      overs1: finalOvers1,
      overs2: finalOvers2,
      resultString: result,
      completedAt: new Date().toISOString(),
      battingCard1,
      bowlingCard1,
      battingCard2,
      bowlingCard2,
      striker,
      nonStriker,
      bowler,
      details: {
        ...(match?.details || {}),
        score1: finalScore1,
        score2: finalScore2,
        wickets1: finalWickets1,
        wickets2: finalWickets2,
        overs1: finalOvers1,
        overs2: finalOvers2,
        resultString: result,
        winner: result,
        targetRuns: targetRuns || match?.targetRuns,
        battingCard1,
        bowlingCard1,
        battingCard2,
        bowlingCard2,
      }
    };

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);
      generateMatchResultPDF(completedObj, isGully ? 'Gully Cricket' : 'Cricket');
      if (onMatchUpdated) onMatchUpdated(match.id, completedObj);
      addToast(`🏆 ${isGully ? 'Gully Cricket' : 'Cricket'} Match Completed! ${result}. PDF Downloaded.`, 'success');
      onClose();
    } catch (err) {
      addToast('Failed to complete match', 'error');
    }
  };

  // Keyboard Shortcuts Handler (0-6 runs, W=wide, N=no ball, K=wicket, Z=undo)
  const handleKeyDown = useCallback((e) => {
    if (wicketModalOpen || nextBowlerModalOpen || inningsBreakModalOpen || showFullScorecard || matchEndedModal) return;

    const key = e.key.toLowerCase();
    if (['0', '1', '2', '3', '4', '6'].includes(key)) {
      handleScoreRun(parseInt(key, 10));
    } else if (key === 'w') {
      handleScoreExtra('WIDE');
    } else if (key === 'n') {
      handleScoreExtra('NO_BALL');
    } else if (key === 'k') {
      handleInitiateWicket('Bowled');
    } else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
      handleUndo();
    }
  }, [wicketModalOpen, nextBowlerModalOpen, inningsBreakModalOpen, showFullScorecard, matchEndedModal, runs, legalBalls, striker, nonStriker, bowler]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden select-none transition-colors">
      
      {/* STICKY TOP LIVE SCOREBAR HEADER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0 transition-colors">
        
        {/* Left: Tournament & Teams Live Score */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Activity className="w-3 h-3" /> LIVE
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono hidden sm:inline">• {venueName}</span>
          </div>

          {/* Innings Target & Main Score Display */}
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white">{battingTeam}</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">
                {runs} / {wickets}
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Overs <span className="font-bold text-white text-sm">{oversFormatted}</span> / {totalOversMax}
            </div>
          </div>
        </div>

        {/* Center: Run Rates & Equations */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-slate-100 dark:bg-slate-900/80 px-4 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition-colors">
          <div>CRR: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentRunRate}</span></div>
          {currentInnings === 2 && targetRuns && (
            <>
              <div className="text-slate-400 dark:text-slate-700">|</div>
              <div>RRR: <span className="font-bold text-amber-600 dark:text-amber-400">{requiredRunRate}</span></div>
              <div className="text-slate-400 dark:text-slate-700">|</div>
              <div className="text-emerald-600 dark:text-emerald-300 font-bold">
                Need {remainingRuns} runs from {remainingBalls} balls
              </div>
            </>
          )}
        </div>

        {/* Right Actions: Pause/Resume, Scorecard, Finish, Exit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer ${
              isPaused
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Match' : 'Pause'}</span>
          </button>

          <button
            onClick={() => setShowFullScorecard(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Scorecard
          </button>

          <button
            onClick={() => setSubstituteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Substitute
          </button>

          <button
            onClick={handleFinishMatchNow}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" /> Finish
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* SECONDARY INFO TICKER BAR */}
      <div className="bg-slate-100 dark:bg-[#0D1527] border-b border-slate-200 dark:border-slate-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 transition-colors">
        
        {/* Partnership & Last Wicket */}
        <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
          <div>
            Partnership: <span className="font-bold text-emerald-600 dark:text-emerald-400">{partnershipRuns}</span> runs ({partnershipBalls} balls)
          </div>
        </div>

        {/* Recent 6 Balls Ticker Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Last Balls:</span>
          <div className="flex items-center gap-1.5">
            {recentBalls.length === 0 ? (
              <span className="text-slate-500 dark:text-slate-600 text-xs">Waiting for first ball...</span>
            ) : (
              recentBalls.map((b, idx) => (
                <span
                  key={idx}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border shadow-sm ${
                    b === '4'
                      ? 'bg-blue-600 text-white border-blue-400'
                      : b === '6'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : b === 'W'
                      ? 'bg-rose-600 text-white border-rose-400'
                      : b === 'WD' || b === 'NB'
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {b}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        
        {/* TOP CARDS GRID: BATSMEN & BOWLER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* BATSMEN PANEL (7 COLS) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Current Batsmen</span>
                {isFreeHit && (
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase animate-bounce">
                    FREE HIT
                  </span>
                )}
              </div>
              <button
                onClick={handleSwapStriker}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Swap Strike
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* STRIKER CARD */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1">
                    ⭐ {striker.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white dark:text-slate-950 text-[9px] font-black uppercase">
                    STRIKER
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{striker.runs}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">({striker.balls} balls)</div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-emerald-500/20 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  <div>4s: <strong className="text-slate-900 dark:text-white">{striker.fours}</strong></div>
                  <div>6s: <strong className="text-slate-900 dark:text-white">{striker.sixes}</strong></div>
                  <div>SR: <strong className="text-emerald-600 dark:text-emerald-400">{striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0'}</strong></div>
                </div>
              </div>

              {/* NON-STRIKER CARD */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{nonStriker.name}</span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">NON-STRIKER</span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{nonStriker.runs}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">({nonStriker.balls} balls)</div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <div>4s: <strong className="text-slate-900 dark:text-white">{nonStriker.fours}</strong></div>
                  <div>6s: <strong className="text-slate-900 dark:text-white">{nonStriker.sixes}</strong></div>
                  <div>SR: <strong className="text-slate-700 dark:text-slate-300">{nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) : '0.0'}</strong></div>
                </div>
              </div>

            </div>
          </div>

          {/* BOWLER PANEL (5 COLS) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Current Bowler</span>
              <button
                onClick={() => setNextBowlerModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Change Bowler
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-amber-700 dark:text-amber-300 truncate">🏏 {bowler.name}</span>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{bowler.wickets} - {bowler.runs}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-amber-500/20 text-xs font-mono text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Overs</span>
                  <strong className="text-slate-900 dark:text-white">{bowler.overs}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Maidens</span>
                  <strong className="text-slate-900 dark:text-white">{bowler.maidens || 0}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Wickets</span>
                  <strong className="text-rose-600 dark:text-rose-400">{bowler.wickets}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Econ</span>
                  <strong className="text-amber-600 dark:text-amber-400">{bowler.legalBalls > 0 ? (bowler.runs / (bowler.legalBalls / 6)).toFixed(2) : '0.00'}</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BALL BY BALL SCORING CONTROLS */}
        <div className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-2xl transition-colors">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-300 tracking-wider">Ball By Ball Scoring Console</span>
            <span className="text-[10px] font-mono text-slate-500">Keyboard Shortcuts Active (0-6, W, N, K, Ctrl+Z)</span>
          </div>

          {/* LARGE SCORING RUN BUTTONS */}
          <div className="grid grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <button
                key={run}
                onClick={() => handleScoreRun(run)}
                className={`py-4 sm:py-5 rounded-2xl font-black text-xl sm:text-2xl transition shadow-lg flex items-center justify-center cursor-pointer ${
                  run === 4
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : run === 6
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 font-black scale-105 border border-purple-400'
                    : run === 0
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-800'
                }`}
              >
                {run === 0 ? '0' : run}
              </button>
            ))}
          </div>

          {/* EXTRAS & DISMISSALS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Extras Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">EXTRAS</span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleScoreExtra('WIDE')}
                  className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                >
                  WD (+1)
                </button>
                <button
                  onClick={() => handleScoreExtra('NO_BALL')}
                  className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                >
                  NB (+1)
                </button>
                <button
                  onClick={() => handleScoreExtra('BYE')}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  BYE (+1)
                </button>
                <button
                  onClick={() => handleScoreExtra('LEG_BYE')}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  LEG BYE
                </button>
              </div>
            </div>

            {/* Dismissal Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase">DISMISSALS (WICKETS)</span>
              <div className="grid grid-cols-4 gap-2">
                {['Bowled', 'Caught', 'LBW', 'Run Out'].map((dis) => (
                  <button
                    key={dis}
                    onClick={() => handleInitiateWicket(dis)}
                    className="py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                  >
                    ☝️ {dis}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Undo & Secondary Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                historyStack.length > 0
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Undo Last Ball
            </button>

            <span className="text-[11px] text-slate-500 font-mono">
              Total Deliveries Recorded: {legalBalls}
            </span>
          </div>

        </div>

        {/* LIVE COMMENTARY FEED */}
        <div className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xl transition-colors">
          <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-300 tracking-wider">Live Match Commentary</span>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {commentaryLog.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No ball commentary recorded yet.</p>
            ) : (
              commentaryLog.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono flex items-start gap-3 transition-colors">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] shrink-0">
                    Over {c.over}
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* WICKET DETAILS POPUP MODAL */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl transition-colors">
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              ☝️ Record Wicket Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Who got out?</label>
                <select
                  value={wicketDetails.whoOut}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, whoOut: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="striker">Striker: {striker.name}</option>
                  <option value="nonStriker">Non-Striker: {nonStriker.name}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Dismissal Type</label>
                <select
                  value={wicketDetails.dismissal}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, dismissal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Bowled">Bowled</option>
                  <option value="Caught">Caught</option>
                  <option value="LBW">LBW</option>
                  <option value="Run Out">Run Out</option>
                  <option value="Stumped">Stumped</option>
                  <option value="Hit Wicket">Hit Wicket</option>
                  <option value="Retired Hurt">Retired Hurt</option>
                </select>
              </div>

              {['Caught', 'Stumped', 'Run Out'].includes(wicketDetails.dismissal) && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Fielder Name (Select from {bowlingTeam} Roll-Down List)
                  </label>
                  <select
                    value={wicketDetails.fielder}
                    onChange={(e) => setWicketDetails({ ...wicketDetails, fielder: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold text-xs mb-1.5"
                  >
                    <option value="">-- Select Fielder from {bowlingTeam} --</option>
                    {currentBowlingSquad.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={wicketDetails.fielder}
                    onChange={(e) => setWicketDetails({ ...wicketDetails, fielder: e.target.value })}
                    placeholder="Or type custom fielder name..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  New Incoming Batsman (Select from {battingTeam} Roll-Down List)
                </label>
                <select
                  value={wicketDetails.newBatsman}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, newBatsman: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1.5"
                >
                  <option value="">-- Select Player from {battingTeam} Squad --</option>
                  {currentBattingSquad.map((p) => {
                    const activeCard = currentInnings === 1 ? battingCard1 : battingCard2;
                    const isCurrent = p.name === striker.name || p.name === nonStriker.name;
                    const isAlreadyOut = activeCard.some((b) => b.name.trim().toLowerCase() === p.name.trim().toLowerCase());
                    const isDisabled = isCurrent || isAlreadyOut;

                    return (
                      <option key={p.name} value={p.name} disabled={isDisabled}>
                        {p.name} {isAlreadyOut ? '(OUT - Cannot Bat Again)' : isCurrent ? '(Currently Batting)' : ''}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  value={wicketDetails.newBatsman}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, newBatsman: e.target.value })}
                  placeholder="Or type custom batsman name..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setWicketModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWicket}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEXT BOWLER SELECTION MODAL */}
      {nextBowlerModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl transition-colors">
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
              🏏 End of Over — Select Next Bowler
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Over completed. Please select or enter the bowler for the next over.
            </p>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase">Bowler Name</label>
              <select
                value={newBowlerName}
                onChange={(e) => setNewBowlerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold"
              >
                <option value="">Select Bowler from Squad...</option>
                {currentBowlingSquad.map((p) => {
                  const justFinishedBowler = bowler.name;
                  const isJustBowled = justFinishedBowler && p.name.trim().toLowerCase() === justFinishedBowler.trim().toLowerCase();

                  return (
                    <option key={p.name} value={p.name} disabled={isJustBowled}>
                      {p.name} {isJustBowled ? '(Just Bowled Previous Over - Wait 1 Over)' : ''}
                    </option>
                  );
                })}
              </select>

              <input
                type="text"
                value={newBowlerName}
                onChange={(e) => setNewBowlerName(e.target.value)}
                placeholder="Or type custom bowler name..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <button
              onClick={handleConfirmNextBowler}
              disabled={!newBowlerName.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
            >
              Start Next Over
            </button>
          </div>
        </div>
      )}

      {/* INNINGS BREAK MODAL */}
      {inningsBreakModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-center transition-colors">
            <Trophy className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">1st Innings Completed!</h3>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono">{battingTeam} Score</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{runs} / {wickets}</p>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Target for {bowlingTeam}: <strong className="text-amber-600 dark:text-amber-400">{targetRuns} Runs</strong></span>
            </div>

            <button
              onClick={handleStartSecondInnings}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg cursor-pointer"
            >
              Start 2nd Innings Now →
            </button>
          </div>
        </div>
      )}

      {/* MATCH ENDED POPUP MODAL */}
      {matchEndedModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl text-center transition-colors">
            
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                Official Match Concluded
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">MATCH ENDED!</h3>
            </div>

            {/* Winner Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-500/40 space-y-1">
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold uppercase">Official Winner Declaration</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                🏆 {matchWinnerResult || `${battingTeam} won by ${10 - wickets} wickets!`}
              </p>
            </div>

            {/* Scores Summary */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">{teamA}</span>
                <strong className="text-slate-900 dark:text-white text-base">
                  {currentInnings === 1 ? runs : firstInningsScore || 0}/{currentInnings === 1 ? wickets : (match?.wickets1 || 0)}
                </strong>
                <span className="block text-[10px] text-slate-500">({currentInnings === 1 ? oversFormatted : (match?.overs1 || '0.0')} ov)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">{teamB}</span>
                <strong className="text-slate-900 dark:text-white text-base">
                  {currentInnings === 2 ? runs : 0}/{currentInnings === 2 ? wickets : 0}
                </strong>
                <span className="block text-[10px] text-slate-500">({currentInnings === 2 ? oversFormatted : '0.0'} ov)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const fullMatchData = {
                    ...match,
                    currentInnings,
                    striker,
                    nonStriker,
                    bowler,
                    score1: currentInnings === 1 ? runs : firstInningsScore,
                    score2: currentInnings === 2 ? runs : 0,
                    wickets1: currentInnings === 1 ? wickets : match?.wickets1,
                    wickets2: currentInnings === 2 ? wickets : 0,
                    overs1: currentInnings === 1 ? oversFormatted : match?.overs1,
                    overs2: currentInnings === 2 ? oversFormatted : '0.0',
                    battingCard1,
                    bowlingCard1,
                    battingCard2,
                    bowlingCard2,
                    resultString: matchWinnerResult,
                    winner: matchWinnerResult,
                  };
                  generateMatchResultPDF(fullMatchData, isGully ? 'Gully Cricket' : 'Cricket');
                  addToast(`Downloaded Official ${isGully ? 'Gully Cricket' : 'Cricket'} Result & Scorecard PDF`, 'success');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Download PDF Result & Full Scorecard
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowFullScorecard(true)}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                >
                  View Scorecard
                </button>
                <button
                  onClick={handleFinishMatchNow}
                  className="py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  Complete & Exit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL SCORECARD MODAL */}
      {showFullScorecard && (
        <CricketScorecardModal
          match={{
            ...match,
            score1: currentInnings === 1 ? runs : firstInningsScore,
            score2: currentInnings === 2 ? runs : 0,
            wickets1: currentInnings === 1 ? wickets : match?.wickets1,
            wickets2: currentInnings === 2 ? wickets : 0,
            overs1: currentInnings === 1 ? oversFormatted : match?.overs1,
            overs2: currentInnings === 2 ? oversFormatted : '0.0',
            innings1: { battingStats: battingCard1, bowlingStats: bowlingCard1, runs: firstInningsScore || runs },
            innings2: { battingStats: battingCard2, bowlingStats: bowlingCard2, runs: currentInnings === 2 ? runs : 0 },
            resultString: matchWinnerResult,
          }}
          onClose={() => setShowFullScorecard(false)}
        />
      )}

      {/* TACTICAL SUBSTITUTE MODAL */}
      {substituteModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl transition-colors">
            <h3 className="text-lg font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Tactical Player Substitution
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Substitute an on-field player with a bench/substitute player.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Select Team */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Select Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubstituteDetails({ ...substituteDetails, team: 'batting', outgoingPlayer: '', incomingPlayer: '' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      substituteDetails.team === 'batting'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    Batting: {battingTeam}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubstituteDetails({ ...substituteDetails, team: 'bowling', outgoingPlayer: '', incomingPlayer: '' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      substituteDetails.team === 'bowling'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    Bowling: {bowlingTeam}
                  </button>
                </div>
              </div>

              {/* Select Outgoing Player */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Outgoing Player (Off Field)</label>
                <select
                  value={substituteDetails.outgoingPlayer}
                  onChange={(e) => setSubstituteDetails({ ...substituteDetails, outgoingPlayer: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold text-xs"
                >
                  <option value="">-- Select Outgoing Player --</option>
                  {(substituteDetails.team === 'batting' ? currentBattingSquad : currentBowlingSquad).map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.name === striker.name ? '(Striker)' : p.name === nonStriker.name ? '(Non-Striker)' : p.name === bowler.name ? '(Bowler)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Incoming Substitute Player */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Incoming Substitute Player (On Field)</label>
                <select
                  value={substituteDetails.incomingPlayer}
                  onChange={(e) => setSubstituteDetails({ ...substituteDetails, incomingPlayer: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-1.5"
                >
                  <option value="">-- Select Substitute from Bench --</option>
                  {(substituteDetails.team === 'batting' ? currentBattingSubs : currentBowlingSubs).map((s, idx) => {
                    const subName = typeof s === 'string' ? s : (s?.name || `Sub ${idx + 1}`);
                    return (
                      <option key={idx} value={subName}>
                        {subName}
                      </option>
                    );
                  })}
                </select>

                <input
                  type="text"
                  value={substituteDetails.customSubName}
                  onChange={(e) => setSubstituteDetails({ ...substituteDetails, customSubName: e.target.value })}
                  placeholder="Or type custom substitute player name..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSubstituteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubstitution}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Substitute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  return createPortal(modalJSX, document.body);
};
