import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { galleryApi } from '../../services/galleryApi';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PRProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Check if PR token exists and role is PR or pr_coordinator
  const prToken = localStorage.getItem('pr_auth_token');
  const prUserRaw = localStorage.getItem('pr_user');
  let prUser = null;
  try {
    prUser = prUserRaw ? JSON.parse(prUserRaw) : null;
  } catch (e) {
    prUser = null;
  }

  const isPR = !!prToken || (user && (user.role === 'PR' || user.role === 'pr_coordinator'));

  if (!isPR) {
    return (
      <div className="min-h-screen py-20 px-4 bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Access Denied</h2>
            <p className="text-xs text-slate-400">
              The PR Portal is restricted to authorized PR Coordinators only. Public users and non-PR accounts are not permitted.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              to="/pr-login"
              state={{ from: location }}
              className="block w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition"
            >
              Log In as PR Coordinator
            </Link>
            
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Public Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
