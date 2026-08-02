import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { coordinatorApi } from '../../services/coordinatorApi';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const CoordinatorLoginPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Please enter both username and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await coordinatorApi.login(username, password);
      if (res.success) {
        addToast(`Welcome, ${res.user.coordinatorName}! Managing ${res.user.sportName}.`, 'success');
        navigate('/coordinator/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Invalid Sport Coordinator credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">
              SEMS <span className="text-orange-400">Coordinator</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Dedicated Sport Control Portal
            </p>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Main Login Box */}
      <div className="max-w-5xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Info & Quick Presets */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-black uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-orange-400" /> Isolated Sport Architecture
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Sport Coordinator <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Portal</span>
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Each sport has its own dedicated coordinator. Every coordinator can strictly manage only their assigned sport.
            </p>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Sign In to Coordinator Console</h3>
              <p className="text-xs text-slate-400 mt-1">Enter your coordinator credentials to proceed.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Coordinator Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="coord_cricket"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Password with show/hide toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Access Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-3 p-0.5 text-slate-400 hover:text-orange-400 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Authenticating…</span>
                ) : (
                  <>
                    <span>Enter Coordinator Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Protected Endpoint • Authorized Sport Coordinators Only
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-7xl w-full mx-auto text-center text-xs text-slate-500 z-10">
        SEMS 2026 Sports Event Management System • Sport Coordinator Engine
      </div>
    </div>
  );
};
