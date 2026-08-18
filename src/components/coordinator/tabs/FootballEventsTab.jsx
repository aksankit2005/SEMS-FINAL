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

export const FootballEventsTab = ({ user }) => {
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

  // Form State specifically for Football (Team Fee only, Min 11 & Max 18 players)
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Football',
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-08-25',
    tournStartDate: '2026-09-01',
    tournEndDate: '2026-09-03',
    teamFee: 2000, // Team registration fee ONLY
    minPlayers: 5, // Min players per squad (5-8 players)
    maxPlayers: 8, // Max players per squad (5-8 players)
    teamSize: '5 - 8 Players',
    registeredCount: 0,
    venue: 'Main Football Turf 1',
    category: 'Boys',
    status: 'Published',
    rules: [
      "1. Team Composition: 5 players on field (1 Goalkeeper + 4 Outfield players). Up to 3 rolling/flying substitutes. At least 4 players required to start/continue a match.",
      "2. Match Duration: 2 halves × 10 minutes each with a 5-minute half-time interval. Tied knockout matches go to penalty shootout (3 penalties per team, then sudden death).",
      "3. Kick-Off: Starts from center circle. Opponents must remain outside required distance. Goal can be scored directly from kick-off.",
      "4. Ball Out of Play: Sideline restarts via kick-in or throw-in. Goal line restarts via goal kick or corner kick. Ball must completely cross the line.",
      "5. Goalkeeper Rules: Goalkeeper can only handle ball inside penalty area. Cannot handle deliberate back-passes by foot. Must release ball within standard time limits.",
      "6. Fouls & Penalties: Penalty kick awarded for direct fouls inside defending penalty area. Includes kicking, tripping, pushing, holding, handball, or unsporting behavior.",
      "7. Cards & Suspension: 🟨 Yellow Card (warning/caution) | 🟥 Red Card (player sent off and cannot return). 2 Yellow Cards = 🟥 Red Card.",
      "8. Offside Rule: ❌ No Offside Rule in 5v5 mini-football format to keep play fast and dynamic.",
      "9. Free Kicks: Direct or indirect free kicks based on foul severity. Opponents must maintain required wall distance.",
      "10. Corner Kick: Awarded when defender last touches ball before crossing goal line. Taken from corner area.",
      "11. Penalty Kick: Awarded for direct fouls inside defending team's penalty area. Only goalkeeper defends; all other players remain behind penalty line.",
      "12. Discipline & Fair Play: Proper sports shoes and team jerseys mandatory. No jewelry or dangerous accessories. Abusive behavior or fighting results in disqualification."
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'Team Roster Approval Form'],
    contactName: user?.coordinatorName || 'Vikram Singh',
    contactEmail: user?.email || 'football.coord@apex.edu',
    contactPhone: '+91 98765 43214'
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
      addToast('Error loading football events console', 'error');
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
      sportName: 'Football',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-08-25',
      tournStartDate: eventObj.tournStartDate || '2026-09-01',
      tournEndDate: eventObj.tournEndDate || '2026-09-03',
      teamFee: typeof eventObj.teamFee === 'number' ? eventObj.teamFee : (typeof eventObj.entryFee === 'number' ? eventObj.entryFee : (eventObj.teamFee ?? eventObj.entryFee ?? 2000)),
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Main Football Turf 1',
      category: eventObj.category === 'Mixed' ? 'Boys' : (eventObj.category || 'Boys'),
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card'],
      contactName: eventObj.contactInfo?.name || user?.coordinatorName || 'Football Coordinator',
      contactEmail: eventObj.contactInfo?.email || user?.email || 'football.coord@apex.edu',
      contactPhone: eventObj.contactInfo?.phone || '+91 98765 43214'
    });
    setRulesInput(Array.isArray(eventObj.rules) ? eventObj.rules.join('\n') : '');
    setDocInput(Array.isArray(eventObj.requiredDocuments) ? eventObj.requiredDocuments.join('\n') : '');
    setShowCreateModal(true);
  };

  // Preset form on Create event
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: 'Inter-College Football Championship 2026',
      sportName: 'Football',
      coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      description: 'Official inter-college Football tournament. Register team entries (5 - 8 players) today!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-08-25',
      tournStartDate: '2026-09-01',
      tournEndDate: '2026-09-03',
      teamFee: 2000,
      minPlayers: 5,
      maxPlayers: 8,
      teamSize: '5 - 8 Players',
      registeredCount: 0,
      venue: 'Main Football Turf 1',
      category: 'Boys',
      status: 'Published',
      rules: [
        "1. Team Composition: 5 players on field (1 Goalkeeper + 4 Outfield players). Up to 3 rolling/flying substitutes. At least 4 players required to start/continue a match.",
        "2. Match Duration: 2 halves × 10 minutes each with a 5-minute half-time interval. Tied knockout matches go to penalty shootout (3 penalties per team, then sudden death).",
        "3. Kick-Off: Starts from center circle. Opponents must remain outside required distance. Goal can be scored directly from kick-off.",
        "4. Ball Out of Play: Sideline restarts via kick-in or throw-in. Goal line restarts via goal kick or corner kick. Ball must completely cross the line.",
        "5. Goalkeeper Rules: Goalkeeper can only handle ball inside penalty area. Cannot handle deliberate back-passes by foot. Must release ball within standard time limits.",
        "6. Fouls & Penalties: Penalty kick awarded for direct fouls inside defending penalty area. Includes kicking, tripping, pushing, holding, handball, or unsporting behavior.",
        "7. Cards & Suspension: 🟨 Yellow Card (warning/caution) | 🟥 Red Card (player sent off and cannot return). 2 Yellow Cards = 🟥 Red Card.",
        "8. Offside Rule: ❌ No Offside Rule in 5v5 mini-football format to keep play fast and dynamic.",
        "9. Free Kicks: Direct or indirect free kicks based on foul severity. Opponents must maintain required wall distance.",
        "10. Corner Kick: Awarded when defender last touches ball before crossing goal line. Taken from corner area.",
        "11. Penalty Kick: Awarded for direct fouls inside defending team's penalty area. Only goalkeeper defends; all other players remain behind penalty line.",
        "12. Discipline & Fair Play: Proper sports shoes and team jerseys mandatory. No jewelry or dangerous accessories. Abusive behavior or fighting results in disqualification."
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: user?.coordinatorName || 'Football Coordinator',
      contactEmail: user?.email || 'football.coord@apex.edu',
      contactPhone: '+91 98765 43214'
    });
    setRulesInput(`Football Tournament Rules (5 to 8 Players Format)

Team Composition: Squad size 5 to 8 players. Rolling substitutions allowed per match.
Match Duration: Two 20-minute halves with a 5-minute halftime interval.
Offside Rule: No offside rule in mini-football format.
Cards & Penalties: Yellow card = Warning | Red card = Player sent off.
Tied Matches: Direct penalty shootout (3 penalty kicks per team).
Equipment: Shin guards and sports/football shoes mandatory for all players.

📌 Additional Guidelines:
- Teams should report 15 minutes before scheduled match kickoff.
- Carry a valid college ID card for player verification.
- Late arrival may result in a walkover.
- Only registered players allowed on the team roster.`);
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
    addToast('Football cover banner cropped and attached successfully!', 'success');
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
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
        addToast(`Football registration event "${updated.title}" updated!`, 'success');
      } else {
        const created = await coordinatorApi.createEvent(eventPayload);
        setEvents((prev) => [created, ...prev]);
        addToast(`New Football registration event "${created.title}" published!`, 'success');
      }

      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      addToast('Failed to save Football event', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Football tournament event?')) return;
    try {
      await coordinatorApi.deleteEvent(id);
      setEvents((prev) => prev.filter((item) => item.id !== id));
      addToast('Football event deleted', 'info');
    } catch (err) {
      addToast('Failed to delete event', 'error');
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
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, status: nextStatus } : item)));
      addToast(`Event status changed to ${nextStatus}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleOpenParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    try {
      const regList = await coordinatorApi.getRegistrations();
      setParticipants(regList);
    } catch (err) {
      addToast('Failed to load registered teams', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-2xl font-bold">
            ⚽
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Football Event Registrations</span>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Team Sport Module
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage Football tournament events, squad sizes (5-8 players), registration dates & team entry fees.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Football Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading Football events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl mx-auto">
            ⚽
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Football Events Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Click the button above to publish your first Inter-College Football Tournament registration.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md"
          >
            Create Football Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((eventItem) => (
            <div
              key={eventItem.id}
              className="bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col shadow-sm"
            >
              {/* Cover Image & Status Badge */}
              <div className="relative h-40 bg-slate-800 overflow-hidden">
                <img
                  src={eventItem.coverImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'}
                  alt={eventItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(eventItem)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all ${
                      eventItem.status === 'Published'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : eventItem.status === 'Upcoming'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : eventItem.status === 'Closed'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    ● {eventItem.status}
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    ⚽ Football Team Tournament
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 truncate">{eventItem.title}</h3>
                </div>
              </div>

              {/* Event Info Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Team Entry Fee:
                    </span>
                    <span className="font-bold text-emerald-500 text-sm">
                      {(() => {
                        const fee = typeof eventItem.teamFee === 'number' ? eventItem.teamFee : (typeof eventItem.entryFee === 'number' ? eventItem.entryFee : (eventItem.teamFee ?? eventItem.entryFee ?? 2000));
                        return fee === 0 ? 'FREE (₹0)' : `₹${fee}`;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-500" /> Squad Limit:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {eventItem.teamSize || '11 - 18 Players'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Reg Deadline:
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {eventItem.regEndDate || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> Tournament Dates:
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {eventItem.tournStartDate} to {eventItem.tournEndDate}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenParticipants(eventItem)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/20 flex items-center justify-center gap-1 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Teams Roster</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(eventItem)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                    title="Edit Event"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteEvent(eventItem.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Football Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <span>{editingEvent ? 'Edit Football Event' : 'Create Football Registration Event'}</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APEX Inter-College Football Tournament 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Cover Banner Upload & Preview */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cover Banner Image
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-14 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                    <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold cursor-pointer hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Crop Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Squad Size & Team Fee Configuration */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Football Team Squad & Registration Fee Configuration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Team Entry Fee (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.teamFee}
                      onChange={(e) => setFormData({ ...formData, teamFee: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Min Players per Squad
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.minPlayers}
                      onChange={(e) => setFormData({ ...formData, minPlayers: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Max Players per Squad
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Dates & Location */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Reg Start</label>
                  <input
                    type="date"
                    required
                    value={formData.regStartDate}
                    onChange={(e) => setFormData({ ...formData, regStartDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Reg End</label>
                  <input
                    type="date"
                    required
                    value={formData.regEndDate}
                    onChange={(e) => setFormData({ ...formData, regEndDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Tourn Start</label>
                  <input
                    type="date"
                    required
                    value={formData.tournStartDate}
                    onChange={(e) => setFormData({ ...formData, tournStartDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Tourn End</label>
                  <input
                    type="date"
                    required
                    value={formData.tournEndDate}
                    onChange={(e) => setFormData({ ...formData, tournEndDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pitch Location, Gender Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Match Pitch / Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Football Turf 1"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Boys">Boys Tournament</option>
                    <option value="Girls">Girls Tournament</option>
                    <option value="Open">Open Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold"
                  >
                    <option value="Draft">Draft (Hidden)</option>
                    <option value="Upcoming">Upcoming (Coming Soon)</option>
                    <option value="Published">Published (Open)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Tournament Rules TextArea */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tournament Rules & Regulations (Line-by-line)
                </label>
                <textarea
                  rows={4}
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-600/30 hover:opacity-95"
                >
                  {editingEvent ? 'Save Changes' : 'Publish Football Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropperModal
          imageSrc={cropperRawSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropper(false)}
          aspectRatio={16 / 9}
        />
      )}

      {/* Roster / Participants Drawer */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Registered Football Teams Roster
                </h3>
                <p className="text-xs text-slate-400">{selectedEventForParticipants.title}</p>
              </div>
              <button onClick={() => setSelectedEventForParticipants(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {participants.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No teams registered yet.</p>
              ) : (
                participants.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{p.studentName || p.name}</p>
                      <p className="text-slate-400">{p.college || 'MPEC Kanpur'}</p>
                    </div>
                    <span className="font-bold text-emerald-500">{p.status || 'VERIFIED'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
