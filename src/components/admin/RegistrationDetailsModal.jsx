import React, { useEffect } from 'react';
import { X, User, Phone, Mail, Building, BookOpen, Calendar, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';

export const RegistrationDetailsModal = ({ isOpen, registration, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !registration) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Registration Card
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">ID: {registration.id || registration.registrationId}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{registration.participantName}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Roll Number</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{registration.rollNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">College</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{registration.college || 'MPEC Kanpur'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Course & Year / Semester</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {registration.course || registration.branch || 'N/A'}{registration.yearSemester || registration.year ? ` • ${registration.yearSemester || registration.year}` : ''}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Game & Category</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {registration.gameSport} ({registration.category})
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Mobile Number</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{registration.mobile || 'N/A'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Email Address</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{registration.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Audit Metadata Box */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Registration Metadata</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">Reg. Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{registration.registrationDate}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Reg. Time</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{registration.registrationTime || '10:00 AM'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Payment Status</span>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
                {registration.paymentStatus || 'PAID'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Registered By</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{registration.registeredBy}</span>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
