export const SPORTS_CONFIG = {
  'table-tennis': {
    id: 'table-tennis',
    name: 'Table Tennis',
    icon: '🏓',
    venueLabel: 'Table Number',
    venueOptions: ['Table 1 (Main Court)', 'Table 2 (Hall A)', 'Table 3 (Hall A)', 'Table 4 (Practice Arena)'],
    formats: ['Singles', 'Doubles'],
    rounds: ['Round of 32', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: true,
    liveControls: [
      { id: 'point_a', team: 1, label: '+1 Point (Player A)', delta: 1, variant: 'primary' },
      { id: 'point_b', team: 2, label: '+1 Point (Player B)', delta: 1, variant: 'primary' },
    ],
    declarations: ['Timeout (1 Min)', 'Walkover', 'Retired', 'Disqualified'],
  },
  'badminton': {
    id: 'badminton',
    name: 'Badminton',
    icon: '🏸',
    venueLabel: 'Court Number',
    venueOptions: ['Badminton Court 1', 'Badminton Court 2', 'Badminton Court 3', 'Badminton Court 4'],
    formats: ['Singles', 'Doubles', 'Mixed Doubles'],
    rounds: ['Round of 32', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: true,
    liveControls: [
      { id: 'point_a', team: 1, label: '+1 Point (Player A)', delta: 1, variant: 'primary' },
      { id: 'point_b', team: 2, label: '+1 Point (Player B)', delta: 1, variant: 'primary' },
    ],
    declarations: ['Timeout', 'Walkover', 'Retired', 'Disqualified'],
  },
  'football': {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    venueLabel: 'Ground Pitch',
    venueOptions: ['Central Stadium Pitch 1', 'Ground 2 Outdoor Field'],
    formats: ['11-a-side', '7-a-side'],
    rounds: ['Group Stage', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'goal_a', team: 1, label: '⚽ Goal Team A (+1)', delta: 1, variant: 'success' },
      { id: 'goal_b', team: 2, label: '⚽ Goal Team B (+1)', delta: 1, variant: 'success' },
      { id: 'yellow_a', team: 1, label: '🟨 Yellow Card A', type: 'card', variant: 'warning' },
      { id: 'yellow_b', team: 2, label: '🟨 Yellow Card B', type: 'card', variant: 'warning' },
      { id: 'red_a', team: 1, label: '🟥 Red Card A', type: 'card', variant: 'danger' },
      { id: 'red_b', team: 2, label: '🟥 Red Card B', type: 'card', variant: 'danger' },
    ],
    declarations: ['Half Time', 'Extra Time', 'Penalty Shootout', 'Walkover'],
  },
  'cricket': {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    venueLabel: 'Cricket Pitch',
    venueOptions: ['Main University Stadium Oval', 'Ground 2 Cricket Pitch'],
    formats: ['T20 Knockout', '15-Overs Limited'],
    rounds: ['Pool Stage', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'run1', team: 1, label: '+1 Run', delta: 1, variant: 'neutral' },
      { id: 'run2', team: 1, label: '+2 Runs', delta: 2, variant: 'neutral' },
      { id: 'boundary4', team: 1, label: '4️⃣ Boundary (4)', delta: 4, variant: 'primary' },
      { id: 'six6', team: 1, label: '6️⃣ Six (6)', delta: 6, variant: 'success' },
      { id: 'wicket', team: 1, label: '☝️ Wicket Out', type: 'wicket', variant: 'danger' },
    ],
    declarations: ['Innings Break', 'Toss Completed', 'Rain Delay', 'Walkover'],
  },
  'basketball': {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    venueLabel: 'Basketball Court',
    venueOptions: ['Indoor Arena Court 1', 'Outdoor Court 2'],
    formats: ['5v5 Standard', '3v3 Half-Court'],
    rounds: ['Group Stage', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'pt2_a', team: 1, label: '+2 Pts (Team A)', delta: 2, variant: 'primary' },
      { id: 'pt3_a', team: 1, label: '+3 Pts (Team A)', delta: 3, variant: 'success' },
      { id: 'pt2_b', team: 2, label: '+2 Pts (Team B)', delta: 2, variant: 'primary' },
      { id: 'pt3_b', team: 2, label: '+3 Pts (Team B)', delta: 3, variant: 'success' },
    ],
    declarations: ['Quarter End', 'Half Time', 'Shot Clock Violation', 'Timeout'],
  },
  'kabaddi': {
    id: 'kabaddi',
    name: 'Kabaddi',
    icon: '🤼',
    venueLabel: 'Kabaddi Mat Arena',
    venueOptions: ['Indoor Arena Mat 1', 'Mat 2'],
    formats: ['Pro Style (7 Players)', 'Open Category'],
    rounds: ['Quarter Final', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'raid_a', team: 1, label: 'Raid Point A (+1)', delta: 1, variant: 'primary' },
      { id: 'tackle_a', team: 1, label: 'Super Tackle A (+2)', delta: 2, variant: 'success' },
      { id: 'raid_b', team: 2, label: 'Raid Point B (+1)', delta: 1, variant: 'primary' },
      { id: 'tackle_b', team: 2, label: 'Super Tackle B (+2)', delta: 2, variant: 'success' },
    ],
    declarations: ['Raid Timer (30s)', 'Super Raid', 'ALL OUT (+2)', 'Half Time'],
  },
  'chess': {
    id: 'chess',
    name: 'Chess',
    icon: '♟️',
    venueLabel: 'Board Table',
    venueOptions: ['Board 1 (Hall B)', 'Board 2 (Hall B)', 'Board 3 (Hall B)'],
    formats: ['Individual Rapid', 'Blitz 5-min'],
    rounds: ['Round 1', 'Round 2', 'Round 3', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'win_white', team: 1, label: 'White Wins (1-0)', delta: 1, variant: 'primary' },
      { id: 'draw', team: 0, label: 'Draw (½-½)', delta: 0.5, variant: 'warning' },
      { id: 'win_black', team: 2, label: 'Black Wins (0-1)', delta: 1, variant: 'primary' },
    ],
    declarations: ['Clock Flag Fall', 'Checkmate', 'Stalemate', 'Resignation'],
  },
  'athletics': {
    id: 'athletics',
    name: 'Athletics',
    icon: '🏃',
    venueLabel: 'Track & Lane',
    venueOptions: ['Main Track Lane 1-8', 'Long Jump Pit A', 'Shotput Circle B'],
    formats: ['100m Sprint', '400m Relay', 'Long Jump', 'Shotput'],
    rounds: ['Heats', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'start_race', label: '🚀 Start Race Timer', type: 'timer_start', variant: 'success' },
      { id: 'record_time', label: '⏱️ Record Finish Time', type: 'record', variant: 'primary' },
    ],
    declarations: ['False Start', 'Disqualified', 'Photo Finish Review'],
  },
  'volleyball': {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    venueLabel: 'Volleyball Court',
    venueOptions: ['Outdoor Volley Court 1', 'Indoor Arena Court A'],
    formats: ['Standard 6v6'],
    rounds: ['Group Stage', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: true,
    liveControls: [
      { id: 'point_a', team: 1, label: '+1 Point (Team A)', delta: 1, variant: 'primary' },
      { id: 'point_b', team: 2, label: '+1 Point (Team B)', delta: 1, variant: 'primary' },
    ],
    declarations: ['Timeout', 'Serve Rotation', 'Net Touch Foul', 'Walkover'],
  },
  'kho-kho': {
    id: 'kho-kho',
    name: 'Kho-Kho',
    icon: '🏃‍♂️',
    venueLabel: 'Kho-Kho Field',
    venueOptions: ['Ground 2 Kho-Kho Field 1', 'Field 2'],
    formats: ['Standard 9 Players'],
    rounds: ['Pool Stage', 'Quarter Final', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'defender_out_a', team: 1, label: 'Defender Out Team A (+1)', delta: 1, variant: 'primary' },
      { id: 'defender_out_b', team: 2, label: 'Defender Out Team B (+1)', delta: 1, variant: 'primary' },
    ],
    declarations: ['Innings Turn Switch', 'Early Pole Touch', 'Walkover'],
  },
  'tug-of-war': {
    id: 'tug-of-war',
    name: 'Tug of War',
    icon: '🪢',
    venueLabel: 'Rope Arena Ground',
    venueOptions: ['Central Ground Tug Pit 1'],
    formats: ['Weight Category 600kg', 'Open Category'],
    rounds: ['Best of 3 Pulls', 'Semi Final', 'Final'],
    setMode: true,
    liveControls: [
      { id: 'pull_win_a', team: 1, label: 'Pull Win Team A (+1)', delta: 1, variant: 'primary' },
      { id: 'pull_win_b', team: 2, label: 'Pull Win Team B (+1)', delta: 1, variant: 'primary' },
    ],
    declarations: ['Foul Slip', 'Rope Reset', 'Walkover'],
  },
  'gully-cricket': {
    id: 'gully-cricket',
    name: 'Gully Cricket',
    icon: '🏏',
    venueLabel: 'Street Pitch Area',
    venueOptions: ['Street Pitch Ground 1'],
    formats: ['6-Overs Fast Box'],
    rounds: ['Knockout Stage', 'Semi Final', 'Final'],
    setMode: false,
    liveControls: [
      { id: 'run1', team: 1, label: '+1 Run', delta: 1, variant: 'neutral' },
      { id: 'run4', team: 1, label: '4 (Boundary)', delta: 4, variant: 'primary' },
      { id: 'run6', team: 1, label: '6 (Out of Box)', delta: 6, variant: 'success' },
      { id: 'wicket', team: 1, label: 'Out', type: 'wicket', variant: 'danger' },
    ],
    declarations: ['Direct Hit Out', 'One-Hand One-Bounce Out', 'Walkover'],
  }
};

