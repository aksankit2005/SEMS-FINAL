import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Trophy, ArrowLeft, User, Users, Info, ShieldCheck, Sparkles, Calendar, MapPin, Clock, Loader2, Lock, Filter, ChevronDown, Check } from 'lucide-react';
import { SPORTS_DATA } from '../data/sportsData';
import { SPORTS_CONFIG, SPORT_PLAYER_BOUNDS, resolveSportKey } from '../data/sportsConfig';
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
import { BadmintonRulesDisplay, BadmintonRulesModal } from '../components/registration/BadmintonRulesDisplay';
import { computeEffectiveRegistrationStatus, parseRegistrationDeadline } from '../utils/registrationLifecycle';
import { useTheme } from '../context/ThemeContext';
import '../styles/spatialGallery.css';


const MOCK_RECEIPT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%25' height='100%25' fill='%230f172a'/><text x='50%25' y='35%25' fill='%2310b981' font-family='sans-serif' font-size='22' font-weight='black' text-anchor='middle'>APEX 2026</text><text x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>MOCK PAYMENT SUCCESSFUL</text><text x='50%25' y='65%25' fill='%2364748b' font-family='sans-serif' font-size='10' font-weight='medium' text-anchor='middle'>UTR: TXN-APEX-MOCK-998</text><rect x='20' y='220' width='260' height='50' fill='%231e293b' rx='10'/><text x='50%25' y='250%25' fill='%2338bdf8' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle'>VERIFIED DEMO RECEIPT</text></svg>";

const isRacketSportCheck = (sport) => {
  if (!sport) return false;
  const key = resolveSportKey(sport);
  return key === 'badminton' || key === 'table-tennis';
};

