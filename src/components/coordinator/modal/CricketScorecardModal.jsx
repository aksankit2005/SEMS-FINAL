import React, { useState } from 'react';
import { X, Download, Trophy, Shield, UserCheck, FileText, Activity, Users, Award, Radio } from 'lucide-react';
import { generateMatchResultPDF, exportToCSV } from '../../../utils/pdfExporter';
import { useToast } from '../../../context/ToastContext';
import { calculateCompleteMatchState } from '../../../utils/cricketEngine';

export const CricketScorecardModal = ({ match, onClose }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('innings1');

  // Compute or extract complete match state
  const computedState = calculateCompleteMatchState(match || {});

  const details = match?.details || {};
  const team1Name = match?.team1 || match?.teamA?.name || details.team1 || 'Team A';
  const team2Name = match?.team2 || match?.teamB?.name || details.team2 || 'Team B';

  const innings1 = match?.innings1 || details.innings1 || computedState.innings1 || {};
  const innings2 = match?.innings2 || details.innings2 || computedState.innings2 || {};

  const batting1stTeam = match?.setupData?.battingTeamName || team1Name;
  const bowling1stTeam = match?.setupData?.bowlingTeamName || team2Name;

  // Innings 1 Cards
  const battingCard1 = innings1.battingStats || match?.battingCard1 || details.battingCard1 || [];
  const bowlingCard1 = innings1.bowlingStats || match?.bowlingCard1 || details.bowlingCard1 || [];
  const fallOfWickets1 = innings1.fallOfWickets || match?.fallOfWickets1 || details.fallOfWickets1 || [];
  const extras1 = innings1.extras || match?.extras1 || details.extras1 || match?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  const score1 = innings1.runs !== undefined ? innings1.runs : (match?.score1 || 0);
  const wickets1 = innings1.wickets !== undefined ? innings1.wickets : (match?.wickets1 || 0);
  const overs1 = innings1.oversFormatted || match?.overs1 || '0.0';

  // Innings 2 Cards
  const battingCard2 = innings2.battingStats || match?.battingCard2 || details.battingCard2 || [];
  const bowlingCard2 = innings2.bowlingStats || match?.bowlingCard2 || details.bowlingCard2 || [];
  const fallOfWickets2 = innings2.fallOfWickets || match?.fallOfWickets2 || details.fallOfWickets2 || [];
  const extras2 = innings2.extras || match?.extras2 || details.extras2 || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  const score2 = innings2.runs !== undefined ? innings2.runs : (match?.score2 || 0);
  const wickets2 = innings2.wickets !== undefined ? innings2.wickets : (match?.wickets2 || 0);
  const overs2 = innings2.oversFormatted || match?.overs2 || '0.0';

  // Fielding Performance across match
  const fieldingList = details.playerPerformances?.fielders || computedState.allFielding || [];

  // Commentary Feed
  const commentaryFeed = innings1.commentaryLog || match?.commentaryLog || details.commentaryLog || [];

  const resultString = match?.resultString || details.resultString || computedState.matchVerdict || match?.winner || 'Match Completed';
  const manOfTheMatch = match?.manOfTheMatch || details.mvp || details.playerOfMatch || match?.winner || 'To Be Announced';

  const handleExportPDF = () => {
    generateMatchResultPDF(match, 'Cricket');
    addToast('Downloaded Cricket Official Match Scorecard PDF', 'success');
  };

  const handleExportCSV = () => {
    const csvData = [
      { Section: 'Match', Info: `${match?.eventTitle || 'Cricket Match'} - ${team1Name} vs ${team2Name}` },
      { Section: 'Result', Info: resultString },
      { Section: 'Man of the Match', Info: manOfTheMatch },
      { Section: '1st Innings Score', Info: `${batting1stTeam}: ${score1}/${wickets1} (${overs1} ov)` },
      { Section: '2nd Innings Score', Info: `${bowling1stTeam}: ${score2}/${wickets2} (${overs2} ov)` }
    ];
    exportToCSV(csvData, `Cricket_Scorecard_${match?.id || 'Match'}`);
    addToast('Exported Cricket Scorecard as CSV', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                🏏 Official Cricket Match Record
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">#{match?.id}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
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
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
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

        {/* Result & Teams Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
              Match Status & Official Result
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">
              🏆 {resultString}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span>{batting1stTeam}: <strong className="text-slate-900 dark:text-white">{score1}/{wickets1}</strong> ({overs1} ov)</span>
              <span>•</span>
              <span>{bowling1stTeam}: <strong className="text-slate-900 dark:text-white">{score2}/{wickets2}</strong> ({overs2} ov)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Player of Match: <strong className="text-amber-500">{manOfTheMatch}</strong>
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('innings1')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'innings1'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🏏 1st Innings ({batting1stTeam})
          </button>

          <button
            onClick={() => setActiveTab('innings2')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'innings2'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🏏 2nd Innings ({bowling1stTeam})
          </button>

          <button
            onClick={() => setActiveTab('fielding')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fielding'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🧤 Fielding Performance
          </button>

          <button
            onClick={() => setActiveTab('commentary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'commentary'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🎙️ Commentary Feed
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
          
          {/* TAB 1: 1ST INNINGS SCORECARD */}
          {activeTab === 'innings1' && (
            <div className="space-y-6">
              
              {/* Batting Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Batting Card — {batting1stTeam} ({score1}/{wickets1} in {overs1} Overs)
                  </h4>
                </div>

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
                          <td colSpan="7" className="p-4 text-center text-slate-400 text-xs font-mono">No batting statistics recorded</td>
                        </tr>
                      ) : (
                        battingCard1.map((b, idx) => {
                          const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00';
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{b.name}</span>
                                {b.dismissal === 'not out' && <span className="text-emerald-500 font-bold">*</span>}
                              </td>
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
                      <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        <td colSpan="2" className="p-3 font-bold">Extras</td>
                        <td colSpan="5" className="p-3 text-right font-bold">
                          {extras1.total || 0} (b {extras1.byes || 0}, lb {extras1.legByes || 0}, w {extras1.wides || 0}, nb {extras1.noBalls || 0}, pen {extras1.penalty || 0})
                        </td>
                      </tr>
                      {/* Total Score Row */}
                      <tr className="bg-emerald-500/10 dark:bg-emerald-500/20 font-black text-emerald-600 dark:text-emerald-400">
                        <td colSpan="2" className="p-3 font-bold">TOTAL SCORE</td>
                        <td colSpan="5" className="p-3 text-right font-mono text-sm">
                          {score1}/{wickets1} ({overs1} Overs)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Bowling Card — {bowling1stTeam} Bowlers
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Bowler</th>
                        <th className="p-3 text-right">O</th>
                        <th className="p-3 text-right">M</th>
                        <th className="p-3 text-right">R</th>
                        <th className="p-3 text-right">W</th>
                        <th className="p-3 text-right">Econ</th>
                        <th className="p-3 text-right">WD</th>
                        <th className="p-3 text-right">NB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {bowlingCard1.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-4 text-center text-slate-400 text-xs font-mono">No bowling statistics recorded</td>
                        </tr>
                      ) : (
                        bowlingCard1.map((bw, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{bw.name}</td>
                            <td className="p-3 text-right font-mono">{bw.overs}</td>
                            <td className="p-3 text-right font-mono">{bw.maidens || 0}</td>
                            <td className="p-3 text-right font-mono">{bw.runs}</td>
                            <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{bw.economy || '0.00'}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{bw.wides || 0}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{bw.noBalls || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fall of Wickets */}
              {fallOfWickets1.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Fall of Wickets — {batting1stTeam}
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono flex flex-wrap gap-3">
                    {fallOfWickets1.map((fow, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <strong className="text-rose-500">{fow.score}/{fow.wicketNumber}</strong> ({fow.dismissedPlayer}, {fow.overs} ov)
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: 2ND INNINGS SCORECARD */}
          {activeTab === 'innings2' && (
            <div className="space-y-6">
              
              {/* Batting Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Batting Card — {bowling1stTeam} ({score2}/{wickets2} in {overs2} Overs)
                  </h4>
                </div>

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
                      {battingCard2.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-4 text-center text-slate-400 text-xs font-mono">
                            2nd innings has not been played or recorded yet
                          </td>
                        </tr>
                      ) : (
                        battingCard2.map((b, idx) => {
                          const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00';
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{b.name}</span>
                                {b.dismissal === 'not out' && <span className="text-emerald-500 font-bold">*</span>}
                              </td>
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
                      <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        <td colSpan="2" className="p-3 font-bold">Extras</td>
                        <td colSpan="5" className="p-3 text-right font-bold">
                          {extras2.total || 0} (b {extras2.byes || 0}, lb {extras2.legByes || 0}, w {extras2.wides || 0}, nb {extras2.noBalls || 0}, pen {extras2.penalty || 0})
                        </td>
                      </tr>
                      {/* Total Score Row */}
                      <tr className="bg-emerald-500/10 dark:bg-emerald-500/20 font-black text-emerald-600 dark:text-emerald-400">
                        <td colSpan="2" className="p-3 font-bold">TOTAL SCORE</td>
                        <td colSpan="5" className="p-3 text-right font-mono text-sm">
                          {score2}/{wickets2} ({overs2} Overs)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                  Bowling Card — {batting1stTeam} Bowlers
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Bowler</th>
                        <th className="p-3 text-right">O</th>
                        <th className="p-3 text-right">M</th>
                        <th className="p-3 text-right">R</th>
                        <th className="p-3 text-right">W</th>
                        <th className="p-3 text-right">Econ</th>
                        <th className="p-3 text-right">WD</th>
                        <th className="p-3 text-right">NB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {bowlingCard2.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-4 text-center text-slate-400 text-xs font-mono">No bowling statistics recorded</td>
                        </tr>
                      ) : (
                        bowlingCard2.map((bw, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{bw.name}</td>
                            <td className="p-3 text-right font-mono">{bw.overs}</td>
                            <td className="p-3 text-right font-mono">{bw.maidens || 0}</td>
                            <td className="p-3 text-right font-mono">{bw.runs}</td>
                            <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400">{bw.wickets}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{bw.economy || '0.00'}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{bw.wides || 0}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{bw.noBalls || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fall of Wickets */}
              {fallOfWickets2.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Fall of Wickets — {bowling1stTeam}
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono flex flex-wrap gap-3">
                    {fallOfWickets2.map((fow, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <strong className="text-rose-500">{fow.score}/{fow.wicketNumber}</strong> ({fow.dismissedPlayer}, {fow.overs} ov)
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: FIELDING PERFORMANCE */}
          {activeTab === 'fielding' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Fielding Contributions (Catches, Run Outs, Stumpings)
                </h4>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Player / Fielder</th>
                      <th className="p-3 text-right">Catches</th>
                      <th className="p-3 text-right">Run Outs</th>
                      <th className="p-3 text-right">Stumpings</th>
                      <th className="p-3 text-right">Total Dismissals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {fieldingList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-400 text-xs">
                          No fielding dismissals (catches, run outs or stumpings) recorded in this match.
                        </td>
                      </tr>
                    ) : (
                      fieldingList.map((f, idx) => {
                        const total = (f.catches || 0) + (f.runOuts || 0) + (f.stumpings || 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                              <span>🧤 {f.name}</span>
                            </td>
                            <td className="p-3 text-right font-bold text-blue-600 dark:text-cyan-400">{f.catches || 0}</td>
                            <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">{f.runOuts || 0}</td>
                            <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400">{f.stumpings || 0}</td>
                            <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">{total}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMMENTARY FEED */}
          {activeTab === 'commentary' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Ball-by-Ball Match Delivery Timeline
              </h4>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {commentaryFeed.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono p-4">No ball-by-ball commentary recorded.</p>
                ) : (
                  commentaryFeed.map((c, i) => (
                    <div key={c.id || i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold shrink-0">
                        Over {c.over}
                      </span>
                      <div className="space-y-0.5 flex-1">
                        <p className="text-slate-900 dark:text-white font-medium leading-relaxed">{c.text}</p>
                        {c.badge && (
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            Delivery Event: {c.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
