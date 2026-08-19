import React, { useState, useEffect } from 'react';
import { X, User, Upload, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80';

export const CommitteeMemberModal = ({ isOpen, member = null, defaultOrder = 1, onSave, onClose }) => {
  const [formData, setFormData] = useState({ name: '', role: '', image: '', publicId: '', sortOrder: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({
        id: member.id,
        name: member.name || '',
        role: member.role || '',
        image: member.image || '',
        publicId: member.publicId || '',
        sortOrder: member.sortOrder !== undefined ? member.sortOrder : defaultOrder
      });
    } else {
      setFormData({ name: '', role: '', image: '', publicId: '', sortOrder: defaultOrder });
    }
    setError('');
    setIsUploading(false);
    setUploadProgress(0);
  }, [member, isOpen, defaultOrder]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: false } }));
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const cloudRes = await uploadFileToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      }, 'sems_committee');

      setFormData((prev) => ({
        ...prev,
        image: cloudRes.url,
        publicId: cloudRes.public_id || ''
      }));
    } catch (err) {
      console.error('Photo upload failed:', err);
      setError(err.message || 'Failed to upload photo to Cloudinary. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Member name is required!');
      return;
    }
    if (!formData.role.trim()) {
      setError('Position / role is required!');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {member ? 'Edit Member' : 'Add New Member'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Set photo, name & position</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Preview + Upload */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative flex items-center justify-center">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center gap-1 text-indigo-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-[10px] font-bold">{uploadProgress}%</span>
                </div>
              ) : formData.image ? (
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Member Photo</label>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5">
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: FALLBACK_IMAGE, publicId: '' })}
                    className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                  >
                    Use placeholder
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Directly uploaded to Cloudinary. Leave empty to use default avatar.</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Praveen Rai"
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Position / Role & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Position / Role *</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. President, Secretary, Faculty Advisor"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Display Order #</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                placeholder="1"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
