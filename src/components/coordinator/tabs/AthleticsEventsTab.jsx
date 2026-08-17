import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Layers, CheckCircle2, Clock, XCircle, Edit, Trash2, Eye, 
  Upload, Crop, Image as ImageIcon, Users, DollarSign, ShieldAlert, Download, 
  Search, Filter, ToggleLeft, ToggleRight, X, AlertCircle, Sparkles, FileText, Phone, Mail, Award, Check
} from 'lucide-react';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { ImageCropperModal } from '../../common/ImageCropperModal';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { exportToCSV } from '../../../utils/pdfExporter';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';
import { EventStatusBadge, EventStatusActionButton, RegistrationStatusBadge, RegistrationActionButton } from '../events/RegistrationStatusControl';
import { computeEffectiveRegistrationStatus } from '../../../utils/registrationLifecycle';

const DEFAULT_SUB_EVENTS_CONFIG = [
  { name: '100m Race', enabled: true, isRelay: false, entryFee: 100 },
  { name: '200m Race', enabled: true, isRelay: false, entryFee: 150 },
  { name: '4*100m relay Race', enabled: true, isRelay: true, entryFee: 400 },
  { name: 'Long Jump', enabled: true, isRelay: false, entryFee: 150 },
  { name: 'Javelin Throw', enabled: true, isRelay: false, entryFee: 150 },
  { name: 'Shot Put', enabled: true, isRelay: false, entryFee: 150 },
  { name: 'Discus Throw', enabled: true, isRelay: false, entryFee: 150 },
];

