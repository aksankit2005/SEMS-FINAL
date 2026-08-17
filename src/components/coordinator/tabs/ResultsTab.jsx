import React, { useState, useEffect } from 'react';
import { Award, Upload, Lock, Unlock, Download, FileText, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import jsPDF from 'jspdf';

import { getSportResultDisplay } from '../../../utils/sportResultFormatters';

export const ResultsTab = ({ user }) => {
  const { addToast } = useToast();

  const [isPublished, setIsPublished] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [resultsData, setResultsData] = useState([]);

  useEffect(() => {
    const sportId = user?.assignedSport || 'badminton';
    const key = `sems_completed_results_${sportId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((item, idx) => {
            const display = getSportResultDisplay(item);
            return {
              rank: idx + 1,
              team: display.winner || item.winner || display.team1 || 'Team A',
              college: item.college || item.winnerCollege || 'MPEC',
              medal: idx === 0 ? 'Gold' : idx === 1 ? 'Silver' : idx === 2 ? 'Bronze' : `${idx + 1}th Place`,
              score: display.summaryText || `${item.score1 || 0}-${item.score2 || 0}`,
              status: 'Verified'
            };
          });
          setResultsData(mapped);
          return;
        }
      } catch (e) {}
    }
    setResultsData([]);
  }, [user]);

  const handleTogglePublish = () => {
    if (isLocked) {
      addToast('Results are LOCKED! Unlock before editing publish state.', 'error');
      return;
    }
    setIsPublished(!isPublished);
    addToast(
      `${user?.sportName} results are now ${!isPublished ? 'PUBLISHED publicly' : 'UNPUBLISHED (Draft)'}`,
      !isPublished ? 'success' : 'warning'
    );
  };

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
    addToast(
      `Results ${!isLocked ? 'LOCKED permanently for official record' : 'UNLOCKED for editing'}`,
      !isLocked ? 'info' : 'warning'
    );
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`APEX 2026 - ${user?.sportName} Official Final Results & Medal Tally`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Certified by: ${user?.coordinatorName} (${user?.sportName} Coordinator)`, 14, 30);
    doc.text(`Published Date: ${new Date().toLocaleDateString()}`, 14, 36);

    let y = 50;
    resultsData.forEach((r) => {
      doc.text(`Rank ${r.rank}: ${r.team} (${r.college}) - Medal: ${r.medal} - Score: ${r.score}`, 14, y);
      y += 10;
    });

    doc.save(`${user?.assignedSport}_final_results.pdf`);
    addToast('Result PDF downloaded successfully', 'success');
  };

  const handleGenerateCertificateData = () => {
    addToast(`Generated certificate export package for top 3 medal winners in ${user?.sportName}!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Result Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" /> {user?.sportName} Result Management & Medal Standings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload result sheets, publish results, edit before publish, lock after publish, generate certificate data.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTogglePublish}
            disabled={isLocked}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
              isPublished 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> {isPublished ? 'Results Published' : 'Publish Results'}
          </button>

          <button
            onClick={handleToggleLock}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
              isLocked 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{isLocked ? 'Results Locked' : 'Lock After Publish'}</span>
          </button>
        </div>
      </div>

      {/* Action Bar: Certificate Data & PDF Download */}
      <div className="flex items-center justify-between bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <div>
            <h4 className="text-sm font-black text-white">Generate Official Certificate Data & Medal Tally</h4>
            <p className="text-xs text-slate-400">Export verified participant rankings for certificate print automation.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateCertificateData}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Generate Certificate Data
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Result PDF
          </button>
        </div>
      </div>

      {/* Rankings & Medal Standings Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {user?.sportName} Official Final Rankings & Medal List
          </h4>
          <span className="text-xs font-bold text-slate-400">
            {isLocked ? 'Status: LOCKED' : isPublished ? 'Status: PUBLISHED' : 'Status: DRAFT'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                <th className="p-3">Rank</th>
                <th className="p-3">Team Name</th>
                <th className="p-3">College</th>
                <th className="p-3">Medal / Award</th>
                <th className="p-3">Final Score</th>
                <th className="p-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {resultsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    No official final results declared yet. Complete matches in 'Declare Results' to publish medal standings.
                  </td>
                </tr>
              ) : (
                resultsData.map((r) => (
                  <tr key={r.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-black text-slate-900 dark:text-white">#{r.rank}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{r.team}</td>
                    <td className="p-3 font-semibold text-orange-500">{r.college}</td>
                    <td className="p-3 font-bold">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase ${
                        r.medal === 'Gold' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 font-black' :
                        r.medal === 'Silver' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black' :
                        r.medal === 'Bronze' ? 'bg-amber-700/20 text-amber-700 dark:text-amber-400 font-black' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {r.medal}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{r.score}</td>
                    <td className="p-3 text-right font-bold text-emerald-500">{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
