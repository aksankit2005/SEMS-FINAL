import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCcw, Trophy, AlertCircle, RefreshCw, UserCheck, Activity, 
  Maximize2, Minimize2, Play, Pause, ChevronRight, FileText, CheckCircle2, 
  Award, Shield, HelpCircle, Edit3, ArrowLeftRight, Radio, Plus, Zap, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { CricketScorecardModal } from './CricketScorecardModal';
import { 
  createBallEvent, 
  calculateInningsStats, 
  calculateCompleteMatchState, 
  generateCricketCommentary, 
  formatBallsToOvers, 
  formatDismissalText,
  compileCricketMatchPerformances 
} from '../../../utils/cricketEngine';

export const NormalCricketLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  // Fullscreen state & browser change listener
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Lock background scroll when controller is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Setup data extraction
  const setupData = match?.setupData || {};
  const teamA = setupData.teamA?.name || match?.team1 || 'MPEC Titans XI';
  const teamB = setupData.teamB?.name || match?.team2 || 'PSIT Super Kings';

  const batting1stTeamInitial = setupData.battingTeamName || teamA;
  const bowling1stTeamInitial = setupData.bowlingTeamName || teamB;

  const totalOversMax = Number(setupData.matchDetails?.totalOvers || match?.totalOversMax || 20);

  const DEFAULT_TEAM_A_PLAYERS = [
    { name: 'Rohit Sharma' }, { name: 'Shubman Gill' }, { name: 'Virat Kohli' }, { name: 'Shreyas Iyer' },
    { name: 'KL Rahul' }, { name: 'Hardik Pandya' }, { name: 'Ravindra Jadeja' }, { name: 'Axar Patel' },
    { name: 'Kuldeep Yadav' }, { name: 'Jasprit Bumrah' }, { name: 'Mohammed Siraj' }
  ];

  const DEFAULT_TEAM_B_PLAYERS = [
    { name: 'Travis Head' }, { name: 'David Warner' }, { name: 'Steve Smith' }, { name: 'Marnus Labuschagne' },
    { name: 'Glenn Maxwell' }, { name: 'Marcus Stoinis' }, { name: 'Alex Carey' }, { name: 'Pat Cummins' },
    { name: 'Mitchell Starc' }, { name: 'Adam Zampa' }, { name: 'Josh Hazlewood' }
  ];

  const DEFAULT_TEAM_A_SUBS = [{ name: 'Suryakumar Yadav' }, { name: 'Mohammed Shami' }];
  const DEFAULT_TEAM_B_SUBS = [{ name: 'Nathan Lyon' }, { name: 'Cameron Green' }];

  // Dedicated Storage Key for Match Persistence (Ensures match state never resets on back / reopen)
  const matchId = match?.id || match?._id || match?.tableNumber || 'cricket_live_match';
  const CONTROLLER_CACHE_KEY = `sems_cricket_controller_state_${matchId}`;

  const getCachedState = () => {
    try {
      const raw = localStorage.getItem(CONTROLLER_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading cricket match controller cache:', e);
    }
    return null;
  };

  const cachedState = useMemo(() => getCachedState(), [matchId]);

  const getPlayerName = (p) => {
    if (!p) return '';
    if (typeof p === 'string') return p.trim();
    return String(p.name || '').trim();
  };

  // Playing XI Squads
  const [teamAPlayerList, setTeamAPlayerList] = useState(
    cachedState?.teamAPlayerList || setupData.teamAPlayers || setupData.teamA?.players || DEFAULT_TEAM_A_PLAYERS
  );
  const [teamBPlayerList, setTeamBPlayerList] = useState(
    cachedState?.teamBPlayerList || setupData.teamBPlayers || setupData.teamB?.players || DEFAULT_TEAM_B_PLAYERS
  );

  const [teamASubsList, setTeamASubsList] = useState(
    setupData.teamASubs || setupData.teamA?.subs || DEFAULT_TEAM_A_SUBS
  );
  const [teamBSubsList, setTeamBSubsList] = useState(
    setupData.teamBSubs || setupData.teamB?.subs || DEFAULT_TEAM_B_SUBS
  );

  // Innings state: 1 or 2 (Hydrate from cache or match)
  const [currentInnings, setCurrentInnings] = useState(() => {
    return cachedState?.currentInnings || match?.currentInnings || match?.details?.currentInnings || 1;
  });

  // Active teams based on innings
  const battingTeam = currentInnings === 1 ? batting1stTeamInitial : bowling1stTeamInitial;
  const bowlingTeam = currentInnings === 1 ? bowling1stTeamInitial : batting1stTeamInitial;

  const norm = (str) => String(str || '').trim().toLowerCase();
  const currentBattingSquad = norm(battingTeam) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
  const currentBowlingSquad = norm(bowlingTeam) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

  // SOURCE OF TRUTH: All ball events array (Hydrate from cache first)
  const [ballEvents, setBallEvents] = useState(() => {
    if (Array.isArray(cachedState?.ballEvents) && cachedState.ballEvents.length > 0) {
      return cachedState.ballEvents;
    }
    if (Array.isArray(match?.ballEvents) && match.ballEvents.length > 0) {
      return match.ballEvents;
    }
    if (Array.isArray(match?.details?.ballEvents) && match.details.ballEvents.length > 0) {
      return match.details.ballEvents;
    }
    return [];
  });

  // Target for 2nd innings
  const [targetRuns, setTargetRuns] = useState(() => {
    return cachedState?.targetRuns ?? match?.targetRuns ?? match?.details?.targetRuns ?? null;
  });

  // Active On-Field Batsmen and Bowler tracking
  const [activeStriker, setActiveStriker] = useState(() => {
    return (
      cachedState?.activeStriker ||
      getPlayerName(match?.activeStriker) ||
      getPlayerName(match?.striker) ||
      setupData.openingStriker ||
      currentBattingSquad[0]?.name ||
      'Rohit Sharma'
    );
  });

  const [activeNonStriker, setActiveNonStriker] = useState(() => {
    return (
      cachedState?.activeNonStriker ||
      getPlayerName(match?.activeNonStriker) ||
      getPlayerName(match?.nonStriker) ||
      setupData.openingNonStriker ||
      currentBattingSquad[1]?.name ||
      'Shubman Gill'
    );
  });

  const [activeBowler, setActiveBowler] = useState(() => {
    return (
      cachedState?.activeBowler ||
      getPlayerName(match?.activeBowler) ||
      getPlayerName(match?.bowler) ||
      setupData.openingBowler ||
      currentBowlingSquad[currentBowlingSquad.length - 1]?.name ||
      'Mitchell Starc'
    );
  });

  // Previous over bowler tracking to enforce rule: Bowler cannot bowl 2 consecutive overs
  const [lastOverBowler, setLastOverBowler] = useState(() => {
    return cachedState?.lastOverBowler || match?.lastOverBowler || '';
  });

  // Free hit & Pause state
  const [isFreeHit, setIsFreeHit] = useState(() => {
    return Boolean(cachedState?.isFreeHit ?? match?.isFreeHit ?? false);
  });
  const [isPaused, setIsPaused] = useState(false);

  // Modals state
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketDetails, setWicketDetails] = useState({
    whoOut: 'striker',
    dismissalType: 'Bowled',
    fielder: '',
    incomingBatsman: ''
  });

  const [nextBowlerModalOpen, setNextBowlerModalOpen] = useState(false);
  const [newBowlerName, setNewBowlerName] = useState('');

  const [extraCustomModalOpen, setExtraCustomModalOpen] = useState(false);
  const [extraModalConfig, setExtraModalConfig] = useState({ type: 'WIDE', additionalRuns: 0 });

  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [substituteDetails, setSubstituteDetails] = useState({
    team: 'batting',
    outgoingPlayer: '',
    incomingPlayer: '',
    customSubName: '',
  });

  const [matchEndedModal, setMatchEndedModal] = useState(() => match?.status === 'COMPLETED');
  const [matchWinnerResult, setMatchWinnerResult] = useState(match?.resultString || match?.winner || '');
  const [showFullScorecard, setShowFullScorecard] = useState(false);

  // Man of the Match (MOTM) Selection & State
  const [confirmedMotm, setConfirmedMotm] = useState(() => {
    return match?.motm || match?.details?.motm || cachedState?.motm || null;
  });
  const [selectedMotmPlayerName, setSelectedMotmPlayerName] = useState(() => {
    return match?.motm?.playerName || match?.details?.motm?.playerName || '';
  });
  const [isEditingMotm, setIsEditingMotm] = useState(false);

  // Innings Management & Transition Modal State (Automatic & Manual)
  const [inningsTransitionModalOpen, setInningsTransitionModalOpen] = useState(false);
  const [transitionTargetInn, setTransitionTargetInn] = useState(2);
  const [transitionCustomTarget, setTransitionCustomTarget] = useState('');
  const [transitionReason, setTransitionReason] = useState('manual'); // 'auto_all_out', 'auto_overs_complete', 'manual'

  // Second Innings Openers Selection
  const [secondInningsOpeners, setSecondInningsOpeners] = useState(() => {
    return cachedState?.secondInningsOpeners || {
      striker: '',
      nonStriker: '',
      bowler: ''
    };
  });

  // Persist State Snapshot to LocalStorage
  const persistStateSnapshot = useCallback((overrides = {}) => {
    try {
      const snapshot = {
        matchId,
        currentInnings: overrides.currentInnings ?? currentInnings,
        ballEvents: overrides.ballEvents ?? ballEvents,
        activeStriker: overrides.activeStriker ?? activeStriker,
        activeNonStriker: overrides.activeNonStriker ?? activeNonStriker,
        activeBowler: overrides.activeBowler ?? activeBowler,
        lastOverBowler: overrides.lastOverBowler ?? lastOverBowler,
        isFreeHit: overrides.isFreeHit ?? isFreeHit,
        targetRuns: overrides.targetRuns ?? targetRuns,
        secondInningsOpeners: overrides.secondInningsOpeners ?? secondInningsOpeners,
        teamAPlayerList,
        teamBPlayerList,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(CONTROLLER_CACHE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Failed to persist cricket controller state:', e);
    }
  }, [matchId, CONTROLLER_CACHE_KEY, currentInnings, ballEvents, activeStriker, activeNonStriker, activeBowler, lastOverBowler, isFreeHit, targetRuns, secondInningsOpeners, teamAPlayerList, teamBPlayerList]);

  // Keep localStorage continuously synchronized on state updates
  useEffect(() => {
    persistStateSnapshot();
  }, [currentInnings, ballEvents, activeStriker, activeNonStriker, activeBowler, lastOverBowler, isFreeHit, targetRuns, secondInningsOpeners, persistStateSnapshot]);

  // Safe Exit Handler (Saves everything before closing)
  const handleSafeClose = () => {
    persistStateSnapshot();
    onClose();
  };

  // Calculate Innings 1 and Innings 2 Stats deterministically from ballEvents
  const innings1Events = useMemo(() => ballEvents.filter((b) => b.inningsId === 1), [ballEvents]);
  const innings2Events = useMemo(() => ballEvents.filter((b) => b.inningsId === 2), [ballEvents]);

  const inn1Stats = useMemo(() => {
    return calculateInningsStats(
      innings1Events,
      batting1stTeamInitial,
      bowling1stTeamInitial,
      totalOversMax,
      setupData.openingStriker || teamAPlayerList[0]?.name,
      setupData.openingNonStriker || teamAPlayerList[1]?.name,
      setupData.openingBowler || teamBPlayerList[teamBPlayerList.length - 1]?.name,
      teamAPlayerList
    );
  }, [innings1Events, batting1stTeamInitial, bowling1stTeamInitial, totalOversMax, setupData, teamAPlayerList, teamBPlayerList]);

  const inn2Stats = useMemo(() => {
    const defaultInn2Squad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
    const defaultInn2BowlingSquad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

    return calculateInningsStats(
      innings2Events,
      bowling1stTeamInitial,
      batting1stTeamInitial,
      totalOversMax,
      secondInningsOpeners.striker || defaultInn2Squad[0]?.name,
      secondInningsOpeners.nonStriker || defaultInn2Squad[1]?.name,
      secondInningsOpeners.bowler || defaultInn2BowlingSquad[defaultInn2BowlingSquad.length - 1]?.name,
      defaultInn2Squad
    );
  }, [innings2Events, bowling1stTeamInitial, batting1stTeamInitial, totalOversMax, secondInningsOpeners, teamAPlayerList, teamBPlayerList]);

  const currentStats = currentInnings === 1 ? inn1Stats : inn2Stats;

  // Set initial targetRuns if 1st innings has runs and targetRuns is unset
  useEffect(() => {
    if (inn1Stats.runs > 0 && !targetRuns) {
      setTargetRuns(inn1Stats.runs + 1);
    }
  }, [inn1Stats.runs, targetRuns]);

  // Live / Concluded Match Performance Data for MOTM
  const currentMatchSnapshot = useMemo(() => {
    return {
      ...match,
      ballEvents,
      team1: teamA,
      team2: teamB,
      setupData: {
        ...setupData,
        teamA: { ...(setupData.teamA || {}), name: teamA, players: teamAPlayerList },
        teamB: { ...(setupData.teamB || {}), name: teamB, players: teamBPlayerList },
        battingTeamName: batting1stTeamInitial,
        bowlingTeamName: bowling1stTeamInitial
      },
      details: {
        ...(match?.details || {}),
        ballEvents,
        innings1: inn1Stats,
        innings2: inn2Stats,
        winner: matchWinnerResult,
        resultString: matchWinnerResult
      }
    };
  }, [match, ballEvents, teamA, teamB, setupData, teamAPlayerList, teamBPlayerList, batting1stTeamInitial, bowling1stTeamInitial, inn1Stats, inn2Stats, matchWinnerResult]);

  const performanceData = useMemo(() => {
    return compileCricketMatchPerformances(currentMatchSnapshot);
  }, [currentMatchSnapshot]);

  const activeSelectedMotmPlayer = useMemo(() => {
    if (selectedMotmPlayerName) {
      const found = performanceData.players.find(p => p.playerName === selectedMotmPlayerName);
      if (found) return found;
    }
    return performanceData.topCandidates[0] || performanceData.players[0] || null;
  }, [selectedMotmPlayerName, performanceData]);

  // Handle Coordinator Confirmation of Man of the Match
  const handleConfirmMOTM = async (playerToConfirm = activeSelectedMotmPlayer) => {
    if (!playerToConfirm) {
      addToast('Please select a player for Man of the Match.', 'warning');
      return;
    }

    const motmObj = {
      playerId: String(playerToConfirm.playerId || playerToConfirm.playerName || '').trim(),
      playerName: String(playerToConfirm.playerName || '').trim(),
      teamId: String(playerToConfirm.teamId || '').trim(),
      teamName: String(playerToConfirm.teamName || '').trim(),
      performanceSummary: String(playerToConfirm.performanceSummary || '').trim()
    };

    const finalResult = matchWinnerResult || match?.resultString || match?.winner || (
      currentInnings === 2 && inn2Stats.runs >= targetRuns
        ? `${bowling1stTeamInitial} won by ${10 - inn2Stats.wickets} wickets!`
        : `${batting1stTeamInitial} won by ${Math.max(1, (targetRuns || 0) - inn2Stats.runs)} runs!`
    );

    const updatedCompletedObj = {
      ...match,
      status: 'COMPLETED',
      winner: finalResult,
      resultString: finalResult,
      score1: inn1Stats.runs,
      wickets1: inn1Stats.wickets,
      overs1: inn1Stats.oversFormatted,
      score2: inn2Stats.runs,
      wickets2: inn2Stats.wickets,
      overs2: inn2Stats.oversFormatted,
      completedAt: match?.completedAt || new Date().toISOString(),
      battingCard1: inn1Stats.battingStats,
      bowlingCard1: inn1Stats.bowlingStats,
      battingCard2: inn2Stats.battingStats,
      bowlingCard2: inn2Stats.bowlingStats,
      motm: motmObj,
      manOfTheMatch: motmObj.playerName,
      details: {
        ...(match?.details || {}),
        score1: inn1Stats.runs,
        score2: inn2Stats.runs,
        wickets1: inn1Stats.wickets,
        wickets2: inn2Stats.wickets,
        overs1: inn1Stats.oversFormatted,
        overs2: inn2Stats.oversFormatted,
        targetRuns: targetRuns || (inn1Stats.runs + 1),
        resultString: finalResult,
        winner: finalResult,
        motm: motmObj,
        manOfTheMatch: motmObj.playerName,
        ballEvents,
        innings1: inn1Stats,
        innings2: inn2Stats,
        playerPerformances: {
          batters: [...inn1Stats.battingStats, ...inn2Stats.battingStats],
          bowlers: [...inn1Stats.bowlingStats, ...inn2Stats.bowlingStats],
          fielders: [...inn1Stats.fieldingStats, ...inn2Stats.fieldingStats]
        },
        commentaryLog: inn2Stats.commentaryLog || inn1Stats.commentaryLog || []
      }
    };

    try {
      await coordinatorApi.completeMatch(match.id, updatedCompletedObj);
      setConfirmedMotm(motmObj);
      setIsEditingMotm(false);
      generateMatchResultPDF(updatedCompletedObj, 'Cricket');
      if (onMatchUpdated) onMatchUpdated(match.id, updatedCompletedObj);
      addToast(`🏆 Man of the Match confirmed: ${motmObj.playerName} (${motmObj.teamName})`, 'success');
    } catch (err) {
      console.error('Failed to confirm Man of the Match:', err);
      addToast('Failed to save Man of the Match: ' + (err.message || 'Error'), 'error');
    }
  };

  // Sync state to backend API and localStorage
  const syncLiveState = useCallback(async (customBallEvents = ballEvents, customInn = currentInnings, customTarget = targetRuns, customResult = matchWinnerResult) => {
    const ev1 = customBallEvents.filter((b) => b.inningsId === 1);
    const ev2 = customBallEvents.filter((b) => b.inningsId === 2);

    const s1 = calculateInningsStats(ev1, batting1stTeamInitial, bowling1stTeamInitial, totalOversMax);
    const s2 = calculateInningsStats(ev2, bowling1stTeamInitial, batting1stTeamInitial, totalOversMax);

    const activeS = customInn === 1 ? s1 : s2;

    const payload = {
      score1: s1.runs,
      wickets1: s1.wickets,
      overs1: s1.oversFormatted,

      score2: s2.runs,
      wickets2: s2.wickets,
      overs2: s2.oversFormatted,

      currentInnings: customInn,
      battingTeam,
      bowlingTeam,
      targetRuns: customTarget || (s1.runs + 1),
      firstInningsScore: s1.runs,

      striker: activeS.striker,
      nonStriker: activeS.nonStriker,
      bowler: activeS.bowler,
      activeStriker,
      activeNonStriker,
      activeBowler,

      recentBalls: activeS.recentBalls,
      commentaryLog: activeS.commentaryLog,
      extras: activeS.extras,
      partnership: activeS.partnership,
      fallOfWickets: activeS.fallOfWickets,

      battingCard1: s1.battingStats,
      bowlingCard1: s1.bowlingStats,
      battingCard2: s2.battingStats,
      bowlingCard2: s2.bowlingStats,

      status: 'running',
      isFreeHit,
      ballEvents: customBallEvents,

      details: {
        ...(match?.details || {}),
        score1: s1.runs,
        score2: s2.runs,
        wickets1: s1.wickets,
        wickets2: s2.wickets,
        overs1: s1.oversFormatted,
        overs2: s2.oversFormatted,
        targetRuns: customTarget || (s1.runs + 1),
        currentInnings: customInn,
        ballEvents: customBallEvents,
        activeStriker,
        activeNonStriker,
        activeBowler,
        innings1: s1,
        innings2: s2,
        resultString: customResult,
        winner: customResult,
        playerPerformances: {
          batters: [...s1.battingStats, ...s2.battingStats],
          bowlers: [...s1.bowlingStats, ...s2.bowlingStats],
          fielders: [...s1.fieldingStats, ...s2.fieldingStats]
        }
      }
    };

    try {
      await coordinatorApi.updateMatchScoring(match.id, payload);
      if (onMatchUpdated) onMatchUpdated(match.id, payload);
    } catch (err) {
      console.warn('Sync cricket score error:', err);
    }
  }, [ballEvents, currentInnings, targetRuns, matchWinnerResult, batting1stTeamInitial, bowling1stTeamInitial, totalOversMax, battingTeam, bowlingTeam, isFreeHit, match, onMatchUpdated, activeStriker, activeNonStriker, activeBowler]);

  // REF to guard against duplicate completion executions
  const isFinishingRef = useRef(false);

  // AUTOMATIC MATCH COMPLETION HANDLER (Saves status=COMPLETED, downloads PDF, syncs stores)
  const triggerAutoCompleteMatch = useCallback(async (finalResult, eventsToFinalize = ballEvents) => {
    if (isFinishingRef.current || match?.status === 'COMPLETED') return;
    isFinishingRef.current = true;

    const ev1 = eventsToFinalize.filter((b) => b.inningsId === 1);
    const ev2 = eventsToFinalize.filter((b) => b.inningsId === 2);

    const s1 = calculateInningsStats(
      ev1,
      batting1stTeamInitial,
      bowling1stTeamInitial,
      totalOversMax,
      setupData.openingStriker || teamAPlayerList[0]?.name,
      setupData.openingNonStriker || teamAPlayerList[1]?.name,
      setupData.openingBowler || teamBPlayerList[teamBPlayerList.length - 1]?.name,
      teamAPlayerList
    );

    const defaultInn2Squad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
    const defaultInn2BowlingSquad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

    const s2 = calculateInningsStats(
      ev2,
      bowling1stTeamInitial,
      batting1stTeamInitial,
      totalOversMax,
      secondInningsOpeners.striker || defaultInn2Squad[0]?.name,
      secondInningsOpeners.nonStriker || defaultInn2Squad[1]?.name,
      secondInningsOpeners.bowler || defaultInn2BowlingSquad[defaultInn2BowlingSquad.length - 1]?.name,
      defaultInn2Squad
    );

    const finalTarget = targetRuns || (s1.runs + 1);

    const completedObj = {
      ...match,
      status: 'COMPLETED',
      winner: finalResult,
      resultString: finalResult,
      score1: s1.runs,
      wickets1: s1.wickets,
      overs1: s1.oversFormatted,
      score2: s2.runs,
      wickets2: s2.wickets,
      overs2: s2.oversFormatted,
      completedAt: new Date().toISOString(),
      battingCard1: s1.battingStats,
      bowlingCard1: s1.bowlingStats,
      battingCard2: s2.battingStats,
      bowlingCard2: s2.bowlingStats,
      motm: confirmedMotm || match?.motm || match?.details?.motm || null,
      manOfTheMatch: confirmedMotm?.playerName || match?.manOfTheMatch || match?.details?.manOfTheMatch || '',
      details: {
        ...(match?.details || {}),
        score1: s1.runs,
        score2: s2.runs,
        wickets1: s1.wickets,
        wickets2: s2.wickets,
        overs1: s1.oversFormatted,
        overs2: s2.oversFormatted,
        targetRuns: finalTarget,
        resultString: finalResult,
        winner: finalResult,
        motm: confirmedMotm || match?.motm || match?.details?.motm || null,
        manOfTheMatch: confirmedMotm?.playerName || match?.manOfTheMatch || match?.details?.manOfTheMatch || '',
        ballEvents: eventsToFinalize,
        innings1: s1,
        innings2: s2,
        playerPerformances: {
          batters: [...s1.battingStats, ...s2.battingStats],
          bowlers: [...s1.bowlingStats, ...s2.bowlingStats],
          fielders: [...s1.fieldingStats, ...s2.fieldingStats]
        },
        commentaryLog: s2.commentaryLog || s1.commentaryLog || []
      }
    };

    setMatchWinnerResult(finalResult);
    setMatchEndedModal(true);

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);

      try {
        localStorage.removeItem(CONTROLLER_CACHE_KEY);
      } catch (e) {
        console.warn('LocalStorage cleanup warning:', e);
      }

      generateMatchResultPDF(completedObj, 'Cricket');

      if (onMatchUpdated) onMatchUpdated(match.id, completedObj);
      addToast(`🏆 Match Completed! ${finalResult}. Saved & PDF downloaded automatically.`, 'success');
    } catch (err) {
      console.error('Failed to complete match automatically:', err);
      addToast('Failed to auto-complete match: ' + (err.message || 'Error'), 'error');
      isFinishingRef.current = false;
    }
  }, [match, batting1stTeamInitial, bowling1stTeamInitial, totalOversMax, setupData, teamAPlayerList, teamBPlayerList, norm, secondInningsOpeners, targetRuns, CONTROLLER_CACHE_KEY, onMatchUpdated, addToast]);

  // Check Over completion / Innings break / Chase end
  const evaluateInningsTriggers = useCallback((newEvents, innNumber) => {
    const innEvents = newEvents.filter((b) => b.inningsId === innNumber);
    const innStats = calculateInningsStats(innEvents, battingTeam, bowlingTeam, totalOversMax);

    // 1. Check 2nd Innings Target Chase Completion (AUTOMATIC FINISH)
    if (innNumber === 2 && targetRuns && innStats.runs >= targetRuns) {
      const wktsLeft = 10 - innStats.wickets;
      const winnerStr = `${bowling1stTeamInitial} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}!`;
      syncLiveState(newEvents, 2, targetRuns, winnerStr);
      triggerAutoCompleteMatch(winnerStr, newEvents);
      return;
    }

    // 2. Check All Out or Overs Complete (AUTOMATIC INNINGS CHANGE DETECTION OR AUTOMATIC FINISH)
    if (innStats.isAllOut || innStats.isOversComplete) {
      if (innNumber === 1) {
        const calculatedTarget = innStats.runs + 1;
        setTargetRuns(calculatedTarget);
        setTransitionCustomTarget(String(calculatedTarget));
        setTransitionTargetInn(2);
        setTransitionReason(innStats.isAllOut ? 'auto_all_out' : 'auto_overs_complete');

        const defaultInn2Squad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
        const defaultInn2BowlingSquad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

        setSecondInningsOpeners((prev) => ({
          striker: prev.striker || defaultInn2Squad[0]?.name || '',
          nonStriker: prev.nonStriker || defaultInn2Squad[1]?.name || '',
          bowler: prev.bowler || defaultInn2BowlingSquad[defaultInn2BowlingSquad.length - 1]?.name || ''
        }));

        setInningsTransitionModalOpen(true);
        syncLiveState(newEvents, 1, calculatedTarget);
        persistStateSnapshot({ ballEvents: newEvents, currentInnings: 1, targetRuns: calculatedTarget });
        return;
      } else {
        // 2nd innings ended (AUTOMATIC FINISH)
        let winnerStr = '';
        if (innStats.runs >= targetRuns) {
          const wktsLeft = 10 - innStats.wickets;
          winnerStr = `${bowling1stTeamInitial} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}!`;
        } else if (innStats.runs < targetRuns - 1) {
          const margin = (targetRuns - 1) - innStats.runs;
          winnerStr = `${batting1stTeamInitial} won by ${margin} run${margin === 1 ? '' : 's'}!`;
        } else {
          winnerStr = 'Match Tied! (Scores Level)';
        }
        syncLiveState(newEvents, 2, targetRuns, winnerStr);
        triggerAutoCompleteMatch(winnerStr, newEvents);
        return;
      }
    }

    // 3. Check Over End (6 legal balls) -> Prompt for next bowler
    if (innStats.legalBalls > 0 && innStats.legalBalls % 6 === 0) {
      const lastBall = innEvents[innEvents.length - 1];
      if (lastBall && lastBall.legalDelivery) {
        setLastOverBowler(activeBowler);
        setNewBowlerName('');
        setNextBowlerModalOpen(true);
      }
    }
  }, [battingTeam, bowlingTeam, totalOversMax, targetRuns, bowling1stTeamInitial, batting1stTeamInitial, activeBowler, syncLiveState, teamAPlayerList, teamBPlayerList, persistStateSnapshot, triggerAutoCompleteMatch]);

  // RECORD A CLEAN RUN DELIVERY (0, 1, 2, 3, 4, 6)
  const handleScoreRun = (runVal) => {
    if (isPaused) {
      addToast('Match is currently PAUSED. Click Resume to score', 'warning');
      return;
    }

    const currentLegalCount = currentStats.legalBalls;
    const overNum = Math.floor(currentLegalCount / 6);
    const ballNum = (currentLegalCount % 6) + 1;

    const comm = generateCricketCommentary(activeBowler, activeStriker, 'RUN', runVal);

    const newDelivery = createBallEvent({
      matchId: match.id,
      inningsId: currentInnings,
      overNumber: overNum,
      ballNumber: ballNum,
      striker: activeStriker,
      nonStriker: activeNonStriker,
      bowler: activeBowler,
      batsmanRuns: runVal,
      extraRuns: 0,
      extraType: null,
      legalDelivery: true,
      isFreeHit: isFreeHit,
      wicket: false,
      commentary: comm
    });

    const updatedEvents = [...ballEvents, newDelivery];
    setBallEvents(updatedEvents);

    // Reset Free Hit after legal delivery
    if (isFreeHit) setIsFreeHit(false);

    // Odd runs -> swap active strike
    if (runVal % 2 !== 0) {
      const temp = activeStriker;
      setActiveStriker(activeNonStriker);
      setActiveNonStriker(temp);
    }

    syncLiveState(updatedEvents);
    evaluateInningsTriggers(updatedEvents, currentInnings);
  };

  // RECORD EXTRAS (WIDE, NO BALL, BYE, LEG BYE, PENALTY)
  const handleScoreExtra = (extraType, additionalBatsmanRuns = 0) => {
    if (isPaused) {
      addToast('Match is currently PAUSED. Click Resume to score', 'warning');
      return;
    }

    const currentLegalCount = currentStats.legalBalls;
    const overNum = Math.floor(currentLegalCount / 6);
    const isLegal = extraType === 'BYE' || extraType === 'LEG_BYE';
    const ballNum = (currentLegalCount % 6) + (isLegal ? 1 : 0);

    let eRuns = 1;
    let bRuns = 0;
    let awardsFreeHit = false;

    if (extraType === 'WIDE') {
      eRuns = 1 + Number(additionalBatsmanRuns || 0);
      bRuns = 0;
      awardsFreeHit = true;
    } else if (extraType === 'NO_BALL') {
      eRuns = 1;
      bRuns = Number(additionalBatsmanRuns || 0);
      awardsFreeHit = true;
    } else if (extraType === 'BYE' || extraType === 'LEG_BYE') {
      eRuns = Number(additionalBatsmanRuns || 1);
      bRuns = 0;
    } else if (extraType === 'PENALTY') {
      eRuns = 5;
      bRuns = 0;
    }

    const comm = generateCricketCommentary(activeBowler, activeStriker, 'EXTRA', bRuns, extraType);

    const newDelivery = createBallEvent({
      matchId: match.id,
      inningsId: currentInnings,
      overNumber: overNum,
      ballNumber: ballNum,
      striker: activeStriker,
      nonStriker: activeNonStriker,
      bowler: activeBowler,
      batsmanRuns: bRuns,
      extraRuns: eRuns,
      extraType: extraType,
      legalDelivery: isLegal,
      isFreeHit: isFreeHit,
      wicket: false,
      commentary: comm
    });

    const updatedEvents = [...ballEvents, newDelivery];
    setBallEvents(updatedEvents);

    if (awardsFreeHit) {
      setIsFreeHit(true);
    } else if (isLegal && isFreeHit) {
      setIsFreeHit(false);
    }

    // Strike swap if runs taken are odd
    const totalTaken = bRuns + (isLegal ? eRuns : (extraType === 'WIDE' ? eRuns - 1 : 0));
    if (totalTaken % 2 !== 0) {
      const temp = activeStriker;
      setActiveStriker(activeNonStriker);
      setActiveNonStriker(temp);
    }

    setExtraCustomModalOpen(false);
    syncLiveState(updatedEvents);
    evaluateInningsTriggers(updatedEvents, currentInnings);
  };

  // OPEN WICKET SELECTION MODAL
  const handleInitiateWicket = (dismissalType) => {
    if (isPaused) {
      addToast('Match is currently PAUSED', 'warning');
      return;
    }

    // Available unused batsmen from squad
    const usedNames = currentStats.battingStats.map((b) => b.name);
    const available = currentBattingSquad.filter((p) => !usedNames.includes(p.name) && p.name !== activeStriker && p.name !== activeNonStriker);

    setWicketDetails({
      whoOut: 'striker',
      dismissalType: dismissalType || 'Bowled',
      fielder: '',
      incomingBatsman: available[0]?.name || ''
    });
    setWicketModalOpen(true);
  };

  // CONFIRM WICKET
  const handleConfirmWicket = () => {
    const isStrikerOut = wicketDetails.whoOut === 'striker';
    const dismissedPerson = isStrikerOut ? activeStriker : activeNonStriker;

    const currentLegalCount = currentStats.legalBalls;
    const overNum = Math.floor(currentLegalCount / 6);
    const ballNum = (currentLegalCount % 6) + 1;

    const comm = generateCricketCommentary(
      activeBowler,
      dismissedPerson,
      'WICKET',
      0,
      '',
      wicketDetails.dismissalType,
      wicketDetails.fielder
    );

    const newDelivery = createBallEvent({
      matchId: match.id,
      inningsId: currentInnings,
      overNumber: overNum,
      ballNumber: ballNum,
      striker: activeStriker,
      nonStriker: activeNonStriker,
      bowler: activeBowler,
      batsmanRuns: 0,
      extraRuns: 0,
      extraType: null,
      legalDelivery: true,
      isFreeHit: isFreeHit,
      wicket: true,
      dismissalType: wicketDetails.dismissalType,
      dismissedBatsman: dismissedPerson,
      fielder: wicketDetails.fielder,
      incomingBatsman: wicketDetails.incomingBatsman || null,
      commentary: comm
    });

    const updatedEvents = [...ballEvents, newDelivery];
    setBallEvents(updatedEvents);

    if (isFreeHit) setIsFreeHit(false);

    // Update active on-crease batsmen
    if (wicketDetails.incomingBatsman) {
      if (isStrikerOut) {
        setActiveStriker(wicketDetails.incomingBatsman);
      } else {
        setActiveNonStriker(wicketDetails.incomingBatsman);
      }
    }

    setWicketModalOpen(false);
    syncLiveState(updatedEvents);
    evaluateInningsTriggers(updatedEvents, currentInnings);

    addToast(`☝️ WICKET! ${dismissedPerson} out (${wicketDetails.dismissalType})!`, 'error');
  };

  // CONFIRM NEXT BOWLER (Enforces Rule: Bowler cannot bowl 2 consecutive overs)
  const handleConfirmNextBowler = () => {
    const chosen = newBowlerName.trim();
    if (!chosen) {
      addToast('Please select or enter the next bowler name', 'warning');
      return;
    }

    if (lastOverBowler && chosen.toLowerCase() === lastOverBowler.toLowerCase()) {
      addToast(`⛔ ${chosen} bowled the previous over and cannot bowl consecutive overs!`, 'error');
      return;
    }

    setActiveBowler(chosen);
    setNextBowlerModalOpen(false);
    addToast(`🏏 Next Bowler: ${chosen}`, 'info');
  };

  // UNDO LAST DELIVERY (One Ball = Source of Truth)
  const handleUndo = () => {
    if (ballEvents.length === 0) {
      addToast('No deliveries recorded to undo', 'info');
      return;
    }

    const lastBall = ballEvents[ballEvents.length - 1];
    const updatedEvents = ballEvents.slice(0, -1);
    setBallEvents(updatedEvents);

    // Restore on-crease players from last ball
    if (lastBall) {
      setActiveStriker(lastBall.striker);
      setActiveNonStriker(lastBall.nonStriker);
      setActiveBowler(lastBall.bowler);
      if (lastBall.isFreeHit) setIsFreeHit(true);
    }

    syncLiveState(updatedEvents);
    addToast('↩️ Undid last ball delivery. Match state recalculated.', 'info');
  };

  // MANUAL STRIKE SWAP
  const handleSwapStrike = () => {
    const temp = activeStriker;
    setActiveStriker(activeNonStriker);
    setActiveNonStriker(temp);
    addToast(`Swapped Strike: ${activeNonStriker} is now on strike`, 'info');
  };

  // INNINGS SWITCH & TRANSITION HANDLERS (MANUAL & AUTOMATIC)
  const handleOpenManualInningsSwitch = () => {
    const targetInn = currentInnings === 1 ? 2 : 1;
    setTransitionTargetInn(targetInn);
    setTransitionReason('manual');

    const defaultInn2Squad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
    const defaultInn2BowlingSquad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

    if (targetInn === 2) {
      const calc = inn1Stats.runs > 0 ? (inn1Stats.runs + 1) : (targetRuns || 1);
      setTransitionCustomTarget(String(targetRuns || calc));
      setSecondInningsOpeners((prev) => ({
        striker: prev.striker || defaultInn2Squad[0]?.name || '',
        nonStriker: prev.nonStriker || defaultInn2Squad[1]?.name || '',
        bowler: prev.bowler || defaultInn2BowlingSquad[defaultInn2BowlingSquad.length - 1]?.name || ''
      }));
    }

    setInningsTransitionModalOpen(true);
  };

  const handleConfirmInningsTransition = () => {
    if (transitionTargetInn === 2) {
      const defaultInn2Squad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
      const defaultInn2BowlingSquad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

      const chosenStriker = secondInningsOpeners.striker || defaultInn2Squad[0]?.name || '';
      const chosenNonStriker = secondInningsOpeners.nonStriker || defaultInn2Squad[1]?.name || '';
      const chosenBowler = secondInningsOpeners.bowler || defaultInn2BowlingSquad[defaultInn2BowlingSquad.length - 1]?.name || '';

      if (!chosenStriker || !chosenNonStriker || !chosenBowler) {
        addToast('Please select Striker, Non-Striker, and Opening Bowler for 2nd Innings', 'warning');
        return;
      }
      if (chosenStriker === chosenNonStriker) {
        addToast('Striker and Non-Striker cannot be the same player', 'error');
        return;
      }

      const parsedTarget = Math.max(1, Number(transitionCustomTarget) || (inn1Stats.runs + 1));
      setTargetRuns(parsedTarget);
      setCurrentInnings(2);
      setActiveStriker(chosenStriker);
      setActiveNonStriker(chosenNonStriker);
      setActiveBowler(chosenBowler);
      setLastOverBowler('');
      setIsFreeHit(false);

      persistStateSnapshot({
        currentInnings: 2,
        targetRuns: parsedTarget,
        activeStriker: chosenStriker,
        activeNonStriker: chosenNonStriker,
        activeBowler: chosenBowler,
        secondInningsOpeners: { striker: chosenStriker, nonStriker: chosenNonStriker, bowler: chosenBowler }
      });

      syncLiveState(ballEvents, 2, parsedTarget);
      setInningsTransitionModalOpen(false);
      addToast(`🏏 2nd Innings Started! ${bowling1stTeamInitial} needs ${parsedTarget} runs to win.`, 'success');
    } else {
      // Switching back to 1st Innings
      setCurrentInnings(1);
      const defaultInn1Squad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
      const defaultInn1BowlingSquad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

      const restoredStriker = inn1Stats.striker?.name || setupData.openingStriker || defaultInn1Squad[0]?.name;
      const restoredNonStriker = inn1Stats.nonStriker?.name || setupData.openingNonStriker || defaultInn1Squad[1]?.name;
      const restoredBowler = inn1Stats.bowler?.name || setupData.openingBowler || defaultInn1BowlingSquad[defaultInn1BowlingSquad.length - 1]?.name;

      setActiveStriker(restoredStriker);
      setActiveNonStriker(restoredNonStriker);
      setActiveBowler(restoredBowler);

      persistStateSnapshot({
        currentInnings: 1,
        activeStriker: restoredStriker,
        activeNonStriker: restoredNonStriker,
        activeBowler: restoredBowler
      });

      syncLiveState(ballEvents, 1, targetRuns);
      setInningsTransitionModalOpen(false);
      addToast(`Switched back to 1st Innings (${batting1stTeamInitial} Batting)`, 'info');
    }
  };

  // FINISH MATCH MANUALLY FROM HEADER BUTTON
  const handleFinishMatch = async () => {
    const finalResult = matchWinnerResult || (
      currentInnings === 2 && currentStats.runs >= targetRuns
        ? `${bowling1stTeamInitial} won by ${10 - currentStats.wickets} wickets!`
        : `${batting1stTeamInitial} won by ${Math.max(1, (targetRuns || 0) - currentStats.runs)} runs!`
    );

    await triggerAutoCompleteMatch(finalResult, ballEvents);
  };

  // KEYBOARD SHORTCUTS (0-6 runs, W=wide, N=no ball, B=bye, L=leg bye, K=wicket, Ctrl+Z=undo)
  const handleKeyDown = useCallback((e) => {
    if (wicketModalOpen || nextBowlerModalOpen || extraCustomModalOpen || inningsTransitionModalOpen || matchEndedModal || showFullScorecard || substituteModalOpen) {
      return;
    }

    const key = e.key.toLowerCase();
    if (['0', '1', '2', '3', '4', '6'].includes(key)) {
      handleScoreRun(parseInt(key, 10));
    } else if (key === 'w') {
      handleScoreExtra('WIDE', 0);
    } else if (key === 'n') {
      handleScoreExtra('NO_BALL', 0);
    } else if (key === 'b') {
      handleScoreExtra('BYE', 1);
    } else if (key === 'l') {
      handleScoreExtra('LEG_BYE', 1);
    } else if (key === 'k') {
      handleInitiateWicket('Bowled');
    } else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
      handleUndo();
    }
  }, [wicketModalOpen, nextBowlerModalOpen, extraCustomModalOpen, inningsTransitionModalOpen, matchEndedModal, showFullScorecard, substituteModalOpen, handleScoreRun, handleScoreExtra, handleInitiateWicket, handleUndo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Chase Equation Metrics (2nd Innings)
  const remainingRuns = currentInnings === 2 && targetRuns ? Math.max(0, targetRuns - currentStats.runs) : null;
  const remainingBalls = currentInnings === 2 ? Math.max(0, totalOversMax * 6 - currentStats.legalBalls) : null;
  const requiredRunRate = remainingBalls && remainingBalls > 0 ? ((remainingRuns / (remainingBalls / 6))).toFixed(2) : '0.00';

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[999999] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden select-none transition-colors">
      
      {/* 1. TOP STICKY LIVE SCOREBAR */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0 transition-colors">
        
        {/* Left: Tournament & Main Scores */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Radio className="w-3 h-3" /> LIVE CRICKET
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono hidden sm:inline">• {venueName || 'Cricket Ground 1'}</span>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{battingTeam}</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {currentStats.runs} / {currentStats.wickets}
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Overs <span className="font-bold text-slate-900 dark:text-white text-sm">{currentStats.oversFormatted}</span> / {totalOversMax}
            </div>

            {/* Innings indicator pill */}
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold uppercase border border-indigo-500/20">
              Inn {currentInnings}
            </span>
          </div>
        </div>

        {/* Center: Run Rates & Equations */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-slate-100 dark:bg-slate-900 px-4 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>CRR: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentStats.currentRunRate}</span></div>
          {currentInnings === 2 && targetRuns && (
            <>
              <div className="text-slate-400 dark:text-slate-700">|</div>
              <div>Target: <span className="font-bold text-amber-500">{targetRuns}</span></div>
              <div className="text-slate-400 dark:text-slate-700">|</div>
              <div>RRR: <span className="font-bold text-amber-500">{requiredRunRate}</span></div>
              <div className="text-slate-400 dark:text-slate-700">|</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                Need {remainingRuns} runs from {remainingBalls} balls
              </div>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Manual / Auto Innings Switch Button */}
          <button
            onClick={handleOpenManualInningsSwitch}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            title="Change Innings (Switch to 2nd innings or back to 1st innings at any time)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Change Innings ({currentInnings === 1 ? '1st ➔ 2nd' : '2nd ➔ 1st'})</span>
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer ${
              isPaused
                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Match' : 'Pause'}</span>
          </button>

          <button
            onClick={() => setShowFullScorecard(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" /> Full Scorecard
          </button>

          <button
            onClick={() => setSubstituteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-500" /> Sub
          </button>

          <button
            onClick={handleFinishMatch}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" /> Finish
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-500" /> : <Maximize2 className="w-4 h-4" />}
            <span className="text-[11px] font-bold hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={handleSafeClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Back to Console (Match progress will be preserved)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. SECONDARY TICKER: Partnership & Recent Deliveries */}
      <div className="bg-slate-100 dark:bg-[#0D1527] border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 transition-colors">
        
        {/* Partnership */}
        <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
          <div>
            Partnership: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentStats.partnership.runs}</span> runs ({currentStats.partnership.balls} balls)
          </div>
          {currentInnings === 2 && (
            <div className="text-amber-600 dark:text-amber-400 font-bold">
              1st Innings: {inn1Stats.runs}/{inn1Stats.wickets} ({inn1Stats.oversFormatted} ov)
            </div>
          )}
        </div>

        {/* Recent 6 Deliveries Ticker */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Last Deliveries:</span>
          <div className="flex items-center gap-1.5">
            {currentStats.recentBalls.length === 0 ? (
              <span className="text-slate-400 text-xs">Waiting for first delivery...</span>
            ) : (
              currentStats.recentBalls.map((b, idx) => (
                <span
                  key={idx}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border shadow-sm ${
                    b === '4'
                      ? 'bg-blue-600 text-white border-blue-400'
                      : b === '6'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : b === 'W'
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                      : b.startsWith('Wd') || b.startsWith('Nb')
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {b}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN CONSOLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        
        {/* TOP ROW: ACTIVE BATSMEN & ACTIVE BOWLER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Active Batsmen Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  🏏 Current Batsmen
                </span>
                {isFreeHit && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-bounce">
                    ⚡ FREE HIT ACTIVE
                  </span>
                )}
              </div>
              <button
                onClick={handleSwapStrike}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500" /> Swap Strike
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Striker */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {currentStats.striker.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px]">
                    ON STRIKE
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Runs</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-base">{currentStats.striker.runs}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Balls</span>
                    <strong className="text-slate-900 dark:text-white">{currentStats.striker.balls}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">4s / 6s</span>
                    <strong className="text-slate-900 dark:text-white">{currentStats.striker.fours} / {currentStats.striker.sixes}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">SR</span>
                    <strong className="text-slate-900 dark:text-white">{currentStats.striker.strikeRate}</strong>
                  </div>
                </div>
              </div>

              {/* Non-Striker */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                    {currentStats.nonStriker.name}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">Non-Striker</span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Runs</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-base">{currentStats.nonStriker.runs}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Balls</span>
                    <strong className="text-slate-800 dark:text-slate-200">{currentStats.nonStriker.balls}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">4s / 6s</span>
                    <strong className="text-slate-800 dark:text-slate-200">{currentStats.nonStriker.fours} / {currentStats.nonStriker.sixes}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">SR</span>
                    <strong className="text-slate-800 dark:text-slate-200">{currentStats.nonStriker.strikeRate}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Bowler Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                🎯 Current Bowler
              </span>
              <button
                onClick={() => {
                  setNewBowlerName('');
                  setNextBowlerModalOpen(true);
                }}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Change Bowler
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-amber-800 dark:text-amber-300 truncate">
                  🎯 {currentStats.bowler.name}
                </span>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {currentStats.bowler.wickets} - {currentStats.bowler.runs}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-amber-500/20 text-xs font-mono text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Overs</span>
                  <strong className="text-slate-900 dark:text-white">{currentStats.bowler.overs}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Maidens</span>
                  <strong className="text-slate-900 dark:text-white">{currentStats.bowler.maidens || 0}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Wickets</span>
                  <strong className="text-rose-600 dark:text-rose-400 text-base">{currentStats.bowler.wickets}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Econ</span>
                  <strong className="text-amber-600 dark:text-amber-400">{currentStats.bowler.economy}</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BALL BY BALL SCORING CONTROLS */}
        <div className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-2xl">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" /> Ball-by-Ball Live Scoring Console
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Shortcuts: (0-6 Runs, W=Wide, N=No Ball, B=Bye, L=Leg Bye, K=Wicket, Ctrl+Z=Undo)
            </span>
          </div>

          {/* LARGE SCORING RUNS KEYPAD */}
          <div className="grid grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <button
                key={run}
                onClick={() => handleScoreRun(run)}
                className={`py-4 sm:py-5 rounded-2xl font-black text-xl sm:text-2xl transition shadow-lg flex items-center justify-center cursor-pointer active:scale-95 ${
                  run === 4
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                    : run === 6
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 border border-purple-400 scale-105'
                    : run === 0
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-800'
                }`}
              >
                {run === 0 ? '●' : run}
              </button>
            ))}
          </div>

          {/* EXTRAS & DISMISSALS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* EXTRAS (5 Cols) */}
            <div className="md:col-span-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                EXTRAS (WIDE, NO BALL, BYES, PENALTY)
              </span>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => {
                    setExtraModalConfig({ type: 'WIDE', additionalRuns: 0 });
                    setExtraCustomModalOpen(true);
                  }}
                  className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                  title="Wide Ball (Awards Free Hit next ball)"
                >
                  WD
                </button>

                <button
                  onClick={() => {
                    setExtraModalConfig({ type: 'NO_BALL', additionalRuns: 0 });
                    setExtraCustomModalOpen(true);
                  }}
                  className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                  title="No Ball (Awards Free Hit next ball)"
                >
                  NB
                </button>

                <button
                  onClick={() => handleScoreExtra('BYE', 1)}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer"
                  title="Bye (+1 Run)"
                >
                  BYE
                </button>

                <button
                  onClick={() => handleScoreExtra('LEG_BYE', 1)}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer"
                  title="Leg Bye (+1 Run)"
                >
                  L.BYE
                </button>

                <button
                  onClick={() => handleScoreExtra('PENALTY', 5)}
                  className="py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold text-xs transition cursor-pointer"
                  title="Penalty Runs (+5 Runs)"
                >
                  PEN
                </button>
              </div>
            </div>

            {/* ALL 9 DISMISSAL TYPES (7 Cols) */}
            <div className="md:col-span-7 space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                DISMISSALS / WICKETS (ALL 9 MODES)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped'].map((dis) => (
                  <button
                    key={dis}
                    onClick={() => handleInitiateWicket(dis)}
                    className="py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                  >
                    ☝️ {dis}
                  </button>
                ))}
                {['Hit Wicket', 'Retired Hurt', 'Retired Out', 'Obstructing'].map((dis) => (
                  <button
                    key={dis}
                    onClick={() => handleInitiateWicket(dis === 'Obstructing' ? 'Obstructing the Field' : dis)}
                    className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-medium text-[11px] transition cursor-pointer"
                  >
                    {dis}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* QUICK UNDO & DELIVERIES COUNTER */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleUndo}
              disabled={ballEvents.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                ballEvents.length > 0
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Undo Delivery
            </button>

            <span className="text-[11px] text-slate-500 font-mono">
              Total Deliveries Recorded: <strong className="text-slate-900 dark:text-white">{ballEvents.length}</strong> (Legal: {currentStats.legalBalls})
            </span>
          </div>

        </div>

        {/* LIVE COMMENTARY FEED */}
        <div className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xl">
          <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
            🎙️ Ball-by-Ball Live Commentary Timeline
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {currentStats.commentaryLog.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono">Waiting for first delivery to generate commentary...</p>
            ) : (
              currentStats.commentaryLog.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono flex items-start gap-3">
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

      {/* MODAL 1: WICKET POPUP */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              ☝️ Record Wicket Delivery
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Who got out?</label>
                <select
                  value={wicketDetails.whoOut}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, whoOut: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="striker">Striker: {activeStriker}</option>
                  <option value="nonStriker">Non-Striker: {activeNonStriker}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Dismissal Type</label>
                <select
                  value={wicketDetails.dismissalType}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, dismissalType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Bowled">Bowled</option>
                  <option value="Caught">Caught</option>
                  <option value="LBW">LBW</option>
                  <option value="Run Out">Run Out</option>
                  <option value="Stumped">Stumped</option>
                  <option value="Hit Wicket">Hit Wicket</option>
                  <option value="Retired Hurt">Retired Hurt (Not Out)</option>
                  <option value="Retired Out">Retired Out</option>
                  <option value="Obstructing the Field">Obstructing the Field</option>
                </select>
              </div>

              {['Caught', 'Run Out', 'Stumped'].includes(wicketDetails.dismissalType) && (
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">
                    Fielder Name (From {bowlingTeam} Squad)
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
                <label className="block font-bold text-slate-500 uppercase mb-1">
                  New Incoming Batsman (From {battingTeam} Squad)
                </label>
                <select
                  value={wicketDetails.incomingBatsman}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, incomingBatsman: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1.5"
                >
                  <option value="">-- Select Next Batsman from {battingTeam} --</option>
                  {currentBattingSquad.map((p) => {
                    const isAlreadyBatted = currentStats.battingStats.some((b) => b.name === p.name);
                    const isCurrentlyOnCrease = p.name === activeStriker || p.name === activeNonStriker;
                    return (
                      <option key={p.name} value={p.name} disabled={isAlreadyBatted || isCurrentlyOnCrease}>
                        {p.name} {isAlreadyBatted ? '(Already Batted)' : isCurrentlyOnCrease ? '(On Crease)' : ''}
                      </option>
                    );
                  })}
                </select>
                <input
                  type="text"
                  value={wicketDetails.incomingBatsman}
                  onChange={(e) => setWicketDetails({ ...wicketDetails, incomingBatsman: e.target.value })}
                  placeholder="Or type custom batsman name..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setWicketModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer"
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

      {/* MODAL 2: CUSTOM EXTRAS POPUP */}
      {extraCustomModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-amber-600 dark:text-amber-400">
              Record {extraModalConfig.type === 'WIDE' ? 'Wide Delivery' : 'No Ball Delivery'}
            </h3>
            <p className="text-xs text-slate-500">
              {extraModalConfig.type === 'WIDE'
                ? 'Standard wide adds 1 extra run. If batsmen took runs or boundary was hit, specify additional runs.'
                : 'Standard No Ball adds 1 extra run. If batsman scored runs off the bat, specify below.'}
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase">
                {extraModalConfig.type === 'WIDE' ? 'Additional Runs on Wide' : 'Runs Scored off Bat on No Ball'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 4].map((addRun) => (
                  <button
                    key={addRun}
                    onClick={() => handleScoreExtra(extraModalConfig.type, addRun)}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    +{addRun}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setExtraCustomModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: NEXT BOWLER SELECTION (Enforces Bowler Rotation Rule) */}
      {nextBowlerModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
              🏏 Over Completed — Select Next Bowler
            </h3>
            <p className="text-xs text-slate-500">
              Rule: <strong className="text-rose-500">{lastOverBowler || activeBowler}</strong> cannot bowl 2 consecutive overs!
            </p>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-400 uppercase">Bowler Name</label>
              <select
                value={newBowlerName}
                onChange={(e) => setNewBowlerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold"
              >
                <option value="">Select Bowler from {bowlingTeam} Playing XI...</option>
                {currentBowlingSquad.map((p) => {
                  const isPrevBowler = lastOverBowler && p.name.toLowerCase() === lastOverBowler.toLowerCase();
                  return (
                    <option key={p.name} value={p.name} disabled={isPrevBowler}>
                      {p.name} {isPrevBowler ? '(Just Bowled - Cannot bowl consecutive overs)' : ''}
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

      {/* MODAL 4: UNIFIED INNINGS TRANSITION & TARGET SETUP (AUTOMATIC & MANUAL) */}
      {inningsTransitionModalOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <ArrowLeftRight className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {transitionReason === 'auto_all_out'
                      ? '1st Innings Ended (All Out)!'
                      : transitionReason === 'auto_overs_complete'
                      ? '1st Innings Completed (Overs Finished)!'
                      : 'Manual Innings Management & Switch'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Currently Active: Innings {currentInnings} ({battingTeam} Batting)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInningsTransitionModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Innings Selector Tabs (Coordinator can choose 1st or 2nd innings) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTransitionTargetInn(1)}
                className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                  transitionTargetInn === 1
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1st Innings ({batting1stTeamInitial} Bat)
              </button>
              <button
                type="button"
                onClick={() => setTransitionTargetInn(2)}
                className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                  transitionTargetInn === 2
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                2nd Innings ({bowling1stTeamInitial} Bat & Chase)
              </button>
            </div>

            {/* 1st Innings Performance Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">1st Innings Score ({batting1stTeamInitial})</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {inn1Stats.runs} / {inn1Stats.wickets} <span className="text-xs text-slate-500 font-normal">({inn1Stats.oversFormatted} ov)</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Current Run Rate</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                  CRR: {inn1Stats.currentRunRate}
                </p>
              </div>
            </div>

            {/* Target & Openers Configuration for 2nd Innings */}
            {transitionTargetInn === 2 && (
              <div className="space-y-4 pt-1">
                {/* Target Configuration Input */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" /> Target Runs for {bowling1stTeamInitial}
                    </label>
                    <button
                      type="button"
                      onClick={() => setTransitionCustomTarget(String(inn1Stats.runs + 1))}
                      className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Reset to Standard (+1: {inn1Stats.runs + 1})
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={transitionCustomTarget}
                      onChange={(e) => setTransitionCustomTarget(e.target.value)}
                      placeholder={String(inn1Stats.runs + 1)}
                      className="w-32 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-amber-500/40 text-sm font-black font-mono text-slate-900 dark:text-white"
                    />
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      Need <strong>{transitionCustomTarget || (inn1Stats.runs + 1)} runs</strong> to win in {totalOversMax} overs (RRR: {((Number(transitionCustomTarget || inn1Stats.runs + 1)) / totalOversMax).toFixed(2)})
                    </div>
                  </div>
                </div>

                {/* Openers Selection */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                      Select 2nd Innings Starting Lineup
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sq2 = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
                        const bsq2 = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
                        setSecondInningsOpeners({
                          striker: sq2[0]?.name || '',
                          nonStriker: sq2[1]?.name || '',
                          bowler: bsq2[bsq2.length - 1]?.name || ''
                        });
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Auto-fill Squad Openers
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 uppercase mb-1">
                        Striker ({bowling1stTeamInitial})
                      </label>
                      <select
                        value={secondInningsOpeners.striker}
                        onChange={(e) => setSecondInningsOpeners({ ...secondInningsOpeners, striker: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                      >
                        <option value="">Select Striker...</option>
                        {(norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList).map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 uppercase mb-1">
                        Non-Striker ({bowling1stTeamInitial})
                      </label>
                      <select
                        value={secondInningsOpeners.nonStriker}
                        onChange={(e) => setSecondInningsOpeners({ ...secondInningsOpeners, nonStriker: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-bold text-slate-900 dark:text-white"
                      >
                        <option value="">Select Non-Striker...</option>
                        {(norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList).map((p) => (
                          <option key={p.name} value={p.name} disabled={p.name === secondInningsOpeners.striker}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 uppercase mb-1">
                      Opening Bowler ({batting1stTeamInitial})
                    </label>
                    <select
                      value={secondInningsOpeners.bowler}
                      onChange={(e) => setSecondInningsOpeners({ ...secondInningsOpeners, bowler: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-bold text-amber-500"
                    >
                      <option value="">Select Opening Bowler...</option>
                      {(norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList).map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Note for 1st Innings Selection */}
            {transitionTargetInn === 1 && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <strong>Switching to 1st Innings:</strong>
                <p>
                  This will set {batting1stTeamInitial} as the active batting team and allow adding deliveries or correcting scores in the 1st innings.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInningsTransitionModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmInningsTransition}
                className="flex-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {transitionTargetInn === 2 ? 'Start 2nd Innings Chase →' : 'Confirm Switch to 1st Innings'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: MATCH ENDED CONCLUDED MODAL */}
      {matchEndedModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl text-center custom-scrollbar">
            
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                Official Cricket Match Concluded
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">MATCH COMPLETED!</h3>
            </div>

            {/* Winner Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-500/40 space-y-1">
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold uppercase">Official Winner Declaration</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                🏆 {matchWinnerResult}
              </p>
            </div>

            {/* Scores Summary */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{batting1stTeamInitial}</span>
                <strong className="text-slate-900 dark:text-white text-base">
                  {inn1Stats.runs} / {inn1Stats.wickets}
                </strong>
                <span className="block text-[10px] text-slate-500">({inn1Stats.oversFormatted} ov)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{bowling1stTeamInitial}</span>
                <strong className="text-slate-900 dark:text-white text-base">
                  {currentInnings === 2 ? inn2Stats.runs : 0} / {currentInnings === 2 ? inn2Stats.wickets : 0}
                </strong>
                <span className="block text-[10px] text-slate-500">({currentInnings === 2 ? inn2Stats.oversFormatted : '0.0'} ov)</span>
              </div>
            </div>

            {/* MAN OF THE MATCH SECTION */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="text-[11px] font-mono font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Man of the Match
                </span>
                {confirmedMotm && !isEditingMotm && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Official Award Confirmed
                  </span>
                )}
              </div>

              {/* If MOTM is already confirmed and not currently in edit mode: display confirmed MOTM card */}
              {confirmedMotm && !isEditingMotm ? (
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B1120] border border-amber-500/40 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Award Winner:</span>
                        {confirmedMotm.teamName && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {confirmedMotm.teamName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {confirmedMotm.playerName}
                      </h4>
                      {confirmedMotm.performanceSummary && (
                        <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                          ⚡ {confirmedMotm.performanceSummary}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMotmPlayerName(confirmedMotm.playerName);
                        setIsEditingMotm(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Edit MOTM</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* MOTM Candidate Selection & Real-Time Performance View */
                <div className="space-y-3">
                  {/* Top Candidates Quick Chips */}
                  {performanceData.topCandidates && performanceData.topCandidates.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">
                        ⭐ Top Match Candidates (Calculated from match stats):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {performanceData.topCandidates.map((cand) => {
                          const isSel = activeSelectedMotmPlayer?.playerName === cand.playerName;
                          return (
                            <button
                              key={cand.playerName}
                              type="button"
                              onClick={() => setSelectedMotmPlayerName(cand.playerName)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                isSel
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                              }`}
                            >
                              <span>{cand.playerName}</span>
                              <span className={`text-[10px] font-mono px-1 rounded ${isSel ? 'bg-amber-600/30 text-slate-950 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                {cand.teamName ? (cand.teamName.length > 10 ? cand.teamName.substring(0, 8) + '..' : cand.teamName) : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Player Dropdown from either team */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">
                      Select Player from Either Squad:
                    </label>
                    <select
                      value={activeSelectedMotmPlayer?.playerName || ''}
                      onChange={(e) => setSelectedMotmPlayerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <optgroup label={`🏏 ${teamA}`}>
                        {performanceData.players
                          .filter((p) => norm(p.teamName) === norm(teamA))
                          .map((p) => (
                            <option key={p.playerName} value={p.playerName}>
                              {p.playerName} ({teamA}) — {p.performanceSummary}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label={`🏏 ${teamB}`}>
                        {performanceData.players
                          .filter((p) => norm(p.teamName) === norm(teamB))
                          .map((p) => (
                            <option key={p.playerName} value={p.playerName}>
                              {p.playerName} ({teamB}) — {p.performanceSummary}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Selected Player Detailed Live Performance Box */}
                  {activeSelectedMotmPlayer && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B1120] border border-amber-500/30 space-y-2 font-mono">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Match Performance Details</span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-sans">
                            {activeSelectedMotmPlayer.playerName}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {activeSelectedMotmPlayer.teamName}
                        </span>
                      </div>

                      {/* Batting, Bowling, Fielding Metrics Breakdown */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Batting</span>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {activeSelectedMotmPlayer.runs} ({activeSelectedMotmPlayer.balls}b)
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            {activeSelectedMotmPlayer.fours}x4, {activeSelectedMotmPlayer.sixes}x6 • SR {activeSelectedMotmPlayer.strikeRate}
                          </span>
                          <span className="text-[9px] text-slate-400 block italic">
                            {activeSelectedMotmPlayer.isOut ? activeSelectedMotmPlayer.dismissal : 'Not Out *'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Bowling</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 block">
                            {activeSelectedMotmPlayer.wickets} / {activeSelectedMotmPlayer.runsConceded}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            {activeSelectedMotmPlayer.overs} ov • Econ {activeSelectedMotmPlayer.economy}
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            {activeSelectedMotmPlayer.maidens} M, {activeSelectedMotmPlayer.wides} Wd, {activeSelectedMotmPlayer.noBalls} Nb
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Fielding</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            {activeSelectedMotmPlayer.catches} Catch{activeSelectedMotmPlayer.catches === 1 ? '' : 'es'}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            {activeSelectedMotmPlayer.runOuts} RO • {activeSelectedMotmPlayer.stumpings} St
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg">
                        ⚡ {activeSelectedMotmPlayer.performanceSummary}
                      </div>
                    </div>
                  )}

                  {/* Confirm Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmMOTM(activeSelectedMotmPlayer)}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98"
                    >
                      <Award className="w-4 h-4" /> Confirm Man of the Match
                    </button>
                    {confirmedMotm && (
                      <button
                        type="button"
                        onClick={() => setIsEditingMotm(false)}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation Note */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Match status set to COMPLETED & Scorecard PDF downloaded automatically</span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setShowFullScorecard(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> View Official Scorecard
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Close & Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL SCORECARD MODAL */}
      {showFullScorecard && (
        <CricketScorecardModal
          match={{
            ...match,
            score1: inn1Stats.runs,
            wickets1: inn1Stats.wickets,
            overs1: inn1Stats.oversFormatted,
            score2: inn2Stats.runs,
            wickets2: inn2Stats.wickets,
            overs2: inn2Stats.oversFormatted,
            targetRuns,
            resultString: matchWinnerResult || match?.resultString,
            winner: matchWinnerResult || match?.winner,
            ballEvents,
            motm: confirmedMotm || match?.motm || match?.details?.motm,
            manOfTheMatch: confirmedMotm?.playerName || match?.manOfTheMatch || match?.details?.manOfTheMatch,
            details: {
              ...(match?.details || {}),
              ballEvents,
              innings1: inn1Stats,
              innings2: inn2Stats,
              targetRuns,
              resultString: matchWinnerResult,
              winner: matchWinnerResult,
              motm: confirmedMotm || match?.motm || match?.details?.motm,
              manOfTheMatch: confirmedMotm?.playerName || match?.manOfTheMatch || match?.details?.manOfTheMatch,
              playerPerformances: {
                batters: [...inn1Stats.battingStats, ...inn2Stats.battingStats],
                bowlers: [...inn1Stats.bowlingStats, ...inn2Stats.bowlingStats],
                fielders: [...inn1Stats.fieldingStats, ...inn2Stats.fieldingStats]
              }
            }
          }}
          onClose={() => setShowFullScorecard(false)}
        />
      )}

    </div>,
    document.body
  );
};
