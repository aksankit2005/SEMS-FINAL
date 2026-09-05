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
import { resolveSportKey } from '../../../data/sportsConfig';
import { EventStatusBadge, RegistrationStatusBadge } from '../events/RegistrationStatusControl';
import { computeEffectiveRegistrationStatus } from '../../../utils/registrationLifecycle';

const DEFAULT_CHESS_PARTICIPANTS = [
  { id: 'REG-CHS-101', studentName: 'Kabir Singh', rollNumber: '210016010042', college: 'MPEC', department: 'Mechanical Engineering', year: '3rd Year', gender: 'Male', phone: '+91 98765 43210', email: 'kabir.singh@mpec.ac.in', category: 'Individual Rapid', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-102', studentName: 'Devendra Rao', rollNumber: '210038010045', college: 'MPCPS (KN142)', department: 'Pharmacy', year: '4th Year', gender: 'Male', phone: '+91 98765 43211', email: 'devendra.rao@mpcps.edu', category: 'Rapid Chess', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-103', studentName: 'Aarav Kulkarni', rollNumber: '220016010089', college: 'MPEC', department: 'Computer Science', year: '2nd Year', gender: 'Male', phone: '+91 98765 43212', email: 'aarav.k@mpec.ac.in', category: 'Open Blitz', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-104', studentName: 'Ananya Deshmukh', rollNumber: '230025010012', college: 'MIPS', department: 'Information Technology', year: '1st Year', gender: 'Female', phone: '+91 98765 43213', email: 'ananya.d@mips.edu', category: 'Girls Rapid', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-105', studentName: 'Rohan Banerjee', rollNumber: '210042010034', college: 'MPCP', department: 'Pharmacy', year: '3rd Year', gender: 'Male', phone: '+91 98765 43214', email: 'rohan.b@mpcp.edu', category: 'Open Rapid', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-106', studentName: 'Siddharth Iyer', rollNumber: '220055010067', college: 'MPDC', department: 'Dental Surgery', year: '2nd Year', gender: 'Male', phone: '+91 98765 43215', email: 'siddharth.i@mpdc.edu', category: 'Open Rapid', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-107', studentName: 'Meera Nambiar', rollNumber: '210066010022', college: 'MPCAMS', department: 'Biotechnology', year: '4th Year', gender: 'Female', phone: '+91 98765 43216', email: 'meera.n@mpcams.edu', category: 'Girls Rapid', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' },
  { id: 'REG-CHS-108', studentName: 'Vikramaditya Roy', rollNumber: '220016010156', college: 'MPEC', department: 'Electrical Engineering', year: '2nd Year', gender: 'Male', phone: '+91 98765 43217', email: 'vikram.roy@mpec.ac.in', category: 'Open Blitz', paymentStatus: 'Verified', feePaid: 300, sportId: 'chess', sportName: 'Chess' }
];

export const ChessEventsTab = ({ user }) => {
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

  // Form State specifically for Chess (Registration Entry Fee, Individual / Board format)
  const [formData, setFormData] = useState({
    title: '',
    sportName: 'Chess',
    coverImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    description: '',
    regStartDate: new Date().toISOString().split('T')[0],
    regEndDate: '2026-09-30',
    tournStartDate: '2026-10-01',
    tournEndDate: '2026-10-03',
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
      '1. Time Control: Each player gets 10 minutes + 5 seconds increment per move (FIDE Rapid format).',
      '2. Clock: The chess clock starts when White makes the first move. Players must press the clock with the same hand used to move.',
      '3. Touch-Move Rule: If a player touches their own piece, they must move it if a legal move exists. Touching an opponent\'s piece means it must be captured if legal.',
      '4. Illegal Moves: First illegal move gives opponent extra 2 minutes. Second illegal move results in immediate game loss.',
      '5. Win Conditions: Checkmate • Opponent\'s time runs out • Opponent resigns.',
      '6. Draw Conditions: Stalemate • 3-Fold Repetition • 50-Move Rule • Insufficient Mating Material • Mutual Agreement.',
      '7. Electronic Devices: Mobile phones and smartwatches must remain completely switched off in the playing hall.',
      '8. Arbiter Decision: The Chief Arbiter\'s ruling on all board disputes and claims is final and binding.'
    ],
    requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'FIDE / AICF ID Card (Optional)'],
    contactName: user?.coordinatorName || 'Chess Coordinator',
    contactEmail: user?.email || 'chess.coord@apex.edu',
    contactPhone: '+91 98765 43210'
  });

  const [rulesInput, setRulesInput] = useState('');
  const [docInput, setDocInput] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.status-dropdown-container')) {
        setActiveDropdownEventId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      let [list, allRegs] = await Promise.all([
        coordinatorApi.getEvents(),
        coordinatorApi.getRegistrations().catch(() => [])
      ]);

      // Seed default Chess participants if none exist in store
      let chessRegs = (allRegs || []).filter((d) => 
        (d.sportId === 'chess') || 
        resolveSportKey(d) === 'chess' ||
        (!d.sport || d.sport.toLowerCase().includes('chess') || d.eventTitle?.toLowerCase().includes('chess'))
      );

      if (chessRegs.length === 0) {
        try {
          const savedKey = `sems_participants_chess`;
          const localSaved = localStorage.getItem(savedKey);
          if (localSaved) {
            chessRegs = JSON.parse(localSaved);
          } else {
            chessRegs = DEFAULT_CHESS_PARTICIPANTS;
            localStorage.setItem(savedKey, JSON.stringify(DEFAULT_CHESS_PARTICIPANTS));
          }
        } catch (e) {
          chessRegs = DEFAULT_CHESS_PARTICIPANTS;
        }
      }

      // If no Chess events exist yet, create a default published event
      if (!list || list.length === 0) {
        const defaultEvent = {
          id: 'EVT-CHESS-2026',
          title: 'Inter-College Chess Championship 2026',
          sportId: 'chess',
          sportName: 'Chess',
          coverImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
          description: 'Official inter-college Rapid Chess tournament. Register your entry today!',
          regStartDate: todayStr,
          regEndDate: '2026-09-30',
          tournStartDate: '2026-10-01',
          tournEndDate: '2026-10-03',
          entryFee: 300,
          teamFee: 300,
          minPlayers: 1,
          maxPlayers: 1,
          teamSize: '1 Player (Individual)',
          maxRegistrations: 64,
          registeredCount: chessRegs.length,
          venue: 'Chess Hall A - Main Board Room',
          category: 'Open',
          status: 'Published',
          registrationOpen: true,
          rules: [
            '1. Time Control: 10 minutes + 5 seconds increment per move (FIDE Rapid format).',
            '2. Clock: The chess clock starts when White makes the first move.',
            '3. Touch-Move Rule: Touching a piece mandates moving it if legal.',
            '4. Illegal Moves: First gives extra 2 mins to opponent; Second loses the game.',
            '5. Win Conditions: Checkmate • Opponent time out • Resignation.',
            '6. Draw Conditions: Stalemate • 3-Fold Repetition • 50-Move Rule • Mutual Agreement.',
            '7. Mobile phones and electronic smartwatches strictly prohibited.'
          ],
          requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'FIDE / AICF ID Card (Optional)'],
          contactInfo: {
            name: user?.coordinatorName || 'Chess Coordinator',
            email: user?.email || 'chess.coord@apex.edu',
            phone: '+91 98765 43210'
          },
          createdAt: new Date().toISOString()
        };

        try {
          coordinatorApi.saveEvents([defaultEvent]);
        } catch (e) {}
        list = [defaultEvent];
      }

      // Map events and ensure registration counts and active dates
      const mapped = (list || []).map((ev) => {
        const matching = chessRegs.filter((r) => 
          r.eventId === ev.id || 
          r.eventTitle === ev.title || 
          (list.length === 1 && chessRegs.length > 0)
        );
        const actualCount = matching.length > 0 ? matching.length : (ev.registeredCount || chessRegs.length || 0);

        // Auto-heal expired date for Published events to keep registration active
        let adjustedEndDate = ev.regEndDate;
        let adjustedRegOpen = ev.registrationOpen;
        if (ev.status === 'Published' && (!ev.regEndDate || ev.regEndDate < todayStr)) {
          adjustedEndDate = '2026-09-30';
          adjustedRegOpen = true;
        }

        return {
          ...ev,
          regEndDate: adjustedEndDate,
          registrationOpen: adjustedRegOpen !== undefined ? adjustedRegOpen : (ev.status === 'Published'),
          registeredCount: actualCount
        };
      });

      setEvents(mapped);
      setParticipants(chessRegs);
    } catch (err) {
      addToast('Error loading chess events console', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preset form on Edit event
  const handleOpenEdit = (eventObj) => {
    setEditingEvent(eventObj);
    const minP = eventObj.minPlayers !== undefined ? eventObj.minPlayers : (eventObj.minMembers !== undefined ? eventObj.minMembers : 1);
    const maxP = eventObj.maxPlayers !== undefined ? eventObj.maxPlayers : (eventObj.maxMembers !== undefined ? eventObj.maxMembers : 1);
    const feeVal = typeof eventObj.entryFee === 'number' ? eventObj.entryFee : (typeof eventObj.teamFee === 'number' ? eventObj.teamFee : (eventObj.entryFee ?? eventObj.teamFee ?? 300));
    
    setFormData({
      title: eventObj.title || '',
      sportName: 'Chess',
      coverImage: eventObj.coverImage || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      description: eventObj.description || '',
      regStartDate: eventObj.regStartDate || new Date().toISOString().split('T')[0],
      regEndDate: eventObj.regEndDate || '2026-09-30',
      tournStartDate: eventObj.tournStartDate || '2026-10-01',
      tournEndDate: eventObj.tournEndDate || '2026-10-03',
      entryFee: feeVal,
      teamFee: feeVal,
      minPlayers: minP,
      maxPlayers: maxP,
      teamSize: minP === maxP ? `${minP} Player (Individual)` : `${minP} - ${maxP} Players`,
      registeredCount: eventObj.registeredCount || 0,
      venue: eventObj.venue || 'Chess Hall A - Main Board Room',
      category: eventObj.category || 'Open',
      status: eventObj.status || 'Published',
      rules: eventObj.rules || [
        '1. Time Control: 10 minutes + 5 seconds increment per move (FIDE Rapid format).',
        '2. Clock: Starts when White makes the first move.',
        '3. Touch-Move Rule: Touching a piece mandates moving or capturing it if legal.',
        '4. Illegal Moves: First gives extra 2 mins to opponent; Second loses the game.',
        '5. Win / Draw conditions as per standard FIDE Swiss Rapid rules.'
      ],
      requiredDocuments: eventObj.requiredDocuments || ['College Student ID Card', 'Aadhaar Card / Govt ID'],
      contactName: eventObj.contactInfo?.name || eventObj.contactName || user?.coordinatorName || 'Chess Coordinator',
      contactEmail: eventObj.contactInfo?.email || eventObj.contactEmail || user?.email || 'chess.coord@apex.edu',
      contactPhone: eventObj.contactInfo?.phone || eventObj.contactPhone || '+91 98765 43210'
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
      description: 'Official inter-college Rapid Chess tournament. Register your entry today!',
      regStartDate: new Date().toISOString().split('T')[0],
      regEndDate: '2026-09-30',
      tournStartDate: '2026-10-01',
      tournEndDate: '2026-10-03',
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
        '1. Time Control: Each player gets 10 minutes + 5 seconds increment per move (FIDE Rapid format).',
        '2. Clock: The chess clock starts when White makes the first move. Press clock after move.',
        '3. Touch-Move Rule: Touching an own piece mandates moving it if legal.',
        '4. Illegal Moves: First adds 2 mins to opponent; Second results in immediate game loss.',
        '5. Win Conditions: Checkmate • Opponent time out • Opponent resigns.',
        '6. Draw Conditions: Stalemate • 3-Fold Repetition • 50-Move Rule • Mutual Agreement.',
        '7. Mobile phones and electronic gadgets strictly prohibited in the playing hall.'
      ],
      requiredDocuments: ['College Student ID Card', 'Aadhaar Card / Govt ID', 'FIDE / AICF ID Card (Optional)'],
      contactName: user?.coordinatorName || 'Chess Coordinator',
      contactEmail: user?.email || 'chess.coord@apex.edu',
      contactPhone: '+91 98765 43210'
    });
    setRulesInput(
      '1. Time Control: 10 minutes + 5 seconds increment per move (FIDE Rapid format).\n' +
      '2. Clock: The chess clock starts when White makes the first move.\n' +
      '3. Touch-Move Rule: Touching an own piece mandates moving it if legal.\n' +
      '4. Illegal Moves: First gives extra 2 mins to opponent; Second loses the game.\n' +
      '5. Win Conditions: Checkmate • Opponent time out • Resignation.\n' +
      '6. Draw Conditions: Stalemate • 3-Fold Repetition • 50-Move Rule • Mutual Agreement.\n' +
      '7. College Student ID Card mandatory.'
    );
    setDocInput('College Student ID Card\nAadhaar Card / Govt ID\nFIDE / AICF ID Card (Optional)');
    setShowCreateModal(true);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files && e.target.files[0];
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
      ? `${formData.minPlayers} Player (Individual)` 
      : `${formData.minPlayers} - ${formData.maxPlayers} Players`;

    const targetStatus = formData.status || 'Published';

    const eventPayload = {
      ...formData,
      sportId: 'chess',
      sportName: 'Chess',
      status: targetStatus,
      registrationOpen: targetStatus === 'Published',
      entryFee: formData.entryFee,
      teamFee: formData.entryFee,
      minMembers: formData.minPlayers,
      maxMembers: formData.maxPlayers,
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

  // Quick Action Handler from Roll-Down Dropdown Menu
  const handleSetEventStatus = async (eventObj, actionType) => {
    setActiveDropdownEventId(null);
    try {
      let patchPayload = {};
      const todayStr = new Date().toISOString().split('T')[0];

      if (actionType === 'OPEN') {
        patchPayload = {
          status: 'Published',
          registrationOpen: true,
          regEndDate: !eventObj.regEndDate || eventObj.regEndDate < todayStr ? '2026-09-30' : eventObj.regEndDate
        };
        addToast(`Event "${eventObj.title}" is now OPEN for registrations!`, 'success');
      } else if (actionType === 'CLOSE') {
        patchPayload = {
          status: 'Closed',
          registrationOpen: false
        };
        addToast(`Registration for "${eventObj.title}" is now CLOSED`, 'info');
      } else if (actionType === 'UPCOMING') {
        patchPayload = {
          status: 'Upcoming',
          registrationOpen: false
        };
        addToast(`Event "${eventObj.title}" marked as UPCOMING (Coming Soon)`, 'info');
      } else if (actionType === 'EXTEND') {
        handleOpenEdit(eventObj);
        return;
      }

      const updated = await coordinatorApi.updateEvent(eventObj.id, patchPayload);
      setEvents((prev) => prev.map((item) => (item.id === eventObj.id ? { ...item, ...updated, ...patchPayload } : item)));
    } catch (err) {
      addToast('Failed to update event registration status', 'error');
    }
  };

  const handleViewParticipants = async (eventObj) => {
    setSelectedEventForParticipants(eventObj);
    try {
      const allRegs = await coordinatorApi.getRegistrations();
      let eventRegs = (allRegs || []).filter((r) => 
        r.eventId === eventObj.id || 
        r.eventTitle === eventObj.title || 
        r.sportId === 'chess' || 
        resolveSportKey(r) === 'chess'
      );
      if (eventRegs.length === 0) {
        eventRegs = participants.length > 0 ? participants : DEFAULT_CHESS_PARTICIPANTS;
      }
      setParticipants(eventRegs);
    } catch (err) {
      addToast('Failed to load roster registrations', 'error');
    }
  };

  // Dashboard Stats calculation
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => {
    const st = computeEffectiveRegistrationStatus(e);
    return st.effectiveRegistrationOpen || e.status === 'Published' || (e.status !== 'Draft' && e.status !== 'Closed' && e.status !== 'Completed');
  }).length;
  const upcomingEvents = events.filter((e) => (e.status || '').toLowerCase() === 'upcoming').length;
  const closedEvents = events.filter((e) => (e.status || '').toLowerCase() === 'closed').length;
  const totalRegCount = events.reduce((acc, curr) => acc + (curr.registeredCount || participants.length || 0), 0);
  const totalRevenue = events.reduce((acc, curr) => {
    const fee = typeof curr.entryFee === 'number' ? curr.entryFee : (typeof curr.teamFee === 'number' ? curr.teamFee : (curr.entryFee ?? curr.teamFee ?? 300));
    const count = curr.registeredCount || participants.length || 0;
    return acc + (count * fee);
  }, 0);

  const filteredParticipants = participants.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      (p.teamName || p.studentName || p.captainName || '').toLowerCase().includes(q) ||
      (p.college || p.collegeName || '').toLowerCase().includes(q) ||
      (p.department || p.branch || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* TOP DASHBOARD STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Chess Events</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Active Events</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{activeEvents}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Total Registrations</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">{totalRegCount}</p>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400">Estimated Revenue</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</p>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const registered = event.registeredCount || participants.length || 0;
              const fee = typeof event.entryFee === 'number' ? event.entryFee : (typeof event.teamFee === 'number' ? event.teamFee : (event.entryFee ?? event.teamFee ?? 300));
              const minP = event.minPlayers !== undefined ? event.minPlayers : (event.minMembers !== undefined ? event.minMembers : 1);
              const maxP = event.maxPlayers !== undefined ? event.maxPlayers : (event.maxMembers !== undefined ? event.maxMembers : 1);
              const teamSizeStr = event.teamSize || (minP === maxP ? `${minP} Player` : `${minP} - ${maxP} Players`);
              const statusInfo = computeEffectiveRegistrationStatus(event);

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

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <EventStatusBadge event={event} />
                      <RegistrationStatusBadge event={event} />
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold border border-slate-800">
                        {event.category || 'Open'}
                      </span>
                    </div>

                    {/* Entry Fee Display Badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black text-amber-400 border border-amber-500/30 shadow-md">
                      Entry Fee: ₹{fee}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                        ♟ CHESS TOURNAMENT
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
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Hall / Venue</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px] truncate block">{event.venue || 'Chess Hall A - Main Board Room'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-mono">Board Limits</span>
                        <span className="font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-500" />
                          {teamSizeStr}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar - Clean and Unified */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Unified Status Roll-Down Menu */}
                        <div className="relative status-dropdown-container">
                          <button
                            type="button"
                            onClick={() => setActiveDropdownEventId(activeDropdownEventId === event.id ? null : event.id)}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer ${
                              statusInfo.effectiveRegistrationOpen || event.status === 'Published'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : statusInfo.code === 'UPCOMING' || statusInfo.code === 'NOT_STARTED' || (event.status || '').toLowerCase() === 'upcoming'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              statusInfo.effectiveRegistrationOpen || event.status === 'Published' ? 'bg-emerald-500 animate-pulse' : statusInfo.code === 'UPCOMING' || (event.status || '').toLowerCase() === 'upcoming' ? 'bg-blue-500' : 'bg-rose-500'
                            }`} />
                            <span>
                              {statusInfo.effectiveRegistrationOpen || event.status === 'Published'
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
                                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                                <span>Extend End Date (Edit)</span>
                              </button>
                            </div>
                          )}
                        </div>

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
                  ♟ Chess Event Configurator
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

              {/* PRICING & BOARD LIMITS */}
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
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Default: 1 (Individual)</p>
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
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Default: 1 (Individual)</p>
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
                    <option value="Published">Published (Open)</option>
                    <option value="Upcoming">Upcoming (Coming Soon)</option>
                    <option value="Draft">Draft (Hidden)</option>
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

              {/* Coordinator Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Coordinator Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
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
                  placeholder="Official FIDE Rapid / Blitz rules apply&#10;Time control: 10min + 5s increment&#10;Touch-move rule strictly enforced"
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
                    const csvData = filteredParticipants.map((p) => ({
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
                          {p.college || p.collegeName || 'Inter-College'} • {p.department || p.branch || 'Engineering'} • {p.phone || p.captainPhone || 'No Phone'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ● {p.paymentStatus || 'Verified'}
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
