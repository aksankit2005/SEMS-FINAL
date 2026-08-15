import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: 'Confirm Action',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
    variant: 'danger', // 'danger' | 'warning' | 'primary'
    resolver: null,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      let title = 'Confirm Delete';
      let message = 'Are you sure you want to delete this item? This action cannot be undone.';
      let confirmText = 'Yes, Delete';
      let cancelText = 'Cancel';
      let variant = 'danger';

      if (typeof options === 'string') {
        message = options;
      } else if (typeof options === 'object' && options !== null) {
        if (options.title) title = options.title;
        if (options.message) message = options.message;
        if (options.confirmText) confirmText = options.confirmText;
        if (options.cancelText) cancelText = options.cancelText;
        if (options.variant) variant = options.variant;
      }

      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        resolver: resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState.resolver) {
      confirmState.resolver(true);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolver: null }));
  }, [confirmState.resolver]);

  const handleCancel = useCallback(() => {
    if (confirmState.resolver) {
      confirmState.resolver(false);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolver: null }));
  }, [confirmState.resolver]);

  // Handle keyboard navigation (Escape to cancel, Enter to confirm)
  useEffect(() => {
    if (!confirmState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState.isOpen, handleCancel, handleConfirm]);

  const getVariantStyles = () => {
    if (confirmState.variant === 'warning') {
      return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25';
    }
    if (confirmState.variant === 'primary') {
      return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25';
    }
    return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25';
  };

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete: confirm }}>
      {children}

      {/* Global Confirmation Modal */}
      {confirmState.isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={handleCancel}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 text-slate-900 dark:text-white transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${getVariantStyles()}`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmState.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
