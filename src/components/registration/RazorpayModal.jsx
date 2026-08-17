import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, ShieldCheck, CheckCircle2, Lock, X } from 'lucide-react';

export const RazorpayModal = ({ event, amount, participantName, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 7890');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('889');
  const [cardHolder, setCardHolder] = useState(participantName || 'Aarav Sharma');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayNow = (e) => {
    e.preventDefault();
    setError('');

    if (selectedMethod === 'upi' && (!upiId || !upiId.includes('@'))) {
      setError('Please enter a valid UPI ID (e.g. username@upi)');
      return;
    }

    if (selectedMethod === 'card' && (!cardNumber || cardNumber.length < 15)) {
      setError('Please enter a valid 16-digit Card Number');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const razorpayPaymentId = `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const orderId = `order_${Math.random().toString(36).substring(2, 10).toLowerCase()}`;
      
      onSuccess({
        razorpayPaymentId,
        orderId,
        amount,
        status: 'PAID',
        method: selectedMethod,
        timestamp: new Date().toISOString()
      });
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Razorpay Brand Top Bar */}
        <div className="bg-[#0C2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg tracking-tighter shadow-md">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white uppercase tracking-wider">Razorpay Checkout</h3>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[9px] font-mono uppercase">Secured</span>
              </div>
              <p className="text-xs text-slate-300">APEX Championship 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event & Amount Bar */}
        <div className="bg-blue-50 dark:bg-blue-950/40 p-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Entry Registration Fee</span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[220px]">
              {event?.title || 'Sports Event Registration'}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{amount}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <form onSubmit={handlePayNow} className="p-6 space-y-4">
          
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Payment Method
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${
                selectedMethod === 'upi'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>UPI / GPay</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${
                selectedMethod === 'card'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('netbanking')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${
                selectedMethod === 'netbanking'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Netbanking</span>
            </button>
          </div>

          {/* Form Controls */}
          {selectedMethod === 'upi' && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Enter VPA / UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@upi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400">Supported: Google Pay, PhonePe, Paytm, BHIM</p>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-500 font-bold flex items-center gap-1 pt-1">
              ⚠️ {error}
            </p>
          )}

          {/* Pay Action Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{amount}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit SSL Encrypted Razorpay Security Guarantee</span>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