export const getSportConfig = (sportId) => {
  const normalized = (sportId || 'table-tennis').toLowerCase().trim();
  return SPORTS_CONFIG[normalized] || SPORTS_CONFIG['table-tennis'];
};

export const resolveSportConfig = (sportOrMatch) => {
  if (!sportOrMatch) return SPORTS_CONFIG['table-tennis'];
  
  let targetStr = '';
  if (typeof sportOrMatch === 'string') {
    targetStr = sportOrMatch;
  } else if (typeof sportOrMatch === 'object') {
    targetStr = [
      sportOrMatch.sportId,
      sportOrMatch.sportName,
      sportOrMatch.sport,
      sportOrMatch.eventTitle,
      sportOrMatch.matchTitle
    ].filter(Boolean).join(' ');
  }

  const str = targetStr.toLowerCase();
  if (str.includes('badminton')) return SPORTS_CONFIG['badminton'];
  if (str.includes('cricket') && !str.includes('gully')) return SPORTS_CONFIG['cricket'];
  if (str.includes('gully')) return SPORTS_CONFIG['gully-cricket'];
  if (str.includes('football') || str.includes('soccer')) return SPORTS_CONFIG['football'];
  if (str.includes('basketball')) return SPORTS_CONFIG['basketball'];
  if (str.includes('volleyball')) return SPORTS_CONFIG['volleyball'];
  if (str.includes('chess')) return SPORTS_CONFIG['chess'];
  if (str.includes('kabaddi')) return SPORTS_CONFIG['kabaddi'];
  if (str.includes('kho')) return SPORTS_CONFIG['kho-kho'];
  if (str.includes('athletic')) return SPORTS_CONFIG['athletics'];
  if (str.includes('table') || str.includes('tt') || str.includes('ping')) return SPORTS_CONFIG['table-tennis'];

  const normalized = targetStr.toLowerCase().trim();
  return SPORTS_CONFIG[normalized] || SPORTS_CONFIG['table-tennis'];
};

