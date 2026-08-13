import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Layers, Filter, Search, Download, Calendar, MapPin, DollarSign, 
  CheckCircle2, Image as ImageIcon, ShieldAlert, Sparkles, RefreshCw, Eye, UserCheck, Phone, Mail, Award, BookOpen,
  FolderOpen, Folder, ArrowLeft, Camera, Film, X, Maximize2, Key, EyeOff, User, Lock, Building2, Crown
} from 'lucide-react';

import { superCoordinatorApi, ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportToCSV, exportToPDF } from '../../utils/pdfExporter';
import { GoogleDriveImage } from '../../components/common/GoogleDriveImage';

export const SuperCoordinatorDashboardPage = () => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [coordinatorEvents, setCoordinatorEvents] = useState([]);
  const [masterParticipants, setMasterParticipants] = useState([]);
  const [prPhotos, setPrPhotos] = useState([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);

  // PR Media Folders & Folder Details State
  const [prFolders, setPrFolders] = useState([]);
  const [selectedPRFolder, setSelectedPRFolder] = useState(null);
  const [selectedFolderMedia, setSelectedFolderMedia] = useState({ all: [], photos: [], videos: [] });
  const [folderMediaLoading, setFolderMediaLoading] = useState(false);
  const [prViewMode, setPrViewMode] = useState('folders'); // 'folders' | 'feed'
  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null);

  // Change Password Modal & Form State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Athletics Sub-Events List
  const ATHLETICS_SUB_EVENTS = [
    '100m Sprint',
    '200m Sprint',
    '4x100m Relay',
    'Long Jump',
    'Shot Put',
    'Discus Throw',
    'Javelin Throw'
  ];

  // Helper to determine allowed formats per sport
  const getFormatsForSport = (sportId) => {
    const s = (sportId || '').toLowerCase();
    if (s.includes('badminton') || s.includes('table-tennis') || s.includes('tt')) {
      return [
        { id: 'Single', label: 'Single' },
        { id: 'Double', label: 'Double' }
      ];
    }
    if (s.includes('athletics')) {
      return [
        { id: 'Individual', label: 'Individual' }
      ];
    }
    if (s.includes('chess')) {
      return [
        { id: 'Single', label: 'Single' },
        { id: 'Team', label: 'Team Game' }
      ];
    }
    return [
      { id: 'Team', label: 'Team Game' }
    ];
  };

  // Leaderboard Points & Result Entry Form State
  const [awardSportId, setAwardSportId] = useState('football');
  const [matchFormat, setMatchFormat] = useState('Team'); // 'Single' | 'Double' | 'Team' | 'Individual'
  const [matchGender, setMatchGender] = useState('Boys'); // 'Boys' | 'Girls' | 'Mixed'
  const [athleticsSubEvent, setAthleticsSubEvent] = useState('100m Sprint');
  const [winnerName, setWinnerName] = useState('');
  const [winnerTeamName, setWinnerTeamName] = useState('');
  const [winnerCollegeId, setWinnerCollegeId] = useState('MPEC');
  const [runnerUpName, setRunnerUpName] = useState('');
  const [runnerUpTeamName, setRunnerUpTeamName] = useState('');
  const [runnerUpCollegeId, setRunnerUpCollegeId] = useState('MIPS');

  const handleAwardSportChange = (newSportId) => {
    setAwardSportId(newSportId);
    const formats = getFormatsForSport(newSportId);
    if (!formats.some((f) => f.id === matchFormat)) {
      setMatchFormat(formats[0].id);
    }
  };

  // Declared Match Results Table Filters
  const [resultFilterGender, setResultFilterGender] = useState('ALL');
  const [resultFilterSport, setResultFilterSport] = useState('ALL');

  // Multi-Filter State
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab View: 'leaderboard' | 'coordinator_creations' | 'participants' | 'pr_gallery' | 'profile'
  const [activeTab, setActiveTab] = useState('leaderboard');

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }

    localStorage.setItem('sems_super_coord_password', passwordForm.newPass);
    addToast('Super Coordinator Password updated successfully!', 'success');
    setShowPasswordModal(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  useEffect(() => {
    fetchDashboardData();

    // Live update listeners for when PR team creates folders or uploads photos
    const handlePRUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('sems_events_updated', handlePRUpdate);
    window.addEventListener('sems_media_updated', handlePRUpdate);
    window.addEventListener('sems_pr_photos_updated', handlePRUpdate);

    return () => {
      window.removeEventListener('sems_events_updated', handlePRUpdate);
      window.removeEventListener('sems_media_updated', handlePRUpdate);
      window.removeEventListener('sems_pr_photos_updated', handlePRUpdate);
    };
  }, [selectedPRFolder?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsList, participantsList, photosList, lbList, foldersList] = await Promise.all([
        superCoordinatorApi.getCoordinatorEvents(),
        superCoordinatorApi.getMasterParticipants(),
        superCoordinatorApi.getPRPhotos(),
        superCoordinatorApi.getLeaderboardEntries(),
        superCoordinatorApi.getPREventFolders()
      ]);

      setCoordinatorEvents(eventsList || []);
      setMasterParticipants(participantsList || []);
      setPrPhotos(photosList || []);
      setLeaderboardEntries(lbList || []);
      setPrFolders(foldersList || []);

      if (selectedPRFolder) {
        const mediaDetails = await superCoordinatorApi.getPRFolderMedia(selectedPRFolder.id);
        setSelectedFolderMedia(mediaDetails || { all: [], photos: [], videos: [] });
      }
    } catch (err) {
      addToast('Error loading Super Coordinator dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPRFolder = async (folder) => {
    setSelectedPRFolder(folder);
    setFolderMediaLoading(true);
    try {
      const media = await superCoordinatorApi.getPRFolderMedia(folder.id);
      setSelectedFolderMedia(media || { all: [], photos: [], videos: [] });
    } catch (e) {
      addToast('Failed to load folder media items', 'error');
    } finally {
      setFolderMediaLoading(false);
    }
  };

  const handleSportChange = (sportId) => {
    setSelectedSport(sportId);
    setSelectedEvent('ALL');
  };

  // Dynamic available events list based on selected sport
  const availableEvents = coordinatorEvents.filter((evt) => {
    if (selectedSport === 'ALL') return true;
    return (evt.sportId || '').toLowerCase() === selectedSport.toLowerCase() ||
           (evt.sportName || '').toLowerCase().includes(selectedSport.toLowerCase());
  });

  // Calculate Inter-College Leaderboard Standings
  const collegeStandings = ALL_COLLEGES.map((c) => {
    let winnerCount = 0;
    let runnerUpCount = 0;
    let totalPoints = 0;

    leaderboardEntries.forEach((entry) => {
      if (entry.winnerCollege === c.id || entry.winnerCollege === c.name || entry.winnerCollegeName === c.name) {
        winnerCount += 1;
        totalPoints += 2;
      }
      if (entry.runnerUpCollege === c.id || entry.runnerUpCollege === c.name || entry.runnerUpCollegeName === c.name) {
        runnerUpCount += 1;
        totalPoints += 1;
      }
    });

    return {
      ...c,
      winnerCount,
      runnerUpCount,
      totalPoints
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  // Handle Award Leaderboard Points / Declare Winner Result Entry
  const handleAddLeaderboardPoints = async (e) => {
    e.preventDefault();

    const isAthletics = awardSportId.toLowerCase().includes('athletics');

    if (!winnerName.trim() && !winnerTeamName.trim()) {
      addToast('Please enter Winner Player Name or Winner Team Name', 'error');
      return;
    }
    if (!runnerUpName.trim() && !runnerUpTeamName.trim()) {
      addToast('Please enter Runner-Up Player Name or Runner-Up Team Name', 'error');
      return;
    }

    const sportObj = ALL_12_SPORTS.find((s) => s.id === awardSportId) || ALL_12_SPORTS[0];
    const winnerObj = ALL_COLLEGES.find((c) => c.id === winnerCollegeId) || ALL_COLLEGES[0];
    const runnerObj = ALL_COLLEGES.find((c) => c.id === runnerUpCollegeId) || ALL_COLLEGES[1];

    const finalSportName = isAthletics ? `Athletics (${athleticsSubEvent})` : sportObj.name;
    const wName = winnerName.trim() || winnerTeamName.trim();
    const wTeam = winnerTeamName.trim() || winnerName.trim();
    const rName = runnerUpName.trim() || runnerUpTeamName.trim();
    const rTeam = runnerUpTeamName.trim() || runnerUpName.trim();

    const newEntry = {
      id: `LB-${Date.now()}`,
      sportId: sportObj.id,
      sportName: finalSportName,
      athleticsSubEvent: isAthletics ? athleticsSubEvent : null,
      matchFormat, // 'Single' | 'Double' | 'Team' | 'Individual'
      gender: matchGender, // 'Boys' | 'Girls' | 'Mixed'

      // Winner Details
      winnerName: wName,
      winnerTeamName: wTeam,
      winnerCollege: winnerObj.id,
      winnerCollegeName: winnerObj.name,
      winnerPoints: 2,

      // Runner-Up Details
      runnerUpName: rName,
      runnerUpTeamName: rTeam,
      runnerUpCollege: runnerObj.id,
      runnerUpCollegeName: runnerObj.name,
      runnerUpPoints: 1,

      date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    };

    const updated = [newEntry, ...leaderboardEntries];
    setLeaderboardEntries(updated);
    await superCoordinatorApi.saveLeaderboardEntries(updated);
    addToast(`Result Saved! Winner: ${wName} (${winnerObj.id}) [+2 Pts] & Runner-Up: ${rName} (${runnerObj.id}) [+1 Pt]`, 'success');

    // Reset input fields
    setWinnerName('');
    setWinnerTeamName('');
    setRunnerUpName('');
    setRunnerUpTeamName('');
  };

  const handleDeleteLeaderboardEntry = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Leaderboard Entry',
      message: 'Are you sure you want to delete this leaderboard result entry?'
    });
    if (!isConfirmed) return;
    const updated = leaderboardEntries.filter((e) => e.id !== id);
    setLeaderboardEntries(updated);
    await superCoordinatorApi.saveLeaderboardEntries(updated);
    addToast('Leaderboard entry removed', 'info');
  };

  // Handle Export Leaderboard Standings PDF Report
  const handleExportLeaderboardPDF = () => {
    if (collegeStandings.length === 0) {
      addToast('No leaderboard data to export', 'warning');
      return;
    }

    const title = 'APEX 2026 INTER-COLLEGE CHAMPIONSHIP LEADERBOARD STANDINGS';
    const headers = [
      'Rank',
      'College Institution Name',
      '1st Place Wins (2 Pts)',
      'Runner-Up Finishes (1 Pt)',
      'Total Championship Points'
    ];

    const rows = collegeStandings.map((c, idx) => [
      idx === 0 ? '1st Place (Gold 🥇)' : idx === 1 ? '2nd Place (Silver 🥈)' : idx === 2 ? '3rd Place (Bronze 🥉)' : `#${idx + 1}`,
      c.name,
      `${c.winnerCount} Wins (${c.winnerCount * 2} Pts)`,
      `${c.runnerUpCount} Finishes (${c.runnerUpCount * 1} Pt)`,
      `${c.totalPoints} PTS`
    ]);

    const success = exportToPDF(title, headers, rows, `InterCollege_Leaderboard_${new Date().toISOString().split('T')[0]}`);
    if (success !== false) {
      addToast('Exported Inter-College Championship Leaderboard PDF Report', 'success');
    }
  };

  // Handle Export Declared Match Results to Excel (Full Details)
  const handleExportResultsExcel = (resultsToExport = leaderboardEntries) => {
    if (resultsToExport.length === 0) {
      addToast('No match results available to export', 'warning');
      return;
    }

    const headers = [
      'Result Entry ID',
      'Date Recorded',
      'Game / Sport',
      'Athletics Sub-Event',
      'Match Format',
      'Gender Category',
      'Winner Player Name (1st Place)',
      'Winner Team Name',
      'Winner College Name',
      'Winner Points Awarded',
      'Runner-Up Player Name (2nd Place)',
      'Runner-Up Team Name',
      'Runner-Up College Name',
      'Runner-Up Points Awarded'
    ];

    const rows = resultsToExport.map((entry) => [
      entry.id || '',
      entry.date || '',
      entry.sportName || '',
      entry.athleticsSubEvent || 'N/A',
      entry.matchFormat || 'N/A',
      entry.gender || 'N/A',
      entry.winnerName || 'N/A',
      entry.winnerTeamName || entry.winnerName || 'N/A',
      entry.winnerCollegeName || entry.winnerCollege || 'N/A',
      '2 Points',
      entry.runnerUpName || 'N/A',
      entry.runnerUpTeamName || entry.runnerUpName || 'N/A',
      entry.runnerUpCollegeName || entry.runnerUpCollege || 'N/A',
      '1 Point'
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Declared_Match_Results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${resultsToExport.length} match result records to Excel successfully!`, 'success');
  };

  // Filtered Participants Logic
  const filteredParticipants = masterParticipants.filter((p) => {
    const matchesSport = selectedSport === 'ALL' || (p.sportId || '').toLowerCase() === selectedSport.toLowerCase() || (p.sportName || '').toLowerCase().includes(selectedSport.toLowerCase());
    const matchesGender = selectedGender === 'ALL' || (p.gender || '').toLowerCase() === selectedGender.toLowerCase();
    const pCollege = (p.college || '').toLowerCase();
    const matchesCollege = selectedCollege === 'ALL' || 
      pCollege.includes(selectedCollege.toLowerCase()) ||
      selectedCollege.toLowerCase().includes(pCollege) ||
      (selectedCollege === 'EXTERNAL' && !['mpec', 'mips', 'mpcps', 'mpcp', 'mpdc', 'mpcn', 'mpamc', 'mpcams'].some(c => pCollege.includes(c)));
    
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (p.name || '').toLowerCase().includes(q) ||
      (p.teamName || '').toLowerCase().includes(q) ||
      (p.mobile || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.college || '').toLowerCase().includes(q);

    return matchesSport && matchesGender && matchesCollege && matchesSearch;
  });

  // Handle Export Filtered Excel (CSV) Report
  const handleExportFilteredExcel = () => {
    if (filteredParticipants.length === 0) {
      addToast('No participant records matching current filters to export', 'warning');
      return;
    }

    const headers = [
      'Registration ID',
      'Registration Time',
      'Game / Sport',
      'Event Registration Title',
      'Team Name',
      'College Name',
      'Student Name',
      'Mobile Number',
      'Email Address',
      'Gender',
      'Verification Status'
    ];

    const rows = filteredParticipants.map((p) => [
      p.id,
      p.time || '10:00 AM',
      p.sportName || 'Sport',
      p.eventTitle || `${p.sportName || 'Sport'} Event`,
      p.teamName || 'N/A',
      p.college || 'MPEC',
      p.name || 'Student',
      p.mobile || 'N/A',
      p.email || 'N/A',
      p.gender || 'Boys',
      p.status || 'VERIFIED'
    ]);

    const sportTag = selectedSport !== 'ALL' ? selectedSport : 'AllSports';
    const eventTag = selectedEvent !== 'ALL' ? selectedEvent.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : '';
    const fileName = `Filtered_Participants_${sportTag}${eventTag ? '_' + eventTag : ''}_${new Date().toISOString().split('T')[0]}.csv`;

    exportToCSV(fileName, headers, rows);
    addToast(`Exported ${filteredParticipants.length} filtered participant records to Excel (CSV)`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      


      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        


        {/* Tab Switcher Bar */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Leaderboard & Winner Entry</span>
          </button>

          <button
            onClick={() => setActiveTab('match_results')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'match_results'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>📜 Declared Match Results ({leaderboardEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coordinator_creations')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'coordinator_creations'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Coordinator Event Creations ({coordinatorEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'participants'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Master Participant Database ({filteredParticipants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pr_gallery')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pr_gallery'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>PR Media Gallery ({prPhotos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>👤 Profile & Security</span>
          </button>
        </div>

        {/* SECTION 0: INTER-COLLEGE CHAMPIONSHIP LEADERBOARD */}
        {(activeTab === 'leaderboard' || activeTab === 'dashboard') && (
          <div className="space-y-6">
            
            {/* Header & Award Form Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                    Super Coordinator Winner Declaration Console
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Select Game, Match Format & Gender, enter 1st & 2nd Place details, then click <strong className="text-amber-600 dark:text-amber-400">Done</strong> to credit points (<strong className="text-emerald-600 dark:text-emerald-400">1st = 2 Pts</strong> • <strong className="text-blue-600 dark:text-blue-400">2nd = 1 Pt</strong>).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportLeaderboardPDF}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                  title="Export Championship Leaderboard Standings as a PDF report"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Export Leaderboard PDF</span>
                </button>
              </div>

              {/* Multi-Step Winner Declaration Form */}
              <form onSubmit={handleAddLeaderboardPoints} className="space-y-5">
                
                {/* ROW 1: Game Selection, Match Format (Dynamic per Sport), and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Select Game / Sport */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
                      🎯 Select Game / Sport
                    </label>
                    <select
                      value={awardSportId}
                      onChange={(e) => handleAwardSportChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                    >
                      {ALL_12_SPORTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Select Match Format (Dynamically restricted based on Sport) */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      🎾 Match Format
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                      {getFormatsForSport(awardSportId).map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setMatchFormat(fmt.id)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition cursor-pointer text-center ${
                            matchFormat === fmt.id
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Select Gender Category (Always shown for all sports) */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      ⚧️ Gender Category
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                      {[
                        { id: 'Boys', label: 'Boys' },
                        { id: 'Girls', label: 'Girls' },
                        { id: 'Mixed', label: 'Mixed' }
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setMatchGender(g.id)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition cursor-pointer text-center ${
                            matchGender === g.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROW 1.5: Athletics Sub-Event Dropdown Selector (Shown ONLY when Athletics is selected) */}
                {awardSportId.toLowerCase().includes('athletics') && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fade-in">
                    <label className="block text-xs font-mono font-black text-amber-600 dark:text-amber-400 uppercase">
                      🏃 Select Athletics Event / Discipline (Row-wise Selection) *
                    </label>
                    <select
                      value={athleticsSubEvent}
                      onChange={(e) => setAthleticsSubEvent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-500/50 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                    >
                      {ATHLETICS_SUB_EVENTS.map((subEv) => (
                        <option key={subEv} value={subEv}>
                          🏃 {subEv}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ROW 2: Winner & Runner-Up Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  
                  {/* Winner Box (1st Place) */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                        🥇 Winner Details (1st Place)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-mono font-black text-[10px]">
                        +2 POINTS
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                          👤 Winner Player Name {matchFormat === 'Single' || matchFormat === 'Individual' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Single' || matchFormat === 'Individual'}
                          value={winnerName}
                          onChange={(e) => setWinnerName(e.target.value)}
                          placeholder="Enter Winner Player Name"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                          🛡️ Winner Team Name {matchFormat === 'Team' || matchFormat === 'Double' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Team' || matchFormat === 'Double'}
                          value={winnerTeamName}
                          onChange={(e) => setWinnerTeamName(e.target.value)}
                          placeholder="e.g. MPEC Titans"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                          🏫 Winner College Name *
                        </label>
                        <select
                          value={winnerCollegeId}
                          onChange={(e) => setWinnerCollegeId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          {ALL_COLLEGES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Runner-Up Box (2nd Place) */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-1.5">
                        🥈 Runner-Up Details (2nd Place)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono font-black text-[10px]">
                        +1 POINT
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                          👤 Runner-Up Player Name {matchFormat === 'Single' || matchFormat === 'Individual' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Single' || matchFormat === 'Individual'}
                          value={runnerUpName}
                          onChange={(e) => setRunnerUpName(e.target.value)}
                          placeholder="Enter Runner-Up Player Name"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                          🛡️ Runner-Up Team Name {matchFormat === 'Team' || matchFormat === 'Double' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Team' || matchFormat === 'Double'}
                          value={runnerUpTeamName}
                          onChange={(e) => setRunnerUpTeamName(e.target.value)}
                          placeholder="e.g. MIPS Strikers"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
                          🏫 Runner-Up College Name *
                        </label>
                        <select
                          value={runnerUpCollegeId}
                          onChange={(e) => setRunnerUpCollegeId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {ALL_COLLEGES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ROW 3: Submit / Done Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-400/40"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>Done / Save Result Entry & Award Points (+2 & +1 Pts)</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Championship Standings Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md dark:shadow-xl space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  🏆 Overall Inter-College Championship Standings
                </h4>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportLeaderboardPDF}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Download Leaderboard PDF Report"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>Export PDF</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">Updated Live</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Rank</th>
                      <th className="p-4">College Name</th>
                      <th className="p-4">🥇 1st Place Wins (2 Pts)</th>
                      <th className="p-4">🥈 Runner-Up Finishes (1 Pt)</th>
                      <th className="p-4 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                    {collegeStandings.map((c, index) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono font-black text-base">
                          {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `#${index + 1}`}
                        </td>
                        <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {c.winnerCount} Wins ({c.winnerCount * 2} Pts)
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {c.runnerUpCount} Finishes ({c.runnerUpCount * 1} Pt)
                        </td>
                        <td className="p-4 font-mono font-black text-lg text-right text-amber-600 dark:text-amber-400">
                          {c.totalPoints} PTS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Declared Match Result Entries Log */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-md dark:shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  📜 Declared Match Result Entries Log ({leaderboardEntries.length})
                </h4>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {leaderboardEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No match result entries recorded yet.</p>
                ) : (
                  leaderboardEntries.map((entry) => (
                    <div key={entry.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-amber-500/40 transition">
                      
                      {/* Top Meta Bar: Game, Format, Gender & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs border border-amber-500/20 flex items-center gap-1">
                            🎯 {entry.sportName}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs">
                            🎾 {entry.matchFormat || 'Single'}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">
                            ⚧️ {entry.gender || 'Boys'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-slate-500">{entry.date}</span>
                          <button
                            onClick={() => handleDeleteLeaderboardEntry(entry.id)}
                            className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition cursor-pointer"
                            title="Delete result entry"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Result Details: Winner Card & Runner-Up Card side-by-side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        
                        {/* Winner Details Card */}
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                          <div className="flex items-center justify-between font-mono font-black text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800/40 pb-1">
                            <span>🥇 WINNER (1st Place)</span>
                            <span>+2 PTS</span>
                          </div>
                          <div className="pt-1 space-y-1">
                            <p className="text-slate-900 dark:text-white font-extrabold text-sm">
                              👤 Winner Name: <span className="text-emerald-700 dark:text-emerald-300">{entry.winnerName || 'Winner'}</span>
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 font-bold">
                              🛡️ Team Name: <span className="text-slate-900 dark:text-white">{entry.winnerTeamName || entry.winnerName || 'N/A'}</span>
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 font-bold">
                              🏫 College Name: <span className="text-emerald-600 dark:text-emerald-400">{entry.winnerCollegeName || entry.winnerCollege}</span>
                            </p>
                          </div>
                        </div>

                        {/* Runner-Up Details Card */}
                        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
                          <div className="flex items-center justify-between font-mono font-black text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-800/40 pb-1">
                            <span>🥈 RUNNER-UP (2nd Place)</span>
                            <span>+1 PT</span>
                          </div>
                          <div className="pt-1 space-y-1">
                            <p className="text-slate-900 dark:text-white font-extrabold text-sm">
                              👤 Runner-Up Name: <span className="text-blue-700 dark:text-blue-300">{entry.runnerUpName || 'Runner-Up'}</span>
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 font-bold">
                              🛡️ Team Name: <span className="text-slate-900 dark:text-white">{entry.runnerUpTeamName || entry.runnerUpName || 'N/A'}</span>
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 font-bold">
                              🏫 College Name: <span className="text-blue-600 dark:text-blue-400">{entry.runnerUpCollegeName || entry.runnerUpCollege}</span>
                            </p>
                          </div>
                        </div>

                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 0.5: DECLARED MATCH RESULTS TABLE TAB (COLUMN-WISE VIEW) */}
        {(activeTab === 'match_results') && (() => {
          const filteredDeclaredResults = leaderboardEntries.filter((entry) => {
            if (resultFilterGender !== 'ALL' && entry.gender !== resultFilterGender) {
              return false;
            }
            if (resultFilterSport !== 'ALL') {
              const sId = (entry.sportId || '').toLowerCase();
              const sName = (entry.sportName || '').toLowerCase();
              const target = resultFilterSport.toLowerCase();
              if (sId !== target && !sName.includes(target)) {
                return false;
              }
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-500" />
                    Official Declared Match Results Table
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Comprehensive column-wise view of declared match outcomes with live filtering by Game Name and Gender.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportResultsExcel(filteredDeclaredResults)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                    title="Export Declared Match Results report with full details to Excel"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Export Excel (Full Details)</span>
                  </button>
                  <span className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                    Results: {filteredDeclaredResults.length} / {leaderboardEntries.length}
                  </span>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* 1. Filter by Game / Sport */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
                    🎯 Filter by Game / Sport
                  </label>
                  <select
                    value={resultFilterSport}
                    onChange={(e) => setResultFilterSport(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                  >
                    <option value="ALL">All Games / Sports ({leaderboardEntries.length})</option>
                    {ALL_12_SPORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter by Gender */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
                    ⚧️ Filter by Gender
                  </label>
                  <select
                    value={resultFilterGender}
                    onChange={(e) => setResultFilterGender(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResultFilterSport('ALL');
                      setResultFilterGender('ALL');
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>

              </div>

              {/* Column-wise Results Table (Without Action Column) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4 whitespace-nowrap">Date</th>
                        <th className="p-4 whitespace-nowrap">Game Name</th>
                        <th className="p-4 whitespace-nowrap">Format</th>
                        <th className="p-4 whitespace-nowrap">Gender</th>
                        <th className="p-4 min-w-[240px]">🥇 Winner (1st Place)</th>
                        <th className="p-4 min-w-[240px]">🥈 Runner-Up (2nd Place)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                      {filteredDeclaredResults.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-slate-500 italic">
                            No declared match results matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDeclaredResults.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                              {entry.date}
                            </td>
                            <td className="p-4 font-extrabold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              🎯 {entry.sportName}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-extrabold text-[11px]">
                                {entry.matchFormat || 'Single'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[11px]">
                                {entry.gender || 'Boys'}
                              </span>
                            </td>
                            
                            {/* Winner Details Column */}
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                                  <span className="text-emerald-600 dark:text-emerald-400">👤 {entry.winnerName || 'Winner'}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold">+2 Pts</span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  🛡️ Team: <span className="text-slate-900 dark:text-white">{entry.winnerTeamName || entry.winnerName || 'N/A'}</span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  🏫 College: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.winnerCollegeName || entry.winnerCollege}</span>
                                </div>
                              </div>
                            </td>

                            {/* Runner-Up Details Column */}
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                                  <span className="text-blue-600 dark:text-blue-400">👤 {entry.runnerUpName || 'Runner-Up'}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono font-bold">+1 Pt</span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  🛡️ Team: <span className="text-slate-900 dark:text-white">{entry.runnerUpTeamName || entry.runnerUpName || 'N/A'}</span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  🏫 College: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.runnerUpCollegeName || entry.runnerUpCollege}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SECTION 1: COORDINATOR EVENT CREATION TRACKER */}
        {(activeTab === 'coordinator_creations') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  Coordinator Event Creation Tracker
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    LIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  All events created by sport coordinators — updates instantly when any coordinator creates a new event
                </p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh ({coordinatorEvents.length})
              </button>
            </div>

            {coordinatorEvents.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-5xl">📋</div>
                <div>
                  <h4 className="text-base font-black text-slate-800 dark:text-white">No Events Created Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    When any sport coordinator creates an event registration, it will appear here automatically in real-time.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Sport</th>
                        <th className="p-4">Event Registration Title</th>
                        <th className="p-4">Created By Coordinator</th>
                        <th className="p-4">Created On</th>
                        <th className="p-4">Reg. Dates</th>
                        <th className="p-4">Venue</th>
                        <th className="p-4">Entry Fee</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                      {coordinatorEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition">
                          <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            {evt.sportName}
                          </td>
                          <td className="p-4 font-extrabold text-slate-900 dark:text-white max-w-[200px]">
                            <div className="truncate" title={evt.eventTitle}>{evt.eventTitle}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{evt.coordinatorName}</div>
                            {evt.coordinatorEmail && (
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{evt.coordinatorEmail}</div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {evt.createdDate || '—'}
                          </td>
                          <td className="p-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {evt.regStartDate ? `${evt.regStartDate} → ${evt.regEndDate}` : '—'}
                          </td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 font-medium max-w-[150px]">
                            <div className="truncate" title={evt.venue}>{evt.venue || '—'}</div>
                          </td>
                          <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {evt.teamFee > 0 ? `₹${evt.teamFee}` : 'Free'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                              evt.status === 'Published'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}>
                              {evt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}


        {/* SECTION 3: MASTER PARTICIPANT DATABASE WITH MULTI-FILTERS */}
        {(activeTab === 'participants') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  Master Participant Database & Multi-Filter Control
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Filter participants by Game, Event Title, Gender, College, or Search Name
                </p>
              </div>

              <button
                onClick={handleExportFilteredExcel}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
                title="Export ONLY the displayed filtered student records below"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Export Filtered Excel ({filteredParticipants.length})</span>
              </button>
            </div>

            {/* Filter Control Bar */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                
                {/* 1. Sport / Game Filter */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    🎯 Filter by Game
                  </label>
                  <select
                    value={selectedSport}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                  >
                    <option value="ALL">All 12 Sports</option>
                    {ALL_12_SPORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Event Title Filter (Populated dynamically) */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
                    📋 Filter by Event Title
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-amber-500/40 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                  >
                    <option value="ALL">All Created Events ({availableEvents.length})</option>
                    {availableEvents.map((evt) => (
                      <option key={evt.id} value={evt.eventTitle}>
                        {evt.eventTitle}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Gender Filter */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    ⚧️ Filter by Gender
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="Boys">Boys (Male)</option>
                    <option value="Girls">Girls (Female)</option>
                  </select>
                </div>

                {/* 3. College Filter */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    🏫 Filter by College
                  </label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                  >
                    <option value="ALL">All Colleges</option>
                    {ALL_COLLEGES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Live Search Input */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    🔍 Search Participant
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search name, mobile, team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pl-9 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

              </div>

              {/* Active Filter Chips */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  Showing <strong className="text-amber-600 dark:text-amber-400">{filteredParticipants.length}</strong> of {masterParticipants.length} Participants
                </span>
                {(selectedSport !== 'ALL' || selectedEvent !== 'ALL' || selectedGender !== 'ALL' || selectedCollege !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedSport('ALL');
                      setSelectedEvent('ALL');
                      setSelectedGender('ALL');
                      setSelectedCollege('ALL');
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Master Participants Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md dark:shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Reg Time</th>
                      <th className="p-4">Game & Event Title</th>
                      <th className="p-4">Team Name</th>
                      <th className="p-4">College Name</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Mobile No</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-slate-500 italic">
                          No participant records matching selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-mono">
                          <td className="p-4 text-slate-500 dark:text-slate-400">{p.time || '10:00 AM'}</td>
                          <td className="p-4">
                            <div className="font-bold text-amber-600 dark:text-amber-400">{p.sportName}</div>
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{p.eventTitle || `${p.sportName} Event`}</div>
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{p.teamName}</td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{p.college}</td>
                          <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">{p.name}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300">{p.mobile}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300">{p.gender}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              {p.status || 'VERIFIED'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: PR PHOTO & MEDIA GALLERY MONITOR (Folders & Photos View) */}
        {(activeTab === 'pr_gallery') && (
          <div className="space-y-6">
            
            {/* Header & Controls Bar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-6 h-6 text-amber-500" />
                    PR Media Folders & Photo Gallery Monitor
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Review all photo folders created by PR members and inspect uploaded photos in real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Live Sync Active
                  </span>

                  {selectedPRFolder && (
                    <button
                      onClick={() => setSelectedPRFolder(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to All PR Folders</span>
                    </button>
                  )}
                </div>
              </div>

              {/* View Mode Toggle: Folders vs All Photos Stream */}
              {!selectedPRFolder && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPrViewMode('folders')}
                    className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
                      prViewMode === 'folders'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    <span>PR Event Folders ({prFolders.length})</span>
                  </button>

                  <button
                    onClick={() => setPrViewMode('feed')}
                    className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
                      prViewMode === 'feed'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>All Uploaded Media Stream ({prPhotos.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* CASE A: INSIDE SELECTED PR FOLDER VIEW */}
            {selectedPRFolder ? (
              <div className="space-y-6">
                
                {/* Folder Info Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                        📁 PR Event Album Folder
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Date: {selectedPRFolder.event_date}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black">{selectedPRFolder.event_name}</h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                      {selectedPRFolder.description || 'Official media folder created by PR Team.'}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-xs font-mono font-bold text-amber-400">
                      <span>📸 {selectedFolderMedia.photos?.length || 0} Photos</span>
                      <span>🎥 {selectedFolderMedia.videos?.length || 0} Videos</span>
                      <span>Total: {selectedFolderMedia.all?.length || 0} Items</span>
                    </div>
                  </div>
                </div>

                {/* Folder Media Items Grid */}
                {folderMediaLoading ? (
                  <div className="py-16 text-center text-xs font-mono text-slate-400">Loading folder photos & media...</div>
                ) : selectedFolderMedia.all?.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                    <Camera className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">No photos or videos uploaded in this folder yet.</p>
                    <p className="text-xs text-slate-400 mt-1">When PR team uploads photos to "{selectedPRFolder.event_name}", they will automatically appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {selectedFolderMedia.all.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveLightboxMedia({ url: item.media_url, title: item.title, uploadedBy: item.uploaded_by, uploadDate: item.uploaded_at, folderName: selectedPRFolder.event_name })}
                        className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative aspect-square bg-slate-950 overflow-hidden">
                          <GoogleDriveImage
                            src={item.media_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                            <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> View Fullscreen
                            </span>
                          </div>
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-400 text-[10px] font-mono font-bold border border-slate-700">
                            {item.media_type === 'video' ? '🎥 Video' : '📸 Photo'}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title || 'Untitled Photo'}</h4>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>By: {item.uploaded_by || 'PR Team'}</span>
                            <span>{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Recent'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : prViewMode === 'folders' ? (
              
              /* CASE B: PR EVENT FOLDERS GRID */
              <div className="space-y-4">
                {prFolders.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                    <Folder className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">No PR Event Folders Created Yet</p>
                    <p className="text-xs text-slate-400 mt-1">When PR members create folders and upload photos in PR Portal, they will show up here immediately.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prFolders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => handleOpenPRFolder(folder)}
                        className="group relative h-80 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md hover:shadow-2xl hover:border-amber-500/40 transition cursor-pointer flex flex-col justify-between"
                      >
                        {/* Folder Cover Image */}
                        <GoogleDriveImage
                          src={folder.cover_image}
                          alt={folder.event_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                        {/* Top Date & Folder Badge */}
                        <div className="relative z-10 p-5 flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
                            <Calendar className="w-3 h-3" /> {folder.event_date}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-400 text-[10px] font-mono font-bold border border-slate-700 flex items-center gap-1">
                            <Folder className="w-3 h-3" /> PR Folder
                          </span>
                        </div>

                        {/* Bottom Info & Open Folder Button */}
                        <div className="relative z-10 p-6 space-y-3">
                          <div>
                            <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition line-clamp-1">
                              {folder.event_name}
                            </h3>
                            <p className="text-xs text-slate-300 line-clamp-2 mt-1 font-normal">
                              {folder.description || 'PR Official Event Photo Folder'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                            <div className="flex items-center gap-3 text-xs font-mono font-bold text-amber-300">
                              <span>📸 {folder.photos_count || 0} Photos</span>
                              <span>🎥 {folder.videos_count || 0} Videos</span>
                            </div>

                            <button className="px-3.5 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md">
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Open Folder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (

              /* CASE C: ALL UPLOADED PHOTOS FEED STREAM */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {prPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setActiveLightboxMedia({ url: photo.url, title: photo.title, uploadedBy: photo.uploadedBy, uploadDate: photo.uploadDate, folderName: photo.eventTitle || photo.sportName })}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:border-amber-500/40 transition cursor-pointer group"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <GoogleDriveImage
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold border border-slate-700">
                        {photo.sportName}
                      </span>
                    </div>

                    <div className="p-4 space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{photo.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>By: {photo.uploadedBy}</span>
                        <span>{photo.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIGHTBOX PREVIEW MODAL */}
            {activeLightboxMedia && (
              <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
                  <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">{activeLightboxMedia.title}</h3>
                      <p className="text-xs text-amber-400 font-mono">Folder: {activeLightboxMedia.folderName || 'PR Folder'}</p>
                    </div>
                    <button
                      onClick={() => setActiveLightboxMedia(null)}
                      className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="max-h-[70vh] flex items-center justify-center bg-black p-2">
                    <GoogleDriveImage
                      src={activeLightboxMedia.url}
                      alt={activeLightboxMedia.title}
                      className="max-h-[65vh] w-auto object-contain rounded-xl"
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400 font-mono">
                    <span>Uploaded By: <strong className="text-white">{activeLightboxMedia.uploadedBy || 'PR Member'}</strong></span>
                    <span>Date: <strong className="text-white">{activeLightboxMedia.uploadDate || 'Recent'}</strong></span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SECTION 5: SUPER COORDINATOR PROFILE & SECURITY */}
        {(activeTab === 'profile') && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Profile Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    👑
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Super Coordinator Console
                      </h2>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Event Host Authority
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Username: <strong className="text-amber-600 dark:text-amber-400">@super_coordinator</strong>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Role: <strong className="text-slate-900 dark:text-white">President & Host Event Executive</strong> • Maharana Pratap Institutions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Key className="w-4 h-4 text-slate-950" />
                    <span>Change Account Password</span>
                  </button>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Official Portal</span>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">Super Coordinator</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Official Email</span>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">president.host@sems.edu</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Participating Colleges</span>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{ALL_COLLEGES.length} Institutions</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Active Sports Leagues</span>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-orange-500" />
                    <span className="font-extrabold text-xs text-orange-600 dark:text-orange-400">{ALL_12_SPORTS.length} Sports</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick System Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase font-bold">
                  <span>Coordinator Event Creations</span>
                  <BookOpen className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{coordinatorEvents.length} Events</div>
                <p className="text-xs text-slate-500">Live tournaments created across all 12 sports</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase font-bold">
                  <span>Master Participants Database</span>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{masterParticipants.length} Athletes</div>
                <p className="text-xs text-slate-500">Verified participant entries registered</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase font-bold">
                  <span>PR Photo Media Folders</span>
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{prFolders.length} Folders</div>
                <p className="text-xs text-slate-500">Official PR event folders & media albums</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500">Super Coordinator Security Credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passwordForm.newPass}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-md transition cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
