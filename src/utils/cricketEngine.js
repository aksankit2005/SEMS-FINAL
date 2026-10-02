/**
 * CRICKET ENGINE - ONE BALL = SOURCE OF TRUTH
 * 
 * Central deterministic calculation engine for the Cricket module in SEMS.
 * Every statistic (scores, overs, wickets, batters, bowlers, fielding, 
 * run rates, partnerships, extras, fall of wickets) is generated 
 * dynamically and consistently from the chronological array of ball delivery events.
 */

/**
 * Creates a normalized Ball Event object.
 */
export const createBallEvent = ({
  id,
  matchId,
  inningsId = 1,
  overNumber = 0,
  ballNumber = 1,
  striker = '',
  nonStriker = '',
  bowler = '',
  batsmanRuns = 0,
  extraRuns = 0,
  extraType = null, // 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY' | null
  legalDelivery = true,
  isLegal,
  isFreeHit = false,
  wicket = false,
  isWicket,
  dismissalType = null, // 'Bowled' | 'Caught' | 'LBW' | 'Run Out' | 'Stumped' | 'Hit Wicket' | 'Retired Hurt' | 'Retired Out' | 'Obstructing the Field'
  dismissedBatsman = null,
  fielder = null,
  incomingBatsman = null,
  commentary = '',
  timestamp = new Date().toISOString()
}) => {
  const resolveName = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return String(val.name || val.player || val.id || '').trim();
    return String(val).trim();
  };

  const bRuns = Number(batsmanRuns) || 0;
  const eRuns = Number(extraRuns) || 0;
  const totalRuns = bRuns + eRuns;

  const resolvedWicket = Boolean(wicket !== undefined && wicket !== null ? wicket : isWicket);
  const resolvedLegal = Boolean(legalDelivery !== undefined && legalDelivery !== null ? legalDelivery : (isLegal !== undefined ? isLegal : true));

  return {
    id: id || `ball_${inningsId}_${overNumber}_${ballNumber}_${Date.now()}`,
    matchId,
    inningsId,
    overNumber,
    ballNumber,
    striker: resolveName(striker),
    nonStriker: resolveName(nonStriker),
    bowler: resolveName(bowler),
    batsmanRuns: bRuns,
    extraRuns: eRuns,
    totalRuns,
    extraType: extraType ? String(extraType).toUpperCase() : null,
    legalDelivery: resolvedLegal,
    isFreeHit: Boolean(isFreeHit),
    wicket: resolvedWicket,
    dismissalType: dismissalType ? String(dismissalType).trim() : null,
    dismissedBatsman: resolveName(dismissedBatsman),
    fielder: resolveName(fielder),
    incomingBatsman: resolveName(incomingBatsman),
    commentary: String(commentary || '').trim(),
    timestamp
  };
};

/**
 * Formats balls count to standard cricket overs string (e.g., 25 balls -> "4.1").
 */
export const formatBallsToOvers = (balls = 0) => {
  const b = Math.max(0, parseInt(balls, 10) || 0);
  const completedOvers = Math.floor(b / 6);
  const remainderBalls = b % 6;
  return `${completedOvers}.${remainderBalls}`;
};

/**
 * Parses an overs string (e.g. "4.2") to total legal balls count (e.g. 26).
 */
export const parseOversToBalls = (oversStr) => {
  if (typeof oversStr === 'number') return Math.round(oversStr * 6);
  if (!oversStr || typeof oversStr !== 'string') return 0;
  const parts = oversStr.split('.');
  const o = parseInt(parts[0], 10) || 0;
  const b = parseInt(parts[1], 10) || 0;
  return o * 6 + b;
};

/**
 * Generates an official, standard cricket dismissal text.
 * Examples:
 * - "b Bumrah"
 * - "c Pant b Bumrah"
 * - "c & b Bumrah"
 * - "run out (Smith)"
 * - "st Pant b Ashwin"
 * - "lbw b Jadeja"
 * - "hit wicket b Shami"
 * - "retired hurt"
 * - "retired out"
 * - "obstructing the field"
 */
