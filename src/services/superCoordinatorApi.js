// Frontend Service for Super Coordinator (President / Event Host Portal)
import { galleryApi } from './galleryApi';

export const ALL_12_SPORTS = [
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓', coordinator: 'Amit Sharma', coordinatorEmail: 'tt.coord@sems.edu', category: 'Indoor', squadSize: '1 - 2 Players' },
  { id: 'badminton', name: 'Badminton', icon: '🏸', coordinator: 'Priya Verma', coordinatorEmail: 'badminton.coord@sems.edu', category: 'Indoor', squadSize: '1 - 2 Players' },
  { id: 'chess', name: 'Chess', icon: '♟️', coordinator: 'Rahul Saxena', coordinatorEmail: 'chess.coord@sems.edu', category: 'Mind Sport', squadSize: '1 Player' },
  { id: 'cricket', name: 'Cricket', icon: '🏏', coordinator: 'Rohan Gupta', coordinatorEmail: 'cricket.coord@sems.edu', category: 'Outdoor', squadSize: '11 - 15 Players' },
  { id: 'football', name: 'Football', icon: '⚽', coordinator: 'Vikramjit Singh', coordinatorEmail: 'football.coord@sems.edu', category: 'Outdoor', squadSize: '5 - 8 Players' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', coordinator: 'Neha Kapoor', coordinatorEmail: 'basketball.coord@sems.edu', category: 'Indoor/Outdoor', squadSize: '5 - 10 Players' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐', coordinator: 'Suresh Kumar', coordinatorEmail: 'volleyball.coord@sems.edu', category: 'Outdoor', squadSize: '6 - 10 Players' },
  { id: 'kabaddi', name: 'Kabaddi', icon: '🤼', coordinator: 'Deepak Yadav', coordinatorEmail: 'kabaddi.coord@sems.edu', category: 'Outdoor', squadSize: '7 - 12 Players' },
  { id: 'kho-kho', name: 'Kho-Kho', icon: '🏃', coordinator: 'Anita Singh', coordinatorEmail: 'khokho.coord@sems.edu', category: 'Outdoor', squadSize: '9 - 12 Players' },
  { id: 'athletics', name: 'Athletics', icon: '🏃‍♂️', coordinator: 'Manish Pandey', coordinatorEmail: 'athletics.coord@sems.edu', category: 'Track & Field', squadSize: '1 - 4 Players' },
  { id: 'tug-of-war', name: 'Tug of War', icon: '🪢', coordinator: 'Rajesh Mishra', coordinatorEmail: 'tugofwar.coord@sems.edu', category: 'Outdoor Arena', squadSize: '8 - 10 Players' },
  { id: 'gully-cricket', name: 'Gully Cricket', icon: '🏏', coordinator: 'Alok Tripathi', coordinatorEmail: 'gullycricket.coord@sems.edu', category: 'Street Pitch', squadSize: '5 - 8 Players' }
];

export const ALL_COLLEGES = [
  { id: 'MPEC', name: 'MPEC' },
  { id: 'MIPS', name: 'MIPS' },
  { id: 'MPCPS (KN142)', name: 'MPCPS (KN142)' },
  { id: 'MPCP', name: 'MPCP' },
  { id: 'MPCPS (BPharmacy)', name: 'MPCPS (BPharmacy)' },
  { id: 'MPDC', name: 'MPDC' },
  { id: 'MPCN&PS', name: 'MPCN&PS' },
  { id: 'MPAMC', name: 'MPAMC' },
  { id: 'MPCAMS', name: 'MPCAMS' },
  { id: 'EXTERNAL', name: 'EXTERNAL' }
];

