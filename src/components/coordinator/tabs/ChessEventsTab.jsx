import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Layers, CheckCircle2, Clock, XCircle, Edit, Trash2, Eye, 
  Upload, Crop, Image as ImageIcon, Users, DollarSign, ShieldAlert, Download, 
  Search, Filter, ToggleLeft, ToggleRight, X, AlertCircle, Sparkles, FileText, Phone, Mail, UserCheck
} from 'lucide-react';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { ImageCropperModal } from '../../common/ImageCropperModal';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV } from '../../../utils/pdfExporter';

export const ChessEventsTab = ({ user }) => {
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Participant Roster Drawer/Modal state
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Image Cropper Modal state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState(null);

  // Form State specifically for Chess (Registration Fee, Min 1 & Max 1 Player / Individual format)
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Chess',
    coverImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-09-15',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-03',
    entryFee: 300, // Individual registration fee
    teamFee: 300,  // Flat entry fee compatibility
    minPlayers: 1,  // Individual / board player
    maxPlayers: 1, 
    teamSize: '1 Player (Individual)',
    registeredCount: 0,
    venue: 'Chess Hall A - Main Board Room',
    category: 'Open', // Boys, Girls, Open, Rapid, Blitz
    status: 'Published', // Draft, Upcoming, Published, Closed
    rules: [
      '1. Time Control: Each player gets 10 minutes for the entire game (10+0 unless increment is specified).',
      '2. Clock: The chess clock starts when White makes the first move. Press the clock after every move.',
      '3. Touch-Move Rule: If you touch one of your own pieces, you must move it if a legal move exists.',
      '4. Illegal Moves: An illegal move must be corrected. If a player makes two illegal moves, they lose the game (common rapid rule).',
      '5. Win Conditions: Checkmate • Opponent\'s time runs out • Opponent resigns.',
      '6. Draw Conditions: Stalemate • Threefold repetition (if claimed) • 50-move rule (if claimed) • Insufficient mating material • Mutual agreement.',
      '7. Spectators: No talking or giving advice during the game.',
      '8. Electronic Devices: Mobile phones and other electronic devices must remain silent and unused.',
      '9. Result Reporting: Both players must report the result to the organizer immediately after the game.',
      '10. Organizer\'s Decision: The tournament arbiter/organizer\'s decision is final in case of disputes.'
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'FIDE / State Chess ID (If applicable)'],
    contactName: user?.coordinatorName || 'Grandmaster Anand Verma',
    contactEmail: user?.email || 'chess.coord@apex.edu',
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
      const list = await coordinatorApi.getEvents();
      setEvents(list);
    } catch (err) {
      addToast('Error loading chess events console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset form on Edit event
  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    const minP = eventObj.minPlayers !== undefined ? eventObj.minPlayers : 1;
    const maxP = eventObj.maxPlayers !== undefined ? eventObj.maxPlayers : 1;
    const feeVal = typeof eventObj.entryFee === 'number' ? eventObj.entryFee : (typeof eventObj.teamFee === 'number' ? eventObj.teamFee : (eventObj.entryFee ?? eventObj.teamFee ?? 300));

    setFormData({
      title: eventObj.title || '',
      sportName: 'Chess',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-09-15',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-03',
      entryFee: feeVal,
      teamFee: feeVal,
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: minP === maxP ? `${minP} Player` : `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Chess Hall A - Main Board Room',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card'],
      contactName: eventObj.contactInfo?.name || user?.coordinatorName || 'Chess Coordinator',
      contactEmail: eventObj.contactInfo?.email || user?.email || 'chess.coord@apex.edu',
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
      title: 'Inter-College Chess Championship 2026',
      sportName: 'Chess',
      coverImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      description: 'Official inter-college FIDE Rapid Chess tournament. Register your entry today!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-09-15',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-03',
      entryFee: 300,
      teamFee: 300,
      minPlayers: 1,
      maxPlayers: 1,
      teamSize: '1 Player (Individual)',
      registeredCount: 0,
      venue: 'Chess Hall A - Main Board Room',
      category: 'Open',
      status: 'Published',
      rules: [
        '1. Time Control: Each player gets 10 minutes for the entire game (10+0 unless increment is specified).',
        '2. Clock: The chess clock starts when White makes the first move. Press the clock after every move.',
        '3. Touch-Move Rule: If you touch one of your own pieces, you must move it if a legal move exists.',
        '4. Illegal Moves: An illegal move must be corrected. If a player makes two illegal moves, they lose the game (common rapid rule).',
        '5. Win Conditions: Checkmate • Opponent\'s time runs out • Opponent resigns.',
        '6. Draw Conditions: Stalemate • Threefold repetition (if claimed) • 50-move rule (if claimed) • Insufficient mating material • Mutual agreement.',
        '7. Spectators: No talking or giving advice during the game.',
        '8. Electronic Devices: Mobile phones and other electronic devices must remain silent and unused.',
        '9. Result Reporting: Both players must report the result to the organizer immediately after the game.',
        '10. Organizer\'s Decision: The tournament arbiter/organizer\'s decision is final in case of disputes.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: user?.coordinatorName || 'Grandmaster Anand Verma',
      contactEmail: user?.email || 'chess.coord@apex.edu',
      contactPhone: '+91 98765 43210'
    });
    setRulesInput(`1. Time Control: Each player gets 10 minutes for the entire game (10+0 unless increment is specified).
2. Clock: The chess clock starts when White makes the first move. Press the clock after every move.
3. Touch-Move Rule: If you touch one of your own pieces, you must move it if a legal move exists.
4. Illegal Moves: An illegal move must be corrected. If a player makes two illegal moves, they lose the game (common rapid rule).
5. Win Conditions: Checkmate, Opponent's time runs out, Opponent resigns.
6. Draw Conditions: Stalemate, Threefold repetition (if claimed), 50-move rule (if claimed), Insufficient mating material, Mutual agreement.
7. Spectators: No talking or giving advice during the game.
8. Electronic Devices: Mobile phones and other electronic devices must remain silent and unused.
9. Result Reporting: Both players must report the result to the organizer immediately after the game.
10. Organizer's Decision: The tournament arbiter/organizer's decision is final in case of disputes.`);
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
    addToast('Chess cover banner cropped and attached successfully!', 'success');
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
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

    const calculatedTeamSize = formData.minPlayers === formData.maxPlayers 
      ? `${formData.minPlayers} Player` 
      : `${formData.minPlayers} - ${formData.maxPlayers} Players`;

    const eventPayload = {
      ...formData,
      entryFee: formData.entryFee,
      teamFee: formData.entryFee,
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
        setEvents((prev) => prev.map((item) => (item.id === editingEvent.id ? updated : item)));
        addToast(`Chess registration event "${updated.title}" updated!`, 'success');
      } else {
        const created = await coordinatorApi.createEvent(eventPayload);
        setEvents((prev) => [created, ...prev]);
        addToast(`New chess registration event "${created.title}" published!`, 'success');
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      addToast('Failed to save chess registration event', 'error');
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete chess event "${title}"?`)) {
      try {
        await coordinatorApi.deleteEvent(id);
        setEvents((prev) => prev.filter((item) => item.id !== id));
        addToast('Chess event deleted successfully', 'info');
      } catch (err) {
        addToast('Failed to delete event', 'error');
      }
    }
  };

  // Toggle status across: Draft -> Upcoming -> Published -> Closed -> Draft
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
    setParticipants(allRegs);
  };

  // Dashboard Stats calculation
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'Published').length;
  const upcomingEvents = events.filter((e) => e.status === 'Upcoming').length;
  const closedEvents = events.filter((e) => e.status === 'Closed').length;
  const totalRegCount = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalRevenue = events.reduce((acc, curr) => {
    const fee = typeof curr.entryFee === 'number' ? curr.entryFee : (typeof curr.teamFee === 'number' ? curr.teamFee : (curr.entryFee ?? curr.teamFee ?? 300));
    return acc + ((curr.registeredCount || 0) * fee);
  }, 0);

  const filteredParticipants = participants.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      (p.teamName || p.studentName || p.captainName || '').toLowerCase().includes(q) ||
      (p.college || p.collegeName || '').toLowerCase().includes(q) ||
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
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold uppercase">
              CHESS COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Registration Event Configurator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Chess Tournament Event Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure Chess registration events with entry fees, FIDE time rules, venue details, and roster controls.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Chess Event</span>
        </button>
      </div>

      {/* EVENTS MANAGEMENT CARDS GRID */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading Chess registration events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-soft dark:shadow-md">
            <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Chess Events Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Click the "Create Chess Event" button above to publish your first tournament registration event for Chess.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              + Create First Chess Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const registered = event.registeredCount || 0;
              const fee = typeof event.entryFee === 'number' ? event.entryFee : (typeof event.teamFee === 'number' ? event.teamFee : (event.entryFee ?? event.teamFee ?? 300));
              const minP = event.minPlayers !== undefined ? event.minPlayers : 1;
              const maxP = event.maxPlayers !== undefined ? event.maxPlayers : 1;
              const teamSizeStr = event.teamSize || (minP === maxP ? `${minP} Player` : `${minP} - ${maxP} Players`);

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft dark:shadow-lg hover:border-purple-500/50 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  {/* Cover Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={event.coverImage || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent" />

                    {/* Status Badge including Upcoming */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md ${
                        event.status === 'Published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : event.status === 'Upcoming'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : event.status === 'Closed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        ● {event.status}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold border border-slate-800">
                        {event.category || 'Open'}
                      </span>
                    </div>

                    {/* Registration Fee Display Badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black text-amber-400 border border-amber-500/30 shadow-md">
                      Entry Fee: ₹{fee}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                        CHESS TOURNAMENT
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
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px] truncate block">{event.venue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Format / Limits</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-500" />
                          {teamSizeStr}
                        </span>
                      </div>
                    </div>

                    {/* Total Registrations Display */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-[11px]">Registered Players</span>
                      <span className="font-mono font-black text-purple-600 dark:text-purple-400">{registered} Players Registered</span>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(event)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          title="Toggle Status (Draft -> Upcoming -> Published -> Closed)"
                        >
                          {event.status === 'Published' ? (
                            <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : event.status === 'Upcoming' ? (
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <span>Toggle Status</span>
                        </button>

                        <button
                          onClick={() => handleViewParticipants(event)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
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

      {/* CREATE / EDIT CHESS EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400">
                  Chess Event Configurator
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingEvent ? 'Edit Chess Event' : 'Create New Chess Event'}
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
                    placeholder="e.g. Inter-College Chess Championship 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Assigned Sport
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Chess"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cover Banner Upload & Cropper */}
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
                      Upload a high-resolution Chess cover image. Click "Crop & Resize" to trim to standard 16:9 banner format before publishing.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
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
                        className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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
                  placeholder="Enter detailed description of Chess tournament format, FIDE rules, Swiss league rounds, time control..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              {/* PRICING & PLAYER LIMITS */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
                  <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider">
                    Chess Registration Pricing & Player Limits
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Entry Fee Field */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Registration Entry Fee (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.entryFee}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({ ...prev, entryFee: val, teamFee: val }));
                      }}
                      placeholder="e.g. 300"
                      className="w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Flat registration fee collected per participant.</p>
                  </div>

                  {/* Min Players */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Min Players <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={formData.minPlayers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setFormData((prev) => ({ ...prev, minPlayers: val }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Default: 1</p>
                  </div>

                  {/* Max Players */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Max Players <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={formData.maxPlayers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setFormData((prev) => ({ ...prev, maxPlayers: val }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Default: 1</p>
                  </div>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Rapid">Rapid</option>
                    <option value="Blitz">Blitz</option>
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
                  placeholder="e.g. Chess Hall A - Main Board Room"
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
                  placeholder="Official FIDE Rapid / Blitz rules apply&#10;Time control: 15min + 10s increment&#10;Touch-move rule strictly enforced"
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
                  placeholder="College Student ID Card&#10;Aadhaar Card / Govt ID"
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
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {editingEvent ? 'Save Event Changes' : 'Publish Chess Event'}
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
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold uppercase">
                  Chess Participant Roster
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedEventForParticipants.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const csvData = participants.map((p) => ({
                      RegID: p.id,
                      ParticipantName: p.studentName || p.captainName || p.teamName,
                      College: p.college || p.collegeName,
                      Department: p.department || p.branch,
                      Phone: p.phone || p.captainPhone,
                      Email: p.email || p.captainEmail,
                      PaymentStatus: p.paymentStatus || 'Verified'
                    }));
                    exportToCSV(csvData, `chess_participants_${selectedEventForParticipants.id}.csv`);
                    addToast('Exporting roster CSV...', 'info');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => setSelectedEventForParticipants(null)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Roster Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by participant name, college, ID..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Roster List Table */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  No participant registrations found matching your query.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {filteredParticipants.map((p, idx) => (
                    <div key={p.id || idx} className="p-3 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center justify-between text-xs gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded">
                            {p.id || `REG-${idx+1}`}
                          </span>
                          <span className="font-black text-slate-900 dark:text-white truncate">
                            {p.studentName || p.captainName || p.teamName || 'Chess Participant'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {p.college || p.collegeName || 'Inter-College'} • {p.phone || p.captainPhone || 'No Phone'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ● {p.paymentStatus || 'Registered'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Total Entries: {filteredParticipants.length}</span>
              <button
                onClick={() => setSelectedEventForParticipants(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition cursor-pointer"
              >
                Close Roster
              </button>
            </div>

          </div>
        </div>
      )}

      {/* IMAGE CROPPER MODAL */}
      {showCropper && cropperRawSrc && (
        <ImageCropperModal
          imageSrc={cropperRawSrc}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setCropperRawSrc(null);
          }}
          aspectRatio={16 / 9}
        />
      )}

    </div>
  );
};
