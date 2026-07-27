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

const MOCK_RECEIPT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='100%25' height='100%25' fill='%230f172a'/><text x='50%25' y='35%25' fill='%2310b981' font-family='sans-serif' font-size='22' font-weight='black' text-anchor='middle'>SEMS 2026</text><text x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>MOCK PAYMENT SUCCESSFUL</text><text x='50%25' y='65%25' fill='%2364748b' font-family='sans-serif' font-size='10' font-weight='medium' text-anchor='middle'>UTR: TXN-SEMS-MOCK-998</text><rect x='20' y='220' width='260' height='50' fill='%231e293b' rx='10'/><text x='50%25' y='250%25' fill='%2338bdf8' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle'>VERIFIED DEMO RECEIPT</text></svg>";

export const RegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRegistration } = useAuth();
  const { addToast } = useToast();

  const preselectedSportId = searchParams.get('sport');

  // Load configuration and merge with existing sports data
  const [sportsList] = useState(() => {
    return SPORTS_DATA.map((sport) => {
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
  });

  const [activeSport, setActiveSport] = useState(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Receipt

  const [formData, setFormData] = useState({
    collegeName: '',
    teamName: '',
    captainName: '',
    captainPhone: '',
    captainEmail: '',
    eventType: 'Singles', // TT/Badminton toggle: Singles or Doubles
    selectedEvents: [],   // Athletics
    roster: [],
    utrNumber: 'TXN-SEMS-MOCK-998',
    screenshot: MOCK_RECEIPT_IMAGE,
    screenshotName: 'mock_payment_receipt.png',
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
        utrNumber: 'TXN-SEMS-MOCK-998',
        screenshot: MOCK_RECEIPT_IMAGE,
        screenshotName: 'mock_payment_receipt.png',
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

  // Process payment files upload
  const handleFileChange = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast('Please upload an image file (PNG/JPG/JPEG/WEBP)', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addToast('File is too large (maximum size is 5MB)', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          screenshot: event.target.result,
          screenshotName: file.name
        }));
        if (errors.screenshot) {
          setErrors((prev) => ({ ...prev, screenshot: null }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      screenshot: null,
      screenshotName: ''
    }));
  };

  // Step 1 Validation
  const handleDetailsSubmit = () => {
    let formErrors = {};
    const isTeamLayout = 
      ['football', 'basketball', 'volleyball', 'cricket', 'kabaddi', 'tug-of-war', 'kho-kho'].includes(activeSport.id) ||
      ((activeSport.id === 'table-tennis' || activeSport.id === 'badminton') && formData.eventType === 'Doubles');

    if (isTeamLayout) {
      formErrors = validateTeamForm(activeSport, formData);
    } else {
      formErrors = validateIndividualForm(activeSport, formData);
    }

    if (!formData.declarationAccepted) {
      formErrors.declarationAccepted = 'Please accept the declaration and verification policy';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      const firstError = Object.values(formErrors)[0];
      addToast(firstError, 'error');
      return;
    }

    setErrors({});
    setStep(2);
  };

  // Step 2 Submission (Payment)
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    // Security check to prevent developer tool bypass
    if (!formData.declarationAccepted) {
      addToast('Security Block: You must accept the declaration and verification policy.', 'error');
      setStep(1);
      return;
    }

    const paymentErrors = {};
    if (!formData.utrNumber?.trim()) {
      paymentErrors.utrNumber = 'Transaction ID / UTR is required';
    } else if (formData.utrNumber.trim().length < 6) {
      paymentErrors.utrNumber = 'Transaction ID must be at least 6 characters';
    }

    if (!formData.screenshot) {
      paymentErrors.screenshot = 'Payment screenshot receipt is required';
    }

    if (Object.keys(paymentErrors).length > 0) {
      setErrors(paymentErrors);
      addToast('Please complete all payment fields correctly.', 'error');
      return;
    }

    // Auto-generate details & passcode
    const receiptId = `REC-SEMS-${Math.floor(10000 + Math.random() * 90000)}`;
    const passCode = `PASS-${activeSport.name.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    let eventCategory = activeSport.category;
    if (activeSport.id === 'table-tennis' || activeSport.id === 'badminton') {
      eventCategory = `${activeSport.category} (${formData.eventType})`;
    } else if (activeSport.id === 'athletics') {
      eventCategory = `Athletics (${formData.selectedEvents.join(', ')})`;
    }

    const receipt = {
      receiptId,
      sportName: activeSport.name,
      category: eventCategory,
      participantName: formData.captainName,
      college: formData.collegeName,
      email: formData.captainEmail,
      phone: formData.captainPhone,
      teamName: formData.teamName || '',
      feePaid: activeSport.entryFee,
      rosterCount: formData.roster.length,
      roster: formData.roster,
      utrNumber: formData.utrNumber,
      screenshotName: formData.screenshotName,
      screenshot: formData.screenshot,
      declarationAccepted: formData.declarationAccepted,
      declarationTimestamp: formData.declarationTimestamp,
      status: 'PENDING APPROVAL',
      date: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      passCode
    };

    setCompletedReceipt(receipt);
    addRegistration(receipt);
    addToast('Registration Passed Successfully!', 'success');
    setStep(3);
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
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition ${
                  formData.eventType === 'Singles'
                    ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-4 h-4" /> Singles (1 Player)
              </button>
              <button
                type="button"
                onClick={() => handleEventTypeToggle('Doubles')}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition ${
                  formData.eventType === 'Doubles'
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
            {step < 4 && (
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
                      <span>Proceed to Declaration</span>
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DECLARATION & VERIFICATION */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Card 1: Verification & Approval Information */}
                  <div className="p-5 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 text-slate-800 dark:text-blue-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs space-y-2">
                      <h4 className="font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Verification & Approval</h4>
                      <p className="leading-relaxed">
                        After submission of the registration form, the participant's details will be forwarded to the respective Department/College for verification. Registration will be considered successful only after approval from the Department/College.
                      </p>
                      <p className="leading-relaxed">
                        If the Department/College raises any objection regarding the participant's eligibility or any other relevant matter, the registration will be rejected. In such cases, the registration fee, if already paid, will be refunded to the participant.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Mandatory Declaration Card */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition duration-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-500" />
                      <h4 className="font-black uppercase tracking-wider text-slate-950 dark:text-white text-xs">Declaration</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      "I hereby declare that the information provided by me in this registration form is true and correct to the best of my knowledge. I agree to abide by all the rules and regulations of the sports event. If I am found guilty of providing false information or engaging in any act of indiscipline or misconduct, I understand that I may be disqualified, and I agree to accept the decision of the Organizing Committee as final."
                    </p>
                    
                    {/* Mandatory Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
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
                        className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        I have read, understood, and agree to the above declaration and verification policy.
                      </span>
                    </label>
                  </div>

                  {/* Helpmessage next to button */}
                  {!formData.declarationAccepted && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold text-right transition animate-pulse">
                      ⚠️ Please accept the declaration before proceeding to payment.
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!formData.declarationAccepted}
                      className={`px-8 py-3 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 transition ${
                        formData.declarationAccepted
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-blue-500/20 active:scale-[0.98]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200/40 dark:border-slate-700/40'
                      }`}
                      title={!formData.declarationAccepted ? "Please accept the declaration before proceeding to payment." : ""}
                    >
                      <span>Proceed to Payment</span>
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 && (
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <PaymentForm
                    sport={activeSport}
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    setErrors={setErrors}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                  />
                  <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition active:scale-[0.98]"
                    >
                      <span>Verify & Generate pass</span>
                      <Trophy className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: RECEIPT */}
              {step === 4 && completedReceipt && (
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
