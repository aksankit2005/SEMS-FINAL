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
  { id: 'MPEC', name: 'MPEC (Maharana Pratap Engineering College)' },
  { id: 'MIPS', name: 'MIPS (Maharana Pratap Institute of Professional Studies)' },
  { id: 'MPCPS (KN142)', name: 'MPCPS (KN142)' },
  { id: 'MPCP', name: 'MPCP (Maharana Pratap College of Pharmacy)' },
  { id: 'MPCPS (BPharmacy)', name: 'MPCPS (BPharmacy)' },
  { id: 'MPDC', name: 'MPDC (Maharana Pratap Dental College)' },
  { id: 'MPCN&PS', name: 'MPCN&PS (Maharana Pratap College of Nursing & Paramedical Sciences)' },
  { id: 'MPAMC', name: 'MPAMC (Maharana Pratap Ayurvedic Medical College)' },
  { id: 'MPCAMS', name: 'MPCAMS (Maharana Pratap College of Ayurvedic Medical Sciences)' },
  { id: 'EXTERNAL', name: 'Other External / Guest Colleges' }
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

  // Get Master Participants — from localStorage only (real registrations)
  getMasterParticipants: async () => {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sems_registrations_') || key.startsWith('sems_total_participation_'))) {
        try {
          const storedList = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(storedList)) {
            storedList.forEach((p) => {
              if (p && p.id && !list.some((item) => item.id === p.id)) {
                list.push({
                  id: p.id,
                  time: p.time || '10:00 AM',
                  sportId: (p.gameName || p.sportName || p.sport || 'sport').toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  sportName: p.gameName || p.sportName || p.sport || 'Sport',
                  eventTitle: p.eventTitle || p.eventName || p.title || `${p.gameName || p.sportName || 'Sport'} Event`,
                  teamName: p.teamName || p.name || 'Participant',
                  college: p.collegeName || p.college || 'MPEC',
                  name: p.name || 'Student',
                  mobile: p.mobileNo || p.mobile || '',
                  email: p.email || '',
                  gender: p.gender || 'Boys',
                  status: 'VERIFIED'
                });
              }
            });
          }
        } catch (e) {}
      }
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
