import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Mail, Phone, MapPin, Send, ShieldCheck, Globe, Share2, MessageCircle, Radio } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const { addToast } = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      addToast('Please enter a valid email address', 'error');
      return;
    }
    addToast('Subscribed to SEMS Tournament Alerts!', 'success');
    setNewsletterEmail('');
  };

  return (
    <footer className="relative bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-350 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 overflow-hidden transition-all duration-200">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/30">
                <Trophy className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                SEMS <span className="text-cyan-550 dark:text-cyan-400">2026</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The premier inter-college Sports Event Management System. Empowering athletes, live scoring, fixtures, and championship leaderboard tracking nationwide.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="p-2.5 rounded-xl bg-slate-100 hover:bg-cyan-500/15 dark:bg-slate-900 dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-600 dark:text-slate-350 dark:hover:text-cyan-400 transition" title="Global Network">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="p-2.5 rounded-xl bg-slate-100 hover:bg-cyan-500/15 dark:bg-slate-900 dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-600 dark:text-slate-350 dark:hover:text-cyan-400 transition" title="Share Channel">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="p-2.5 rounded-xl bg-slate-100 hover:bg-cyan-500/15 dark:bg-slate-900 dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-600 dark:text-slate-350 dark:hover:text-cyan-400 transition" title="Community Desk">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="p-2.5 rounded-xl bg-slate-100 hover:bg-cyan-500/15 dark:bg-slate-900 dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-600 dark:text-slate-350 dark:hover:text-cyan-400 transition" title="Live Broadcast">
                <Radio className="w-4 h-4 text-rose-500" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/sports" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Sports Hub</Link></li>
              <li><Link to="/live" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition flex items-center gap-1.5">Live Scores <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"/></Link></li>
              <li><Link to="/registration" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Online Registration</Link></li>
              <li><Link to="/schedule" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Tournament Fixtures</Link></li>
              <li><Link to="/results" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Match Results</Link></li>
              <li><Link to="/leaderboard" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Medal Standings</Link></li>
            </ul>
          </div>

          {/* Support & Organizers */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Support & Desk
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/coordinators" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Coordinators Directory</Link></li>
              <li><Link to="/announcements" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">News & Announcements</Link></li>
              <li><Link to="/gallery" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Event Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Contact & Helpdesk</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Athlete Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter Subscribe */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Tournament Alerts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Get instant updates on fixture timings, venue changes, and live results.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter athlete email..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-600/20"
              >
                <Send className="w-3.5 h-3.5" /> Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SEMS - Sports Event Management System. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span>Engineered for modern sports platforms</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </footer>
  );
};
