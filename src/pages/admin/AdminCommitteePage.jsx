import React, { useState, useEffect } from 'react';
import { committeeApi } from '../../services/committeeApi';
import { useToast } from '../../context/ToastContext';
import { CommitteeMemberModal } from '../../components/admin/CommitteeMemberModal';
import { CommitteeSessionModal } from '../../components/admin/CommitteeSessionModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import {
  GraduationCap,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CalendarRange,
  RotateCcw
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80';

export const AdminCommitteePage = () => {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberType, setMemberType] = useState('executiveCommittee'); // 'advisors' | 'executiveCommittee'
  const [confirmState, setConfirmState] = useState(null); // { sessionId?, type?, id?, variant, message }

  useEffect(() => {
    fetchData();
    const handler = () => fetchData(true);
    window.addEventListener('sems_committee_updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('sems_committee_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await committeeApi.getCommitteeData();
      setSessions(data || []);
      setSelectedSessionId((prev) => {
        if (prev && (data || []).some((s) => s.id === prev)) return prev;
        const active = (data || []).find((s) => s.isActive);
        return active?.id || (data && data[0]?.id) || null;
      });
    } catch (err) {
      addToast('Failed to load committee data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

  const handleSaveSession = async (formData) => {
    try {
      // Ensure only one active session
      const data = await committeeApi.getCommitteeData();
      const withSingleActive = formData.isActive
        ? data.map((s) => ({ ...s, isActive: s.id === formData.id ? true : false }))
        : data;
      setSessions(withSingleActive);

      const updated = await committeeApi.saveSession(formData);
      setSessions(updated);
      setSelectedSessionId(formData.id || updated[updated.length - 1]?.id || null);
      addToast(formData.id ? 'Session updated successfully!' : 'New session created!', 'success');
    } catch (err) {
      addToast('Failed to save session', 'error');
    }
  };

  const handleSaveMember = async (formData) => {
    try {
      const updated = await committeeApi.saveMember(selectedSessionId, memberType, formData);
      setSessions(updated);
      addToast(formData.id ? 'Member updated successfully!' : 'Member added successfully!', 'success');
    } catch (err) {
      addToast('Failed to save member', 'error');
    }
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    try {
      let updated;
      if (confirmState.type === 'session') {
        updated = await committeeApi.deleteSession(confirmState.id);
        addToast('Session deleted successfully!', 'success');
      } else {
        updated = await committeeApi.deleteMember(confirmState.sessionId, confirmState.type, confirmState.id);
        addToast('Member removed successfully!', 'success');
      }
      setSessions(updated);
    } catch (err) {
      addToast('Failed to delete', 'error');
    } finally {
      setConfirmState(null);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all committee data back to the default seeded team? This will overwrite your current edits.')) {
      return;
    }
    try {
      const updated = await committeeApi.resetCommitteeData();
      setSessions(updated);
      setSelectedSessionId(updated.find((s) => s.isActive)?.id || updated[0]?.id || null);
      addToast('Committee data reset to defaults!', 'success');
    } catch (err) {
      addToast('Failed to reset committee data', 'error');
    }
  };

  const openMemberModal = (type, member = null) => {
    setMemberType(type);
    setSelectedMember(member);
    setIsMemberModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading committee data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Executive Committee & Faculty Advisors</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage session-wise committee members — photo, name & position. Visible on the public About page.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all cursor-pointer"
            title="Reset all committee data to default"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={() => { setEditingSession(null); setIsSessionModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CalendarRange className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSessionId(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedSessionId === s.id
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>{s.label}</span>
            {s.isActive && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase">Active</span>
            )}
          </button>
        ))}
      </div>

      {!selectedSession ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <CalendarRange className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No session selected.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add a session (e.g. 2025-26) to start adding committee members.</p>
          <button
            onClick={() => { setEditingSession(null); setIsSessionModalOpen(true); }}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-2 inline-block cursor-pointer"
          >
            + Add First Session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Session Header Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <CalendarRange className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Session {selectedSession.label}
                  {selectedSession.isActive && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                      Current Active
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage committee and faculty for session {selectedSession.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingSession(selectedSession); setIsSessionModalOpen(true); }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-amber-500" /> Edit Session
              </button>
              <button
                onClick={() => setConfirmState({
                  type: 'session',
                  sessionId: selectedSession.id,
                  id: selectedSession.id,
                  message: `Delete Session ${selectedSession.label}? All associated committee & faculty members will be permanently removed.`
                })}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Session
              </button>
            </div>
          </div>

          {/* Executive Committee Section */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Executive Committee {selectedSession.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Office bearers & core coordinators (President, Secretary, etc.)</p>
                </div>
              </div>
              <button
                onClick={() => openMemberModal('executiveCommittee')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>

            {(!selectedSession.executiveCommittee || selectedSession.executiveCommittee.length === 0) ? (
              <div className="p-10 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No executive committee members yet.</p>
                <button
                  onClick={() => openMemberModal('executiveCommittee')}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-block cursor-pointer"
                >
                  + Add First Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                {selectedSession.executiveCommittee.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:border-amber-500/40 transition-all group shadow-sm"
                  >
                    <div className="relative w-full h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={member.image || FALLBACK_IMAGE}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-500 text-slate-950">
                        {member.role}
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1" title={member.name}>{member.name}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openMemberModal('executiveCommittee', member)}
                          className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Member"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmState({
                            type: 'executiveCommittee',
                            sessionId: selectedSession.id,
                            id: member.id,
                            message: `Delete ${member.name} from the executive committee?`
                          })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Faculty Advisors Section */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Faculty Advisors {selectedSession.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Faculty members guiding the sports tournament operations</p>
                </div>
              </div>
              <button
                onClick={() => openMemberModal('advisors')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Advisor
              </button>
            </div>

            {(!selectedSession.advisors || selectedSession.advisors.length === 0) ? (
              <div className="p-10 text-center space-y-2">
                <GraduationCap className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No faculty advisors added yet.</p>
                <button
                  onClick={() => openMemberModal('advisors')}
                  className="text-xs font-bold text-indigo-400 hover:underline inline-block cursor-pointer"
                >
                  + Add First Advisor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                {selectedSession.advisors.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden flex flex-col hover:border-indigo-500/40 transition-all group shadow-sm"
                  >
                    <div className="relative w-full h-40 overflow-hidden bg-slate-800">
                      <img
                        src={member.image || FALLBACK_IMAGE}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide bg-indigo-500/90 text-white">
                        {member.role}
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2 flex-1">
                      <h4 className="text-xs font-extrabold text-white line-clamp-1" title={member.name}>{member.name}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openMemberModal('advisors', member)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Advisor"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmState({
                            type: 'advisors',
                            sessionId: selectedSession.id,
                            id: member.id,
                            message: `Delete ${member.name} from the faculty advisors?`
                          })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Advisor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CommitteeSessionModal
        isOpen={isSessionModalOpen}
        session={editingSession}
        onSave={handleSaveSession}
        onClose={() => { setIsSessionModalOpen(false); setEditingSession(null); }}
      />

      <CommitteeMemberModal
        isOpen={isMemberModalOpen}
        member={selectedMember}
        onSave={handleSaveMember}
        onClose={() => { setIsMemberModalOpen(false); setSelectedMember(null); }}
      />

      <ConfirmationModal
        isOpen={!!confirmState}
        title={confirmState?.type === 'session' ? 'Delete Session' : 'Delete Member'}
        message={confirmState?.message}
        confirmButtonText={confirmState?.type === 'session' ? 'Delete Session' : 'Delete Member'}
        onConfirm={handleConfirm}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
};