export const formatDismissalText = (dismissalType, bowlerName, fielderName) => {
  if (!dismissalType) return 'not out';
  const type = String(dismissalType).trim();
  const bowler = String(bowlerName || '').trim();
  const fielder = String(fielderName || '').trim();

  switch (type.toLowerCase()) {
    case 'bowled':
      return bowler ? `b ${bowler}` : 'bowled';
    case 'caught':
      if (fielder && bowler && fielder.toLowerCase() === bowler.toLowerCase()) {
        return `c & b ${bowler}`;
      }
      if (fielder && bowler) {
        return `c ${fielder} b ${bowler}`;
      }
      return bowler ? `c Fielder b ${bowler}` : 'caught';
    case 'lbw':
      return bowler ? `lbw b ${bowler}` : 'lbw';
    case 'run out':
      return fielder ? `run out (${fielder})` : 'run out';
    case 'stumped':
      return fielder && bowler ? `st ${fielder} b ${bowler}` : (bowler ? `stumped b ${bowler}` : 'stumped');
    case 'hit wicket':
      return bowler ? `hit wicket b ${bowler}` : 'hit wicket';
    case 'retired hurt':
      return 'retired hurt';
    case 'retired out':
      return 'retired out';
    case 'obstructing the field':
      return 'obstructing the field';
    default:
      return type + (bowler ? ` b ${bowler}` : '');
  }
};

/**
 * Computes complete statistics for one innings strictly from its ball events.
 */
