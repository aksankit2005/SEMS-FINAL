import React, { useState } from 'react';
import { Users, Download, ShieldCheck, Trash2, Search, Award, BarChart2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV } from '../../../utils/pdfExporter';

export const GullyCricketTotalParticipationTab = ({ registrations = [], user, onUpdateRegistrations, globalSearch = '' }) => {
  const { addToast } = useToast();
  
  // Team Management State
  const [teams, setTeams] = useState([
    { id: 'TEAM-1', teamName: 'Gully Smashers', captain: 'Dr. Nikhil Arora', players: '7 Players', status: 'VERIFIED' },
    { id: 'TEAM-2', teamName: 'Street Kings', captain: 'Tushar Saxena', players: '6 Players', status: 'VERIFIED' },
  ]);

  // Player Database State
  const [players, setPlayers] = useState([
    { id: 'PL-1', playerName: 'Dr. Nikhil Arora', team: 'Gully Smashers', jerseyNumber: '1', role: 'Batsman', contact: '+91 9876543210' },
    { id: 'PL-2', playerName: 'Tushar Saxena', team: 'Street Kings', jerseyNumber: '7', role: 'All-Rounder', contact: '+91 9876543211' },
    { id: 'PL-3', playerName: 'Rohit Sharma Jr', team: 'Gully Smashers', jerseyNumber: '45', role: 'Batsman', contact: '+91 9876543212' },
    { id: 'PL-4', playerName: 'Jasprit Bumrah Jr', team: 'Street Kings', jerseyNumber: '93', role: 'Bowler', contact: '+91 9876543213' },
  ]);

  // Cricket Statistics Cards
  const statsCards = [
    { label: 'Highest Team Score', value: '78/2 (6 ov)', team: 'Gully Smashers' },
    { label: 'Most Runs', value: '142 Runs', player: 'Dr. Nikhil Arora' },
    { label: 'Most Wickets', value: '11 Wickets', player: 'Jasprit Bumrah Jr' },
    { label: 'Best Bowling', value: '4/8 (2 ov)', player: 'Tushar Saxena' },
    { label: 'Most Sixes', value: '12 Sixes', player: 'Rohit Sharma Jr' },
    { label: 'Most Fours', value: '18 Fours', player: 'Dr. Nikhil Arora' },
  ];

  const [search, setSearch] = useState('');

  const filteredPlayers = players.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.playerName || '').toLowerCase().includes(q) || (p.team || '').toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* STATISTICS CARDS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Cricket Statistics</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1 shadow-sm">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 truncate block">{stat.label}</span>
              <p className="text-xl font-black text-orange-600 dark:text-orange-400 tracking-tight">{stat.value}</p>
              <span className="text-[10px] font-mono text-slate-400 truncate block">{stat.player || stat.team || ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TEAM MANAGEMENT TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Team Management</h3>
          <button
            onClick={() => {
              exportToCSV(teams, 'Gully_Cricket_Team_Management');
              addToast('Exported Team Management list to CSV', 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Teams
          </button>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500">
              <tr>
                <th className="p-4">Team Name</th>
                <th className="p-4">Captain</th>
                <th className="p-4">Players</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {teams.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="p-4 font-black text-slate-900 dark:text-white">{t.teamName}</td>
                  <td className="p-4">{t.captain}</td>
                  <td className="p-4 font-mono">{t.players}</td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLAYER DATABASE TABLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">Player Database</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player name, team, role..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-xs"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500">
              <tr>
                <th className="p-4">Player Name</th>
                <th className="p-4">Team</th>
                <th className="p-4">Jersey Number</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-mono">No players found in database.</td>
                </tr>
              ) : (
                filteredPlayers.map(pl => (
                  <tr key={pl.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="p-4 font-black text-slate-900 dark:text-white">{pl.playerName}</td>
                    <td className="p-4 font-bold text-orange-600 dark:text-orange-400">{pl.team}</td>
                    <td className="p-4 font-mono">#{pl.jerseyNumber}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {pl.role}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">{pl.contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
