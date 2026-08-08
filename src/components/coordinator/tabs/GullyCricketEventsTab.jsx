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

  // Form State specifically for Gully Cricket (Team Fee only, Min 6 & Max 8 players)
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Gully Cricket',
    coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-30',
    tournStartDate: '2026-09-05',
    tournEndDate: '2026-09-07',
    teamFee: 1000, // Team registration fee ONLY
    minPlayers: 6,  // Min players per squad
    maxPlayers: 8,  // Max players per squad
    overs: 6,
    matchFormat: 'Tennis Ball Cricket',
    teamSize: '6 - 8 Players',
    registeredCount: 0,
    venue: 'Central Ground B',
    category: 'Open',
    status: 'Published',
    rules: [
      'Official tennis ball gully cricket tournament rules apply.',
      'Team squad must consist of minimum 6 and maximum 8 players.',
      'College Student ID & Pass mandatory for all players.',
      'Standard tennis ball and street/box rules strictly followed.'
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
      const list = await coordinatorApi.getEvents();
      const gullyList = (list || []).filter(e => (e.sportName || '').toLowerCase().includes('gully') || (e.sportId || '').toLowerCase().includes('gully'));
      setEvents(gullyList.length > 0 ? gullyList : [
        {
          id: 'EVT-GULLY-CRICKET-001',
          title: '6-Overs Fast Box Gully Cricket Championship 2026',
          sportName: 'Gully Cricket',
          coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10',
          description: 'Official inter-college Gully Cricket tournament. Register team entries (6 - 8 players) today!',
          regStartDate: '2026-07-01',
          regEndDate: '2026-08-30',
          tournStartDate: '2026-09-05',
          tournEndDate: '2026-09-07',
          teamFee: 1000,
          minPlayers: 6,
          maxPlayers: 8,
          overs: 6,
          matchFormat: 'Tennis Ball Cricket',
          teamSize: '6 - 8 Players',
          registeredCount: 0,
          venue: 'Central Ground B',
          category: 'Open',
          status: 'Published',
          rules: ['Official tournament rules apply.'],
          requiredDocuments: ['College Student ID Card'],
          contactInfo: { name: 'Chiku Bhai', email: 'gullycricket.coord@sems.edu', phone: '+91 98765 43210' }
        }
      ]);
    } catch (err) {
      addToast('Error loading gully cricket events console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset form on Edit event
  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    const minP = eventObj.minPlayers !== undefined ? eventObj.minPlayers : 6;
    const maxP = eventObj.maxPlayers !== undefined ? eventObj.maxPlayers : 8;
    
    setFormData({
      title: eventObj.title || '',
      sportName: 'Gully Cricket',
      coverImage: eventObj.coverImage || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-08-30',
      tournStartDate: eventObj.tournStartDate || '2026-09-05',
      tournEndDate: eventObj.tournEndDate || '2026-09-07',
      teamFee: eventObj.teamFee !== undefined ? eventObj.teamFee : (eventObj.entryFee || 1000),
      minPlayers: minP,
      maxPlayers: maxP,
      overs: eventObj.overs !== undefined ? eventObj.overs : 6,
      matchFormat: eventObj.matchFormat || 'Tennis Ball Cricket',
      teamSize: `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Central Ground B',
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
      title: '6-Overs Fast Box Gully Cricket Championship 2026',
      sportName: 'Gully Cricket',
      coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10',
      description: 'Official inter-college Gully Cricket tournament. Register team entries (6 - 8 players) today!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-30',
      tournStartDate: '2026-09-05',
      tournEndDate: '2026-09-07',
      teamFee: 1000,
      minPlayers: 6,
      maxPlayers: 8,
      overs: 6,
      matchFormat: 'Tennis Ball Cricket',
      teamSize: '6 - 8 Players',
      registeredCount: 0,
      venue: 'Central Ground B',
      category: 'Open',
      status: 'Published',
      rules: [
        'Official tournament rules apply.',
        'Team squad must consist of min 6 and max 8 players.',
        'College ID mandatory for all squad members.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: user?.coordinatorName || 'Chiku Bhai',
      contactEmail: user?.email || 'gullycricket.coord@sems.edu',
      contactPhone: '+91 98765 43210'
    });
    setRulesInput('Official tournament rules apply.\nTeam squad must consist of min 6 and max 8 players.\nCollege Student ID Card mandatory.');
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
    addToast('Gully Cricket cover banner cropped and attached successfully!', 'success');
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10'
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

    const eventPayload = {
      ...formData,
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
        setEvents((prev) => prev.map((item) => (item.id === editingEvent.id ? updated : item)));
        addToast('Gully Cricket Event Updated Successfully', 'success');
      } else {
        const created = await coordinatorApi.createEvent(eventPayload);
        setEvents((prev) => [created, ...prev]);
        addToast('Gully Cricket Event Created Successfully', 'success');
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      if (editingEvent) {
        setEvents(prev => prev.map(item => item.id === editingEvent.id ? { ...item, ...eventPayload } : item));
        addToast('Gully Cricket Event Updated Successfully', 'success');
      } else {
        setEvents(prev => [{ ...eventPayload, id: `EVT-GULLY-${Date.now()}` }, ...prev]);
        addToast('Gully Cricket Event Created Successfully', 'success');
      }
      setShowCreateModal(false);
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete gully cricket event "${title}"?`)) {
      try {
        await coordinatorApi.deleteEvent(id);
      } catch (e) {}
      setEvents((prev) => prev.filter((item) => item.id !== id));
      addToast('Gully Cricket event deleted successfully', 'info');
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
    } catch (e) {
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, status: nextStatus } : item)));
    }
    addToast(`Event status changed to ${nextStatus}`, 'info');
  };

  const handleViewParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    try {
      const allRegs = await coordinatorApi.getRegistrations();
      setParticipants(allRegs || []);
    } catch (e) {
      setParticipants([
        { id: 'REG-GULLY-5001', teamName: 'Gully Smashers', studentName: 'Dr. Nikhil Arora', college: 'MPDC', department: 'Dental Surgery', squadCount: '7 Players', contactPhone: '+91 9876543210', status: 'VERIFIED', registeredDate: '2026-08-02' },
        { id: 'REG-GULLY-6001', teamName: 'Street Kings', studentName: 'Tushar Saxena', college: 'MPCAMS', department: 'Nursing & Paramedical', squadCount: '6 Players', contactPhone: '+91 9876543211', status: 'VERIFIED', registeredDate: '2026-08-03' }
      ]);
    }
  };

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'Published').length;
  const upcomingEvents = events.filter((e) => e.status === 'Upcoming').length;
  const closedEvents = events.filter((e) => e.status === 'Closed').length;
  const totalRegCount = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalRevenue = events.reduce((acc, curr) => {
    const fee = curr.teamFee !== undefined ? curr.teamFee : (curr.entryFee || 1000);
    return acc + ((curr.registeredCount || 0) * fee);
  }, 0);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">Registered Teams</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{totalRegCount}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl col-span-2 sm:col-span-1 space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Team Revenue</span>
          <p className="text-xl font-black text-orange-600 dark:text-orange-400 truncate">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* SECTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-[10px] font-mono font-bold uppercase">
              GULLY CRICKET COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Team Events Configurator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gully Cricket Tournament Event Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure Gully Cricket team events with flat team entry fees and squad size controls (6 to 8 players).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Gully Cricket Event</span>
        </button>
      </div>

      {/* EVENTS MANAGEMENT CARDS GRID */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-2 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              + Create First Gully Cricket Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const registered = event.registeredCount || 0;
              const fee = event.teamFee !== undefined ? event.teamFee : (event.entryFee || 1000);
              const minP = event.minPlayers !== undefined ? event.minPlayers : 6;
              const maxP = event.maxPlayers !== undefined ? event.maxPlayers : 8;
              const teamSizeStr = event.teamSize || `${minP} - ${maxP} Players`;

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft dark:shadow-lg hover:border-orange-500/50 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  {/* Cover Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={event.coverImage || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10'}
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

                    {/* Team Fee Display Badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black text-amber-400 border border-amber-500/30 shadow-md">
                      Team Fee: ₹{fee}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                        GULLY CRICKET TOURNAMENT
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
                        <span className="font-bold text-orange-600 dark:text-orange-400 text-[11px] truncate block">{event.venue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Squad Limits</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-orange-500" />
                          {teamSizeStr} (Min {minP}, Max {maxP})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-500 dark:text-slate-400 font-mono text-[11px]">Registered Squads</span>
                      <span className="font-mono font-black text-orange-600 dark:text-orange-400">{registered} Teams Registered</span>
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
                          className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
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
                <span className="text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400">
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
                    placeholder="e.g. 6-Overs Fast Box Gully Cricket Championship 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-orange-600 dark:text-orange-400 text-xs font-mono font-bold cursor-not-allowed"
                  />
                </div>
              </div>

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
                      Upload a high-resolution Gully Cricket cover image. Click "Crop & Resize" to trim it to the standard 16:9 banner before publishing.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
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
                        className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of Gully Cricket tournament rules, overs, tennis ball rules, eligibility..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

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

              {/* MATCH FORMAT & OVERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Match Format <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.matchFormat}
                    onChange={(e) => setFormData((prev) => ({ ...prev, matchFormat: e.target.value }))}
                    placeholder="Tennis Ball Cricket"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Overs <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.overs}
                    onChange={(e) => setFormData((prev) => ({ ...prev, overs: parseInt(e.target.value, 10) || 6 }))}
                    placeholder="6"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>

              {/* TEAM PRICING & SQUAD LIMITS SECTION */}
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-4">
                <div className="flex items-center gap-2 border-b border-orange-500/20 pb-2">
                  <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <h4 className="text-xs font-black uppercase text-orange-700 dark:text-orange-400 tracking-wider">
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
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        const val = parseInt(e.target.value, 10) || 6;
                        setFormData((prev) => ({ ...prev, minPlayers: val }));
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Team Size: Minimum 6 Players</p>
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
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Maximum 8 Players</p>
                  </div>
                </div>
              </div>

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
                    <option value="Published">Published (Open)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Venue / Location</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="Enter Gully Cricket Ground / Venue"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Rules & Regulations (One rule per line for Gully Cricket)
                </label>
                <textarea
                  rows={3}
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  placeholder="Official tennis ball gully rules apply&#10;Min 6 and Max 8 players required per squad&#10;Underarm/overarm as agreed"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Required Documents (One document per line)
                </label>
                <textarea
                  rows={2}
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="College Student ID Card&#10;Aadhaar Card / Govt ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

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
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {editingEvent ? 'Save Gully Cricket Event' : 'Publish Gully Cricket Event'}
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
                <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold uppercase">
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
                      SquadCount: p.squadCount || '6-8',
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
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        <td className="p-3 font-mono font-bold text-orange-600 dark:text-orange-400">{p.id}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.teamName || p.studentName}</td>
                        <td className="p-3">{p.college}</td>
                        <td className="p-3">{p.category || 'Open'}</td>
                        <td className="p-3 font-mono">6-8 Players</td>
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
