import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  FileCheck,
  X,
  AlertCircle,
  FolderPlus,
  Layers,
  Play
} from 'lucide-react';
import { galleryApi } from '../../services/galleryApi';
import { uploadMultipleFilesToCloudinary } from '../../services/cloudinaryService';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { useToast } from '../../context/ToastContext';

const YoutubeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const PRUploadPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('eventId');

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || '');
  const [uploadMode, setUploadMode] = useState('direct'); // 'direct' (Cloudinary Multi-Photo) | 'youtube' (YouTube Video Link)

  // Multi-File Upload Queue State (Photos only)
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

  // YouTube Video Link State
  const [singleTitle, setSingleTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
  const isValidYouTubeUrl = !!youtubeVideoId;

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

  // Handle multi-file selection from computer (strictly photos)
  const handleMultipleFilesChange = (e) => {
    const filesArray = Array.from(e.target.files || []);
    if (filesArray.length === 0) return;

    // Filter strictly for image files
    const imageFiles = filesArray.filter((file) => file.type.startsWith('image/'));
    const nonImageCount = filesArray.length - imageFiles.length;

    if (nonImageCount > 0) {
      showToast(`${nonImageCount} non-image file(s) were excluded. Video files are not supported for upload.`, 'warning');
    }

    if (imageFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const updatedFiles = [...selectedFiles, ...imageFiles];
    setSelectedFiles(updatedFiles);

    // Create preview object URLs
    const previews = updatedFiles.map((file) => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: 'image',
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

  // Main Submit Handler for Batch Photos & YouTube Video Upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEventId) {
      showToast('Please select or create an event album first.', 'error');
      return;
    }

    if (uploadMode === 'direct') {
      if (selectedFiles.length === 0) {
        showToast('Please select one or more photo files from your computer.', 'error');
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
        showToast(`Starting batch upload of ${selectedFiles.length} photo(s) to Cloudinary...`, 'info');

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
          'sems_gallery'
        );

        // Save each uploaded photo to the database/API with its public_id
        for (let i = 0; i < uploadedResults.length; i++) {
          const item = uploadedResults[i];

          let mediaTitle = '';
          if (useFilenameAsTitle) {
            const cleanName = item.fileOriginalName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            mediaTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          } else if (customBaseTitle.trim()) {
            mediaTitle = selectedFiles.length > 1 ? `${customBaseTitle.trim()} #${i + 1}` : customBaseTitle.trim();
          } else {
            mediaTitle = `Event Photo #${i + 1}`;
          }

          await galleryApi.uploadMedia({
            event_id: selectedEventId,
            media_type: 'image',
            title: mediaTitle,
            media_url: item.url,
            public_id: item.public_id || null,
          });
        }

        showToast(`Successfully uploaded & published ${uploadedResults.length} photo(s) to event album!`, 'success');
        handleClearQueue();
      } catch (err) {
        showToast(err.message || 'Failed to complete batch photo upload.', 'error');
      } finally {
        setUploadStatus((prev) => ({ ...prev, active: false }));
      }
    } else {
      // YOUTUBE VIDEO LINK MODE
      if (!singleTitle.trim()) {
        showToast('Please enter a Media Title / Caption for the YouTube video.', 'error');
        return;
      }

      if (!youtubeUrl.trim()) {
        showToast('Please enter a YouTube Video Link.', 'error');
        return;
      }

      const videoId = extractYouTubeVideoId(youtubeUrl.trim());
      if (!videoId) {
        showToast('Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)', 'error');
        return;
      }

      setUploadStatus((prev) => ({ ...prev, active: true }));
      try {
        const standardYtUrl = `https://www.youtube.com/watch?v=${videoId}`;
        await galleryApi.uploadMedia({
          event_id: selectedEventId,
          media_type: 'video',
          title: singleTitle.trim(),
          media_url: standardYtUrl,
        });

        showToast('YouTube Video Published Successfully!', 'success');
        setSingleTitle('');
        setYoutubeUrl('');
      } catch (err) {
        showToast('Failed to publish YouTube video.', 'error');
      } finally {
        setUploadStatus((prev) => ({ ...prev, active: false }));
      }
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#211D2B] dark:text-[#F5F2FA] transition-colors duration-200 font-spatial-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/pr/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7156A5] dark:text-[#B8A5E5] hover:underline mb-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to PR Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold font-spatial-display uppercase tracking-wide text-[#211D2B] dark:text-[#F5F2FA] flex items-center gap-3">
              <UploadCloud className="w-7 h-7 text-[#7156A5] dark:text-[#B8A5E5]" /> Multi-Photo & YouTube Media Center
            </h1>
            <p className="text-xs text-[#686370] dark:text-[#AAA4B8]">
              Upload multiple photos simultaneously from your computer to Cloudinary or link YouTube video highlights.
            </p>
          </div>
        </div>

        {/* Upload Mode Tabs */}
        <div className="flex rounded-2xl bg-[#FFFFFF] dark:bg-[#0D101A] p-1.5 border border-[#E5E1E8] dark:border-[rgba(184,165,229,0.16)] shadow-xs">
          <button
            type="button"
            onClick={() => setUploadMode('direct')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              uploadMode === 'direct'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#FAF9F6] dark:hover:bg-[#121625]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multiple Computer Photos Upload (Cloudinary)</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadMode('youtube')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              uploadMode === 'youtube'
                ? 'bg-[#7156A5] dark:bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20'
                : 'text-[#686370] dark:text-[#AAA4B8] hover:text-[#211D2B] dark:hover:text-[#F5F2FA] hover:bg-[#FAF9F6] dark:hover:bg-[#121625]'
            }`}
          >
            <YoutubeIcon className="w-4 h-4" />
            <span>YouTube Video Link</span>
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

              {/* DIRECT MULTI-PHOTO UPLOAD SECTION */}
              {uploadMode === 'direct' ? (
                <div className="space-y-5">

                  {/* Drag and Drop File Picker Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Select / Drop Multiple Photos (JPG, PNG, WEBP) *
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
                          Select Multiple Photos
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Hold <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl</code> or <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Shift</code> to pick multiple photos simultaneously.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
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
                          Selected Queue ({filePreviews.length} photos)
                        </span>
                        <button
                          type="button"
                          onClick={handleClearQueue}
                          className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
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
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveFileFromQueue(idx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
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
                /* YOUTUBE VIDEO LINK SECTION */
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Media Type *
                    </label>
                    <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-2.5">
                      <YoutubeIcon className="w-5 h-5 text-red-500" />
                      <span>YouTube Video (Stream / Match Highlights / Replay)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Media Title / Caption *
                    </label>
                    <input
                      type="text"
                      required
                      value={singleTitle}
                      onChange={(e) => setSingleTitle(e.target.value)}
                      placeholder="e.g. Football Championship Final Highlights"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        YouTube Video Link *
                      </label>
                      {youtubeUrl.trim() && (
                        isValidYouTubeUrl ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid YouTube Video
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Invalid YouTube URL
                          </span>
                        )
                      )}
                    </div>
                    <div className="relative">
                      <YoutubeIcon className="w-5 h-5 absolute left-3.5 top-3.5 text-red-500" />
                      <input
                        type="url"
                        required
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Supports standard watch URLs, shortlinks (<code className="font-mono text-[10px]">youtu.be</code>), live streams, and YouTube shorts.
                    </p>
                  </div>
                </div>
              )}

              {/* Batch Upload Progress Indicator */}
              {uploadStatus.active && (
                <div className="space-y-2 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 animate-fade-in">
                  <div className="flex justify-between text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    <span>
                      {uploadMode === 'direct'
                        ? `Uploading Photo ${uploadStatus.currentFileIndex} of ${uploadStatus.totalCount}: ${uploadStatus.currentFileName}`
                        : 'Publishing YouTube Video to Event Album...'}
                    </span>
                    {uploadMode === 'direct' && <span>{uploadStatus.overallPercent}%</span>}
                  </div>
                  {uploadMode === 'direct' && (
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 transition-all duration-300"
                        style={{ width: `${uploadStatus.overallPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploadStatus.active || events.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-black text-sm shadow-xl shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {uploadStatus.active ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {uploadMode === 'direct'
                      ? `Uploading Photos (${uploadStatus.overallPercent}%)...`
                      : 'Publishing YouTube Video...'}
                  </span>
                ) : (
                  <>
                    {uploadMode === 'direct' ? (
                      <>
                        <UploadCloud className="w-5 h-5" />
                        <span>Upload & Publish {selectedFiles.length > 0 ? `${selectedFiles.length} Photo(s)` : 'Photos'}</span>
                      </>
                    ) : (
                      <>
                        <YoutubeIcon className="w-5 h-5" />
                        <span>Publish YouTube Video</span>
                      </>
                    )}
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
                        <img src={p.url} alt="p" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : uploadMode === 'youtube' ? (
                  youtubeVideoId ? (
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        title={singleTitle || 'YouTube Video Preview'}
                        className="w-full h-full border-0 aspect-video rounded-2xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : youtubeUrl.trim() ? (
                    <div className="text-center p-6 text-amber-500 space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto opacity-80" />
                      <p className="text-xs font-bold">Invalid YouTube URL</p>
                      <p className="text-[11px] text-slate-400">Please enter a valid YouTube video link to preview.</p>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-2">
                      <YoutubeIcon className="w-8 h-8 mx-auto opacity-50 text-red-500" />
                      <p className="text-xs font-semibold">Paste a YouTube link to see video preview</p>
                    </div>
                  )
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Select photos to see batch preview summary</p>
                  </div>
                )}
              </div>

              {uploadMode === 'direct' && selectedFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {selectedFiles.length} Photo(s) Ready
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
                <span>Multi-Photo & YouTube Publishing</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                You can select multiple photos at once to upload directly to Cloudinary, or paste YouTube video links to publish live broadcasts and highlight clips to your event album.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
