import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Layers, Filter, Search, Download, Calendar, MapPin, DollarSign, 
  CheckCircle2, Image as ImageIcon, ShieldAlert, RefreshCw, Eye, UserCheck, Phone, Mail, Award, BookOpen,
  FolderOpen, Folder, ArrowLeft, Camera, Film, X, Maximize2, Key, EyeOff, User, Lock, Building2, Crown, Upload, Edit2
} from 'lucide-react';

import { superCoordinatorApi, ALL_12_SPORTS, ALL_COLLEGES, matchesCollegeFilter } from '../../services/superCoordinatorApi';
import { SuperCoordinatorNavbar } from '../../components/superCoordinator/SuperCoordinatorNavbar';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportToCSV, exportToPDF } from '../../utils/pdfExporter';
import { getParticipationType, matchesParticipationTypeFilter } from '../../utils/rosterHelper';
import { exportResultsToExcel } from '../../utils/excelExporter';
import { GoogleDriveImage } from '../../components/common/GoogleDriveImage';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';

export const SuperCoordinatorDashboardPage = () => {
  const { addToast } = useToast();
  const { confirm, confirmDelete } = useConfirm() || {};
  const superCoordUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('sems_super_coord_user') || '{}');
    } catch {
      return {};
    }
  })();
  const superCoordName = superCoordUser?.name || 'Super Coordinator';

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

  // Student Photo and Academic Credentials State
  const [winnerRollNo, setWinnerRollNo] = useState('');
  const [winnerCourse, setWinnerCourse] = useState('B.Tech CSE');
  const [winnerYearSem, setWinnerYearSem] = useState('3rd Yr (6th Sem)');
  const [winnerPhotoUrl, setWinnerPhotoUrl] = useState('');
  const [winnerHighlights, setWinnerHighlights] = useState('');
  const [uploadingWinnerPhoto, setUploadingWinnerPhoto] = useState(false);

  const [runnerUpRollNo, setRunnerUpRollNo] = useState('');
  const [runnerUpCourse, setRunnerUpCourse] = useState('BCA');
  const [runnerUpYearSem, setRunnerUpYearSem] = useState('2nd Yr (4th Sem)');
  const [runnerUpPhotoUrl, setRunnerUpPhotoUrl] = useState('');
  const [runnerUpHighlights, setRunnerUpHighlights] = useState('');
  const [uploadingRunnerUpPhoto, setUploadingRunnerUpPhoto] = useState(false);

  // Edit Leaderboard Entry Modal State
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editSportId, setEditSportId] = useState('football');
  const [editMatchFormat, setEditMatchFormat] = useState('Team');
  const [editMatchGender, setEditMatchGender] = useState('Boys');
  const [editAthleticsSubEvent, setEditAthleticsSubEvent] = useState('100m Sprint');

  const [editWinnerName, setEditWinnerName] = useState('');
  const [editWinnerTeamName, setEditWinnerTeamName] = useState('');
  const [editWinnerCollegeId, setEditWinnerCollegeId] = useState('MPEC');
  const [editWinnerPhotoUrl, setEditWinnerPhotoUrl] = useState('');
  const [editWinnerRollNo, setEditWinnerRollNo] = useState('');
  const [editWinnerCourse, setEditWinnerCourse] = useState('B.Tech CSE');
  const [editWinnerYearSem, setEditWinnerYearSem] = useState('3rd Yr (6th Sem)');
  const [editWinnerHighlights, setEditWinnerHighlights] = useState('');
  const [uploadingEditWinnerPhoto, setUploadingEditWinnerPhoto] = useState(false);

  const [editRunnerUpName, setEditRunnerUpName] = useState('');
  const [editRunnerUpTeamName, setEditRunnerUpTeamName] = useState('');
  const [editRunnerUpCollegeId, setEditRunnerUpCollegeId] = useState('MIPS');
  const [editRunnerUpPhotoUrl, setEditRunnerUpPhotoUrl] = useState('');
  const [editRunnerUpRollNo, setEditRunnerUpRollNo] = useState('');
  const [editRunnerUpCourse, setEditRunnerUpCourse] = useState('BCA');
  const [editRunnerUpYearSem, setEditRunnerUpYearSem] = useState('2nd Yr (4th Sem)');
  const [editRunnerUpHighlights, setEditRunnerUpHighlights] = useState('');
  const [uploadingEditRunnerUpPhoto, setUploadingEditRunnerUpPhoto] = useState(false);

  // Student Photo Upload Handler
  const handleStudentPhotoUpload = async (file, target = 'winner') => {
    if (!file) return;
    const setUploading = target === 'winner' ? setUploadingWinnerPhoto : setUploadingRunnerUpPhoto;
    const setPhoto = target === 'winner' ? setWinnerPhotoUrl : setRunnerUpPhotoUrl;
    setUploading(true);
    try {
      const uploaded = await uploadFileToCloudinary(file, () => {}, 'sems_medals');
      if (uploaded?.url) {
        setPhoto(uploaded.url);
        addToast(`${target === 'winner' ? 'Winner' : 'Runner-Up'} photo uploaded!`, 'success');
        setUploading(false);
        return;
      }
    } catch (e) {
      console.warn('Cloudinary upload notice, using local file reader fallback:', e.message);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target.result);
      setUploading(false);
      addToast(`${target === 'winner' ? 'Winner' : 'Runner-Up'} photo attached!`, 'success');
    };
    reader.onerror = () => {
      setUploading(false);
      addToast('Failed to read photo', 'error');
    };
    reader.readAsDataURL(file);
  };

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
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab View: 'leaderboard' | 'coordinator_creations' | 'participants' | 'pr_gallery' | 'profile'
  const [activeTab, setActiveTab] = useState('leaderboard');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      addToast('Password must be at least 6 characters long', 'error');
      return;
    }

    const res = await superCoordinatorApi.changePassword(passwordForm.newPass);
    if (res.ok) {
      addToast('Super Coordinator Password updated in database successfully!', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } else {
      addToast(res.message || 'Failed to update password in database', 'error');
    }
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
    const sId = (evt.sportId || '').toLowerCase().replace(/_/g, '-');
    const sName = (evt.sportName || '').toLowerCase().replace(/_/g, '-');
    const sel = selectedSport.toLowerCase().replace(/_/g, '-');
    const isSelCricket = sel === 'cricket' || (sel.includes('cricket') && !sel.includes('gully'));
    const isSelGully = sel.includes('gully');

    if (isSelCricket) {
      if (sId.includes('gully') || sName.includes('gully')) return false;
      return sId.includes('cricket') || sName.includes('cricket');
    }
    if (isSelGully) {
      return sId.includes('gully') || sName.includes('gully');
    }
    return sId === sel || sName.includes(sel);
  });

  // Calculate Inter-College Leaderboard Standings
  const collegeStandings = ALL_COLLEGES.map((c) => {
    let winnerCount = 0;
    let runnerUpCount = 0;
    let totalPoints = 0;

    leaderboardEntries.forEach((entry) => {
      if (entry.winnerCollege === c.id || entry.winnerCollege === c.name || entry.winnerCollegeName === c.name) {
        winnerCount += 1;
        totalPoints += 5;
      }
      if (entry.runnerUpCollege === c.id || entry.runnerUpCollege === c.name || entry.runnerUpCollegeName === c.name) {
        runnerUpCount += 1;
        totalPoints += 3;
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
      winnerPoints: 5,
      winnerPhotoUrl,
      winnerRollNo,
      winnerCourse,
      winnerYearSem,
      winnerHighlights,

      // Runner-Up Details
      runnerUpName: rName,
      runnerUpTeamName: rTeam,
      runnerUpCollege: runnerObj.id,
      runnerUpCollegeName: runnerObj.name,
      runnerUpPoints: 3,
      runnerUpPhotoUrl,
      runnerUpRollNo,
      runnerUpCourse,
      runnerUpYearSem,
      runnerUpHighlights,

      date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    };

    // Sync student photo cards to sems_custom_medal_entries for Leaderboard showcase
    try {
      const medalEntryId = `medal-${newEntry.id}`;
      const sportEmoji = 
        sportObj.id.includes('badminton') ? '🏸' :
        sportObj.id.includes('cricket') ? '🏏' :
        sportObj.id.includes('football') ? '⚽' :
        sportObj.id.includes('chess') ? '♟️' :
        sportObj.id.includes('table-tennis') || sportObj.id.includes('tt') ? '🏓' :
        sportObj.id.includes('basketball') ? '🏀' :
        sportObj.id.includes('volleyball') ? '🏐' :
        sportObj.id.includes('kabaddi') ? '🤼' :
        sportObj.id.includes('athletics') ? '🏃‍♂️' :
        sportObj.id.includes('kho') ? '🏃' :
        sportObj.id.includes('tug') ? '🪢' : '🏆';

      const medalItem = {
        id: medalEntryId,
        sportId: sportObj.id,
        sportName: finalSportName,
        sportIcon: sportEmoji,
        gender: matchGender,
        matchFormat,
        subEvent: isAthletics ? athleticsSubEvent : `${sportObj.name} Final`,
        scoreSummary: 'Champion Match Declared by Super Coordinator',
        declaredAt: new Date().toISOString(),
        winner: {
          studentName: wName,
          teamName: wTeam,
          collegeCode: winnerObj.id,
          collegeName: winnerObj.name,
          medal: 'GOLD',
          rollNo: winnerRollNo.trim(),
          course: winnerCourse.trim(),
          yearSemester: winnerYearSem.trim(),
          photoUrl: winnerPhotoUrl,
          highlights: winnerHighlights.trim() || 'Champion Gold Medalist'
        },
        runnerUp: {
          studentName: rName,
          teamName: rTeam,
          collegeCode: runnerObj.id,
          collegeName: runnerObj.name,
          medal: 'SILVER',
          rollNo: runnerUpRollNo.trim(),
          course: runnerUpCourse.trim(),
          yearSemester: runnerUpYearSem.trim(),
          photoUrl: runnerUpPhotoUrl,
          highlights: runnerUpHighlights.trim() || 'Silver Medalist Runner-Up'
        }
      };

      const existingMedals = JSON.parse(localStorage.getItem('sems_custom_medal_entries') || '[]');
      const updatedMedals = [medalItem, ...existingMedals.filter((m) => m.id !== medalEntryId)];
      localStorage.setItem('sems_custom_medal_entries', JSON.stringify(updatedMedals));
    } catch (err) {
      console.error('Error syncing custom medal entries:', err);
    }

    const res = await superCoordinatorApi.saveLeaderboardEntries(leaderboardEntries, newEntry);
    if (res && res.entry) {
      setLeaderboardEntries([res.entry, ...leaderboardEntries]);
    } else {
      const freshEntries = await superCoordinatorApi.getLeaderboardEntries();
      setLeaderboardEntries(freshEntries);
    }

    // Trigger reactive updates on Leaderboard
    window.dispatchEvent(new Event('sems_leaderboard_updated'));
    window.dispatchEvent(new Event('storage'));

    addToast(`Result Saved! Winner: ${wName} (${winnerObj.id}) [+5 Pts] & Runner-Up: ${rName} (${runnerObj.id}) [+3 Pts] with Student Winner Cards!`, 'success');

    // Reset input fields
    setWinnerName('');
    setWinnerTeamName('');
    setWinnerPhotoUrl('');
    setWinnerRollNo('');
    setWinnerHighlights('');
    setRunnerUpName('');
    setRunnerUpTeamName('');
    setRunnerUpPhotoUrl('');
    setRunnerUpRollNo('');
    setRunnerUpHighlights('');
  };

  const handleDeleteLeaderboardEntry = async (id) => {
    try {
      let isConfirmed = false;
      const confirmFn = confirmDelete || confirm;
      if (typeof confirmFn === 'function') {
        isConfirmed = await confirmFn({
          title: 'Delete Leaderboard Entry',
          message: 'Are you sure you want to delete this leaderboard result entry? This will update college point totals.',
          confirmText: 'Yes, Delete',
          cancelText: 'Cancel',
          variant: 'danger'
        });
      } else {
        isConfirmed = window.confirm('Are you sure you want to delete this leaderboard result entry?');
      }

      if (!isConfirmed) return;

      // Remove from custom medal entries as well
      try {
        const medalEntryId = `medal-${id}`;
        const existingMedals = JSON.parse(localStorage.getItem('sems_custom_medal_entries') || '[]');
        const updatedMedals = existingMedals.filter((m) => m.id !== medalEntryId && m.id !== id);
        localStorage.setItem('sems_custom_medal_entries', JSON.stringify(updatedMedals));
      } catch (e) {}

      const res = await superCoordinatorApi.deleteLeaderboardEntry(id);
      if (res !== false) {
        setLeaderboardEntries((prev) => prev.filter((e) => e.id !== id));
        const freshEntries = await superCoordinatorApi.getLeaderboardEntries();
        if (freshEntries) setLeaderboardEntries(freshEntries);
        window.dispatchEvent(new Event('sems_leaderboard_updated'));
        window.dispatchEvent(new Event('storage'));
        addToast('Leaderboard entry removed from database', 'info');
      } else {
        addToast('Failed to delete leaderboard entry', 'error');
      }
    } catch (err) {
      console.error('Error deleting leaderboard entry:', err);
      addToast(err.message || 'Failed to delete leaderboard entry', 'error');
    }
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    const matchedSport = ALL_12_SPORTS.find((s) => s.id === entry.sportId || entry.sportName?.toLowerCase().includes(s.name.toLowerCase()));
    const sId = matchedSport?.id || entry.sportId || 'football';
    setEditSportId(sId);
    setEditMatchFormat(entry.matchFormat || 'Team');
    setEditMatchGender(entry.gender || 'Boys');
    setEditAthleticsSubEvent(entry.athleticsSubEvent || entry.subEvent || '100m Sprint');

    setEditWinnerName(entry.winnerName || '');
    setEditWinnerTeamName(entry.winnerTeamName || entry.winnerName || '');
    setEditWinnerCollegeId(entry.winnerCollege || 'MPEC');
    setEditWinnerPhotoUrl(entry.winnerPhotoUrl || '');
    setEditWinnerRollNo(entry.winnerRollNo || '');
    setEditWinnerCourse(entry.winnerCourse || 'B.Tech CSE');
    setEditWinnerYearSem(entry.winnerYearSem || '3rd Yr (6th Sem)');
    setEditWinnerHighlights(entry.winnerHighlights || '');

    setEditRunnerUpName(entry.runnerUpName || '');
    setEditRunnerUpTeamName(entry.runnerUpTeamName || entry.runnerUpName || '');
    setEditRunnerUpCollegeId(entry.runnerUpCollege || 'MIPS');
    setEditRunnerUpPhotoUrl(entry.runnerUpPhotoUrl || '');
    setEditRunnerUpRollNo(entry.runnerUpRollNo || '');
    setEditRunnerUpCourse(entry.runnerUpCourse || 'BCA');
    setEditRunnerUpYearSem(entry.runnerUpYearSem || '2nd Yr (4th Sem)');
    setEditRunnerUpHighlights(entry.runnerUpHighlights || '');

    setShowEditModal(true);
  };

  const handleEditStudentPhotoUpload = async (file, target = 'winner') => {
    if (!file) return;
    const setUploading = target === 'winner' ? setUploadingEditWinnerPhoto : setUploadingEditRunnerUpPhoto;
    const setPhoto = target === 'winner' ? setEditWinnerPhotoUrl : setEditRunnerUpPhotoUrl;
    setUploading(true);
    try {
      const uploaded = await uploadFileToCloudinary(file, () => {}, 'sems_medals');
      if (uploaded?.url) {
        setPhoto(uploaded.url);
        addToast(`${target === 'winner' ? 'Winner' : 'Runner-Up'} photo uploaded!`, 'success');
        setUploading(false);
        return;
      }
    } catch (e) {
      console.warn('Cloudinary upload notice, using local file reader fallback:', e.message);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target.result);
      setUploading(false);
      addToast(`${target === 'winner' ? 'Winner' : 'Runner-Up'} photo attached!`, 'success');
    };
    reader.onerror = () => {
      setUploading(false);
      addToast('Failed to read photo', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedEntry = async (e) => {
    if (e) e.preventDefault();
    if (!editingEntry) return;

    if (!editWinnerName.trim() && !editWinnerTeamName.trim()) {
      addToast('Please enter Winner Player Name or Winner Team Name', 'error');
      return;
    }
    if (!editRunnerUpName.trim() && !editRunnerUpTeamName.trim()) {
      addToast('Please enter Runner-Up Player Name or Runner-Up Team Name', 'error');
      return;
    }

    try {
      setSavingEdit(true);
      const isAthletics = editSportId.toLowerCase().includes('athletics');
      const sportObj = ALL_12_SPORTS.find((s) => s.id === editSportId) || ALL_12_SPORTS[0];
      const winnerObj = ALL_COLLEGES.find((c) => c.id === editWinnerCollegeId) || ALL_COLLEGES[0];
      const runnerObj = ALL_COLLEGES.find((c) => c.id === editRunnerUpCollegeId) || ALL_COLLEGES[1];

      const finalSportName = isAthletics ? `Athletics (${editAthleticsSubEvent})` : sportObj.name;
      const wName = editWinnerName.trim() || editWinnerTeamName.trim();
      const wTeam = editWinnerTeamName.trim() || editWinnerName.trim();
      const rName = editRunnerUpName.trim() || editRunnerUpTeamName.trim();
      const rTeam = editRunnerUpTeamName.trim() || editRunnerUpName.trim();

      const updatedPayload = {
        id: editingEntry.id,
        sportId: sportObj.id,
        sportName: finalSportName,
        athleticsSubEvent: isAthletics ? editAthleticsSubEvent : null,
        matchFormat: editMatchFormat,
        gender: editMatchGender,

        winnerName: wName,
        winnerTeamName: wTeam,
        winnerCollege: winnerObj.id,
        winnerCollegeName: winnerObj.name,
        winnerPoints: 5,
        winnerPhotoUrl: editWinnerPhotoUrl,
        winnerRollNo: editWinnerRollNo,
        winnerCourse: editWinnerCourse,
        winnerYearSem: editWinnerYearSem,
        winnerHighlights: editWinnerHighlights,

        runnerUpName: rName,
        runnerUpTeamName: rTeam,
        runnerUpCollege: runnerObj.id,
        runnerUpCollegeName: runnerObj.name,
        runnerUpPoints: 3,
        runnerUpPhotoUrl: editRunnerUpPhotoUrl,
        runnerUpRollNo: editRunnerUpRollNo,
        runnerUpCourse: editRunnerUpCourse,
        runnerUpYearSem: editRunnerUpYearSem,
        runnerUpHighlights: editRunnerUpHighlights,

        date: editingEntry.date || new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
      };

      // 1. Sync custom medal entries in localStorage for live showcase
      try {
        const medalEntryId = `medal-${editingEntry.id}`;
        const sportEmoji = 
          sportObj.id.includes('badminton') ? '🏸' :
          sportObj.id.includes('cricket') ? '🏏' :
          sportObj.id.includes('football') ? '⚽' :
          sportObj.id.includes('chess') ? '♟️' :
          sportObj.id.includes('table-tennis') || sportObj.id.includes('tt') ? '🏓' :
          sportObj.id.includes('basketball') ? '🏀' :
          sportObj.id.includes('volleyball') ? '🏐' :
          sportObj.id.includes('kabaddi') ? '🤼' :
          sportObj.id.includes('athletics') ? '🏃‍♂️' :
          sportObj.id.includes('kho') ? '🏃' :
          sportObj.id.includes('tug') ? '🪢' : '🏆';

        const medalItem = {
          id: medalEntryId,
          sportId: sportObj.id,
          sportName: finalSportName,
          sportIcon: sportEmoji,
          gender: editMatchGender,
          matchFormat: editMatchFormat,
          subEvent: isAthletics ? editAthleticsSubEvent : `${sportObj.name} Final`,
          scoreSummary: 'Champion Match Declared by Super Coordinator',
          declaredAt: new Date().toISOString(),
          winner: {
            studentName: wName,
            teamName: wTeam,
            collegeCode: winnerObj.id,
            collegeName: winnerObj.name,
            medal: 'GOLD',
            rollNo: editWinnerRollNo.trim(),
            course: editWinnerCourse.trim(),
            yearSemester: editWinnerYearSem.trim(),
            photoUrl: editWinnerPhotoUrl,
            highlights: editWinnerHighlights.trim() || 'Champion Gold Medalist'
          },
          runnerUp: {
            studentName: rName,
            teamName: rTeam,
            collegeCode: runnerObj.id,
            collegeName: runnerObj.name,
            medal: 'SILVER',
            rollNo: editRunnerUpRollNo.trim(),
            course: editRunnerUpCourse.trim(),
            yearSemester: editRunnerUpYearSem.trim(),
            photoUrl: editRunnerUpPhotoUrl,
            highlights: editRunnerUpHighlights.trim() || 'Silver Medalist Runner-Up'
          }
        };

        const existingMedals = JSON.parse(localStorage.getItem('sems_custom_medal_entries') || '[]');
        const updatedMedals = [medalItem, ...existingMedals.filter((m) => m.id !== medalEntryId)];
        localStorage.setItem('sems_custom_medal_entries', JSON.stringify(updatedMedals));
      } catch (err) {
        console.error('Error syncing custom medal entries on edit:', err);
      }

      // 2. Call backend update API
      await superCoordinatorApi.updateLeaderboardEntry(editingEntry.id, updatedPayload);

      // 3. Update state in-place
      setLeaderboardEntries((prev) =>
        prev.map((item) => (String(item.id) === String(editingEntry.id) ? { ...item, ...updatedPayload } : item))
      );

      // Reactive events
      window.dispatchEvent(new Event('sems_leaderboard_updated'));
      window.dispatchEvent(new Event('storage'));

      addToast(`Result Entry Updated! ${finalSportName} details and standings updated successfully.`, 'success');
      setShowEditModal(false);
      setEditingEntry(null);
    } catch (err) {
      console.error('Error updating leaderboard entry:', err);
      addToast(err.message || 'Failed to update result entry', 'error');
    } finally {
      setSavingEdit(false);
    }
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
      '1st Place Wins (5 Pts)',
      'Runner-Up Finishes (3 Pts)',
      'Total Championship Points'
    ];

    const rows = collegeStandings.map((c, idx) => [
      idx === 0 ? '1st Place (Gold 🥇)' : idx === 1 ? '2nd Place (Silver 🥈)' : idx === 2 ? '3rd Place (Bronze 🥉)' : `#${idx + 1}`,
      c.name,
      `${c.winnerCount} Wins (${c.winnerCount * 5} Pts)`,
      `${c.runnerUpCount} Finishes (${c.runnerUpCount * 3} Pts)`,
      `${c.totalPoints} PTS`
    ]);

    const success = exportToPDF(title, headers, rows, `InterCollege_Leaderboard_${new Date().toISOString().split('T')[0]}`);
    if (success !== false) {
      addToast('Exported Inter-College Championship Leaderboard PDF Report', 'success');
    }
  };

  // Handle Export Declared Match Results to Excel (.xlsx)
  const handleExportResultsExcel = (resultsToExport = leaderboardEntries) => {
    if (resultsToExport.length === 0) {
      addToast('No match results available to export', 'warning');
      return;
    }

    try {
      exportResultsToExcel(resultsToExport, { sport: selectedSport, gender: selectedGender });
      addToast(`Exported ${resultsToExport.length} match result records to Excel (.xlsx) successfully!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export results to Excel', 'error');
    }
  };

  // Filtered Participants Logic
  const filteredParticipants = masterParticipants.filter((p) => {
    let matchesSport = false;
    if (selectedSport === 'ALL') {
      matchesSport = true;
    } else {
      const sId = (p.sportId || '').toLowerCase().replace(/_/g, '-');
      const sName = (p.sportName || '').toLowerCase().replace(/_/g, '-');
      const sel = selectedSport.toLowerCase().replace(/_/g, '-');
      const isSelCricket = sel === 'cricket' || (sel.includes('cricket') && !sel.includes('gully'));
      const isSelGully = sel.includes('gully');

      if (isSelCricket) {
        matchesSport = (!sId.includes('gully') && !sName.includes('gully')) && (sId.includes('cricket') || sName.includes('cricket'));
      } else if (isSelGully) {
        matchesSport = sId.includes('gully') || sName.includes('gully');
      } else {
        matchesSport = sId === sel || sName.includes(sel);
      }
    }
    const matchesEvent = selectedEvent === 'ALL' ||
      (p.eventTitle || '').toLowerCase().trim() === selectedEvent.toLowerCase().trim() ||
      (p.eventTitle || '').toLowerCase().includes(selectedEvent.toLowerCase()) ||
      selectedEvent.toLowerCase().includes((p.eventTitle || '').toLowerCase());
    const pGender = (p.gender || '').toLowerCase().trim();
    const sGender = selectedGender.toLowerCase().trim();
    const isFemale = pGender.includes('female') || pGender.includes('girl') || pGender.includes('women') || pGender.includes('woman') || pGender === 'f';
    const isMale = !isFemale && (pGender.includes('male') || pGender.includes('boy') || pGender.includes('men') || pGender.includes('man') || pGender === 'm');
    const matchesGender = selectedGender === 'ALL' ||
      (sGender === 'male' ? isMale :
       sGender === 'female' ? isFemale :
       pGender.includes(sGender));
    const matchesCollege = matchesCollegeFilter(p.college, selectedCollege);
    const matchesType = matchesParticipationTypeFilter(p, selectedType);
    
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (p.name || '').toLowerCase().includes(q) ||
      (p.teamName || '').toLowerCase().includes(q) ||
      (p.mobile || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.college || '').toLowerCase().includes(q);

    return matchesSport && matchesEvent && matchesGender && matchesCollege && matchesType && matchesSearch;
  });

  // Handle Export Filtered Excel (CSV) Report
  const handleExportFilteredExcel = () => {
    if (filteredParticipants.length === 0) {
      addToast('No participant records matching current filters to export', 'warning');
      return;
    }

    const headers = [
      'Registration ID',
      'Registration Date',
      'Registration Time',
      'Participation Type',
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
      p.receiptId || p.registrationId || p.id || 'N/A',
      p.date || 'N/A',
      p.time || '10:00 AM',
      p.participationType || getParticipationType(p),
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
    <div className="super-coordinator-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] transition-colors font-spatial-sans pb-16 w-full overflow-x-hidden relative">
      
      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-40 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />

      {/* HEADER NAVBAR */}
      <SuperCoordinatorNavbar
        onRefresh={fetchDashboardData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPasswordModal={() => setShowPasswordModal(true)}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 space-y-4 sm:space-y-6 relative z-10 font-spatial-sans">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xs overflow-x-auto whitespace-nowrap scrollbar-none w-full max-w-full">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'leaderboard'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
            }`}
          >
            <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>🏆 Leaderboard & Winner Entry</span>
          </button>


          <button
            onClick={() => setActiveTab('match_results')}
            className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'match_results'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
            }`}
          >
            <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>📜 Declared Match Results ({leaderboardEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coordinator_creations')}
            className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'coordinator_creations'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>Coordinator Event Creations ({coordinatorEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'participants'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
            }`}
          >
            <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>Master Participant Database ({filteredParticipants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pr_gallery')}
            className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'pr_gallery'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
            }`}
          >
            <ImageIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>PR Media Gallery ({prPhotos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[48px] ${
              activeTab === 'profile'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#F4F2F7] dark:hover:bg-[#121625]'
            }`}
          >
            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>Profile & Credentials</span>
          </button>
        </div>



        {/* SECTION 0: INTER-COLLEGE CHAMPIONSHIP LEADERBOARD */}
        {(activeTab === 'leaderboard' || activeTab === 'dashboard') && (
          <div className="space-y-6 sm:space-y-8">
            
            {/* Header & Award Form Card */}
            <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2.5">
                    <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Super Coordinator Winner Declaration Console</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                    Select Game, Match Format & Gender, enter 1st & 2nd Place details, then click <strong className="text-blue-600 dark:text-blue-400 font-bold">Done</strong> to credit points (<strong className="text-emerald-600 dark:text-emerald-400 font-bold">1st = 5 Pts</strong> • <strong className="text-blue-600 dark:text-blue-400 font-bold">2nd = 3 Pts</strong>).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportLeaderboardPDF}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 shrink-0 min-h-[48px]"
                  title="Export Championship Leaderboard Standings as a PDF report"
                >
                  <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                  <span>Export Leaderboard PDF</span>
                </button>
              </div>

              {/* Multi-Step Winner Declaration Form */}
              <form onSubmit={handleAddLeaderboardPoints} className="space-y-6 sm:space-y-7">
                
                {/* ROW 1: Game Selection, Match Format (Dynamic per Sport), and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* 1. Select Game / Sport */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                      🎯 Select Game / Sport
                    </label>
                    <select
                      value={awardSportId}
                      onChange={(e) => handleAwardSportChange(e.target.value)}
                      className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                    >
                      {ALL_12_SPORTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Select Match Format (Dynamically restricted based on Sport) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                      🎾 Match Format
                    </label>
                    <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 min-h-[48px] items-center">
                      {getFormatsForSport(awardSportId).map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setMatchFormat(fmt.id)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer text-center min-h-[38px] ${
                            matchFormat === fmt.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Select Gender Category (Always shown for all sports) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                      ⚧️ Gender Category
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 min-h-[48px] items-center">
                      {[
                        { id: 'Boys', label: 'Boys' },
                        { id: 'Girls', label: 'Girls' },
                        { id: 'Mixed', label: 'Mixed' }
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setMatchGender(g.id)}
                          className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer text-center min-h-[38px] ${
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
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2 animate-fade-in">
                    <label className="block text-xs sm:text-sm font-mono font-black text-blue-600 dark:text-blue-400 uppercase">
                      🏃 Select Athletics Event / Discipline (Row-wise Selection) *
                    </label>
                    <select
                      value={athleticsSubEvent}
                      onChange={(e) => setAthleticsSubEvent(e.target.value)}
                      className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-500/50 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 pt-3 border-t border-slate-200 dark:border-slate-800">
                  
                  {/* Winner Box (1st Place) */}
                  <div className="p-5 sm:p-6 md:p-7 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50 dark:border-emerald-800/40">
                      <span className="text-xs sm:text-sm font-mono font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2">
                        🥇 Winner Details (1st Place)
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-mono font-black text-xs shadow-xs">
                        +5 POINTS
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs sm:text-sm">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          👤 Winner Player Name {matchFormat === 'Single' || matchFormat === 'Individual' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Single' || matchFormat === 'Individual'}
                          value={winnerName}
                          onChange={(e) => setWinnerName(e.target.value)}
                          placeholder="Enter Winner Player Name"
                          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          🛡️ Winner Team Name {matchFormat === 'Team' || matchFormat === 'Double' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Team' || matchFormat === 'Double'}
                          value={winnerTeamName}
                          onChange={(e) => setWinnerTeamName(e.target.value)}
                          placeholder="e.g. MPEC Titans"
                          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          🏫 Winner College Name *
                        </label>
                        <select
                          value={winnerCollegeId}
                          onChange={(e) => setWinnerCollegeId(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
                        >
                          {ALL_COLLEGES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Winner Student Photo Upload */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-300/60 dark:border-emerald-700/40">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group shadow-xs">
                          {winnerPhotoUrl ? (
                            <>
                              <img src={winnerPhotoUrl} alt="Winner" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setWinnerPhotoUrl('')}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <User className="w-7 h-7 text-slate-400" />
                          )}
                          {uploadingWinnerPhoto && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-mono">Uploading...</div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            📸 Winner Athlete Photo
                          </label>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleStudentPhotoUpload(e.target.files[0], 'winner')}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Winner Academic Credentials */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Roll No</label>
                          <input
                            type="text"
                            value={winnerRollNo}
                            onChange={(e) => setWinnerRollNo(e.target.value)}
                            placeholder="2101640100012"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Course / Branch</label>
                          <input
                            type="text"
                            value={winnerCourse}
                            onChange={(e) => setWinnerCourse(e.target.value)}
                            placeholder="B.Tech CSE"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Year / Sem</label>
                          <input
                            type="text"
                            value={winnerYearSem}
                            onChange={(e) => setWinnerYearSem(e.target.value)}
                            placeholder="3rd Yr (6th Sem)"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Match Highlight Quote</label>
                        <input
                          type="text"
                          value={winnerHighlights}
                          onChange={(e) => setWinnerHighlights(e.target.value)}
                          placeholder="e.g. Scored 18 smash winners in 3rd set"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Runner-Up Box (2nd Place) */}
                  <div className="p-5 sm:p-6 md:p-7 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800/60 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200/50 dark:border-blue-800/40">
                      <span className="text-xs sm:text-sm font-mono font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                        🥈 Runner-Up Details (2nd Place)
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-blue-500 text-white font-mono font-black text-xs shadow-xs">
                        +3 POINTS
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs sm:text-sm">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          👤 Runner-Up Player Name {matchFormat === 'Single' || matchFormat === 'Individual' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Single' || matchFormat === 'Individual'}
                          value={runnerUpName}
                          onChange={(e) => setRunnerUpName(e.target.value)}
                          placeholder="Enter Runner-Up Player Name"
                          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[48px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          🛡️ Runner-Up Team Name {matchFormat === 'Team' || matchFormat === 'Double' ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="text"
                          required={matchFormat === 'Team' || matchFormat === 'Double'}
                          value={runnerUpTeamName}
                          onChange={(e) => setRunnerUpTeamName(e.target.value)}
                          placeholder="e.g. MIPS Strikers"
                          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[48px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                          🏫 Runner-Up College Name *
                        </label>
                        <select
                          value={runnerUpCollegeId}
                          onChange={(e) => setRunnerUpCollegeId(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[48px]"
                        >
                          {ALL_COLLEGES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Runner-Up Student Photo Upload */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-blue-300/60 dark:border-blue-700/40">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-blue-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group shadow-xs">
                          {runnerUpPhotoUrl ? (
                            <>
                              <img src={runnerUpPhotoUrl} alt="Runner-Up" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setRunnerUpPhotoUrl('')}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <User className="w-7 h-7 text-slate-400" />
                          )}
                          {uploadingRunnerUpPhoto && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-mono">Uploading...</div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            📸 Runner-Up Athlete Photo
                          </label>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleStudentPhotoUpload(e.target.files[0], 'runnerup')}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Runner-Up Academic Credentials */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Roll No</label>
                          <input
                            type="text"
                            value={runnerUpRollNo}
                            onChange={(e) => setRunnerUpRollNo(e.target.value)}
                            placeholder="2201720200045"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Course / Branch</label>
                          <input
                            type="text"
                            value={runnerUpCourse}
                            onChange={(e) => setRunnerUpCourse(e.target.value)}
                            placeholder="BCA"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Year / Sem</label>
                          <input
                            type="text"
                            value={runnerUpYearSem}
                            onChange={(e) => setRunnerUpYearSem(e.target.value)}
                            placeholder="2nd Yr (4th Sem)"
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Match Highlight Quote</label>
                        <input
                          type="text"
                          value={runnerUpHighlights}
                          onChange={(e) => setRunnerUpHighlights(e.target.value)}
                          placeholder="e.g. Fought valiantly in tournament final"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* ROW 3: Submit / Done Button */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl transition flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 border border-blue-500/40 min-h-[52px]"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                    <span>Done / Save Result Entry & Award Points (+5 & +3 Pts)</span>
                  </button>
                </div>

              </form>
            </div>

            {/* Championship Standings Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md dark:shadow-xl space-y-3 p-3.5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  🏆 Overall Inter-College Championship Standings
                </h4>
                <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={handleExportLeaderboardPDF}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Download Leaderboard PDF Report"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Export PDF</span>
                  </button>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-blue-600 dark:text-blue-400">Updated Live</span>
                </div>
              </div>

              <div className="overflow-x-auto -mx-3.5 sm:mx-0">
                <table className="w-full text-left border-collapse min-w-[540px] sm:min-w-full">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px] uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-3 sm:p-4 whitespace-nowrap">Rank</th>
                      <th className="px-3 py-3 sm:p-4 whitespace-nowrap">College Name</th>
                      <th className="px-3 py-3 sm:p-4 whitespace-nowrap">🥇 1st Place Wins (5 Pts)</th>
                      <th className="px-3 py-3 sm:p-4 whitespace-nowrap">🥈 Runner-Up Finishes (3 Pts)</th>
                      <th className="px-3 py-3 sm:p-4 text-right whitespace-nowrap">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                    {collegeStandings.map((c, index) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-3 py-3 sm:p-4 font-mono font-black text-xs sm:text-base whitespace-nowrap">
                          {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `#${index + 1}`}
                        </td>
                        <td className="px-3 py-3 sm:p-4 font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap sm:whitespace-normal">
                          {c.name}
                        </td>
                        <td className="px-3 py-3 sm:p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs whitespace-nowrap">
                          {c.winnerCount} Wins ({c.winnerCount * 5} Pts)
                        </td>
                        <td className="px-3 py-3 sm:p-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs whitespace-nowrap">
                          {c.runnerUpCount} Finishes ({c.runnerUpCount * 3} Pts)
                        </td>
                        <td className="px-3 py-3 sm:p-4 font-mono font-black text-sm sm:text-lg text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {c.totalPoints} PTS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Declared Match Result Entries Log */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-6 space-y-4 shadow-md dark:shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  📜 Declared Match Result Entries Log ({leaderboardEntries.length})
                </h4>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {leaderboardEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No match result entries recorded yet.</p>
                ) : (
                  leaderboardEntries.map((entry) => (
                    <div key={entry.id} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:border-blue-500/40 transition">
                      
                      {/* Top Meta Bar: Game, Format, Gender & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] sm:text-xs border border-blue-500/20 flex items-center gap-1">
                            🎯 {entry.sportName}
                          </span>
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-[11px] sm:text-xs">
                            🎾 {entry.matchFormat || 'Single'}
                          </span>
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[11px] sm:text-xs">
                            ⚧️ {entry.gender || 'Boys'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono">
                          <span className="text-slate-500">{entry.date}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(entry)}
                            className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Edit match result entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLeaderboardEntry(entry.id)}
                            className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
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
                            <span>+5 PTS</span>
                          </div>
                          <div className="pt-1 space-y-1">
                            {entry.winnerPhotoUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-400 mb-1.5 shadow-2xs">
                                <img src={entry.winnerPhotoUrl} alt="Winner" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <p className="text-slate-900 dark:text-white font-extrabold text-sm">
                              👤 Winner Name: <span className="text-emerald-700 dark:text-emerald-300">{entry.winnerName || 'Winner'}</span>
                            </p>
                            {entry.winnerRollNo && (
                              <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                🎓 Roll No: <span className="font-bold text-slate-800 dark:text-slate-200">{entry.winnerRollNo}</span> {entry.winnerCourse && `(${entry.winnerCourse})`}
                              </p>
                            )}
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
                            <span>+3 PTS</span>
                          </div>
                          <div className="pt-1 space-y-1">
                            {entry.runnerUpPhotoUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-blue-400 mb-1.5 shadow-2xs">
                                <img src={entry.runnerUpPhotoUrl} alt="Runner-Up" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <p className="text-slate-900 dark:text-white font-extrabold text-sm">
                              👤 Runner-Up Name: <span className="text-blue-700 dark:text-blue-300">{entry.runnerUpName || 'Runner-Up'}</span>
                            </p>
                            {entry.runnerUpRollNo && (
                              <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                🎓 Roll No: <span className="font-bold text-slate-800 dark:text-slate-200">{entry.runnerUpRollNo}</span> {entry.runnerUpCourse && `(${entry.runnerUpCourse})`}
                              </p>
                            )}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2.5">
                      <span>Official Declared Match Results Table</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                      Comprehensive column-wise view of declared match outcomes with live filtering by Game Name and Gender.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleExportResultsExcel(filteredDeclaredResults)}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 min-h-[46px]"
                    title="Export Declared Match Results report with full details to Excel"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span>Export Excel (Full Details)</span>
                  </button>
                  <span className="px-4 py-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs sm:text-sm font-mono font-bold min-h-[46px] flex items-center">
                    Results: {filteredDeclaredResults.length} / {leaderboardEntries.length}
                  </span>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                
                {/* 1. Filter by Game / Sport */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                    🎯 Filter by Game / Sport
                  </label>
                  <select
                    value={resultFilterSport}
                    onChange={(e) => setResultFilterSport(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
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
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    ⚧️ Filter by Gender
                  </label>
                  <select
                    value={resultFilterGender}
                    onChange={(e) => setResultFilterGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-indigo-500 outline-none min-h-[48px]"
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
                    className="w-full py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs sm:text-sm transition cursor-pointer min-h-[48px]"
                  >
                    Reset Filters
                  </button>
                </div>

              </div>

              {/* Column-wise Results Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md dark:shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4 sm:p-5 whitespace-nowrap">Date</th>
                        <th className="p-4 sm:p-5 whitespace-nowrap">Game Name</th>
                        <th className="p-4 sm:p-5 whitespace-nowrap">Format</th>
                        <th className="p-4 sm:p-5 whitespace-nowrap">Gender</th>
                        <th className="p-4 sm:p-5 min-w-[260px]">🥇 Winner (1st Place)</th>
                        <th className="p-4 sm:p-5 min-w-[260px]">🥈 Runner-Up (2nd Place)</th>
                        <th className="p-4 sm:p-5 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs sm:text-sm">
                      {filteredDeclaredResults.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-12 text-center text-slate-500 italic">
                            No declared match results matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDeclaredResults.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-4 sm:p-5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                              {entry.date}
                            </td>
                            <td className="p-4 sm:p-5 font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              🎯 {entry.sportName}
                            </td>
                            <td className="p-4 sm:p-5 whitespace-nowrap">
                              <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-extrabold text-xs">
                                {entry.matchFormat || 'Single'}
                              </span>
                            </td>
                            <td className="p-4 sm:p-5 whitespace-nowrap">
                              <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">
                                {entry.gender || 'Boys'}
                              </span>
                            </td>
                            
                            {/* Winner Details Column */}
                            <td className="p-4 sm:p-5">
                              <div className="space-y-1">
                                <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                  <span className="text-emerald-600 dark:text-emerald-400">👤 {entry.winnerName || 'Winner'}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-mono font-bold">+5 Pts</span>
                                </div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  🛡️ Team: <span className="text-slate-900 dark:text-white">{entry.winnerTeamName || entry.winnerName || 'N/A'}</span>
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  🏫 College: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.winnerCollegeName || entry.winnerCollege}</span>
                                </div>
                              </div>
                            </td>

                            {/* Runner-Up Details Column */}
                            <td className="p-4 sm:p-5">
                              <div className="space-y-1">
                                <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                  <span className="text-blue-600 dark:text-blue-400">👤 {entry.runnerUpName || 'Runner-Up'}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-mono font-bold">+3 Pts</span>
                                </div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  🛡️ Team: <span className="text-slate-900 dark:text-white">{entry.runnerUpTeamName || entry.runnerUpName || 'N/A'}</span>
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  🏫 College: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.runnerUpCollegeName || entry.runnerUpCollege}</span>
                                </div>
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="p-4 sm:p-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 font-mono">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(entry)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Edit result entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLeaderboardEntry(entry.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Delete result entry"
                                >
                                  Delete
                                </button>
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
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
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
                        <tr key={evt.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/10 transition">
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
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
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Master Participant Database & Multi-Filter Control
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Filter participants by Game, Event Title, Gender, College, or Search Name
                </p>
              </div>

              <button
                onClick={handleExportFilteredExcel}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 min-h-[46px]"
                title="Export ONLY the displayed filtered student records below"
              >
                <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-950" />
                <span>Export Filtered Excel ({filteredParticipants.length})</span>
              </button>
            </div>

            {/* Filter Control Bar */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* 1. Sport / Game Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    🎯 Filter by Game
                  </label>
                  <select
                    value={selectedSport}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
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
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                    📋 Filter by Event Title
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-blue-500/40 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
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
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    ⚧️ Filter by Gender
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* 3. College Filter */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    🏫 Filter by College
                  </label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                  >
                    <option value="ALL">All Colleges</option>
                    {ALL_COLLEGES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Format Filter (Single / Double) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    🎽 Filter by Format
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                  >
                    <option value="ALL">All Formats</option>
                    <option value="INDIVIDUAL">Single (1 Player)</option>
                    <option value="DUO">Double (2 Players)</option>
                    <option value="TEAM">Team Event</option>
                  </select>
                </div>

                {/* 6. Live Search Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    🔍 Search Participant
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search name, mobile, team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-10 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

              </div>

              {/* Active Filter Chips */}
              <div className="flex items-center justify-between text-xs sm:text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  Showing <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredParticipants.length}</strong> of {masterParticipants.length} Participants
                </span>
                {(selectedSport !== 'ALL' || selectedEvent !== 'ALL' || selectedGender !== 'ALL' || selectedCollege !== 'ALL' || selectedType !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedSport('ALL');
                      setSelectedEvent('ALL');
                      setSelectedGender('ALL');
                      setSelectedCollege('ALL');
                      setSelectedType('ALL');
                      setSearchQuery('');
                    }}
                    className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
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
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase font-mono font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 sm:p-5">Reg Time</th>
                      <th className="p-4 sm:p-5">Game & Event Title</th>
                      <th className="p-4 sm:p-5">Team Name</th>
                      <th className="p-4 sm:p-5">College Name</th>
                      <th className="p-4 sm:p-5">Student Name</th>
                      <th className="p-4 sm:p-5">Mobile No</th>
                      <th className="p-4 sm:p-5">Gender</th>
                      <th className="p-4 sm:p-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs sm:text-sm">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-12 text-center text-slate-500 italic">
                          No participant records matching selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-mono">
                          <td className="p-4 sm:p-5 text-slate-700 dark:text-slate-300 font-mono">
                            <div>{p.date || '2026-08-20'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{p.time || '10:00 AM'}</div>
                          </td>
                          <td className="p-4 sm:p-5">
                            <div className="font-bold text-blue-600 dark:text-blue-400">{p.sportName}</div>
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{p.eventTitle || `${p.sportName} Event`}</div>
                          </td>
                          <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">{p.teamName}</td>
                          <td className="p-4 sm:p-5 font-bold text-slate-700 dark:text-slate-300">{p.college}</td>
                          <td className="p-4 sm:p-5 font-extrabold text-emerald-600 dark:text-emerald-400">{p.name}</td>
                          <td className="p-4 sm:p-5 text-slate-700 dark:text-slate-300">{p.mobile}</td>
                          <td className="p-4 sm:p-5 text-slate-700 dark:text-slate-300">{p.gender}</td>
                          <td className="p-4 sm:p-5">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
                      PR Media Folders & Photo Gallery Monitor
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                      Live Sync Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review all photo folders created by PR members and inspect uploaded photos in real-time.
                  </p>
                </div>
              </div>

              {/* View Mode Toggle: Folders vs All Photos Stream */}
              {!selectedPRFolder && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPrViewMode('folders')}
                    className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
                      prViewMode === 'folders'
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
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
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
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
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold">
                        📁 PR Event Album Folder
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Date: {selectedPRFolder.event_date}</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black">{selectedPRFolder.event_name}</h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                      {selectedPRFolder.description || 'Official media folder created by PR Team.'}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-xs font-mono font-bold text-blue-400">
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
                        className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:border-blue-500/50 transition cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative aspect-square bg-slate-950 overflow-hidden">
                          <GoogleDriveImage
                            src={item.media_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                            <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-[10px] font-black flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> View Fullscreen
                            </span>
                          </div>
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/90 text-blue-400 text-[10px] font-mono font-bold border border-slate-700">
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
                        className="group relative h-80 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md hover:shadow-2xl hover:border-blue-500/40 transition cursor-pointer flex flex-col justify-between"
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
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white flex items-center gap-1 shadow-md">
                            <Calendar className="w-3 h-3" /> {folder.event_date}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-blue-400 text-[10px] font-mono font-bold border border-slate-700 flex items-center gap-1">
                            <Folder className="w-3 h-3" /> PR Folder
                          </span>
                        </div>

                        {/* Bottom Info & Open Folder Button */}
                        <div className="relative z-10 p-6 space-y-3">
                          <div>
                            <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition line-clamp-1">
                              {folder.event_name}
                            </h3>
                            <p className="text-xs text-slate-300 line-clamp-2 mt-1 font-normal">
                              {folder.description || 'PR Official Event Photo Folder'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                            <div className="flex items-center gap-3 text-xs font-mono font-bold text-blue-300">
                              <span>📸 {folder.photos_count || 0} Photos</span>
                              <span>🎥 {folder.videos_count || 0} Videos</span>
                            </div>

                            <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md pointer-events-none">
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Open Folder</span>
                            </span>
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
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:border-blue-500/40 transition cursor-pointer group"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <GoogleDriveImage
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-blue-400 text-[10px] font-mono font-bold border border-slate-700">
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
                      <p className="text-xs text-blue-400 font-mono">Folder: {activeLightboxMedia.folderName || 'PR Folder'}</p>
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
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Main Profile Header Banner */}
            <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-6 sm:space-y-8">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-5 sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                    👑
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {superCoordName}
                      </h2>
                      <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Event Host Authority
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                      Username: <strong className="text-blue-600 dark:text-blue-400">@{superCoordUser?.username || 'super_coordinator'}</strong>
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      Role: <strong className="text-slate-900 dark:text-white">President & Host Event Executive</strong> • Maharana Pratap Institutions
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Official Portal</span>
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Super Coordinator</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Participating Colleges</span>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">{ALL_COLLEGES.length} Institutions</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Active Sports Leagues</span>
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-extrabold text-sm sm:text-base text-blue-600 dark:text-blue-400">{ALL_12_SPORTS.length} Sports</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick System Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-400 uppercase font-bold">
                  <span>Coordinator Event Creations</span>
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{coordinatorEvents.length} Events</div>
                <p className="text-xs sm:text-sm text-slate-500">Live tournaments created across all 12 sports</p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-400 uppercase font-bold">
                  <span>Master Participants Database</span>
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{masterParticipants.length} Athletes</div>
                <p className="text-xs sm:text-sm text-slate-500">Verified participant entries registered</p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-400 uppercase font-bold">
                  <span>PR Photo Media Folders</span>
                  <FolderOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{prFolders.length} Folders</div>
                <p className="text-xs text-slate-500">Official PR event folders & media albums</p>
              </div>
            </div>
          </div>
        )}

        {/* Super Coordinator Console Footer */}
        <footer className="mt-12 pt-6 pb-4 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left relative z-10">
          <p className="font-spatial-display italic text-xs sm:text-sm tracking-wide text-[#686370] dark:text-[#AAA4B8]">
            “It’s what you learn after you think you know it all that really counts”
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B8599] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7156A5] dark:bg-[#8B5CF6]" />
            <span>APEX 2026 Super Coordinator Console</span>
          </div>
        </footer>

      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-md transition cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEADERBOARD RESULT ENTRY MODAL */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto my-auto font-spatial-sans">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] sm:text-xs font-bold uppercase border border-blue-500/20">
                    ID: {editingEntry.id}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Edit Winner Declaration Entry</span>
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Update Game, Match Format, Gender, and 1st & 2nd Place Winner credentials. Changes will instantly recalculate leaderboard points.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEntry(null);
                }}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditedEntry} className="space-y-6">
              
              {/* Row 1: Game, Format, Gender */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* 1. Game / Sport */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                    🎯 Select Game / Sport *
                  </label>
                  <select
                    value={editSportId}
                    onChange={(e) => {
                      const newSport = e.target.value;
                      setEditSportId(newSport);
                      const formats = getFormatsForSport(newSport);
                      if (!formats.some((f) => f.id === editMatchFormat)) {
                        setEditMatchFormat(formats[0]?.id || 'Team');
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                  >
                    {ALL_12_SPORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Match Format */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    🎾 Match Format *
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 min-h-[48px] items-center">
                    {getFormatsForSport(editSportId).map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setEditMatchFormat(fmt.id)}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer text-center min-h-[36px] ${
                          editMatchFormat === fmt.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Gender Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                    ⚧️ Gender Category *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 min-h-[48px] items-center">
                    {[
                      { id: 'Boys', label: 'Boys' },
                      { id: 'Girls', label: 'Girls' },
                      { id: 'Mixed', label: 'Mixed' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setEditMatchGender(g.id)}
                        className={`py-2 px-1 rounded-xl text-xs font-extrabold transition cursor-pointer text-center min-h-[36px] ${
                          editMatchGender === g.id
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

              {/* Athletics Sub-Event Selector */}
              {editSportId.toLowerCase().includes('athletics') && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-mono font-black text-blue-600 dark:text-blue-400 uppercase">
                    🏃 Select Athletics Event / Discipline *
                  </label>
                  <select
                    value={editAthleticsSubEvent}
                    onChange={(e) => setEditAthleticsSubEvent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-blue-500/50 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none min-h-[48px]"
                  >
                    {ATHLETICS_SUB_EVENTS.map((subEv) => (
                      <option key={subEv} value={subEv}>
                        🏃 {subEv}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 2: Winner & Runner-Up Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-slate-800">
                
                {/* Winner Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="text-xs sm:text-sm font-mono font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2">
                      🥇 Winner Details (1st Place)
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-mono font-black text-xs shadow-xs">
                      +5 POINTS
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        👤 Winner Player Name {editMatchFormat === 'Single' || editMatchFormat === 'Individual' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={editWinnerName}
                        onChange={(e) => setEditWinnerName(e.target.value)}
                        placeholder="Enter Winner Player Name"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        🛡️ Winner Team Name {editMatchFormat === 'Team' || editMatchFormat === 'Double' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={editWinnerTeamName}
                        onChange={(e) => setEditWinnerTeamName(e.target.value)}
                        placeholder="e.g. MPEC Titans"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        🏫 Winner College Name *
                      </label>
                      <select
                        value={editWinnerCollegeId}
                        onChange={(e) => setEditWinnerCollegeId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-400 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                      >
                        {ALL_COLLEGES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Winner Photo */}
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-emerald-300/60 dark:border-emerald-700/40">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group shadow-xs">
                        {editWinnerPhotoUrl ? (
                          <>
                            <img src={editWinnerPhotoUrl} alt="Winner" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditWinnerPhotoUrl('')}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                        {uploadingEditWinnerPhoto && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-mono">Uploading...</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          📸 Winner Athlete Photo
                        </label>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleEditStudentPhotoUpload(e.target.files[0], 'winner')}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Winner Academic Credentials */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Roll No</label>
                        <input
                          type="text"
                          value={editWinnerRollNo}
                          onChange={(e) => setEditWinnerRollNo(e.target.value)}
                          placeholder="2101640100012"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Course / Branch</label>
                        <input
                          type="text"
                          value={editWinnerCourse}
                          onChange={(e) => setEditWinnerCourse(e.target.value)}
                          placeholder="B.Tech CSE"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Year / Sem</label>
                        <input
                          type="text"
                          value={editWinnerYearSem}
                          onChange={(e) => setEditWinnerYearSem(e.target.value)}
                          placeholder="3rd Yr (6th Sem)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Match Highlight Quote</label>
                      <input
                        type="text"
                        value={editWinnerHighlights}
                        onChange={(e) => setEditWinnerHighlights(e.target.value)}
                        placeholder="e.g. Scored 18 smash winners in 3rd set"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Runner-Up Card */}
                <div className="p-5 sm:p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800/60 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/50 dark:border-blue-800/40">
                    <span className="text-xs sm:text-sm font-mono font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                      🥈 Runner-Up Details (2nd Place)
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-blue-500 text-white font-mono font-black text-xs shadow-xs">
                      +3 POINTS
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        👤 Runner-Up Player Name {editMatchFormat === 'Single' || editMatchFormat === 'Individual' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={editRunnerUpName}
                        onChange={(e) => setEditRunnerUpName(e.target.value)}
                        placeholder="Enter Runner-Up Player Name"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        🛡️ Runner-Up Team Name {editMatchFormat === 'Team' || editMatchFormat === 'Double' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={editRunnerUpTeamName}
                        onChange={(e) => setEditRunnerUpTeamName(e.target.value)}
                        placeholder="e.g. MIPS Strikers"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                        🏫 Runner-Up College Name *
                      </label>
                      <select
                        value={editRunnerUpCollegeId}
                        onChange={(e) => setEditRunnerUpCollegeId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
                      >
                        {ALL_COLLEGES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Runner-Up Photo */}
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-blue-300/60 dark:border-blue-700/40">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-blue-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group shadow-xs">
                        {editRunnerUpPhotoUrl ? (
                          <>
                            <img src={editRunnerUpPhotoUrl} alt="Runner-Up" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditRunnerUpPhotoUrl('')}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                        {uploadingEditRunnerUpPhoto && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-mono">Uploading...</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          📸 Runner-Up Athlete Photo
                        </label>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleEditStudentPhotoUpload(e.target.files[0], 'runnerup')}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Runner-Up Academic Credentials */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Roll No</label>
                        <input
                          type="text"
                          value={editRunnerUpRollNo}
                          onChange={(e) => setEditRunnerUpRollNo(e.target.value)}
                          placeholder="2201720200045"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Course / Branch</label>
                        <input
                          type="text"
                          value={editRunnerUpCourse}
                          onChange={(e) => setEditRunnerUpCourse(e.target.value)}
                          placeholder="BCA"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Year / Sem</label>
                        <input
                          type="text"
                          value={editRunnerUpYearSem}
                          onChange={(e) => setEditRunnerUpYearSem(e.target.value)}
                          placeholder="2nd Yr (4th Sem)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">Match Highlight Quote</label>
                      <input
                        type="text"
                        value={editRunnerUpHighlights}
                        onChange={(e) => setEditRunnerUpHighlights(e.target.value)}
                        placeholder="e.g. Fought valiantly in tournament final"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEntry(null);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[48px]"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update / Save Result Entry (+5 & +3 Pts)</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
