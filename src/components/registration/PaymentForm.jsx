import React, { useState } from 'react';
import { CreditCard, QrCode, Building, Wallet, Smartphone, ShieldCheck, Check } from 'lucide-react';

export const PaymentForm = ({
  sport,
  formData,
  setFormData,
  errors,
  setErrors
}) => {
  const [selectedMethod, setSelectedMethod] = useState(formData.paymentMethod || 'upi');

  const handleMethodChange = (method) => {
    setSelectedMethod(method);
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method
    }));
    // Clear payment errors
    setErrors((prev) => ({
      ...prev,
      upiId: null,
      cardNumber: null,
      cardHolder: null,
      cardExpiry: null,
      cardCvv: null,
      selectedBank: null
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    } else if (name === 'cardExpiry') {
      formattedValue = value.replace(/\//g, '').replace(/(\d{2})/g, '$1/').trim();
      if (formattedValue.endsWith('/')) {
        formattedValue = formattedValue.slice(0, -1);
      }
      formattedValue = formattedValue.substring(0, 5);
    } else if (name === 'cardCvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const selectBank = (bankName) => {
    setFormData((prev) => ({
      ...prev,
      selectedBank: bankName
    }));
    if (errors.selectedBank) {
      setErrors((prev) => ({ ...prev, selectedBank: null }));
    }
  };

  const popularBanks = [
    { name: 'SBI', label: 'State Bank of India' },
    { name: 'HDFC', label: 'HDFC Bank' },
    { name: 'ICICI', label: 'ICICI Bank' },
    { name: 'AXIS', label: 'Axis Bank' }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
      
      {/* Secure Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight">Secure Payment Gateway</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Powered by APEX Pay Gateway
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">College / Institution:</span>
          <span className="font-bold">{formData.collegeName}</span>
        </div>
        {formData.teamName && (
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Team Name:</span>
            <span className="font-bold">{formData.teamName}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">Registration Sport:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{sport.name}</span>
        </div>
        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-850 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Amount to Pay:</span>
          <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">₹{sport.entryFee}</span>
        </div>
      </div>

      {/* Gateway Selection Tabs */}
      <div className="space-y-3">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-550 dark:text-slate-400">
          Select Payment Method
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleMethodChange('upi')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
              selectedMethod === 'upi'
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">UPI / GPay</span>
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('card')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
              selectedMethod === 'card'
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Card</span>
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('netbanking')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
              selectedMethod === 'netbanking'
                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Building className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Net Banking</span>
          </button>
        </div>
      </div>

      {/* UPI Section */}
      {selectedMethod === 'upi' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">UPI Instant Payment</h4>
          </div>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Enter your UPI VPA Address to send a payment authorization request to your app (Google Pay, PhonePe, Paytm, BHIM, etc.).
          </p>
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-400">Your UPI ID (VPA) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              name="upiId"
              value={formData.upiId || ''}
              onChange={handleInputChange}
              placeholder="e.g. mobile-no@ybl or username@oksbi"
              className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 ${
                errors.upiId ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-250 dark:border-slate-800 focus:ring-blue-500'
              }`}
            />
            {errors.upiId && <p className="text-[10px] text-rose-500 font-bold">{errors.upiId}</p>}
          </div>
        </div>
      )}

      {/* Card Section */}
      {selectedMethod === 'card' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 animate-fade-in">
          
          {/* Animated Credit Card Mockup */}
          <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-lg overflow-hidden border border-white/10">
            {/* Glossy overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">APEX Gateway Pay</p>
                <div className="w-10 h-7 bg-amber-500/20 rounded-md border border-amber-500/30 mt-1 flex items-center justify-center">
                  <div className="w-6 h-4 bg-amber-500/40 rounded-sm" />
                </div>
              </div>
              <div className="text-right font-black italic text-lg tracking-wider text-white/95">
                VISA
              </div>
            </div>

            <div className="mt-6">
              <p className="font-mono text-sm tracking-widest text-white/90">
                {formData.cardNumber || '•••• •••• •••• ••••'}
              </p>
            </div>

            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400">Card Holder</p>
                <p className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[150px]">
                  {formData.cardHolder || 'Your Name'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-wider text-slate-400">Expires</p>
                <p className="text-[10px] font-mono font-bold tracking-widest">
                  {formData.cardExpiry || 'MM/YY'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-slate-400">Card Holder Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="cardHolder"
                value={formData.cardHolder || ''}
                onChange={handleInputChange}
                placeholder="Name printed on card"
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 ${
                  errors.cardHolder ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-250 dark:border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.cardHolder && <p className="text-[10px] text-rose-500 font-bold">{errors.cardHolder}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-slate-400">Card Number <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber || ''}
                onChange={handleInputChange}
                placeholder="4111 2222 3333 4444"
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 ${
                  errors.cardNumber ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-250 dark:border-slate-800 focus:ring-blue-500'
                }`}
              />
              {errors.cardNumber && <p className="text-[10px] text-rose-500 font-bold">{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400">Expiry Date <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="cardExpiry"
                  value={formData.cardExpiry || ''}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 ${
                    errors.cardExpiry ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-250 dark:border-slate-800 focus:ring-blue-500'
                  }`}
                />
                {errors.cardExpiry && <p className="text-[10px] text-rose-500 font-bold">{errors.cardExpiry}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400">CVV <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  name="cardCvv"
                  value={formData.cardCvv || ''}
                  onChange={handleInputChange}
                  placeholder="•••"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 ${
                    errors.cardCvv ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-250 dark:border-slate-800 focus:ring-blue-500'
                  }`}
                />
                {errors.cardCvv && <p className="text-[10px] text-rose-500 font-bold">{errors.cardCvv}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Net Banking Section */}
      {selectedMethod === 'netbanking' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">Net Banking Checkout</h4>
          </div>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Select one of the popular banks or choose from the list to redirect to your secure bank checkout screen.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {popularBanks.map((bank) => {
              const isSelected = formData.selectedBank === bank.name;
              return (
                <button
                  key={bank.name}
                  type="button"
                  onClick={() => selectBank(bank.name)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{bank.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-500 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-1 pt-2">
            <label className="block text-[10px] font-black uppercase text-slate-400">Other Banks</label>
            <select
              name="selectedBank"
              value={formData.selectedBank || ''}
              onChange={(e) => selectBank(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 border-slate-250 dark:border-slate-800 focus:ring-blue-500"
            >
              <option value="">Select Another Bank</option>
              <option value="PNB">Punjab National Bank</option>
              <option value="BOB">Bank of Baroda</option>
              <option value="CANARA">Canara Bank</option>
              <option value="KOTAK">Kotak Mahindra Bank</option>
              <option value="INDUS">IndusInd Bank</option>
            </select>
            {errors.selectedBank && <p className="text-[10px] text-rose-500 font-bold">{errors.selectedBank}</p>}
          </div>
        </div>
      )}

    </div>
  );
};
