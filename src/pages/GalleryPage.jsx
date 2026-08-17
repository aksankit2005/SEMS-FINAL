import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  Image as ImageIcon, 
  Video, 
  Download, 
  Eye, 
  X, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  Play, 
  Film,
  Camera,
  Sparkles,
  ShieldCheck,
  Grid,
  Layers,
  FolderOpen,
  Filter
} from 'lucide-react';
import { galleryApi } from '../services/galleryApi';
import { getMediaPreviewUrl, getGoogleDriveFallbackUrl, getVideoThumbnailUrl, getVideoEmbedUrl, triggerMediaDownload } from '../utils/googleDriveHelper';
import { GoogleDriveImage } from '../components/common/GoogleDriveImage';
import { AdvancedLightboxViewer } from '../components/gallery/AdvancedLightboxViewer';
import { useToast } from '../context/ToastContext';

export const GalleryPage = () => {
  const [events, setEvents] = useState([]);
  const [allMediaItems, setAllMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('albums'); // 'albums' | 'stream'

  // Active selected event album (null = album grid view, event object = album detail view)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventMedia, setEventMedia] = useState({ photos: [], videos: [], all: [] });
  const [mediaTab, setMediaTab] = useState('all'); // 'all' | 'image' | 'video'
  const [mediaLoading, setMediaLoading] = useState(false);

  // Lightbox / Video Modal State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [lightboxItems, setLightboxItems] = useState([]);

  const { showToast } = useToast();

  // Load all event albums and all media items
  const loadGalleryData = async () => {
    setLoading(true);
    try {
      const [eventsList, mediaList] = await Promise.all([
        galleryApi.getEvents(),
        galleryApi.getAllMedia().catch(() => [])
      ]);
      setEvents(eventsList || []);
      setAllMediaItems(mediaList || []);
    } catch (err) {
      showToast('Failed to load gallery content', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryData();

    const handleUpdate = () => {
      loadGalleryData();
    };

    window.addEventListener('sems_events_updated', handleUpdate);
    window.addEventListener('sems_media_updated', handleUpdate);
    return () => {
      window.removeEventListener('sems_events_updated', handleUpdate);
      window.removeEventListener('sems_media_updated', handleUpdate);
    };
  }, []);

  // Open event album detail view
  const handleOpenEvent = async (eventItem) => {
    setSelectedEvent(eventItem);
    setMediaLoading(true);
    try {
      const details = await galleryApi.getEventById(eventItem.id);
      setEventMedia({
        all: details.media || [],
        photos: details.photos || [],
        videos: details.videos || [],
      });
    } catch (err) {
      showToast('Failed to load event media content', 'error');
    } finally {
      setMediaLoading(false);
    }
  };

  // Filter events based on search & category
  const filteredEvents = events.filter((ev) => {
    const matchesSearch = (ev.event_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || (ev.event_name || '').toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Filter current event media items based on selected tab
  const displayedAlbumMedia = eventMedia.all.filter((item) => {
    if (mediaTab === 'image') return (item.media_type || '').toLowerCase() === 'image';
    if (mediaTab === 'video') return (item.media_type || '').toLowerCase() === 'video';
    return true;
  });

  // Filter all media stream items
  const displayedStreamMedia = allMediaItems.filter((item) => {
    const titleMatch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const eventMatch = (item.event_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || eventMatch;

    const matchesCategory = activeCategory === 'All' || 
      (item.event_name || '').toLowerCase().includes(activeCategory.toLowerCase()) ||
      (item.title || '').toLowerCase().includes(activeCategory.toLowerCase());

    const matchesType = mediaTab === 'all' || (item.media_type || '').toLowerCase() === mediaTab;

    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ['All', 'Football', 'Cricket', 'Basketball', 'Athletics', 'Badminton', 'Volleyball', 'Kabaddi', 'Chess'];

  const openLightbox = (items, index) => {
    setLightboxItems(items);
    setActiveLightboxIndex(index);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Gallery Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 p-8 sm:p-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
              <Camera className="w-4 h-4 text-orange-300" /> APEX 2026 Official Sports Gallery
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {selectedEvent ? selectedEvent.event_name : 'Event-Based Sports Gallery'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
              {selectedEvent
                ? selectedEvent.description || 'Explore official high-resolution photos, action shots, and video highlights from this event.'
                : 'Browse official event albums, high-definition action photographs, and tournament match video highlights across 12 inter-college sports.'}
            </p>

            {selectedEvent ? (
              <button
                onClick={() => setSelectedEvent(null)}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Event Albums
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setViewMode('albums')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                    viewMode === 'albums'
                      ? 'bg-white text-slate-950 shadow-xl'
                      : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" /> Event Albums ({events.length})
                </button>
                <button
                  onClick={() => setViewMode('stream')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                    viewMode === 'stream'
                      ? 'bg-white text-slate-950 shadow-xl'
                      : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                  }`}
                >
                  <Layers className="w-4 h-4" /> All Photos & Videos Stream ({allMediaItems.length})
                </button>
              </div>
            )}
          </div>

          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-12 translate-y-12">
            <Trophy className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* ─── CONTROLS BAR: Category Filters & Search ─── */}
        {!selectedEvent && (
          <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={viewMode === 'albums' ? 'Search event albums...' : 'Search photos & videos...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-soft"
                />
              </div>
            </div>

            {/* Media Type Sub-Filter for Stream View */}
            {viewMode === 'stream' && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">Filter Type:</span>
                <button
                  onClick={() => setMediaTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                    mediaTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  All Media
                </button>
                <button
                  onClick={() => setMediaTab('image')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
                    mediaTab === 'image'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Photos Only
                </button>
                <button
                  onClick={() => setMediaTab('video')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 ${
                    mediaTab === 'video'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> Videos Only
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── VIEW 1: EVENT ALBUMS GRID ─── */}
        {!selectedEvent && viewMode === 'albums' && (
          <div className="space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Event Albums Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search query or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleOpenEvent(event)}
                    className="group relative h-80 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-2xl transition cursor-pointer flex flex-col justify-between"
                  >
                    {/* Cover Image */}
                    <GoogleDriveImage
                      src={event.cover_image}
                      alt={event.event_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Top Date Badge */}
                    <div className="relative z-10 p-5 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white flex items-center gap-1 shadow-md">
                        <Calendar className="w-3 h-3" /> {event.event_date}
                      </span>
                    </div>

                    {/* Bottom Title & Media Count Badges */}
                    <div className="relative z-10 p-6 text-white space-y-3">
                      <h3 className="text-xl font-black leading-tight tracking-tight group-hover:text-blue-400 transition">
                        {event.event_name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-xs font-bold">
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px]">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> {event.photos_count || 0} Photos
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px]">
                            <Video className="w-3.5 h-3.5 text-orange-400" /> {event.videos_count || 0} Videos
                          </span>
                        </div>

                        <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-600 transition">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── VIEW 2: ALL PHOTOS & VIDEOS STREAM (DIRECT VIEW) ─── */}
        {!selectedEvent && viewMode === 'stream' && (
          <div className="space-y-8 animate-fade-in">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : displayedStreamMedia.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Media Uploads Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload photos and videos via the PR Portal or switch to Event Albums.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedStreamMedia.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition flex flex-col justify-between relative"
                  >
                    {/* Media Thumbnail */}
                    <div
                      onClick={() => openLightbox(displayedStreamMedia, idx)}
                      className="relative h-56 overflow-hidden bg-slate-950 cursor-pointer"
                    >
                      {item.media_type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white relative">
                          <GoogleDriveImage
                            src={getVideoThumbnailUrl(item.media_url, item.cover_image)}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />
                          <div className="w-12 h-12 rounded-full bg-orange-500/90 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl relative z-10 border border-white/20">
                            <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                          </div>
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white uppercase tracking-wide z-10 shadow-md">
                            Video Clip
                          </span>
                        </div>
                      ) : (
                        <GoogleDriveImage
                          src={item.media_url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Event Tag Top Left */}
                      {item.event_name && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-white border border-white/10 truncate max-w-[70%]">
                          🏆 {item.event_name}
                        </span>
                      )}

                      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="p-1.5 rounded-full bg-blue-600 text-white shadow-xl inline-flex">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Media Card Details & Download Button */}
                    <div className="p-3.5 flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5 truncate">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {item.event_date || 'APEX Official'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerMediaDownload(item.media_url, `${item.title || 'media'}.${item.media_type === 'video' ? 'mp4' : 'jpg'}`);
                          showToast('Download started...', 'info');
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition shrink-0"
                        title="Download Photo / Video"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── VIEW 3: EVENT DETAIL ALBUM CONTENT ─── */}
        {selectedEvent && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Filter Tabs: All / Photos / Videos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMediaTab('all')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
                    mediaTab === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  All Media ({eventMedia.all.length})
                </button>
                <button
                  onClick={() => setMediaTab('image')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
                    mediaTab === 'image'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> Photos ({eventMedia.photos.length})
                </button>
                <button
                  onClick={() => setMediaTab('video')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 ${
                    mediaTab === 'video'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Video className="w-4 h-4" /> Videos ({eventMedia.videos.length})
                </button>
              </div>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                📅 Event Date: {selectedEvent.event_date}
              </span>
            </div>

            {/* Media Grid */}
            {mediaLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : displayedAlbumMedia.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Media Items in this Tab</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check back later or select another tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedAlbumMedia.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-xl transition flex flex-col justify-between relative"
                  >
                    {/* Media Display Thumbnail / Card */}
                    <div
                      onClick={() => openLightbox(displayedAlbumMedia, idx)}
                      className="relative h-64 overflow-hidden bg-slate-950 cursor-pointer"
                    >
                      {item.media_type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white relative">
                          <GoogleDriveImage
                            src={getVideoThumbnailUrl(item.media_url, item.cover_image)}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />

                          <div className="w-14 h-14 rounded-full bg-orange-500/90 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl relative z-10 border border-white/20">
                            <Play className="w-7 h-7 fill-white text-white ml-1" />
                          </div>
                          <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white uppercase tracking-wide z-10 shadow-md">
                            Video Match Clip
                          </span>
                        </div>
                      ) : (
                        <GoogleDriveImage
                          src={item.media_url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Cover Photo Badge if applicable */}
                      {item.is_cover && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider shadow-md">
                          ⭐ Cover Photo
                        </span>
                      )}

                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="p-2 rounded-full bg-blue-600 text-white shadow-xl inline-flex">
                          <Eye className="w-4 h-4" />
                        </span>
                      </div>
                    </div>

                    {/* Media Title & Download Button Footer */}
                    <div className="p-4 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5 truncate">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {item.media_type} • APEX PR
                        </span>
                      </div>

                      {/* Download Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerMediaDownload(item.media_url, `${item.title}.${item.media_type === 'video' ? 'mp4' : 'jpg'}`);
                          showToast('Download started...', 'info');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                        title="Download Photo / Video"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ─── ADVANCED FULLSCREEN LIGHTBOX & CAROUSEL VIEWER ─── */}
        {activeLightboxIndex !== null && (
          <AdvancedLightboxViewer
            mediaList={lightboxItems}
            initialIndex={activeLightboxIndex}
            onClose={() => setActiveLightboxIndex(null)}
          />
        )}

      </div>
    </div>
  );
};
