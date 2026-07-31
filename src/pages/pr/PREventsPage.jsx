import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  ArrowLeft, 
  X, 
  Check, 
  Sparkles,
  Link as LinkIcon,
  UploadCloud,
  FileUp,
  FolderOpen,
  Eye
} from 'lucide-react';
import { galleryApi } from '../../services/galleryApi';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';
import { GoogleDriveImage } from '../../components/common/GoogleDriveImage';
import { getMediaPreviewUrl, getVideoThumbnailUrl } from '../../utils/googleDriveHelper';
import { useToast } from '../../context/ToastContext';

export const PREventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit' | 'manage_media' | null
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Manage Media Modal State
  const [eventMediaList, setEventMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Form State
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [coverImageMode, setCoverImageMode] = useState('upload'); // 'upload' | 'url'
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  
  // Upload State
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const coverFileInputRef = useRef(null);
  const { showToast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await galleryApi.getEvents();
      setEvents(data);
    } catch (err) {
      showToast('Failed to fetch events list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setSelectedEvent(null);
    setEventName('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setCoverImage('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80');
    setDescription('');
    setCoverImageMode('upload');
    setActiveModal('create');
  };

  const openEditModal = (eventItem) => {
    setSelectedEvent(eventItem);
    setEventName(eventItem.event_name);
    setEventDate(eventItem.event_date);
    setCoverImage(eventItem.cover_image);
    setDescription(eventItem.description || '');
    setCoverImageMode('url');
    setActiveModal('edit');
  };

  const openManageMediaModal = async (eventItem) => {
    setSelectedEvent(eventItem);
    setActiveModal('manage_media');
    setMediaLoading(true);
    try {
      const data = await galleryApi.getEventMedia(eventItem.id);
      setEventMediaList(data.all || []);
    } catch (err) {
      showToast('Failed to load event media items', 'error');
    } finally {
      setMediaLoading(false);
    }
  };

  // Direct Cover File Upload to Cloudinary
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setCoverProgress(0);
    try {
      showToast('Uploading cover image to Cloudinary...', 'info');
      const cloudRes = await uploadFileToCloudinary(file, (progress) => {
        setCoverProgress(progress);
      });
      setCoverImage(cloudRes.url);
      showToast('Cover image uploaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to upload cover image. Check Cloudinary settings.', 'error');
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
    }
  };

  // Delete Individual Photo or Video from Event
  const handleDeleteMediaItem = async (mediaId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this media item'}"?`)) {
      return;
    }

    try {
      await galleryApi.deleteMedia(mediaId);
      showToast('Media item deleted successfully', 'success');
      // Update local modal list
      setEventMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      fetchEvents();
    } catch (err) {
      showToast('Failed to delete media item', 'error');
    }
  };

  // Handle Event Create / Edit Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate || !coverImage.trim()) {
      showToast('Please fill in Event Name, Date, and Cover Image', 'error');
      return;
    }

    setSaving(true);
    try {
      if (activeModal === 'create') {
        await galleryApi.createEvent({
          event_name: eventName,
          event_date: eventDate,
          cover_image: coverImage,
          description,
        });
        showToast('Event Album Created Successfully!', 'success');
      } else if (activeModal === 'edit' && selectedEvent) {
        await galleryApi.updateEvent(selectedEvent.id, {
          event_name: eventName,
          event_date: eventDate,
          cover_image: coverImage,
          description,
        });
        showToast('Event Details Updated Successfully!', 'success');
      }
      setActiveModal(null);
      fetchEvents();
    } catch (err) {
      showToast('Failed to save event details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? All associated media will also be removed.`)) {
      return;
    }

    try {
      await galleryApi.deleteEvent(eventId);
      showToast('Event and associated media deleted', 'success');
      fetchEvents();
    } catch (err) {
      showToast('Failed to delete event', 'error');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/pr/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to PR Dashboard
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-orange-500" /> Event Albums Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create, edit, upload cover photos, and manage photos/videos in tournament event albums.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-black text-xs shadow-xl shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Event List / Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading tournament events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Events Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">Click below to create your first tournament event album.</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold"
            >
              Create Event Album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition flex flex-col justify-between"
              >
                {/* Cover Image Container */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <GoogleDriveImage
                    src={event.cover_image}
                    alt={event.event_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {event.event_date}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-lg font-black leading-tight line-clamp-1">
                      {event.event_name}
                    </h3>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {event.description || 'No description provided for this event.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4 text-emerald-500" /> {event.photos_count || 0} Photos
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4 text-orange-500" /> {event.videos_count || 0} Videos
                      </span>
                    </div>

                    <button
                      onClick={() => openManageMediaModal(event)}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-extrabold"
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Manage & Delete Media
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      to={`/pr/upload?eventId=${event.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1"
                    >
                      <UploadCloud className="w-4 h-4" /> Upload
                    </Link>
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      title="Edit Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.event_name)}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL 1: CREATE / EDIT EVENT (Compact Height Max-H 85vh) */}
        {(activeModal === 'create' || activeModal === 'edit') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 relative max-h-[85vh] overflow-y-auto">
              
              <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  {activeModal === 'create' ? 'Create New Event Album' : 'Edit Event Details'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Football Championship 2026"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* COVER IMAGE UPLOAD / URL SECTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Event Cover Page Image *
                    </label>
                    <div className="flex items-center gap-2 text-[11px] font-extrabold">
                      <button
                        type="button"
                        onClick={() => setCoverImageMode('upload')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          coverImageMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImageMode('url')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          coverImageMode === 'url' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Paste URL
                      </button>
                    </div>
                  </div>

                  {coverImageMode === 'upload' ? (
                    <div>
                      <div
                        onClick={() => coverFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-950/50 cursor-pointer space-y-1"
                      >
                        <FileUp className="w-6 h-6 text-blue-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Click to upload cover image from computer
                        </p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WEBP</p>
                        <input
                          ref={coverFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileUpload}
                          className="hidden"
                        />
                      </div>

                      {uploadingCover && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-blue-500">
                            <span>Uploading cover image...</span>
                            <span>{coverProgress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${coverProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="url"
                        required
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/... or Google Drive URL"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {coverImage && (
                    <div className="h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative">
                      <GoogleDriveImage
                        src={coverImage}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-white">
                        Cover Preview
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide brief details about this tournament event..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingCover}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-md"
                  >
                    {saving ? 'Saving...' : activeModal === 'create' ? 'Create Event' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: MANAGE & DELETE EVENT MEDIA ITEMS */}
        {activeModal === 'manage_media' && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative max-h-[85vh] flex flex-col">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                    Manage Media for "{selectedEvent.event_name}"
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    View and delete photos or videos uploaded to this event album.
                  </p>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {mediaLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400">Loading media items...</div>
                ) : eventMediaList.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                    <p className="text-sm font-bold">No photos or videos uploaded to this event yet.</p>
                    <Link
                      to={`/pr/upload?eventId=${selectedEvent.id}`}
                      onClick={() => setActiveModal(null)}
                      className="inline-block text-xs font-bold text-blue-500 hover:underline mt-2"
                    >
                      + Upload First Media Item
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {eventMediaList.map((media) => (
                      <div
                        key={media.id}
                        className="bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between group relative"
                      >
                        <div className="relative h-36 bg-slate-900 overflow-hidden">
                          {media.media_type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-950 text-orange-400">
                              <GoogleDriveImage
                                src={getVideoThumbnailUrl(media.media_url, media.cover_image)}
                                alt={media.title}
                                className="w-full h-full object-cover opacity-80"
                              />
                              <Video className="w-8 h-8 absolute z-10" />
                            </div>
                          ) : (
                            <GoogleDriveImage
                              src={media.media_url}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Delete Media Button */}
                          <button
                            onClick={() => handleDeleteMediaItem(media.id, media.title)}
                            className="absolute top-2 right-2 p-2 rounded-xl bg-rose-600 text-white opacity-90 hover:opacity-100 hover:scale-110 transition shadow-lg"
                            title="Delete Image / Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-3 text-xs space-y-1">
                          <p className="font-extrabold text-slate-900 dark:text-white truncate">
                            {media.title || 'Untitled Media'}
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            {media.media_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">
                  Total: {eventMediaList.length} Media Item(s)
                </span>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
