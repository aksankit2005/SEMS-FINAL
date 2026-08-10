import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action? This action cannot be undone.',
  warningNote,
  requireReason = false,
  confirmButtonText = 'Confirm Delete',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onClose,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const getVariantStyles = () => {
    if (confirmVariant === 'danger') {
      return 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-rose-600/20';
    }
    if (confirmVariant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500 shadow-amber-600/20';
    }
    return 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500 shadow-indigo-600/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Optional Warning Alert Box */}
        {warningNote && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{warningNote}</span>
          </div>
        )}

        {/* Delete Reason Input Field (if supported) */}
        {requireReason && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Reason for Action (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for deactivation or deletion..."
              rows={3}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 ${getVariantStyles()}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
