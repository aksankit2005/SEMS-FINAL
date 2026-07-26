export const LIVE_MATCHES_DATA = [
  {
    id: "live-cricket-1",
    sport: "Cricket",
    sportId: "cricket",
    status: "LIVE",
    tournament: "Inter-College T20 Cup - Quarter Final 1",
    venue: "Main Stadium Pitch A",
    team1: {
      name: "St. Xavier's Titans",
      code: "SXT",
      score: "164/4",
      overs: "17.2 overs",
      logo: "⚡"
    },
    team2: {
      name: "Loyola Strikers",
      code: "LYS",
      score: "160/8",
      overs: "20.0 overs",
      logo: "🛡️"
    },
    currentInfo: "St. Xavier's Titans need 5 runs in 16 balls to win",
    commentary: [
      { time: "17.2 ov", text: "FOUR! Brilliant cover drive past extra cover fielder by Rahul Verma!" },
      { time: "17.1 ov", text: "Single taken to deep mid-wicket. Good rotaton of strike." },
      { time: "16.6 ov", text: "SIX! Massively hit over long-on for 98 meters!" }
    ],
    stats: {
      runRate: "9.46",
      reqRunRate: "1.88",
      topScorer: "Rahul Verma (68* off 41)"
    }
  },
  {
    id: "live-football-1",
    sport: "Football",
    sportId: "football",
    status: "LIVE",
    tournament: "Championship League - Semi Final 2",
    venue: "Turf Arena Field 1",
    team1: {
      name: "Christ University FC",
      code: "CFC",
      score: "2",
      logo: "🦅"
    },
    team2: {
      name: "IIT Tech Knights",
      code: "ITK",
      score: "1",
      logo: "⚔️"
    },
    currentInfo: "Second Half - 78' Minute",
    commentary: [
      { time: "78'", text: "Yellow Card shown to #7 Arjun (IIT Knights) for a tactical foul." },
      { time: "72'", text: "GOAL! Magnificent curler into top right corner by Samarth (Christ FC)!" },
      { time: "65'", text: "Crucial save by goalkeeper David to deny the equalizer!" }
    ],
    stats: {
      possession: "56% - 44%",
      shotsOnTarget: "7 - 4",
      corners: "6 - 3"
    }
  },
  {
    id: "live-badminton-1",
    sport: "Badminton",
    sportId: "badminton",
    status: "LIVE",
    tournament: "Mens Singles Semi Finals",
    venue: "Indoor Badminton Court 2",
    team1: {
      name: "Aarav Sharma (MIT)",
      code: "MIT",
      score: "21, 19, 14",
      logo: "🏸"
    },
    team2: {
      name: "Rohan Nair (VIT)",
      code: "VIT",
      score: "18, 21, 11",
      logo: "🔥"
    },
    currentInfo: "Set 3 (Decider) - Game Point in progress",
    commentary: [
      { time: "Set 3", text: "Smash winner down the line by Aarav!" },
      { time: "Set 3", text: "Unforced error at the net by Rohan." }
    ],
    stats: {
      longestRally: "42 shots",
      smashMaxSpeed: "310 km/h"
    }
  },
  {
    id: "live-chess-1",
    sport: "Chess",
    sportId: "chess",
    status: "LIVE",
    tournament: "Rapid Championship - Final Round",
    venue: "Central Auditorium",
    team1: {
      name: "IM Devendra Nath (SRM)",
      code: "SRM",
      score: "White - 0.5",
      logo: "👑"
    },
    team2: {
      name: "FM Kabir Singh (BITS)",
      code: "BITS",
      score: "Black - 0.5",
      logo: "♟️"
    },
    currentInfo: "Move 34 - Endgame Queen + Rook versus Queen",
    commentary: [
      { time: "Move 34", text: "Qe4+ check offered by White." },
      { time: "Move 33", text: "Rxd8 rook sacrifice accepted." }
    ],
    stats: {
      timeRemaining: "White 3m 12s | Black 1m 45s",
      evaluation: "+0.8 (Slight White edge)"
    }
  }
];
