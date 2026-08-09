import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, MessageSquareText } from 'lucide-react';

const YoutubeIcon = ({ className = "w-3.5 h-3.5 md:w-4 md:h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const FooterContactItem = ({ icon: Icon, bgClass, textClass, value, href, label }) => {
  const [show, setShow] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e) => {
      if (itemRef.current && !itemRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  return (
    <div ref={itemRef} className="flex items-center gap-2">
      <button
        onClick={() => setShow(!show)}
        title={show ? "Click to hide" : `Click to view ${label}`}
        className={`p-1.5 sm:p-2 rounded-xl ${bgClass} ${textClass} hover:scale-110 hover:bg-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0`}
      >
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      {show ? (
        <a
          href={href}
          className="font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-500 transition select-all text-[11px] sm:text-xs"
        >
          {value}
        </a>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition cursor-pointer"
        >
          {label}
        </button>
      )}
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="relative bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-350 border-t border-slate-200 dark:border-slate-800 pt-8 sm:pt-12 lg:pt-16 pb-6 sm:pb-8 overflow-hidden transition-all duration-200">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 pb-8 sm:pb-12 border-b border-slate-200 dark:border-slate-800/80">

          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3">
              <img
                src="/logo-dark.png"
                alt="APEX Logo"
                className="hidden dark:block h-8 sm:h-10 w-auto object-contain"
              />
              <img
                src="/logo-light.png"
                alt="APEX Logo"
                className="block dark:hidden h-8 sm:h-10 w-auto object-contain"
              />
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                APEX <span className="text-cyan-550 dark:text-cyan-400">2026</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The premier inter-college Sports Event Management System, bringing together registrations, fixtures, live scoring, real-time results, and championship leaderboards in one powerful platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2.5 sm:mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/sports" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Sports Hub</Link></li>
              <li><Link to="/live" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition flex items-center gap-1.5">Live Scores <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /></Link></li>
              <li><Link to="/registration" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Online Registration</Link></li>
              <li><Link to="/schedule" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Tournament Fixtures</Link></li>
              <li><Link to="/results" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Match Results</Link></li>
              <li><Link to="/gallery" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">Photo & Video Gallery</Link></li>
              <li><Link to="/announcements" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">News & Announcements</Link></li>
              <li><Link to="/about" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition">About APEX & Committee</Link></li>
            </ul>
          </div>

          {/* Social & Contact Desk */}
          <div>
            <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-2.5 sm:mb-4">
              Connect & Support
            </h4>
            <ul className="space-y-2 sm:space-y-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-350">
              <li>
                <a
                  href="https://www.instagram.com/apex_mpgi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-2.5 hover:text-cyan-500 transition group"
                >
                  <div className="p-1.5 sm:p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  href="https://www.youtube.com/channel/UCcWYHWAgzKI7Mik084w-JFg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-2.5 hover:text-cyan-500 transition group"
                >
                  <div className="p-1.5 sm:p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">YouTube Channel</span>
                </a>
              </li>

              <li>
                <a
                  href="https://forms.gle/efdESb3ipHsvwfaX7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 sm:gap-2.5 hover:text-cyan-500 transition group"
                >
                  <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <MessageSquareText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Feedback Form</span>
                </a>
              </li>

              <li>
                <FooterContactItem
                  icon={Mail}
                  bgClass="bg-blue-500/10"
                  textClass="text-blue-600 dark:text-blue-400"
                  value="sports@mpgi.edu.in"
                  href="mailto:sports@mpgi.edu.in"
                  label="Email"
                />
              </li>

              <li>
                <FooterContactItem
                  icon={Phone}
                  bgClass="bg-emerald-500/10"
                  textClass="text-emerald-600 dark:text-emerald-400"
                  value="+91 91197 05860"
                  href="tel:+919119705860"
                  label="Contact Us"
                />
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 text-center md:text-left">
          <p>© 2026 APEX - Spirit of Sporting Excellence. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-500 dark:text-slate-400 font-medium">
            <Link to="/faq" className="hover:text-cyan-500 transition">FAQ</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-cyan-500 transition">Terms & Conditions</Link>
            <span>•</span>
            <Link
              to="/privacy"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="hover:text-cyan-500 transition"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              to="/super-coordinator/dashboard"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="hover:text-amber-400 font-bold transition text-amber-500/90"
            >
              👑 President Console
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
            <span>Engineered for Modern Sports Management.</span>
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
        </div>
      </div>
    </footer>
  );
};
