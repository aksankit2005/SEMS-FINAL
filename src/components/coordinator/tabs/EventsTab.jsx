import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Layers, CheckCircle2, Clock, XCircle, Edit, Trash2, Eye, 
  Upload, Crop, Image as ImageIcon, Users, DollarSign, ShieldAlert, Download, 
  Search, Filter, ToggleLeft, ToggleRight, X, AlertCircle, Sparkles, FileText, Phone, Mail
} from 'lucide-react';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { ImageCropperModal } from '../../common/ImageCropperModal';
import { useToast } from '../../../context/ToastContext';
import { exportToPDF, exportToCSV } from '../../../utils/pdfExporter';

import { SPORT_PLAYER_BOUNDS, resolveSportKey } from '../../../data/sportsConfig';

export const EventsTab = ({ user }) => {
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Participant Drawer/Modal state
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Image Cropper Modal state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState(null);

  const defaultSportKey = resolveSportKey(user?.assignedSport || user?.sportName);
  const defaultBounds = SPORT_PLAYER_BOUNDS[defaultSportKey] || { min: 1, max: 10 };
  const isTableTennis = defaultSportKey === 'table-tennis';
  const isBadminton = defaultSportKey === 'badminton' || (user?.sportName || user?.sport || '').toLowerCase().includes('badminton');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    sportName: user?.sportName || 'Sports',
    coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-25',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-03',
    entryFee: 400,
    singlesFee: 300,
    doublesFee: 600,
    minPlayers: defaultBounds.min,
    maxPlayers: defaultBounds.max,
    teamSize: `${defaultBounds.min} - ${defaultBounds.max} Players`,
    maxRegistrations: 64,

    registeredCount: 0,
    venue: 'Indoor Sports Complex Court A',
    category: 'Open', // Boys, Girls, Mixed, Open
    status: 'Published', // Draft, Published, Closed
    rules: [
      'Official tournament rules apply.',
      'College Student ID & Pass mandatory.',
      'Sports jersey and proper shoes required.'
    ],
    requiredDocuments: ['College Student ID', 'Aadhaar Card / Govt ID'],
    contactName: user?.coordinatorName || '',
    contactEmail: user?.email || '',
    contactPhone: ''
  });

  const [rulesInput, setRulesInput] = useState('');
  const [docInput, setDocInput] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const list = await coordinatorApi.getEvents();
      setEvents(list);
    } catch (err) {
      addToast('Error loading coordinator events', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset form on edit
  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    const sKey = resolveSportKey(user?.assignedSport || eventObj.sportName || eventObj.title);
    const bounds = SPORT_PLAYER_BOUNDS[sKey] || { min: 1, max: 10 };
    const minP = eventObj.minPlayers !== undefined ? Number(eventObj.minPlayers) : bounds.min;
    const maxP = eventObj.maxPlayers !== undefined ? Number(eventObj.maxPlayers) : bounds.max;

    setFormData({
      title: eventObj.title || '',
      sportName: user?.sportName || eventObj.sportName,
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-08-25',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-03',
      entryFee: eventObj.entryFee !== undefined ? eventObj.entryFee : 400,
      singlesFee: eventObj.singlesFee !== undefined ? eventObj.singlesFee : 300,
      doublesFee: eventObj.doublesFee !== undefined ? eventObj.doublesFee : 600,
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: eventObj.teamSize || `${minP} - ${maxP} Players`,
      maxRegistrations: eventObj.maxRegistrations || 64,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Indoor Sports Complex',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID'],
      contactName: eventObj.contactInfo?.name || user?.coordinatorName,
      contactEmail: eventObj.contactInfo?.email || user?.email,
      contactPhone: eventObj.contactInfo?.phone || '+91 98765 43210'
    });
    setRulesInput(Array.isArray(eventObj.rules) ? eventObj.rules.join('\n') : '');
    setDocInput(Array.isArray(eventObj.requiredDocuments) ? eventObj.requiredDocuments.join('\n') : '');
    setShowCreateModal(true);
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    const sKey = resolveSportKey(user?.assignedSport || user?.sportName);
    const bounds = SPORT_PLAYER_BOUNDS[sKey] || { min: 1, max: 10 };

    setFormData({
      title: `${user?.sportName || 'Sports'} Championship 2026`,
      sportName: user?.sportName || 'Sports',
      coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
      description: `Official inter-college ${user?.sportName} tournament. Register your entries today!`,
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-25',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-03',
      entryFee: 400,
      singlesFee: 300,
      doublesFee: 600,
      minPlayers: bounds.min,
      maxPlayers: bounds.max,
      teamSize: `${bounds.min} - ${bounds.max} Players`,
      maxRegistrations: 64,

      registeredCount: 0,
      venue: 'Main Sports Complex',
      category: 'Open',
      status: 'Published',
      rules: isTableTennis ? [
        '1. GAMES ARE PLAYED TO 11 POINTS (Must win by 2 points. Best 3 of 5 Games).',
        '2. ALTERNATE SERVES EVERY TWO POINTS (Deuce at 10-10 alternates every point).',
        '3. TOSS THE BALL STRAIGHT UP AT LEAST 6" WHEN SERVING.',
        '4. THE SERVE CAN LAND ANYWHERE IN SINGLES.',
        '5. DOUBLES SERVES MUST GO RIGHT COURT TO RIGHT COURT.',
        '6. A SERVE THAT TOUCHES THE NET ON THE WAY OVER IS A "LET" (Replayed).',
        '7. ALTERNATE HITTING IN A DOUBLES RALLY.',
        '8. VOLLEYS ARE NOT ALLOWED (Ball must bounce on your side first).',
        '9. IF YOUR HIT BOUNCES BACK OVER THE NET BY ITSELF IT IS YOUR POINT.',
        '10. TOUCHING THE BALL WITH YOUR PADDLE HAND IS ALLOWED.',
        '11. YOU MAY NOT TOUCH THE TABLE WITH YOUR NON-PADDLE HAND.',
        '12. AN "EDGE" BALL BOUNCING OFF THE HORIZONTAL TABLE TOP SURFACE IS GOOD.',
        '13. HONOR SYSTEM APPLIES TO DISAGREEMENTS.'
      ] : isBadminton ? [
        '1. Matches are played best of 3 sets of 21 points each.',
        '2. BWF standard laws of badminton apply.',
        '3. Service must be delivered diagonally into opponent court below waist level.',
        '4. Non-marking shoes and official sports kit mandatory.',
        '5. College ID card must be presented prior to match time.'
      ] : ['Official tournament rules apply.', 'College ID mandatory.'],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card'],
      contactName: user?.coordinatorName || '',
      contactEmail: user?.email || '',
      contactPhone: ''
    });
    setRulesInput(isTableTennis ? `1. GAMES ARE PLAYED TO 11 POINTS (Must win by 2 points. Best 3 of 5 Games).
2. ALTERNATE SERVES EVERY TWO POINTS (Deuce at 10-10 alternates every point).
3. TOSS THE BALL STRAIGHT UP AT LEAST 6" WHEN SERVING.
4. THE SERVE CAN LAND ANYWHERE IN SINGLES.
5. DOUBLES SERVES MUST GO RIGHT COURT TO RIGHT COURT.
6. A SERVE THAT TOUCHES THE NET ON THE WAY OVER IS A "LET" (Replayed).
7. ALTERNATE HITTING IN A DOUBLES RALLY.
8. VOLLEYS ARE NOT ALLOWED (Ball must bounce on your side first).
9. IF YOUR HIT BOUNCES BACK OVER THE NET BY ITSELF IT IS YOUR POINT.
10. TOUCHING THE BALL WITH YOUR PADDLE HAND IS ALLOWED.
11. YOU MAY NOT TOUCH THE TABLE WITH YOUR NON-PADDLE HAND.
12. AN "EDGE" BALL BOUNCING OFF THE HORIZONTAL TABLE TOP SURFACE IS GOOD.
13. HONOR SYSTEM APPLIES TO DISAGREEMENTS.` : isBadminton ? `1. Matches are played best of 3 sets of 21 points each.
2. BWF standard laws of badminton apply.
3. Service must be delivered diagonally into opponent court below waist level.
4. Non-marking shoes and official sports kit mandatory.
5. College ID card must be presented prior to match time.` : 'Official tournament rules apply.\nCollege Student ID & Pass mandatory.');
    setDocInput('College Student ID Card\nAadhaar Card / Govt ID');
    setShowCreateModal(true);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperRawSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedDataUrl) => {
    setFormData((prev) => ({ ...prev, coverImage: croppedDataUrl }));
    addToast('Cover banner cropped and attached successfully!', 'success');
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
    }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('Event Title is required', 'error');
      return;
    }

    const rulesArr = rulesInput.split('\n').map((r) => r.trim()).filter(Boolean);
    const docsArr = docInput.split('\n').map((d) => d.trim()).filter(Boolean);

    const sKey = resolveSportKey(user?.assignedSport || formData.sportName);
    const bounds = SPORT_PLAYER_BOUNDS[sKey] || { min: 1, max: 10 };
    const minP = formData.minPlayers !== undefined ? Number(formData.minPlayers) : bounds.min;
    const maxP = formData.maxPlayers !== undefined ? Number(formData.maxPlayers) : bounds.max;

    const eventPayload = {
      ...formData,
      sportId: user?.assignedSport || defaultSportKey,
      sportName: user?.sportName || formData.sportName,
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: formData.teamSize || `${minP} - ${maxP} Players`,
      rules: rulesArr,
      requiredDocuments: docsArr,
      contactInfo: {
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone
      }
    };

    try {
      if (editingEvent) {
        const updated = await coordinatorApi.updateEvent(editingEvent.id, eventPayload);
        setEvents((prev) => prev.map((item) => (item.id === editingEvent.id ? updated : item)));
        addToast(`Registration event "${updated.title}" updated!`, 'success');
      } else {
        const created = await coordinatorApi.createEvent(eventPayload);
        setEvents((prev) => [created, ...prev]);
        addToast(`New registration event "${created.title}" published!`, 'success');
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      addToast('Failed to save registration event', 'error');
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete event "${title}"?`)) {
      try {
        await coordinatorApi.deleteEvent(id);
        setEvents((prev) => prev.filter((item) => item.id !== id));
        addToast('Event deleted successfully', 'info');
      } catch (err) {
        addToast('Failed to delete event', 'error');
      }
    }
  };

  const handleToggleRegistrationOpen = async (eventObj) => {
    const isCurrentlyOpen = eventObj.registrationOpen !== false && eventObj.status !== 'Closed';
    const newRegOpen = !isCurrentlyOpen;
    const newStatus = newRegOpen ? (eventObj.status === 'Closed' ? 'Published' : eventObj.status) : 'Closed';
    try {
      const updated = await coordinatorApi.updateEvent(eventObj.id, {
        registrationOpen: newRegOpen,
        status: newStatus
      });
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, registrationOpen: newRegOpen, status: newStatus } : item)));
      if (!newRegOpen) {
        addToast(`🔒 Registration closed for "${eventObj.title}". Fixtures can now be scheduled!`, 'success');
      } else {
        addToast(`🔓 Registration reopened for "${eventObj.title}". Students can now register.`, 'info');
      }
    } catch (err) {
      addToast('Failed to toggle registration status', 'error');
    }
  };

  const handleToggleStatus = async (eventObj) => {
    const statusCycle = {
      'Draft': 'Upcoming',
      'Upcoming': 'Published',
      'Published': 'Closed',
      'Closed': 'Draft'
    };
    const nextStatus = statusCycle[eventObj.status] || 'Published';
    try {
      const updated = await coordinatorApi.updateEvent(eventObj.id, { status: nextStatus });
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? updated : item)));
      addToast(`Event status changed to ${nextStatus}`, 'info');
    } catch (err) {
      addToast('Status toggle failed', 'error');
    }
  };

  const handleViewParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    const allRegs = await coordinatorApi.getRegistrations();
    const eventRegs = allRegs.filter(
      (r) => r.eventId === eventObj.id || r.sportId === eventObj.sportId || r.sport === eventObj.sportName
    );
    setParticipants(eventRegs.length > 0 ? eventRegs : allRegs);
  };

  // Dashboard Stats calculation
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'Published').length;
  const closedEvents = events.filter((e) => e.status === 'Closed').length;
  const totalRegCount = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalRevenue = events.reduce((acc, curr) => acc + ((curr.registeredCount || 0) * (curr.entryFee || 0)), 0);
  const totalAvailableSlots = events.reduce((acc, curr) => acc + Math.max(0, (curr.maxRegistrations || 64) - (curr.registeredCount || 0)), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* TOP DASHBOARD STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Active (Published)</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{activeEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Registration Closed</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{closedEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Assigned Sport</span>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.sportName || 'Badminton'}</p>
        </div>
      </div>

      {/* SECTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-indigo-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase">
              COORDINATOR REGISTRATION PORTAL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• {user?.sportName || 'Badminton'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Sport Event Creation & Registration Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Create sport events, upload cover banners, and track real-time participant registrations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Registration Event</span>
        </button>
      </div>

      {/* EVENTS MANAGEMENT TABLE & CARDS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading {user?.sportName} registration events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-soft dark:shadow-md">
            <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Registration Events Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Click the "Create Registration Event" button above to publish your first tournament registration event for {user?.sportName}.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              + Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const registered = event.registeredCount || 0;
              const limit = event.maxRegistrations || 64;
              const percent = Math.min(100, Math.round((registered / limit) * 100));
              const isRegOpen = event.registrationOpen !== false && event.status !== 'Closed';

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft dark:shadow-lg hover:border-blue-500/50 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  {/* Cover Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent" />

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md ${
                        event.status === 'Published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : event.status === 'Upcoming'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : event.status === 'Closed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        ● {event.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md ${
                        isRegOpen
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isRegOpen ? '● Reg: OPEN' : '🔒 Reg: CLOSED (Fixtures Ready)'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold border border-slate-800">
                        {event.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black text-amber-400 border border-slate-800">
                      Fee: Singles ₹{event.singlesFee !== undefined ? event.singlesFee : 300} | Doubles ₹{event.doublesFee !== undefined ? event.doublesFee : 600}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                        {event.sportName}
                      </span>
                      <h3 className="text-lg font-black text-white leading-tight truncate">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Registration Dates</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">{event.regStartDate} to {event.regEndDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Tournament Dates</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">{event.tournStartDate} to {event.tournEndDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Venue / Location</span>
                        <span className="font-bold text-blue-600 dark:text-indigo-300 text-[11px] truncate block">{event.venue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Team Size</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">{event.teamSize}</span>
                      </div>
                    </div>

                    {/* Total Registrations Display */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-[11px]">Total Registrations</span>
                      <span className="font-mono font-black text-blue-600 dark:text-indigo-400">{registered} Registered</span>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => handleToggleRegistrationOpen(event)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer border ${
                            isRegOpen
                              ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                          }`}
                          title={isRegOpen ? 'Close registration to freeze participants and enable match scheduling' : 'Reopen registration for new student signups'}
                        >
                          {isRegOpen ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Close Reg (Enable Fixtures)</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Reopen Reg</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleViewParticipants(event)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-blue-600 dark:text-indigo-400 border border-blue-200 dark:border-indigo-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Roster ({registered})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(event)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-indigo-400">
                  {user?.sportName} Event Configurator
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingEvent ? 'Edit Registration Event' : 'Create New Registration Event'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-5">
              
              {/* Event Title & Sport Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Badminton Championship 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Assigned Sport (Auto-filled)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.sportName}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-blue-600 dark:text-indigo-400 text-xs font-mono font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cover Banner Upload & Management */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Cover Banner Image Upload & Cropper
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-48 h-28 rounded-xl bg-slate-200 dark:bg-slate-950 overflow-hidden border border-slate-300 dark:border-slate-800 shrink-0">
                    <img
                      src={formData.coverImage}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Upload a high-resolution cover image. Click "Crop & Resize" to trim to standard 16:9 banner format before publishing.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setCropperRawSrc(formData.coverImage);
                          setShowCropper(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-blue-600 dark:text-indigo-300 border border-blue-200 dark:border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Crop & Resize</span>
                      </button>

                      {formData.coverImage && (
                        <button
                          type="button"
                          onClick={handleRemoveCover}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of tournament highlights, eligibility, format..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-indigo-500"
                />
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Reg Start Date</label>
                  <input
                    type="date"
                    value={formData.regStartDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, regStartDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Reg End Date</label>
                  <input
                    type="date"
                    value={formData.regEndDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, regEndDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Tournament Start</label>
                  <input
                    type="date"
                    value={formData.tournStartDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tournStartDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Tournament End</label>
                  <input
                    type="date"
                    value={formData.tournEndDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tournEndDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Singles Fee, Doubles Fee, Team Size, Max Registrations, Venue, Category */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Singles Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.singlesFee}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData((prev) => ({ ...prev, singlesFee: val, entryFee: val }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Doubles Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.doublesFee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, doublesFee: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Team Size</label>
                  <input
                    type="text"
                    value={formData.teamSize}
                    onChange={(e) => setFormData((prev) => ({ ...prev, teamSize: e.target.value }))}
                    placeholder="e.g. 1 - 2 Players"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Open">Open</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    {!isBadminton && <option value="Draft">Draft (Hidden)</option>}
                    {!isBadminton && <option value="Upcoming">Upcoming (Scheduled)</option>}
                    <option value="Published">Published (Open)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Venue / Location</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g. Indoor Sports Complex Hall A"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>

              {/* Rules & Regulations multiline */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Rules & Regulations (One per line)
                </label>
                <textarea
                  rows={3}
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  placeholder="Official BWF rules apply&#10;Non-marking shoes mandatory&#10;College ID card required"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* Required Documents multiline */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Required Documents (One per line)
                </label>
                <textarea
                  rows={2}
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="College ID Card&#10;Student Aadhaar / Govt ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>



              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {editingEvent ? 'Save Event Changes' : 'Publish Registration Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* PARTICIPANTS ROSTER MODAL & EXPORT */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs font-sans">
          <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-indigo-400 font-bold uppercase">
                  {selectedEventForParticipants.sportName} Participant Roster
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedEventForParticipants.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const csvData = participants.map((p) => ({
                      RegID: p.id,
                      TeamOrParticipant: p.teamName || p.studentName,
                      Captain: p.studentName,
                      College: p.college,
                      Department: p.department,
                      Gender: p.gender,
                      Phone: p.contactPhone || p.phone,
                      Status: p.status,
                      RegisteredDate: p.registeredDate
                    }));
                    exportToCSV(csvData, `${selectedEventForParticipants.sportName}_Participants`);
                    addToast('Exported Participant Roster as CSV/Excel', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV/Excel
                </button>

                <button
                  onClick={() => setSelectedEventForParticipants(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search registered teams, captain name, college..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-indigo-500"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    <th className="p-3">Reg ID / Team</th>
                    <th className="p-3">Captain Name</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Fee Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                  {participants
                    .filter((p) => 
                      !participantSearch ||
                      p.teamName?.toLowerCase().includes(participantSearch.toLowerCase()) ||
                      p.studentName?.toLowerCase().includes(participantSearch.toLowerCase()) ||
                      p.college?.toLowerCase().includes(participantSearch.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {p.teamName || p.studentName}
                          <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400">{p.id}</span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">{p.studentName}</td>
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{p.college}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{p.gender}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                            {p.feePaid ? `PAID ₹${p.feePaid}` : 'CONFIRMED'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{p.registeredDate}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>Total Registered: <strong className="text-slate-900 dark:text-white">{participants.length} Entries</strong></span>
              <button
                onClick={() => setSelectedEventForParticipants(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
              >
                Close Roster
              </button>
            </div>

          </div>
        </div>
      )}


      {/* Image Cropper Modal */}
      {showCropper && cropperRawSrc && (
        <ImageCropperModal
          imageSrc={cropperRawSrc}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
        />
      )}

    </div>
  );
};
