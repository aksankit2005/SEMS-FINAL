import React, { useState, useEffect } from 'react';
import { 
  X, Trophy, Medal, CheckCircle2, Loader2, Camera, User, 
  Sparkles, Award, GraduationCap, Building2, Flame, AlertCircle
} from 'lucide-react';
import { ALL_12_SPORTS, ALL_COLLEGES } from '../../services/superCoordinatorApi';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';

// Athletics Sub-Events
export const ATHLETICS_SUB_EVENTS = [
  '100m Sprint',
  '200m Sprint',
  '4x100m Relay',
  'Long Jump',
  'Shot Put',
  'Discus Throw',
  'Javelin Throw'
];

// Helper to determine allowed formats per sport (Identical to Super Coordinator)
export const getFormatsForSport = (sportId) => {
  const s = (sportId || '').toLowerCase();
  if (s.includes('badminton') || s.includes('table-tennis') || s.includes('tt')) {
    return [
      { id: 'Single', label: 'Single' },
      { id: 'Double', label: 'Double' }
    ];
  }
  if (s.includes('athletics')) {
    return [
      { id: 'Individual', label: 'Individual' }
    ];
  }
  if (s.includes('chess')) {
    return [
      { id: 'Single', label: 'Single' },
      { id: 'Team', label: 'Team Game' }
    ];
  }
  return [
    { id: 'Team', label: 'Team Game' }
  ];
};

