import React from 'react';
import { Printer, Download, CheckCircle2 } from 'lucide-react';

export const RegistrationReceipt = ({ receipt, onGoToDashboard }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const rosterLines = receipt.roster
      .map((p, i) => `  ${i + 1}. Name: ${p.name} | Roll No: ${p.rollNo} | Course: ${p.branch} | Semester: ${p.semester} | Ph: ${p.phone}`)
      .join('\n');

    const content = `=====================================================
               SEMS 2026 OFFICIAL PASS
=====================================================
Receipt ID         : ${receipt.receiptId}
Pass Code          : ${receipt.passCode}
Registration Date  : ${receipt.date}
Payment Status     : ${receipt.status}
-----------------------------------------------------
Sport Event        : ${receipt.sportName}
Category / Mode    : ${receipt.category}
College            : ${receipt.college}
${receipt.teamName ? `Team Name          : ${receipt.teamName}` : ''}
Lead Registrant    : ${receipt.participantName}
Contact Phone      : ${receipt.phone}
Contact Email      : ${receipt.email}
-----------------------------------------------------
Transaction ID     : ${receipt.utrNumber}
Entry Fee Paid     : INR ${receipt.feePaid}
-----------------------------------------------------
Registered Roster (${receipt.rosterCount} Players):
${rosterLines}
=====================================================
  Please present this pass at the arena check-in counter.
=====================================================`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${receipt.receiptId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
      
      {/* Success banner */}
      <div className="text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
        <h3 className="text-2xl font-black">Registration Confirmed!</h3>
        <p className="text-xs">Your official entry pass has been generated successfully.</p>
      </div>

      {/* Receipt Card */}
      <div id="receipt-card" className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-6 shadow-2xl relative overflow-hidden transition-colors duration-200">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              SEMS 2026 OFFICIAL RECEIPT
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Receipt #: {receipt.receiptId}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow">
            {receipt.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Sport Event</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{receipt.sportName}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">College / University</span>
            <span className="font-bold text-slate-850 dark:text-slate-250">{receipt.college}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Lead Captain</span>
            <span className="font-bold text-slate-850 dark:text-slate-250">{receipt.participantName}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Pass Code</span>
            <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{receipt.passCode}</span>
          </div>
        </div>

        {/* Team name block */}
        {receipt.teamName && (
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Team Name</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{receipt.teamName}</span>
          </div>
        )}

        {/* Event Category details */}
        <div className="text-xs">
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Category / Type</span>
          <span className="font-bold text-slate-900 dark:text-white">{receipt.category}</span>
        </div>

        {/* Registered players list */}
        <div className="space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h5 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Registered Roster ({receipt.rosterCount} Players)</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
            {receipt.roster.map((player, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-[10px] space-y-0.5 transition-colors">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-850 dark:text-slate-200">#{idx + 1} {player.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{player.gender}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">ID: {player.rollNo} • {player.branch}</div>
                <div className="text-slate-500 dark:text-slate-400">Year/Semester: {player.semester}</div>
                <div className="text-slate-500 dark:text-slate-400">Ph: {player.phone} • {player.email}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment reference */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Txn Reference ID</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{receipt.utrNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Fee Settled</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{receipt.feePaid}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap justify-between gap-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-750 font-bold text-xs flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" /> Print Pass
          </button>
          <button
            onClick={handleDownloadTxt}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-750 font-bold text-xs flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Download Pass (.txt)
          </button>
        </div>

        <button
          onClick={onGoToDashboard}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition"
        >
          Go to Dashboard Passes
        </button>
      </div>

    </div>
  );
};