const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (window.Razorpay) return resolve(true);
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RegistrationCountdownTimer = ({ endDateStr }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!endDateStr) {
        setTimeLeft('Closed');
        return;
      }
      try {
        const deadline = parseRegistrationDeadline(endDateStr);
        if (!deadline) {
          setTimeLeft('Closed');
          return;
        }
        const nowMs = Date.now();
        const deadlineMs = typeof deadline === 'number' ? deadline : (deadline.getTime ? deadline.getTime() : new Date(deadline).getTime());
        const diff = deadlineMs - nowMs;

        if (diff <= 0) {
          setTimeLeft('Closed');
          return;
        }

        const totalSecs = Math.floor(diff / 1000);
        const secs = totalSecs % 60;
        const totalMins = Math.floor(totalSecs / 60);
        const mins = totalMins % 60;
        const totalHours = Math.floor(totalMins / 60);
        const hours = totalHours % 24;
        const days = Math.floor(totalHours / 24);

        const pad = (n) => String(n).padStart(2, '0');

        if (days > 0) {
          setTimeLeft(`${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
        } else {
          setTimeLeft(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
        }
      } catch (err) {
        setTimeLeft('Closed');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endDateStr]);

  return <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">{timeLeft}</span>;
};

export const RegistrationPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRegistration } = useAuth();
  const { addToast } = useToast();

  const preselectedSportId = searchParams.get('sport');

  // Load configuration and merge with existing sports data
  const [sportsList, setSportsList] = useState(() => {
    const list = SPORTS_DATA.map((sport) => {
      const key = resolveSportKey(sport);
      const config = SPORTS_CONFIG[key] || {
        startDate: "2026-07-20",
        endDate: "2026-08-15"
      };
      const bounds = SPORT_PLAYER_BOUNDS[key] || { min: 1, max: 10 };
      return {
        ...sport,
        ...config,
        minPlayers: sport.minPlayers !== undefined ? sport.minPlayers : (config.minPlayers !== undefined ? config.minPlayers : bounds.min),
        maxPlayers: sport.maxPlayers !== undefined ? sport.maxPlayers : (config.maxPlayers !== undefined ? config.maxPlayers : bounds.max)
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
  const [rulesModalSport, setRulesModalSport] = useState(null);

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
    window.addEventListener('sems_events_updated', handleRefresh);

    const interval = setInterval(fetchCoordinatorEvents, 60000);

    loadRazorpaySDK();

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('sems_events_updated', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  // Sync sportsList dynamically whenever coordinator published events update
  const sortedCoordinatorEvents = useMemo(() => {
    if (!coordinatorEvents || !Array.isArray(coordinatorEvents)) return [];
    return [...coordinatorEvents].sort((a, b) => {
      const getPriority = (evt) => {
        const registered = evt.registeredCount || 0;
        const limit = evt.maxRegistrations || 64;
        const slotsLeft = Math.max(0, limit - registered);
        const isUpcoming = evt.status === 'Upcoming' || evt.status === 'Coming Soon';
        const isClosed = !isUpcoming && (evt.status === 'Closed' || slotsLeft === 0);

        if (!isUpcoming && !isClosed) return 3; // 1st: Open
        if (isUpcoming) return 2;               // 2nd: Upcoming
        return 1;                               // 3rd: Closed
      };

      const pA = getPriority(a);
      const pB = getPriority(b);

      if (pA !== pB) return pB - pA; // Higher priority (3 -> 2 -> 1) first

      const dateA = new Date(a.tournStartDate || a.regStartDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.tournStartDate || b.regStartDate || b.createdAt || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;

      return (a.title || '').localeCompare(b.title || '');
    });
  }, [coordinatorEvents]);

  // Roll-down sport filter state
  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableSports = useMemo(() => {
    const fromConfig = Object.values(SPORTS_CONFIG).map((c) => c.name);
    const fromData = SPORTS_DATA.map((s) => s.name);
    const fromEvents = (coordinatorEvents || []).map((e) => e.sportName || e.title).filter(Boolean);
    return ['All', ...Array.from(new Set([...fromConfig, ...fromData, ...fromEvents]))];
  }, [coordinatorEvents]);

  const filteredCoordinatorEvents = useMemo(() => {
    if (!sortedCoordinatorEvents) return [];
    if (selectedSportFilter === 'All') return sortedCoordinatorEvents;
    const filterClean = selectedSportFilter.toLowerCase().replace(/[^a-z0-9]/g, '');
    return sortedCoordinatorEvents.filter((evt) => {
      const sportClean = (evt.sportName || evt.title || evt.sportId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return sportClean.includes(filterClean) || filterClean.includes(sportClean);
    });
  }, [sortedCoordinatorEvents, selectedSportFilter]);

  useEffect(() => {
    if (!coordinatorEvents || coordinatorEvents.length === 0) return;

    setSportsList((prevList) => {
      if (!Array.isArray(prevList)) return prevList;
      let hasChanges = false;
      const updatedList = prevList.map((sport) => {
        if (!sport) return sport;
        const key = resolveSportKey(sport);
        const matchingEvent = coordinatorEvents.find((evt) => evt && resolveSportKey(evt) === key);
        if (matchingEvent) {
          const resolvedFee = typeof matchingEvent.entryFee === 'number'
            ? matchingEvent.entryFee
            : (typeof matchingEvent.teamFee === 'number' ? matchingEvent.teamFee : (matchingEvent.entryFee ?? matchingEvent.teamFee ?? 0));
          
          const sFee = typeof matchingEvent.singlesFee === 'number' ? matchingEvent.singlesFee : resolvedFee;
          const dFee = typeof matchingEvent.doublesFee === 'number' ? matchingEvent.doublesFee : resolvedFee * 2;

          if (sport.entryFee !== resolvedFee || sport.singlesFee !== sFee || sport.doublesFee !== dFee) {
            hasChanges = true;
            return {
              ...sport,
              entryFee: resolvedFee,
              teamFee: resolvedFee,
              singlesFee: sFee,
              doublesFee: dFee,
              venue: matchingEvent.venue || sport.venue,
              rules: matchingEvent.rules || sport.rules
            };
          }
        }
        return sport;
      });
      return hasChanges ? updatedList : prevList;
    });

    setActiveSport((prevActive) => {
      if (!prevActive) return null;
      const key = resolveSportKey(prevActive);
      const matchingEvent = coordinatorEvents.find((evt) => evt && resolveSportKey(evt) === key);
      if (matchingEvent) {
        const resolvedFee = typeof matchingEvent.entryFee === 'number'
          ? matchingEvent.entryFee
          : (typeof matchingEvent.teamFee === 'number' ? matchingEvent.teamFee : (matchingEvent.entryFee ?? matchingEvent.teamFee ?? 0));
        
        const isRacket = isRacketSportCheck(prevActive);
        const sFee = typeof matchingEvent.singlesFee === 'number' ? matchingEvent.singlesFee : resolvedFee;
        const dFee = typeof matchingEvent.doublesFee === 'number' ? matchingEvent.doublesFee : resolvedFee * 2;
        const currentFee = isRacket ? (formData.eventType === 'Doubles' ? dFee : sFee) : resolvedFee;

        if (
          prevActive.entryFee !== currentFee ||
          prevActive.singlesFee !== sFee ||
          prevActive.doublesFee !== dFee
        ) {
          return {
            ...prevActive,
            entryFee: currentFee,
            teamFee: resolvedFee,
            singlesFee: sFee,
            doublesFee: dFee
          };
        }
      }
      return prevActive;
    });
  }, [coordinatorEvents]);

  // Prevent user from closing tab or refreshing while payment & DB registration is processing
  useEffect(() => {
    if (!isProcessingPayment) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Payment verification in progress. Please do not leave or refresh.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessingPayment]);



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

  const { eventId } = useParams();

  // Load specific event by eventId or sportId from route params
  useEffect(() => {
    const fetchEventById = async () => {
      if (!eventId) return;
      try {
        const pubEvents = await coordinatorApi.getPublicEvents();
        const foundEv = (pubEvents || []).find((ev) => String(ev.id) === String(eventId) || String(ev.sportId) === String(eventId));
        if (foundEv) {
          const key = resolveSportKey(foundEv);
          const bounds = SPORT_PLAYER_BOUNDS[key] || { min: 1, max: 10 };

          setActiveSport({
            id: foundEv.sportId || foundEv.id,
            eventId: foundEv.id,
            name: foundEv.sportName || foundEv.title || 'Sport Event',
            eventName: foundEv.title || foundEv.eventName,
            category: foundEv.category || 'Open',
            status: foundEv.status || 'Published',
            type: foundEv.teamSize || 'Team / Individual',
            tagline: foundEv.description || 'Championship Tournament',
            description: foundEv.description || '',
            image: foundEv.coverImage || foundEv.cover_image || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
            entryFee: typeof foundEv.entryFee === 'number' ? foundEv.entryFee : (typeof foundEv.teamFee === 'number' ? foundEv.teamFee : (foundEv.entryFee ?? foundEv.teamFee ?? 0)),
            singlesFee: typeof foundEv.singlesFee === 'number' ? foundEv.singlesFee : (typeof foundEv.entryFee === 'number' ? foundEv.entryFee : 0),
            doublesFee: typeof foundEv.doublesFee === 'number' ? foundEv.doublesFee : 0,
            minPlayers: foundEv.minPlayers !== undefined ? Number(foundEv.minPlayers) : bounds.min,
            maxPlayers: foundEv.maxPlayers !== undefined ? Number(foundEv.maxPlayers) : bounds.max,
            teamSize: foundEv.teamSize || '1 Player',
            venue: foundEv.venue || 'Central Arena',
            startDate: foundEv.regStartDate || foundEv.tournStartDate || '2026-07-20',
            endDate: foundEv.regEndDate || foundEv.tournEndDate || '2026-08-30',
            regStartDate: foundEv.regStartDate,
            regEndDate: foundEv.regEndDate,
            tournStartDate: foundEv.tournStartDate,
            tournEndDate: foundEv.tournEndDate,
            rules: foundEv.rules || ['Official tournament rules apply.'],
            requiredDocuments: foundEv.requiredDocuments || ['College ID Card']
          });
          setStep(1);
          return;
        }

        const foundSport = sportsList.find((s) => s.id === eventId);
        if (foundSport) {
          setActiveSport(foundSport);
          setStep(1);
        }
      } catch (err) {
        console.warn('Error loading event by ID', err);
      }
    };

    fetchEventById();
  }, [eventId, sportsList]);

  // Track current sport ID to prevent form resets when only updating fees
  const currentSportIdRef = React.useRef(null);

  // Reset form state on sport change
  useEffect(() => {
    if (activeSport) {
      const sportKey = `${activeSport.id || activeSport.eventId || activeSport.name}`;
      if (currentSportIdRef.current !== sportKey) {
        currentSportIdRef.current = sportKey;
        const isRacket = isRacketSportCheck(activeSport);
        setFormData({
          collegeName: '',
          teamName: '',
          captainName: '',
          captainPhone: '',
          captainEmail: '',
          eventType: isRacket ? 'Singles' : 'Individual',
          selectedEvents: [],
          roster: [
            {
              name: '',
              rollNo: '',
              branch: '',
              semester: '',
              phone: '',
              email: '',
              fatherName: '',
              dob: '',
              college: '',
              gender: ''
            }
          ],
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
    }
  }, [activeSport]);

  const handleSportSelect = (sport) => {
    const isRacket = isRacketSportCheck(sport);
    const resolvedFee = typeof sport.entryFee === 'number'
      ? sport.entryFee
      : (typeof sport.teamFee === 'number' ? sport.teamFee : (sport.entryFee ?? sport.teamFee ?? 0));

    const sFee = typeof sport.singlesFee === 'number' ? sport.singlesFee : resolvedFee;
    const dFee = typeof sport.doublesFee === 'number' ? sport.doublesFee : resolvedFee * 2;
    const initialFee = isRacket ? (formData.eventType === 'Doubles' ? dFee : sFee) : resolvedFee;

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
    if (activeSport) {
      const regStatus = computeEffectiveRegistrationStatus(activeSport);
      if (!regStatus.effectiveRegistrationOpen) {
        addToast(regStatus.reason || 'Registration is closed for this event.', 'error');
        return;
      }
    }

    let formErrors = {};
    const key = resolveSportKey(activeSport);
    const isRacket = isRacketSportCheck(activeSport);
    const isTeamLayout =
      ['football', 'basketball', 'volleyball', 'cricket', 'kabaddi', 'tug-of-war', 'kho-kho', 'gully-cricket'].includes(key) ||
      (isRacket && formData.eventType === 'Doubles');

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
          email: formData.captainEmail || (formData.roster[0] && formData.roster[0].email) || 'athlete@apex.edu',
          phone: formData.captainPhone || (formData.roster[0] && formData.roster[0].phone) || '+91 98765 43210',
          gender: formData.roster[0]?.gender || formData.gender || 'Male',
          collegeName: formData.collegeName || 'MPEC',
          department: formData.roster[0]?.branch || formData.roster[0]?.department || 'Engineering',
          enrollmentNo: formData.roster[0]?.rollNo || formData.roster[0]?.rollNumber || formData.captainRoll || 'ENR2026-001',
          teamName: formData.teamName,
          emergencyContact: formData.captainPhone || (formData.roster[0] && formData.roster[0].phone) || '+91 98765 43210',
          entryFee: activeSport.entryFee,
          roster: formData.roster || [],
          eventTitle: isRacketSportCheck(activeSport) ? `${activeSport.name} (${formData.eventType})` : (activeSport.title || activeSport.name),
          eventType: formData.eventType,
          participationType: isRacketSportCheck(activeSport) 
            ? (formData.eventType === 'Doubles' ? 'DUO' : 'INDIVIDUAL')
            : (formData.roster?.length > 2 ? 'TEAM' : (formData.roster?.length === 2 ? 'DUO' : 'INDIVIDUAL')),
          category: activeSport.category,
          subEvent: formData.selectedEvents?.join(', ') || formData.eventType || ''
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
      if (isRacketSportCheck(activeSport)) {
        eventCategory = `${activeSport.category} (${formData.eventType})`;
      } else if ((activeSport.id || '').toLowerCase() === 'athletics') {
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
        utrNumber: paymentRes.razorpayPaymentId || paymentRes.razorpay_payment_id,
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
      console.error('Registration processing error:', err);
      addToast(err.response?.data?.message || err.message || 'Error processing event registration', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Step 2 Submission (Payment Gateway & Declaration)
  const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();

    if (activeSport) {
      const regStatus = computeEffectiveRegistrationStatus(activeSport);
      if (!regStatus.effectiveRegistrationOpen) {
        addToast(regStatus.reason || 'Registration is closed for this event.', 'error');
        return;
      }
    }

    if (!formData.declarationAccepted) {
      setErrors((prev) => ({ ...prev, declarationAccepted: 'Please accept the declaration and verification policy' }));
      addToast('Please accept the declaration and verification policy.', 'error');
      return;
    }

    if (activeSport.entryFee > 0) {
      setIsProcessingPayment(true);
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TQufd9ZecHdfG1';

      try {
        // Ensure Razorpay SDK is loaded and available
        const isLoaded = await loadRazorpaySDK();
        if (!isLoaded || !window.Razorpay) {
          throw new Error('Razorpay Checkout SDK could not be loaded. Please check your internet connection or disable ad-blockers and try again.');
        }

        let orderData = null;
        try {
          // Attempt authoritative server-side Razorpay Order creation
          orderData = await coordinatorApi.createRazorpayOrder(
            activeSport.id,
            activeSport.sportId || activeSport.id,
            {
              fullName: formData.captainName || (formData.roster[0] && formData.roster[0].name) || 'Lead Athlete',
              captainName: formData.captainName,
              email: formData.captainEmail || (formData.roster[0] && formData.roster[0].email) || 'athlete@apex.edu',
              phone: formData.captainPhone || (formData.roster[0] && formData.roster[0].phone) || '+91 98765 43210',
              collegeName: formData.collegeName || 'MPEC',
              teamName: formData.teamName
            }
          );
        } catch (orderErr) {
          console.warn('Backend order creation endpoint skipped, initiating direct client checkout:', orderErr.message);
        }

        const effectiveKey = orderData?.keyId || razorpayKey;
        const amountInPaise = orderData?.amount || Math.round(Number(activeSport.entryFee) * 100);

        const options = {
          key: effectiveKey,
          amount: amountInPaise, // in paise
          currency: orderData?.currency || 'INR',
          ...(orderData?.orderId ? { order_id: orderData.orderId } : {}),
          name: import.meta.env.VITE_RAZORPAY_MERCHANT_NAME || 'APEX Championship 2026',
          description: `Entry Registration Fee for ${activeSport.name}`,
          handler: async function (response) {
            await handleRazorpaySuccess({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || orderData?.orderId || `DIR-${Date.now()}`,
              razorpaySignature: response.razorpay_signature || 'verified_checkout',
              amount: activeSport.entryFee,
              status: 'PAID',
              method: 'Razorpay Checkout',
              timestamp: new Date().toISOString()
            });
          },
          prefill: {
            name: formData.captainName || (formData.roster && formData.roster[0]?.name) || '',
            email: formData.captainEmail || '',
            contact: formData.captainPhone || ''
          },
          theme: {
            color: '#2563eb'
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setIsProcessingPayment(false);
          addToast(resp.error?.description || 'Payment was unsuccessful or cancelled.', 'error');
        });
        rzp.open();
        return;
      } catch (err) {
        console.error('Razorpay initialization error:', err);
        addToast(err.response?.data?.message || err.message || 'Failed to initiate Razorpay payment. Please try again.', 'error');
      } finally {
        setIsProcessingPayment(false);
      }
    } else {
      // Free events (Entry Fee = 0): Skip payment and confirm instantly
      handleRazorpaySuccess({
        razorpayPaymentId: `FREE-${Date.now()}`,
        orderId: `FREE-ORDER-${Date.now()}`,
        amount: 0,
        status: 'FREE_CONFIRMED',
        method: 'Free Registration',
        timestamp: new Date().toISOString()
      });
    }
  };



  // Handle Event Type Singles/Doubles toggle inside Details Step with dynamic fee recalculation
  const handleEventTypeToggle = (type) => {
    const isDoubles = type === 'Doubles';
    const targetSize = isDoubles ? 2 : 1;

    setFormData((prev) => {
      const currentRoster = prev.roster || [];
      let updatedRoster = [];

      for (let i = 0; i < targetSize; i++) {
        if (currentRoster[i]) {
          updatedRoster.push({
            ...currentRoster[i],
            name: i === 0 ? (currentRoster[0].name || prev.captainName || '') : (currentRoster[i].name || ''),
            phone: i === 0 ? (currentRoster[0].phone || prev.captainPhone || '') : (currentRoster[i].phone || ''),
            email: i === 0 ? (currentRoster[0].email || prev.captainEmail || '') : (currentRoster[i].email || ''),
            college: currentRoster[i].college || prev.collegeName || ''
          });
        } else {
          updatedRoster.push({
            name: i === 0 ? (prev.captainName || '') : '',
            rollNo: '',
            branch: '',
            semester: '',
            phone: i === 0 ? (prev.captainPhone || '') : '',
            email: i === 0 ? (prev.captainEmail || '') : '',
            fatherName: '',
            dob: '',
            college: prev.collegeName || '',
            gender: prev.gender || ''
          });
        }
      }

      return {
        ...prev,
        eventType: type,
        teamName: type === 'Singles' ? '' : (prev.teamName || `${prev.captainName || 'Badminton'} Duo`),
        roster: updatedRoster
      };
    });

    if (activeSport) {
      const resolvedFee = typeof activeSport.entryFee === 'number'
        ? activeSport.entryFee
        : (typeof activeSport.teamFee === 'number' ? activeSport.teamFee : 0);
      const sFee = typeof activeSport.singlesFee === 'number' ? activeSport.singlesFee : resolvedFee;
      const dFee = typeof activeSport.doublesFee === 'number' ? activeSport.doublesFee : resolvedFee * 2;
      const updatedFee = type === 'Doubles' ? dFee : sFee;
      setActiveSport((prev) => ({
        ...prev,
        entryFee: updatedFee
      }));
    }

    setErrors({});
  };

  // Determine layout and render Step 1
  const renderDetailsStep = () => {
    const isRacketSport = isRacketSportCheck(activeSport);

    return (
      <div className="space-y-6">
        {/* Racket Sport Event Type Toggle */}
        {isRacketSport && (
          <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA]">
              Select Event Mode & Fee <span className="text-[#C62828] dark:text-[#FDA4AF]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Singles')}
                className={`p-3.5 rounded-lg border-2 flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all ${formData.eventType === 'Singles'
                    ? 'border-[#7156A5] bg-[#7156A5]/10 text-[#7156A5] dark:text-[#B8A5E5] font-bold shadow-2xs'
                    : 'border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] bg-[#FFFFFF] dark:bg-[#0D101A] text-[#686370] dark:text-[#AAA4B8] hover:border-[#7156A5]/40'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Singles (1 Player)
                </div>
                <span className="text-[11px] font-bold text-[#1B5E20] dark:text-[#81C784]">
                  Singles Fee: {activeSport.singlesFee === 0 ? 'FREE (₹0)' : `₹${activeSport.singlesFee ?? 0}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Doubles')}
                className={`p-3.5 rounded-lg border-2 flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all ${formData.eventType === 'Doubles'
                    ? 'border-[#7156A5] bg-[#7156A5]/10 text-[#7156A5] dark:text-[#B8A5E5] font-bold shadow-2xs'
                    : 'border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] bg-[#FFFFFF] dark:bg-[#0D101A] text-[#686370] dark:text-[#AAA4B8] hover:border-[#7156A5]/40'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Doubles (2 Players)
                </div>
                <span className="text-[11px] font-bold text-[#7156A5] dark:text-[#B8A5E5]">
                  Doubles Fee: {activeSport.doublesFee === 0 ? 'FREE (₹0)' : `₹${activeSport.doublesFee ?? 0}`}
                </span>
              </button>
            </div>
          </div>
        )}


        {/* Dynamic sub-forms */}
        {isRacketSport ? (
          formData.eventType === 'Singles' ? (
            <PlayerDetailsForm
              key={`racket-singles-${activeSport.id}-${formData.eventType}`}
              sport={activeSport}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          ) : (
            <TeamDetailsForm
              key={`racket-doubles-${activeSport.id}-${formData.eventType}`}
              sport={{
                ...activeSport,
                teamSize: '2 Players (Doubles)',
                minPlayers: 2,
                maxPlayers: 2,
                entryFee: typeof activeSport.doublesFee === 'number' ? activeSport.doublesFee : (activeSport.entryFee || 1)
              }}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          )
        ) : ['chess', 'athletics'].includes(resolveSportKey(activeSport)) ? (
          <PlayerDetailsForm
            key={`player-form-${activeSport.id}`}
            sport={activeSport}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        ) : (
          <TeamDetailsForm
            key={`team-form-${activeSport.id}`}
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
    <div className={`relative min-h-screen font-spatial-sans selection:bg-[#7156A5]/20 selection:text-[#211D2B] dark:selection:text-white overflow-x-hidden transition-colors duration-200 ${
      isDark ? 'bg-[#070A13] text-[#F5F2FA]' : 'bg-[#FAF9F6] text-[#211D2B]'
    }`}>
      {/* Dark mode atmospheric overlays */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60" />
          <div className="fixed inset-0 spatial-grain-overlay z-[1] pointer-events-none opacity-20" />
        </>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6">

        {/* Editorial Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
            <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
            <span>Championship Registration Dossier</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
            Event <span className="text-[#7156A5] dark:text-[#B8A5E5]">Registration</span>
          </h1>

          <p className="text-xs sm:text-sm max-w-xl mx-auto text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
            Official multi-step team enrollment, participant dossiers, and slot verification across all championship events.
          </p>
        </div>

        {/* Sports Filter Bar */}
        {!activeSport && (
          <div className="bg-[#FFFFFF] dark:bg-[#0D101A] p-3 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            {/* Left: Discipline & Count */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA]">
                {selectedSportFilter === 'All' ? 'All Disciplines' : selectedSportFilter}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                {filteredCoordinatorEvents.length} {filteredCoordinatorEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {/* Right: Roll-Down Sport Filter Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] hover:border-[#7156A5] dark:hover:border-[#B8A5E5]"
                title="Filter by Sport"
                aria-label="Filter sport roll-down dropdown"
              >
                <Filter className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />
                <span className="truncate max-w-[120px]">
                  {selectedSportFilter === 'All' ? 'Filter Sport' : selectedSportFilter}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#686370] dark:text-[#AAA4B8] shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Roll-Down Menu Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-lg p-1.5 z-50 shadow-md border bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] max-h-80 overflow-y-auto font-spatial-sans">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#686370] dark:text-[#AAA4B8] border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.1)] mb-1 flex items-center justify-between">
                    <span>Select Sport</span>
                    <span className="text-[9px]">{availableSports.length} Options</span>
                  </div>
                  {availableSports.map((sport) => {
                    const isSelected = selectedSportFilter === sport;
                    return (
                      <button
                        key={sport}
                        onClick={() => {
                          setSelectedSportFilter(sport);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] font-semibold'
                            : 'hover:bg-[#FAF9F6] dark:hover:bg-[#161B2E] text-[#211D2B] dark:text-[#F5F2FA]'
                        }`}
                      >
                        <span className="truncate">{sport}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SPORTS LIST & COORDINATOR EVENTS STATE */}
        {!activeSport ? (
          <div className="space-y-6">
            
            {/* DYNAMIC OFFICIAL COORDINATOR PUBLISHED EVENTS SECTION */}
            {filteredCoordinatorEvents && filteredCoordinatorEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                  <h2 className="text-lg font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45]" />
                    Official Championship Events
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                    Published Events ({filteredCoordinatorEvents.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                  {filteredCoordinatorEvents.map((evt) => {
                    const registered = evt.registeredCount || 0;
                    const limit = evt.maxRegistrations || 64;
                    const slotsLeft = Math.max(0, limit - registered);
                    const isUpcoming = evt.status === 'Upcoming' || evt.status === 'Coming Soon';
                    const isClosed = !isUpcoming && (evt.status === 'Closed' || slotsLeft === 0);

                    const isRacket = isRacketSportCheck(evt);
                    const currentFee = typeof evt.entryFee === 'number' ? evt.entryFee : (typeof evt.teamFee === 'number' ? evt.teamFee : (evt.entryFee ?? evt.teamFee ?? 0));
                    const sFee = typeof evt.singlesFee === 'number' ? Number(evt.singlesFee) : currentFee;
                    const dFee = typeof evt.doublesFee === 'number' ? Number(evt.doublesFee) : currentFee * 2;

                    const key = resolveSportKey(evt);
                    const bounds = SPORT_PLAYER_BOUNDS[key] || { min: 1, max: 10 };
                    const minP = evt.minPlayers !== undefined ? Number(evt.minPlayers) : bounds.min;
                    const maxP = evt.maxPlayers !== undefined ? Number(evt.maxPlayers) : bounds.max;

                    return (
                      <div
                        key={evt.id}
                        className="w-full rounded-lg border overflow-hidden shadow-2xs transition-all duration-200 flex flex-col justify-between group bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] hover:border-[#7156A5]/40 dark:hover:border-[#8B5CF6]/40"
                      >
                        <div className="relative h-40 w-full overflow-hidden bg-slate-950">
                          <img
                            src={evt.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'}
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 brightness-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#070A13] via-[#070A13]/40 to-transparent" />

                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              isUpcoming
                                ? 'bg-[#FFF8E1] text-[#A98B57] border border-[#FFE082]'
                                : isClosed
                                ? 'bg-[#FBEDEF] text-[#C62828] border border-[#FFCDD2]'
                                : 'bg-[#EDF7F0] text-[#1B5E20] border border-[#C8E6C9]'
                            }`}>
                              {isUpcoming ? '🟡 Upcoming' : isClosed ? '● Closed' : '● Open'}
                            </span>
                          </div>

                          <div className="absolute top-2.5 right-2.5 bg-[#FAF9F6]/95 dark:bg-[#0D101A]/95 backdrop-blur-xs px-2.5 py-0.5 rounded text-[11px] font-semibold text-[#211D2B] dark:text-[#F5F2FA] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] font-mono">
                            {isRacket ? `Singles: ₹${sFee} | Doubles: ₹${dFee}` : (currentFee > 0 ? `Fee: ₹${currentFee}` : 'FREE (₹0)')}
                          </div>

                          <div className="absolute bottom-2.5 left-3.5 right-3.5">
                            <span className="text-[10px] font-mono font-semibold text-[#B8A5E5] uppercase tracking-wider block">
                              {evt.sportName}
                            </span>
                            <h3 className="text-base sm:text-lg font-bold font-spatial-display text-white leading-tight drop-shadow-xs uppercase">
                              {evt.title}
                            </h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg border bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                            <div>
                              <span className="text-[9px] text-[#686370] dark:text-[#AAA4B8] uppercase font-mono block">Reg Deadline</span>
                              <span className="font-semibold font-mono text-[10px] text-[#211D2B] dark:text-[#F5F2FA]">{evt.regEndDate}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#686370] dark:text-[#AAA4B8] uppercase font-mono block">Tournament Start</span>
                              <span className="font-semibold font-mono text-[10px] text-[#211D2B] dark:text-[#F5F2FA]">{evt.tournStartDate}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#686370] dark:text-[#AAA4B8] uppercase font-mono block">Venue</span>
                              <span className="font-semibold text-[#7156A5] dark:text-[#B8A5E5] text-[10px] truncate block font-mono">{evt.venue}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#686370] dark:text-[#AAA4B8] uppercase font-mono block">Team Size</span>
                              <span className="font-semibold font-mono text-[10px] text-[#211D2B] dark:text-[#F5F2FA]">{evt.teamSize || `${minP} - ${maxP} Players`}</span>
                            </div>
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRulesModalSport({ sportName: evt.sportName || evt.title, rules: evt.rules })}
                              className="flex-1 py-2 rounded-lg font-semibold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#161B2E] text-[#211D2B] dark:text-[#F5F2FA] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] shadow-2xs"
                              title="View Official Tournament Rules for this event"
                            >
                              <Info className="w-3.5 h-3.5 text-[#7156A5] dark:text-[#B8A5E5]" />
                              <span>View Rules</span>
                            </button>

                            <button
                              disabled={isClosed || isUpcoming}
                              onClick={() => {
                                const adaptedSport = {
                                  id: evt.sportId || evt.id,
                                  name: evt.title,
                                  sportName: evt.sportName,
                                  category: evt.category || 'Open',
                                  type: evt.teamSize || `${minP} - ${maxP} Players`,
                                  tagline: evt.title,
                                  description: evt.description,
                                  image: evt.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
                                  status: isClosed ? 'Closed' : isUpcoming ? 'Upcoming' : 'Open',
                                  participantsCount: registered,
                                  maxParticipants: limit,
                                  entryFee: sFee,
                                  singlesFee: sFee,
                                  doublesFee: dFee,
                                  minPlayers: minP,
                                  maxPlayers: maxP,
                                  teamSize: evt.teamSize || `${minP} - ${maxP} Players`,
                                  venue: evt.venue,
                                  rules: evt.rules || ['Standard rules apply.'],
                                  startDate: evt.regStartDate,
                                  endDate: evt.regEndDate,
                                  isCoordinatorEvent: true,
                                  eventId: evt.id
                                };
                                handleSportSelect(adaptedSport);
                              }}
                              className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 font-mono uppercase tracking-wider shadow-2xs ${
                                isUpcoming
                                  ? 'bg-[#FFF8E1] dark:bg-[#A98B57]/20 text-[#A98B57] border border-[#FFE082] dark:border-[#A98B57]/30 cursor-not-allowed'
                                  : isClosed
                                  ? 'bg-[#F4F2F7] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] cursor-not-allowed border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]'
                                  : 'bg-[#7156A5] hover:bg-[#5E4491] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white cursor-pointer'
                              }`}
                            >
                              <span>
                                {isUpcoming
                                  ? '⏳ Soon'
                                  : isClosed
                                  ? (slotsLeft === 0 ? 'Event Full' : 'Closed')
                                  : 'Register'
                                }
                              </span>
                              {!isUpcoming && !isClosed && <Trophy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMPTY STATE WHEN NO COORDINATOR EVENTS PUBLISHED YET */}
            {(!filteredCoordinatorEvents || filteredCoordinatorEvents.length === 0) && (
              <div className="text-center py-16 px-6 sm:px-10 space-y-2 w-full bg-[#FFFFFF] dark:bg-[#0D101A] rounded-lg border border-dashed border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto text-xl bg-[#F4F2F7] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] text-[#A98B57] dark:text-[#D2AB45]">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA]">
                  No Events Published Yet
                </h3>
                <p className="text-xs max-w-md mx-auto text-[#686370] dark:text-[#AAA4B8]">
                  {selectedSportFilter === 'All'
                    ? 'Registration will open once coordinators publish the official schedule. Please check back shortly.'
                    : `No events currently published for ${selectedSportFilter}. Select another discipline or check back soon.`}
                </p>
              </div>
            )}

          </div>
        ) : (

          /* ACTIVE STEPS WIZARD */
          <div className="space-y-6">

            {/* Back to selector link */}
            {step < 3 && (
              <button
                onClick={handleBackToSports}
                className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold transition ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
              </button>
            )}

            {/* Steps bar */}
            <RegistrationStepper currentStep={step} />

            {/* Wizard Body Card */}
            <div className="rounded-lg p-5 sm:p-8 border shadow-xs transition-all bg-[#FFFFFF] dark:bg-[#0D101A] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)]">

              {/* STEP 1: DETAILS */}
              {step === 1 && (
                <div className="space-y-6">
                  {activeSport?.status === 'Upcoming' && (
                    <div className="p-3.5 rounded-lg bg-[#FFF8E1] dark:bg-[#A98B57]/15 border border-[#FFE082] dark:border-[#A98B57]/30 text-[#A98B57] dark:text-[#D2AB45] text-xs font-semibold flex items-center gap-2">
                      <span className="text-base">⏳</span>
                      <span>This event is currently <strong>Upcoming</strong>. Registration opens on {activeSport.regStartDate || 'the scheduled date'}.</span>
                    </div>
                  )}
                  {renderDetailsStep()}
                  <div className="flex justify-end pt-5 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                    {activeSport?.status === 'Upcoming' ? (
                      <button
                        disabled
                        className="px-6 py-2.5 rounded-lg bg-[#FFF8E1] dark:bg-[#A98B57]/20 text-[#A98B57] font-semibold text-sm border border-[#FFE082] dark:border-[#A98B57]/30 cursor-not-allowed flex items-center gap-2"
                      >
                        <span>⏳ Registration Opening Soon</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleDetailsSubmit}
                        className="px-6 py-2.5 rounded-lg bg-[#7156A5] hover:bg-[#5E4491] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-sm shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <span>Proceed to Payment</span>
                        <Trophy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: DECLARATION & PAYMENT GATEWAY */}
              {step === 2 && (
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  
                  {/* Card 1: MANDATORY DECLARATION CARD */}
                  <div className="p-5 rounded-lg border bg-[#FAF9F6] dark:bg-[#121625] border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#F4F2F7] dark:bg-[#0D101A] text-[#A98B57] dark:text-[#D2AB45] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA] text-xs sm:text-sm">
                            1. Mandatory Athlete Declaration & Rules Agreement
                          </h4>
                          <p className="text-[10px] text-[#A98B57] dark:text-[#D2AB45] font-semibold uppercase">
                            Required prior to payment checkout
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#F4F2F7] dark:bg-[#0D101A] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                        Declaration
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                      <p className="text-xs text-[#686370] dark:text-[#AAA4B8] leading-relaxed italic">
                        "I hereby declare that the information provided by me in this registration form is true and correct to the best of my knowledge. I agree to abide by all the rules and regulations of the sports event. If I am found guilty of providing false information or engaging in any act of indiscipline or misconduct, I understand that I may be disqualified, and I agree to accept the decision of the Organizing Committee as final."
                      </p>
                    </div>

                    {/* Mandatory Checkbox & Read Rulebook Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
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
                          className="w-4 h-4 mt-0.5 rounded border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#7156A5] focus:ring-[#7156A5] shrink-0"
                        />
                        <span className="text-xs font-medium text-[#211D2B] dark:text-[#F5F2FA] leading-snug">
                          I have read, understood, and agree to the mandatory declaration, discipline rules, and university verification policy.
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setRulesModalSport(activeSport?.name || 'Badminton')}
                        className="px-3 py-1.5 rounded-lg bg-[#EDF7F0] dark:bg-[#1B5E20]/20 hover:bg-[#C8E6C9]/40 text-[#1B5E20] dark:text-[#81C784] border border-[#C8E6C9] dark:border-[#1B5E20]/30 text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>📖 Read Rulebook</span>
                      </button>
                    </div>
                    {errors.declarationAccepted && (
                      <p className="text-xs text-[#C62828] dark:text-[#FDA4AF] font-semibold flex items-center gap-1">
                        ⚠️ {errors.declarationAccepted}
                      </p>
                    )}
                  </div>

                  {/* Card 2: Verification Policy */}
                  <div className="p-4 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)] bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5] mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <h4 className="font-bold uppercase tracking-wider text-[#7156A5] dark:text-[#B8A5E5]">2. College Verification Policy</h4>
                      <p className="text-[#686370] dark:text-[#AAA4B8] leading-relaxed">
                        Upon submission and payment, registration will be reviewed and verified by your respective <strong>College Head</strong>. Ensure student details are accurate to avoid rejection during biometric gate pass generation.
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
                  <div className="flex justify-between pt-5 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handlePrevStep}
                      className="px-5 py-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] text-[#211D2B] dark:text-[#F5F2FA] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] font-semibold text-sm flex items-center gap-1.5 hover:bg-[#F4F2F7] dark:hover:bg-[#161B2E] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={isProcessingPayment || !formData.declarationAccepted}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm shadow-2xs flex items-center gap-2 transition-all ${
                        formData.declarationAccepted && !isProcessingPayment
                          ? 'bg-[#7156A5] hover:bg-[#5E4491] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white cursor-pointer'
                          : 'bg-[#F4F2F7] dark:bg-[#121625] text-[#686370] dark:text-[#AAA4B8] cursor-not-allowed border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]'
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

        {/* FULL SCREEN TOURNAMENT RULES MODAL */}
        <BadmintonRulesModal
          isOpen={!!rulesModalSport}
          onClose={() => setRulesModalSport(null)}
          sportName={typeof rulesModalSport === 'object' ? rulesModalSport?.sportName : (rulesModalSport || activeSport?.name || 'Badminton')}
          rules={typeof rulesModalSport === 'object' ? rulesModalSport?.rules : (activeSport?.rules || [])}
          eventId={typeof rulesModalSport === 'object' ? rulesModalSport?.eventId : activeSport?.eventId}
          onRulesUpdated={(updatedRules) => {
            if (typeof rulesModalSport === 'object') {
              setRulesModalSport((prev) => ({ ...prev, rules: updatedRules }));
            }
          }}
        />

        {/* FULL SCREEN PAYMENT & DATABASE PROCESSING LOCK OVERLAY */}
        {isProcessingPayment && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white select-none animate-in fade-in duration-300">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <ShieldCheck className="w-10 h-10 text-blue-500 absolute inset-0 m-auto" />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Lock className="w-3.5 h-3.5" /> Secure Transaction Lock
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight text-white">
              Verifying Payment & Updating Database...
            </h2>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-6">
              Please wait while we record your payment, reserve your event slot, and generate your official pass code.
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs font-semibold text-amber-300 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              Do not press Back, Refresh, or Close this window.
            </div>
          </div>
        )}

        {/* ─── DEDICATION QUOTE FOOTER ─── */}
        <div className="pt-14 sm:pt-20 pb-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className={`h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent ${isDark ? 'to-indigo-400' : 'to-indigo-600'}`} />
            <Trophy className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-500'} animate-pulse`} />
            <div className={`h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent ${isDark ? 'to-indigo-400' : 'to-indigo-600'}`} />
          </div>

          <p className={`font-spatial-display text-sm sm:text-base md:text-lg tracking-[0.14em] uppercase font-medium select-none ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            &ldquo;The field is waiting.{' '}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent font-bold ${
              isDark
                ? 'from-purple-400 via-indigo-300 to-amber-300'
                : 'from-purple-700 via-indigo-700 to-amber-600'
            }`}>
              Are you ready?
            </span>
            &rdquo;
          </p>

          <p className={`text-[11px] sm:text-xs font-spatial-sans tracking-widest uppercase italic font-medium ${
            isDark ? 'text-indigo-400/80' : 'text-indigo-700'
          }`}>
            APEX 2026 Registration Arena
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegistrationPage;

