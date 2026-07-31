import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  ArrowLeft,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  Info,
  Play,
  FileCheck,
  Plus,
  FileUp,
  X,
  AlertCircle,
  FolderPlus,
  Layers,
  Check
} from 'lucide-react';
import { galleryApi } from '../../services/galleryApi';
import { uploadMultipleFilesToCloudinary, uploadFileToCloudinary } from '../../services/cloudinaryService';
import { getMediaPreviewUrl, getVideoEmbedUrl } from '../../utils/googleDriveHelper';
import { useToast } from '../../context/ToastContext';

export const PRUploadPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('eventId');

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || '');
  const [uploadMode, setUploadMode] = useState('direct'); // 'direct' (Cloudinary Multi-file) | 'drive' (Google Drive Link)

  // Cloudinary Settings State
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [cloudNameInput, setCloudNameInput] = useState(localStorage.getItem('sems_cloudinary_cloud') || 'lnrkt6qp');
  const [presetInput, setPresetInput] = useState(localStorage.getItem('sems_cloudinary_preset') || 'ml_default');

  // Multi-File Upload Queue State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [customBaseTitle, setCustomBaseTitle] = useState('');
  const [useFilenameAsTitle, setUseFilenameAsTitle] = useState(true);

  // Batch Progress Tracking
  const [uploadStatus, setUploadStatus] = useState({
    active: false,
    currentFileIndex: 0,
    totalCount: 0,
    currentFileName: '',
    overallPercent: 0,
  });

  // Google Drive Link State
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [singleTitle, setSingleTitle] = useState('');
  const [driveUrl, setDriveUrl] = useState('');

  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const list = await galleryApi.getEvents();
        setEvents(list);
        if (list.length > 0 && !selectedEventId) {
          setSelectedEventId(list[0].id.toString());
        }
      } catch (err) {
        showToast('Failed to load events list', 'error');
      }
    };
    loadEvents();
  }, []);

  // Handle multi-file selection from computer
  const handleMultipleFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    if (filesArray.length === 0) return;

    // Append to existing selected files or set new
    const updatedFiles = [...selectedFiles, ...filesArray];
    setSelectedFiles(updatedFiles);

    // Create preview object URLs
    const previews = updatedFiles.map((file) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
    }));

    setFilePreviews(previews);
  };

  const handleRemoveFileFromQueue = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);

    // Clean up previews
    if (filePreviews[index]?.url) {
      URL.revokeObjectURL(filePreviews[index].url);
    }
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFilePreviews(updatedPreviews);
  };

  const handleClearQueue = () => {
    filePreviews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setSelectedFiles([]);
    setFilePreviews([]);
    setCustomBaseTitle('');
    setUploadStatus({ active: false, currentFileIndex: 0, totalCount: 0, currentFileName: '', overallPercent: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Main Submit Handler for Batch & Single Upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEventId) {
      showToast('Please select or create an event album first.', 'error');
      return;
    }

    if (uploadMode === 'direct') {
      if (selectedFiles.length === 0) {
        showToast('Please select one or more image/video files from your computer.', 'error');
        return;
      }

      setUploadStatus({
        active: true,
        currentFileIndex: 1,
        totalCount: selectedFiles.length,
        currentFileName: selectedFiles[0].name,
        overallPercent: 0,
      });

      try {
        localStorage.setItem('sems_cloudinary_cloud', cloudNameInput);
        localStorage.setItem('sems_cloudinary_preset', presetInput);

        showToast(`Starting batch upload of ${selectedFiles.length} file(s) to Cloudinary...`, 'info');

        const uploadedResults = await uploadMultipleFilesToCloudinary(
          selectedFiles,
          (progress) => {
            setUploadStatus({
              active: true,
              currentFileIndex: progress.currentFileIndex || 1,
              totalCount: progress.totalCount,
              currentFileName: progress.currentFileName || '',
              overallPercent: progress.overallPercent || 0,
            });
          },
          presetInput
        );

        // Save each uploaded item to the database/API
        for (let i = 0; i < uploadedResults.length; i++) {
          const item = uploadedResults[i];

          let mediaTitle = '';
          if (useFilenameAsTitle) {
            const cleanName = item.fileOriginalName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            mediaTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          } else if (customBaseTitle.trim()) {
            mediaTitle = selectedFiles.length > 1 ? `${customBaseTitle.trim()} #${i + 1}` : customBaseTitle.trim();
          } else {
            mediaTitle = `Event Shot #${i + 1}`;
          }

          await galleryApi.uploadMedia({
            event_id: selectedEventId,
            media_type: item.resource_type === 'video' ? 'video' : 'image',
            title: mediaTitle,
            media_url: item.url,
          });
        }

        showToast(`Successfully uploaded & published ${uploadedResults.length} file(s) to event album!`, 'success');
        handleClearQueue();
      } catch (err) {
        showToast(err.message || 'Failed to complete batch upload.', 'error');
      } finally {
        setUploadStatus((prev) => ({ ...prev, active: false }));
      }
    } else {
      // GOOGLE DRIVE LINK MODE
      if (!singleTitle.trim() || !driveUrl.trim()) {
        showToast('Please enter both Title and Google Drive Media URL.', 'error');
        return;
      }

      setUploadStatus((prev) => ({ ...prev, active: true }));
      try {
        await galleryApi.uploadMedia({
          event_id: selectedEventId,
          media_type: mediaType,
          title: singleTitle,
          media_url: driveUrl,
        });

        showToast(`Media (${mediaType.toUpperCase()}) Published Successfully!`, 'success');
        setSingleTitle('');
        setDriveUrl('');
      } catch (err) {
        showToast('Failed to save Google Drive media item.', 'error');
      } finally {
        setUploadStatus((prev) => ({ ...prev, active: false }));
      }
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <Link
            to="/pr/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to PR Dashboard
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-orange-500" /> Multi-Image & Media Upload Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload multiple photos and videos simultaneously from your computer to Cloudinary or link via Google Drive.
          </p>
        </div>

        {/* Upload Mode Tabs */}
        <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-900 p-1.5 border border-slate-300 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setUploadMode('direct')}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${uploadMode === 'direct'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multiple Computer Files Upload (Cloudinary)</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadMode('drive')}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${uploadMode === 'drive'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Google Drive / Link URL</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Upload Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-soft space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Event Album Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Target Event Album *
                  </label>
                  <Link
                    to="/pr/events"
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> + Create New Event
                  </Link>
                </div>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {events.length === 0 ? (
                    <option value="">No event albums found. Create an event first.</option>
                  ) : (
                    events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        🏆 {ev.event_name} ({ev.event_date})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* DIRECT MULTI-FILE UPLOAD SECTION */}
              {uploadMode === 'direct' ? (
                <div className="space-y-5">

                  {/* Drag and Drop File Picker Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Select / Drop Multiple Image & Video Files *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-500/40 hover:border-blue-600 dark:border-slate-700 dark:hover:border-blue-400 rounded-3xl p-8 text-center bg-blue-50/20 dark:bg-slate-950/50 hover:bg-blue-50/40 transition cursor-pointer space-y-3 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Layers className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          Select Multiple Images & Videos
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Hold <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl</code> or <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Shift</code> to pick multiple photos simultaneously.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMultipleFilesChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Selected File Queue Grid */}
                  {filePreviews.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Selected Queue ({filePreviews.length} files)
                        </span>
                        <button
                          type="button"
                          onClick={handleClearQueue}
                          className="text-xs font-bold text-rose-500 hover:underline"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {filePreviews.map((file, idx) => (
                          <div
                            key={idx}
                            className="relative group h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800"
                          >
                            {file.type === 'video' ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-2 text-center">
                                <Video className="w-5 h-5 text-orange-400 mb-1" />
                                <span className="text-[9px] font-bold truncate max-w-full">{file.name}</span>
                              </div>
                            ) : (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveFileFromQueue(idx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title Customizer for Batch */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Title Naming Mode
                    </label>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="namingMode"
                          checked={useFilenameAsTitle}
                          onChange={() => setUseFilenameAsTitle(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Use File Names as Titles</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="namingMode"
                          checked={!useFilenameAsTitle}
                          onChange={() => setUseFilenameAsTitle(false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Custom Base Title</span>
                      </label>
                    </div>

                    {!useFilenameAsTitle && (
                      <input
                        type="text"
                        value={customBaseTitle}
                        onChange={(e) => setCustomBaseTitle(e.target.value)}
                        placeholder="e.g. Football Championship Action Shot"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                      />
                    )}
                  </div>

                </div>
              ) : (
                /* GOOGLE DRIVE LINK SECTION */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Media Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMediaType('image')}
                        className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition ${mediaType === 'image'
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <ImageIcon className="w-4 h-4" /> Photo (JPG, PNG, WEBP)
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaType('video')}
                        className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition ${mediaType === 'video'
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <Video className="w-4 h-4" /> Video (MP4, MOV, WEBM)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Media Title / Caption *
                    </label>
                    <input
                      type="text"
                      value={singleTitle}
                      onChange={(e) => setSingleTitle(e.target.value)}
                      placeholder="e.g. Winning Trophy Moment"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Google Drive Link / Direct Media URL *
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="url"
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="Paste Google Drive share URL (e.g. https://drive.google.com/file/d/...)"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Batch Upload Progress Indicator */}
              {uploadStatus.active && (
                <div className="space-y-2 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 animate-fade-in">
                  <div className="flex justify-between text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    <span>
                      Uploading File {uploadStatus.currentFileIndex} of {uploadStatus.totalCount}: {uploadStatus.currentFileName}
                    </span>
                    <span>{uploadStatus.overallPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 transition-all duration-300"
                      style={{ width: `${uploadStatus.overallPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploadStatus.active || events.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-black text-sm shadow-xl shadow-blue-600/25 transition flex items-center justify-center gap-2"
              >
                {uploadStatus.active ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading Batch ({uploadStatus.overallPercent}%)...
                  </span>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    <span>
                      {uploadMode === 'direct'
                        ? `Upload & Publish ${selectedFiles.length > 0 ? selectedFiles.length : ''} File(s)`
                        : 'Upload & Publish Google Drive Link'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-6">

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" /> Batch Preview Summary
              </h3>

              <div className="h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                {uploadMode === 'direct' && filePreviews.length > 0 ? (
                  <div className="w-full h-full grid grid-cols-2 gap-1.5 p-2 overflow-hidden bg-slate-950">
                    {filePreviews.slice(0, 4).map((p, i) => (
                      <div key={i} className="relative h-full w-full rounded-xl overflow-hidden bg-slate-800">
                        {p.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-orange-400">
                            <Video className="w-6 h-6" />
                          </div>
                        ) : (
                          <img src={p.url} alt="p" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : uploadMode === 'drive' && driveUrl ? (
                  mediaType === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center mb-2 shadow-lg">
                        <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                      </div>
                      <span className="text-xs font-bold truncate max-w-full">{singleTitle || 'Video Title'}</span>
                      <span className="text-[10px] text-slate-400 mt-1">Google Drive Link</span>
                    </div>
                  ) : (
                    <img
                      src={getMediaPreviewUrl(driveUrl)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Select files to see batch preview summary</p>
                  </div>
                )}
              </div>

              {uploadMode === 'direct' && selectedFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {selectedFiles.length} File(s) Ready
                  </span>
                  <span className="text-[10px] text-blue-500 font-black uppercase">
                    Cloudinary Batch
                  </span>
                </div>
              )}
            </div>

            {/* Batch Upload Instructions */}
            <div className="bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-transparent p-6 rounded-3xl border border-blue-500/20 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Multi-Image Upload Enabled</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                You can select dozens of images and videos at once. All files will be uploaded directly to Cloudinary and published to your chosen event album in one click.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
