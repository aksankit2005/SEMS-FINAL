import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { Shield, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminApi.login(username, password);
      if (res.success) {
        addToast('Welcome back, System Administrator!', 'success');
        const from = location.state?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid Admin credentials');
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-portal-root min-h-screen bg-[#FAF9F6] dark:bg-[#070A13] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-spatial-sans text-[#211D2B] dark:text-[#F5F2FA] transition-colors">
      {/* Dark mode atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 spatial-nebula-dark opacity-60 dark:block hidden" />
      <div className="fixed inset-0 spatial-grain-overlay z-0 pointer-events-none opacity-20 dark:block hidden" />

      <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 transition-colors">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#7156A5] to-[#8B5CF6] shadow-lg shadow-purple-500/20 mb-2">
            <div className="w-12 h-12 bg-[#FFFFFF] dark:bg-[#070A13] rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#7156A5] dark:text-[#B8A5E5]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-spatial-display text-[#211D2B] dark:text-[#F5F2FA] tracking-wide uppercase">
            Admin <span className="text-[#7156A5] dark:text-[#B8A5E5]">Portal</span>
          </h1>
          <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">Sports & Event Management Central System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FBEDEF] dark:bg-[rgba(225,29,72,0.14)] border border-[#FFCDD2] dark:border-[rgba(225,29,72,0.3)] text-xs text-[#B71C1C] dark:text-[#FDA4AF] text-center font-medium font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] block mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8B8599] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] rounded-xl pl-10 pr-4 py-3 text-xs text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#8B8599] focus:outline-none focus:ring-2 focus:ring-[#7156A5] dark:focus:ring-[#8B5CF6] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#211D2B] dark:text-[#F5F2FA] block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8B8599] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] rounded-xl pl-10 pr-10 py-3 text-xs text-[#211D2B] dark:text-[#F5F2FA] placeholder-[#8B8599] focus:outline-none focus:ring-2 focus:ring-[#7156A5] dark:focus:ring-[#8B5CF6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#8B8599] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#121625] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[11px] text-[#686370] dark:text-[#AAA4B8] flex items-center justify-between font-mono">
            <span>Security Notice: <strong className="text-[#7156A5] dark:text-[#B8A5E5]">Authorized Admin Access Only</strong></span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#7156A5] hover:bg-[#5E458B] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-[#686370] hover:text-[#211D2B] dark:text-[#AAA4B8] dark:hover:text-[#F5F2FA] transition-colors cursor-pointer"
          >
            ← Back to Public Sports Portal
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
