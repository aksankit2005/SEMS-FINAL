import React, { useState, useEffect } from 'react';
import { Award, Save, Download, Trophy, Plus, CheckCircle, RefreshCw, Layers, Star, Trash2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';

export const AthleticsResultManagementTab = ({ sportName = 'Athletics', sportSlug = 'athletics', user }) => {
  const { addToast } = useToast();
  const [selectedSubEvent, setSelectedSubEvent] = useState('100m Race');
  const [registrations, setRegistrations] = useState([]);
  const [resultsData, setResultsData] = useState({});

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('sems_events_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('sems_events_updated', handleUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      const regs = await coordinatorApi.getRegistrations(sportSlug);
      setRegistrations(regs || []);

      const cached = localStorage.getItem('sems_athletics_sub_results');
      if (cached) {
        try {
          setResultsData(JSON.parse(cached));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Error loading Athletics entries', err);
    }
  };

  const isTrackEvent = (evt) => evt.includes('Race') || evt.includes('100m') || evt.includes('200m') || evt.includes('400m') || evt.includes('relay');

  // Filter registrations for the selected sub-event
  const subEventEntries = registrations.filter((r) => {
    const selected = r.selectedEvents || (r.event ? [r.event] : []);
    return selected.includes(selectedSubEvent);
  });

  const currentEventResults = resultsData[selectedSubEvent] || [];

  const getAthleteResult = (athleteId, defaultName) => {
    const found = currentEventResults.find((r) => r.id === athleteId || r.name === defaultName);
    return found || { id: athleteId, name: defaultName, resultMetric: '', rank: '', remarks: '' };
  };

  const handleResultChange = (athleteId, defaultName, college, field, value) => {
    setResultsData((prev) => {
      const currentList = [...(prev[selectedSubEvent] || [])];
      const index = currentList.findIndex((r) => r.id === athleteId || r.name === defaultName);
      
      const updatedItem = index >= 0 
        ? { ...currentList[index], [field]: value }
        : { id: athleteId, name: defaultName, college: college || 'SEMS College', resultMetric: '', rank: '', remarks: '', [field]: value };

      if (index >= 0) {
        currentList[index] = updatedItem;
      } else {
        currentList.push(updatedItem);
      }

      const nextObj = { ...prev, [selectedSubEvent]: currentList };
      localStorage.setItem('sems_athletics_sub_results', JSON.stringify(nextObj));
      return nextObj;
    });
  };

  const handlePublishSubEventResults = () => {
    const entries = resultsData[selectedSubEvent] || [];
    if (entries.length === 0) {
      addToast(`Please enter results for at least 1 participant in ${selectedSubEvent}`, 'info');
      return;
    }

    const goldWinner = entries.find((e) => e.rank === '1st Gold' || e.rank === 'Gold')?.name || entries[0]?.name || 'TBD';
    const silverWinner = entries.find((e) => e.rank === '2nd Silver' || e.rank === 'Silver')?.name || 'TBD';
    const bronzeWinner = entries.find((e) => e.rank === '3rd Bronze' || e.rank === 'Bronze')?.name || 'TBD';

    const completedObj = {
      id: `RES-ATH-${selectedSubEvent.replace(/[^a-zA-Z0-9]/g, '')}`,
      sport: 'Athletics',
      sportName: 'Athletics',
      event: `Athletics ${selectedSubEvent} Championship`,
      eventTitle: `Athletics ${selectedSubEvent} Championship`,
      subEvent: selectedSubEvent,
      winner: goldWinner,
      scoreSummary: `1st: ${goldWinner} (${entries[0]?.resultMetric || '-'}), 2nd: ${silverWinner}, 3rd: ${bronzeWinner}`,
      date: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
      mvp: `${goldWinner} (Gold Medalist)`,
      medals: {
        gold: goldWinner,
        silver: silverWinner,
        bronze: bronzeWinner,
      },
      entries: entries,
    };

    // Save to completed results for ResultsPage
    const cacheKey = `sems_completed_results_${sportSlug}`;
    const existingStr = localStorage.getItem(cacheKey);
    let list = existingStr ? JSON.parse(existingStr) : [];
    list = list.filter((item) => item.subEvent !== selectedSubEvent && item.id !== completedObj.id);
    list.unshift(completedObj);
    localStorage.setItem(cacheKey, JSON.stringify(list));

    window.dispatchEvent(new Event('storage'));
    addToast(`🏆 ${selectedSubEvent} Results Published Successfully!`, 'success');
  };

  const handleExportPDF = () => {
    const entries = resultsData[selectedSubEvent] || [];
    const gold = entries.find((e) => e.rank === '1st Gold' || e.rank === 'Gold')?.name || 'TBD';
    const silver = entries.find((e) => e.rank === '2nd Silver' || e.rank === 'Silver')?.name || 'TBD';
    const bronze = entries.find((e) => e.rank === '3rd Bronze' || e.rank === 'Bronze')?.name || 'TBD';

    const pdfData = {
      id: `ATH-${selectedSubEvent.replace(/[^a-zA-Z0-9]/g, '')}`,
      matchTitle: `Athletics - ${selectedSubEvent}`,
      sportName: 'Athletics',
      eventTitle: `${selectedSubEvent} Final Meet`,
      winner: gold,
      team1: `Gold: ${gold}`,
      team2: `Silver: ${silver}`,
      scoreSummary: `Gold: ${gold} | Silver: ${silver} | Bronze: ${bronze}`,
      tableNumber: 'Main Stadium Track',
      completedAt: new Date().toISOString(),
      entries: entries,
    };

    generateMatchResultPDF(pdfData, 'Athletics');
    addToast(`📄 ${selectedSubEvent} PDF Score Sheet Downloaded!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            OFFICIAL ATHLETICS MEET CONSOLE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Manual Result & Medal Entry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select sub-event, manually input participant times or distances, assign medals, and publish live results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Export Event PDF
          </button>

          <button
            type="button"
            onClick={handlePublishSubEventResults}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" /> Publish {selectedSubEvent} Results
          </button>
        </div>
      </div>

      {/* SUB-EVENT SELECTOR GRID (EXACT 7 SUB-EVENTS) */}
      <div className="bg-white dark:bg-[#0B1120] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
        <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Select Athletics Game / Sub-Event:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {OFFICIAL_ATHLETICS_EVENTS.map((evt) => {
            const isSelected = selectedSubEvent === evt;
            return (
              <button
                key={evt}
                type="button"
                onClick={() => setSelectedSubEvent(evt)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white font-black shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                }`}
              >
                {evt}
              </button>
            );
          })}
        </div>
      </div>

      {/* MANUAL ENTRY TABLE FOR SELECTED SUB-EVENT */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              {selectedSubEvent} — Entries & Manual Results
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Metric Unit: {isTrackEvent(selectedSubEvent) ? 'Time in Seconds (e.g. 10.45s)' : 'Distance in Meters (e.g. 7.85m)'}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold border border-blue-500/20 self-start sm:self-auto">
            {subEventEntries.length} Registered Participant(s)
          </span>
        </div>

        {subEventEntries.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🏃‍♂️
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No registrations found for "{selectedSubEvent}"</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Participants registered for {selectedSubEvent} on the registration page will automatically appear here for manual score entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Participant / Team Name</th>
                  <th className="py-3 px-3">College / Dept</th>
                  <th className="py-3 px-3">Mobile / Email</th>
                  <th className="py-3 px-3 min-w-[160px]">
                    Result ({isTrackEvent(selectedSubEvent) ? 'Time' : 'Distance'})
                  </th>
                  <th className="py-3 px-3 min-w-[140px]">Medal / Rank</th>
                  <th className="py-3 px-3 min-w-[160px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                {subEventEntries.map((entry, idx) => {
                  const athleteId = entry.id || `ATH-REG-${idx}`;
                  const defaultName = entry.captainName || (entry.roster && entry.roster[0]?.name) || `Athlete ${idx + 1}`;
                  const college = entry.collegeName || entry.college || 'SEMS Institution';
                  const phone = entry.captainPhone || (entry.roster && entry.roster[0]?.phone) || '-';

                  const resObj = getAthleteResult(athleteId, defaultName);

                  return (
                    <tr key={athleteId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>

                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {defaultName}
                        {entry.selectedEvents?.includes('4*100m relay Race') && (
                          <span className="block text-[10px] text-blue-500 font-mono font-normal">
                            Relay Team (4 Members)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">{college}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{phone}</td>

                      {/* Result Metric Input (Time or Distance) */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={resObj.resultMetric || ''}
                          onChange={(e) => handleResultChange(athleteId, defaultName, college, 'resultMetric', e.target.value)}
                          placeholder={isTrackEvent(selectedSubEvent) ? 'e.g. 10.45s' : 'e.g. 7.85m'}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      {/* Rank / Medal Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={resObj.rank || ''}
                          onChange={(e) => handleResultChange(athleteId, defaultName, college, 'rank', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select Rank</option>
                          <option value="1st Gold">🥇 1st (Gold Medal)</option>
                          <option value="2nd Silver">🥈 2nd (Silver Medal)</option>
                          <option value="3rd Bronze">🥉 3rd (Bronze Medal)</option>
                          <option value="Finalist">Finalist</option>
                          <option value="Participant">Participant</option>
                          <option value="DNS / DNF">DNS / DNF</option>
                        </select>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={resObj.remarks || ''}
                          onChange={(e) => handleResultChange(athleteId, defaultName, college, 'remarks', e.target.value)}
                          placeholder="e.g. New Meet Record"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
