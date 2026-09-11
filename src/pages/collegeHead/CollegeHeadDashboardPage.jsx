import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Trophy, Award, Search, Filter, 
  FileDown, LogOut, ShieldCheck, Activity, CheckCircle2, 
  BarChart3, Layers, BookOpen, X, Phone, Calendar, Clock
} from 'lucide-react';
import { collegeHeadApi } from '../../services/collegeHeadApi';
import { ALL_12_SPORTS } from '../../services/superCoordinatorApi';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/pdfExporter';
import { getParticipationType } from '../../utils/rosterHelper';

export const CollegeHeadDashboardPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'sports' | 'medals' | 'reports'

  const [stats, setStats] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [sportsBreakdown, setSportsBreakdown] = useState([]);
  const [medalSummary, setMedalSummary] = useState(null);
  const [backendEvents, setBackendEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  // Filters state for Students table
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');
  const [selectedEventTitleFilter, setSelectedEventTitleFilter] = useState('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('all');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState('all');

  // Debounce search query to prevent excessive filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load user and college data on mount
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
    try {
      const [statsData, sportsRes, medalRes, studentsRes, eventsRes] = await Promise.all([
        collegeHeadApi.getDashboardStats(),
        collegeHeadApi.getSportsParticipation(),
        collegeHeadApi.getMedalSummary(),
        collegeHeadApi.getStudents(),
        collegeHeadApi.getEvents(),
      ]);

      setStats(statsData);
      setSportsBreakdown(sportsRes || []);
      setMedalSummary(medalRes);

      const rawList = Array.isArray(studentsRes?.students) ? studentsRes.students : [];
      setAllStudents(rawList);

      const evList = Array.isArray(eventsRes) && eventsRes.length > 0 
        ? eventsRes 
        : (Array.isArray(studentsRes?.availableEvents) ? studentsRes.availableEvents : []);
      setBackendEvents(evList);
    } catch (err) {
      addToast('Failed to load college data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStats(null);
    setAllStudents([]);
    setSportsBreakdown([]);
    setMedalSummary(null);
    collegeHeadApi.logout();
    addToast('Logged out successfully', 'info');
    navigate('/college-head/login');
  };

  // Dynamic Available Events (derived strictly from active Coordinator created events)
  const availableEvents = useMemo(() => {
    if (!Array.isArray(backendEvents)) return [];
    const titlesSet = new Set();
    
    backendEvents.forEach((ev) => {
      let t = '';
      let evSportId = '';
      let evSportName = '';

      if (typeof ev === 'string' && ev.trim()) {
        t = ev.trim();
      } else if (ev && typeof ev === 'object') {
        t = (ev.title || ev.eventTitle || ev.name || '').trim();
        evSportId = (ev.sportId || '').toLowerCase().trim();
        evSportName = (ev.sportName || '').toLowerCase().trim();
      }

      if (!t) return;

      // If a game/sport is selected, filter events to that sport
      if (selectedSportFilter && selectedSportFilter !== 'all' && selectedSportFilter !== 'ALL') {
        const sp = selectedSportFilter.toLowerCase().trim().replace(/_/g, '-');
        const tLower = t.toLowerCase().replace(/_/g, '-');
        const isCricket = sp === 'cricket' || (sp.includes('cricket') && !sp.includes('gully'));
        const isGully = sp.includes('gully');

        if (isCricket) {
          if (tLower.includes('gully') || evSportId.includes('gully') || evSportName.includes('gully')) return;
          if (!tLower.includes('cricket') && !evSportId.includes('cricket') && !evSportName.includes('cricket')) return;
        } else if (isGully) {
          if (!tLower.includes('gully') && !evSportId.includes('gully') && !evSportName.includes('gully')) return;
        } else {
          const matches = 
            evSportId === sp ||
            evSportId.includes(sp) ||
            sp.includes(evSportId) ||
            evSportName.includes(sp) ||
            tLower.includes(sp) ||
            tLower.includes(sp.replace(/-/g, ' '));
          if (!matches) return;
        }
      }

      titlesSet.add(t);
    });

    return Array.from(titlesSet).sort();
  }, [backendEvents, selectedSportFilter]);

  // Auto-reset event title filter if selected event is no longer in available list
  useEffect(() => {
    if (selectedEventTitleFilter !== 'all' && availableEvents.length > 0 && !availableEvents.includes(selectedEventTitleFilter)) {
      setSelectedEventTitleFilter('all');
    }
  }, [availableEvents, selectedEventTitleFilter]);

  // Handle Game/Sport change with auto-adjustment
  const handleSportChange = (newSport) => {
    setSelectedSportFilter(newSport);
    if (selectedEventTitleFilter !== 'all') {
      setSelectedEventTitleFilter('all');
    }
  };

  // Memoized Client-side Filtering for Instant 0ms Response & Double-layered Isolation
  const filteredStudents = useMemo(() => {
    let list = allStudents || [];

    // 1. Filter by Game
    if (selectedSportFilter && selectedSportFilter !== 'all') {
      const sp = selectedSportFilter.toLowerCase().trim().replace(/_/g, '-');
      const isStdCricket = sp === 'cricket' || (sp.includes('cricket') && !sp.includes('gully'));
      const isGully = sp.includes('gully');

      list = list.filter((s) => {
        const sid = (s.sportId || '').toLowerCase().replace(/_/g, '-');
        const sname = (s.sportName || '').toLowerCase().replace(/_/g, '-');

        if (isStdCricket) {
          if (sid.includes('gully') || sname.includes('gully')) return false;
          return sid.includes('cricket') || sname.includes('cricket');
        }
        if (isGully) {
          return sid.includes('gully') || sname.includes('gully');
        }
        return (
          sid === sp ||
          sid.replace(/[^a-z0-9]/g, '') === sp.replace(/[^a-z0-9]/g, '') ||
          sname === sp ||
          sname.replace(/[^a-z0-9]/g, '') === sp.replace(/[^a-z0-9]/g, '') ||
          sname.includes(sp) ||
          sid.includes(sp)
        );
      });
    }

    // 2. Filter by Event Title
    if (selectedEventTitleFilter && selectedEventTitleFilter !== 'all') {
      const ev = selectedEventTitleFilter.toLowerCase().trim();
      list = list.filter((s) => {
        const et = (s.eventTitle || '').toLowerCase().trim();
        return et === ev || et.includes(ev) || ev.includes(et);
      });
    }

    // 3. Filter by Gender: STRICT EXACT EQUALITY (Prevents 'MALE' matching 'FEMALE')
    if (selectedGenderFilter && selectedGenderFilter !== 'all') {
      const g = selectedGenderFilter.toUpperCase().trim();
      list = list.filter((s) => (s.gender || '').toUpperCase().trim() === g);
    }

    // 4. Filter by Format
    if (selectedFormatFilter && selectedFormatFilter !== 'all') {
      const fmt = selectedFormatFilter.toUpperCase().trim();
      list = list.filter((s) => {
        const mf = (s.matchFormat || '').toUpperCase().trim();
        if (fmt === 'SINGLE' || fmt === 'INDIVIDUAL' || fmt === 'SOLO') {
          return mf === 'SINGLE' || mf === 'INDIVIDUAL' || mf === 'SOLO';
        }
        if (fmt === 'DOUBLE' || fmt === 'DOUBLES' || fmt === 'DUO') {
          return mf === 'DOUBLE' || mf === 'DOUBLES' || mf === 'DUO';
        }
        if (fmt === 'TEAM') {
          return mf === 'TEAM';
        }
        return mf === fmt;
      });
    }

    // 5. Real-time Search query (athlete name, roll number, mobile, email, course, sport, event, team)
    // NOTE: Strictly never search gender here to avoid false substring matches!
    if (debouncedSearch && debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((s) =>
        (s.studentName && s.studentName.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.sportName && s.sportName.toLowerCase().includes(q)) ||
        (s.eventTitle && s.eventTitle.toLowerCase().includes(q)) ||
        (s.teamName && s.teamName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allStudents, selectedSportFilter, selectedEventTitleFilter, selectedGenderFilter, selectedFormatFilter, debouncedSearch]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedSportFilter('all');
    setSelectedEventTitleFilter('all');
    setSelectedGenderFilter('all');
    setSelectedFormatFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSportFilter !== 'all' ||
    selectedEventTitleFilter !== 'all' ||
    selectedGenderFilter !== 'all' ||
    selectedFormatFilter !== 'all';

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
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 10px; }
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
            <div class="summary-val">${filteredStudents.length}</div>
            <div class="summary-lbl">Listed Athletes</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${stats?.sportsCount || 0}</div>
            <div class="summary-lbl">Sports Entered</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${medalSummary?.gold || 0}🥇 ${medalSummary?.silver || 0}🥈</div>
            <div class="summary-lbl">Medals Won</div>
          </div>
          <div class="summary-box">
            <div class="summary-val">${medalSummary?.totalPoints || 0}</div>
            <div class="summary-lbl">Total Points</div>
          </div>
        </div>

        <h3>Registered Student Athletes (${filteredStudents.length})</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Reg Time</th>
              <th>Game & Event Title</th>
              <th>Team Name</th>
              <th>Student Name</th>
              <th>Mobile No</th>
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, idx) => {
              const isCap = (s.isCaptain === true || s.isCaptain === 1 || s.isCaptain === 'true' || s.isCaptain === '1');
              return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(s.regTime || '10:00 AM')}</strong><br><small style="color: #64748b;">${escapeHtml(s.regDate || '2026-08-10')}</small></td>
                <td><strong>${escapeHtml(s.sportName || 'N/A')}</strong><br><small style="color: #4f46e5;">${escapeHtml(s.eventTitle || 'Tournament Event')}</small></td>
                <td><strong>${escapeHtml(s.teamName || 'Individual')}</strong><br><small style="color: #6b21a8; font-weight: bold;">${escapeHtml(s.college || user?.college || 'MPEC')}</small></td>
                <td><strong>${escapeHtml(s.studentName || 'N/A')}</strong> ${isCap ? '<span style="color: #2563eb; font-weight: bold;">[Captain]</span>' : ''}<br><small style="color: #64748b;">Roll: ${escapeHtml(s.rollNumber || 'N/A')} • ${escapeHtml(s.email || 'N/A')}</small></td>
                <td>${escapeHtml(s.phone || 'N/A')}</td>
                <td><strong style="color: ${s.gender === 'MALE' ? '#2563eb' : '#e11d48'};">${escapeHtml(s.gender || 'MALE')}</strong></td>
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
    if (!filteredStudents.length) {
      addToast('No student records to export', 'error');
      return;
    }
    const exportData = filteredStudents.map((s, idx) => ({
      'S.No.': idx + 1,
      'Reg Time': s.regTime || '10:00 AM',
      'Game': s.subEvent && s.subEvent !== 'N/A' ? `Athletics (${s.subEvent})` : (s.sportName || 'N/A'),
      'Sub Event': s.subEvent && s.subEvent !== 'N/A' ? s.subEvent : 'N/A',
      'Event Title': s.eventTitle || `${s.sportName || 'Sport'} Championship`,
      'Match Format': s.matchFormat || 'Team',
      'Team Name': s.teamName || 'Individual',
      'College': s.college || user?.college || 'MPEC',
      'Student Name': s.studentName || 'N/A',
      'Role': (s.isCaptain === true || s.isCaptain === 1 || s.isCaptain === 'true' || s.isCaptain === '1') ? 'Captain' : 'Player',
      'Roll Number': s.rollNumber || 'N/A',
      'Course': s.course || 'N/A',
      'Year / Semester': s.yearSemester || s.year || 'N/A',
      'Mobile Number': s.phone || 'N/A',
      'Email Address': s.email || 'N/A',
      'Gender': s.gender || 'MALE',
      'Status': s.status || 'VERIFIED'
    }));

    exportToCSV(exportData, `${(user?.college || 'College').replace(/\s+/g, '_')}_Official_Roster_${new Date().toISOString().split('T')[0]}`);
    addToast('Official College Roster exported to CSV successfully!', 'success');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent text-[#211D2B] dark:text-[#F5F2FA] py-8 transition-colors font-spatial-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* COLLEGE HEAD WELCOME BANNER */}
        <div className="bg-[#FFFFFF] dark:bg-[#0D101A] rounded-3xl p-6 sm:p-8 mb-8 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7156A5]/5 dark:bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start sm:items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-[#7156A5] dark:bg-[#8B5CF6] text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#7156A5] dark:bg-[#8B5CF6] text-white uppercase tracking-wider font-mono">
                  {user.college}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> Read-Only Access
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-spatial-display uppercase tracking-wide text-[#211D2B] dark:text-[#F5F2FA]">
                {user.faculty_name || 'Sports Faculty Head'}
              </h1>
              <p className="text-xs text-[#686370] dark:text-[#AAA4B8] mt-0.5">
                Official College Sports Faculty Portal • Assigned Domain: <strong className="text-[#211D2B] dark:text-[#F5F2FA]">{user.college}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xs mb-8 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: Activity },
            { id: 'profile', label: 'Faculty Head Profile', icon: ShieldCheck },
            { id: 'students', label: `College Students (${allStudents.length})`, icon: Users },
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                    : 'text-[#686370] dark:text-[#AAA4B8] hover:bg-[#FAF9F6] dark:hover:bg-[#121625] hover:text-[#211D2B] dark:hover:text-[#F5F2FA]'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Representative</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{user.faculty_name || 'Sports Incharge'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned College Campus</span>
                  <span className="font-extrabold text-sm text-blue-600 dark:text-indigo-400">{user.college}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Portal Access Level</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">College Head (Read-Only)</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Athletes</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{allStudents.length} Athletes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Official
                  </span>
                </div>
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
                <p className="text-[11px] text-slate-500">Out of {ALL_12_SPORTS.length} tournament events</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Medals Won</span>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <span>🥇 {medalSummary?.gold || 0}</span>
                  <span>🥈 {medalSummary?.silver || 0}</span>
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
            
            {/* Search & Filter Controls */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              
              {/* Search Bar on Top */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${user.college} students by athlete name, roll number, mobile, email, team...`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Responsive 4 Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 1. Filter by Game */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    🎯 Filter by Game
                  </label>
                  <select
                    value={selectedSportFilter}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All 12 Sports</option>
                    {ALL_12_SPORTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter by Event Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    📋 Filter by Event Title
                  </label>
                  <select
                    value={selectedEventTitleFilter}
                    onChange={(e) => setSelectedEventTitleFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer truncate"
                  >
                    <option value="all">
                      All Created Events ({availableEvents.length})
                    </option>
                    {availableEvents.map((evTitle, idx) => (
                      <option key={idx} value={evTitle}>{evTitle}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Filter by Gender */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    ⚧️ Filter by Gender
                  </label>
                  <select
                    value={selectedGenderFilter}
                    onChange={(e) => setSelectedGenderFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Genders</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>

                {/* 4. Filter by Format */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    🎽 Filter by Format
                  </label>
                  <select
                    value={selectedFormatFilter}
                    onChange={(e) => setSelectedFormatFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="all">All Formats</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Team">Team</option>
                  </select>
                </div>

              </div>

              {/* Active Filter Badges & Reset Button */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold text-[11px]">Active Filters:</span>
                    {selectedSportFilter !== 'all' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Game: {ALL_12_SPORTS.find(s => s.id === selectedSportFilter)?.name || selectedSportFilter}
                      </span>
                    )}
                    {selectedEventTitleFilter !== 'all' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 truncate max-w-xs">
                        Event: {selectedEventTitleFilter}
                      </span>
                    )}
                    {selectedGenderFilter !== 'all' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Gender: {selectedGenderFilter}
                      </span>
                    )}
                    {selectedFormatFilter !== 'all' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Format: {selectedFormatFilter}
                      </span>
                    )}
                    {searchQuery.trim() !== '' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Search: "{searchQuery}"
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}

            </div>

            {/* Read-Only Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Showing {filteredStudents.length} of {allStudents.length} Student Athletes for {user.college}
                  </span>
                  {hasActiveFilters && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Filtered
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  OFFICIAL ROSTER • READ ONLY
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Reg Time</th>
                      <th className="p-4">Game & Event Title</th>
                      <th className="p-4">Team Name</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Mobile No</th>
                      <th className="p-4">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                          <div className="flex flex-col items-center justify-center gap-2 py-4">
                            <Users className="w-8 h-8 text-slate-400 opacity-50" />
                            <span>No registered students found for {user.college} matching the selected criteria.</span>
                            {hasActiveFilters && (
                              <button
                                onClick={handleResetFilters}
                                className="mt-2 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition cursor-pointer"
                              >
                                Clear All Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <tr key={student.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          {/* 1. Reg Time */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{student.regTime || '10:00 AM'}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{student.regDate || '2026-08-10'}</span>
                            </div>
                          </td>

                          {/* 2. Game & Event Title */}
                          <td className="p-4">
                            <div className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                              {student.sportName}
                            </div>
                            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                              {student.eventTitle || `${student.sportName} Championship`}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                (student.matchFormat || '').toUpperCase() === 'TEAM'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                  : (student.matchFormat || '').toUpperCase() === 'DOUBLE'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}>
                                {student.matchFormat || 'Single'}
                              </span>
                            </div>
                          </td>

                          {/* 3. Team Name */}
                          <td className="p-4">
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {student.teamName || 'Individual'}
                            </div>
                            <div className="mt-1">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                {student.college || user.college}
                              </span>
                            </div>
                          </td>

                          {/* 4. Student Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {student.studentName}
                              </span>
                              {student.isCaptain && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Captain
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                              Roll: {student.rollNumber || 'N/A'} • {student.email || 'N/A'}
                            </div>
                          </td>

                          {/* 5. Mobile No */}
                          <td className="p-4 whitespace-nowrap">
                            <a
                              href={student.phone && student.phone !== 'N/A' ? `tel:${student.phone}` : undefined}
                              className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition inline-flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{student.phone || 'N/A'}</span>
                            </a>
                          </td>

                          {/* 6. Gender */}
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              student.gender === 'MALE'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}>
                              {student.gender === 'MALE' ? '♂ MALE' : '♀ FEMALE'}
                            </span>
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
                <p className="text-xs text-slate-500 mt-1">Official medal standings across all {ALL_12_SPORTS.length} sports events</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <div className="text-3xl font-black">🥇 {medalSummary?.gold || 0}</div>
                  <div className="text-[11px] font-bold uppercase mt-1">Gold Medals</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <div className="text-3xl font-black">🥈 {medalSummary?.silver || 0}</div>
                  <div className="text-[11px] font-bold uppercase mt-1">Silver Medals</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-center text-xs font-bold">
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

      </div>
    </div>
  );
};
