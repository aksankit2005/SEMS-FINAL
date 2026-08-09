import React, { useState } from 'react';
import { UserCheck, Search, Filter, Download, CheckCircle, Clock } from 'lucide-react';

export const SuperAdminParticipantsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('ALL');

  const SAMPLE_PARTICIPANTS = [
    { id: 'REG-1001', name: 'Aarav Sharma', college: 'MPEC Kanpur', sport: 'Badminton', category: 'Singles', rollNo: '2100970100012', status: 'VERIFIED', feePaid: '₹300' },
    { id: 'REG-1002', name: 'Vikramjit Singh', college: 'PSIT Kanpur', sport: 'Cricket', category: 'Team Captain', rollNo: '2100970100045', status: 'VERIFIED', feePaid: '₹1200' },
    { id: 'REG-1003', name: 'Ananya Roy', college: 'KIET Ghaziabad', sport: 'Table Tennis', category: 'Doubles', rollNo: '2200970100088', status: 'PENDING', feePaid: '₹600' },
    { id: 'REG-1004', name: 'Rohan Verma', college: 'MPEC Kanpur', sport: 'Football', category: 'Team Member', rollNo: '2100970100099', status: 'VERIFIED', feePaid: '₹1500' },
    { id: 'REG-1005', name: 'Kavya Gupta', college: 'HBTU Kanpur', sport: 'Chess', category: 'Individual', rollNo: '2300970100015', status: 'VERIFIED', feePaid: '₹200' }
  ];

  const handleExportCSV = () => {
    const headers = ['Registration ID', 'Student Name', 'College', 'Sport', 'Category', 'Roll No', 'Status', 'Fee Paid'];
    const rows = SAMPLE_PARTICIPANTS.map(p => [
      p.id, `"${p.name}"`, `"${p.college}"`, p.sport, p.category, p.rollNo, p.status, p.feePaid
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SEMS_Participants_Master_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = SAMPLE_PARTICIPANTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rollNo.includes(searchQuery);

    const matchesSport = sportFilter === 'ALL' || p.sport === sportFilter;
    return matchesSearch && matchesSport;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>Master Participants Roster</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Global view of all registered student teams, player verification & fee receipts across colleges
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export Master List (CSV)</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student name, college or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Sports</option>
            <option value="Badminton">Badminton</option>
            <option value="Cricket">Cricket</option>
            <option value="Football">Football</option>
            <option value="Table Tennis">Table Tennis</option>
            <option value="Chess">Chess</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Reg ID & Student Name</th>
                <th className="p-4">College & Roll No</th>
                <th className="p-4">Sport & Category</th>
                <th className="p-4">Fee Status</th>
                <th className="p-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white text-sm">{item.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{item.id}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-300">{item.college}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{item.rollNo}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-purple-300 block">{item.sport}</span>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </td>
                  <td className="p-4 font-semibold text-emerald-400">{item.feePaid}</td>
                  <td className="p-4">
                    {item.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> PENDING
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