export const AthleticsEventsTab = ({ user, sportSlug = 'athletics' }) => {
  const { addToast } = useToast();
  const { confirmDelete } = useConfirm();

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

  // Form State specifically for Athletics with sub-event pricing & prizes
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Athletics',
    coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-25',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-03',
    entryFee: 150,
    registeredCount: 0,
    venue: 'Main University Stadium Athletics Track & Field',
    category: 'Open', // Boys, Girls, Open
    status: 'Published', // Draft, Upcoming, Published, Closed
    subEventsConfig: JSON.parse(JSON.stringify(DEFAULT_SUB_EVENTS_CONFIG)),
    rules: [
      '1. Eligibility: Athletes must be currently enrolled college/university students with valid Student ID.',
      '2. Sub-Event Limit: An athlete can participate in maximum 2 individual events plus 1 relay event.',
      '3. Reporting & Call Room: Athletes must report to the Call Room 30 minutes prior to scheduled start time.',
      '4. Spike & Footwear Rules: Maximum allowed spike length is 6mm for synthetic track.',
      '5. False Start Rule: IAAF/World Athletics single false start disqualification rule applies.',
      '6. Throwing Equipment: Standard IAAF specification implements provided by official committee.',
      '7. Uniform & Bibs: Matching college athletic vest and official chest bib number mandatory.'
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Medical Fitness Certificate'],
    contactName: user?.coordinatorName || 'PT Usha Pillai',
    contactEmail: user?.email || 'athletics.coord@apex.edu',
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
      const list = await coordinatorApi.getEvents('athletics');
      setEvents(list || []);
    } catch (err) {
      addToast('Error loading Athletics events', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset form on Edit event
  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);

    let parsedSubConfig = eventObj.subEventsConfig;
    if (!parsedSubConfig || !Array.isArray(parsedSubConfig)) {
      parsedSubConfig = DEFAULT_SUB_EVENTS_CONFIG.map((se) => ({
        ...se,
        entryFee: eventObj.subEventFees?.[se.name] ?? se.entryFee,
      }));
    }

    setFormData({
      title: eventObj.title || '',
      sportName: 'Athletics',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-08-25',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-03',
      entryFee: eventObj.entryFee !== undefined ? eventObj.entryFee : 150,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Main University Stadium Athletics Track & Field',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      subEventsConfig: JSON.parse(JSON.stringify(parsedSubConfig)),
      rules: eventObj.rules || [
        '1. Eligibility: Athletes must be currently enrolled college/university students with valid Student ID.',
        '2. Sub-Event Limit: An athlete can participate in maximum 2 individual events plus 1 relay event.',
        '3. Reporting & Call Room: Athletes must report to the Call Room 30 minutes prior to scheduled start time.'
      ],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: eventObj.contactInfo?.name || user?.coordinatorName || 'PT Usha Pillai',
      contactEmail: eventObj.contactInfo?.email || user?.email || 'athletics.coord@apex.edu',
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
      title: 'Annual Inter-College Athletics Championship 2026',
      sportName: 'Athletics',
      coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
      description: 'Official inter-college Athletics Meet. 7 official track & field sub-events with medals, certificates, and cash prizes!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-25',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-03',
      entryFee: 150,
      registeredCount: 0,
      venue: 'Main University Stadium Athletics Track & Field',
      category: 'Open',
      status: 'Published',
      subEventsConfig: JSON.parse(JSON.stringify(DEFAULT_SUB_EVENTS_CONFIG)),
      rules: [
        '1. Eligibility: Athletes must be currently enrolled college/university students with valid Student ID.',
        '2. Sub-Event Limit: An athlete can participate in maximum 2 individual events plus 1 relay event.',
        '3. Reporting & Call Room: Athletes must report to the Call Room 30 minutes prior to scheduled start time.',
        '4. Spike & Footwear Rules: Maximum allowed spike length is 6mm for synthetic track.',
        '5. False Start Rule: IAAF/World Athletics single false start disqualification rule applies.',
        '6. Throwing Equipment: Standard IAAF specification implements provided by official committee.',
        '7. Uniform & Bibs: Matching college athletic vest and official chest bib number mandatory.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Medical Fitness Certificate'],
      contactName: user?.coordinatorName || 'PT Usha Pillai',
      contactEmail: user?.email || 'athletics.coord@apex.edu',
      contactPhone: '+91 98765 43210'
    });
    setRulesInput(`1. Eligibility: Athletes must be currently enrolled college/university students with valid Student ID.
2. Sub-Event Limit: An athlete can participate in maximum 2 individual events plus 1 relay event.
3. Reporting & Call Room: Athletes must report to the Call Room 30 minutes prior to scheduled start time.
4. Spike & Footwear Rules: Maximum allowed spike length is 6mm for synthetic track.
5. False Start Rule: IAAF/World Athletics single false start disqualification rule applies.
6. Throwing Equipment: Standard IAAF specification implements provided by official committee.
7. Uniform & Bibs: Matching college athletic vest and official chest bib number mandatory.`);
    setDocInput('College Student ID Card\nAadhaar Card / Govt ID\nMedical Fitness Certificate');
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
    addToast('Athletics cover banner cropped and attached successfully!', 'success');
  };

  const handleSubEventConfigChange = (index, field, val) => {
    setFormData((prev) => {
      const list = [...prev.subEventsConfig];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, subEventsConfig: list };
    });
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('Athletics Event Title is required', 'error');
      return;
    }

    const rulesArr = rulesInput
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const docArr = docInput
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    // Compute sub-events list and subEventFees
    const activeSubEventsList = formData.subEventsConfig
      .filter((se) => se.enabled)
      .map((se) => se.name);

    const subEventFees = {};

    formData.subEventsConfig.forEach((se) => {
      if (se.enabled) {
        subEventFees[se.name] = Number(se.entryFee) || 0;
      }
    });

    const payload = {
      ...formData,
      sportId: 'athletics',
      sportName: 'Athletics',
      subEvents: activeSubEventsList.length > 0 ? activeSubEventsList : OFFICIAL_ATHLETICS_EVENTS,
      subEventFees,
      rules: rulesArr,
      requiredDocuments: docArr,
      contactInfo: {
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone
      }
    };

    try {
      if (editingEvent) {
        await coordinatorApi.updateEvent(editingEvent.id, payload);
        addToast('Athletics event & sub-event prices updated!', 'success');
      } else {
        const newEvt = {
          id: `EVT-ATH-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString()
        };
        await coordinatorApi.createEvent(newEvt);
        addToast(`🏆 Athletics Event "${formData.title}" published with sub-event prices & cash prizes!`, 'success');
      }
      setShowCreateModal(false);
      fetchEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      addToast('Error saving Athletics event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const isConfirmed = await confirmDelete({
      title: 'Delete Athletics Event',
      message: 'Are you sure you want to delete this Athletics event? It will be removed from user registration.'
    });
    if (!isConfirmed) return;
    try {
      await coordinatorApi.deleteEvent(eventId);
      addToast('Athletics event deleted', 'info');
      fetchEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      addToast('Failed to delete event', 'error');
    }
  };

  const handleToggleRegistrationOpen = async (eventObj) => {
    const regStatus = computeEffectiveRegistrationStatus(eventObj);

    if (regStatus.isDeadlinePassed) {
      addToast('Registration deadline has passed. Extend the registration end date in edit settings before reopening registration.', 'warning');
      return;
    }

    const isCurrentlyOpen = regStatus.effectiveRegistrationOpen;
    const newRegOpen = !isCurrentlyOpen;
    try {
      const updated = await coordinatorApi.updateEvent(eventObj.id, {
        registrationOpen: newRegOpen
      });
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, registrationOpen: newRegOpen } : item)));
      if (!newRegOpen) {
        addToast(`🔒 Registration closed for "${eventObj.title}". Fixtures can now be scheduled!`, 'success');
      } else {
        addToast(`🔓 Registration reopened for "${eventObj.title}". Students can now register.`, 'info');
      }
      fetchEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to toggle registration status';
      addToast(errMsg, 'error');
    }
  };

  const handleToggleEventStatus = async (eventObj, targetStatus) => {
    const nextStatus = targetStatus || ((eventObj.status === 'Active' || eventObj.status === 'Published') ? 'Inactive' : 'Active');
    try {
      const updated = await coordinatorApi.updateEvent(eventObj.id, { status: nextStatus });
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, status: nextStatus } : item)));
      addToast(`Athletics event is now ${nextStatus}`, nextStatus === 'Active' || nextStatus === 'Published' ? 'success' : 'info');
      fetchEvents();
      window.dispatchEvent(new Event('sems_events_updated'));
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update event status';
      addToast(errMsg, 'error');
    }
  };

  // Open Participant Roster Drawer
  const handleOpenParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    try {
      const list = await coordinatorApi.getEventParticipants(eventObj.id);
      setParticipants(list || []);
    } catch (err) {
      setParticipants([]);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const q = participantSearch.toLowerCase();
    return (
      (p.name || p.captainName || '').toLowerCase().includes(q) ||
      (p.collegeName || '').toLowerCase().includes(q) ||
      (p.rollNo || '').toLowerCase().includes(q) ||
      (p.selectedEvent || p.event || '').toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!selectedEventForParticipants || filteredParticipants.length === 0) return;
    const exportData = filteredParticipants.map((p, idx) => ({
      'S.No': idx + 1,
      'Athlete Name': p.name || p.captainName || 'N/A',
      'Sub-Event': p.selectedEvent || p.event || 'Athletics',
      'College Name': p.collegeName || 'N/A',
      'Roll No / Reg ID': p.rollNo || 'N/A',
      'Phone': p.phone || p.captainPhone || 'N/A',
      'Email': p.email || p.captainEmail || 'N/A',
      'Fee Status': p.paymentStatus || 'Paid'
    }));
    exportToCSV(exportData, `${selectedEventForParticipants.title}_Athletics_Athletes_Roster`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* TOP DASHBOARD STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{events.length}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Active (Published)</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {events.filter((e) => e.status === 'Published').length}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Athletes</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Sport Category</span>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">Track & Field Athletics</p>
        </div>
      </div>

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase">
              ATHLETICS COORDINATOR PORTAL
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">• Track & Field Multi-Event</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Athletics Championship Events & Pricing
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure sub-events (100m, 200m, Relay, Javelin, Long Jump), customize individual entry fees, and manage registration availability.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Athletics Event</span>
        </button>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="py-16 text-center space-y-2 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading Athletics registration events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">No Athletics Events Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Click the "Create Athletics Event" button above to publish your first Track & Field Championship event.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            + Create First Athletics Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((evt) => {
            const subConfigList = evt.rules && Array.isArray(evt.rules) && evt.rules.length > 0 && typeof evt.rules[0] === 'object'
              ? evt.rules
              : DEFAULT_SUB_EVENTS_CONFIG;

            return (
              <div
                key={evt.id}
                className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-soft dark:shadow-md hover:border-blue-500/30 transition flex flex-col justify-between"
              >
                {/* Event Banner */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={evt.coverImage || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80'}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Status & Category Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <EventStatusBadge event={evt} />
                    <RegistrationStatusBadge event={evt} />
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 text-[10px] font-mono font-bold">
                      {evt.category || 'Open'}
                    </span>
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-black text-white line-clamp-1">{evt.title}</h3>
                    <p className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{evt.tournStartDate || 'TBD'} to {evt.tournEndDate || 'TBD'}</span>
                      <span className="text-slate-500">•</span>
                      <span>{evt.venue || 'Main Track'}</span>
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{evt.description}</p>

                    {/* Sub-Events Price Breakdown Cards */}
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                        <span>🏆 Sub-Event Registration Fees ({subConfigList.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subConfigList.map((se) => (
                          <div
                            key={se.name}
                            className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                              se.enabled !== false
                                ? 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                                : 'bg-slate-100 dark:bg-slate-950 opacity-40 border-dashed border-slate-300 dark:border-slate-800'
                            }`}
                          >
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {se.name}
                              <span className="text-[9px] font-normal text-slate-400">({se.isRelay ? 'Relay' : 'Indiv'})</span>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{se.entryFee ?? 150} Fee</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <EventStatusActionButton 
                        event={evt} 
                        onToggleStatus={handleToggleEventStatus} 
                      />
                      <RegistrationActionButton 
                        event={evt} 
                        onToggle={handleToggleRegistrationOpen} 
                        onOpenEdit={handleOpenEdit} 
                      />

                      <button
                        onClick={() => handleOpenParticipants(evt)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Athletes Roster ({evt.registeredCount || 0})
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Event & Sub-Event Prices"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Athletics Event"
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

      {/* CREATE / EDIT EVENT MODAL WITH SUB-EVENT PRICES & PRIZES */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in my-8">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase">
                  {editingEvent ? 'EDIT ATHLETICS EVENT' : 'NEW ATHLETICS CHAMPIONSHIP PUBLISHER'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {editingEvent ? 'Edit Athletics Meet & Sub-Event Prices' : 'Configure Athletics Meet & Sub-Event Prices'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-6">
              
              {/* Event General Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Annual Inter-College Athletics Championship 2026"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Cover Banner Image
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      id="athletics-cover-input"
                    />
                    <label
                      htmlFor="athletics-cover-input"
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload & Crop Image
                    </label>
                    {formData.coverImage && (
                      <span className="text-[11px] text-emerald-500 font-mono font-bold">✓ Banner Attached</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Description & Overview
                  </label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the Athletics championship meet..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Venue</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Open">Open Category</option>
                      <option value="Boys">Boys Only</option>
                      <option value="Girls">Girls Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reg Start</label>
                    <input
                      type="date"
                      value={formData.regStartDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, regStartDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reg End</label>
                    <input
                      type="date"
                      value={formData.regEndDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, regEndDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Meet Start</label>
                    <input
                      type="date"
                      value={formData.tournStartDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tournStartDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Meet End</label>
                    <input
                      type="date"
                      value={formData.tournEndDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tournEndDate: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* DEDICATED SUB-EVENTS ENTRY FEES CONFIGURATION SECTION */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-500" /> Sub-Event Entry Fees
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Set custom registration entry fee (₹) for each Athletics sub-event.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, subEventsConfig: JSON.parse(JSON.stringify(DEFAULT_SUB_EVENTS_CONFIG)) }))}
                    className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] transition self-start sm:self-auto cursor-pointer"
                  >
                    Reset Default Fees
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.subEventsConfig.map((se, idx) => (
                    <div
                      key={se.name}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 dark:text-white">
                          <input
                            type="checkbox"
                            checked={se.enabled !== false}
                            onChange={(e) => handleSubEventConfigChange(idx, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <span className="line-clamp-1">{se.name}</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">({se.isRelay ? 'Relay' : 'Indiv'})</span>
                      </div>

                      {se.enabled !== false && (
                        <div className="text-xs pt-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Entry Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={se.entryFee}
                            onChange={(e) => handleSubEventConfigChange(idx, 'entryFee', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules & Guidelines */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Rules & Guidelines (One per line)
                </label>
                <textarea
                  rows="4"
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Required Documents */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Required Documents for Registration (One per line)
                </label>
                <textarea
                  rows="2"
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save & Publish Event
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS ROSTER DRAWER / MODAL */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase">
                  REGISTERED ATHLETES ROSTER
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedEventForParticipants.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForParticipants(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Export Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0B1120]">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search athlete, sub-event, college..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                onClick={handleExportCSV}
                disabled={filteredParticipants.length === 0}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Athletes CSV
              </button>
            </div>

            {/* Athletes Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No registered athletes found for this Athletics event.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                        <th className="p-3">#</th>
                        <th className="p-3">Athlete Name</th>
                        <th className="p-3">Sub-Event</th>
                        <th className="p-3">College Name</th>
                        <th className="p-3">Team Partner / Relay Members</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredParticipants.map((p, idx) => {
                        const isRelay = (p.selectedEvent || p.event || '').includes('relay') || (p.selectedEvents && p.selectedEvents.includes('4*100m relay Race'));
                        let relayText = 'N/A (Individual)';
                        if (p.player2?.name) {
                          relayText = p.player2.name;
                        } else if (p.roster && p.roster.length > 1) {
                          relayText = p.roster.slice(1).map((r) => r.name).filter(Boolean).join(', ');
                        }

                        return (
                          <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name || p.captainName || 'N/A'}</td>
                            <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.selectedEvent || p.event || (p.selectedEvents && p.selectedEvents[0]) || 'Athletics'}</td>
                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{p.collegeName || p.college || 'N/A'}</td>
                            <td className="p-3 text-slate-500 font-medium text-xs">{relayText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && cropperRawSrc && (
        <ImageCropperModal
          imageSrc={cropperRawSrc}
          aspectRatio={16 / 9}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropper(false)}
        />
      )}

    </div>
  );
};
