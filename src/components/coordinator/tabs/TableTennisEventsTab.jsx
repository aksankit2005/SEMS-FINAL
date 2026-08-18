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

export const TableTennisEventsTab = ({ user }) => {
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Participant Drawer state
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Image Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState(null);

  // Form State specifically for Table Tennis with Cyan styling
  const [formData, setFormData] = useState({
    title: 'Table Tennis Championship 2026',
    sportName: 'Table Tennis',
    coverImage: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
    description: 'Official inter-college Table Tennis tournament. Register your entries today!',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-25',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-03',
    entryFee: 300,
    singlesFee: 300,
    doublesFee: 600,
    minPlayers: 1,
    maxPlayers: 2,
    teamSize: '1 - 2 Players',
    maxRegistrations: 64,
    registeredCount: 0,
    venue: 'Main Sports Complex',
    category: 'Open',
    status: 'Published',
    rules: [
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
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID'],
    contactName: user?.coordinatorName || 'Rohan Mehta',
    contactEmail: user?.email || 'tt.coord@apex.edu',
    contactPhone: '+91 98765 11002'
  });

  const [rulesInput, setRulesInput] = useState(`1. GAMES ARE PLAYED TO 11 POINTS (Must win by 2 points. Best 3 of 5 Games).
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
13. HONOR SYSTEM APPLIES TO DISAGREEMENTS.`);
  const [docInput, setDocInput] = useState('College Student ID Card\nAadhaar Card / Govt ID');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const list = await coordinatorApi.getEvents();
      const ttList = (list || []).filter(e => (e.sportId || e.sportName || '').toLowerCase().includes('table-tennis') || (e.title || '').toLowerCase().includes('table tennis'));
      setEvents(ttList.length > 0 ? ttList : list);
    } catch (err) {
      addToast('Error loading Table Tennis events console', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    setFormData({
      title: eventObj.title || 'Table Tennis Championship 2026',
      sportName: 'Table Tennis',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || 'Official inter-college Table Tennis tournament. Register your entries today!',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-08-25',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-03',
      entryFee: eventObj.singlesFee !== undefined ? eventObj.singlesFee : 300,
      singlesFee: eventObj.singlesFee !== undefined ? eventObj.singlesFee : 300,
      doublesFee: eventObj.doublesFee !== undefined ? eventObj.doublesFee : 600,
      minPlayers: 1,
      maxPlayers: 2,
      teamSize: eventObj.teamSize || '1 - 2 Players',
      maxRegistrations: eventObj.maxRegistrations || 64,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Main Sports Complex',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      rules: eventObj.rules || ['Official tournament rules apply.', 'College Student ID & Pass mandatory.'],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: eventObj.contactInfo?.name || user?.coordinatorName || 'Rohan Mehta',
      contactEmail: eventObj.contactInfo?.email || user?.email || 'tt.coord@apex.edu',
      contactPhone: eventObj.contactInfo?.phone || '+91 98765 11002'
    });

    setRulesInput((eventObj.rules || ['Official tournament rules apply.', 'College Student ID & Pass mandatory.']).join('\n'));
    setDocInput((eventObj.requiredDocuments || ['College Student ID Card', 'Aadhaar Card / Govt ID']).join('\n'));
    setShowCreateModal(true);
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: 'Table Tennis Championship 2026',
      sportName: 'Table Tennis',
      coverImage: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
      description: 'Official inter-college Table Tennis tournament. Register your entries today!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-25',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-03',
      entryFee: 300,
      singlesFee: 300,
      doublesFee: 600,
      minPlayers: 1,
      maxPlayers: 2,
      teamSize: '1 - 2 Players',
      maxRegistrations: 64,
      registeredCount: 0,
      venue: 'Main Sports Complex',
      category: 'Open',
      status: 'Published',
      rules: ['Official tournament rules apply.', 'College Student ID & Pass mandatory.'],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: user?.coordinatorName || 'Rohan Mehta',
      contactEmail: user?.email || 'tt.coord@apex.edu',
      contactPhone: '+91 98765 11002'
    });
    setRulesInput('Official tournament rules apply.\nCollege Student ID & Pass mandatory.');
    setDocInput('College Student ID Card\nAadhaar Card / Govt ID');
    setShowCreateModal(true);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperRawSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBase64) => {
    setFormData((prev) => ({ ...prev, coverImage: croppedBase64 }));
    setShowCropper(false);
    addToast('Cover banner cropped and updated!', 'success');
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Please enter an event title', 'warning');
      return;
    }

    const rulesArr = rulesInput.split('\n').map(r => r.trim()).filter(Boolean);
    const docsArr = docInput.split('\n').map(d => d.trim()).filter(Boolean);

    const eventPayload = {
      ...formData,
      rules: rulesArr,
      requiredDocuments: docsArr,
      sportId: 'table-tennis',
      sportName: 'Table Tennis',
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
        addToast(`Table Tennis event "${updated.title}" updated!`, 'success');
      } else {
        const created = await coordinatorApi.createEvent(eventPayload);
        setEvents((prev) => [created, ...prev]);
        addToast(`New Table Tennis event "${created.title}" published!`, 'success');
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      addToast('Failed to save Table Tennis event', 'error');
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
    const filtered = allRegs.filter(r => (r.sportId === 'table-tennis' || r.sport === 'Table Tennis') && (r.eventId === eventObj.id || r.eventTitle === eventObj.title));
    setParticipants(filtered.length > 0 ? filtered : allRegs.filter(r => r.sportId === 'table-tennis' || r.sport === 'Table Tennis'));
  };

  // Dashboard Stats
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'Published').length;
  const closedEvents = events.filter((e) => e.status === 'Closed').length;
  const totalRegCount = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalRevenue = events.reduce((acc, curr) => acc + ((curr.registeredCount || 0) * (curr.singlesFee || curr.entryFee || 300)), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* TOP DASHBOARD STATS BAR WITH OCEAN CYAN STYLING */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/20 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/20 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-500">Active Events</span>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">{activeEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/20 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-rose-600 dark:text-rose-500">Closed Events</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{closedEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-cyan-500/20 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400">Assigned Sport</span>
          <p className="text-sm font-black text-cyan-600 dark:text-cyan-400 truncate">🏓 Table Tennis</p>
        </div>
      </div>

      {/* SECTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-cyan-500/20 shadow-soft dark:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold uppercase">
              🏓 TABLE TENNIS REGISTRATION CONSOLE
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Table Tennis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Table Tennis Event Creation & Registration Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Create Table Tennis events, upload cover banners, and track real-time participant registrations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Registration Event</span>
        </button>
      </div>

      {/* EVENTS MANAGEMENT GRID */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-cyan-500/20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">Loading Table Tennis registration events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-cyan-500/20 p-8 shadow-soft dark:shadow-md">
            <Layers className="w-12 h-12 text-cyan-500/50 mx-auto" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Registration Events Created Yet</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Click the "Create Registration Event" button above to publish your first tournament registration event for Table Tennis.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              + Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const registered = event.registeredCount || 0;

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-cyan-500/20 overflow-hidden shadow-soft dark:shadow-lg hover:border-cyan-500/50 transition flex flex-col justify-between"
                >
                  {/* Cover Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={event.coverImage || 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md ${
                        event.status === 'Published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : event.status === 'Upcoming'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : event.status === 'Closed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        ● {event.status || 'Published'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold border border-slate-800">
                        {event.category || 'Open'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black text-amber-400 border border-slate-800">
                      Fee: Singles ₹{event.singlesFee !== undefined ? event.singlesFee : 300} | Doubles ₹{event.doublesFee !== undefined ? event.doublesFee : 600}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        🏓 TABLE TENNIS
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

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80">
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
                        <span className="font-bold text-cyan-600 dark:text-cyan-400 text-[11px] truncate block">{event.venue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Team Size</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">{event.teamSize || '1 - 2 Players'}</span>
                      </div>
                    </div>

                    {/* Total Registrations */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-[11px]">Total Registrations</span>
                      <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">{registered} Registered</span>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(event)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          title="Toggle Status"
                        >
                          {event.status === 'Published' ? <ToggleRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                          <span>Toggle Status</span>
                        </button>

                        <button
                          onClick={() => handleViewParticipants(event)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
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
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition cursor-pointer"
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

      {/* CREATE / EDIT EVENT MODAL WITH CYAN THEME & EXACT BADMINTON INPUT FIELDS */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400">
                  🏓 Table Tennis Event Configurator
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
                    placeholder="Table Tennis Championship 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold cursor-not-allowed"
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
                      <label className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Crop & Resize</span>
                      </button>

                      {formData.coverImage && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, coverImage: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80' }))}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
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
                  placeholder="Official inter-college Table Tennis tournament. Register your entries today!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

              {/* Singles Fee, Doubles Fee, Team Size, Category, Status */}
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-cyan-600 dark:text-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Team Size</label>
                  <input
                    type="text"
                    value={formData.teamSize}
                    onChange={(e) => setFormData((prev) => ({ ...prev, teamSize: e.target.value }))}
                    placeholder="1 - 2 Players"
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
                  placeholder="Main Sports Complex"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>

              {/* Rules & Regulations */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Rules & Regulations (One per line)
                </label>
                <textarea
                  rows={3}
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  placeholder="Official tournament rules apply.&#10;College Student ID & Pass mandatory."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* Required Documents */}
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
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
          <div className="w-full max-w-4xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-cyan-500/30 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                  🏓 Table Tennis Participant Roster
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
                    exportToCSV(csvData, `Table_Tennis_Participants`);
                    addToast('Exported Participant Roster as CSV/Excel', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                    <th className="p-3">Reg ID / Team</th>
                    <th className="p-3">Captain Name</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Fee Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs font-mono">
                  {participants
                    .filter((p) => !participantSearch || JSON.stringify(p).toLowerCase().includes(participantSearch.toLowerCase()))
                    .map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-cyan-600 dark:text-cyan-300">{p.teamName || p.studentName || `Entry #${idx + 1}`}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{p.studentName || p.captainName || '-'}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{p.college || 'MPEC Kanpur'}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{p.gender || 'Open'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">PAID</span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{p.registeredDate || '2026-08-08'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && cropperRawSrc && (
        <ImageCropperModal
          imageSrc={cropperRawSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          aspectRatio={16 / 9}
        />
      )}

    </div>
  );
};