export const calculateInningsStats = (
  ballEvents = [],
  battingTeamName = 'Batting Team',
  bowlingTeamName = 'Bowling Team',
  totalOversLimit = 20,
  initialStrikerName = '',
  initialNonStrikerName = '',
  initialBowlerName = '',
  battingSquad = []
) => {
  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;

  const extras = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalty: 0,
    total: 0
  };

  // Batters map: name -> { name, runs, balls, fours, sixes, dismissal, isOut }
  const battersMap = {};

  // Bowlers map: name -> { name, legalBalls, overs, maidens, runs, wickets, wides, noBalls, economy }
  const bowlersMap = {};

  // Fielders map: name -> { name, catches, runOuts, stumpings }
  const fieldersMap = {};

  // Fall of wickets: array of { wicketNumber, score, overs, dismissedPlayer, bowler, dismissal }
  const fallOfWickets = [];

  // Partnerships: track current active partnership since last wicket
  let currentPartnershipRuns = 0;
  let currentPartnershipBalls = 0;

  // Commentary log
  const commentaryLog = [];

  // Recent balls ticker (last 6 deliveries of innings)
  const recentBalls = [];

  // Current over tracking
  let overDeliveries = [];
  let currentOverIndex = 0;

  // Active on-crease state
  let currentStriker = initialStrikerName;
  let currentNonStriker = initialNonStrikerName;
  let currentBowler = initialBowlerName;

  // Initialize openers in battersMap if provided
  if (initialStrikerName) {
    battersMap[initialStrikerName] = {
      player: initialStrikerName,
      name: initialStrikerName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissal: 'not out',
      isOut: false
    };
  }
  if (initialNonStrikerName) {
    battersMap[initialNonStrikerName] = {
      player: initialNonStrikerName,
      name: initialNonStrikerName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissal: 'not out',
      isOut: false
    };
  }

  // Helper to ensure batter exists in map
  const getBatter = (name) => {
    if (!name) return null;
    if (!battersMap[name]) {
      battersMap[name] = {
        player: name,
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dismissal: 'not out',
        isOut: false
      };
    }
    return battersMap[name];
  };

  // Helper to ensure bowler exists in map
  const getBowler = (name) => {
    if (!name) return null;
    if (!bowlersMap[name]) {
      bowlersMap[name] = {
        player: name,
        bowler: name,
        name,
        legalBalls: 0,
        overs: '0.0',
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: '0.00',
        overRunsTracker: {} // overIndex -> runs in that over (for maidens)
      };
    }
    return bowlersMap[name];
  };

  // Helper to ensure fielder exists in map
  const getFielder = (name) => {
    if (!name) return null;
    if (!fieldersMap[name]) {
      fieldersMap[name] = {
        player: name,
        fielder: name,
        name,
        catches: 0,
        runOuts: 0,
        stumpings: 0
      };
    }
    return fieldersMap[name];
  };

  // Process all deliveries chronologically
  ballEvents.forEach((ball, idx) => {
    const isLegal = Boolean(ball.legalDelivery);
    const bRuns = Number(ball.batsmanRuns) || 0;
    const eRuns = Number(ball.extraRuns) || 0;
    const tRuns = bRuns + eRuns;
    const extraType = ball.extraType ? String(ball.extraType).toUpperCase() : null;

    // Track total score
    totalRuns += tRuns;
    currentPartnershipRuns += tRuns;

    if (isLegal) {
      legalBalls += 1;
      currentPartnershipBalls += 1;
    }

    currentStriker = ball.striker || currentStriker;
    currentNonStriker = ball.nonStriker || currentNonStriker;
    currentBowler = ball.bowler || currentBowler;

    const batter = getBatter(currentStriker);
    const bowlerObj = getBowler(currentBowler);

    // Track over index
    const thisOverIndex = Math.floor(Math.max(0, legalBalls - (isLegal ? 1 : 0)) / 6);
    if (!bowlerObj.overRunsTracker[thisOverIndex]) {
      bowlerObj.overRunsTracker[thisOverIndex] = { runs: 0, legalCount: 0 };
    }

    // 1. Batter statistics
    if (batter) {
      batter.runs += bRuns;
      if (bRuns === 4) batter.fours += 1;
      if (bRuns === 6) batter.sixes += 1;

      // Ball faced: wides and penalty runs do not count as a ball faced
      if (extraType !== 'WIDE' && extraType !== 'PENALTY') {
        batter.balls += 1;
      }
    }

    // 2. Extras tracking
    if (extraType === 'WIDE') {
      extras.wides += eRuns;
      extras.total += eRuns;
      bowlerObj.wides += eRuns;
      bowlerObj.runs += eRuns;
      bowlerObj.overRunsTracker[thisOverIndex].runs += eRuns;
    } else if (extraType === 'NO_BALL') {
      extras.noBalls += eRuns;
      extras.total += eRuns;
      bowlerObj.noBalls += eRuns;
      // No ball runs charged to bowler: 1 penalty + runs off the bat
      bowlerObj.runs += (eRuns + bRuns);
      bowlerObj.overRunsTracker[thisOverIndex].runs += (eRuns + bRuns);
    } else if (extraType === 'BYE') {
      extras.byes += eRuns;
      extras.total += eRuns;
      // Byes are NOT charged to bowler in cricket rules!
    } else if (extraType === 'LEG_BYE') {
      extras.legByes += eRuns;
      extras.total += eRuns;
      // Leg Byes are NOT charged to bowler in cricket rules!
    } else if (extraType === 'PENALTY') {
      extras.penalty += eRuns;
      extras.total += eRuns;
    } else {
      // Clean bat delivery
      bowlerObj.runs += bRuns;
      bowlerObj.overRunsTracker[thisOverIndex].runs += bRuns;
    }

    if (isLegal) {
      bowlerObj.legalBalls += 1;
      bowlerObj.overRunsTracker[thisOverIndex].legalCount += 1;
    }

    // 3. Wickets and Dismissal tracking
    if (ball.wicket) {
      const dType = ball.dismissalType || 'Bowled';
      const outPerson = ball.dismissedBatsman || currentStriker;
      const fielderName = ball.fielder || null;

      const outBatter = getBatter(outPerson);
      const isRetHurt = dType.toLowerCase() === 'retired hurt';

      if (!isRetHurt) {
        totalWickets += 1;
      }

      const formattedDismissal = formatDismissalText(dType, currentBowler, fielderName);

      if (outBatter) {
        outBatter.dismissal = formattedDismissal;
        outBatter.isOut = !isRetHurt;
      }

      // Check if bowler is credited with wicket
      const bowlerCreditedTypes = ['bowled', 'caught', 'lbw', 'stumped', 'hit wicket'];
      if (bowlerCreditedTypes.includes(dType.toLowerCase())) {
        bowlerObj.wickets += 1;
      }

      // Check fielding contributions
      if (fielderName) {
        const fielderObj = getFielder(fielderName);
        if (dType.toLowerCase() === 'caught') {
          fielderObj.catches += 1;
        } else if (dType.toLowerCase() === 'run out') {
          fielderObj.runOuts += 1;
        } else if (dType.toLowerCase() === 'stumped') {
          fielderObj.stumpings += 1;
        }
      }

      // Record Fall of Wickets
      if (!isRetHurt) {
        fallOfWickets.push({
          wicketNumber: totalWickets,
          score: totalRuns,
          overs: formatBallsToOvers(legalBalls),
          dismissedPlayer: outPerson,
          bowler: currentBowler,
          dismissal: formattedDismissal
        });

        // Reset current partnership on wicket
        currentPartnershipRuns = 0;
        currentPartnershipBalls = 0;
      }

      // Incoming batsman replaces dismissed batsman
      if (ball.incomingBatsman) {
        getBatter(ball.incomingBatsman);
        if (outPerson === currentStriker) {
          currentStriker = ball.incomingBatsman;
        } else {
          currentNonStriker = ball.incomingBatsman;
        }
      }
    }

    // 4. Strike rotation check
    // If runs off bat or running extras are odd: swap strike
    const runsForStrikeSwap = (bRuns > 0) ? bRuns : (['BYE', 'LEG_BYE'].includes(extraType) ? eRuns : 0);
    if (runsForStrikeSwap % 2 !== 0 && !ball.wicket) {
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
    }

    // End of Over (6 legal balls): swap strike
    if (isLegal && legalBalls > 0 && legalBalls % 6 === 0) {
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
    }

    // Recent delivery badge
    let ballBadge = '0';
    if (ball.wicket) {
      ballBadge = 'W';
    } else if (extraType === 'WIDE') {
      ballBadge = eRuns > 1 ? `Wd+${eRuns - 1}` : 'Wd';
    } else if (extraType === 'NO_BALL') {
      ballBadge = bRuns > 0 ? `Nb+${bRuns}` : 'Nb';
    } else if (extraType === 'BYE') {
      ballBadge = `B${eRuns}`;
    } else if (extraType === 'LEG_BYE') {
      ballBadge = `Lb${eRuns}`;
    } else if (extraType === 'PENALTY') {
      ballBadge = `Pen${eRuns}`;
    } else if (bRuns === 0) {
      ballBadge = '●';
    } else {
      ballBadge = String(bRuns);
    }

    recentBalls.push(ballBadge);

    // Commentary feed entry
    if (ball.commentary) {
      commentaryLog.unshift({
        id: ball.id,
        over: formatBallsToOvers(legalBalls),
        text: ball.commentary,
        runs: tRuns,
        wicket: ball.wicket,
        badge: ballBadge,
        timestamp: ball.timestamp
      });
    }
  });

  // Calculate maidens and economy for each bowler
  Object.values(bowlersMap).forEach((bw) => {
    bw.overs = formatBallsToOvers(bw.legalBalls);
    let maidensCount = 0;
    Object.values(bw.overRunsTracker).forEach((overInfo) => {
      // Over must be full 6 legal balls and 0 runs conceded
      if (overInfo.legalCount >= 6 && overInfo.runs === 0) {
        maidensCount += 1;
      }
    });
    bw.maidens = maidensCount;

    const ovFloat = bw.legalBalls / 6;
    bw.economy = ovFloat > 0 ? (bw.runs / ovFloat).toFixed(2) : '0.00';
  });

  // Calculate strike rates for batters
  Object.values(battersMap).forEach((bt) => {
    bt.strikeRate = bt.balls > 0 ? ((bt.runs / bt.balls) * 100).toFixed(2) : '0.00';
  });

  // Completed overs float for team run rate
  const oversFloat = legalBalls / 6;
  const currentRunRate = oversFloat > 0 ? (totalRuns / oversFloat).toFixed(2) : '0.00';

  // Format array results
  const battingStatsList = Object.values(battersMap);
  const bowlingStatsList = Object.values(bowlersMap);
  const fieldingStatsList = Object.values(fieldersMap);

  return {
    runs: totalRuns,
    wickets: totalWickets,
    legalBalls,
    oversFormatted: formatBallsToOvers(legalBalls),
    currentRunRate,
    extras,
    battingStats: battingStatsList,
    bowlingStats: bowlingStatsList,
    fieldingStats: fieldingStatsList,
    fallOfWickets,
    partnership: {
      runs: currentPartnershipRuns,
      balls: currentPartnershipBalls,
      batter1: currentStriker,
      batter2: currentNonStriker
    },
    striker: battersMap[currentStriker] || { name: currentStriker || 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: '0.00', dismissal: 'not out' },
    nonStriker: battersMap[currentNonStriker] || { name: currentNonStriker || 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: '0.00', dismissal: 'not out' },
    bowler: bowlersMap[currentBowler] || { name: currentBowler || 'Bowler', legalBalls: 0, overs: '0.0', maidens: 0, runs: 0, wickets: 0, economy: '0.00', wides: 0, noBalls: 0 },
    recentBalls: recentBalls.slice(-6),
    commentaryLog,
    isAllOut: totalWickets >= 10,
    isOversComplete: legalBalls >= totalOversLimit * 6
  };
};

