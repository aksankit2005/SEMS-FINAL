import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, CheckCircle2, Clock, XCircle, Edit, Trash2, Eye, 
  Upload, Crop, Image as ImageIcon, Users, DollarSign, ShieldAlert, Download, 
  Search, Filter, ToggleLeft, ToggleRight, X, AlertCircle, Sparkles, FileText, Phone, Mail, UserCheck
} from 'lucide-react';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { ImageCropperModal } from '../../common/ImageCropperModal';
import { useToast } from '../../../context/ToastContext';
import { resolveSportKey } from '../../../data/sportsConfig';
import { exportToCSV } from '../../../utils/pdfExporter';

export const KhoKhoEventsTab = ({ user }) => {
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Participant Roster Drawer state
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');

  // Image Cropper Modal state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperRawSrc, setCropperRawSrc] = useState(null);

  // Form State specifically for Kho-Kho
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Kho-Kho',
    coverImage: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-25',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-03',
    teamFee: 1200,
    minPlayers: 9,
    maxPlayers: 12,
    teamSize: '9 - 12 Players',
    registeredCount: 0,
    venue: 'Kho-Kho Field 1',
    category: 'Open',
    status: 'Published',
    rules: [
      '1. Team Composition: 9 active chasers/defenders on field (Squad 9-12 players). Substitutions allowed as per rules.',
      '2. Innings & Turns: Match consists of 2 innings (4 turns total). Each turn is 9 minutes long.',
      '3. Chasing & Defending: Teams switch roles after each turn. Defenders enter in batches of 3.',
      '4. Scoring: 1 point awarded for every defender tapped/tagged out by a chaser.',
      '5. Giving Kho: Chasers must touch a sitting teammate from behind and utter "Kho" clearly to pass turn.',
      '6. Direction Rule: Once a chaser chooses a direction towards a pole, they cannot turn back until reaching pole.'
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Approval Form'],
    contactName: user?.coordinatorName || 'Sunita Jadhav',
    contactEmail: user?.email || 'khokho.coord@sems.edu',
    contactPhone: '+91 98765 43210'
  });

  const [rulesInput, setRulesInput] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const list = await coordinatorApi.getEvents();
      setEvents(list);
    } catch (err) {
      addToast('Error loading Kho-Kho events console', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    const minP = eventObj.minPlayers !== undefined ? eventObj.minPlayers : 9;
    const maxP = eventObj.maxPlayers !== undefined ? eventObj.maxPlayers : 12;
    
    setFormData({
      title: eventObj.title || '',
      sportName: 'Kho-Kho',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-08-25',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-03',
      teamFee: eventObj.teamFee !== undefined ? eventObj.teamFee : (eventObj.entryFee || 1200),
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Kho-Kho Field 1',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [
        '1. Team Composition: 9 active chasers/defenders on field (Squad 9-12 players).',
        '2. Innings & Turns: Match consists of 2 innings (4 turns total). Each turn is 9 minutes long.',
        '3. Chasing & Defending: Teams switch roles after each turn. Defenders enter in batches of 3.',
        '4. Scoring: 1 point awarded for every defender tapped/tagged out by a chaser.'
      ],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: eventObj.contactName || user?.coordinatorName || 'Sunita Jadhav',
      contactEmail: eventObj.contactEmail || user?.email || 'khokho.coord@sems.edu',
      contactPhone: eventObj.contactPhone || '+91 98765 43210'
    });
    setShowCreateModal(true);
  };

  const handleResetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      sportName: 'Kho-Kho',
      coverImage: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
      description: '',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-25',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-03',
      teamFee: 1200,
      minPlayers: 9,
      maxPlayers: 12,
      teamSize: '9 - 12 Players',
      registeredCount: 0,
      venue: 'Kho-Kho Field 1',
      category: 'Open',
      status: 'Published',
      rules: [
        '1. Team Composition: 9 active chasers/defenders on field (Squad 9-12 players).',
        '2. Innings & Turns: Match consists of 2 innings (4 turns total). Each turn is 9 minutes long.',
        '3. Chasing & Defending: Teams switch roles after each turn. Defenders enter in batches of 3.',
        '4. Scoring: 1 point awarded for every defender tapped/tagged out by a chaser.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Approval Form'],
      contactName: user?.coordinatorName || 'Sunita Jadhav',
      contactEmail: user?.email || 'khokho.coord@sems.edu',
      contactPhone: '+91 98765 43210'
    });
    setRulesInput('');
  };

  const handleSelectRawImageFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperRawSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64) => {
    setFormData((prev) => ({ ...prev, coverImage: croppedBase64 }));
    setShowCropper(false);
    setCropperRawSrc(null);
    addToast('Cover image cropped successfully', 'success');
  };

  const handleAddRule = () => {
    if (!rulesInput.trim()) return;
    setFormData((prev) => ({ ...prev, rules: [...prev.rules, rulesInput.trim()] }));
    setRulesInput('');
  };

  const handleRemoveRule = (index) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Tournament Event Title is required', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        sportName: 'Kho-Kho',
        teamSize: `${formData.minPlayers} - ${formData.maxPlayers} Players`,
        entryFee: Number(formData.teamFee),
      };

      if (editingEvent) {
        await coordinatorApi.updateEvent(editingEvent.id, payload);
        addToast('Kho-Kho event updated successfully!', 'success');
      } else {
        await coordinatorApi.createEvent(payload);
        addToast('New Kho-Kho event published successfully!', 'success');
      }

      setShowCreateModal(false);
      handleResetForm();
      fetchEvents();
    } catch (err) {
      addToast('Failed to save Kho-Kho event', 'error');
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await coordinatorApi.deleteEvent(id);
      addToast('Event deleted', 'info');
      fetchEvents();
    } catch (err) {
      addToast('Failed to delete event', 'error');
    }
  };

  const handleToggleStatus = async (eventObj) => {
    const nextStatus = eventObj.status === 'Published' ? 'Closed' : 'Published';
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
      const allRegs = await coordinatorApi.getRegistrations();
      const eventRegs = allRegs.filter((r) => r.eventId === eventObj.id || resolveSportKey(r) === 'kho-kho');
      setParticipants(eventRegs);
    } catch (err) {
      addToast('Failed to load registered teams', 'error');
    }
  };

  const khoKhoEvents = events.filter((e) => {
    if (!e) return false;
    const key = resolveSportKey(e);
    return key === 'kho-kho' || e.sportId === 'kho-kho' || e.assignedSport === 'kho-kho' || e.sportName?.toLowerCase().includes('kho') || !e.sportName;
  });

  const totalEvents = khoKhoEvents.length;
  const activeEvents = khoKhoEvents.filter((e) => e.status === 'Published').length;
  const upcomingEvents = khoKhoEvents.filter((e) => e.status === 'Upcoming').length;
  const closedEvents = khoKhoEvents.filter((e) => e.status === 'Closed').length;
  const totalRegCount = khoKhoEvents.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalRevenue = khoKhoEvents.reduce((acc, curr) => {
    const fee = curr.teamFee !== undefined ? curr.teamFee : (curr.entryFee || 1200);
    return acc + ((curr.registeredCount || 0) * fee);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* TOP DASHBOARD STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Active Events</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{activeEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Upcoming Events</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{upcomingEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400">Closed Events</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{closedEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">Registered Teams</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{totalRegCount}</p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-2xl col-span-2 sm:col-span-1 space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Team Revenue</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 truncate">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Top Banner Control Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm">🏃‍♂️</span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Kho-Kho Event Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure Kho-Kho tournaments, rules, team sizes (9-12 players), and registration fees.
          </p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Publish New Kho-Kho Event
        </button>
      </div>

      {/* Events List Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading Kho-Kho Events...</div>
      ) : khoKhoEvents.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Kho-Kho Events Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click the button above to publish your first Kho-Kho event and open registrations for college teams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {khoKhoEvents.map((evt) => (
            <div 
              key={evt.id} 
              className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-[#1E293B] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Event Cover Banner */}
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img 
                    src={evt.coverImage || 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80'} 
                    alt={evt.title} 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      evt.status === 'Published' 
                        ? 'bg-emerald-500 text-white' 
                        : evt.status === 'Closed' 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {evt.status || 'Published'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Kho-Kho • {evt.category || 'Open'}
                    </span>
                    <h3 className="text-base font-bold truncate mt-1">{evt.title}</h3>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-100 dark:border-[#1E293B]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Team Fee</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        ₹{evt.entryFee || evt.teamFee || 1200}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-100 dark:border-[#1E293B]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Squad Size</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {evt.minPlayers || 9} - {evt.maxPlayers || 12} Players
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Venue:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{evt.venue || 'Kho-Kho Field 1'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tournament Dates:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{evt.tournStartDate} to {evt.tournEndDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reg. Deadline:</span>
                      <span className="font-semibold text-rose-500">{evt.regEndDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 dark:bg-[#090D16] border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleViewParticipants(evt)}
                  className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-[#1E293B] hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5" /> Teams Roster
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-[#1E293B] hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                    title="Edit Event"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(evt)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-[#1E293B] hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                    title="Toggle Status (Publish/Close)"
                  >
                    {evt.status === 'Published' ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDeleteEvent(evt.id, evt.title)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-[#1E293B] hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto pt-16 sm:pt-20 pb-16">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-auto max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold">🏃‍♂️</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEvent ? 'Edit Kho-Kho Event Details' : 'Publish New Kho-Kho Event'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  handleResetForm();
                }} 
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Tournament Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. APEX Inter-College Kho-Kho Championship 2026"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Event Cover Image
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                    <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 text-xs font-bold cursor-pointer transition">
                    <Upload className="w-4 h-4 text-amber-500" /> Choose & Crop Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleSelectRawImageFile} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Event Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Open">Open Category</option>
                    <option value="Boys">Boys Tournament</option>
                    <option value="Girls">Girls Tournament</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Assigned Court / Venue
                  </label>
                  <select
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Kho-Kho Field 1">Kho-Kho Field 1</option>
                    <option value="Kho-Kho Field 2">Kho-Kho Field 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Team Registration Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.teamFee}
                    onChange={(e) => setFormData({ ...formData, teamFee: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs font-bold text-amber-500 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Min Players / Squad
                  </label>
                  <input
                    type="number"
                    value={formData.minPlayers}
                    onChange={(e) => setFormData({ ...formData, minPlayers: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Max Players / Squad
                  </label>
                  <input
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Reg. Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.regStartDate}
                    onChange={(e) => setFormData({ ...formData, regStartDate: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Reg. Closing Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.regEndDate}
                    onChange={(e) => setFormData({ ...formData, regEndDate: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs text-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Tournament Start
                  </label>
                  <input
                    type="date"
                    value={formData.tournStartDate}
                    onChange={(e) => setFormData({ ...formData, tournStartDate: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs font-semibold text-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Event Brief Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Official Inter-College Kho-Kho Tournament hosted under APEX 2026 guidelines."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#1E293B] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    handleResetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20"
                >
                  {editingEvent ? 'Save Changes' : 'Publish Kho-Kho Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Drawer: Registered Teams Roster */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-[#1E293B] max-w-xl w-full h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E293B]">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedEventForParticipants.title}
                  </h3>
                  <p className="text-xs text-slate-400">Registered College Kho-Kho Squads</p>
                </div>
                <button onClick={() => setSelectedEventForParticipants(null)} className="p-2 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search by team, college or captain..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] text-xs"
                />
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
                {participants.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">No teams registered yet.</div>
                ) : (
                  participants
                    .filter((p) => (p.teamName || p.collegeName || '').toLowerCase().includes(participantSearch.toLowerCase()))
                    .map((team, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1E293B] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-500">{team.teamName || `Team #${idx + 1}`}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                            {team.status || 'Verified'}
                          </span>
                        </div>
                        <div className="text-slate-400">College: <strong className="text-slate-200">{team.collegeName}</strong></div>
                        <div className="text-slate-400">Captain: <strong className="text-slate-200">{team.captainName || team.name} ({team.captainPhone || team.phone})</strong></div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <button
              onClick={() => exportToCSV(participants, `${selectedEventForParticipants.title}_Roster`)}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <Download className="w-4 h-4" /> Download Kho-Kho Squads CSV
            </button>
          </div>
        </div>
      )}

      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperRawSrc}
          aspectRatio={16 / 9}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setCropperRawSrc(null);
          }}
        />
      )}

    </div>
  );
};
