import React from 'react';
import { CreditCard, UploadCloud, Image as ImageIcon, Trash2, QrCode } from 'lucide-react';

export const PaymentForm = ({
  sport,
  formData,
  setFormData,
  errors,
  setErrors,
  onFileChange,
  onRemoveFile
}) => {

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    onFileChange(file);
  };

  const fileInputHandler = (e) => {
    const file = e.target.files[0];
    onFileChange(file);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
      
      {/* Title */}
      {/* Secure Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase">Payment Verification</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Secure Entry Fee Clearance</p>
        </div>
      </div>

      {/* Summary */}
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors duration-200">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500">Event Name:</span>
          <span className="font-bold">{sport.name}</span>
        </div>
        {formData.teamName && (
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Team Name:</span>
            <span className="font-bold">{formData.teamName}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500">College / Institution:</span>
          <span className="font-bold">{formData.collegeName}</span>
        </div>
        {sport.id === 'table-tennis' || sport.id === 'badminton' ? (
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Event Mode:</span>
            <span className="font-bold">{formData.eventType}</span>
          </div>
        ) : sport.id === 'athletics' ? (
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Selected Events:</span>
            <span className="font-bold truncate max-w-[200px]" title={(formData.selectedEvents || []).join(', ')}>
              {(formData.selectedEvents || []).join(', ')}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500">Squad Count:</span>
          <span className="font-bold">{(formData.roster || []).length} Athletes</span>
        </div>
        <div className="pt-3 border-t border-slate-250 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Registration Fee:</span>
          <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">₹{sport.entryFee}</span>
        </div>
      </div>

      {/* QR Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="space-y-4 text-center md:text-left">
          <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center justify-center md:justify-start gap-1.5">
            <QrCode className="w-4 h-4" /> UPI Payment Gateway
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Scan the QR code to clear the entry fee using any UPI App (GPay, PhonePe, Paytm, BHIM).
          </p>
          <div className="space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl inline-block text-left">
            <span className="text-[9px] uppercase tracking-wider block text-slate-500 dark:text-slate-400 font-bold">SEMS Official UPI ID</span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white select-all">sems2026@okaxis</span>
          </div>
        </div>

        {/* CSS Mock QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md inline-block">
            <svg className="w-40 h-40" viewBox="0 0 100 100">
              {/* Outer Position Detectors */}
              <rect x="0" y="0" width="30" height="30" fill="#0f172a" rx="4" />
              <rect x="5" y="5" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="10" y="10" width="10" height="10" fill="#2563eb" rx="1" />

              <rect x="70" y="0" width="30" height="30" fill="#0f172a" rx="4" />
              <rect x="75" y="5" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="80" y="10" width="10" height="10" fill="#2563eb" rx="1" />

              <rect x="0" y="70" width="30" height="30" fill="#0f172a" rx="4" />
              <rect x="5" y="75" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="10" y="80" width="10" height="10" fill="#2563eb" rx="1" />

              {/* Smaller Alignment Pattern */}
              <rect x="70" y="70" width="10" height="10" fill="#0f172a" rx="1" />
              <rect x="85" y="85" width="15" height="15" fill="#0f172a" rx="2" />

              {/* Simulated Random Blocks */}
              <path d="M 35 5 H 45 V 15 H 35 Z M 50 0 H 60 V 10 H 50 Z M 40 20 H 50 V 25 H 40 Z M 60 15 H 65 V 25 H 60 Z M 5 35 H 15 V 45 H 5 Z M 20 35 H 25 V 40 H 20 Z M 25 45 H 35 V 55 H 25 Z M 0 50 H 10 V 60 H 0 Z M 40 35 H 55 V 45 H 40 Z M 50 50 H 65 V 60 H 50 Z M 35 65 H 45 V 75 H 35 Z M 45 80 H 60 V 90 H 45 Z M 70 40 H 80 V 50 H 70 Z M 85 35 H 95 V 45 H 85 Z M 75 55 H 90 V 65 H 75 Z" fill="#0f172a" />
              <path d="M 35 30 H 40 V 35 H 35 Z M 55 25 H 60 V 30 H 55 Z M 45 60 H 50 V 65 H 45 Z M 65 65 H 70 V 70 H 65 Z M 30 75 H 35 V 85 H 30 Z" fill="#f97316" />

              {/* Center Logo Area */}
              <rect x="42" y="42" width="16" height="16" fill="#2563eb" rx="4" />
              <path d="M 46 50 L 49 46 L 52 50 L 54 48 L 51 54 L 46 50" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </div>

      {/* Transaction Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">
          UPI Transaction ID / UTR Number <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="utrNumber"
          value={formData.utrNumber || ''}
          onChange={handleInputChange}
          placeholder="e.g. UPI883492810"
          className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 ${
            errors.utrNumber ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
          }`}
        />
        {errors.utrNumber && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.utrNumber}</p>}
      </div>

      {/* File Upload zone */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2">
          Upload Payment Screenshot Receipt <span className="text-rose-500">*</span>
        </label>
        
        {!formData.screenshot ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
              errors.screenshot 
                ? 'border-rose-500 bg-rose-500/5 hover:bg-rose-500/10' 
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              id="payment-file-input"
              accept="image/*"
              onChange={fileInputHandler}
              className="hidden"
            />
            <label htmlFor="payment-file-input" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Drag & Drop payment screenshot, or click to browse</span>
              <span className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP (Max 5MB)</span>
            </label>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col sm:flex-row items-center gap-4 transition-colors duration-200">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-250 dark:border-slate-700">
              <img src={formData.screenshot} alt="Payment Receipt" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center justify-center sm:justify-start gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                {formData.screenshotName}
              </h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">✓ Uploaded & validated locally</p>
            </div>
            <button
              type="button"
              onClick={onRemoveFile}
              className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white font-bold text-xs flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        )}
        {errors.screenshot && <p className="text-[11px] text-rose-500 mt-2 font-semibold">{errors.screenshot}</p>}
      </div>

    </div>
  );
};