/**
 * Computes complete match summary across both innings.
 */
export const calculateCompleteMatchState = (match = {}) => {
  const setupData = match.setupData || {};
  const teamA = setupData.teamA?.name || match.team1 || 'Team A';
  const teamB = setupData.teamB?.name || match.team2 || 'Team B';

  const batting1stTeam = setupData.battingTeamName || teamA;
  const bowling1stTeam = setupData.bowlingTeamName || teamB;

  const totalOversMax = Number(setupData.matchDetails?.totalOvers || match.totalOversMax || 20);

  // Ball events for innings 1 & 2
  const allEvents = Array.isArray(match.ballEvents) ? match.ballEvents : (match.details?.ballEvents || []);
  const events1 = allEvents.filter((e) => e.inningsId === 1);
  const events2 = allEvents.filter((e) => e.inningsId === 2);

  // Innings 1 calculation
  const inn1 = calculateInningsStats(
    events1,
    batting1stTeam,
    bowling1stTeam,
    totalOversMax,
    setupData.openingStriker,
    setupData.openingNonStriker,
    setupData.openingBowler,
    setupData.teamAPlayers
  );

  // Target for 2nd innings
  const targetRuns = inn1.runs + 1;

  // Innings 2 calculation
  const inn2 = calculateInningsStats(
    events2,
    bowling1stTeam,
    batting1stTeam,
    totalOversMax,
    match.secondInningsStriker || bowling1stTeam + ' Opener 1',
    match.secondInningsNonStriker || bowling1stTeam + ' Opener 2',
    match.secondInningsBowler || batting1stTeam + ' Bowler 1',
    setupData.teamBPlayers
  );

  const currentInnings = match.currentInnings || (events2.length > 0 ? 2 : 1);

  // Live chase metrics for 2nd innings
  const remainingRuns = Math.max(0, targetRuns - inn2.runs);
  const totalBallsInMatch = totalOversMax * 6;
  const remainingBalls = Math.max(0, totalBallsInMatch - inn2.legalBalls);
  const requiredRunRate = remainingBalls > 0 ? ((remainingRuns / (remainingBalls / 6))).toFixed(2) : '0.00';

  // Determine Winner / Outcome
  let matchVerdict = '';
  let winner = '';
  let isMatchCompleted = false;

  if (currentInnings === 2) {
    if (inn2.runs >= targetRuns) {
      // 2nd batting team chased successfully
      const wktsLeft = 10 - inn2.wickets;
      winner = bowling1stTeam;
      matchVerdict = `${bowling1stTeam} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}!`;
      isMatchCompleted = true;
    } else if (inn2.isAllOut || inn2.isOversComplete) {
      if (inn2.runs < targetRuns - 1) {
        const marginRuns = (targetRuns - 1) - inn2.runs;
        winner = batting1stTeam;
        matchVerdict = `${batting1stTeam} won by ${marginRuns} run${marginRuns === 1 ? '' : 's'}!`;
        isMatchCompleted = true;
      } else {
        winner = 'Match Tied';
        matchVerdict = 'Match Tied! (Scores Level)';
        isMatchCompleted = true;
      }
    }
  }

  // Combine fielding stats across both innings
  const combinedFielding = {};
  [...inn1.fieldingStats, ...inn2.fieldingStats].forEach((f) => {
    if (!combinedFielding[f.name]) {
      combinedFielding[f.name] = { ...f };
    } else {
      combinedFielding[f.name].catches += f.catches;
      combinedFielding[f.name].runOuts += f.runOuts;
      combinedFielding[f.name].stumpings += f.stumpings;
    }
  });

  return {
    teamA,
    teamB,
    batting1stTeam,
    bowling1stTeam,
    totalOversMax,
    currentInnings,
    targetRuns,
    remainingRuns,
    remainingBalls,
    requiredRunRate,
    innings1: inn1,
    innings2: inn2,
    allFielding: Object.values(combinedFielding),
    winner,
    matchVerdict,
    isMatchCompleted
  };
};

