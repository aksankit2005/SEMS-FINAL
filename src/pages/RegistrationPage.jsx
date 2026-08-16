import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Trophy, ArrowLeft, User, Users, Info, ShieldCheck, Sparkles, Calendar, MapPin, Clock, Loader2, Lock } from 'lucide-react';
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


const MOCK_RECEIPT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%25' height='100%25' fill='%230f172a'/><text x='50%25' y='35%25' fill='%2310b981' font-family='sans-serif' font-size='22' font-weight='black' text-anchor='middle'>APEX 2026</text><text x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>MOCK PAYMENT SUCCESSFUL</text><text x='50%25' y='65%25' fill='%2364748b' font-family='sans-serif' font-size='10' font-weight='medium' text-anchor='middle'>UTR: TXN-APEX-MOCK-998</text><rect x='20' y='220' width='260' height='50' fill='%231e293b' rx='10'/><text x='50%25' y='250%25' fill='%2338bdf8' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle'>VERIFIED DEMO RECEIPT</text></svg>";

const isRacketSportCheck = (sport) => {
  if (!sport) return false;
  const key = resolveSportKey(sport);
  return key === 'badminton' || key === 'table-tennis';
};

const RegistrationCountdownTimer = ({ endDateStr }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!endDateStr || typeof endDateStr !== 'string') {
        setTimeLeft('Closed');
        return;
      }
      try {
        const datePart = endDateStr.includes('T') ? endDateStr : `${endDateStr}T23:59:59`;
        const end = new Date(datePart);
        if (isNaN(end.getTime())) {
          setTimeLeft('Closed');
          return;
        }
        const now = new Date();
        const diff = end - now;

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRegistration } = useAuth();
  const { addToast } = useToast();

  const preselectedSportId = searchParams.get('sport');

  // Load configuration and merge with existing sports data
  const [sportsList] = useState(() => {
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

    const interval = setInterval(fetchCoordinatorEvents, 3000);

    // Dynamically load Razorpay Checkout SDK Script
    const rzpScript = document.createElement('script');
    rzpScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    rzpScript.async = true;
    document.body.appendChild(rzpScript);

    return () => {
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('sems_events_updated', handleRefresh);
      clearInterval(interval);
      if (document.body.contains(rzpScript)) {
        document.body.removeChild(rzpScript);
      }
    };
  }, []);

  // Sync sportsList dynamically whenever coordinator published events update
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
          email: formData.captainEmail || (formData.roster[0] && formData.roster[0].email) || 'athlete@sems.edu',
          phone: formData.captainPhone || (formData.roster[0] && formData.roster[0].phone) || '+91 98765 43210',
          gender: formData.roster[0]?.gender || 'Male',
          collegeName: formData.collegeName || 'MPEC',
          department: formData.roster[0]?.branch || formData.roster[0]?.department || 'Engineering',
          enrollmentNo: formData.roster[0]?.rollNo || formData.roster[0]?.rollNumber || formData.captainRoll || 'ENR2026-001',
          teamName: formData.teamName,
          emergencyContact: formData.captainPhone || (formData.roster[0] && formData.roster[0].phone) || '+91 98765 43210',
          entryFee: activeSport.entryFee,
          roster: formData.roster || []
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
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      // If official Razorpay SDK script is loaded and a live/test key is present, open Razorpay popup
      if (window.Razorpay && razorpayKey && !razorpayKey.includes('SEMS2026PaymentKey')) {
        try {
          const options = {
            key: razorpayKey,
            amount: activeSport.entryFee * 100, // Amount in paise
            currency: 'INR',
            payment_capture: 1, // Auto-capture payment immediately upon authorization
            name: import.meta.env.VITE_RAZORPAY_MERCHANT_NAME || 'SEMS APEX Championship 2026',
            description: `Entry Registration Fee for ${activeSport.name}`,
            handler: function (response) {
              handleRazorpaySuccess({
                razorpayPaymentId: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
                orderId: response.razorpay_order_id || `order_${Math.random().toString(36).substring(2, 10).toLowerCase()}`,
                amount: activeSport.entryFee,
                status: 'PAID',
                method: 'Razorpay SDK',
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
                // If user closes/cancels Razorpay popup without paying, unlock background screen
                setIsProcessingPayment(false);
              }
            }
          };

          // Lock screen immediately when Razorpay checkout opens
          setIsProcessingPayment(true);
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } catch (err) {
          setIsProcessingPayment(false);
          console.warn('Razorpay SDK failed, opening checkout modal', err);
        }
      }

      // Fallback / Demo Mode: Open interactive Razorpay checkout modal
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
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              Select Event Mode & Fee <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Singles')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition ${formData.eventType === 'Singles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Singles (1 Player)
                </div>
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  Singles Fee: {activeSport.singlesFee === 0 ? 'FREE (₹0)' : `₹${activeSport.singlesFee ?? 0}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Doubles')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-xs transition ${formData.eventType === 'Doubles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Doubles (2 Players)
                </div>
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
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
                entryFee: activeSport.doublesFee || 600
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
            
            {/* DYNAMIC OFFICIAL COORDINATOR PUBLISHED EVENTS SECTION */}
            {coordinatorEvents && coordinatorEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    Official Coordinator Published Events
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                    Live Published Events ({coordinatorEvents.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto w-full">
                  {coordinatorEvents.map((evt) => {
                    const registered = evt.registeredCount || 0;
                    const limit = evt.maxRegistrations || 64;
                    const slotsLeft = Math.max(0, limit - registered);
                    const isClosed = evt.status === 'Closed' || slotsLeft === 0;

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
                        className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition duration-300 flex flex-col justify-between group"
                      >
                        <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                          <img
                            src={evt.coverImage || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'}
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-md ${
                              evt.status === 'Coming Soon'
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : isClosed
                                ? 'bg-rose-500 text-white'
                                : 'bg-emerald-500 text-white'
                            }`}>
                              {evt.status === 'Coming Soon' ? '🟡 Coming Soon' : isClosed ? '● Closed' : '● Open'}
                            </span>
                          </div>

                          <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-black text-amber-400 border border-slate-700 shadow-md">
                            {isRacket ? `Singles: ₹${sFee} | Doubles: ₹${dFee}` : (currentFee > 0 ? `Fee: ₹${currentFee}` : 'FREE (₹0)')}
                          </div>

                          <div className="absolute bottom-3 left-4 right-4">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                              {evt.sportName} Coordinator Event
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
                              {evt.title}
                            </h3>
                          </div>
                        </div>

                        <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-mono block">Reg Deadline</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">{evt.regEndDate}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-mono block">Tournament Start</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">{evt.tournStartDate}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-mono block">Venue</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 text-[10px] truncate block">{evt.venue}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-mono block">Team Size</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">{evt.teamSize || `${minP} - ${maxP} Players`}</span>
                            </div>
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRulesModalSport({ sportName: evt.sportName || evt.title, rules: evt.rules })}
                              className="flex-1 py-2.5 rounded-2xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                              title="View Official Tournament Rules for this event"
                            >
                              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>View Rules</span>
                            </button>

                            <button
                              disabled={isClosed || evt.status === 'Coming Soon'}
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
                                  status: isClosed ? 'Closed' : evt.status === 'Coming Soon' ? 'Coming Soon' : 'Open',
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
                              className={`flex-1 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                                evt.status === 'Coming Soon'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 cursor-not-allowed font-extrabold'
                                  : isClosed
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-blue-500/20 active:scale-[0.98]'
                              }`}
                            >
                              <span>
                                {evt.status === 'Coming Soon'
                                  ? '⏳ Coming Soon'
                                  : isClosed
                                  ? (slotsLeft === 0 ? 'Event Full' : 'Registration Closed')
                                  : 'Register Now'
                                }
                              </span>
                              {evt.status !== 'Coming Soon' && <Trophy className="w-4 h-4" />}
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
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

                    {/* Mandatory Checkbox & Read Rulebook Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
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

                      <button
                        type="button"
                        onClick={() => setRulesModalSport(activeSport?.name || 'Badminton')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold shrink-0 flex items-center gap-1.5 transition active:scale-95"
                      >
                        <span>📖 Read Official Rulebook</span>
                      </button>
                    </div>
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
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Upon successful submission and payment, your registration will be reviewed and verified by your respective <strong>College Head</strong>. Ensure all student details are valid to prevent rejection during gate pass generation.
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

        {/* FULL SCREEN TOURNAMENT RULES MODAL */}
        <BadmintonRulesModal
          isOpen={!!rulesModalSport}
          onClose={() => setRulesModalSport(null)}
          sportName={typeof rulesModalSport === 'object' ? rulesModalSport?.sportName : (rulesModalSport || activeSport?.name || 'Badminton')}
          rules={typeof rulesModalSport === 'object' ? rulesModalSport?.rules : (activeSport?.rules || [])}
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

      </div>
    </div>
  );
};

export default RegistrationPage;

