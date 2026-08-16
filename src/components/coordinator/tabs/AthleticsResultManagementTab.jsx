import React, { useState, useEffect } from 'react';
import { Award, Save, Download, Trophy, Plus, CheckCircle, RefreshCw, Layers, Star, Trash2, X, Check, Edit } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { coordinatorApi } from '../../../services/coordinatorApi';
import { generateMatchResultPDF } from '../../../utils/pdfExporter';
import { exportResultsToExcel } from '../../../utils/excelExporter';
import { OFFICIAL_ATHLETICS_EVENTS } from '../../registration/AthleticsRegistration';

export const AthleticsResultManagementTab = ({ sportName = 'Athletics', sportSlug = 'athletics', user }) => {
  const { addToast } = useToast();
  const [selectedSubEvent, setSelectedSubEvent] = useState('100m Race');
  const [registrations, setRegistrations] = useState([]);
  const [resultsData, setResultsData] = useState({});
  const [showDeclareModal, setShowDeclareModal] = useState(false);

  // Manual extra athletes added by coordinator
  const [manualAthletes, setManualAthletes] = useState({});

  // Declare Winners Modal Form State with manual Name & College inputs
  const [goldId, setGoldId] = useState('');
  const [goldName, setGoldName] = useState('');
  const [goldCollege, setGoldCollege] = useState('');
  const [goldMetric, setGoldMetric] = useState('');

  const [silverId, setSilverId] = useState('');
  const [silverName, setSilverName] = useState('');
  const [silverCollege, setSilverCollege] = useState('');
  const [silverMetric, setSilverMetric] = useState('');

  const [bronzeId, setBronzeId] = useState('');
  const [bronzeName, setBronzeName] = useState('');
  const [bronzeCollege, setBronzeCollege] = useState('');
  const [bronzeMetric, setBronzeMetric] = useState('');

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

      const cachedManual = localStorage.getItem('sems_athletics_manual_entries');
      if (cachedManual) {
        try {
          setManualAthletes(JSON.parse(cachedManual));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Error loading Athletics entries', err);
    }
  };

  const isTrackEvent = (evt) => evt.includes('Race') || evt.includes('100m') || evt.includes('200m') || evt.includes('400m') || evt.includes('relay');

  // Filter registrations for the selected sub-event
  const registeredEntries = registrations.filter((r) => {
    const selected = r.selectedEvents || (r.event ? [r.event] : []);
    return selected.includes(selectedSubEvent);
  });

  const manualEntries = manualAthletes[selectedSubEvent] || [];
  const subEventEntries = [...registeredEntries, ...manualEntries];

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

  const handleAddManualAthlete = () => {
    const newAthlete = {
      id: `ATH-MANUAL-${Date.now()}`,
      captainName: 'New Athlete',
      collegeName: 'SEMS Institution',
      captainPhone: '-',
      selectedEvents: [selectedSubEvent],
      isManual: true,
    };

    setManualAthletes((prev) => {
      const currentList = prev[selectedSubEvent] || [];
      const updated = { ...prev, [selectedSubEvent]: [...currentList, newAthlete] };
      localStorage.setItem('sems_athletics_manual_entries', JSON.stringify(updated));
      return updated;
    });
    addToast(`New athlete entry added to ${selectedSubEvent}`, 'info');
  };

  const handleDeleteAthleteEntry = (athleteId, athleteName) => {
    if (!window.confirm(`Are you sure you want to delete the athlete entry "${athleteName}"?`)) return;

    // Remove from resultsData
    setResultsData((prev) => {
      const currentList = prev[selectedSubEvent] || [];
      const nextList = currentList.filter((r) => r.id !== athleteId && r.name !== athleteName);
      const nextObj = { ...prev, [selectedSubEvent]: nextList };
      localStorage.setItem('sems_athletics_sub_results', JSON.stringify(nextObj));
      return nextObj;
    });

    // Remove from manualAthletes if manual
    setManualAthletes((prev) => {
      const currentList = prev[selectedSubEvent] || [];
      const nextList = currentList.filter((r) => r.id !== athleteId && (r.captainName || r.name) !== athleteName);
      const nextObj = { ...prev, [selectedSubEvent]: nextList };
      localStorage.setItem('sems_athletics_manual_entries', JSON.stringify(nextObj));
      return nextObj;
    });

    addToast(`Athlete entry "${athleteName}" deleted successfully!`, 'info');
  };

  const handleDeleteDeclaredWinners = () => {
    if (!window.confirm(`Are you sure you want to delete/reset the declared winners for ${selectedSubEvent}?`)) return;

    const nextResults = { ...resultsData };
    delete nextResults[selectedSubEvent];
    setResultsData(nextResults);
    localStorage.setItem('sems_athletics_sub_results', JSON.stringify(nextResults));

    const cacheKey = `sems_completed_results_${sportSlug}`;
    const existingStr = localStorage.getItem(cacheKey);
    if (existingStr) {
      try {
        let list = JSON.parse(existingStr);
        list = list.filter((item) => item.subEvent !== selectedSubEvent && item.id !== `RES-ATH-${selectedSubEvent.replace(/[^a-zA-Z0-9]/g, '')}`);
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch (e) {}
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('sems_results_updated'));
    addToast(`Declared winners for ${selectedSubEvent} have been reset and deleted.`, 'warning');
  };

  const handleOpenDeclareModal = () => {
    setShowDeclareModal(true);
    const goldItem = currentEventResults.find((e) => e.rank === '1st Gold' || e.rank === 'Gold');
    const silverItem = currentEventResults.find((e) => e.rank === '2nd Silver' || e.rank === 'Silver');
    const bronzeItem = currentEventResults.find((e) => e.rank === '3rd Bronze' || e.rank === 'Bronze');

    if (goldItem) {
      setGoldId(goldItem.id || goldItem.name);
      setGoldName(goldItem.name || '');
      setGoldCollege(goldItem.college || '');
      setGoldMetric(goldItem.resultMetric || '');
    } else {
      setGoldId(''); setGoldName(''); setGoldCollege(''); setGoldMetric('');
    }

    if (silverItem) {
      setSilverId(silverItem.id || silverItem.name);
      setSilverName(silverItem.name || '');
      setSilverCollege(silverItem.college || '');
      setSilverMetric(silverItem.resultMetric || '');
    } else {
      setSilverId(''); setSilverName(''); setSilverCollege(''); setSilverMetric('');
    }

    if (bronzeItem) {
      setBronzeId(bronzeItem.id || bronzeItem.name);
      setBronzeName(bronzeItem.name || '');
      setBronzeCollege(bronzeItem.college || '');
      setBronzeMetric(bronzeItem.resultMetric || '');
    } else {
      setBronzeId(''); setBronzeName(''); setBronzeCollege(''); setBronzeMetric('');
    }
  };

  const handleSelectWinner = (place, idOrName) => {
    const found = subEventEntries.find((r) => r.id === idOrName || (r.captainName || (r.roster && r.roster[0]?.name)) === idOrName);
    const name = found ? (found.captainName || (found.roster && found.roster[0]?.name) || 'Athlete') : idOrName;
    const college = found ? (found.collegeName || found.college || 'SEMS Institution') : '';

    if (place === 'gold') {
      setGoldId(idOrName);
      if (idOrName) {
        setGoldName(name);
        setGoldCollege(college);
      }
    } else if (place === 'silver') {
      setSilverId(idOrName);
      if (idOrName) {
        setSilverName(name);
        setSilverCollege(college);
      }
    } else if (place === 'bronze') {
      setBronzeId(idOrName);
      if (idOrName) {
        setBronzeName(name);
        setBronzeCollege(college);
      }
    }
  };

  const handleQuickDeclareSubmit = (e) => {
    e.preventDefault();

    const nextList = [];

    if (goldName.trim()) {
      nextList.push({
        id: goldId || `ATH-WIN-GOLD-${Date.now()}`,
        name: goldName.trim(),
        college: goldCollege.trim() || 'SEMS Institution',
        resultMetric: goldMetric,
        rank: '1st Gold',
        remarks: 'Gold Medalist'
      });
    }
    if (silverName.trim()) {
      nextList.push({
        id: silverId || `ATH-WIN-SILVER-${Date.now()}`,
        name: silverName.trim(),
        college: silverCollege.trim() || 'SEMS Institution',
        resultMetric: silverMetric,
        rank: '2nd Silver',
        remarks: 'Silver Medalist'
      });
    }
    if (bronzeName.trim()) {
      nextList.push({
        id: bronzeId || `ATH-WIN-BRONZE-${Date.now()}`,
        name: bronzeName.trim(),
        college: bronzeCollege.trim() || 'SEMS Institution',
        resultMetric: bronzeMetric,
        rank: '3rd Bronze',
        remarks: 'Bronze Medalist'
      });
    }

    const nextObj = { ...resultsData, [selectedSubEvent]: nextList };
    setResultsData(nextObj);
    localStorage.setItem('sems_athletics_sub_results', JSON.stringify(nextObj));

    setShowDeclareModal(false);
    handlePublishSubEventResults(nextList);
  };

  const handlePublishSubEventResults = (overrideEntries = null) => {
    const entries = overrideEntries || resultsData[selectedSubEvent] || [];
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
      scoreSummary: `🥇 1st: ${goldWinner} (${entries.find(e => e.name === goldWinner)?.resultMetric || '-'}), 🥈 2nd: ${silverWinner}, 🥉 3rd: ${bronzeWinner}`,
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
    window.dispatchEvent(new Event('sems_results_updated'));
    addToast(`🏆 ${selectedSubEvent} Results & Medalists Published Successfully!`, 'success');
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

  const handleExportExcel = () => {
    const subEventKeys = Object.keys(resultsData);
    if (subEventKeys.length === 0) {
      addToast('No declared athletics results available to export', 'error');
      return;
    }

    try {
      const recordsToExport = subEventKeys.map((subEvent) => {
        const entries = resultsData[subEvent] || [];
        const goldEntry = entries.find((e) => e.rank === '1st Gold' || e.rank === 'Gold') || {};
        const silverEntry = entries.find((e) => e.rank === '2nd Silver' || e.rank === 'Silver') || {};
        const bronzeEntry = entries.find((e) => e.rank === '3rd Bronze' || e.rank === 'Bronze') || {};

        return {
          id: `ATH-${subEvent.replace(/[^a-zA-Z0-9]/g, '')}`,
          sportId: 'athletics',
          sportName: 'Athletics',
          activeSubEvent: subEvent,
          eventTitle: `Athletics Meet — ${subEvent}`,
          category: 'Open / Inter-College',
          medals: {
            gold: goldEntry.name || 'TBD',
            silver: silverEntry.name || 'TBD',
            bronze: bronzeEntry.name || 'TBD'
          },
          entries: entries,
          winner: goldEntry.name || 'TBD',
          winnerCollege: goldEntry.college || 'MPEC',
          runnerUp: silverEntry.name || 'TBD',
          runnerUpCollege: silverEntry.college || 'MIPS',
          tableNumber: 'Main Stadium Track',
          completedAt: new Date().toISOString(),
          status: 'COMPLETED'
        };
      });

      exportResultsToExcel(recordsToExport, { sport: 'athletics' }, `SEMS_Athletics_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast(`Exported ${recordsToExport.length} Athletics event results to Excel (.xlsx)!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export Athletics results', 'error');
    }
  };

  const currentGold = currentEventResults.find((e) => e.rank === '1st Gold' || e.rank === 'Gold')?.name;
  const currentSilver = currentEventResults.find((e) => e.rank === '2nd Silver' || e.rank === 'Silver')?.name;
  const currentBronze = currentEventResults.find((e) => e.rank === '3rd Bronze' || e.rank === 'Bronze')?.name;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-bold uppercase tracking-wider">
            ATHLETICS RESULTS & MEDALS MANAGEMENT
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Declare Sub-Event Winners & Medals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select an Athletics sub-event, then declare winners. After declaring, you can edit or delete winner standings anytime!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Export PDF
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" /> Export Excel
          </button>

          <button
            type="button"
            onClick={handleOpenDeclareModal}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-slate-950" /> Declare / Edit {selectedSubEvent} Winners
          </button>

          <button
            type="button"
            onClick={() => handlePublishSubEventResults()}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" /> Publish Results
          </button>
        </div>
      </div>

      {/* SUB-EVENT SELECTOR GRID (EXACT 7 SUB-EVENTS) */}
      <div className="bg-white dark:bg-[#0B1120] p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm">
        <label className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          1️⃣ Select Athletics Game / Sub-Event to Manage:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {OFFICIAL_ATHLETICS_EVENTS.map((evt) => {
            const isSelected = selectedSubEvent === evt;
            const hasPublished = Boolean(resultsData[evt] && resultsData[evt].length > 0);
            return (
              <button
                key={evt}
                type="button"
                onClick={() => setSelectedSubEvent(evt)}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition text-center flex flex-col items-center justify-between gap-1 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                }`}
              >
                <span>{evt}</span>
                {hasPublished && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                    ✓ Decided
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PUBLISHED WINNERS STANDINGS BANNER FOR SELECTED SUB-EVENT WITH EDIT & DELETE ACTIONS */}
      {(currentGold || currentSilver || currentBronze) && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Published Medal Standings for {selectedSubEvent}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenDeclareModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Winners
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            {currentGold && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <span className="text-xl">🥇</span>
                <div>
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">{currentGold}</span>
                  <span className="text-[10px] text-slate-500">Gold Medal Winner</span>
                </div>
              </div>
            )}
            {currentSilver && (
              <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/30 flex items-center gap-2">
                <span className="text-xl">🥈</span>
                <div>
                  <span className="font-bold text-slate-400 block">{currentSilver}</span>
                  <span className="text-[10px] text-slate-500">Silver Medal Winner</span>
                </div>
              </div>
            )}
            {currentBronze && (
              <div className="p-3 rounded-2xl bg-amber-700/10 border border-amber-700/30 flex items-center gap-2">
                <span className="text-xl">🥉</span>
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-500 block">{currentBronze}</span>
                  <span className="text-[10px] text-slate-500">Bronze Medal Winner</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANUAL ENTRY & EDITABLE TABLE FOR SELECTED SUB-EVENT */}
      <div className="bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              2️⃣ {selectedSubEvent} — Athlete Entries & Performance Entry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Metric Unit: {isTrackEvent(selectedSubEvent) ? 'Time in Seconds (e.g. 10.45s)' : 'Distance in Meters (e.g. 7.85m)'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddManualAthlete}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/30 transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Manual Athlete
            </button>
            <button
              type="button"
              onClick={handleOpenDeclareModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition cursor-pointer flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5" /> Quick Winner Picker
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold border border-blue-500/20">
              {subEventEntries.length} Athletes
            </span>
          </div>
        </div>

        {subEventEntries.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🏃‍♂️
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No registrations found for "{selectedSubEvent}"</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Participants registered for {selectedSubEvent} will automatically appear here. You can also click "+ Add Manual Athlete" to add one manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3 min-w-[180px]">Participant / Team Name</th>
                  <th className="py-3 px-3 min-w-[160px]">College / Dept</th>
                  <th className="py-3 px-3">Mobile / Email</th>
                  <th className="py-3 px-3 min-w-[140px]">
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
                  const currentAthleteName = resObj.name !== undefined ? resObj.name : defaultName;
                  const currentCollege = resObj.college !== undefined ? resObj.college : college;

                  return (
                    <tr key={athleteId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>

                      {/* Participant / Team Name Input (Editable directly) */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={currentAthleteName}
                          onChange={(e) => handleResultChange(athleteId, defaultName, college, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                          placeholder="Participant Name"
                        />
                        {entry.selectedEvents?.includes('4*100m relay Race') && (
                          <span className="block text-[10px] text-blue-500 font-mono font-normal mt-0.5">
                            Relay Team (4 Members)
                          </span>
                        )}
                        {entry.isManual && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-400 font-mono">
                            Manual
                          </span>
                        )}
                      </td>

                      {/* College / Dept Input (Editable directly) */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={currentCollege}
                          onChange={(e) => handleResultChange(athleteId, defaultName, college, 'college', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:outline-none"
                          placeholder="College / Dept"
                        />
                      </td>

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

      {/* QUICK DECLARE WINNERS MODAL WITH MANUAL TEXTAREA / TEXT INPUTS FOR NAME & COLLEGE */}
      {showDeclareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold uppercase">
                  MANUAL / QUICK WINNER DECLARATION
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Declare {selectedSubEvent} Medal Winners
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a registered athlete or manually enter/edit their Name &amp; College below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeclareModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickDeclareSubmit} className="space-y-6">
              
              {/* Gold Winner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <label className="block text-xs font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span>🥇 1st Place (Gold Medal Winner)</span>
                  <span className="text-[10px] font-mono text-slate-400">Manual Name &amp; College Entry</span>
                </label>

                {subEventEntries.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Pick from Registered List (Optional):</label>
                    <select
                      value={goldId}
                      onChange={(e) => handleSelectWinner('gold', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">-- Manual Entry / Select Athlete --</option>
                      {subEventEntries.map((r, i) => {
                        const name = r.captainName || (r.roster && r.roster[0]?.name) || `Athlete ${i + 1}`;
                        return (
                          <option key={r.id || i} value={r.id || name}>
                            {name} ({r.collegeName || r.college || 'SEMS'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Winner Athlete / Team Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Rohan Sharma"
                      value={goldName}
                      onChange={(e) => setGoldName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">College / University Name</label>
                    <input
                      type="text"
                      placeholder="e.g. MPEC Kanpur"
                      value={goldCollege}
                      onChange={(e) => setGoldCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Timing / Performance Result ({isTrackEvent(selectedSubEvent) ? 'Time' : 'Distance'})</label>
                  <input
                    type="text"
                    placeholder={isTrackEvent(selectedSubEvent) ? 'e.g. 10.45s' : 'e.g. 7.85m'}
                    value={goldMetric}
                    onChange={(e) => setGoldMetric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Silver Winner */}
              <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20 space-y-3">
                <label className="block text-xs font-bold uppercase text-slate-400 flex items-center justify-between">
                  <span>🥈 2nd Place (Silver Medal Winner)</span>
                  <span className="text-[10px] font-mono text-slate-400">Manual Name &amp; College Entry</span>
                </label>

                {subEventEntries.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Pick from Registered List (Optional):</label>
                    <select
                      value={silverId}
                      onChange={(e) => handleSelectWinner('silver', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">-- Manual Entry / Select Athlete --</option>
                      {subEventEntries.map((r, i) => {
                        const name = r.captainName || (r.roster && r.roster[0]?.name) || `Athlete ${i + 1}`;
                        return (
                          <option key={r.id || i} value={r.id || name}>
                            {name} ({r.collegeName || r.college || 'SEMS'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Winner Athlete / Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kunal Dixith"
                      value={silverName}
                      onChange={(e) => setSilverName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">College / University Name</label>
                    <input
                      type="text"
                      placeholder="e.g. PSIT Kanpur"
                      value={silverCollege}
                      onChange={(e) => setSilverCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Timing / Performance Result</label>
                  <input
                    type="text"
                    placeholder={isTrackEvent(selectedSubEvent) ? 'e.g. 10.60s' : 'e.g. 7.50m'}
                    value={silverMetric}
                    onChange={(e) => setSilverMetric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Bronze Winner */}
              <div className="p-4 rounded-2xl bg-amber-700/10 border border-amber-700/20 space-y-3">
                <label className="block text-xs font-bold uppercase text-amber-700 dark:text-amber-500 flex items-center justify-between">
                  <span>🥉 3rd Place (Bronze Medal Winner)</span>
                  <span className="text-[10px] font-mono text-slate-400">Manual Name &amp; College Entry</span>
                </label>

                {subEventEntries.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Pick from Registered List (Optional):</label>
                    <select
                      value={bronzeId}
                      onChange={(e) => handleSelectWinner('bronze', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">-- Manual Entry / Select Athlete --</option>
                      {subEventEntries.map((r, i) => {
                        const name = r.captainName || (r.roster && r.roster[0]?.name) || `Athlete ${i + 1}`;
                        return (
                          <option key={r.id || i} value={r.id || name}>
                            {name} ({r.collegeName || r.college || 'SEMS'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Winner Athlete / Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amit Patel"
                      value={bronzeName}
                      onChange={(e) => setBronzeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">College / University Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HBTU Kanpur"
                      value={bronzeCollege}
                      onChange={(e) => setBronzeCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Timing / Performance Result</label>
                  <input
                    type="text"
                    placeholder={isTrackEvent(selectedSubEvent) ? 'e.g. 10.80s' : 'e.g. 7.20m'}
                    value={bronzeMetric}
                    onChange={(e) => setBronzeMetric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Declare &amp; Publish Medalists
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
