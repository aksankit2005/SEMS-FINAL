import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff, Activity } from 'lucide-react';
import { coordinatorApi, getSportRoute } from '../../services/coordinatorApi';
import { useToast } from '../../context/ToastContext';

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
        const route = getSportRoute(res.user.assignedSport);
        addToast(`Welcome, ${res.user.coordinatorName}! Managing ${res.user.sportName}.`, 'success');
        navigate(route);
      }
    } catch (err) {
      addToast(err.message || 'Invalid Sport Coordinator credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="coordinator-portal-root min-h-[90vh] flex flex-col justify-center items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6] dark:bg-[#070A13] text-[#211D2B] dark:text-[#F5F2FA] font-spatial-sans transition-colors duration-200 relative overflow-hidden">
      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />

      {/* Main Layout Grid */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

        {/* Left Side: Branding & Information */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F4F2F7] dark:bg-[#201830] border border-[#E5DDF3] dark:border-[#382654] text-[#7156A5] dark:text-[#B8A5E5] text-xs font-bold uppercase tracking-wider font-mono">
            <Trophy className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5]" /> Sport Coordinator Console
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-spatial-display uppercase tracking-wide leading-tight text-[#211D2B] dark:text-[#F5F2FA]">
              Dedicated Sport <br className="hidden sm:inline" />
              <span className="text-[#7156A5] dark:text-[#B8A5E5]">
                Control Portal
              </span>
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#686370] dark:text-[#AAA4B8] leading-relaxed max-w-lg">
              Each sport has its own dedicated coordinator. Every coordinator strictly manages fixtures, live scores, team rosters, and events for their assigned sport.
            </p>
          </div>

          {/* Key Feature Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xs flex items-start gap-3 transition">
              <div className="p-2 rounded-xl bg-[#F4F2F7] dark:bg-[#201830] text-[#7156A5] dark:text-[#B8A5E5] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA]">Isolated Sport Architecture</h4>
                <p className="text-[11px] text-[#686370] dark:text-[#AAA4B8] mt-0.5">Strict role-based isolation ensuring coordinators manage only their assigned sport operations.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xs flex items-start gap-3 transition">
              <div className="p-2 rounded-xl bg-[#F4F2F7] dark:bg-[#201830] text-[#7156A5] dark:text-[#B8A5E5] shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#211D2B] dark:text-[#F5F2FA]">Real-Time Control Engine</h4>
                <p className="text-[11px] text-[#686370] dark:text-[#AAA4B8] mt-0.5">Direct live scoreboard broadcasts, round progression & instant schedule updates.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-6 backdrop-blur-xl">

            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-spatial-display uppercase text-[#211D2B] dark:text-[#F5F2FA] tracking-wide">
                Coordinator Sign In
              </h3>
              <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-1">
                Enter your sport-specific access credentials below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA] mb-1.5">
                  Assigned Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8B8599]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-xs text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#8B8599] focus:outline-none focus:ring-2 focus:ring-[#7156A5] dark:focus:ring-[#8B5CF6] transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA] mb-1.5">
                  Access Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8B8599]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-xs text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#8B8599] focus:outline-none focus:ring-2 focus:ring-[#7156A5] dark:focus:ring-[#8B5CF6] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-3.5 text-[#8B8599] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] transition cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security / Notice Badge */}
              <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[11px] text-[#686370] dark:text-[#AAA4B8] flex items-start gap-2.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#211D2B] dark:text-[#F5F2FA] block">Protected Endpoint</span>
                  Authorized Sport Coordinators Only. Access strictly monitored and audited.
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Authenticating…
                  </span>
                ) : (
                  <>
                    <span>Enter Coordinator Panel</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] text-[11px] text-[#8B8599] text-center font-mono">
              APEX 2026 Sports Event Management System • Sport Coordinator Engine
            </div>
          </div>
        </div>

      </div>

      {/* Footer Quote */}
      <footer className="mt-8 text-center relative z-10 max-w-lg px-4">
        <p className="font-spatial-display italic text-xs sm:text-sm tracking-wide text-[#686370] dark:text-[#AAA4B8]">
          “It’s what you learn after you think you know it all that really counts”
        </p>
      </footer>
    </div>
  );
};
