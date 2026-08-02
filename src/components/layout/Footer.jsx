import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck } from 'lucide-react';


export const Footer = () => {
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
              <img
                src="/logo-dark.png"
                alt="APEX Logo"
                className="hidden dark:block h-10 w-auto object-contain"
              />
              <img
                src="/logo-light.png"
                alt="APEX Logo"
                className="block dark:hidden h-10 w-auto object-contain"
              />
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                APEX <span className="text-cyan-550 dark:text-cyan-400">2026</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The premier inter-college Sports Event Management System, bringing together registrations, fixtures, live scoring, real-time results, and championship leaderboards in one powerful platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/sports" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Sports Hub</Link></li>
              <li><Link to="/live" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition flex items-center gap-1.5">Live Scores <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /></Link></li>
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
              <li><Link to="/about" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">About APEX & Committee</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Athlete Portal</Link></li>
            </ul>
          </div>

          {/* Social & Contact Desk */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              Connect & Support
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-350">
              <li>
                <a
                  href="https://www.instagram.com/apex_mpgi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-cyan-500 transition group"
                >
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform">
                    {/* Instagram SVG icon */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">@apex_mpgi</span>
                </a>
              </li>

              <li>
                <a
                  href="mailto:sports@mpgi.edu.in"
                  className="flex items-center gap-2.5 hover:text-cyan-500 transition group"
                >
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 select-all">sports@mpgi.edu.in</span>
                </a>
              </li>

              <li>
                <a
                  href="tel:+919119705860"
                  className="flex items-center gap-2.5 hover:text-cyan-500 transition group"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 select-all">+91 91197 05860</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 APEX - Spirit of Sporting Excellence. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span>Engineered for Modern Sports Management.</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </footer>
  );
};
