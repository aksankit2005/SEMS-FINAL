import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Image as ImageIcon, 
  Video, 
  Download, 
  Eye, 
  X, 
  Play, 
  Camera, 
  Grid, 
  Layers, 
  FolderOpen, 
  Sparkles,
  Plus
} from 'lucide-react';
import { galleryApi } from '../services/galleryApi';
import { getVideoThumbnailUrl, triggerMediaDownload } from '../utils/googleDriveHelper';
import { extractYouTubeVideoId } from '../utils/youtube';
import { GoogleDriveImage } from '../components/common/GoogleDriveImage';
import { AdvancedLightboxViewer } from '../components/gallery/AdvancedLightboxViewer';
import { SpatialFolderCard } from '../components/gallery/SpatialFolderCard';
import { SpatialCoverFlow } from '../components/gallery/SpatialCoverFlow';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/spatialGallery.css';

export const GalleryPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [events, setEvents] = useState([]);
  const [allMediaItems, setAllMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('albums'); // 'albums' | 'stream'

  // Selected event album
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventMedia, setEventMedia] = useState({ photos: [], videos: [], all: [] });
  const [mediaTab, setMediaTab] = useState('all'); // 'all' | 'image' | 'video'
  const [mediaLoading, setMediaLoading] = useState(false);

  // View style inside album: 'coverflow' (3D Apple Vision Pro) vs 'grid' (Spatial Grid)
  const [albumDisplayMode, setAlbumDisplayMode] = useState('coverflow');

  // Lightbox State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [lightboxItems, setLightboxItems] = useState([]);

  const { showToast } = useToast();

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

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = (ev.event_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || (ev.event_name || '').toLowerCase().includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const displayedAlbumMedia = eventMedia.all.filter((item) => {
    if (mediaTab === 'image') return (item.media_type || '').toLowerCase() === 'image';
    if (mediaTab === 'video') return (item.media_type || '').toLowerCase() === 'video';
    return true;
  });

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

  useEffect(() => {
    if (selectedEvent) {
      window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: true } }));
      document.body.style.overflow = 'hidden';
    } else {
      window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: false } }));
      document.body.style.overflow = '';
    }
    return () => {
      window.dispatchEvent(new CustomEvent('sems_layout_toggle', { detail: { hide: false } }));
      document.body.style.overflow = '';
    };
  }, [selectedEvent]);

  const handleReturnToFolders = () => {
    setSelectedEvent(null);
  };

  return (
    <div className={`relative min-h-screen font-spatial-sans selection:bg-amber-500/30 selection:text-white overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      
      {/* ─── ATMOSPHERIC NEBULA BACKDROP (Dark vs Light) ─── */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-700 ${
        isDark ? 'spatial-nebula-dark' : 'spatial-nebula-light'
      }`} />

      {/* ─── TACTILE FILM GRAIN OVERLAY ─── */}
      <div className="fixed inset-0 spatial-grain-overlay z-[1]" />

      {/* =========================================================================
          VIEW 2: FULLSCREEN IMMERSIVE ALBUM OPEN EXPERIENCE (Image 2)
          ========================================================================= */}
      {selectedEvent ? (
        <div className={`fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-5 lg:p-6 overflow-hidden select-none transition-colors ${
          isDark ? 'spatial-nebula-dark text-slate-100' : 'spatial-nebula-light text-slate-900'
        }`}>
          
          {/* Top Context Navbar Capsule */}
          <div className={`w-full max-w-7xl mx-auto rounded-full px-5 sm:px-7 py-3 sm:py-3.5 flex items-center justify-between gap-4 shadow-2xl z-30 transition-all ${
            isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
          }`}>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleReturnToFolders}
                className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 border border-white/15 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                }`}
              >
                <span>← All Folders</span>
              </button>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              <span className={`px-3 py-1 rounded-full border text-[11px] font-black tracking-wider shrink-0 ${
                isDark ? 'bg-white/10 border-white/15 text-amber-300' : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                {displayedAlbumMedia.length} Frames
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className={`hidden lg:flex items-center gap-1 p-1 rounded-full border ${
                isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setMediaTab('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    mediaTab === 'all' 
                      ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({eventMedia.all.length})
                </button>
                <button
                  onClick={() => setMediaTab('image')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    mediaTab === 'image' 
                      ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Photos ({eventMedia.photos.length})
                </button>
                <button
                  onClick={() => setMediaTab('video')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    mediaTab === 'video' 
                      ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Videos ({eventMedia.videos.length})
                </button>
              </div>

              <div className={`flex items-center p-0.5 rounded-full border ${
                isDark ? 'bg-black/50 border-white/15' : 'bg-slate-100 border-slate-300'
              }`}>
                <button
                  onClick={() => setAlbumDisplayMode('coverflow')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    albumDisplayMode === 'coverflow'
                      ? isDark ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-md' : 'bg-slate-900 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">3D Flow</span>
                </button>

                <button
                  onClick={() => setAlbumDisplayMode('grid')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    albumDisplayMode === 'grid'
                      ? isDark ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-md' : 'bg-slate-900 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Stage */}
          <div className="flex-1 flex flex-col justify-center my-auto">
            {mediaLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className={`w-12 h-12 border-4 border-t-amber-400 rounded-full animate-spin ${
                  isDark ? 'border-white/20' : 'border-slate-300'
                }`} />
                <p className={`text-xs font-black tracking-widest uppercase ${
                  isDark ? 'text-amber-300' : 'text-slate-700'
                }`}>
                  Opening Spatial Archive...
                </p>
              </div>
            ) : displayedAlbumMedia.length === 0 ? (
              <div className={`text-center py-24 rounded-3xl p-8 max-w-lg mx-auto ${
                isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
              }`}>
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className={`text-lg font-bold font-spatial-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No Media in this Tab
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Select another filter tab or return to all archives.
                </p>
              </div>
            ) : albumDisplayMode === 'coverflow' ? (
              <SpatialCoverFlow
                items={displayedAlbumMedia}
                onOpenLightbox={openLightbox}
                event={selectedEvent}
              />
            ) : (
              <div className="max-w-7xl mx-auto w-full py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedAlbumMedia.map((item, idx) => {
                  const isItemVideo = (item.media_type || '').toLowerCase() === 'video' || extractYouTubeVideoId(item.media_url);
                  const imageSrc = isItemVideo 
                    ? getVideoThumbnailUrl(item.media_url, item.cover_image) 
                    : item.media_url;

                  return (
                    <div
                      key={item.id || idx}
                      className={`group rounded-3xl overflow-hidden flex flex-col justify-between relative transition-all duration-300 ${
                        isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
                      }`}
                    >
                      <div
                        onClick={() => openLightbox(displayedAlbumMedia, idx)}
                        className="relative h-64 overflow-hidden bg-slate-950 cursor-pointer"
                      >
                        <GoogleDriveImage
                          src={imageSrc}
                          alt={item.title || 'Archive print'}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                        {isItemVideo && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-amber-500/90 backdrop-blur-md flex items-center justify-center text-slate-950 shadow-2xl border border-white/30 group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white shadow-xl inline-flex border border-white/20">
                            <Eye className="w-4 h-4" />
                          </span>
                        </div>
                      </div>

                      <div className={`p-4 flex items-center justify-between gap-3 border-t ${
                        isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <div className="space-y-0.5 truncate">
                          <h4 className={`text-xs font-black truncate font-spatial-display uppercase ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {item.title || 'APEX Print'}
                          </h4>
                          <span className={`text-[10px] uppercase font-bold font-spatial-sans ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {item.media_type || 'Photo'} • APEX PR
                          </span>
                        </div>

                        {!isItemVideo && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerMediaDownload(item.media_url, `${item.title || 'photo'}.jpg`);
                              showToast('Download started...', 'info');
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                              isDark 
                                ? 'bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border-white/10' 
                                : 'bg-white hover:bg-slate-900 hover:text-white text-slate-700 border-slate-300'
                            }`}
                            title="Download Photo"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* =========================================================================
            VIEW 1: FOLDER / ALBUMS SHOWCASE (Matches Reference Screenshot 2 Exactly)
            ========================================================================= */
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">

          {/* ─── CENTERED LUXURY HERO BANNER (Matches Screenshot 2 Exactly) ─── */}
          <div className="text-center max-w-3xl mx-auto space-y-3.5 pt-4">
            {/* Top Ambient Pill Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
              isDark 
                ? 'bg-[#151722] border-white/10 text-slate-300' 
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <span>✦ SPATIAL VISUAL SANCTUARY • 2026 COLLECTION</span>
            </div>

            {/* Luxury Title: VISUAL ARCHIVES */}
            <h1 className={`text-4xl sm:text-6xl md:text-7xl font-normal tracking-[0.08em] font-spatial-display uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              VISUAL ARCHIVES
            </h1>

            {/* Centered Italic Subtitle */}
            <p className={`text-xs sm:text-sm max-w-xl mx-auto italic font-spatial-sans font-light leading-relaxed ${
              isDark ? 'text-slate-300/85' : 'text-slate-600'
            }`}>
              Curated aesthetic portfolios spanning classical Mediterranean epochs, alpine horizons, and luminous nightscapes.
            </p>
          </div>

          {/* ─── CATEGORY FILTER PILLS (With Warm Amber Glowing Ring on Active - Screenshot 2) ─── */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'border border-amber-500/80 bg-amber-500/15 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.35)] scale-105'
                        : 'bg-slate-900 text-white shadow-md scale-105'
                      : isDark
                        ? 'bg-[#10121a] hover:bg-[#181a24] text-slate-300 border border-white/10 hover:border-white/20'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* ─── VIEW 1: TACTILE PHYSICAL 3D FOLDER CARDS WITH WIDE LANDSCAPE PRINTS ─── */}
          {viewMode === 'albums' && (
            <section className="space-y-8 pt-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`h-96 rounded-3xl animate-pulse ${
                      isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
                    }`} />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className={`text-center py-24 rounded-3xl p-8 max-w-lg mx-auto ${
                  isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
                }`}>
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className={`text-lg font-bold font-spatial-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    No Event Archives Found
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Try adjusting your search query or selecting another category filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredEvents.map((event, index) => (
                    <SpatialFolderCard
                      key={event.id}
                      event={event}
                      index={index}
                      onOpenEvent={handleOpenEvent}
                      mediaItems={allMediaItems}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ─── GLOBAL STREAM VIEW ─── */}
          {viewMode === 'stream' && (
            <section className="space-y-8">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className={`h-64 rounded-3xl animate-pulse ${
                      isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
                    }`} />
                  ))}
                </div>
              ) : displayedStreamMedia.length === 0 ? (
                <div className={`text-center py-24 rounded-3xl p-8 max-w-lg mx-auto ${
                  isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
                }`}>
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className={`text-lg font-bold font-spatial-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    No Media Uploads Found
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Upload photos and videos via the PR Portal or switch to Event Folders.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {displayedStreamMedia.map((item, idx) => {
                    const isItemVideo = (item.media_type || '').toLowerCase() === 'video' || extractYouTubeVideoId(item.media_url);
                    const imageSrc = isItemVideo 
                      ? getVideoThumbnailUrl(item.media_url, item.cover_image) 
                      : item.media_url;

                    return (
                      <div
                        key={item.id || idx}
                        className={`group rounded-3xl overflow-hidden flex flex-col justify-between relative transition-all duration-300 ${
                          isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
                        }`}
                      >
                        <div
                          onClick={() => openLightbox(displayedStreamMedia, idx)}
                          className="relative h-56 overflow-hidden bg-slate-950 cursor-pointer"
                        >
                          <GoogleDriveImage
                            src={imageSrc}
                            alt={item.title || 'Stream item'}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                          {isItemVideo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-amber-500/90 backdrop-blur-md flex items-center justify-center text-slate-950 shadow-2xl border border-white/30 group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide z-10 shadow-md">
                                Video Clip
                              </span>
                            </div>
                          )}

                          {item.event_name && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-black/80 backdrop-blur-md text-white border border-white/10 truncate max-w-[70%]">
                              🏆 {item.event_name}
                            </span>
                          )}

                          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="p-1.5 rounded-full bg-white/20 text-white shadow-xl inline-flex border border-white/20 backdrop-blur-md">
                              <Eye className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>

                        <div className={`p-3.5 flex items-center justify-between gap-2 border-t ${
                          isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-50'
                        }`}>
                          <div className="space-y-0.5 truncate">
                            <h4 className={`text-xs font-bold truncate font-spatial-display uppercase ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {item.title || 'Archive item'}
                            </h4>
                            <span className={`text-[10px] font-semibold font-spatial-sans ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {item.event_date || 'APEX Official'}
                            </span>
                          </div>

                          {!isItemVideo && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerMediaDownload(item.media_url, `${item.title || 'media'}.jpg`);
                                showToast('Download started...', 'info');
                              }}
                              className={`p-2 rounded-xl font-bold text-xs transition shrink-0 cursor-pointer border ${
                                isDark 
                                  ? 'bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border-white/10' 
                                  : 'bg-white hover:bg-slate-900 hover:text-white text-slate-700 border-slate-300'
                              }`}
                              title="Download Photo"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
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
  );
};
