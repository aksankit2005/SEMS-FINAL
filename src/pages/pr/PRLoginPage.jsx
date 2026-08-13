import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, Sparkles, Camera, CheckCircle2 } from 'lucide-react';
import { galleryApi } from '../../services/galleryApi';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const PRLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await galleryApi.loginPR(username, password);
      showToast('PR Coordinator Login Successful!', 'success');
      navigate('/pr/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid PR Coordinator credentials.');
      showToast('Login Failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsername(import.meta.env.VITE_PR_ADMIN_USERNAME || 'pr_admin');
    setPassword(import.meta.env.VITE_PR_ADMIN_PASSWORD || 'password123');
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-4 shadow-lg shadow-blue-500/30">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            PR Coordinator Portal
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Authorized Public Relations portal for managing tournament event albums, media uploads, and gallery coverage.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center animate-fade-in">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                PR Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. pr_admin"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Login to PR Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
