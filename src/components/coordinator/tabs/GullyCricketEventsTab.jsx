import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Layers, CheckCircle2, Clock, XCircle, Edit, Trash2, Eye, 
  Upload, Crop, Image as ImageIcon, Users, DollarSign, ShieldAlert, Download, 
  Search, Filter, ToggleLeft, ToggleRight, X, AlertCircle, Sparkles, FileText, Phone, Mail, UserCheck,
  ChevronDown, ArrowUpRight
} from 'lucide-react';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { ImageCropperModal } from '../../common/ImageCropperModal';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV } from '../../../utils/pdfExporter';
import { EventStatusBadge, RegistrationStatusBadge } from '../events/RegistrationStatusControl';
import { computeEffectiveRegistrationStatus } from '../../../utils/registrationLifecycle';

export const GullyCricketEventsTab = ({ user }) => {
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeDropdownEventId, setActiveDropdownEventId] = useState(null);
  
  // Participant Roster Drawer/Modal state
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Image Cropper Modal state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState(null);

  // Form State specifically for Gully Cricket (Squad size 5 - 8 players, 6-Overs Fast Box Cricket)
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Gully Cricket',
    coverImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-09-15',
    tournStartDate: '2026-09-16',
    tournEndDate: '2026-09-20',
    teamFee: 1000, // Team registration fee ONLY
    minPlayers: 5,  // Min players per squad
    maxPlayers: 8,  // Max players per squad
    teamSize: '5 - 8 Players',
    registeredCount: 0,
    venue: 'Basketball Ground / Street Pitch 1',
    category: 'Open',
    status: 'Published',
    rules: [
      '1. Squad Composition: 5 to 8 players per registered squad (6 players on pitch per innings).',
      '2. Match Format: 6-Overs Fast Box Cricket per innings (Max 2 overs per bowler).',
      '3. Out Rules: Direct Hit Out, Caught Behind, Clean Bowled, and One-Tip One-Hand catch is OUT.',
      '4. Boundary Rules: Hitting out of the designated box / street zone is declared OUT (Common Box Rule).',
      '5. Extras: Wide ball and No-ball award 1 extra run + re-bowl. Free hit on front-foot No-ball.',
      '6. No LBW: Traditional LBW rules do not apply in Gully Cricket.',
      '7. Toss & Roster: Team captains must submit verified roster 15 minutes before match start.',
      '8. Equipment: Official tennis balls provided by tournament committee. Rubberized gully bats allowed.',
      '9. Conduct: Fair play is mandatory. Umpire / Referee decision is final on the street pitch.',
      '10. Guidelines: Valid College ID required for all participating players.'
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Approval Form'],
    contactName: user?.coordinatorName || 'Chiku Bhai',
    contactEmail: user?.email || 'gullycricket.coord@sems.edu',
    contactPhone: '+91 98765 43210'
  });

  const [rulesInput, setRulesInput] = useState('');
  const [docInput, setDocInput] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [list, allRegs] = await Promise.all([
        coordinatorApi.getEvents(),
        coordinatorApi.getRegistrations().catch(() => [])
      ]);
      const gcRegs = (allRegs || []).filter((d) => 
        !d.sport || 
        d.sport.toLowerCase().includes('gully') || 
        d.sport.toLowerCase().includes('box') || 
        d.eventTitle?.toLowerCase().includes('gully') ||
        d.eventTitle?.toLowerCase().includes('box')
      );
      const mapped = (list || []).map((ev) => {
        const matching = gcRegs.filter((r) => 
          r.eventId === ev.id || 
          r.eventTitle === ev.title || 
          (list.length === 1 && gcRegs.length > 0)
        );
        return {
          ...ev,
          registeredCount: matching.length
        };
      });
      setEvents(mapped);
    } catch (err) {
      addToast('Error loading Gully Cricket events console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset form on Edit event
  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    const minP = eventObj.minPlayers !== undefined ? eventObj.minPlayers : 5;
    const maxP = eventObj.maxPlayers !== undefined ? eventObj.maxPlayers : 8;
    
    setFormData({
      title: eventObj.title || '',
      sportName: 'Gully Cricket',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-09-15',
      tournStartDate: eventObj.tournStartDate || '2026-09-16',
      tournEndDate: eventObj.tournEndDate || '2026-09-20',
      teamFee: typeof eventObj.teamFee === 'number' ? eventObj.teamFee : (typeof eventObj.entryFee === 'number' ? eventObj.entryFee : (eventObj.teamFee ?? eventObj.entryFee ?? 1000)),
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Basketball Ground / Street Pitch 1',
      category: eventObj.category === 'Mixed' ? 'Open' : (eventObj.category || 'Open'),
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card'],
      contactName: eventObj.contactInfo?.name || user?.coordinatorName || 'Chiku Bhai',
      contactEmail: eventObj.contactInfo?.email || user?.email || 'gullycricket.coord@sems.edu',
      contactPhone: eventObj.contactInfo?.phone || '+91 98765 43210'
    });
    setRulesInput(Array.isArray(eventObj.rules) ? eventObj.rules.join('\n') : '');
    setDocInput(Array.isArray(eventObj.requiredDocuments) ? eventObj.requiredDocuments.join('\n') : '');
    setShowCreateModal(true);
  };

  // Preset form on Create event
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: 'APEX Gully Cricket Championship 2026',
      sportName: 'Gully Cricket',
      coverImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      description: 'Official Inter-College Gully & Box Cricket tournament. Register team entries (5 - 8 players, 6-overs fast match) today!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-09-15',
      tournStartDate: '2026-09-16',
      tournEndDate: '2026-09-20',
      teamFee: 1000,
      minPlayers: 5,
      maxPlayers: 8,
      teamSize: '5 - 8 Players',
      registeredCount: 0,
      venue: 'Basketball Ground / Street Pitch 1',
      category: 'Open',
      status: 'Published',
      rules: [
        '1. Squad Composition: 5 to 8 players per registered squad (6 players on pitch per innings).',
        '2. Match Format: 6-Overs Fast Box Cricket per innings (Max 2 overs per bowler).',
        '3. Out Rules: Direct Hit Out, Caught Behind, Clean Bowled, and One-Tip One-Hand catch is OUT.',
        '4. Boundary Rules: Hitting out of the designated box / street zone is declared OUT.',
        '5. Extras: Wide ball and No-ball award 1 extra run + re-bowl. Free hit on front-foot No-ball.',
        '6. No LBW: Traditional LBW rules do not apply in Gully Cricket.',
        '7. Guidelines: Valid College ID required for all participating players.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Approval Form'],
      contactName: user?.coordinatorName || 'Chiku Bhai',
      contactEmail: user?.email || 'gullycricket.coord@sems.edu',
      contactPhone: '+91 98765 43210'
    });
    setRulesInput('1. Squad Composition: 5 to 8 players per registered squad (6 players on pitch per innings).\n2. Match Format: 6-Overs Fast Box Cricket per innings (Max 2 overs per bowler).\n3. Out Rules: Direct Hit Out, Clean Bowled, One-Tip One-Hand catch is OUT.\n4. Boundary Rules: Hitting out of box is OUT.\n5. No LBW in Gully Cricket.\n6. College Student ID Card mandatory.');
    setDocInput('College Student ID Card\nAadhaar Card / Govt ID\nTeam Roster Approval Form');
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
    addToast('Gully Cricket cover banner cropped and attached successfully!', 'success');
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'
    }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('Event Title is required', 'error');
      return;
    }

    if (formData.minPlayers < 1) {
      addToast('Minimum players must be at least 1', 'error');
      return;
    }

    if (formData.maxPlayers < formData.minPlayers) {
      addToast('Maximum players cannot be less than minimum players', 'error');
      return;
    }

    const rulesArr = rulesInput.split('\n').map((r) => r.trim()).filter(Boolean);
    const docsArr = docInput.split('\n').map((d) => d.trim()).filter(Boolean);

    const calculatedTeamSize = `${formData.minPlayers} - ${formData.maxPlayers} Players`;
    const targetStatus = formData.status || 'Published';

    const eventPayload = {
      ...formData,
      status: targetStatus,
      registrationOpen: targetStatus !== 'Closed' && targetStatus !== 'Draft' && targetStatus !== 'Completed',
      entryFee: formData.teamFee,
      teamSize: calculatedTeamSize,
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
        setEvents((prev) => prev.map((item) => (item.id === editingEvent.id ? { ...item, ...updated } : item)));
        addToast(`Gully Cricket event "${updated.title || formData.title}" updated!`, 'success');
      } else {
        const created = await coordinatorApi.createEvent(eventPayload);
        setEvents((prev) => [created, ...prev]);
        addToast(`New Gully Cricket event "${created.title || formData.title}" published!`, 'success');
      }

      setShowCreateModal(false);
      fetchEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      addToast('Failed to save Gully Cricket event', 'error');
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete Gully Cricket event "${title}"?`)) {
      try {
        await coordinatorApi.deleteEvent(id);
        setEvents((prev) => prev.filter((item) => item.id !== id));
        addToast('Gully Cricket event deleted successfully', 'info');
        window.dispatchEvent(new Event('sems_events_updated'));
      } catch (err) {
        addToast('Failed to delete event', 'error');
      }
    }
  };

  const handleSetEventStatus = async (eventObj, actionKey) => {
    setActiveDropdownEventId(null);
    try {
      if (actionKey === 'OPEN') {
        const nowStr = new Date().toISOString().split('T')[0];
        let newEndDate = eventObj.regEndDate;
        // If deadline passed or empty, auto extend by 7 days so registration is actively accepted
        if (!eventObj.regEndDate || eventObj.regEndDate < nowStr) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          newEndDate = futureDate.toISOString().split('T')[0];
        }
        const updated = await coordinatorApi.updateEvent(eventObj.id, {
          status: 'Published',
          registrationOpen: true,
          regEndDate: newEndDate
        });
        setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, status: 'Published', registrationOpen: true, regEndDate: newEndDate } : item)));
        addToast(`🔓 Registration is now OPEN for "${eventObj.title}"! (Deadline: ${newEndDate})`, 'success');
      } else if (actionKey === 'CLOSE') {
        const updated = await coordinatorApi.updateEvent(eventObj.id, {
          status: 'Closed',
          registrationOpen: false
        });
        setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, status: 'Closed', registrationOpen: false } : item)));
        addToast(`🔒 Registration CLOSED for "${eventObj.title}". Fixtures can now be scheduled!`, 'info');
      } else if (actionKey === 'UPCOMING') {
        const updated = await coordinatorApi.updateEvent(eventObj.id, {
          status: 'Upcoming',
          registrationOpen: false
        });
        setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, status: 'Upcoming', registrationOpen: false } : item)));
        addToast(`⏳ Event marked as UPCOMING for "${eventObj.title}".`, 'info');
      } else if (actionKey === 'EXTEND') {
        handleOpenEdit(eventObj);
        return;
      }
      fetchEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update event status';
      addToast(errMsg, 'error');
    }
  };

  const handleViewParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    try {
      const allRegs = await coordinatorApi.getRegistrations();
      const gcRegs = (allRegs || []).filter((d) => 
        !d.sport || 
        d.sport.toLowerCase().includes('gully') || 
        d.sport.toLowerCase().includes('box') || 
        d.eventTitle?.toLowerCase().includes('gully') ||
        d.eventTitle?.toLowerCase().includes('box')
      );
      const matching = gcRegs.filter((r) => 
        r.eventId === eventObj.id || 
        r.eventTitle === eventObj.title || 
        (events.length === 1 && gcRegs.length > 0)
      );
      setParticipants(matching.length > 0 ? matching : gcRegs);
    } catch (e) {
      console.error('Error fetching registrations for roster:', e);
    }
  };

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => {
    const s = computeEffectiveRegistrationStatus(e);
    return s.effectiveRegistrationOpen;
  }).length;
  const upcomingEvents = events.filter((e) => {
    const s = computeEffectiveRegistrationStatus(e);
    return s.code === 'UPCOMING' || s.code === 'NOT_STARTED' || (e.status || '').toLowerCase() === 'upcoming';
  }).length;
  const closedEvents = events.filter((e) => {
    const s = computeEffectiveRegistrationStatus(e);
    return s.effectiveRegistrationClosed || (e.status || '').toLowerCase() === 'closed';
  }).length;
  const totalRegCount = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);

  const filteredParticipants = participants.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      (p.teamName || p.studentName || '').toLowerCase().includes(q) ||
      (p.college || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* TOP DASHBOARD STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Active Events</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{activeEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Upcoming Events</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{upcomingEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400">Closed Events</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{closedEvents}</p>
        </div>
      </div>

      {/* SECTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
              GULLY CRICKET COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Team Events Configurator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gully & Box Cricket Tournament Event Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure Gully Cricket team events with flat team entry fees, squad limits (5 to 8 players), 16:9 banner cropper, and live rosters.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Gully Cricket Event</span>
        </button>
      </div>

      {/* EVENTS MANAGEMENT CARDS GRID */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading Gully Cricket registration events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-soft dark:shadow-md">
            <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Gully Cricket Events Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Click the "Create Gully Cricket Event" button above to publish your first team registration event for Gully Cricket.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              + Create First Gully Cricket Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const registered = event.registeredCount || 0;
              const fee = typeof event.teamFee === 'number' ? event.teamFee : (typeof event.entryFee === 'number' ? event.entryFee : (event.teamFee ?? event.entryFee ?? 1000));
              const minP = event.minPlayers !== undefined ? event.minPlayers : 5;
              const maxP = event.maxPlayers !== undefined ? event.maxPlayers : 8;
              const teamSizeStr = event.teamSize || `${minP} - ${maxP} Players`;
              const statusInfo = computeEffectiveRegistrationStatus(event);

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft dark:shadow-lg hover:border-emerald-500/50 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  {/* Cover Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={event.coverImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent" />

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <EventStatusBadge event={event} />
                      <RegistrationStatusBadge event={event} />
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold border border-slate-800">
                        {event.category || 'Open'}
                      </span>
                    </div>

                    {/* Team Fee Display Badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black text-amber-400 border border-amber-500/30 shadow-md">
                      Team Fee: ₹{fee}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        GULLY & BOX CRICKET TOURNAMENT
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
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Pitch / Venue</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] truncate block">{event.venue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Squad Limits</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-500" />
                          {teamSizeStr} (Min {minP}, Max {maxP})
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Unified Status Roll-Down Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveDropdownEventId(activeDropdownEventId === event.id ? null : event.id)}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer ${
                              statusInfo.effectiveRegistrationOpen
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : statusInfo.code === 'UPCOMING' || statusInfo.code === 'NOT_STARTED' || (event.status || '').toLowerCase() === 'upcoming'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              statusInfo.effectiveRegistrationOpen ? 'bg-emerald-500 animate-pulse' : statusInfo.code === 'UPCOMING' || (event.status || '').toLowerCase() === 'upcoming' ? 'bg-blue-500' : 'bg-rose-500'
                            }`} />
                            <span>
                              {statusInfo.effectiveRegistrationOpen
                                ? 'Registration Open'
                                : statusInfo.code === 'UPCOMING' || (event.status || '').toLowerCase() === 'upcoming'
                                ? 'Upcoming'
                                : 'Closed'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                          </button>

                          {activeDropdownEventId === event.id && (
                            <div className="absolute left-0 bottom-full mb-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-40 animate-fade-in text-xs space-y-1">
                              <button
                                type="button"
                                onClick={() => handleSetEventStatus(event, 'OPEN')}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Open / Activate Registration</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetEventStatus(event, 'CLOSE')}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Close Registration</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetEventStatus(event, 'UPCOMING')}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Mark as Upcoming</span>
                              </button>

                              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                              <button
                                type="button"
                                onClick={() => handleSetEventStatus(event, 'EXTEND')}
                                className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Extend End Date (Edit)</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleViewParticipants(event)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
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

      {/* CREATE / EDIT GULLY CRICKET EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  Gully Cricket Event Configurator
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingEvent ? 'Edit Gully Cricket Event' : 'Create New Gully Cricket Event'}
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
                    placeholder="e.g. APEX Gully Cricket Championship 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Assigned Sport
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Gully Cricket"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* COVER BANNER IMAGE UPLOAD & CROPPER */}
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
                      Upload a high-resolution Gully Cricket cover image. Click "Crop & Resize" to trim to standard 16:9 banner format before publishing.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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

              {/* EVENT DESCRIPTION */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of Gully Cricket tournament rules, street pitch location, eligibility..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* DATES ROW */}
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

              {/* TEAM FEE ONLY, MIN 5 & MAX 8 PLAYERS */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                    Gully Cricket Team Pricing & Squad Limits
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Team Entry Fee (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.teamFee}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({ ...prev, teamFee: val }));
                      }}
                      placeholder="e.g. 1000"
                      className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Flat registration fee collected per participating Gully Cricket team.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Min Players <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      required
                      value={formData.minPlayers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 5;
                        setFormData((prev) => ({ ...prev, minPlayers: val }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Default: 5</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Max Players <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      required
                      value={formData.maxPlayers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 8;
                        setFormData((prev) => ({ ...prev, maxPlayers: val }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Default: 8</p>
                  </div>
                </div>
              </div>

              {/* CATEGORY & STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Open">Open</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Upcoming">Upcoming (Coming Soon)</option>
                    <option value="Published">Published (Open / Active)</option>
                    <option value="Closed">Closed (Registration Closed)</option>
                    <option value="Completed">Completed (Event Finished)</option>
                  </select>
                </div>
              </div>

              {/* VENUE / PITCH */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Pitch / Venue Location</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="e.g. Basketball Ground / Street Pitch 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>

              {/* RULES & REGULATIONS */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Rules & Regulations (One per line)
                </label>
                <textarea
                  rows={4}
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  placeholder="Official Box & Gully Cricket rules apply&#10;Squad Composition: 5 to 8 players per squad&#10;Direct Hit Out, Clean Bowled, and One-Tip One-Hand catch is OUT&#10;Valid College Student ID Card mandatory"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* REQUIRED DOCUMENTS */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Required Documents (One per line)
                </label>
                <textarea
                  rows={2}
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="College Student ID Card&#10;Aadhaar Card / Govt ID&#10;Team Roster Approval Form"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* MODAL ACTIONS */}
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {editingEvent ? 'Save Gully Cricket Event' : 'Publish Gully Cricket Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS ROSTER MODAL & CSV EXPORT */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs font-sans">
          <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  Gully Cricket Registered Squads
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedEventForParticipants.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const csvData = participants.map((p) => ({
                      RegID: p.id,
                      TeamName: p.teamName || p.studentName,
                      Captain: p.studentName,
                      College: p.college,
                      Department: p.department || 'N/A',
                      SquadCount: p.squadCount || '5-8',
                      Phone: p.contactPhone || p.phone,
                      Status: p.status,
                      RegisteredDate: p.registeredDate
                    }));
                    exportToCSV(csvData, `GullyCricket_Participants_${selectedEventForParticipants.id}`);
                    addToast('Exported Gully Cricket Roster as CSV/Excel', 'success');
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

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search registered team, captain name, college..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-3">Registration ID</th>
                    <th className="p-3">Team / Student Name</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Squad Size</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                        No team registrations found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.id}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.teamName || p.studentName}</td>
                        <td className="p-3">{p.college}</td>
                        <td className="p-3">{p.category || 'Open'}</td>
                        <td className="p-3 font-mono">5-8 Players</td>
                        <td className="p-3 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
