import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, User, Users, Info, ShieldCheck } from 'lucide-react';
import { SPORTS_DATA } from '../data/sportsData';
import { SPORTS_CONFIG } from '../data/sportsConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
  const { addRegistration } = useAuth();
  const { addToast } = useToast();

  const preselectedSportId = searchParams.get('sport');

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
    setActiveSport(sport);
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

  // Step 2 Submission (Payment Gateway & Declaration)
  const handlePaymentSubmit = (e) => {
    if (e) e.preventDefault();

    if (!formData.declarationAccepted) {
      setErrors((prev) => ({ ...prev, declarationAccepted: 'Please accept the declaration and verification policy' }));
      addToast('Please accept the declaration and verification policy.', 'error');
      return;
    }

    const paymentErrors = {};
    const method = formData.paymentMethod || 'upi';

    if (method === 'upi') {
      if (!formData.upiId?.trim()) {
        paymentErrors.upiId = 'UPI ID is required';
      } else if (!formData.upiId.includes('@')) {
        paymentErrors.upiId = 'Invalid UPI ID format (must contain @)';
      }
    } else if (method === 'card') {
      if (!formData.cardHolder?.trim()) {
        paymentErrors.cardHolder = 'Cardholder name is required';
      }
      if (!formData.cardNumber?.trim() || formData.cardNumber.replace(/\s/g, '').length < 16) {
        paymentErrors.cardNumber = 'Valid 16-digit card number is required';
      }
      if (!formData.cardExpiry?.trim() || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
        paymentErrors.cardExpiry = 'Expiry date must be MM/YY';
      }
      if (!formData.cardCvv?.trim() || formData.cardCvv.length < 3) {
        paymentErrors.cardCvv = 'CVV is required (3 digits)';
      }
    } else if (method === 'netbanking') {
      if (!formData.selectedBank) {
        paymentErrors.selectedBank = 'Please select a bank';
      }
    }

    if (Object.keys(paymentErrors).length > 0) {
      setErrors(paymentErrors);
      addToast('Please correct the payment errors before proceeding.', 'error');
      return;
    }

    // Simulate gateway processing (1.5s delay)
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);

      // Auto-generate details & passcode starting with College Name
      const receiptId = `REC-APEX-${Math.floor(10000 + Math.random() * 90000)}`;
      const firstRosterPlayer = formData.roster && formData.roster[0];
      const selectedCollegeName = formData.collegeName || (firstRosterPlayer && firstRosterPlayer.college) || 'ST XAVIERS COLLEGE';
      const passCode = generateCollegePassCode(selectedCollegeName, activeSport.name);

      let eventCategory = activeSport.category;
      if (activeSport.id === 'table-tennis' || activeSport.id === 'badminton') {
        eventCategory = `${activeSport.category} (${formData.eventType})`;
      } else if (activeSport.id === 'athletics') {
        eventCategory = `Athletics (${formData.selectedEvents.join(', ')})`;
      }

      const utrNumber = `TXN-GW-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const receipt = {
        receiptId,
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
        utrNumber,
        screenshotName: 'gateway_processed.png',
        screenshot: MOCK_RECEIPT_IMAGE,
        declarationAccepted: formData.declarationAccepted,
        declarationTimestamp: formData.declarationTimestamp,
        status: 'PAID',
        date: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        passCode
      };

      setCompletedReceipt(receipt);
      addRegistration(receipt);
      addToast('Registration & Payment Successful!', 'success');
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  };

  // Handle Event Type Singles/Doubles toggle inside Details Step
  const handleEventTypeToggle = (type) => {
    setFormData((prev) => ({
      ...prev,
      eventType: type,
      teamName: type === 'Singles' ? '' : prev.teamName,
      roster: [] // reset roster size to reinitialize correctly
    }));
    setErrors({});
  };

  // Determine layout and render Step 1
  const renderDetailsStep = () => {
    const isRacketSport = activeSport.id === 'table-tennis' || activeSport.id === 'badminton';

    return (
      <div className="space-y-6">
        {/* Racket Sport Singles/Doubles Selection */}
        {isRacketSport && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Select Event Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Singles')}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition ${formData.eventType === 'Singles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <User className="w-4 h-4" /> Singles (1 Player)
              </button>
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Doubles')}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition ${formData.eventType === 'Doubles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <Users className="w-4 h-4" /> Doubles (2 Players)
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

        {/* SPORTS LIST STATE */}
        {!activeSport ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                🟢 Sports Status Dashboard
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsList.map((sport) => (
                <SportCard
                  key={sport.id}
                  sport={sport}
                  onRegisterSelect={handleSportSelect}
                />
              ))}
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

      </div>
    </div>
  );
};
