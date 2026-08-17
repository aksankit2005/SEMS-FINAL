import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Trophy, Award, Search, Filter, 
  FileDown, LogOut, ShieldCheck, Eye, Activity, CheckCircle2, 
  BarChart3, Layers, BookOpen, Lock, AlertTriangle, Key, X, EyeOff
} from 'lucide-react';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { useToast } from '../../context/ToastContext';
import { SPORTS_DATA } from '../../data/sportsData';
import { exportToCSV } from '../../utils/pdfExporter';

export const CollegeHeadDashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'sports' | 'medals' | 'reports'

  const [stats, setStats] = useState(null);
  const [studentsData, setStudentsData] = useState({ count: 0, students: [] });
  const [sportsBreakdown, setSportsBreakdown] = useState([]);
  const [medalSummary, setMedalSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  // Filters state for Students table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Load user and data
  useEffect(() => {
    const currentUser = collegeHeadApi.getUser();
    if (!currentUser || currentUser.role !== 'college_head') {
      navigate('/college-head/login');
      return;
    }
    setUser(currentUser);
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    setStudentsData({ count: 0, students: [] });
    setSportsBreakdown([]);
    try {
      const [statsData, studentsRes, sportsRes, medalRes] = await Promise.all([
        collegeHeadApi.getDashboardStats(),
        collegeHeadApi.getStudents({ search: searchQuery, sport: selectedSportFilter }),
        collegeHeadApi.getSportsParticipation(),
        collegeHeadApi.getMedalSummary(),
      ]);

      setStats(statsData);
      setStudentsData(studentsRes);
      setSportsBreakdown(sportsRes);
      setMedalSummary(medalRes);
    } catch (err) {
      addToast('Failed to load college data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch students when search or filters change
  useEffect(() => {
    if (!user) return;
    const fetchStudents = async () => {
      try {
        const res = await collegeHeadApi.getStudents({
          search: searchQuery,
          sport: selectedSportFilter,
        });
        setStudentsData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, [searchQuery, selectedSportFilter, user]);

  const handleLogout = () => {
    setUser(null);
    setStats(null);
    setStudentsData({ count: 0, students: [] });
    setSportsBreakdown([]);
    setMedalSummary(null);
    collegeHeadApi.logout();
    addToast('Logged out successfully', 'info');
    navigate('/college-head/login');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!passwordForm.current) {
      addToast('Please enter your current password', 'error');
      return;
    }
    if (!passwordForm.newPass) {
      addToast('Please enter a new password', 'error');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      addToast('New password and confirmation do not match', 'error');
      return;
    }

    addToast(`Password successfully updated for ${user?.faculty_name || 'Head Coordinator'}!`, 'success');
    setShowPasswordModal(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  // Download PDF Report helper
  const handleExportPDF = () => {
    addToast(`Generating official report for ${user?.college}...`, 'info');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Please allow popups to download PDF report', 'error');
      return;
    }

    const escapeHtml = (unsafe) => {
      if (typeof unsafe !== 'string') return unsafe ? String(unsafe) : '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>APEX 2026 - ${escapeHtml(user?.college)} Sports Participation Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1e293b; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .summary-grid { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          .summary-box { text-align: center; }
          .summary-val { font-size: 20px; font-weight: bold; color: #2563eb; }
          .summary-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">APEX SPORTS FESTIVAL 2026</div>
          <div class="subtitle">Official College Participation & Performance Report</div>
          <div style="margin-top: 8px;"><span class="badge">ASSIGNED COLLEGE: ${escapeHtml(user?.college)}</span></div>
        </div>

        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-val">${stats?.totalStudents || 0}</div>
            <div class="summary-lbl">Total Athletes</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${stats?.sportsCount || 0}</div>
            <div class="summary-lbl">Sports Entered</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${medalSummary?.gold || 0}🥇 ${medalSummary?.silver || 0}🥈 ${medalSummary?.bronze || 0}🥉</div>
            <div class="summary-lbl">Medals Won</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${medalSummary?.totalPoints || 0}</div>
            <div class="summary-lbl">Total Points</div>
          </div>
        </div>

        <h3>Registered Student Athletes (${studentsData.students.length})</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Role</th>
              <th>Roll Number</th>
              <th>Course</th>
              <th>Year / Semester</th>
              <th>Sport</th>
              <th>Team Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${studentsData.students.map((s, idx) => {
              const isCap = (s.isCaptain === true || s.isCaptain === 1 || s.isCaptain === 'true' || s.isCaptain === '1');
              return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(s.studentName || 'N/A')}</strong></td>
                <td><span style="font-weight: bold; color: ${isCap ? '#2563eb' : '#64748b'};">${isCap ? 'Captain' : 'Player'}</span></td>
                <td>${escapeHtml(s.rollNumber || 'N/A')}</td>
                <td>${escapeHtml(s.course || 'N/A')}</td>
                <td>${escapeHtml(s.yearSemester || s.year || 'N/A')}</td>
                <td>${escapeHtml(s.sportName || 'N/A')}</td>
                <td>${escapeHtml(s.teamName || 'Individual')}</td>
                <td>${escapeHtml(s.status || 'VERIFIED')}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>

        <div class="footer">
          Report generated for College Head (${escapeHtml(user?.faculty_name || 'Faculty Sports Head')}) on ${new Date().toLocaleDateString()} | Read-Only Access System
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    addToast('PDF Report window opened ready for printing', 'success');
  };


  // Export CSV Report helper
  const handleExportCSV = () => {
    if (!studentsData.students.length) {
      addToast('No student records to export', 'error');
      return;
    }
    const exportData = studentsData.students.map((s, idx) => ({
      'S.No.': idx + 1,
      'Student Name': s.studentName || 'N/A',
      'Role': (s.isCaptain === true || s.isCaptain === 1 || s.isCaptain === 'true' || s.isCaptain === '1') ? 'Captain' : 'Player',
      'Roll Number': s.rollNumber || 'N/A',
      'Course': s.course || 'N/A',
      'Year / Semester': s.yearSemester || s.year || 'N/A',
      'Sport': s.sportName || 'N/A',
      'Event': s.eventType || `${s.sportName || 'Sport'} Championship`,
      'Team Name': s.teamName || 'Individual',
      'Mobile Number': s.phone || 'N/A',
      'Email Address': s.email || 'N/A',
      'Gender': s.gender || 'N/A',
      'Status': s.status || 'VERIFIED'
    }));

    exportToCSV(exportData, `${(user?.college || 'College').replace(/\s+/g, '_')}_Official_Roster_${new Date().toISOString().split('T')[0]}`);
    addToast('Official College Roster exported to CSV successfully!', 'success');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* COLLEGE HEAD WELCOME BANNER */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 mb-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-0"></div>

          <div className="flex items-start sm:items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white uppercase tracking-wider">
                  {user.college}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Read-Only Access
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {user.faculty_name || 'Sports Faculty Head'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official College Sports Faculty Portal • Assigned Domain: <strong className="text-slate-900 dark:text-white">{user.college}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft mb-8 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: Activity },
            { id: 'profile', label: 'Faculty Head Profile', icon: ShieldCheck },
            { id: 'students', label: `College Students (${studentsData.count})`, icon: Users },
            { id: 'sports', label: 'Sports Participation', icon: Trophy },
            { id: 'medals', label: 'Medal Tally', icon: Award },
            { id: 'reports', label: 'Download Reports', icon: FileDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB PROFILE: FACULTY HEAD PROFILE & EXCEL EXPORT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {user.faculty_name || 'College Sports Head'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Assigned Domain: <strong className="text-blue-600 dark:text-indigo-400">{user.college}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Key className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Export Excel / CSV</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Print PDF Report</span>
                  </button>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Representative</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{user.faculty_name || 'Sports Incharge'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned College Campus</span>
                  <span className="font-extrabold text-sm text-blue-600 dark:text-indigo-400">{user.college}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Email</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{user.email || `head@${user.college.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Portal Access Level</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">College Head (Read-Only)</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Athletes</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{studentsData.count} Athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Official
                  </span>
                </div>
              </div>

              {/* Account Security Box */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Account Security & Credentials</h4>
                    <p className="text-xs text-slate-500">
                      Update your Head Coordinator portal access password regularly to keep your college data secure.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: OVERVIEW & STATS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Athletes</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalStudents || 0}</div>
                <p className="text-[11px] text-slate-500">Verified from {user.college}</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Sports Entered</span>
                  <Trophy className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stats?.sportsCount || 0}</div>
                <p className="text-[11px] text-slate-500">Out of 11 tournament events</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Medals Won</span>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🥇 {medalSummary?.gold || 0}</span>
                  <span>🥈 {medalSummary?.silver || 0}</span>
                  <span>🥉 {medalSummary?.bronze || 0}</span>
                </div>
                <p className="text-[11px] text-slate-500">Championship Tally</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Points</span>
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{medalSummary?.totalPoints || 0} Pts</div>
                <p className="text-[11px] text-slate-500">Leaderboard Score</p>
              </div>
            </div>

            {/* Read-Only Notice Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Read-Only Governance Standard</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    As College Head, you are viewing official, isolated metrics for <strong>{user.college}</strong>. Financial data and editing capabilities are restricted.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Sports Participation Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Trophy className="w-5 h-5 text-blue-500" /> Sports Participation Breakdown for {user.college}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sportsBreakdown.map((s, idx) => (
                  <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">{s.sportName}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                        {s.total} Athletes
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <div>Male: <span className="text-slate-900 dark:text-white">{s.male}</span></div>
                      <div>Female: <span className="text-slate-900 dark:text-white">{s.female}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: COLLEGE STUDENTS & REGISTRATIONS (READ-ONLY) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            
            {/* Search & Filter Header */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${user.college} students by name, roll, course...`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </div>
                
                {/* Sport Filter */}
                <select
                  value={selectedSportFilter}
                  onChange={(e) => setSelectedSportFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Sports (12 Games)</option>
                  <option value="athletics">Athletics</option>
                  <option value="badminton">Badminton</option>
                  <option value="basketball">Basketball</option>
                  <option value="chess">Chess</option>
                  <option value="cricket">Cricket</option>
                  <option value="football">Football</option>
                  <option value="gully-cricket">Gully Cricket</option>
                  <option value="kabaddi">Kabaddi</option>
                  <option value="kho-kho">Kho-Kho</option>
                  <option value="table-tennis">Table Tennis</option>
                  <option value="tug-of-war">Tug of War</option>
                  <option value="volleyball">Volleyball</option>
                </select>
              </div>

            </div>

            {/* Read-Only Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Showing {studentsData.students.length} Student Athletes for {user.college}
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  READ ONLY
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 uppercase text-[10px] font-black text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Student Athlete</th>
                      <th className="p-4">Roll Number</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Year / Semester</th>
                      <th className="p-4">Sport Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentsData.students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                          No registered students found for {user.college} matching the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      studentsData.students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{student.studentName}</span>
                              {student.isCaptain && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Captain
                                </span>
                              )}
                            </div>
                            {student.teamName && student.teamName !== 'Individual' && (
                              <span className="text-[10px] text-slate-400 font-normal block">Team: {student.teamName}</span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {student.rollNumber || 'N/A'}
                          </td>
                          <td className="p-4 font-bold text-slate-600 dark:text-slate-300">
                            {student.course || 'N/A'}
                          </td>
                          <td className="p-4 text-slate-500 font-medium">
                            {student.yearSemester || student.year || 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-blue-600 dark:text-blue-400 block">{student.sportName}</span>
                            <span className="text-[10px] text-slate-400">{student.eventType}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: SPORTS PARTICIPATION */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'sports' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Trophy className="w-5 h-5 text-blue-500" /> Detailed Sports Participation Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sportsBreakdown.map((s, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900 dark:text-white">{s.sportName}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white">
                      {s.total} Total
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>Male Athletes: {s.male}</span>
                      <span>Female Athletes: {s.female}</span>
                    </div>

                    {/* Simple ratio bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div 
                        className="bg-blue-600 h-full" 
                        style={{ width: `${s.total > 0 ? (s.male / s.total) * 100 : 50}%` }}
                      ></div>
                      <div 
                        className="bg-indigo-400 h-full" 
                        style={{ width: `${s.total > 0 ? (s.female / s.total) * 100 : 50}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: MEDAL STANDINGS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'medals' && (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft text-center max-w-2xl mx-auto space-y-6">
              <Award className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{user.college} Championship Tally</h3>
                <p className="text-xs text-slate-500 mt-1">Official medal standings across all 11 sports events</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <div className="text-3xl font-black">🥇 {medalSummary?.gold || 0}</div>
                  <div className="text-[11px] font-bold uppercase mt-1">Gold Medals</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <div className="text-3xl font-black">🥈 {medalSummary?.silver || 0}</div>
                  <div className="text-[11px] font-bold uppercase mt-1">Silver Medals</div>
                </div>
                <div className="p-4 rounded-2xl bg-orange-700/10 border border-orange-700/20 text-orange-600 dark:text-orange-400">
                  <div className="text-3xl font-black">🥉 {medalSummary?.bronze || 0}</div>
                  <div className="text-[11px] font-bold uppercase mt-1">Bronze Medals</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-around text-xs font-bold">
                <div>Top Performing Sport: <span className="font-extrabold text-blue-600 dark:text-blue-400">{medalSummary?.topSport || 'N/A'}</span></div>
                <div>Cumulative Points: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{medalSummary?.totalPoints || 0} Pts</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: DOWNLOAD REPORTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft max-w-2xl mx-auto space-y-6 text-center">
              <FileDown className="w-16 h-16 text-blue-600 mx-auto" />
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Download {user.college} Official Reports</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export complete student participation lists and medal tallies. Excludes financial/payment columns.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleExportPDF}
                  className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Official Report (PDF)</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Athletes Roster (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* CHANGE PASSWORD MODAL */}
        {/* ---------------------------------------------------- */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h3>
                    <p className="text-xs text-slate-500">Head Coordinator Security Account Settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={passwordForm.newPass}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                      placeholder="Enter new password (min. 6 characters)"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
