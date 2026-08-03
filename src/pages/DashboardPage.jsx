import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, User, Trophy, Radio, Bell, 
  Ticket, DollarSign, Activity, FileDown, Loader2, LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSportsData } from '../context/SportsDataContext';
import { useToast } from '../context/ToastContext';
import { downloadPassAsPDF } from '../utils/pdfExporter';
import { Navigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, logout, userRegistrations, setIsAuthModalOpen } = useAuth();
  const { sports, liveMatches, updateLiveMatchScore, addAnnouncement } = useSportsData();
  const { addToast } = useToast();

  const [selectedMatchId, setSelectedMatchId] = useState(liveMatches[0]?.id || '');
  const [team1ScoreInput, setTeam1ScoreInput] = useState('');
  const [team2ScoreInput, setTeam2ScoreInput] = useState('');
  const [statusInput, setStatusInput] = useState('');

  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState('Schedule');
  const [annSummary, setAnnSummary] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
          <div className="flex justify-center mb-2">
            <img 
              src="/logo-dark.png" 
              alt="APEX Logo" 
              className="hidden dark:block h-14 w-auto object-contain"
            />
            <img 
              src="/logo-light.png" 
              alt="APEX Logo" 
              className="block dark:hidden h-14 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Official Access Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Please sign in via an authorized official portal (College Head, Sport Coordinator, or PR Media) to access dashboard management tools.</p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Select Official Portal
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateLiveScore = (e) => {
    e.preventDefault();
    if (!selectedMatchId) return;
    updateLiveMatchScore(selectedMatchId, team1ScoreInput || '1', team2ScoreInput || '0', statusInput || 'Score Updated by Admin');
    addToast('Live Match score dispatches successfully!', 'success');
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!annTitle || !annSummary) {
      addToast('Please enter announcement title and summary', 'error');
      return;
    }
    addAnnouncement({
      id: `ann-${Date.now()}`,
      title: annTitle,
      category: annCategory,
      date: new Date().toISOString().split('T')[0],
      time: 'Just now',
      isImportant: true,
      author: 'APEX Admin Council',
      summary: annSummary,
      content: annSummary
    });
    addToast('New Announcement posted to public broadcast feed!', 'success');
    setAnnTitle('');
    setAnnSummary('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Banner */}
        <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 mb-10 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{user.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  user.role === 'admin' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.college} • {user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

        {/* STUDENT DASHBOARD VIEW */}
        {user.role === 'student' && (
          <div className="space-y-8">
            <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Ticket className="w-5 h-5 text-blue-500" /> My Tournament Entry Passes & Receipts ({userRegistrations.length})
            </h2>

            {userRegistrations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8 space-y-3">
                <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Event Passes Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">You have not registered for any sports events yet. Choose a sport and submit your entry pass!</p>
                <Link
                  to="/registration"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md mt-2"
                >
                  <Trophy className="w-4 h-4" /> Go to Registration
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userRegistrations.map((reg, idx) => (
                  <div
                    key={idx}
                    id={`pass-card-${idx}`}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase">{reg.category}</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{reg.sportName}</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {reg.status}
                      </span>
                    </div>

                    {/* College unique pass banner */}
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Unique College Pass Number</span>
                      <div className="text-base font-mono font-black text-orange-600 dark:text-amber-400">{reg.passCode}</div>
                      <div className="text-[10px] text-slate-500 font-bold">College: {reg.college}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block font-bold">Receipt ID</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{reg.receiptId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block font-bold">Lead Captain</span>
                        <span className="font-bold text-slate-900 dark:text-white">{reg.participantName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block font-bold">Fee Paid</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{reg.feePaid}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block font-bold">Date</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{reg.date || '2026-07-28'}</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        addToast('Generating your PDF Pass...', 'info');
                        await downloadPassAsPDF(reg, `APEX_Pass_${reg.passCode || reg.receiptId}.pdf`);
                        addToast('PDF Pass downloaded successfully!', 'success');
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <FileDown className="w-4 h-4" /> Download Pass (PDF)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {user.role === 'admin' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{liveMatches.length} Active</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Live Arenas</div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{userRegistrations.reduce((sum, r) => sum + (Number(r.feePaid) || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Entry Fees Collected</div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{(sports || []).length} Sports</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Categories Configured</div>
                </div>
              </div>
            </div>

            {/* Live Score Controller */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Admin Live Score Controller
              </h3>

              <form onSubmit={handleUpdateLiveScore} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Select Arena Match</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {liveMatches.map((m) => (
                      <option key={m.id} value={m.id}>{m.sport}: {m.team1.name} vs {m.team2.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Team 1 Score</label>
                  <input
                    type="text"
                    value={team1ScoreInput}
                    onChange={(e) => setTeam1ScoreInput(e.target.value)}
                    placeholder="e.g. 175/4 or 3 goals"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Team 2 Score</label>
                  <input
                    type="text"
                    value={team2ScoreInput}
                    onChange={(e) => setTeam2ScoreInput(e.target.value)}
                    placeholder="e.g. 160/8 or 2 goals"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
                  >
                    Dispatch Score Update
                  </button>
                </div>
              </form>
            </div>

            {/* Post Announcement */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-500" /> Post Public Announcement
              </h3>

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-505 dark:text-slate-400 mb-1">Notice Title</label>
                    <input
                       type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Schedule Revision for Basketball Semi Final"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-505 dark:text-slate-400 mb-1">Category</label>
                    <select
                      value={annCategory}
                      onChange={(e) => setAnnCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Schedule">Schedule</option>
                      <option value="Rules & Guidelines">Rules & Guidelines</option>
                      <option value="Emergency & Safety">Emergency & Safety</option>
                      <option value="Event Highlight">Event Highlight</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-505 dark:text-slate-400 mb-1">Notice Summary & Details</label>
                  <textarea
                    rows={3}
                    value={annSummary}
                    onChange={(e) => setAnnSummary(e.target.value)}
                    placeholder="Enter broadcast details..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  Broadcast Announcement
                </button>
              </form>
            </div>
          </div>
        )}



      </div>
    </div>
  );
};
