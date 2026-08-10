import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { AnnouncementFormModal } from '../../components/admin/AnnouncementFormModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Paperclip,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  FileText
} from 'lucide-react';

export const AdminAnnouncementsPage = () => {
  const { addToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      addToast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async (formData) => {
    try {
      const updated = await adminApi.saveAnnouncement(formData);
      setAnnouncements(updated);
      addToast(
        formData.id ? 'Announcement updated successfully' : 'Announcement created & published!',
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to save announcement', 'error');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const updated = await adminApi.toggleAnnouncementPublish(id);
      setAnnouncements(updated);
      addToast('Announcement publish status updated', 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const updated = await adminApi.deleteAnnouncement(deletingId);
      setAnnouncements(updated);
      addToast('Announcement deleted successfully', 'success');
      setDeletingId(null);
    } catch (err) {
      addToast('Failed to delete announcement', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Announcement Management</h1>
          <p className="text-xs text-slate-400">
            Publish notices and upload up to 2 PDF document attachments visible on public participant portals
          </p>
        </div>

        <button
          onClick={() => { setSelectedAnn(null); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Announcement Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-300">No Announcements Created Yet.</p>
          <p className="text-xs text-slate-500">Click "Create Announcement" to publish schedules & PDF guidelines.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase rounded ${
                        ann.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {ann.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{ann.publishDate || ann.date}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{ann.title}</h3>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTogglePublish(ann.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                      ann.isPublished
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {ann.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => { setSelectedAnn(ann); setIsFormOpen(true); }}
                    className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700"
                    title="Edit Announcement"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(ann.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{ann.description}</p>

              {/* PDF Document Attachments */}
              {ann.attachments && ann.attachments.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attached Documents ({ann.attachments.length}/2)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ann.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-400">{att.size || 'PDF Document'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {att.url && att.url !== '#' && (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-700 transition-colors"
                              title="Preview PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          <a
                            href={att.url || '#'}
                            download
                            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnnouncementFormModal
        isOpen={isFormOpen}
        announcement={selectedAnn}
        onSave={handleSaveAnnouncement}
        onClose={() => { setIsFormOpen(false); setSelectedAnn(null); }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingId)}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? It will no longer be visible to participants."
        confirmButtonText="Confirm Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
};
