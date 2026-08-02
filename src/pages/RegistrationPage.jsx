import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Trophy, ArrowLeft, User, Users, Info, ShieldCheck, Sparkles, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { SPORTS_DATA } from '../data/sportsData';
import { SPORTS_CONFIG } from '../data/sportsConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { coordinatorApi } from '../services/coordinatorApi';
import { RazorpayModal } from '../components/registration/RazorpayModal';

// Import newly created modular components
import { SportCard } from '../components/registration/SportCard';
import { RegistrationStepper } from '../components/registration/RegistrationStepper';
import { PlayerDetailsForm, validateIndividualForm } from '../components/registration/PlayerDetailsForm';
import { TeamDetailsForm, validateTeamForm } from '../components/registration/TeamDetailsForm';
import { PaymentForm } from '../components/registration/PaymentForm';
import { RegistrationReceipt } from '../components/registration/RegistrationReceipt';
import { generateCollegePassCode } from '../utils/pdfExporter';


const MOCK_RECEIPT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%25' height='100%25' fill='%230f172a'/><text x='50%25' y='35%25' fill='%2310b981' font-family='sans-serif' font-size='22' font-weight='black' text-anchor='middle'>APEX 2026</text><text x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>MOCK PAYMENT SUCCESSFUL</text><text x='50%25' y='65%25' fill='%2364748b' font-family='sans-serif' font-size='10' font-weight='medium' text-anchor='middle'>UTR: TXN-APEX-MOCK-998</text><rect x='20' y='220' width='260' height='50' fill='%231e293b' rx='10'/><text x='50%25' y='250%25' fill='%2338bdf8' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle'>VERIFIED DEMO RECEIPT</text></svg>";

