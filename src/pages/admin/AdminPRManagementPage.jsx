import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import {
  FolderOpen,
  Folder,
  ImageIcon,
  Film,
  FileText,
  Eye,
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
  Maximize2,
  User,
  Calendar
} from 'lucide-react';

export const AdminPRManagementPage = () => {
  const { addToast } = useToast();
  const [folders, setFolders] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Folder Detail View State
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Lightbox Preview State
  const [previewMedia, setPreviewMedia] = useState(null);

  // Delete Confirmation State
  const [deletingItem, setDeletingItem] = useState(null); // { type: 'file' | 'folder', id, title }
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPRData();
  }, []);

  const fetchPRData = async () => {
    setLoading(true);
    try {
      const [folderList, filesList] = await Promise.all([
        adminApi.getPRMediaFolders(),
        adminApi.getPRMediaFiles()
      ]);
      setFolders(folderList || []);
      setMediaFiles(filesList || []);
    } catch (err) {
      addToast('Failed to load PR media management items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      if (deletingItem.type === 'file') {
        await adminApi.deletePRMediaFile(deletingItem.id);
        await fetchPRData();
        addToast('PR file deleted successfully', 'success');
      } else if (deletingItem.type === 'folder') {
        await adminApi.deletePRFolder(deletingItem.id);
        await fetchPRData();
        setSelectedFolder(null);
        addToast('PR Event Folder deleted successfully', 'success');
      }
      setDeletingItem(null);
    } catch (err) {
      addToast('Failed to delete item', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Active files inside Selected Folder or overall
  const activeFiles = selectedFolder
    ? mediaFiles.filter(f => f.folderId === selectedFolder.id || f.eventId === selectedFolder.id)
    : mediaFiles;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {selectedFolder && (
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Folders</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {selectedFolder ? selectedFolder.title : 'PR Media & Document Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedFolder
              ? `Event → ${selectedFolder.sport} → Folder Media Files`
              : 'Browse event media folders created by PR members, inspect files, preview & delete'}
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {selectedFolder ? `${activeFiles.length} Media Files` : `${folders.length} PR Folders`}
        </span>
      </div>

      {/* Content Rendering: Folders View OR File Media Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading PR media contents...</p>
        </div>
      ) : !selectedFolder ? (
        /* FOLDERS GRID VIEW */
        folders.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No PR Media Folders Found.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Folders created by PR members will appear here grouped by Event & Sport.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all group flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Folder className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                    <button
                      onClick={() => setDeletingItem({ type: 'folder', id: folder.id, title: folder.title })}
                      className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                      {folder.sport}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {folder.title}
                    </h3>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Uploader: {folder.prMember}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Date: {folder.date}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFolder(folder)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Open Folder ({folder.itemCount || 5} Files)</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* FILES MEDIA GRID VIEW */
        activeFiles.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No media files inside this PR folder.</p>
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block cursor-pointer"
            >
              ← Return to Folder List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                {/* Media Image Thumbnail / Preview */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={file.url}
                    alt={file.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewMedia(file)}
                      className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-blue-600 transition-colors cursor-pointer"
                      title="Preview Media"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-900/90 text-white hover:bg-emerald-500 transition-colors"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* File Information */}
                <div className="p-3.5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{file.title}</h4>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <p>By: {file.uploaderName || 'PR Member'}</p>
                    <p>Date: {file.uploadDate || '2026-08-08'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {file.mediaType || 'IMAGE'}
                    </span>
                    <button
                      onClick={() => setDeletingItem({ type: 'file', id: file.id, title: file.title })}
                      className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Lightbox Image Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white truncate">{previewMedia.title}</h3>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden bg-black rounded-xl">
              <img src={previewMedia.url} alt={previewMedia.title} className="max-h-[70vh] object-contain" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Uploaded by {previewMedia.uploaderName || 'PR Member'} on {previewMedia.uploadDate}</span>
              <a
                href={previewMedia.url}
                download
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title={deletingItem?.type === 'folder' ? 'Delete PR Media Folder' : 'Delete PR Media File'}
        message="Are you sure you want to delete this file/folder? This action cannot be undone."
        warningNote="Action is permanent and will remove media items from event highlights."
        confirmButtonText="Confirm Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};
