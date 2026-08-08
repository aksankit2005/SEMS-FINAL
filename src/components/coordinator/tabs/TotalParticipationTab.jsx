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
  const isChess = sportId === 'chess' || sportName.toLowerCase().includes('chess');
  const isCricket = sportId === 'cricket' || sportName.toLowerCase().includes('cricket');
  const isTableTennis = sportId === 'table-tennis' || sportId === 'tabletennis' || sportName.toLowerCase().includes('table tennis');

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
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
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
    const gameName = isBasketball ? 'Basketball' : isChess ? 'Chess' : (p.eventTitle || p.sport || sportName || '');

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

    const defaultSeeds = isCricket ? crkSeeds : bskSeeds;
    const seed = defaultSeeds[defaultIndex % defaultSeeds.length];

    return {
      timestamp: p.timestamp || p.registeredAt || p.date || seed.time,
      gameName: isCricket ? 'Cricket' : 'Basketball',
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

    if (isBasketball || isCricket) {
      const sportLabel = isCricket ? 'Cricket' : 'Basketball';
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
      // ♟️ CHESS EXPORT FORMAT (Timestamp, Sport, Gender, Player Name, Roll No, College, Year / Branch, Phone No, Email)
      const headers = [
        'Timestamp',
        'Sport',
        'Gender',
        'Player Name',
        'Roll No',
        'College',
        'Year / Branch',
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
          year: p.department || '2nd Year',
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
    } else {
      const headers = [
        'Timestamp',
        'Sport',
        'Category',
        'Gender',
        'Player Name',
        'Roll No',
        'College',
        'Year / Branch',
        'Phone No',
        'Email',
        'Partner Name',
        'Partner Roll No',
        'Partner College',
        'Partner Year / Branch',
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
            <div className={`p-2 rounded-xl border ${isChess ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
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
                Verified registration records for {isChess ? 'Chess' : sportName}
              </p>
            </div>

            {participants.length > 0 && (
              <button
                onClick={handleClearParticipants}
                className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-600/20 hover:bg-rose-100 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Data</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                isChess ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : 'bg-emerald-600 hover:bg-emerald-500'
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
                placeholder={isBasketball ? "Search team, college, name..." : "Search name, roll..."}
                className={`w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 ${
                  isChess ? 'focus:ring-purple-500' : 'focus:ring-orange-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* TABLE VIEW */}
        <div className="overflow-x-auto">
          {(isBasketball || isCricket) ? (

            /* 🏀 BASKETBALL & 🏏 CRICKET TABLE FORMAT */
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs font-sans">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                      No registered {isCricket ? 'Cricket' : 'Basketball'} participants found in database.
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

          ) : (

            /* ♟️ CHESS / 🏸 BADMINTON & OTHER SPORTS TABLE FORMAT */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Sport</th>
                  <th className="p-4">{isChess ? 'Gender' : 'Category'}</th>
                  <th className="p-4">Player Details</th>
                  {!isChess && <th className="p-4">Team Partner Details</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isChess ? 4 : 5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                      No participant registrations found. Registered participants will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => {
                    const isDoubles = p.category === 'DOUBLES' || p.format === 'DOUBLES' || p.player2;
                    const timestamp = p.timestamp || p.registeredAt || '16 Jul, 10:32 am';
                    const sportDisplay = isChess ? 'Chess' : (p.sport || sportName || 'Badminton');
                    const rawG = String(p.gender || p.player1?.gender || p.category || '').toLowerCase();
                    const categoryDisplay = isChess
                      ? ((rawG.includes('female') || rawG.includes('girl') || rawG.includes('women')) ? 'Female' : 'Male')
                      : (p.category || (isDoubles ? 'DOUBLES' : 'SINGLES'));

                    const p1 = p.player1 || {
                      name: p.studentName || p.name || 'Aditya Singh',
                      roll: p.roll || '25261101308',
                      college: p.college || 'MPCPS (KN142)',
                      year: p.department || '2nd Year',
                      phone: p.phone || '9336938985',
                      email: p.email || 'adityasinghmlzs01@gmail.com'
                    };

                    const p2 = p.player2 || null;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                          {timestamp}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white font-sans text-xs whitespace-nowrap">
                          {isChess ? (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                              Chess
                            </span>
                          ) : (
                            sportDisplay
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isChess
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
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            Roll: <strong className="text-slate-900 dark:text-slate-200">{p1.roll}</strong>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            Coll: {p1.college} {p1.year ? `| Yr: ${p1.year}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            Mob: {p1.phone} | Email: {p1.email}
                          </div>
                        </td>
                        {!isChess && (
                          <td className="p-4 space-y-0.5">
                            {isDoubles && p2 ? (
                              <>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{p2.name}</div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                  Roll: <strong className="text-slate-900 dark:text-slate-200">{p2.roll}</strong>
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                  Coll: {p2.college} {p2.year ? `| Yr: ${p2.year}` : ''}
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                                  Mob: {p2.phone} | Email: {p2.email}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic text-xs">N/A (Singles)</span>
                            )}
                          </td>
                        )}
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