export const ResultEditModal = ({ isOpen, result = null, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    id: null,
    sportId: 'cricket',
    sportName: 'Cricket',
    eventTitle: '',
    matchFormat: 'Team',
    gender: 'Boys',
    athleticsSubEvent: '100m Sprint',

    // Winner Details (🥇 1st Place)
    winnerName: '',
    winnerTeamName: '',
    winnerCollege: 'MPEC',
    winnerPhotoUrl: '',
    winnerRollNo: '',
    winnerCourse: 'B.Tech CSE',
    winnerYearSem: '3rd Yr (6th Sem)',
    winnerHighlights: '',

    // Runner-Up Details (🥈 2nd Place)
    runnerUpName: '',
    runnerUpTeamName: '',
    runnerUpCollege: 'MIPS',
    runnerUpPhotoUrl: '',
    runnerUpRollNo: '',
    runnerUpCourse: 'BCA',
    runnerUpYearSem: '2nd Yr (4th Sem)',
    runnerUpHighlights: '',

    score: '',
    status: 'COMPLETED'
  });

  const [uploadingWinnerPhoto, setUploadingWinnerPhoto] = useState(false);
  const [uploadingRunnerUpPhoto, setUploadingRunnerUpPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result) {
      const sId = result.sportId || 'cricket';
      const sportObj = ALL_12_SPORTS.find((s) => s.id === sId) || ALL_12_SPORTS[0];
      const formats = getFormatsForSport(sId);
      const isFormatValid = formats.some((f) => f.id === result.matchFormat);
      const defaultFormat = isFormatValid ? result.matchFormat : formats[0].id;

      setFormData({
        id: result.id || null,
        sportId: sId,
        sportName: sportObj.name,
        eventTitle: result.eventTitle || '',
        matchFormat: defaultFormat,
        gender: result.gender || 'Boys',
        athleticsSubEvent: result.athleticsSubEvent || result.subEvent || '100m Sprint',

        // Winner
        winnerName: result.winnerName || result.winnerTeamName || '',
        winnerTeamName: result.winnerTeamName || result.winnerName || '',
        winnerCollege: result.winnerCollege || 'MPEC',
        winnerPhotoUrl: result.winnerPhotoUrl || '',
        winnerRollNo: result.winnerRollNo || '',
        winnerCourse: result.winnerCourse || 'B.Tech CSE',
        winnerYearSem: result.winnerYearSem || '3rd Yr (6th Sem)',
        winnerHighlights: result.winnerHighlights || '',

        // Runner Up
        runnerUpName: result.runnerUpName || result.runnerUpTeamName || '',
        runnerUpTeamName: result.runnerUpTeamName || result.runnerUpName || '',
        runnerUpCollege: result.runnerUpCollege || 'MIPS',
        runnerUpPhotoUrl: result.runnerUpPhotoUrl || '',
        runnerUpRollNo: result.runnerUpRollNo || '',
        runnerUpCourse: result.runnerUpCourse || 'BCA',
        runnerUpYearSem: result.runnerUpYearSem || '2nd Yr (4th Sem)',
        runnerUpHighlights: result.runnerUpHighlights || '',

        score: result.score || result.scoreSummary || '',
        status: result.status || 'COMPLETED'
      });
    } else {
      const defaultSportId = 'cricket';
      const formats = getFormatsForSport(defaultSportId);
      setFormData({
        id: null,
        sportId: defaultSportId,
        sportName: 'Cricket',
        eventTitle: 'Inter-College Championship Finals',
        matchFormat: formats[0].id,
        gender: 'Boys',
        athleticsSubEvent: '100m Sprint',

        winnerName: '',
        winnerTeamName: '',
        winnerCollege: 'MPEC',
        winnerPhotoUrl: '',
        winnerRollNo: '',
        winnerCourse: 'B.Tech CSE',
        winnerYearSem: '3rd Yr (6th Sem)',
        winnerHighlights: '',

        runnerUpName: '',
        runnerUpTeamName: '',
        runnerUpCollege: 'MIPS',
        runnerUpPhotoUrl: '',
        runnerUpRollNo: '',
        runnerUpCourse: 'BCA',
        runnerUpYearSem: '2nd Yr (4th Sem)',
        runnerUpHighlights: '',

        score: '',
        status: 'COMPLETED'
      });
    }
    setError('');
  }, [result, isOpen]);

  useEffect(() => {
    if (!isOpen || isSubmitting) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSportChange = (sId) => {
    const sObj = ALL_12_SPORTS.find((s) => s.id === sId) || ALL_12_SPORTS[0];
    const allowedFormats = getFormatsForSport(sId);
    const updatedFormat = allowedFormats.some((f) => f.id === formData.matchFormat)
      ? formData.matchFormat
      : allowedFormats[0].id;

    setFormData((prev) => ({
      ...prev,
      sportId: sId,
      sportName: sObj.name,
      matchFormat: updatedFormat
    }));
  };

  const handlePhotoUpload = async (file, target = 'winner') => {
    if (!file) return;
    const setUploading = target === 'winner' ? setUploadingWinnerPhoto : setUploadingRunnerUpPhoto;
    setUploading(true);
    setError('');

    try {
      // 1. Try Cloudinary upload
      const uploaded = await uploadFileToCloudinary(file, () => {}, 'sems_medals');
      if (uploaded?.url) {
        setFormData((prev) => ({
          ...prev,
          [target === 'winner' ? 'winnerPhotoUrl' : 'runnerUpPhotoUrl']: uploaded.url
        }));
        setUploading(false);
        return;
      }
    } catch (e) {
      console.warn('Cloudinary upload notice, using local file reader fallback:', e.message);
    }

    // 2. Fallback to Local Base64 FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        [target === 'winner' ? 'winnerPhotoUrl' : 'runnerUpPhotoUrl']: e.target.result
      }));
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isAthletics = (formData.sportId || '').toLowerCase().includes('athletics');
    const isSingleOrIndiv = formData.matchFormat === 'Single' || formData.matchFormat === 'Individual';
    const isTeamOrDouble = formData.matchFormat === 'Team' || formData.matchFormat === 'Double';

    const wName = formData.winnerName.trim();
    const wTeam = formData.winnerTeamName.trim();
    const rName = formData.runnerUpName.trim();
    const rTeam = formData.runnerUpTeamName.trim();

    if (!wName && !wTeam) {
      setError('🥇 Winner Player Name or Winner Team Name is required!');
      return;
    }
    if (isSingleOrIndiv && !wName) {
      setError('🥇 Winner Player Name is required for Single/Individual events!');
      return;
    }
    if (isTeamOrDouble && !wTeam && !wName) {
      setError('🥇 Winner Team Name is required for Team/Double events!');
      return;
    }

    if (!rName && !rTeam) {
      setError('🥈 Runner-Up Player Name or Runner-Up Team Name is required!');
      return;
    }
    if (isSingleOrIndiv && !rName) {
      setError('🥈 Runner-Up Player Name is required for Single/Individual events!');
      return;
    }
    if (isTeamOrDouble && !rTeam && !rName) {
      setError('🥈 Runner-Up Team Name is required for Team/Double events!');
      return;
    }

    const sportObj = ALL_12_SPORTS.find((s) => s.id === formData.sportId) || ALL_12_SPORTS[0];
    const winnerObj = ALL_COLLEGES.find((c) => c.id === formData.winnerCollege) || ALL_COLLEGES[0];
    const runnerObj = ALL_COLLEGES.find((c) => c.id === formData.runnerUpCollege) || ALL_COLLEGES[1];

    const finalSportName = isAthletics
      ? `Athletics (${formData.athleticsSubEvent})`
      : sportObj.name;

    const payload = {
      ...formData,
      sportId: sportObj.id,
      sportName: finalSportName,
      athleticsSubEvent: isAthletics ? formData.athleticsSubEvent : null,
      subEvent: isAthletics ? formData.athleticsSubEvent : `${sportObj.name} Final`,
      winnerName: wName || wTeam,
      winnerTeamName: wTeam || wName,
      winnerCollege: winnerObj.id,
      winnerCollegeName: winnerObj.name,
      winnerPoints: 5,
      runnerUpName: rName || rTeam,
      runnerUpTeamName: rTeam || rName,
      runnerUpCollege: runnerObj.id,
      runnerUpCollegeName: runnerObj.name,
      runnerUpPoints: 3,
      points: 10,
      details: {
        winnerPhotoUrl: formData.winnerPhotoUrl || '',
        winnerRollNo: formData.winnerRollNo.trim(),
        winnerCourse: formData.winnerCourse.trim(),
        winnerYearSem: formData.winnerYearSem.trim(),
        winnerHighlights: formData.winnerHighlights.trim(),
        runnerUpPhotoUrl: formData.runnerUpPhotoUrl || '',
        runnerUpRollNo: formData.runnerUpRollNo.trim(),
        runnerUpCourse: formData.runnerUpCourse.trim(),
        runnerUpYearSem: formData.runnerUpYearSem.trim(),
        runnerUpHighlights: formData.runnerUpHighlights.trim(),
        scoreSummary: formData.score.trim()
      }
    };

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message || 'Failed to save result & leaderboard update');
      setIsSubmitting(false);
    }
  };

  const isAthletics = (formData.sportId || '').toLowerCase().includes('athletics');
  const availableFormats = getFormatsForSport(formData.sportId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Super Admin & Coordinator Parity
                </span>
                <span className="text-[10px] font-bold text-slate-400">• Full Student Credentials</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {result ? 'Edit Declared Match Result' : 'Declare Official Match Result'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Award 🥇 1st (Gold, 5 pts) & 🥈 2nd (Silver, 3 pts) with photo, roll no, course & highlights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* TOP SECTION: Sport, Format, Gender & Athletics Sub-Event */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* 1. Sport Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                  🎯 Sport / Discipline *
                </label>
                <select
                  value={formData.sportId}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                >
                  {ALL_12_SPORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Match Format (Dynamic per sport) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                  🎾 Match Format
                </label>
                <div className="flex gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  {availableFormats.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, matchFormat: fmt.id })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-extrabold transition cursor-pointer text-center ${
                        formData.matchFormat === fmt.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Gender Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
                  ⚧️ Gender Category
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  {['Boys', 'Girls', 'Mixed'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition cursor-pointer text-center ${
                        formData.gender === g
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Athletics Sub-Event Dropdown */}
            {isAthletics && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5 animate-fade-in">
                <label className="block text-xs font-mono font-black text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1.5">
                  <span>🏃</span>
                  <span>Select Athletics Discipline / Sub-Event *</span>
                </label>
                <select
                  value={formData.athleticsSubEvent}
                  onChange={(e) => setFormData({ ...formData, athleticsSubEvent: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:border-blue-500 outline-none"
                >
                  {ATHLETICS_SUB_EVENTS.map((subEv) => (
                    <option key={subEv} value={subEv}>
                      🏃 {subEv}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Score & Tournament Title Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Event / Tournament Title
                </label>
                <input
                  type="text"
                  value={formData.eventTitle}
                  onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                  placeholder="e.g. Inter-College Championship Finals"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Final Score / Match Result Details
                </label>
                <input
                  type="text"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="e.g. 21-18, 19-21, 21-16 or 164/5 (20.0)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* TWO MAIN CARDS: Winner (🥇 1st) & Runner-Up (🥈 2nd) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 🥇 WINNER DETAILS CARD */}
            <div className="p-5 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800/50">
                <span className="text-xs sm:text-sm font-mono font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2">
                  🥇 First Position (Winner)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-mono font-black text-[11px] shadow-xs">
                  +5 POINTS (GOLD)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Winner Player Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    👤 Winner Player Name {formData.matchFormat === 'Single' || formData.matchFormat === 'Individual' ? '*' : '(Optional for Team)'}
                  </label>
                  <input
                    type="text"
                    value={formData.winnerName}
                    onChange={(e) => setFormData({ ...formData, winnerName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Winner Team Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    🛡️ Winner Team Name {formData.matchFormat === 'Team' || formData.matchFormat === 'Double' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.winnerTeamName}
                    onChange={(e) => setFormData({ ...formData, winnerTeamName: e.target.value })}
                    placeholder="e.g. MPEC Titans"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Winner College */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    🏫 Winner College Name *
                  </label>
                  <select
                    value={formData.winnerCollege}
                    onChange={(e) => setFormData({ ...formData, winnerCollege: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {ALL_COLLEGES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Winner Student Photo Upload */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300/60 dark:border-emerald-700/40">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group shadow-xs">
                    {formData.winnerPhotoUrl ? (
                      <>
                        <img src={formData.winnerPhotoUrl} alt="Winner" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, winnerPhotoUrl: '' })}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <User className="w-7 h-7 text-slate-400" />
                    )}
                    {uploadingWinnerPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-mono">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      📸 Winner Athlete Photo
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formData.winnerPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'winner')}
                      />
                    </label>
                  </div>
                </div>

                {/* Winner Academic Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Roll No</label>
                    <input
                      type="text"
                      value={formData.winnerRollNo}
                      onChange={(e) => setFormData({ ...formData, winnerRollNo: e.target.value })}
                      placeholder="2101640100012"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Course / Branch</label>
                    <input
                      type="text"
                      value={formData.winnerCourse}
                      onChange={(e) => setFormData({ ...formData, winnerCourse: e.target.value })}
                      placeholder="B.Tech CSE"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Year / Sem</label>
                    <input
                      type="text"
                      value={formData.winnerYearSem}
                      onChange={(e) => setFormData({ ...formData, winnerYearSem: e.target.value })}
                      placeholder="3rd Yr (6th Sem)"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Winner Highlights */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Match Highlight Quote</label>
                  <input
                    type="text"
                    value={formData.winnerHighlights}
                    onChange={(e) => setFormData({ ...formData, winnerHighlights: e.target.value })}
                    placeholder="e.g. Scored 18 smash winners in 3rd set"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 🥈 RUNNER-UP DETAILS CARD */}
            <div className="p-5 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800/60 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800/50">
                <span className="text-xs sm:text-sm font-mono font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                  🥈 Second Position (Runner-Up)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-mono font-black text-[11px] shadow-xs">
                  +3 POINTS (SILVER)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Runner-Up Player Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    👤 Runner-Up Player Name {formData.matchFormat === 'Single' || formData.matchFormat === 'Individual' ? '*' : '(Optional for Team)'}
                  </label>
                  <input
                    type="text"
                    value={formData.runnerUpName}
                    onChange={(e) => setFormData({ ...formData, runnerUpName: e.target.value })}
                    placeholder="e.g. Amit Verma"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Runner-Up Team Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    🛡️ Runner-Up Team Name {formData.matchFormat === 'Team' || formData.matchFormat === 'Double' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.runnerUpTeamName}
                    onChange={(e) => setFormData({ ...formData, runnerUpTeamName: e.target.value })}
                    placeholder="e.g. MIPS Warriors"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-700/60 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Runner-Up College */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    🏫 Runner-Up College Name *
                  </label>
                  <select
                    value={formData.runnerUpCollege}
                    onChange={(e) => setFormData({ ...formData, runnerUpCollege: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {ALL_COLLEGES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Runner-Up Student Photo Upload */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-300/60 dark:border-blue-700/40">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-blue-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group shadow-xs">
                    {formData.runnerUpPhotoUrl ? (
                      <>
                        <img src={formData.runnerUpPhotoUrl} alt="Runner-Up" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, runnerUpPhotoUrl: '' })}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <User className="w-7 h-7 text-slate-400" />
                    )}
                    {uploadingRunnerUpPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-mono">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      📸 Runner-Up Athlete Photo
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formData.runnerUpPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'runnerUp')}
                      />
                    </label>
                  </div>
                </div>

                {/* Runner-Up Academic Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Roll No</label>
                    <input
                      type="text"
                      value={formData.runnerUpRollNo}
                      onChange={(e) => setFormData({ ...formData, runnerUpRollNo: e.target.value })}
                      placeholder="2201640100045"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Course / Branch</label>
                    <input
                      type="text"
                      value={formData.runnerUpCourse}
                      onChange={(e) => setFormData({ ...formData, runnerUpCourse: e.target.value })}
                      placeholder="BCA"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Year / Sem</label>
                    <input
                      type="text"
                      value={formData.runnerUpYearSem}
                      onChange={(e) => setFormData({ ...formData, runnerUpYearSem: e.target.value })}
                      placeholder="2nd Yr (4th Sem)"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Runner-Up Highlights */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">Match Highlight Quote</label>
                  <input
                    type="text"
                    value={formData.runnerUpHighlights}
                    onChange={(e) => setFormData({ ...formData, runnerUpHighlights: e.target.value })}
                    placeholder="e.g. Fought hard in the 3rd set decider"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-400/60 dark:border-blue-700/40 text-slate-900 dark:text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 font-mono">
              Inter-College Points: Gold (5 PTS) • Silver (3 PTS)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Result...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{result ? 'Update Result & Leaderboard' : 'Declare & Update Leaderboard'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
