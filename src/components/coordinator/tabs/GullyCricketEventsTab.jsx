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

export const GullyCricketEventsTab = ({ user }) => {
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

  // Form State specifically for Gully Cricket (Squad size 5 - 8 players, 6-Overs Fast Box)
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Gully Cricket',
    coverImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-25',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-05',
    teamFee: 1000,
    minPlayers: 5,
    maxPlayers: 8,
    teamSize: '5 - 8 Players',
    registeredCount: 0,
    venue: 'Street Pitch Ground 1',
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
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Form'],
    contactName: user?.coordinatorName || 'Chiku Bhai',
    contactEmail: user?.email || 'gullycricket.coord@sems.edu',
    contactPhone: '+91 98765 43210'
  });

  const [rulesInput, setRulesInput] = useState('');
  const [docInput, setDocInput] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: showCreateModal } }));
    return () => {
      window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: false } }));
    };
  }, [showCreateModal]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const list = await coordinatorApi.getEvents();
      setEvents(list);
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
      regEndDate: eventObj.regEndDate || '2026-08-25',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-05',
      teamFee: typeof eventObj.teamFee === 'number' ? eventObj.teamFee : (typeof eventObj.entryFee === 'number' ? eventObj.entryFee : 1000),
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Street Pitch Ground 1',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [
        '1. Squad Composition: 5 to 8 players per registered squad (6 players on pitch per innings).',
        '2. Match Format: 6-Overs Fast Box Cricket per innings (Max 2 overs per bowler).',
        '3. Out Rules: Direct Hit Out, Caught Behind, Clean Bowled, and One-Tip One-Hand catch is OUT.',
        '4. Boundary Rules: Hitting out of the designated box / street zone is declared OUT.',
        '5. Extras: Wide ball and No-ball award 1 extra run + re-bowl.',
        '6. No LBW: Traditional LBW rules do not apply in Gully Cricket.'
      ],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: eventObj.contactName || user?.coordinatorName || 'Chiku Bhai',
      contactEmail: eventObj.contactEmail || user?.email || 'gullycricket.coord@sems.edu',
      contactPhone: eventObj.contactPhone || '+91 98765 43210'
    });
    setShowCreateModal(true);
  };

  const handleResetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      sportName: 'Gully Cricket',
      coverImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      description: '',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-25',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-05',
      teamFee: 1000,
      minPlayers: 5,
      maxPlayers: 8,
      teamSize: '5 - 8 Players',
      registeredCount: 0,
      venue: 'Street Pitch Ground 1',
      category: 'Open',
      status: 'Published',
      rules: [
        '1. Squad Composition: 5 to 8 players per registered squad (6 players on pitch per innings).',
        '2. Match Format: 6-Overs Fast Box Cricket per innings (Max 2 overs per bowler).',
        '3. Out Rules: Direct Hit Out, Caught Behind, Clean Bowled, and One-Tip One-Hand catch is OUT.',
        '4. Boundary Rules: Hitting out of the designated box / street zone is declared OUT.',
        '5. Extras: Wide ball and No-ball award 1 extra run + re-bowl.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Form'],
      contactName: user?.coordinatorName || 'Chiku Bhai',
      contactEmail: user?.email || 'gullycricket.coord@sems.edu',
      contactPhone: '+91 98765 43210'
    });
    setShowCreateModal(false);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Please enter event title', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        id: editingEvent ? editingEvent.id : `EVT-GULLY-${Date.now().toString().slice(-4)}`,
        sportId: 'gully-cricket',
        sportName: 'Gully Cricket',
        entryFee: formData.teamFee,
        minMembers: formData.minPlayers,
        maxMembers: formData.maxPlayers,
        teamSize: `${formData.minPlayers} - ${formData.maxPlayers} Players`,
        updatedAt: new Date().toISOString()
      };

      await coordinatorApi.createEvent(payload);
      addToast(editingEvent ? 'Gully Cricket Event updated successfully!' : 'New Gully Cricket Event published successfully!', 'success');
      handleResetForm();
      fetchEvents();
    } catch (err) {
      addToast('Failed to save Gully Cricket event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this Gully Cricket event?')) return;
    try {
      await coordinatorApi.deleteEvent(eventId);
      addToast('Event deleted', 'info');
      fetchEvents();
    } catch (err) {
      addToast('Error deleting event', 'error');
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
      await coordinatorApi.updateEvent(eventObj.id, { ...eventObj, status: nextStatus });
      addToast(`Event status updated to ${nextStatus}`, 'success');
      fetchEvents();
    } catch (err) {
      addToast('Failed to update event status', 'error');
    }
  };

  const handleViewParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    try {
      const regs = await coordinatorApi.getRegistrations();
      const filtered = regs.filter(r => 
        (r.eventId === eventObj.id || r.sportId === 'gully-cricket' || (r.sportId || '').includes('gully'))
      );
      setParticipants(filtered);
    } catch (err) {
      addToast('Error loading participants list', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
              🏏 GULLY CRICKET OPERATIONS
            </span>
            <span className="text-xs font-mono text-slate-400">Total Events: {events.length}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Gully & Box Cricket Registration Events
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish official 6-Overs box cricket tournaments, set team registration rules, and manage squads
          </p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Gully Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Loading Gully Cricket events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-2xl">
            🏏
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">No Gully Cricket Events Published Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Click "Publish Gully Event" above to create your first Street / Box Cricket Championship event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
            >
              <div className="h-44 relative overflow-hidden bg-slate-900">
                <img
                  src={evt.coverImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                    {evt.category || 'Open'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-md ${
                    evt.status === 'Published'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : evt.status === 'Upcoming'
                      ? 'bg-blue-500 text-white border-blue-400'
                      : evt.status === 'Closed'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-amber-500 text-slate-950 font-black border-amber-400'
                  }`}>
                    ● {evt.status || 'Published'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{evt.venue || 'Street Pitch Ground 1'}</span>
                  <h3 className="text-base font-black text-white leading-tight drop-shadow truncate">{evt.title}</h3>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-mono">
                    <span>Squad Limit:</span>
                    <strong className="text-slate-900 dark:text-white">{evt.minPlayers || 5} - {evt.maxPlayers || 8} Players</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-mono">
                    <span>Team Fee:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">₹{evt.teamFee || evt.entryFee || 1000}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-mono">
                    <span>Tourn Dates:</span>
                    <strong className="text-slate-900 dark:text-white">{evt.tournStartDate || 'TBD'} to {evt.tournEndDate || 'TBD'}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewParticipants(evt)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Roster</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(evt)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                      title="Toggle Status (Draft -> Upcoming -> Published -> Closed)"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(evt)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="w-[95%] sm:w-[85%] lg:w-[75%] max-w-4xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#090D16] shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                  🏏 GULLY CRICKET TOURNAMENT CONFIG
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {editingEvent ? 'Edit Gully Cricket Event' : 'Publish New Gully Cricket Event'}
                </h3>
              </div>
              <button
                onClick={handleResetForm}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Inter-College Gully & Box Cricket Championship 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pitch / Venue</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Team Entry Fee (₹)</label>
                    <input
                      type="number"
                      value={formData.teamFee}
                      onChange={(e) => setFormData({ ...formData, teamFee: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Draft">Draft (Hidden)</option>
                      <option value="Upcoming">Upcoming (Coming Soon)</option>
                      <option value="Published">Published (Open)</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min Squad Size</label>
                    <input
                      type="number"
                      min="5"
                      max="8"
                      value={formData.minPlayers}
                      onChange={(e) => setFormData({ ...formData, minPlayers: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Squad Size</label>
                    <input
                      type="number"
                      min="5"
                      max="8"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tournament Start Date</label>
                    <input
                      type="date"
                      value={formData.tournStartDate}
                      onChange={(e) => setFormData({ ...formData, tournStartDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tournament End Date</label>
                    <input
                      type="date"
                      value={formData.tournEndDate}
                      onChange={(e) => setFormData({ ...formData, tournEndDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
                  <strong className="block font-bold">Standard Gully & Box Cricket Rules Applied:</strong>
                  <p className="text-[11px] leading-relaxed">
                    6-Overs Fast Box • Direct Hit Out • One-Tip Out • 6 Players on pitch • Box boundary out • No LBW.
                  </p>
                </div>
              </div>

              {/* Fixed Action Footer Bar for Mobile & Desktop */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50 dark:bg-[#090D16] shrink-0">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {editingEvent ? 'Save Changes' : 'Publish Gully Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participant Roster Drawer Modal */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#090D16]">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">
                  🏏 GULLY CRICKET PARTICIPANTS
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedEventForParticipants.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForParticipants(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {participants.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  No teams registered for this Gully Cricket event yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {participants.map((p, idx) => (
                    <div key={p.id || idx} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <strong className="text-sm font-black text-slate-900 dark:text-white block">
                          {p.teamName || p.studentName || `Team #${idx + 1}`}
                        </strong>
                        <span className="text-xs font-mono text-slate-500">{p.college || 'MPEC'} • Captain: {p.studentName || 'Captain'}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                        {p.status || 'VERIFIED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