const MOCK_MASTER_PARTICIPANTS = [
  {
    id: 'REG-2026-101',
    time: '09:30 AM',
    sportId: 'cricket',
    sportName: 'Cricket',
    eventTitle: 'Cricket Mens Premier League 2026',
    teamName: 'MPEC Strikers 11',
    college: 'MPEC',
    name: 'Aarav Sharma (Captain)',
    mobile: '+91 98765 10101',
    email: 'aarav.sharma@mpec.ac.in',
    gender: 'Boys',
    rollNo: '2101430100012',
    branch: 'CSE',
    year: '3rd Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-102',
    time: '10:15 AM',
    sportId: 'badminton',
    sportName: 'Badminton',
    eventTitle: 'Badminton Girls Singles Cup 2026',
    teamName: 'Ananya Verma',
    college: 'MIPS',
    name: 'Ananya Verma',
    mobile: '+91 98765 10102',
    email: 'ananya.v@mips.ac.in',
    gender: 'Girls',
    rollNo: '2101430100045',
    branch: 'IT',
    year: '2nd Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-103',
    time: '11:00 AM',
    sportId: 'table-tennis',
    sportName: 'Table Tennis',
    eventTitle: 'Table Tennis Open Championship',
    teamName: 'Rohan Gupta',
    college: 'MPCPS (KN142)',
    name: 'Rohan Gupta',
    mobile: '+91 98765 10103',
    email: 'rohan.g@mpcp.ac.in',
    gender: 'Boys',
    rollNo: '2201430100089',
    branch: 'Pharmacy',
    year: '1st Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-104',
    time: '11:45 AM',
    sportId: 'football',
    sportName: 'Football',
    eventTitle: 'Inter-College Football Fest 2026',
    teamName: 'MIPS Warriors FC',
    college: 'MIPS',
    name: 'Kunal Patel (Captain)',
    mobile: '+91 98765 10104',
    email: 'kunal.patel@mips.ac.in',
    gender: 'Boys',
    rollNo: '2101430100099',
    branch: 'ECE',
    year: '3rd Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-105',
    time: '12:30 PM',
    sportId: 'basketball',
    sportName: 'Basketball',
    eventTitle: 'Basketball 3v3 Shootout 2026',
    teamName: 'MPEC Hoopers',
    college: 'MPEC',
    name: 'Sneha Roy',
    mobile: '+91 98765 10105',
    email: 'sneha.roy@mpec.ac.in',
    gender: 'Girls',
    rollNo: '2001430100034',
    branch: 'ME',
    year: '4th Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-106',
    time: '01:15 PM',
    sportId: 'chess',
    sportName: 'Chess',
    eventTitle: 'Rapid Chess Grandmaster Cup',
    teamName: 'Vikramaditya Rao',
    college: 'MPCP',
    name: 'Vikramaditya Rao',
    mobile: '+91 98765 10106',
    email: 'vikram.rao@mpcp.ac.in',
    gender: 'Boys',
    rollNo: '2201430100055',
    branch: 'BPharmacy',
    year: '2nd Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-107',
    time: '02:00 PM',
    sportId: 'kabaddi',
    sportName: 'Kabaddi',
    eventTitle: 'Pro Kabaddi Inter-College Trophy',
    teamName: 'MPDC Raiders 7',
    college: 'MPDC',
    name: 'Deepak Kumar (Captain)',
    mobile: '+91 98765 10107',
    email: 'deepak.k@mpdc.ac.in',
    gender: 'Boys',
    rollNo: '2101430100077',
    branch: 'Dental',
    year: '3rd Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-108',
    time: '02:45 PM',
    sportId: 'volleyball',
    sportName: 'Volleyball',
    eventTitle: 'Smash Volleyball Championship',
    teamName: 'MPCPS Spikers',
    college: 'MPCPS (KN142)',
    name: 'Pooja Pandey',
    mobile: '+91 98765 10108',
    email: 'pooja.p@mpcps.ac.in',
    gender: 'Girls',
    rollNo: '2201430100018',
    branch: 'CSE',
    year: '1st Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-109',
    time: '03:30 PM',
    sportId: 'athletics',
    sportName: 'Athletics',
    eventTitle: '100m Sprint & Track Event 2026',
    teamName: 'Aditya Singh',
    college: 'MPEC',
    name: 'Aditya Singh',
    mobile: '+91 98765 10109',
    email: 'aditya.s@mpec.ac.in',
    gender: 'Boys',
    rollNo: '2101430100023',
    branch: 'CSE',
    year: '3rd Year',
    status: 'VERIFIED'
  },
  {
    id: 'REG-2026-110',
    time: '04:15 PM',
    sportId: 'tug-of-war',
    sportName: 'Tug of War',
    eventTitle: 'Power Tug of War Challenge',
    teamName: 'MPCN Titans 8',
    college: 'MPCN&PS',
    name: 'Saurabh Mishra',
    mobile: '+91 98765 10110',
    email: 'saurabh.m@mpcn.ac.in',
    gender: 'Boys',
    rollNo: '2001430100067',
    branch: 'Nursing',
    year: '4th Year',
    status: 'VERIFIED'
  }
];

