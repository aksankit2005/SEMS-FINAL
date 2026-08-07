import React from 'react';
import { X, Download, Trophy, Shield, UserCheck, FileText } from 'lucide-react';
import { generateMatchResultPDF, exportToCSV } from '../../../utils/pdfExporter';
import { useToast } from '../../../context/ToastContext';

export const CricketScorecardModal = ({ match, onClose }) => {
  const { addToast } = useToast();

  const team1Name = match?.team1 || match?.teamA?.name || 'Team A';
  const team2Name = match?.team2 || match?.teamB?.name || 'Team B';

  const innings1 = match?.innings1 || {};
  const innings2 = match?.innings2 || {};

  const buildCompleteBattingCard = (rawCard = [], striker = null, nonStriker = null) => {
    const list = [...(rawCard || [])];
    if (striker && striker.name) {
      const existingIndex = list.findIndex((b) => b.name === striker.name);
      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          runs: striker.runs || 0,
          balls: striker.balls || 0,
          fours: striker.fours || 0,
          sixes: striker.sixes || 0,
          dismissal: list[existingIndex].dismissal || 'not out',
        };
      } else {
        list.push({
          name: striker.name,
          runs: striker.runs || 0,
          balls: striker.balls || 0,
          fours: striker.fours || 0,
          sixes: striker.sixes || 0,
          dismissal: 'not out',
        });
      }
    }

    if (nonStriker && nonStriker.name) {
      const existingIndex = list.findIndex((b) => b.name === nonStriker.name);
      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          runs: nonStriker.runs || 0,
          balls: nonStriker.balls || 0,
          fours: nonStriker.fours || 0,
          sixes: nonStriker.sixes || 0,
          dismissal: list[existingIndex].dismissal || 'not out',
        };
      } else {
        list.push({
          name: nonStriker.name,
          runs: nonStriker.runs || 0,
          balls: nonStriker.balls || 0,
          fours: nonStriker.fours || 0,
          sixes: nonStriker.sixes || 0,
          dismissal: 'not out',
        });
      }
    }

    return list;
  };

  const buildCompleteBowlingCard = (rawCard = [], currentBowler = null) => {
    const list = [...(rawCard || [])];
    if (currentBowler && currentBowler.name) {
      const existingIndex = list.findIndex((b) => b.name === currentBowler.name);
      const bOvers = currentBowler.overs || (currentBowler.legalBalls ? `${Math.floor(currentBowler.legalBalls / 6)}.${currentBowler.legalBalls % 6}` : '0.0');

      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          overs: bOvers,
          maidens: currentBowler.maidens || list[existingIndex].maidens || 0,
          runs: currentBowler.runs || 0,
          wickets: currentBowler.wickets || 0,
        };
      } else {
        list.push({
          name: currentBowler.name,
          overs: bOvers,
          maidens: currentBowler.maidens || 0,
          runs: currentBowler.runs || 0,
          wickets: currentBowler.wickets || 0,
        });
      }
    }
    return list;
  };

  const currentInnNum = match?.currentInnings || 1;

  const rawBattingCard1 = innings1.battingStats || match?.battingCard1 || [];
  const rawBowlingCard1 = innings1.bowlingStats || match?.bowlingCard1 || [];

  const rawBattingCard2 = innings2.battingStats || match?.battingCard2 || [];
  const rawBowlingCard2 = innings2.bowlingStats || match?.bowlingCard2 || [];

  const battingCard1 = buildCompleteBattingCard(
    rawBattingCard1,
    currentInnNum === 1 ? match?.striker : null,
    currentInnNum === 1 ? match?.nonStriker : null
  );
  const bowlingCard1 = buildCompleteBowlingCard(
    rawBowlingCard1,
    currentInnNum === 1 ? match?.bowler : null
  );

  const battingCard2 = buildCompleteBattingCard(
    rawBattingCard2,
    currentInnNum === 2 ? match?.striker : null,
    currentInnNum === 2 ? match?.nonStriker : null
  );
  const bowlingCard2 = buildCompleteBowlingCard(
    rawBowlingCard2,
    currentInnNum === 2 ? match?.bowler : null
  );

  const manOfTheMatch = match?.manOfTheMatch || match?.winner || 'To Be Announced';

  const handleExportPDF = () => {
    generateMatchResultPDF(match, 'Cricket');
    addToast('Downloaded Cricket Official Match Scorecard PDF', 'success');
  };

  const handleExportCSV = () => {
    const csvData = [
      { Section: 'Match', Info: `${match?.eventTitle || 'Cricket Match'} - ${team1Name} vs ${team2Name}` },
      { Section: 'Result', Info: match?.resultString || match?.winner || 'Completed' },
      { Section: 'Man of the Match', Info: manOfTheMatch },
    ];
    exportToCSV(csvData, `Cricket_Scorecard_${match?.id || 'Match'}`);
    addToast('Exported Cricket Scorecard as CSV', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              Cricket Official Match Scorecard
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {match?.eventTitle || `${team1Name} vs ${team2Name}`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Result Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">Match Status & Result</span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">
              🏆 {match?.resultString || match?.winner || 'Match Completed'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Player of Match: <strong className="text-amber-500">{manOfTheMatch}</strong>
            </span>
          </div>
        </div>

        {/* Scorecard Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
          
          {/* Innings 1 Scorecard */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              1st Innings — {team1Name} ({innings1.runs || match?.score1 || 0}/{innings1.wickets || match?.wickets1 || 0} in {innings1.overs || match?.overs1 || '0.0'} Overs)
            </h3>

            {/* Batting Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Batter</th>
                    <th className="p-3">Dismissal</th>
                    <th className="p-3 text-right">R</th>
                    <th className="p-3 text-right">B</th>
                    <th className="p-3 text-right">4s</th>
                    <th className="p-3 text-right">6s</th>
                    <th className="p-3 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {battingCard1.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-slate-400 text-xs">No batting data recorded</td>
                    </tr>
                  ) : (
                    battingCard1.map((b, idx) => {
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{b.name}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{b.dismissal || 'not out'}</td>
                          <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">{b.runs}</td>
                          <td className="p-3 text-right font-mono">{b.balls}</td>
                          <td className="p-3 text-right font-mono">{b.fours || 0}</td>
                          <td className="p-3 text-right font-mono">{b.sixes || 0}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{sr}</td>
                        </tr>
                      );
                    })
                  )}
                  {/* Extras Row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    <td colSpan="2" className="p-3 font-bold text-slate-700 dark:text-slate-300">Extras</td>
                    <td colSpan="5" className="p-3 text-right font-bold">
                      {(match?.extras1?.total || match?.extras?.total || 0)} (b {match?.extras1?.byes || match?.extras?.byes || 0}, lb {match?.extras1?.legByes || match?.extras?.legByes || 0}, w {match?.extras1?.wides || match?.extras?.wides || 0}, nb {match?.extras1?.noBalls || match?.extras?.noBalls || 0})
                    </td>
                  </tr>
                  {/* Total Row */}
                  <tr className="bg-emerald-500/10 dark:bg-emerald-500/20 font-black text-emerald-600 dark:text-emerald-400">
                    <td colSpan="2" className="p-3">TOTAL SCORE</td>
                    <td colSpan="5" className="p-3 text-right font-mono text-sm">
                      {innings1.runs || match?.score1 || 0}/{innings1.wickets || match?.wickets1 || 0} ({innings1.overs || match?.overs1 || '0.0'} Overs)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bowling Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Bowler</th>
                    <th className="p-3 text-right">Overs</th>
                    <th className="p-3 text-right">M</th>
                    <th className="p-3 text-right">R</th>
                    <th className="p-3 text-right">W</th>
                    <th className="p-3 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {bowlingCard1.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-slate-400 text-xs">No bowling data recorded</td>
                    </tr>
                  ) : (
                    bowlingCard1.map((bw, idx) => {
                      const parseBalls = (ov) => {
                        if (typeof ov === 'number') return Math.round(ov * 6);
                        if (!ov || typeof ov !== 'string') return 0;
                        const p = ov.split('.');
                        return (parseInt(p[0], 10) || 0) * 6 + (parseInt(p[1], 10) || 0);
                      };
                      const balls = parseBalls(bw.overs);
                      const econ = balls > 0 ? (bw.runs / (balls / 6)).toFixed(2) : '0.00';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{bw.name}</td>
                          <td className="p-3 text-right font-mono">{bw.overs}</td>
                          <td className="p-3 text-right font-mono">{bw.maidens || 0}</td>
                          <td className="p-3 text-right font-mono">{bw.runs}</td>
                          <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{econ}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Innings 2 Scorecard (if available) */}
          {(battingCard2.length > 0 || innings2.runs !== undefined) && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase text-green-600 dark:text-green-400 tracking-wider">
                2nd Innings — {team2Name} ({innings2.runs || match?.score2 || 0}/{innings2.wickets || match?.wickets2 || 0} in {innings2.overs || match?.overs2 || '0.0'} Overs)
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Batter</th>
                      <th className="p-3">Dismissal</th>
                      <th className="p-3 text-right">R</th>
                      <th className="p-3 text-right">B</th>
                      <th className="p-3 text-right">4s</th>
                      <th className="p-3 text-right">6s</th>
                      <th className="p-3 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {battingCard2.map((b, idx) => {
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{b.name}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{b.dismissal || 'not out'}</td>
                          <td className="p-3 text-right font-black text-green-600 dark:text-green-400">{b.runs}</td>
                          <td className="p-3 text-right font-mono">{b.balls}</td>
                          <td className="p-3 text-right font-mono">{b.fours || 0}</td>
                          <td className="p-3 text-right font-mono">{b.sixes || 0}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{sr}</td>
                        </tr>
                      );
                    })}
                    {/* Extras Row */}
                    <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      <td colSpan="2" className="p-3 font-bold text-slate-700 dark:text-slate-300">Extras</td>
                      <td colSpan="5" className="p-3 text-right font-bold">
                        {(match?.extras2?.total || match?.extras?.total || 0)} (b {match?.extras2?.byes || match?.extras?.byes || 0}, lb {match?.extras2?.legByes || match?.extras?.legByes || 0}, w {match?.extras2?.wides || match?.extras?.wides || 0}, nb {match?.extras2?.noBalls || match?.extras?.noBalls || 0})
                      </td>
                    </tr>
                    {/* Total Row */}
                    <tr className="bg-emerald-500/10 dark:bg-emerald-500/20 font-black text-emerald-600 dark:text-emerald-400">
                      <td colSpan="2" className="p-3">TOTAL SCORE</td>
                      <td colSpan="5" className="p-3 text-right font-mono text-sm">
                        {innings2.runs || match?.score2 || 0}/{innings2.wickets || match?.wickets2 || 0} ({innings2.overs || match?.overs2 || '0.0'} Overs)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2nd Innings Bowling Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Bowler</th>
                      <th className="p-3 text-right">Overs</th>
                      <th className="p-3 text-right">M</th>
                      <th className="p-3 text-right">R</th>
                      <th className="p-3 text-right">W</th>
                      <th className="p-3 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bowlingCard2.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-400 text-xs">No bowling data recorded</td>
                      </tr>
                    ) : (
                      bowlingCard2.map((bw, idx) => {
                        const parseBalls = (ov) => {
                          if (typeof ov === 'number') return Math.round(ov * 6);
                          if (!ov || typeof ov !== 'string') return 0;
                          const p = ov.split('.');
                          return (parseInt(p[0], 10) || 0) * 6 + (parseInt(p[1], 10) || 0);
                        };
                        const balls = parseBalls(bw.overs);
                        const econ = balls > 0 ? (bw.runs / (balls / 6)).toFixed(2) : '0.00';
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{bw.name}</td>
                            <td className="p-3 text-right font-mono">{bw.overs}</td>
                            <td className="p-3 text-right font-mono">{bw.maidens || 0}</td>
                            <td className="p-3 text-right font-mono">{bw.runs}</td>
                            <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{econ}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
