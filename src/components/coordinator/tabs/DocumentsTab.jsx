import React, { useState } from 'react';
import { FileText, Upload, Download, Trash2, CheckCircle2, FileCode, Plus, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export const DocumentsTab = ({ documents, user, onUpdateDocuments }) => {
  const { addToast } = useToast();

  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Rulebook');
  const [fileName, setFileName] = useState('');

  const handleUploadDocument = (e) => {
    e.preventDefault();
    if (!docTitle || !fileName) {
      addToast('Please enter document title and select/type filename', 'error');
      return;
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      category: docCategory,
      fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      uploadDate: new Date().toISOString().split('T')[0],
      size: '1.5 MB',
    };

    onUpdateDocuments([newDoc, ...documents]);
    addToast(`Document "${docTitle}" uploaded successfully for ${user?.sportName}!`, 'success');
    setDocTitle('');
    setFileName('');
  };

  const handleDeleteDoc = (id) => {
    const doc = documents.find((d) => d.id === id);
    if (window.confirm(`Are you sure you want to delete file "${doc?.title}"?`)) {
      const updated = documents.filter((d) => d.id !== id);
      onUpdateDocuments(updated);
      addToast('Document deleted successfully', 'info');
    }
  };

  const handleDownloadDoc = (doc) => {
    addToast(`Downloading ${doc.fileName}...`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Upload Document Form */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-5 h-5 text-orange-500" /> Upload Official {user?.sportName} PDF Documents
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload official rulebooks, fixture PDFs, schedule PDFs, circulars, and referee guidelines.
        </p>

        <form onSubmit={handleUploadDocument} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Official Rulebook 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
            >
              <option value="Rulebook">Rulebook PDF</option>
              <option value="Fixture PDF">Fixture PDF</option>
              <option value="Schedule PDF">Schedule PDF</option>
              <option value="Circular">Official Circular</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              PDF File Name
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="rules_2026.pdf"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-soft space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Uploaded Documents Library ({documents.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((d) => (
            <div key={d.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">{d.title}</h5>
                  <p className="text-[10px] text-slate-400">{d.category} • {d.fileName} ({d.size})</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownloadDoc(d)}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white transition"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteDoc(d.id)}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                  title="Delete File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
