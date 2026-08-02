import React from 'react';
import { X, Building2, Trophy, Camera, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const handleNavigate = (path) => {
    setIsAuthModalOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Glowing Orbs background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-dark.png" 
              alt="APEX Logo" 
              className="hidden dark:block h-9 w-auto object-contain"
            />
            <img 
              src="/logo-light.png" 
              alt="APEX Logo" 
              className="block dark:hidden h-9 w-auto object-contain"
            />
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Official Access Portals
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">APEX Management System</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Select your authorized staff portal to log in. Student account creation is not required.
        </p>

        {/* Portal Links List */}
        <div className="space-y-3">
          <button
            onClick={() => handleNavigate('/college-head/login')}
            className="w-full p-3.5 text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition group cursor-pointer flex items-center gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                College Head Portal
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Faculty statistics, athlete pass verification & medal counts
              </p>
            </div>
          </button>

          <button
            onClick={() => handleNavigate('/coordinator/login')}
            className="w-full p-3.5 text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-orange-500/50 hover:bg-orange-500/5 transition group cursor-pointer flex items-center gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                Sport Coordinator Portal
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Match scheduling, live score updates & team fixtures
              </p>
            </div>
          </button>

          <button
            onClick={() => handleNavigate('/pr/login')}
            className="w-full p-3.5 text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-500/50 hover:bg-blue-500/5 transition group cursor-pointer flex items-center gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                PR Media Portal
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Event photo gallery, video reel uploads & tournament highlights
              </p>
            </div>
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Participating teams submit entries directly via the event registration form. No user account setup or student login is required.
          </p>
        </div>
      </div>
    </div>
  );
};
