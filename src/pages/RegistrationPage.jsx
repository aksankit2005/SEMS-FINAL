import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, CheckCircle2, Building, Users, CreditCard, 
  Plus, Trash2, ShieldCheck, ArrowRight, ArrowLeft, Printer 
} from 'lucide-react';
import { SPORTS_DATA } from '../data/sportsData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRegistration } = useAuth();
  const { addToast } = useToast();

  const preselectedSportId = searchParams.get('sport') || 'cricket';

  const [step, setStep] = useState(1);

  const [selectedSport, setSelectedSport] = useState(
    SPORTS_DATA.find((s) => s.id === preselectedSportId) || SPORTS_DATA[0]
  );
  const [captainName, setCaptainName] = useState('');
  const [collegeName, setCollegeName] = useState("St. Xavier's College");
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [roster, setRoster] = useState([
    { name: '', rollNo: '', jerseyNo: '1' },
    { name: '', rollNo: '', jerseyNo: '2' }
  ]);

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState(null);

  const colleges = [
    "St. Xavier's College",
    "Christ University",
    "Loyola College",
    "BITS Pilani",
    "IIT Madras",
    "MIT Manipal",
    "SRM Institute",
    "VIT Vellore",
    "Delhi University",
    "Panjab University"
  ];

  const handleAddPlayer = () => {
    setRoster([...roster, { name: '', rollNo: '', jerseyNo: `${roster.length + 1}` }]);
  };

  const handleRemovePlayer = (index) => {
    if (roster.length <= 1) {
      addToast('Minimum 1 player required in roster', 'error');
      return;
    }
    setRoster(roster.filter((_, i) => i !== index));
  };

  const handleRosterChange = (index, field, value) => {
    const updated = [...roster];
    updated[index][field] = value;
    setRoster(updated);
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (!captainName || !email || !phone) {
        addToast('Please fill in Captain Name, Email, and Phone', 'error');
        return;
      }
    }
    if (step === 3) {
      const emptyPlayer = roster.some((p) => !p.name);
      if (emptyPlayer) {
        addToast('Please enter names for all listed players', 'error');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCompletePayment = (e) => {
    e.preventDefault();
    if (!utrNumber && paymentMethod === 'UPI') {
      addToast('Please enter simulated UTR/Txn ID', 'error');
      return;
    }

    const receiptId = `REC-SEMS-${Math.floor(10000 + Math.random() * 90000)}`;
    const passCode = `PASS-${selectedSport.name.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const receipt = {
      receiptId,
      sportName: selectedSport.name,
      category: selectedSport.category,
      participantName: captainName,
      college: collegeName,
      email,
      phone,
      feePaid: selectedSport.entryFee,
      rosterCount: roster.length,
      roster,
      status: 'CONFIRMED',
      date: new Date().toISOString().split('T')[0],
      passCode
    };

    setCompletedReceipt(receipt);
    addRegistration(receipt);
    addToast('Registration & Fee Payment Verified Successfully!', 'success');
    setStep(5);
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

        {/* Wizard Progress Bar */}
        <div className="mb-10 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: 'Sport' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'Roster' },
              { num: 4, label: 'Payment' },
              { num: 5, label: 'Receipt' }
            ].map((s) => (
              <div
                key={s.num}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  step === s.num
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : step > s.num
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    step === s.num
                      ? 'bg-blue-600 text-white'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Body Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
          
          {/* STEP 1: SPORT SELECTION */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Select Tournament Sport
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SPORTS_DATA.map((sport) => (
                  <div
                    key={sport.id}
                    onClick={() => setSelectedSport(sport)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      selectedSport.id === sport.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <img src={sport.image} alt={sport.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{sport.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sport.type} • Fee: ₹{sport.entryFee}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>Selected: <strong>{selectedSport.name}</strong> ({selectedSport.teamSize})</span>
                <span className="font-bold">Fee: ₹{selectedSport.entryFee}</span>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" /> College & Captain Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Select College / University
                  </label>
                  <select
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {colleges.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Captain / Lead Athlete Name *
                  </label>
                  <input
                    type="text"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="captain@college.edu"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <span>Configure Roster</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ROSTER */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Player Roster ({roster.length} Players)
                </h2>
                <button
                  onClick={handleAddPlayer}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" /> Add Player
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {roster.map((player, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Player #{idx + 1} Name</label>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleRosterChange(idx, 'name', e.target.value)}
                        placeholder="Player full name"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Roll / Student ID</label>
                      <input
                        type="text"
                        value={player.rollNo}
                        onChange={(e) => handleRosterChange(idx, 'rollNo', e.target.value)}
                        placeholder="e.g. 21CS099"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Jersey #</label>
                      <input
                        type="text"
                        value={player.jerseyNo}
                        onChange={(e) => handleRosterChange(idx, 'jerseyNo', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT */}
          {step === 4 && (
            <form onSubmit={handleCompletePayment} className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Entry Fee Verification
              </h2>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Event Selected:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSport.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">College:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{collegeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Squad Size:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{roster.length} Athletes</span>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base">
                  <span className="font-bold text-slate-900 dark:text-white">Total Fee Payable:</span>
                  <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">₹{selectedSport.entryFee}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Simulated UTR / Txn Reference ID *
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR-9988221100"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  (Demo payment simulator: Enter any reference number to verify receipt creation)
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Generate Receipt</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: RECEIPT */}
          {step === 5 && completedReceipt && (
            <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
              <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <h3 className="text-2xl font-black">Registration Confirmed!</h3>
                <p className="text-xs">Official Entry Pass & Receipt Generated</p>
              </div>

              <div id="receipt-card" className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                      SEMS 2026 OFFICIAL RECEIPT
                    </h4>
                    <p className="text-xs text-slate-400">Receipt #: {completedReceipt.receiptId}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950">
                    {completedReceipt.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Sport Event</span>
                    <span className="font-bold text-blue-400">{completedReceipt.sportName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">College</span>
                    <span className="font-bold">{completedReceipt.college}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Lead Captain</span>
                    <span className="font-bold">{completedReceipt.participantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pass Code</span>
                    <span className="font-mono font-bold text-orange-400">{completedReceipt.passCode}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-4 pt-4">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF Receipt
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md"
                >
                  Go to My Dashboard Passes
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
