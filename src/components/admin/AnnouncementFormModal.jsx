import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Upload, Trash2, Download, Eye, AlertCircle, CheckCircle2, 
  Loader2, Paperclip, Calendar, BookOpen, AlertTriangle, Sparkles 
} from 'lucide-react';
import { useConfirm } from '../../context/ConfirmContext';

const CATEGORY_OPTIONS = [
  {
    id: 'Schedule',
    label: 'Schedule',
    desc: 'Match timings, fixtures & venue changes',
    icon: Calendar,
    color: 'text-blue-500',
    borderActive: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30'
  },
  {
    id: 'Rules & Guidelines',
    label: 'Rules & Guidelines',
    desc: 'Tournament rulebooks, eligibility & conduct',
    icon: BookOpen,
    color: 'text-purple-500',
    borderActive: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30'
  },
  {
    id: 'Emergency & Safety',
    label: 'Emergency & Safety',
    desc: 'Urgent alerts, weather & medical notices',
    icon: AlertTriangle,
    color: 'text-rose-500',
    borderActive: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
  },
  {
    id: 'Event Highlight',
    label: 'Event Highlight',
    desc: 'Ceremony alerts, star matches & results',
    icon: Sparkles,
    color: 'text-amber-500',
    borderActive: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
  }
];

export const AnnouncementFormModal = ({ isOpen, announcement = null, onSave, onClose }) => {
  const { confirmDelete } = useConfirm();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Schedule',
    description: '',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-08-20',
    isPublished: true,
    attachments: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || isSubmitting) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (announcement) {
      setFormData({
        id: announcement.id,
        title: announcement.title || '',
        category: announcement.category || 'Schedule',
        description: announcement.description || '',
        publishDate: announcement.publishDate || new Date().toISOString().split('T')[0],
        expiryDate: announcement.expiryDate || '2026-08-20',
        isPublished: announcement.isPublished ?? true,
        attachments: announcement.attachments || []
      });
    } else {
      setFormData({
        title: '',
        category: 'Schedule',
        description: '',
        publishDate: new Date().toISOString().split('T')[0],
        expiryDate: '2026-08-20',
        isPublished: true,
        attachments: []
      });
    }
    setErrors({});
  }, [announcement, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.description.trim()) errs.description = 'Content description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.attachments.length + files.length > 2) {
      setErrors({ attachment: 'Maximum 2 PDF documents allowed per announcement!' });
      return;
    }

    files.forEach((file) => {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setErrors({ attachment: `"${file.name}" is not a PDF file! Only PDF documents are allowed.` });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ attachment: `"${file.name}" exceeds the maximum 10MB limit.` });
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        setFormData((prev) => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              id: `PDF-${Date.now()}-${Math.floor(Math.random() * 100)}`,
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
              uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              url: dataUrl
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });

    setErrors({});
  };

  const handleRemoveAttachment = async (id) => {
    const isConfirmed = await confirmDelete({
      title: 'Remove PDF Attachment',
      message: 'Are you sure you want to remove this PDF document attachment?'
    });
    if (!isConfirmed) return;
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(a => a.id !== id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setErrors({ api: err.message || 'Failed to save announcement' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans"
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {announcement ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Publish notice to participant portal with PDF attachments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {errors.api && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {errors.api}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Announcement Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Basketball Tournament Schedule & Venue Update"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.title && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.title}</p>}
            </div>

            {/* Target Category Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Section / Category *
                </label>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Active: {formData.category}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {CATEGORY_OPTIONS.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? cat.borderActive
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-bold">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          <span>{cat.label}</span>
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {cat.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description / Details *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter full notice text, rules, timing details..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
              {errors.description && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Publish Date</label>
                <input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* PDF Documents Upload Section */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>PDF Document Attachments (Max 2 PDFs)</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {formData.attachments.length} / 2 uploaded
                </span>
              </div>

              {errors.attachment && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.attachment}</span>
                </p>
              )}

              {/* List of current attachments */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{att.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{att.size || 'PDF Document'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {att.url && att.url !== '#' && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Preview PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Delete PDF attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {formData.attachments.length < 2 && (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <Upload className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                    Click to select PDF document
                  </span>
                  <span className="text-[10px] text-slate-500">Only PDF files up to 10MB</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Publish Immediately</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Make notice visible to public participant dashboard</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/90 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{announcement ? 'Update Announcement' : 'Publish Announcement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
