import React, { useState } from 'react';
import { 
  ShieldCheck, User, Trophy, Radio, Bell, 
  Ticket, DollarSign, Activity 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSportsData } from '../context/SportsDataContext';
import { useToast } from '../context/ToastContext';

export const DashboardPage = () => {
  const { user, userRegistrations, setIsAuthModalOpen } = useAuth();
  const { liveMatches, updateLiveMatchScore, addAnnouncement } = useSportsData();
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
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <ShieldCheck className="w-16 h-16 text-blue-500 mx-auto" />
          <h2 className="text-2xl font-black">Portal Access Required</h2>
          <p className="text-xs text-slate-500">Sign in as a Student Athlete or Admin Director to view your personalized dashboard.</p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md"
          >
            Sign In Now
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
      author: 'SEMS Admin Council',
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
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-10 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{user.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  user.role === 'admin' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.college} • {user.email}</p>
            </div>
          </div>
        </div>

        {/* STUDENT DASHBOARD VIEW */}
        {user.role === 'student' && (
          <div className="space-y-8">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-500" /> My Tournament Entry Passes & Receipts ({userRegistrations.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRegistrations.map((reg, idx) => (
                <div
                  key={idx}
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

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-bold">Receipt ID</span>
                      <span className="font-mono font-bold">{reg.receiptId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Pass Code</span>
                      <span className="font-mono font-bold text-orange-500">{reg.passCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Captain</span>
                      <span className="font-bold">{reg.participantName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">Fee Paid</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{reg.feePaid}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="text-2xl font-black">4 Active</div>
                  <div className="text-xs text-slate-400 font-bold">Live Arenas</div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">₹1,45,000</div>
                  <div className="text-xs text-slate-400 font-bold">Entry Fees Collected</div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">11 Sports</div>
                  <div className="text-xs text-slate-400 font-bold">Categories Configured</div>
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
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Select Arena Match</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  >
                    {liveMatches.map((m) => (
                      <option key={m.id} value={m.id}>{m.sport}: {m.team1.name} vs {m.team2.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Team 1 Score</label>
                  <input
                    type="text"
                    value={team1ScoreInput}
                    onChange={(e) => setTeam1ScoreInput(e.target.value)}
                    placeholder="e.g. 175/4 or 3 goals"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Team 2 Score</label>
                  <input
                    type="text"
                    value={team2ScoreInput}
                    onChange={(e) => setTeam2ScoreInput(e.target.value)}
                    placeholder="e.g. 160/8 or 2 goals"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
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
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Notice Title</label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. Schedule Revision for Basketball Semi Final"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category</label>
                    <select
                      value={annCategory}
                      onChange={(e) => setAnnCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    >
                      <option value="Schedule">Schedule</option>
                      <option value="Rules & Guidelines">Rules & Guidelines</option>
                      <option value="Emergency & Safety">Emergency & Safety</option>
                      <option value="Event Highlight">Event Highlight</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Notice Summary & Details</label>
                  <textarea
                    rows={3}
                    value={annSummary}
                    onChange={(e) => setAnnSummary(e.target.value)}
                    placeholder="Enter broadcast details..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
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
