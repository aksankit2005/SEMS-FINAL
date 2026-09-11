import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

import axios from 'axios';
import { API_BASE_URL } from '../../services/apiConfig';

export const SuperCoordinatorLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      addToast('Please enter both username and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/super-coordinator/login`, {
        username: username.trim(),
        password: password.trim()
      });

      if (res.data && res.data.token) {
        localStorage.setItem('sems_super_coord_token', res.data.token);
        localStorage.setItem('sems_super_coord_user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('sems-auth-change'));
        addToast('Super Coordinator Login Successful!', 'success');
        navigate('/super-coordinator/dashboard');
        return;
      }
      throw new Error('Invalid authentication response.');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid Super Coordinator credentials.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-coordinator-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-spatial-sans text-[#211D2B] dark:text-[#F5F2FA] transition-colors">
      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />

      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] dark:bg-[#0D101A] p-6 sm:p-8 rounded-3xl border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-2xl relative z-10 transition-colors backdrop-blur-xl">
        
        {/* Header Branding */}
        <div className="text-center relative z-10 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7156A5] to-[#8B5CF6] text-white shadow-lg shadow-purple-500/20">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA] tracking-wide uppercase">
              Super Coordinator <span className="text-[#7156A5] dark:text-[#B8A5E5]">Portal</span>
            </h2>
            <p className="mt-1.5 text-xs text-[#686370] dark:text-[#AAA4B8]">
              President & Event Host Console for master participant records, coordinator creations & leaderboard standings.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FBEDEF] dark:bg-[rgba(225,29,72,0.14)] border border-[#FFCDD2] dark:border-[rgba(225,29,72,0.3)] text-xs text-[#B71C1C] dark:text-[#FDA4AF] text-center font-medium font-mono">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4 relative z-10" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] uppercase tracking-wider mb-2">
                Super Coordinator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8B8599] absolute left-3.5 top-3.5" />
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

            <div>
              <label className="block text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] uppercase tracking-wider mb-2">
                Access Key / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8B8599] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-xs text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#8B8599] focus:outline-none focus:ring-2 focus:ring-[#7156A5] dark:focus:ring-[#8B5CF6] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8B8599] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Super Coordinator Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-[#F5F2FA] transition-colors cursor-pointer"
          >
            ← Back to Home Page
          </button>
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
