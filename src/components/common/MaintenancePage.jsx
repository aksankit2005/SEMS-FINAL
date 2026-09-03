import React from 'react';
import { Wrench, Shield, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MaintenancePage = ({ settings = {} }) => {
  const adminEmail = settings.adminEmail || 'sports@mpgi.edu.in';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 relative font-sans">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full text-center space-y-8 relative z-10 bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl">
        
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <Wrench className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            mpgisports is Under Maintenance
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            We will be back soon! We are currently performing essential system updates and improvements.
          </p>
        </div>

        {/* Admin Login Button */}
        <div className="pt-2">
          <Link
            to="/admin/login"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Portal Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Contact Email */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Mail className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Contact Us:{' '}
            <a
              href={`mailto:${adminEmail}`}
              className="font-bold text-blue-600 hover:underline"
            >
              {adminEmail}
            </a>
          </span>
        </div>

      </div>
    </div>
  );
};