/**
 * Generates dynamic, realistic CricHeroes / ESPNcricinfo style commentary.
 */
export const generateCricketCommentary = (bowlerName, strikerName, type, runVal = 0, extraType = '', dismissalType = '', fielderName = '') => {
  const b = bowlerName || 'Bowler';
  const s = strikerName || 'Batter';

  if (type === 'WICKET') {
    const dType = (dismissalType || 'Bowled').toLowerCase();
    if (dType === 'bowled') {
      return `OUT! Bowled him! ${b} hits the timber! Through the gate with a ripping delivery, stumps rattled! ${s} departs.`;
    }
    if (dType === 'caught') {
      const fStr = fielderName ? `by ${fielderName}` : 'in the deep';
      return `WICKET! Caught ${fStr}! ${s} skies this high into the air, straightforward catch safely judged! Breakthrough for ${b}!`;
    }
    if (dType === 'lbw') {
      return `OUT! Plumb in front! Huge appeal and up goes the finger! That was crashing into middle stump. ${s} is out LBW to ${b}!`;
    }
    if (dType === 'run out') {
      const fStr = fielderName ? `Direct hit by ${fielderName}!` : 'Quick throw to the stumps!';
      return `WICKET! Run out! Chaos in the middle! ${fStr} The batsman was nowhere near the crease. Outstanding fielding!`;
    }
    if (dType === 'stumped') {
      const fStr = fielderName ? `Lightning fast work by ${fielderName}!` : 'Bails whipped off in a flash!';
      return `OUT! Stumped! ${s} stepped out, dragged his back foot out of the crease. ${fStr} Easy stumping off ${b}!`;
    }
    if (dType === 'hit wicket') {
      return `OUT! Hit wicket! What unfortune for ${s}! Trampled onto the stumps while playing the shot off ${b}!`;
    }
    if (dType === 'retired hurt') {
      return `Injured! ${s} has sustained an injury and decides to retire hurt. Leaves the field to applause.`;
    }
    if (dType === 'retired out') {
      return `Tactical Retirement! ${s} retires out to bring in the next batsman.`;
    }
    return `WICKET! ${s} is out (${dismissalType}) off the bowling of ${b}!`;
  }

  if (type === 'EXTRA') {
    if (extraType === 'WIDE') {
      return `WIDE! ${b} sprays this down the leg side, outside the tramline. Umpire signals wide (+1 extra run).`;
    }
    if (extraType === 'NO_BALL') {
      return `NO BALL! Overstepping by ${b}! Front foot well over the popping crease. Free Hit awarded next delivery!`;
    }
    if (extraType === 'BYE') {
      return `BYE! ${b} beats the outside edge, wicketkeeper fumbles and batsmen scramble through for a bye.`;
    }
    if (extraType === 'LEG_BYE') {
      return `LEG BYE! Delivery strikes the pad and deflects into the leg side. Batsmen take a quick run.`;
    }
    if (extraType === 'PENALTY') {
      return `PENALTY RUNS! 5 penalty runs awarded by the umpire!`;
    }
  }

  if (type === 'RUN') {
    switch (runVal) {
      case 0:
        return `${b} to ${s}, no run. Good length delivery on off stump, solidly defended toward mid-off.`;
      case 1:
        return `${b} to ${s}, 1 run. Tucked away softly into the gap at mid-wicket for a sharp single.`;
      case 2:
        return `${b} to ${s}, 2 runs. Driven nicely through the covers, excellent calling and running between the wickets.`;
      case 3:
        return `${b} to ${s}, 3 runs. Flicked off the pads past backward square leg, chased down just inside the boundary ropes.`;
      case 4:
        return `FOUR! ${b} to ${s}, cracked away with supreme authority! Boundary ropes breached in style!`;
      case 6:
        return `SIX! BOOM! ${b} to ${s}, MASSIVE SIX! Clean strike into the stands, sensational power hitting!`;
      default:
        return `${b} to ${s}, ${runVal} runs completed.`;
    }
  }

  return `${b} to ${s}. Delivery completed.`;
};
