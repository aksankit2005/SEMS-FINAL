import React, { useState } from 'react';
import { Printer, FileDown, CheckCircle2, ShieldCheck, QrCode, User, Phone, Mail, Calendar, Loader2 } from 'lucide-react';
import { downloadPassAsPDF } from '../../utils/pdfExporter';

export const RegistrationReceipt = ({ receipt, onGoToDashboard }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!receipt) {
    return (
      <div className="p-8 text-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900">
        Registration data missing or unavailable.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    const fileName = `APEX_Pass_${receipt.passCode || receipt.receiptId}.pdf`;
    await downloadPassAsPDF(receipt, fileName);
    setIsExportingPdf(false);
  };

  const firstRoster = (receipt.roster && receipt.roster[0]) || {};
  const participantName = receipt.participantName || firstRoster.name || 'Athlete';
  const fatherName = receipt.fatherName || firstRoster.fatherName || 'N/A';
  const gender = receipt.gender || firstRoster.gender || 'Male';
  const dob = receipt.dob || firstRoster.dob || '2004-05-15';
  const phone = receipt.phone || firstRoster.phone || '+91 98765 43210';
  const email = receipt.email || firstRoster.email || 'athlete@college.edu';
  const college = receipt.college || receipt.districtState || 'St. Xavier\'s College';
  const districtState = receipt.districtState || college;
  const teamName = receipt.teamName || college;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
      
      {/* Success banner */}
      <div className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 animate-bounce" />
        <h3 className="text-2xl font-black">Registration Confirmed!</h3>
        <p className="text-xs font-semibold">Your official entry pass has been generated dynamically with your submitted form details.</p>
      </div>

      {/* Printable / Exportable Pass Card Preview */}
      <div 
        id="receipt-card" 
        className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/20 via-blue-500/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Header Branding */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-dark.png" 
              alt="APEX Logo" 
              className="h-11 w-auto object-contain"
            />
            <div>
              <h4 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400 bg-clip-text text-transparent">
                APEX 2026 ATHLETE PASS
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Spirit of Sporting Excellence
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
              {receipt.status || 'PAID'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Receipt #: {receipt.receiptId}</span>
          </div>
        </div>

        {/* Prominent Unique Pass Code Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 text-center sm:text-left space-y-1">
          <span className="text-[10px] uppercase font-black text-cyan-300 tracking-wider">
            Official Unique College Pass Number
          </span>
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wider">
            {receipt.passCode}
          </div>
          <p className="text-[10px] text-slate-400">College Prefix: <span className="font-bold text-white">{college}</span></p>
        </div>

        {/* Full Dynamic Data Grid (Submitted Form Fields) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs border-b border-slate-800 pb-5">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Full Name</span>
            <span className="font-black text-white text-sm flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-cyan-400" /> {participantName}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Father / Mother Name</span>
            <span className="font-bold text-slate-200">{fatherName}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Gender & DOB</span>
            <span className="font-bold text-slate-200">{gender} • {dob}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile Number</span>
            <span className="font-bold text-slate-200 flex items-center gap-1">
              <Phone className="w-3 h-3 text-cyan-400" /> {phone}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Email Address</span>
            <span className="font-bold text-slate-200 flex items-center gap-1 truncate max-w-[200px]">
              <Mail className="w-3 h-3 text-cyan-400" /> {email}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Sport / Event</span>
            <span className="font-black text-cyan-400">{receipt.sportName}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Category / Mode</span>
            <span className="font-bold text-slate-200">{receipt.category}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">College / Institute</span>
            <span className="font-bold text-slate-200">{college}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">District / State</span>
            <span className="font-bold text-slate-200">{districtState}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Team / Squad</span>
            <span className="font-bold text-slate-200">{teamName}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration Date</span>
            <span className="font-bold text-slate-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" /> {receipt.date || '2026-07-28'}
            </span>
          </div>
        </div>

        {/* Registered players list */}
        {receipt.roster && receipt.roster.length > 0 && (
          <div className="space-y-2.5">
            <h5 className="text-xs font-black uppercase text-cyan-400">
              Registered Roster ({receipt.rosterCount || receipt.roster.length} Players)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {receipt.roster.map((player, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">#{idx + 1} {player.name}</span>
                    <span className="text-slate-400">{player.gender}</span>
                  </div>
                  <div className="text-slate-400">ID/Roll: {player.rollNo} • {player.branch}</div>
                  <div className="text-slate-400">Semester: {player.semester} • Ph: {player.phone}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment & Security Verification footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px]">Txn Reference ID</span>
            <span className="font-mono font-bold text-white">{receipt.utrNumber || 'TXN-APEX-VERIFIED'}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Verified Official Entry Pass
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-semibold text-[10px]">Fee Settled</span>
            <span className="font-bold text-emerald-400 text-base">₹{receipt.feePaid}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF Pass...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Download Pass (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> Print Pass
          </button>
        </div>

        <button
          onClick={onGoToDashboard}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition"
        >
          Go to Dashboard Passes →
        </button>
      </div>

    </div>
  );
};
