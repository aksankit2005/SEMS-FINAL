import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, ShieldCheck, UserCheck, CreditCard } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-14 sm:py-18 bg-[#FFFFFF] dark:bg-[#0D101A] text-[#211D2B] dark:text-[#F5F2FA] border-t border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] relative transition-colors duration-200 font-spatial-sans">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Dignified Subheading */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[#F4F2F7] dark:bg-[#121625] text-[#7156A5] dark:text-[#B8A5E5] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.15)]">
          <Trophy className="w-3.5 h-3.5 text-[#A98B57] dark:text-[#D2AB45]" />
          <span>Inter-College Championship Registration</span>
        </div>

        {/* Main Heading */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#211D2B] dark:text-[#F5F2FA] font-spatial-display leading-tight">
          Register Your Squad for <span className="text-[#7156A5] dark:text-[#B8A5E5]">APEX 2026</span>
        </h2>

        {/* Description Text */}
        <p className="text-xs sm:text-sm md:text-base text-[#686370] dark:text-[#AAA4B8] max-w-2xl mx-auto leading-relaxed">
          Slots are limited across Team Events (Cricket, Football, Kabaddi, Basketball, Volleyball, Kho-Kho, Tug of War) and Individual Championships (Table Tennis, Badminton, Chess, Athletics). Secure your college entry before the final deadline.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/registration"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#7156A5] hover:bg-[#5E4491] dark:bg-[#8B5CF6] dark:hover:bg-[#7C3AED] text-white font-semibold text-sm transition-all shadow-2xs flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-white" />
            <span>Open Registration Wizard</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
          
          <Link
            to="/contact"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#FAF9F6] dark:bg-[#121625] hover:bg-[#F4F2F7] dark:hover:bg-[#161B2E] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.2)] text-[#211D2B] dark:text-[#F5F2FA] font-semibold text-sm transition-all shadow-2xs flex items-center justify-center"
          >
            Contact Help Desk
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[#686370] dark:text-[#AAA4B8]">
          <div className="flex items-center gap-2 bg-[#FAF9F6] dark:bg-[#070A13] px-3.5 py-2 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
            <ShieldCheck className="w-4 h-4 text-[#1B5E20] dark:text-[#81C784] shrink-0" />
            <span className="font-medium">Official University Certification</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FAF9F6] dark:bg-[#070A13] px-3.5 py-2 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
            <Trophy className="w-4 h-4 text-[#A98B57] dark:text-[#D2AB45] shrink-0" />
            <span className="font-medium">Trophies & Merit Medals</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FAF9F6] dark:bg-[#070A13] px-3.5 py-2 rounded-lg border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.12)]">
            <CreditCard className="w-4 h-4 text-[#7156A5] dark:text-[#B8A5E5] shrink-0" />
            <span className="font-medium">Digital Passes & Verified Receipts</span>
          </div>
        </div>

      </div>
    </section>
  );
};
