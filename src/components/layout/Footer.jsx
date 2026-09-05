import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, MessageSquareText } from 'lucide-react';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const Footer = () => {
  const [copiedItem, setCopiedItem] = useState(null);

  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <footer className="relative bg-[#FAF9F6] dark:bg-[#070A13] text-[#686370] dark:text-[#AAA4B8] border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] pt-8 pb-6 transition-colors duration-200 overflow-hidden font-spatial-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 pb-6 border-b border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)] items-start">
          
          {/* Brand & Mission (Col 5) */}
          <div className="md:col-span-5 space-y-2.5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/logo-dark.png"
                alt="APEX Logo"
                className="hidden dark:block h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <img
                src="/logo-light.png"
                alt="APEX Logo"
                className="block dark:hidden h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#211D2B] dark:text-[#F5F2FA] font-spatial-display">
                APEX <span className="text-[#7156A5] dark:text-[#B8A5E5]">2026</span>
              </span>
            </Link>
            <p className="text-xs text-[#686370] dark:text-[#AAA4B8] leading-relaxed max-w-md">
              The premier inter-college Sports Event Management System of Maharana Pratap Engineering College, uniting registrations, tournament fixtures, live scoring, and championship leaderboards.
            </p>
            <p className="text-xs font-semibold text-[#A98B57] dark:text-[#D2AB45] tracking-wide pt-0.5">
              &ldquo;Courage, Dignity, and Unyielding Legacy.&rdquo;
            </p>
          </div>

          {/* Quick Navigation (Col 4) */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA]">
              Quick Links
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#686370] dark:text-[#AAA4B8]">
              <Link to="/live" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5 flex items-center gap-1.5">
                Live Scores <span className="w-1.5 h-1.5 rounded-full bg-[#B71C1C] dark:bg-[#FDA4AF]" />
              </Link>
              <Link to="/registration" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                Registration
              </Link>
              <Link to="/schedule" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                Fixtures
              </Link>
              <Link to="/results" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                Match Results
              </Link>
              <Link to="/leaderboard" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                Leaderboard
              </Link>
              <Link to="/gallery" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                Gallery
              </Link>
              <Link to="/announcements" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                Announcements
              </Link>
              <Link to="/about" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors py-0.5">
                About APEX
              </Link>
            </div>
          </div>

          {/* Connect & Support (Col 3) */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#211D2B] dark:text-[#F5F2FA]">
              Connect & Support
            </h4>
            
            {/* Unified Social Icon Action Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/apex_mpgi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="APEX Instagram Profile"
                title="Follow APEX on Instagram (@apex_mpgi)"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] hover:border-[#7156A5]/40 transition-all flex items-center justify-center shadow-2xs min-h-[36px] min-w-[36px]"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/channel/UCcWYHWAgzKI7Mik084w-JFg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="APEX Official YouTube Channel"
                title="Watch APEX Matches on YouTube"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#B71C1C] dark:hover:text-[#FDA4AF] hover:border-[#B71C1C]/40 transition-all flex items-center justify-center shadow-2xs min-h-[36px] min-w-[36px]"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>

              {/* Feedback Form */}
              <a
                href="https://forms.gle/efdESb3ipHsvwfaX7"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="APEX Feedback Form"
                title="Submit Feedback / Suggestions"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] hover:border-[#7156A5]/40 transition-all flex items-center justify-center shadow-2xs min-h-[36px] min-w-[36px]"
              >
                <MessageSquareText className="w-4 h-4" />
              </a>

              {/* Email Icon Button */}
              <a
                href="mailto:sports@mpgi.edu.in"
                aria-label="Email APEX Support Desk"
                title="Email: sports@mpgi.edu.in"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#7156A5] dark:hover:text-[#B8A5E5] hover:border-[#7156A5]/40 transition-all flex items-center justify-center shadow-2xs min-h-[36px] min-w-[36px]"
              >
                <Mail className="w-4 h-4" />
              </a>

              {/* Phone Icon Button */}
              <a
                href="tel:+919119705860"
                aria-label="Call APEX Support Desk"
                title="Call Support: +91 91197 05860"
                className="w-8 h-8 rounded-lg bg-white dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] text-[#211D2B] dark:text-[#F5F2FA] hover:text-[#1B5E20] dark:hover:text-[#81C784] hover:border-[#1B5E20]/40 transition-all flex items-center justify-center shadow-2xs min-h-[36px] min-w-[36px]"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Legal Links Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#686370] dark:text-[#AAA4B8] text-center sm:text-left">
          
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-[#211D2B] dark:text-[#F5F2FA]">© 2026 APEX</span>
            <span>•</span>
            <span className="text-[11px]">Maharana Pratap Engineering College, MPGI Kanpur</span>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 font-medium text-[11px] sm:text-xs">
            <Link to="/faq" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors">
              FAQ
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link
              to="/privacy"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="hover:text-[#7156A5] dark:hover:text-[#B8A5E5] transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Platform Tagline */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#686370] dark:text-[#AAA4B8]">
            <span>Engineered with Dignity & Precision</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B5E20] dark:text-[#81C784] shrink-0" />
          </div>

        </div>

      </div>
    </footer>
  );
};
