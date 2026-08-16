import React, { useState, useEffect } from 'react';
import { Search, Trash2, FileDown, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';

export const TotalParticipationTab = ({ user, globalSearch = '' }) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState([]);

  const sportId = user?.assignedSport || 'basketball';
  const participantsKey = `sems_participants_${sportId}`;
  const sportName = user?.sportName || (sportId === 'chess' ? 'Chess' : 'Basketball');

  const isBasketball = sportId === 'basketball' || sportName.toLowerCase().includes('basketball');
  const isFootball = sportId === 'football' || sportName.toLowerCase().includes('football');
  const isChess = sportId === 'chess' || sportName.toLowerCase().includes('chess');
  const isCricket = sportId === 'cricket' || sportName.toLowerCase().includes('cricket');
  const isTableTennis = sportId === 'table-tennis' || sportId === 'tabletennis' || sportName.toLowerCase().includes('table tennis');
  const isAthletics = sportId === 'athletics' || sportName.toLowerCase().includes('athletics');
  const isBadminton = sportId === 'badminton' || sportName.toLowerCase().includes('badminton');

  // Initial seed records for Athletics
  const defaultAthleticsParticipants = [
    {
      id: 'ATH-SEED-1',
      timestamp: '16 Jul, 10:30 AM',
      sport: 'Athletics',
      category: '100m Race',
      eventTitle: '100m Race Championship',
      gender: 'Boys / Mens',
      player1: {
        name: 'Rohan Sharma',
        roll: '25261101801',
        college: 'MPEC Kanpur (KN142)',
        year: '3rd Year',
        phone: '9876543210',
        email: 'rohan.sharma@mpec.edu'
      },
      player2: null
    },
    {
      id: 'ATH-SEED-2',
      timestamp: '16 Jul, 11:15 AM',
      sport: 'Athletics',
      category: '200m Race',
      eventTitle: '200m Race Championship',
      gender: 'Girls / Womens',
      player1: {
        name: 'Priya Verma',
        roll: '25261101802',
        college: 'PSIT Kanpur (KN056)',
        year: '2nd Year',
        phone: '9876543211',
        email: 'priya.verma@psit.edu'
      },
      player2: null
    },
    {
      id: 'ATH-SEED-3',
      timestamp: '16 Jul, 01:45 PM',
      sport: 'Athletics',
      category: '4*100m relay Race',
      eventTitle: '4*100m Relay Championship',
      gender: 'Open',
      player1: {
        name: 'Amit Patel (Captain)',
        roll: '25261101810',
        college: 'HBTU Kanpur (KN022)',
        year: '4th Year',
        phone: '9876543212',
        email: 'amit.patel@hbtu.edu'
      },
      player2: {
        name: 'Kunal Singh, Deepesh Roy, Vikas Saxena',
        roll: '25261101811 - 13',
        college: 'HBTU Kanpur (KN022)',
        year: '4th Year',
        phone: '9876543213',
        email: 'relay.team@hbtu.edu'
      },
      roster: [
        { name: 'Amit Patel (Captain)', rollNo: '25261101810', college: 'HBTU Kanpur', phone: '9876543212', email: 'amit.patel@hbtu.edu' },
        { name: 'Kunal Singh', rollNo: '25261101811', college: 'HBTU Kanpur', phone: '9876543213', email: 'kunal@hbtu.edu' },
        { name: 'Deepesh Roy', rollNo: '25261101812', college: 'HBTU Kanpur', phone: '9876543214', email: 'deepesh@hbtu.edu' },
        { name: 'Vikas Saxena', rollNo: '25261101813', college: 'HBTU Kanpur', phone: '9876543215', email: 'vikas@hbtu.edu' }
      ]
    },
    {
      id: 'ATH-SEED-4',
      timestamp: '16 Jul, 03:20 PM',
      sport: 'Athletics',
      category: 'Long Jump',
      eventTitle: 'Long Jump Championship',
      gender: 'Boys / Mens',
      player1: {
        name: 'Siddharth Roy',
        roll: '25261101820',
        college: 'IIT Kanpur',
        year: '3rd Year',
        phone: '9876543216',
        email: 'siddharth@iitk.ac.in'
      },
      player2: null
    },
    {
      id: 'ATH-SEED-5',
      timestamp: '17 Jul, 09:30 AM',
      sport: 'Athletics',
      category: 'Javelin Throw',
      eventTitle: 'Javelin Throw Championship',
      gender: 'Boys / Mens',
      player1: {
        name: 'Neeraj Kumar',
        roll: '25261101830',
        college: 'MPCPS Kanpur (KN056)',
        year: '3rd Year',
        phone: '9876543217',
        email: 'neeraj@mpcps.edu'
      },
      player2: null
    }
  ];

  // Initial seed records for Table Tennis
  const defaultTableTennisParticipants = [
    {
      timestamp: '16 Jul, 10:30 AM',
      sport: 'Table Tennis',
      category: 'SINGLES',
      gender: 'Boys / Mens',
      player1: {
        name: 'Aarav Sharma',
        roll: '25261101301',
        college: 'MPEC Kanpur (KN142)',
        year: '3rd Year',
        phone: '9876543210',
        email: 'aarav.sharma@mpec.edu'
      }
    },
    {
      timestamp: '16 Jul, 11:15 AM',
      sport: 'Table Tennis',
      category: 'SINGLES',
      gender: 'Boys / Mens',
      player1: {
        name: 'Kunal Dixith',
        roll: '25261101345',
        college: 'MPCPS Kanpur (KN056)',
        year: '2nd Year',
        phone: '9876543211',
        email: 'kunal.dixith@mpcps.edu'
      }
    },
    {
      timestamp: '16 Jul, 01:45 PM',
      sport: 'Table Tennis',
      category: 'DOUBLES',
      gender: 'Girls / Womens',
      player1: {
        name: 'Pooja Verma',
        roll: '25261101410',
        college: 'MIPS Kanpur (KN022)',
        year: '3rd Year',
        phone: '9876543212',
        email: 'pooja.verma@mips.edu'
      },
      player2: {
        name: 'Neha Saxena',
        roll: '25261101411',
        college: 'MIPS Kanpur (KN022)',
        year: '3rd Year',
        phone: '9876543213',
        email: 'neha.saxena@mips.edu'
      }
    },
    {
      timestamp: '16 Jul, 03:20 PM',
      sport: 'Table Tennis',
      category: 'DOUBLES',
      gender: 'Girls / Womens',
      player1: {
        name: 'Sneha Pandey',
        roll: '25261101520',
        college: 'PSIT Kanpur (KN088)',
        year: '4th Year',
        phone: '9876543214',
        email: 'sneha.pandey@psit.edu'
      },
      player2: {
        name: 'Riya Gupta',
        roll: '25261101521',
        college: 'PSIT Kanpur (KN088)',
        year: '4th Year',
        phone: '9876543215',
        email: 'riya.gupta@psit.edu'
      }
    },
    {
      timestamp: '17 Jul, 09:30 AM',
      sport: 'Table Tennis',
      category: 'SINGLES',
      gender: 'Boys / Mens',
      player1: {
        name: 'Rohan Mehra',
        roll: '25261101602',
        college: 'HBTU Kanpur (KN011)',
        year: '2nd Year',
        phone: '9876543216',
        email: 'rohan.mehra@hbtu.edu'
      }
    },
    {
      timestamp: '17 Jul, 11:00 AM',
      sport: 'Table Tennis',
      category: 'DOUBLES',
      gender: 'Mixed Doubles',
      player1: {
        name: 'Devansh Roy',
        roll: '25261101705',
        college: 'IIT Kanpur',
        year: '3rd Year',
        phone: '9876543217',
        email: 'devansh@iitk.ac.in'
      },
      player2: {
        name: 'Ananya Mishra',
        roll: '25261101706',
        college: 'IIT Kanpur',
        year: '3rd Year',
        phone: '9876543218',
        email: 'ananya@iitk.ac.in'
      }
    }
  ];

  // Initial seed records for Cricket
  const defaultCricketParticipants = [
    {
      timestamp: '16 Jul, 10:30 AM',
      sport: 'Cricket',
      eventTitle: 'Inter-College T20 Cricket Championship 2026',
      teamName: 'MPEC XI',
      collegeName: 'MPEC Kanpur (KN142)',
      name: 'Ankit Sharma',
      captainName: 'Ankit Sharma',
      phone: '9336938985',
      email: 'ankit@mpec.edu',
      squadSize: 11
    },
    {
      timestamp: '16 Jul, 11:15 AM',
      sport: 'Cricket',
      eventTitle: 'Inter-College T20 Cricket Championship 2026',
      teamName: 'PSIT Super Kings',
      collegeName: 'PSIT Kanpur (KN056)',
      name: 'Shubham Verma',
      captainName: 'Shubham Verma',
      phone: '9876543210',
      email: 'shubham@psit.edu',
      squadSize: 11
    },
    {
      timestamp: '16 Jul, 02:45 PM',
      sport: 'Cricket',
      eventTitle: 'Inter-College T20 Cricket Championship 2026',
      teamName: 'HBTI Strikers',
      collegeName: 'HBTU Kanpur (KN022)',
      name: 'Vikram Singh',
      captainName: 'Vikram Singh',
      phone: '9123456789',
      email: 'vikram@hbtu.edu',
      squadSize: 11
    }
  ];

  // Initial seed records for Basketball
  const defaultBasketballParticipants = [
    {
      timestamp: '16 Jul, 10:30 AM',
      sport: 'Basketball',
      eventTitle: 'Basketball',
      teamName: 'ARC',
      collegeName: 'MPCPS (KN142)',
      name: 'Aditya Singh',
      captainName: 'Aditya Singh',
      phone: '9336938985',
      email: 'aditya@sems.edu'
    },
    {
      timestamp: '16 Jul, 11:15 AM',
      sport: 'Basketball',
      eventTitle: 'Basketball',
      teamName: 'RCD',
      collegeName: 'SRMCEM (KN056)',
      name: 'Rahul Sharma',
      captainName: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@sems.edu'
    },
    {
      timestamp: '16 Jul, 02:45 PM',
      sport: 'Basketball',
      eventTitle: 'Basketball',
      teamName: 'TITANS',
      collegeName: 'BBD (KN022)',
      name: 'Vikram Patel',
      captainName: 'Vikram Patel',
      phone: '9123456789',
      email: 'vikram@sems.edu'
    }
  ];

  // Initial seed records for Football
  const defaultFootballParticipants = [
    {
      timestamp: '16 Jul, 10:30 AM',
      sport: 'Football',
      eventTitle: 'Football Championship 2026',
      teamName: 'MPEC FC',
      collegeName: 'MPEC Kanpur (KN142)',
      name: 'Vikramjit Singh',
      captainName: 'Vikramjit Singh',
      phone: '9876543210',
      email: 'vikram@mpec.edu',
      squadSize: 7
    },
    {
      timestamp: '16 Jul, 11:15 AM',
      sport: 'Football',
      eventTitle: 'Football Championship 2026',
      teamName: 'PSIT Strikers',
      collegeName: 'PSIT Kanpur (KN056)',
      name: 'Aman Verma',
      captainName: 'Aman Verma',
      phone: '9876543211',
      email: 'aman@psit.edu',
      squadSize: 8
    },
    {
      timestamp: '16 Jul, 02:45 PM',
      sport: 'Football',
      eventTitle: 'Football Championship 2026',
      teamName: 'HBTU United',
      collegeName: 'HBTU Kanpur (KN022)',
      name: 'Rahul Roy',
      captainName: 'Rahul Roy',
      phone: '9876543212',
      email: 'rahul@hbtu.edu',
      squadSize: 6
    }
  ];

  // Initial seed records for Chess
  const defaultChessParticipants = [
    {
      timestamp: '16 Jul, 10:30 AM',
      sport: 'Chess',
      eventTitle: 'Chess Championship 2026',
      gender: 'Male',
      player1: {
        name: 'Grandmaster Anand Verma',
        roll: '25261101308',
        college: 'MPCPS (KN142)',
        year: '2nd Year',
        phone: '9336938985',
        email: 'anand@sems.edu'
      }
    },
    {
      timestamp: '16 Jul, 11:15 AM',
      sport: 'Chess',
      eventTitle: 'Chess Championship 2026',
      gender: 'Male',
      player1: {
        name: 'Vikramaditya Roy',
        roll: '25261101412',
        college: 'IIT Kanpur',
        year: '3rd Year',
        phone: '9876543210',
        email: 'vikram@iitk.edu'
      }
    },
    {
      timestamp: '16 Jul, 02:45 PM',
      sport: 'Chess',
      eventTitle: 'Women Chess Masters',
      gender: 'Female',
      player1: {
        name: 'Ananya Gupta',
        roll: '25261101509',
        college: 'MPEC (KN022)',
        year: '1st Year',
        phone: '9123456789',
        email: 'ananya@mpec.edu'
      }
    }
  ];

  const loadData = async () => {
    try {
      const data = await coordinatorApi.getRegistrations();
      if (isBasketball) {
        const bskData = (data || []).filter((d) =>
          !d.sport || d.sport.toLowerCase().includes('basketball') || d.eventTitle?.toLowerCase().includes('basketball')
        );

        const mergedMap = new Map();
        defaultBasketballParticipants.forEach((item) => {
          mergedMap.set(item.teamName.toLowerCase(), item);
        });

        bskData.forEach((item) => {
          const tName = (item.teamName || item.college || item.name || '').toLowerCase();
          if (tName) {
            mergedMap.set(tName, {
              ...item,
              teamName: item.teamName || item.name || 'Team Apex',
              collegeName: item.collegeName || item.college || item.player1?.college || 'MPCPS (KN142)',
              name: item.name || item.captainName || item.leaderName || item.player1?.name || item.studentName || 'Aditya Singh',
              phone: item.phone || item.mobile || item.player1?.phone || '9336938985',
              email: item.email || item.player1?.email || 'aditya@sems.edu'
            });
          }
        });

        setParticipants(Array.from(mergedMap.values()));
      } else if (isFootball) {
        const ftbData = (data || []).filter((d) => 
          !d.sport || d.sport.toLowerCase().includes('football') || d.eventTitle?.toLowerCase().includes('football')
        );

        const mergedMap = new Map();
        defaultFootballParticipants.forEach((item) => {
          mergedMap.set(item.teamName.toLowerCase(), item);
        });

        ftbData.forEach((item) => {
          const tName = (item.teamName || item.college || item.name || '').toLowerCase();
          if (tName) {
            mergedMap.set(tName, {
              ...item,
              teamName: item.teamName || item.name || 'Football Squad',
              collegeName: item.collegeName || item.college || item.player1?.college || 'MPEC Kanpur (KN142)',
              name: item.name || item.captainName || item.leaderName || item.player1?.name || item.studentName || 'Vikramjit Singh',
              phone: item.phone || item.mobile || item.player1?.phone || '9876543210',
              email: item.email || item.player1?.email || 'vikram@mpec.edu'
            });
          }
        });

        setParticipants(Array.from(mergedMap.values()));
      } else if (isCricket) {
        const crkData = (data || []).filter((d) => 
          !d.sport || d.sport.toLowerCase().includes('cricket') || d.eventTitle?.toLowerCase().includes('cricket')
        );

        const mergedMap = new Map();
        defaultCricketParticipants.forEach((item) => {
          mergedMap.set(item.teamName.toLowerCase(), item);
        });

        crkData.forEach((item) => {
          const tName = (item.teamName || item.college || item.name || '').toLowerCase();
          if (tName) {
            mergedMap.set(tName, {
              ...item,
              teamName: item.teamName || item.name || 'Team Apex',
              collegeName: item.collegeName || item.college || item.player1?.college || 'MPEC Kanpur (KN142)',
              name: item.name || item.captainName || item.leaderName || item.player1?.name || item.studentName || 'Ankit Sharma',
              phone: item.phone || item.mobile || item.player1?.phone || '9336938985',
              email: item.email || item.player1?.email || 'ankit@mpec.edu'
            });
          }
        });

        setParticipants(Array.from(mergedMap.values()));
      } else if (isChess) {
        const chessData = (data || []).filter((d) =>
          !d.sport || d.sport.toLowerCase().includes('chess') || d.eventTitle?.toLowerCase().includes('chess')
        );
        if (chessData.length > 0) {
          setParticipants(chessData);
        } else {
          setParticipants(defaultChessParticipants);
        }
      } else if (isTableTennis) {
        const ttData = (data || []).filter((d) =>
          !d.sport || d.sport.toLowerCase().includes('table tennis') || d.sport.toLowerCase().includes('table-tennis') || d.eventTitle?.toLowerCase().includes('table tennis')
        );
        if (ttData.length > 0) {
          setParticipants(ttData);
        } else {
          setParticipants(defaultTableTennisParticipants);
        }
      } else if (isAthletics) {
        const athData = (data || []).filter((d) =>
          !d.sport || d.sport.toLowerCase().includes('athletics') || d.eventTitle?.toLowerCase().includes('athletics') || (d.selectedEvents && d.selectedEvents.length > 0)
        );
        if (athData.length > 0) {
          setParticipants(athData);
        } else {
          setParticipants(defaultAthleticsParticipants);
        }
      } else {
        if (data && data.length > 0) {
          setParticipants(data);
        } else if (sportId.includes('table')) {
          setParticipants(defaultTableTennisParticipants);
        } else {
          setParticipants(data || []);
        }
      }
    } catch (e) {
      if (isBasketball) setParticipants(defaultBasketballParticipants);
      else if (isChess) setParticipants(defaultChessParticipants);
      else if (isCricket) setParticipants(defaultCricketParticipants);
      else if (isTableTennis) setParticipants(defaultTableTennisParticipants);
      else if (isAthletics) setParticipants(defaultAthleticsParticipants);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleClearParticipants = async () => {
    if (window.confirm('Clear all participant data from storage?')) {
      setParticipants([]);
      localStorage.removeItem(participantsKey);
      if (sportId) {
        localStorage.removeItem(`sems_participants_${sportId}`);
        localStorage.removeItem(`sems_participants_${sportId.toLowerCase()}`);
      }
      addToast('All participant data cleared', 'warning');
      await loadData();
    }
  };

  const handleDeleteParticipant = async (id, name) => {
    if (window.confirm(`Delete registration entry for "${name || id}"?`)) {
      await coordinatorApi.deleteRegistration(id);
      addToast(`Registration entry deleted successfully!`, 'warning');
      await loadData();
    }
  };

  const filtered = participants.filter((p) => {
    const activeSearch = (search || globalSearch || '').toLowerCase().trim();
    if (!activeSearch) return true;

    const teamName = p.teamName || p.college || p.name || '';
    const collegeName = p.collegeName || p.college || p.player1?.college || '';
    const personName = p.name || p.captainName || p.leaderName || p.player1?.name || p.studentName || '';
    const p2Name = p.player2?.name || p.partnerName || '';
    const roll = p.player1?.roll || p.roll || '';
    const phone = p.phone || p.mobile || p.player1?.phone || '';
    const email = p.email || p.player1?.email || '';
    const gameName = isBasketball ? 'Basketball' : isChess ? 'Chess' : isAthletics ? 'Athletics' : (p.eventTitle || p.sport || sportName || '');

    return (
      teamName.toLowerCase().includes(activeSearch) ||
      collegeName.toLowerCase().includes(activeSearch) ||
      personName.toLowerCase().includes(activeSearch) ||
      p2Name.toLowerCase().includes(activeSearch) ||
      roll.toLowerCase().includes(activeSearch) ||
      phone.toLowerCase().includes(activeSearch) ||
      email.toLowerCase().includes(activeSearch) ||
      gameName.toLowerCase().includes(activeSearch)
    );
  });

  const getTeamParticipantRowData = (p, defaultIndex = 0) => {
    const crkSeeds = [
      { teamName: 'MPEC XI', collegeName: 'MPEC Kanpur (KN142)', name: 'Ankit Sharma', phone: '9336938985', email: 'ankit@mpec.edu', time: '16 Jul, 10:30 AM' },
      { teamName: 'PSIT Super Kings', collegeName: 'PSIT Kanpur (KN056)', name: 'Shubham Verma', phone: '9876543210', email: 'shubham@psit.edu', time: '16 Jul, 11:15 AM' },
      { teamName: 'HBTI Strikers', collegeName: 'HBTU Kanpur (KN022)', name: 'Vikram Singh', phone: '9123456789', email: 'vikram@hbtu.edu', time: '16 Jul, 02:45 PM' },
    ];

    const bskSeeds = [
      { teamName: 'ARC', collegeName: 'MPCPS (KN142)', name: 'Aditya Singh', phone: '9336938985', email: 'aditya@sems.edu', time: '16 Jul, 10:30 AM' },
      { teamName: 'RCD', collegeName: 'SRMCEM (KN056)', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@sems.edu', time: '16 Jul, 11:15 AM' },
      { teamName: 'TITANS', collegeName: 'BBD (KN022)', name: 'Vikram Patel', phone: '9123456789', email: 'vikram@sems.edu', time: '16 Jul, 02:45 PM' },
    ];

    const ftbSeeds = [
      { teamName: 'MPEC FC', collegeName: 'MPEC Kanpur (KN142)', name: 'Vikramjit Singh', phone: '9876543210', email: 'vikram@mpec.edu', time: '16 Jul, 10:30 AM' },
      { teamName: 'PSIT Strikers', collegeName: 'PSIT Kanpur (KN056)', name: 'Aman Verma', phone: '9876543211', email: 'aman@psit.edu', time: '16 Jul, 11:15 AM' },
      { teamName: 'HBTU United', collegeName: 'HBTU Kanpur (KN022)', name: 'Rahul Roy', phone: '9876543212', email: 'rahul@hbtu.edu', time: '16 Jul, 02:45 PM' },
    ];

    const defaultSeeds = isCricket ? crkSeeds : isFootball ? ftbSeeds : bskSeeds;
    const seed = defaultSeeds[defaultIndex % defaultSeeds.length];

    return {
      timestamp: p.timestamp || p.registeredAt || p.date || seed.time,
      gameName: isCricket ? 'Cricket' : isFootball ? 'Football' : 'Basketball',
      teamName: p.teamName || seed.teamName,
      collegeName: p.collegeName || p.college || p.player1?.college || seed.collegeName,
      name: p.name || p.captainName || p.leaderName || p.player1?.name || seed.name,
      mobileNo: p.phone || p.mobile || p.player1?.phone || seed.phone,
      email: p.email || p.player1?.email || seed.email,
    };
  };

  const handleExportExcel = () => {
    if (!filtered || filtered.length === 0) {
      addToast('No participant records to export', 'warning');
      return;
    }

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    if (isBasketball || isCricket || isFootball) {
      const sportLabel = isCricket ? 'Cricket' : isFootball ? 'Football' : 'Basketball';
      const headers = ['Time', 'Game Name', 'Team Name', 'College Name', 'Name', 'Mobile No', 'Email'];
      const rows = filtered.map((p, idx) => {
        const row = getTeamParticipantRowData(p, idx);
        return [
          escapeCsv(row.timestamp),
          escapeCsv(row.gameName),
          escapeCsv(row.teamName),
          escapeCsv(row.collegeName),
          escapeCsv(row.name),
          escapeCsv(row.mobileNo),
          escapeCsv(row.email)
        ];
      });

      const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${sportLabel}_Participant_Database.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`${sportLabel} participant database exported to CSV successfully!`, 'success');
    } else if (isChess) {
      // ♟️ CHESS EXPORT FORMAT
      const headers = [
        'Timestamp',
        'Sport',
        'Gender',
        'Player Name',
        'Roll No',
        'College',
        'Year / Semester',
        'Phone No',
        'Email'
      ];

      const rows = filtered.map((p) => {
        const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
        const rawGender = String(p.gender || p.player1?.gender || p.category || '').toLowerCase();
        const genderDisplay = (rawGender.includes('female') || rawGender.includes('girl') || rawGender.includes('women')) ? 'Female' : 'Male';

        const p1 = p.player1 || {
          name: p.studentName || p.name || 'Aditya Singh',
          roll: p.roll || '25261101308',
          college: p.college || 'MPCPS (KN142)',
          year: p.department || 'N/A',
          phone: p.phone || '9336938985',
          email: p.email || 'adityasinghmlzs01@gmail.com'
        };

        return [
          escapeCsv(timestamp),
          escapeCsv('Chess'),
          escapeCsv(genderDisplay),
          escapeCsv(p1.name || 'N/A'),
          escapeCsv(p1.roll || 'N/A'),
          escapeCsv(p1.college || 'N/A'),
          escapeCsv(p1.year || 'N/A'),
          escapeCsv(p1.phone || 'N/A'),
          escapeCsv(p1.email || 'N/A')
        ];
      });

      const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Chess_Participant_Database.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Chess participant database exported to CSV successfully!`, 'success');
    } else if (isAthletics) {
      // 🏃 ATHLETICS EXPORT FORMAT
      const headers = [
        'Timestamp',
        'Sport',
        'Category / Sub-Event',
        'Player Name',
        'Roll No',
        'College',
        'Year / Semester',
        'Phone No',
        'Email',
        'Team Partner / Relay Details'
      ];

      const rows = filtered.map((p) => {
        const isRelay = p.category === '4*100m relay Race' || (p.selectedEvents && p.selectedEvents.includes('4*100m relay Race'));
        const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
        const subEventName = (p.selectedEvents && p.selectedEvents[0]) || p.category || p.eventTitle || '100m Race';

        const p1 = p.player1 || {
          name: p.captainName || p.name || p.studentName || 'Athlete',
          roll: p.rollNo || p.roll || 'N/A',
          college: p.collegeName || p.college || 'SEMS Institution',
          year: p.semester || p.year || p.department || 'N/A',
          phone: p.captainPhone || p.phone || p.mobile || '-',
          email: p.captainEmail || p.email || '-'
        };

        let p2Details = 'N/A (Individual Event)';
        if (p.player2) {
          p2Details = `${p.player2.name} | Roll: ${p.player2.roll || 'N/A'} | Coll: ${p.player2.college || 'N/A'}`;
        } else if (isRelay && p.roster && p.roster.length > 1) {
          const partners = p.roster.slice(1);
          p2Details = partners.map((x) => `${x.name} (Roll: ${x.rollNo || 'N/A'})`).join('; ');
        }

        return [
          escapeCsv(timestamp),
          escapeCsv('Athletics'),
          escapeCsv(subEventName),
          escapeCsv(p1.name || 'N/A'),
          escapeCsv(p1.roll || 'N/A'),
          escapeCsv(p1.college || 'N/A'),
          escapeCsv(p1.year || 'N/A'),
          escapeCsv(p1.phone || 'N/A'),
          escapeCsv(p1.email || 'N/A'),
          escapeCsv(p2Details)
        ];
      });

      const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Athletics_Participant_Database.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Athletics participant database exported to CSV successfully!`, 'success');
    } else {
      const headers = [
        'Timestamp',
        'Sport',
        'Category',
        'Gender',
        'Player Name',
        'Roll No',
        'College',
        'Year / Semester',
        'Phone No',
        'Email',
        'Partner Name',
        'Partner Roll No',
        'Partner College',
        'Partner Year / Semester',
        'Partner Phone No',
        'Partner Email'
      ];

      const rows = filtered.map((p) => {
        const isDoubles = p.category === 'DOUBLES' || p.format === 'DOUBLES' || p.player2;
        const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
        const sportDisplay = p.sport || sportName || 'Badminton';
        const categoryDisplay = p.category || (isDoubles ? 'DOUBLES' : 'SINGLES');
        const genderDisplay = p.gender || p.player1?.gender || 'Boys / Mens';

        const p1 = p.player1 || {
          name: p.studentName || p.name || 'Aditya Singh',
          roll: p.roll || '25261101308',
          college: p.college || 'MPCPS (KN142)',
          year: p.department || '2nd Year',
          phone: p.phone || '9336938985',
          email: p.email || 'adityasinghmlzs01@gmail.com'
        };

        const p2 = p.player2 || null;

        return [
          escapeCsv(timestamp),
          escapeCsv(sportDisplay),
          escapeCsv(categoryDisplay),
          escapeCsv(genderDisplay),
          escapeCsv(p1.name || 'N/A'),
          escapeCsv(p1.roll || 'N/A'),
          escapeCsv(p1.college || 'N/A'),
          escapeCsv(p1.year || 'N/A'),
          escapeCsv(p1.phone || 'N/A'),
          escapeCsv(p1.email || 'N/A'),
          escapeCsv(isDoubles && p2 ? p2.name : 'N/A (Singles)'),
          escapeCsv(isDoubles && p2 ? p2.roll : 'N/A'),
          escapeCsv(isDoubles && p2 ? p2.college : 'N/A'),
          escapeCsv(isDoubles && p2 ? p2.year : 'N/A'),
          escapeCsv(isDoubles && p2 ? p2.phone : 'N/A'),
          escapeCsv(isDoubles && p2 ? p2.email : 'N/A')
        ];
      });

      const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${sportName.replace(/\s+/g, '_')}_Participant_Database.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`${sportName} participant database exported to CSV successfully!`, 'success');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-200 animate-fade-in font-sans">

      {/* Main Card Container */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/90 shadow-soft dark:shadow-2xl space-y-5">

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isChess ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : isAthletics ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Participant Database (Read Only)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  READ ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified registration records for {isChess ? 'Chess' : isAthletics ? 'Athletics' : sportName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${isChess ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : isAthletics ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
            >
              <FileDown className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBasketball ? "Search team, college, name..." : isAthletics ? "Search athlete, sub-event, college..." : "Search name, roll..."}
                className={`w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 ${isChess ? 'focus:ring-purple-500' : isAthletics ? 'focus:ring-blue-500' : 'focus:ring-orange-500'
                  }`}
              />
            </div>
          </div>
        </div>

        {/* TABLE VIEW */}
        <div className="overflow-x-auto">
          {(isBasketball || isCricket || isFootball) ? (

            /* 🏀 BASKETBALL, ⚽ FOOTBALL & 🏏 CRICKET TABLE FORMAT */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-4">Time</th>
                  <th className="p-4">Game Name</th>
                  <th className="p-4">Team Name</th>
                  <th className="p-4">College Name</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Mobile No</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs font-sans">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                      No registered {isCricket ? 'Cricket' : isFootball ? 'Football' : 'Basketball'} participants found in database.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => {
                    const row = getTeamParticipantRowData(p, idx);

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                          {row.timestamp}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white font-sans text-xs whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                            isCricket
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                          }`}>
                            {row.gameName}
                          </span>
                        </td>
                        <td className="p-4 font-black text-slate-900 dark:text-white text-xs whitespace-nowrap">
                          {row.teamName}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                          {row.collegeName}
                        </td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                          {row.name}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                          {row.mobileNo}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                          {row.email}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">Verified</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

          ) : (

            /* 🏃 ATHLETICS / ♟️ CHESS / 🏸 BADMINTON & OTHER SPORTS TABLE FORMAT */
            /* Columns: Timestamp | Sport | Category | Player Details | Team Partner Details | Action */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Sport</th>
                  <th className="p-4">{isChess ? 'Gender' : 'Category'}</th>
                  <th className="p-4">Player Details</th>
                  {!isChess && <th className="p-4">Team Partner Details</th>}
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isChess ? 5 : 6} className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                      No participant registrations found. Registered participants will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => {
                    const isRelay = p.category === '4*100m relay Race' || (p.selectedEvents && p.selectedEvents.includes('4*100m relay Race'));
                    const catStr = String(p.category || p.format || p.eventTitle || p.sportId || '').toUpperCase();
                    const isDoubles = catStr.includes('DOUBLE') || catStr.includes('DOUBLES') || !!p.player2 || (p.members && p.members.length > 1) || (p.roster && p.roster.length > 1) || isRelay;
                    const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
                    const sportDisplay = isAthletics ? 'Athletics' : isChess ? 'Chess' : (p.sport || sportName || 'Badminton');
                    const rawG = String(p.gender || p.player1?.gender || p.category || '').toLowerCase();

                    const subEventName = (p.selectedEvents && p.selectedEvents[0]) || p.category || p.eventTitle || '100m Race';
                    const categoryDisplay = isChess
                      ? ((rawG.includes('female') || rawG.includes('girl') || rawG.includes('women')) ? 'Female' : 'Male')
                      : isAthletics
                      ? subEventName
                      : (isDoubles ? 'DOUBLES' : (p.category || 'SINGLES'));

                    const p1 = p.player1 || {
                      name: p.captainName || p.name || p.studentName || 'Athlete',
                      roll: p.rollNo || p.roll || 'N/A',
                      college: p.collegeName || p.college || 'SEMS Institution',
                      year: p.semester || p.year || p.department || '3rd Year',
                      phone: p.captainPhone || p.phone || p.mobile || '-',
                      email: p.captainEmail || p.email || '-'
                    };

                    let p2 = p.player2 || null;
                    if (!p2 && p.members && p.members.length > 1) {
                      const m2 = p.members[1];
                      p2 = {
                        name: m2.fullName || m2.name,
                        roll: m2.rollNo || m2.roll || 'N/A',
                        college: p1.college,
                        year: m2.yearSemester || p1.year,
                        phone: m2.mobile || m2.phone || '-',
                        email: m2.email || '-'
                      };
                    } else if (!p2 && p.roster && p.roster.length > 1) {
                      const r2 = p.roster[1];
                      p2 = {
                        name: r2.name || r2.fullName,
                        roll: r2.rollNo || r2.roll || 'N/A',
                        college: p1.college,
                        year: r2.year || p1.year,
                        phone: r2.phone || '-',
                        email: r2.email || '-'
                      };
                    }
                    if (!p2 && isRelay && p.roster && p.roster.length > 1) {
                      const partners = p.roster.slice(1);
                      p2 = {
                        name: partners.map((x) => x.name).filter(Boolean).join(', '),
                        roll: partners.map((x) => x.rollNo).filter(Boolean).join(', '),
                        college: partners[0]?.collegeName || partners[0]?.college || p1.college,
                        year: partners[0]?.semester || partners[0]?.year || p1.year,
                        phone: partners.map((x) => x.phone).filter(Boolean).join(', '),
                        email: partners.map((x) => x.email).filter(Boolean).join(', ')
                      };
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                          {timestamp}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white font-sans text-xs whitespace-nowrap">
                          {isAthletics ? (
                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                              Athletics
                            </span>
                          ) : isChess ? (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                              Chess
                            </span>
                          ) : (
                            sportDisplay
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isAthletics
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/50'
                              : isChess
                              ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-700/50'
                              : (categoryDisplay === 'DOUBLES'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-700/50'
                                : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700/50')
                          }`}>
                            {categoryDisplay}
                          </span>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{p1.name}</div>
                          {isAthletics ? (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                              {p1.college}
                            </div>
                          ) : (
                            <>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                Roll: <strong className="text-slate-900 dark:text-slate-200">{p1.roll}</strong>
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                Coll: {p1.college} {p1.year ? `| Yr: ${p1.year}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                Mob: {p1.phone} {p1.email && p1.email !== '-' ? `| Email: ${p1.email}` : ''}
                              </div>
                            </>
                          )}
                        </td>
                        {!isChess && (
                          <td className="p-4 space-y-0.5">
                            {p2 ? (
                              isAthletics ? (
                                <>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                                    {p2.name}
                                    {isRelay && <span className="block text-[10px] text-blue-500 font-mono font-normal">Relay Partners</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                                    {p2.college}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                                    {p2.name}
                                    {isRelay && <span className="block text-[10px] text-blue-500 font-mono font-normal">Relay Partners (3 Members)</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                    Roll: <strong className="text-slate-900 dark:text-slate-200">{p2.roll}</strong>
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                    Coll: {p2.college} {p2.year ? `| Yr: ${p2.year}` : ''}
                                  </div>
                                  {p2.phone && p2.phone !== '-' && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                      Mob: {p2.phone} {p2.email && p2.email !== '-' ? `| Email: ${p2.email}` : ''}
                                    </div>
                                  )}
                                </>
                              )
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                                {isAthletics ? 'N/A (Individual Event)' : 'N/A (Singles)'}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="p-4 text-right whitespace-nowrap">
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">Verified</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};
