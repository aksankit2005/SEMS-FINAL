import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, RotateCcw, Trophy, AlertCircle, RefreshCw, UserCheck, Activity, 
  Maximize2, Minimize2, Play, Pause, ChevronRight, FileText, CheckCircle2, 
  Award, Shield, HelpCircle, Edit3, ArrowLeftRight, Radio, Plus, Zap
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
  formatDismissalText 
} from '../../../utils/cricketEngine';

export const NormalCricketLiveScoreControllerModal = ({ match, venueName, onClose, onMatchUpdated }) => {
  const { addToast } = useToast();

  // Fullscreen state
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

  // Lock background scroll
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

  // Playing XI Squads
  const [teamAPlayerList, setTeamAPlayerList] = useState(
    setupData.teamAPlayers || setupData.teamA?.players || DEFAULT_TEAM_A_PLAYERS
  );
  const [teamBPlayerList, setTeamBPlayerList] = useState(
    setupData.teamBPlayers || setupData.teamB?.players || DEFAULT_TEAM_B_PLAYERS
  );

  const [teamASubsList, setTeamASubsList] = useState(
    setupData.teamASubs || setupData.teamA?.subs || DEFAULT_TEAM_A_SUBS
  );
  const [teamBSubsList, setTeamBSubsList] = useState(
    setupData.teamBSubs || setupData.teamB?.subs || DEFAULT_TEAM_B_SUBS
  );

  // Innings state: 1 or 2
  const [currentInnings, setCurrentInnings] = useState(match?.currentInnings || 1);

  // Active teams based on innings
  const battingTeam = currentInnings === 1 ? batting1stTeamInitial : bowling1stTeamInitial;
  const bowlingTeam = currentInnings === 1 ? bowling1stTeamInitial : batting1stTeamInitial;

  const norm = (str) => String(str || '').trim().toLowerCase();
  const currentBattingSquad = norm(battingTeam) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
  const currentBowlingSquad = norm(bowlingTeam) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

  // SOURCE OF TRUTH: All ball events array
  const [ballEvents, setBallEvents] = useState(() => {
    if (Array.isArray(match?.ballEvents) && match.ballEvents.length > 0) {
      return match.ballEvents;
    }
    if (Array.isArray(match?.details?.ballEvents) && match.details.ballEvents.length > 0) {
      return match.details.ballEvents;
    }
    return [];
  });

  // Active On-Field Batsmen and Bowler tracking
  const [activeStriker, setActiveStriker] = useState(
    match?.striker?.name || setupData.openingStriker || currentBattingSquad[0]?.name || 'Rohit Sharma'
  );
  const [activeNonStriker, setActiveNonStriker] = useState(
    match?.nonStriker?.name || setupData.openingNonStriker || currentBattingSquad[1]?.name || 'Shubman Gill'
  );
  const [activeBowler, setActiveBowler] = useState(
    match?.bowler?.name || setupData.openingBowler || currentBowlingSquad[currentBowlingSquad.length - 3]?.name || currentBowlingSquad[currentBowlingSquad.length - 1]?.name || 'Mitchell Starc'
  );

  // Previous over bowler tracking to enforce rule: Bowler cannot bowl 2 consecutive overs
  const [lastOverBowler, setLastOverBowler] = useState('');

  // Free hit & Pause state
  const [isFreeHit, setIsFreeHit] = useState(Boolean(match?.isFreeHit));
  const [isPaused, setIsPaused] = useState(false);

  // Target for 2nd innings
  const [targetRuns, setTargetRuns] = useState(match?.targetRuns || null);

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

  const [inningsBreakModalOpen, setInningsBreakModalOpen] = useState(false);
  const [matchEndedModal, setMatchEndedModal] = useState(false);
  const [matchWinnerResult, setMatchWinnerResult] = useState(match?.resultString || match?.winner || '');
  const [showFullScorecard, setShowFullScorecard] = useState(false);

  // Second Innings Openers Selection Modal State
  const [secondInningsSetupModal, setSecondInningsSetupModal] = useState(false);
  const [secondInningsOpeners, setSecondInningsOpeners] = useState({
    striker: '',
    nonStriker: '',
    bowler: ''
  });

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

  // Keep targetRuns updated based on 1st innings total
  useEffect(() => {
    if (currentInnings === 2 || inn1Stats.runs > 0) {
      const calculatedTarget = inn1Stats.runs + 1;
      setTargetRuns(calculatedTarget);
    }
  }, [currentInnings, inn1Stats.runs]);

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
  }, [ballEvents, currentInnings, targetRuns, matchWinnerResult, batting1stTeamInitial, bowling1stTeamInitial, totalOversMax, battingTeam, bowlingTeam, isFreeHit, match, onMatchUpdated]);

  // Check Over completion / Innings break / Chase end
  const evaluateInningsTriggers = useCallback((newEvents, innNumber) => {
    const innEvents = newEvents.filter((b) => b.inningsId === innNumber);
    const innStats = calculateInningsStats(innEvents, battingTeam, bowlingTeam, totalOversMax);

    // 1. Check 2nd Innings Target Chase Completion
    if (innNumber === 2 && targetRuns && innStats.runs >= targetRuns) {
      const wktsLeft = 10 - innStats.wickets;
      const winnerStr = `${bowling1stTeamInitial} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}!`;
      setMatchWinnerResult(winnerStr);
      setMatchEndedModal(true);
      syncLiveState(newEvents, 2, targetRuns, winnerStr);
      return;
    }

    // 2. Check All Out or Overs Complete
    if (innStats.isAllOut || innStats.isOversComplete) {
      if (innNumber === 1) {
        const calculatedTarget = innStats.runs + 1;
        setTargetRuns(calculatedTarget);
        setInningsBreakModalOpen(true);
        syncLiveState(newEvents, 1, calculatedTarget);
        return;
      } else {
        // 2nd innings ended
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
        setMatchWinnerResult(winnerStr);
        setMatchEndedModal(true);
        syncLiveState(newEvents, 2, targetRuns, winnerStr);
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
  }, [battingTeam, bowlingTeam, totalOversMax, targetRuns, bowling1stTeamInitial, batting1stTeamInitial, activeBowler, syncLiveState]);

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

  // START 2ND INNINGS
  const handleInitiateSecondInnings = () => {
    setInningsBreakModalOpen(false);

    const defaultInn2Squad = norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;
    const defaultInn2BowlingSquad = norm(batting1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList;

    setSecondInningsOpeners({
      striker: defaultInn2Squad[0]?.name || '',
      nonStriker: defaultInn2Squad[1]?.name || '',
      bowler: defaultInn2BowlingSquad[defaultInn2BowlingSquad.length - 1]?.name || ''
    });

    setSecondInningsSetupModal(true);
  };

  const handleConfirmStartSecondInnings = () => {
    if (!secondInningsOpeners.striker || !secondInningsOpeners.nonStriker || !secondInningsOpeners.bowler) {
      addToast('Please select Striker, Non-Striker, and Opening Bowler for 2nd Innings', 'warning');
      return;
    }
    if (secondInningsOpeners.striker === secondInningsOpeners.nonStriker) {
      addToast('Striker and Non-Striker cannot be the same player', 'error');
      return;
    }

    setCurrentInnings(2);
    setActiveStriker(secondInningsOpeners.striker);
    setActiveNonStriker(secondInningsOpeners.nonStriker);
    setActiveBowler(secondInningsOpeners.bowler);
    setLastOverBowler('');
    setIsFreeHit(false);

    setSecondInningsSetupModal(false);
    syncLiveState(ballEvents, 2, targetRuns);
    addToast(`🏏 2nd Innings Started! ${bowling1stTeamInitial} needs ${targetRuns} runs to win.`, 'success');
  };

  // FINISH MATCH MANUALLY OR FROM MATCH ENDED MODAL
  const handleFinishMatch = async () => {
    const finalResult = matchWinnerResult || (
      currentInnings === 2 && currentStats.runs >= targetRuns
        ? `${bowling1stTeamInitial} won by ${10 - currentStats.wickets} wickets!`
        : `${batting1stTeamInitial} won by ${Math.max(1, (targetRuns || 0) - currentStats.runs)} runs!`
    );

    const s1 = inn1Stats;
    const s2 = currentInnings === 2 ? inn2Stats : { runs: 0, wickets: 0, oversFormatted: '0.0' };

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
      details: {
        ...(match?.details || {}),
        score1: s1.runs,
        score2: s2.runs,
        wickets1: s1.wickets,
        wickets2: s2.wickets,
        overs1: s1.oversFormatted,
        overs2: s2.oversFormatted,
        targetRuns: targetRuns,
        resultString: finalResult,
        winner: finalResult,
        ballEvents: ballEvents,
        innings1: s1,
        innings2: s2,
        playerPerformances: {
          batters: [...s1.battingStats, ...s2.battingStats],
          bowlers: [...s1.bowlingStats, ...s2.bowlingStats],
          fielders: [...s1.fieldingStats, ...s2.fieldingStats]
        },
        commentaryLog: currentStats.commentaryLog
      }
    };

    try {
      await coordinatorApi.completeMatch(match.id, completedObj);
      generateMatchResultPDF(completedObj, 'Cricket');
      if (onMatchUpdated) onMatchUpdated(match.id, completedObj);
      addToast(`🏆 Official Cricket Match Finished! ${finalResult}. Complete record saved & PDF downloaded.`, 'success');
      onClose();
    } catch (err) {
      addToast('Failed to complete match: ' + (err.message || 'Error'), 'error');
    }
  };

  // KEYBOARD SHORTCUTS (0-6 runs, W=wide, N=no ball, B=bye, L=leg bye, K=wicket, Ctrl+Z=undo)
  const handleKeyDown = useCallback((e) => {
    if (wicketModalOpen || nextBowlerModalOpen || extraCustomModalOpen || inningsBreakModalOpen || matchEndedModal || showFullScorecard || secondInningsSetupModal) {
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
  }, [wicketModalOpen, nextBowlerModalOpen, extraCustomModalOpen, inningsBreakModalOpen, matchEndedModal, showFullScorecard, secondInningsSetupModal, handleScoreRun, handleScoreExtra, handleInitiateWicket, handleUndo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Chase Equation Metrics (2nd Innings)
  const remainingRuns = currentInnings === 2 && targetRuns ? Math.max(0, targetRuns - currentStats.runs) : null;
  const remainingBalls = currentInnings === 2 ? Math.max(0, totalOversMax * 6 - currentStats.legalBalls) : null;
  const requiredRunRate = remainingBalls && remainingBalls > 0 ? ((remainingRuns / (remainingBalls / 6))).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden select-none transition-colors">
      
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
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition cursor-pointer"
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

      {/* MODAL 4: INNINGS BREAK */}
      {inningsBreakModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl text-center">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">1st Innings Completed!</h3>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono">{batting1stTeamInitial} Final Score</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {inn1Stats.runs} / {inn1Stats.wickets}
              </p>
              <span className="text-xs text-slate-500 font-mono block">
                Overs: {inn1Stats.oversFormatted} / {totalOversMax} • CRR: {inn1Stats.currentRunRate}
              </span>
              <div className="pt-2 text-sm text-amber-600 dark:text-amber-400 font-bold font-mono">
                Target for {bowling1stTeamInitial}: <strong>{targetRuns} Runs</strong> (RRR: {(targetRuns / totalOversMax).toFixed(2)})
              </div>
            </div>

            <button
              onClick={handleInitiateSecondInnings}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg cursor-pointer"
            >
              Set 2nd Innings Openers & Start Chase →
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: 2ND INNINGS OPENERS SELECTION */}
      {secondInningsSetupModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              🏏 2nd Innings — Select Openers
            </h3>
            <p className="text-xs text-slate-500">
              Batting: <strong>{bowling1stTeamInitial}</strong> (Target: {targetRuns}) • Bowling: <strong>{batting1stTeamInitial}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Striker ({bowling1stTeamInitial})</label>
                <select
                  value={secondInningsOpeners.striker}
                  onChange={(e) => setSecondInningsOpeners({ ...secondInningsOpeners, striker: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-bold"
                >
                  <option value="">Select Striker...</option>
                  {(norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList).map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Non-Striker ({bowling1stTeamInitial})</label>
                <select
                  value={secondInningsOpeners.nonStriker}
                  onChange={(e) => setSecondInningsOpeners({ ...secondInningsOpeners, nonStriker: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-bold"
                >
                  <option value="">Select Non-Striker...</option>
                  {(norm(bowling1stTeamInitial) === norm(teamA) ? teamAPlayerList : teamBPlayerList).map((p) => (
                    <option key={p.name} value={p.name} disabled={p.name === secondInningsOpeners.striker}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Opening Bowler ({batting1stTeamInitial})</label>
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

            <button
              onClick={handleConfirmStartSecondInnings}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
            >
              Start 2nd Innings Live Chase →
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: MATCH ENDED CONCLUDED MODAL */}
      {matchEndedModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl text-center">
            
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                Official Cricket Match Concluded
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">MATCH COMPLETED!</h3>
            </div>

            {/* Winner Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-500/40 space-y-1">
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

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleFinishMatch}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Permanent Record & Export PDF Report
              </button>

              <button
                onClick={() => setShowFullScorecard(true)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Inspect Full Match Scorecard
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
            details: {
              ...(match?.details || {}),
              ballEvents,
              innings1: inn1Stats,
              innings2: inn2Stats,
              targetRuns,
              resultString: matchWinnerResult,
              winner: matchWinnerResult,
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

    </div>
  );
};