export const superCoordinatorApi = {
  // Get Coordinator Event Creation History — from localStorage only (real data)
  getCoordinatorEvents: async () => {
    const eventsList = [];
    const seenIds = new Set();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sems_coord_events_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach((item) => {
              if (item && item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                eventsList.push({
                  id: item.id,
                  sportId: item.sportId || item.sportName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'sport',
                  sportName: item.sportName || 'Sport',
                  eventTitle: item.title || item.eventTitle || 'Tournament Event',
                  coordinatorName: item.contactInfo?.name || item.contactName || 'Coordinator',
                  coordinatorEmail: item.contactInfo?.email || item.contactEmail || '',
                  createdDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : (item.regStartDate || ''),
                  regStartDate: item.regStartDate || '',
                  regEndDate: item.regEndDate || '',
                  tournStartDate: item.tournStartDate || '',
                  tournEndDate: item.tournEndDate || '',
                  venue: item.venue || '',
                  teamFee: item.entryFee || item.teamFee || 0,
                  minPlayers: item.minPlayers || 1,
                  maxPlayers: item.maxPlayers || 1,
                  category: item.category || 'Open',
                  status: item.status || 'Published',
                  registeredCount: item.registeredCount || 0,
                  maxRegistrations: item.maxRegistrations || 64
                });
              }
            });
          }
        } catch (e) {}
      }
    }
    return eventsList;
  },

  // Get Master Participants — from localStorage with rich mock fallback
  getMasterParticipants: async () => {
    const list = [];
    const seenIds = new Set();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sems_registrations') || key.startsWith('sems_total_participation_') || key === 'sems_admin_registrations')) {
        try {
          const storedList = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(storedList)) {
            storedList.forEach((p) => {
              if (p && p.id && !seenIds.has(p.id)) {
                seenIds.add(p.id);
                list.push({
                  id: p.id,
                  time: p.registrationTime || p.time || '10:00 AM',
                  sportId: (p.gameSport || p.sportName || p.sport || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  sportName: p.gameSport || p.sportName || p.sport || 'Sport',
                  eventTitle: p.eventTitle || p.eventName || p.title || `${p.gameSport || p.sportName || 'Sport'} Event`,
                  teamName: p.teamName || p.participantName || p.name || 'Participant',
                  college: p.collegeName || p.college || 'MPEC',
                  name: p.participantName || p.studentName || p.name || 'Student',
                  mobile: p.mobileNo || p.mobile || '',
                  email: p.email || '',
                  gender: p.gender || 'Boys',
                  rollNo: p.rollNumber || p.rollNo || '2101430100012',
                  branch: p.branch || p.department || 'CSE',
                  year: p.year || '3rd Year',
                  status: p.registrationStatus || p.status || 'VERIFIED',
                  feePaid: p.feePaid || p.entryFee || p.amount || 0
                });
              }
            });
          }
        } catch (e) {}
      }
    }

    if (list.length === 0) {
      try {
        localStorage.setItem('sems_admin_registrations', JSON.stringify(MOCK_MASTER_PARTICIPANTS));
      } catch (e) {}
      return MOCK_MASTER_PARTICIPANTS;
    }

    return list;
  },

  // Get PR Event Folders (Created by PR Members)
  getPREventFolders: async () => {
    try {
      return await galleryApi.getEvents();
    } catch (e) {
      return [];
    }
  },

  // Get Media Items inside a specific PR Event Folder
  getPRFolderMedia: async (folderId) => {
    try {
      return await galleryApi.getEventMedia(folderId);
    } catch (e) {
      return { all: [], photos: [], videos: [] };
    }
  },

  // Get All PR Uploaded Media Photos across all folders
  getPRPhotos: async () => {
    try {
      const events = await galleryApi.getEvents();
      const allMedia = [];
      for (const ev of events) {
        const evMedia = await galleryApi.getMediaByEventId(ev.id);
        if (Array.isArray(evMedia)) {
          evMedia.forEach((m) => {
            allMedia.push({
              id: m.id || `PR-${Date.now()}`,
              eventId: ev.id,
              eventTitle: ev.event_name,
              sportId: (ev.event_name || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
              sportName: ev.event_name || 'Sports Highlight',
              title: m.title || 'PR Shot',
              url: m.media_url,
              mediaType: m.media_type || 'image',
              uploadedBy: m.uploaded_by || 'PR Team Member',
              uploadDate: m.uploaded_at ? new Date(m.uploaded_at).toLocaleString() : 'Recent'
            });
          });
        }
      }
      return allMedia;
    } catch (e) {
      return [];
    }
  },

  // Get Inter-College Leaderboard Entries (localStorage only — no mock defaults)
  getLeaderboardEntries: async () => {
    try {
      const stored = localStorage.getItem('sems_super_coord_leaderboard');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  // Save Inter-College Leaderboard Entries
  saveLeaderboardEntries: async (entries) => {
    try {
      localStorage.setItem('sems_super_coord_leaderboard', JSON.stringify(entries));
      window.dispatchEvent(new Event('sems_leaderboard_updated'));
      return true;
    } catch (e) {
      return false;
    }
  }
};