export const RegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { addRegistration } = useAuth();
  const { addToast } = useToast();

  const preselectedSportId = searchParams.get('sport');

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    try {
      const cleanStr = String(dateStr).split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Load configuration and merge with existing sports data
  const [sportsList] = useState(() => {
    const list = SPORTS_DATA.map((sport) => {
      const config = SPORTS_CONFIG[sport.id] || {
        startDate: "2026-07-20",
        endDate: "2026-08-15",
        minPlayers: 1,
        maxPlayers: 1
      };
      return {
        ...sport,
        ...config
      };
    });

    const gullyCricket = {
      id: "gully-cricket",
      name: "Gully Cricket",
      category: "Outdoor",
      type: "Team (5-8 Players)",
      tagline: "Nostalgic Gully Rules & Intense Matchups",
      description: "Fast-paced, high-fun gully cricket with unique local rules. Bring your team and relive childhood memories!",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYTENZs6EFVZgdCAhlvuzBiLHu0Pty9fKyTRI3Q5cuhQ&s=10",
      icon: "Trophy",
      status: "Open",
      participantsCount: 8,
      maxParticipants: 16,
      entryFee: 1000,
      teamSize: "5 - 8 Players",
      venue: "Central Ground B",
      rules: [
        "Minimum 5 players, maximum 8 players per team.",
        "Underarm bowling only.",
        "One-tip out option valid as per gully rules.",
        "Tennis balls will be used."
      ],
      schedule: "Day 3 - 09:30 AM onwards",
      startDate: "2026-07-01",
      endDate: "2026-08-30",
      minPlayers: 5,
      maxPlayers: 8
    };

    return [...list, gullyCricket];
  });

  const [activeSport, setActiveSport] = useState(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Declaration & Payment, 3: Receipt
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    collegeName: '',
    teamName: '',
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    eventType: 'Singles', // TT/Badminton toggle: Singles or Doubles
    selectedEvents: [],   // Athletics
    roster: [],
    paymentMethod: 'upi',
    upiId: '',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
    selectedBank: '',
    declarationAccepted: false,
    declarationTimestamp: null
  });

  const [errors, setErrors] = useState({});
  const [completedReceipt, setCompletedReceipt] = useState(null);

  // Coordinator Published Events state & Razorpay Modal state
  const [coordinatorEvents, setCoordinatorEvents] = useState([]);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  useEffect(() => {
    const fetchCoordinatorEvents = async () => {
      try {
        const events = await coordinatorApi.getPublicEvents();
        setCoordinatorEvents(events || []);
      } catch (err) {
        console.warn('Error fetching public coordinator events', err);
      }
    };

    fetchCoordinatorEvents();

    const handleRefresh = () => fetchCoordinatorEvents();
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (eventId && coordinatorEvents.length > 0) {
      let foundEvent = coordinatorEvents.find((e) => String(e.id) === String(eventId));

      if (!foundEvent) {
        const sportMatches = coordinatorEvents.filter((e) => {
          const sId = (e.sportId || '').toLowerCase();
          const sName = (e.sportName || '').toLowerCase();
          const title = (e.title || '').toLowerCase();
          const target = eventId.toLowerCase();
          return (sId === target || sName === target || title.includes(target)) && (e.status === 'Published' || e.status === 'Open');
        });
        if (sportMatches.length > 0) {
          foundEvent = sportMatches[0];
        }
      }

      if (foundEvent) {
        const matchedSport = sportsList.find((s) => s.id === (foundEvent.sportId || '').toLowerCase()) || {
          id: foundEvent.sportId || 'sport',
          name: foundEvent.sportName || foundEvent.title || 'Sport Event',
          category: foundEvent.category || 'Outdoor',
          type: foundEvent.teamSize || 'Team / Individual',
          tagline: foundEvent.description || 'Championship Event',
          description: foundEvent.description || '',
          image: foundEvent.coverImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
          entryFee: Number(foundEvent.entryFee || 300),
          teamSize: foundEvent.teamSize || '1 Player',
          venue: foundEvent.venue || 'Central Arena',
          rules: foundEvent.rules || ['Official rules apply.'],
          startDate: foundEvent.regStartDate || '2026-08-01',
          endDate: foundEvent.regEndDate || '2026-08-30'
        };

        setActiveSport({
          ...matchedSport,
          activeEventId: foundEvent.id,
          eventName: foundEvent.title || foundEvent.event_name,
          entryFee: foundEvent.entryFee !== undefined ? Number(foundEvent.entryFee) : matchedSport.entryFee,
          startDate: foundEvent.regStartDate || matchedSport.startDate,
          endDate: foundEvent.regEndDate || matchedSport.endDate,
          tournStartDate: foundEvent.tournStartDate || foundEvent.event_date || matchedSport.startDate,
          tournEndDate: foundEvent.tournEndDate || foundEvent.tournStartDate || matchedSport.endDate,
          venue: foundEvent.venue || matchedSport.venue,
          rules: foundEvent.rules || matchedSport.rules,
          requiredDocuments: foundEvent.requiredDocuments || ['College ID Card']
        });
        setStep(1);
      } else {
        const staticSport = sportsList.find((s) => s.id === eventId.toLowerCase());
        if (staticSport) {
          setActiveSport(staticSport);
          setStep(1);
        } else {
          addToast('Registration is not available for this sport or event.', 'error');
        }
      }
    }
  }, [eventId, coordinatorEvents, sportsList]);


  // Set pre-selected sport if search param exists and matches an open sport
  useEffect(() => {
    if (preselectedSportId) {
      const found = sportsList.find((s) => s.id === preselectedSportId);
      if (found) {
        // Verify it is open
        const now = new Date();
        const start = new Date(found.startDate + 'T00:00:00');
        const end = new Date(found.endDate + 'T23:59:59');
        if (now >= start && now <= end) {
          setActiveSport(found);
          setStep(1);
        }
      }
    }
  }, [preselectedSportId, sportsList]);

  // Reset form state on sport change
  useEffect(() => {
    if (activeSport) {
      setFormData({
        collegeName: '',
        teamName: '',
        captainName: '',
        captainPhone: '',
        captainEmail: '',
        eventType: activeSport.id === 'table-tennis' || activeSport.id === 'badminton' ? 'Singles' : 'Individual',
        selectedEvents: [],
        roster: [],
        paymentMethod: 'upi',
        upiId: '',
        cardNumber: '',
        cardHolder: '',
        cardExpiry: '',
        cardCvv: '',
        selectedBank: '',
        declarationAccepted: false,
        declarationTimestamp: null
      });
      setErrors({});
      setCompletedReceipt(null);
    }
  }, [activeSport]);

  const handleSportSelect = (sport) => {
    const isRacket = sport.id === 'table-tennis' || sport.id === 'badminton';
    const sFee = sport.singlesFee !== undefined ? sport.singlesFee : 300;
    const dFee = sport.doublesFee !== undefined ? sport.doublesFee : 600;
    const initialFee = isRacket ? sFee : sport.entryFee;

    setActiveSport({
      ...sport,
      entryFee: initialFee,
      singlesFee: sFee,
      doublesFee: dFee
    });
    setStep(1);
  };


  const handleBackToSports = () => {
    setActiveSport(null);
    setStep(1);
    setErrors({});
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  // Step 1 Validation
  const handleDetailsSubmit = () => {
    let formErrors = {};
    const isTeamLayout =
      ['football', 'basketball', 'volleyball', 'cricket', 'kabaddi', 'tug-of-war', 'kho-kho', 'gully-cricket'].includes(activeSport.id) ||
      ((activeSport.id === 'table-tennis' || activeSport.id === 'badminton') && formData.eventType === 'Doubles');

    if (isTeamLayout) {
      formErrors = validateTeamForm(activeSport, formData);
    } else {
      formErrors = validateIndividualForm(activeSport, formData);
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      const firstError = Object.values(formErrors)[0];
      addToast(firstError, 'error');
      return;
    }

    setErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Razorpay Payment Success Handler
  const handleRazorpaySuccess = async (paymentRes) => {
    setShowRazorpayModal(false);
    setIsProcessingPayment(true);

    try {
      // Register event with coordinator backend API
      const result = await coordinatorApi.registerForEvent(
        activeSport.id,
        activeSport.sportId || activeSport.id,
        {
          fullName: formData.captainName || (formData.roster[0] && formData.roster[0].name) || 'Lead Athlete',
          captainName: formData.captainName,
          email: formData.captainEmail,
          phone: formData.captainPhone,
          gender: formData.roster[0]?.gender || 'Male',
          collegeName: formData.collegeName || 'MPEC',
          department: formData.roster[0]?.department || 'Engineering',
          enrollmentNo: formData.roster[0]?.rollNumber || 'ENR2026-001',
          teamName: formData.teamName,
          emergencyContact: formData.captainPhone,
          entryFee: activeSport.entryFee
        },
        paymentRes
      );

      // Re-fetch public coordinator events to update slot counts in real-time
      const updatedEvents = await coordinatorApi.getPublicEvents();
      setCoordinatorEvents(updatedEvents);

      const firstRosterPlayer = formData.roster && formData.roster[0];
      const selectedCollegeName = formData.collegeName || (firstRosterPlayer && firstRosterPlayer.college) || 'ST XAVIERS COLLEGE';
      const passCode = generateCollegePassCode(selectedCollegeName, activeSport.name);

      let eventCategory = activeSport.category;
      if (activeSport.id === 'table-tennis' || activeSport.id === 'badminton') {
        eventCategory = `${activeSport.category} (${formData.eventType})`;
      } else if (activeSport.id === 'athletics') {
        eventCategory = `Athletics (${formData.selectedEvents.join(', ')})`;
      }

      const receipt = {
        receiptId: result.receipt?.id || `REC-APEX-${Math.floor(10000 + Math.random() * 90000)}`,
        sportName: activeSport.name,
        category: eventCategory,
        participantName: formData.captainName || (firstRosterPlayer && firstRosterPlayer.name) || 'Lead Athlete',
        fatherName: (firstRosterPlayer && firstRosterPlayer.fatherName) || formData.fatherName || 'N/A',
        gender: (firstRosterPlayer && firstRosterPlayer.gender) || formData.gender || 'Male',
        dob: (firstRosterPlayer && firstRosterPlayer.dob) || formData.dob || '2004-05-15',
        college: selectedCollegeName,
        districtState: selectedCollegeName,
        email: formData.captainEmail || (firstRosterPlayer && firstRosterPlayer.email) || 'athlete@college.edu',
        phone: formData.captainPhone || (firstRosterPlayer && firstRosterPlayer.phone) || '+91 98765 43210',
        teamName: formData.teamName || '',
        feePaid: activeSport.entryFee,
        rosterCount: formData.roster.length,
        roster: formData.roster,
        utrNumber: paymentRes.razorpayPaymentId,
        screenshotName: 'razorpay_verified.png',
        screenshot: MOCK_RECEIPT_IMAGE,
        declarationAccepted: formData.declarationAccepted,
        declarationTimestamp: formData.declarationTimestamp,
        status: 'PAID',
        date: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        passCode
      };

      setCompletedReceipt(receipt);
      addRegistration(receipt);
      addToast('Registration & Razorpay Payment Successful!', 'success');
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      addToast('Error processing event registration', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Step 2 Submission (Payment Gateway & Declaration)
  const handlePaymentSubmit = (e) => {
    if (e) e.preventDefault();

    if (!formData.declarationAccepted) {
      setErrors((prev) => ({ ...prev, declarationAccepted: 'Please accept the declaration and verification policy' }));
      addToast('Please accept the declaration and verification policy.', 'error');
      return;
    }

    if (activeSport.entryFee > 0) {
      // Open Razorpay Payment Gateway Modal for paid events
      setShowRazorpayModal(true);
    } else {
      // Free events (Entry Fee = 0): Skip payment and confirm instantly
      handleRazorpaySuccess({
        razorpayPaymentId: `FREE_PASS_${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: `order_free_${Date.now()}`,
        amount: 0,
        status: 'FREE_CONFIRMED'
      });
    }
  };


  // Handle Event Type Singles/Doubles toggle inside Details Step with dynamic fee recalculation
  const handleEventTypeToggle = (type) => {
    setFormData((prev) => ({
      ...prev,
      eventType: type,
      teamName: type === 'Singles' ? '' : prev.teamName,
      roster: [] // reset roster size to reinitialize correctly
    }));

    if (activeSport) {
      const sFee = activeSport.singlesFee !== undefined ? activeSport.singlesFee : 300;
      const dFee = activeSport.doublesFee !== undefined ? activeSport.doublesFee : 600;
      const updatedFee = type === 'Singles' ? sFee : dFee;
      setActiveSport((prev) => ({
        ...prev,
        entryFee: updatedFee
      }));
    }

    setErrors({});
  };

  // Determine layout and render Step 1
  const renderDetailsStep = () => {
    const isRacketSport = activeSport.id === 'table-tennis' || activeSport.id === 'badminton';

    return (
      <div className="space-y-6">
        {/* Selected Event Dynamic Info Card */}
        {activeSport && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4 mb-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Sport: {activeSport.name}</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Event: {activeSport.eventName || activeSport.name}</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Fee: ₹{activeSport.entryFee}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Registration Start Date</span>
                <span className="font-bold">{formatDateDDMMYYYY(activeSport.startDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Registration Last Date</span>
                <span className="font-bold">{formatDateDDMMYYYY(activeSport.endDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Event Start Date</span>
                <span className="font-bold">{formatDateDDMMYYYY(activeSport.tournStartDate || activeSport.startDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Event End Date</span>
                <span className="font-bold">{formatDateDDMMYYYY(activeSport.tournEndDate || activeSport.tournStartDate || activeSport.endDate)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Venue</span>
                <span className="font-bold truncate">{activeSport.venue || 'Central Arena'}</span>
              </div>
            </div>

            {activeSport.rules && activeSport.rules.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Official Rules:</span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {activeSport.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Racket Sport Singles/Doubles Selection */}
        {isRacketSport && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Select Event Mode & Fee <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Singles')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition ${formData.eventType === 'Singles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Singles (1 Player)
                </div>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  Singles Fee: ₹{activeSport.singlesFee !== undefined ? activeSport.singlesFee : 300}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Doubles')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition ${formData.eventType === 'Doubles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Doubles (2 Players)
                </div>
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                  Doubles Fee: ₹{activeSport.doublesFee !== undefined ? activeSport.doublesFee : 600}
                </span>
              </button>
            </div>
          </div>
        )}


        {/* Dynamic sub-forms */}
        {isRacketSport ? (
          formData.eventType === 'Singles' ? (
            <PlayerDetailsForm
              sport={activeSport}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          ) : (
            <TeamDetailsForm
              sport={{ ...activeSport, minPlayers: 2, maxPlayers: 2 }}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          )
        ) : ['chess', 'athletics'].includes(activeSport.id) ? (
          <PlayerDetailsForm
            sport={activeSport}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        ) : (
          <TeamDetailsForm
            sport={activeSport}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4 text-orange-500" /> Multi-Step Sports Registration
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Athlete & Team <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Registration</span>
          </h1>
        </div>

        {/* SPORTS LIST & COORDINATOR EVENTS STATE */}
        {!activeSport ? (
          <div className="space-y-8">
            
            {/* DYNAMIC COORDINATOR PUBLISHED EVENTS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  Official Coordinator Events
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                  Live Events ({
                    (coordinatorEvents || []).filter((evt) => {
                      return evt && evt.id !== 'EVT-BADMINTON-001' && evt.id !== 'EVT-CRICKET-001' && evt.id !== 'EVT-FOOTBALL-001';
                    }).length
                  })
                </span>
              </div>

              {(coordinatorEvents || []).filter((evt) => {
                return evt && evt.id !== 'EVT-BADMINTON-001' && evt.id !== 'EVT-CRICKET-001' && evt.id !== 'EVT-FOOTBALL-001';
              }).length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8 space-y-3">
                  <Sparkles className="w-12 h-12 text-indigo-500 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Coordinator Events Currently Available</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Published events created by Sport Coordinators will appear here dynamically for registration.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  {(coordinatorEvents || []).filter((evt) => {
                    return evt && evt.id !== 'EVT-BADMINTON-001' && evt.id !== 'EVT-CRICKET-001' && evt.id !== 'EVT-FOOTBALL-001';
                  }).map((evt) => {
                    const registered = evt.registeredCount || 0;
                    const limit = evt.maxRegistrations || 64;
                    const slotsLeft = Math.max(0, limit - registered);
                    const isClosed = evt.status === 'Closed' || slotsLeft === 0;

                    return (
                      <div
                        key={evt.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between group"
                      >
                        <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                          <img
                            src={evt.coverImage}
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase shadow-md ${
                              isClosed
                                ? 'bg-rose-500 text-white'
                                : 'bg-emerald-500 text-white'
                            }`}>
                              {isClosed ? '● Registration Closed' : '● Registration Open'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-950/70 text-white text-[10px] font-bold border border-white/20">
                              {evt.category}
                            </span>
                          </div>

                          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-black text-amber-400 border border-slate-700">
                            Fee: {evt.singlesFee ? `Singles ₹${evt.singlesFee} | Doubles ₹${evt.doublesFee}` : evt.entryFee > 0 ? `₹${evt.entryFee}` : 'FREE'}
                          </div>

                          <div className="absolute bottom-3 left-4 right-4">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                              {evt.sportName} Coordinator Event
                            </span>
                            <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">
                              {evt.title}
                            </h3>
                          </div>
                        </div>

                        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                            {evt.description}
                          </p>

                          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Reg Dates</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{evt.regStartDate} to {evt.regEndDate}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tournament</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{evt.tournStartDate} to {evt.tournEndDate}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Venue</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] truncate block">{evt.venue}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Team Size</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{evt.teamSize}</span>
                            </div>
                          </div>

                          {/* Total Registered Display */}
                          <div className="flex justify-between text-xs pt-1">
                            <span className="font-bold text-slate-500 dark:text-slate-400">Total Registered</span>
                            <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                              {registered} Participants
                            </span>
                          </div>

                          <div className="pt-2">
                            <button
                              disabled={isClosed}
                              onClick={() => {
                                const adaptedSport = {
                                  id: evt.sportId || 'badminton',
                                  name: evt.title,
                                  sportName: evt.sportName,
                                  category: evt.category,
                                  type: evt.teamSize,
                                  tagline: evt.title,
                                  description: evt.description,
                                  image: evt.coverImage,
                                  status: isClosed ? 'Closed' : 'Open',
                                  participantsCount: registered,
                                  maxParticipants: limit,
                                  entryFee: evt.singlesFee !== undefined ? evt.singlesFee : (evt.entryFee || 300),
                                  singlesFee: evt.singlesFee !== undefined ? evt.singlesFee : 300,
                                  doublesFee: evt.doublesFee !== undefined ? evt.doublesFee : 600,
                                  teamSize: evt.teamSize,
                                  venue: evt.venue,
                                  rules: evt.rules || ['Standard rules apply.'],
                                  startDate: evt.regStartDate,
                                  endDate: evt.regEndDate,
                                  isCoordinatorEvent: true,
                                  eventId: evt.id
                                };
                                setActiveSport(adaptedSport);
                                setStep(1);
                              }}
                              className={`w-full py-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                                isClosed
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-blue-500/20 active:scale-[0.98]'
                              }`}
                            >
                              <span>{isClosed ? (slotsLeft === 0 ? 'Event Full' : 'Registration Closed') : 'Register Now'}</span>
                              <Trophy className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (

          /* ACTIVE STEPS WIZARD */
          <div className="space-y-6">

            {/* Back to selector link */}
            {step < 3 && (
              <button
                onClick={handleBackToSports}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 dark:text-slate-400 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
              </button>
            )}

            {/* Steps bar */}
            <RegistrationStepper currentStep={step} />

            {/* Wizard Body Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl">

              {/* STEP 1: DETAILS */}
              {step === 1 && (
                <div className="space-y-6">
                  {renderDetailsStep()}
                  <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleDetailsSubmit}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition active:scale-[0.98]"
                    >
                      <span>Proceed to Payment</span>
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DECLARATION & PAYMENT GATEWAY */}
              {step === 2 && (
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  
                  {/* Card 1: MANDATORY DECLARATION CARD (FIRST THING USER SEES) */}
                  <div className="p-6 rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 space-y-4 shadow-lg transition duration-300">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-wider text-slate-900 dark:text-white text-sm">
                            1. Mandatory Athlete Declaration & Rules Agreement
                          </h4>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                            Must be read & accepted prior to payment checkout
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                        Step 2 First Action
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/80 border border-amber-500/20">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "I hereby declare that the information provided by me in this registration form is true and correct to the best of my knowledge. I agree to abide by all the rules and regulations of the sports event. If I am found guilty of providing false information or engaging in any act of indiscipline or misconduct, I understand that I may be disqualified, and I agree to accept the decision of the Organizing Committee as final."
                      </p>
                    </div>

                    {/* Mandatory Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition">
                      <input
                        type="checkbox"
                        checked={formData.declarationAccepted || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            declarationAccepted: val,
                            declarationTimestamp: val ? new Date().toISOString() : null
                          }));
                          if (errors.declarationAccepted) {
                            setErrors((prev) => ({ ...prev, declarationAccepted: null }));
                          }
                        }}
                        className="w-5 h-5 mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        I have read, understood, and agree to the above mandatory declaration, discipline rules, and university verification policy.
                      </span>
                    </label>
                    {errors.declarationAccepted && (
                      <p className="text-xs text-rose-500 font-black flex items-center gap-1">
                        ⚠️ {errors.declarationAccepted}
                      </p>
                    )}
                  </div>

                  {/* Card 2: Verification & Approval Information */}
                  <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 text-slate-800 dark:text-blue-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs space-y-1.5">
                      <h4 className="font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">2. College Verification Policy</h4>
                      <p className="leading-relaxed">
                        After payment, your entry pass is generated immediately and sent to your College Sports Desk for verification. If any eligibility discrepancy is flagged, full payment refund will be processed to your source account.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Payment Gateway Form */}
                  <PaymentForm
                    sport={activeSport}
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    setErrors={setErrors}
                  />

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handlePrevStep}
                      className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2 transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={isProcessingPayment || !formData.declarationAccepted}
                      className={`px-8 py-3 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition ${formData.declarationAccepted && !isProcessingPayment
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-blue-500/20 active:scale-[0.98]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200/40 dark:border-slate-700/40'
                        }`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Processing Pay...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay & Register</span>
                          <Trophy className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: RECEIPT */}
              {step === 3 && completedReceipt && (
                <RegistrationReceipt
                  receipt={completedReceipt}
                  onGoToDashboard={handleBackToSports}
                />
              )}

            </div>
          </div>
        )}

        {/* RAZORPAY PAYMENT GATEWAY MODAL */}
        {showRazorpayModal && activeSport && (
          <RazorpayModal
            event={{ title: activeSport.name, entryFee: activeSport.entryFee }}
            amount={activeSport.entryFee}
            participantName={formData.captainName || (formData.roster[0] && formData.roster[0].name) || 'Lead Athlete'}
            onClose={() => setShowRazorpayModal(false)}
            onSuccess={handleRazorpaySuccess}
          />
        )}

      </div>
    </div>
  );
};

export default RegistrationPage;

