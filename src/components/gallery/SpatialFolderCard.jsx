import React from 'react';
import { Folder, Calendar, Image as ImageIcon, Video } from 'lucide-react';
import { GoogleDriveImage } from '../common/GoogleDriveImage';
import { useTheme } from '../../context/ThemeContext';

export const SpatialFolderCard = ({ event, index, onOpenEvent, mediaItems = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const archiveIndex = String(index + 1).padStart(2, '0');

  // Gather up to 3 preview prints from actual event media, falling back to cover image
  const relatedMedia = mediaItems.filter(
    (m) => m.event_id === event.id || (m.event_name && m.event_name === event.event_name)
  );

  const card1Url = event.cover_image || (relatedMedia[0] && relatedMedia[0].media_url);
  const card2Url = (relatedMedia[0] && relatedMedia[0].media_url) || event.cover_image;
  const card3Url = (relatedMedia[1] && relatedMedia[1].media_url) || card2Url || event.cover_image;

  const photosCount = event.photos_count || 0;
  const videosCount = event.videos_count || 0;

  const KNOWN_SPORTS = [
    'Football', 'Cricket', 'Badminton', 'Basketball', 'Athletics',
    'Volleyball', 'Kabaddi', 'Chess', 'Table Tennis', 'Kho Kho', 'Tug of War'
  ];

  const getSportCategory = () => {
    if (event.category && event.category.toLowerCase() !== 'general') {
      return event.category.toUpperCase();
    }
    const name = (event.event_name || '').toLowerCase();
    for (const sport of KNOWN_SPORTS) {
      if (name.includes(sport.toLowerCase())) {
        return sport.toUpperCase();
      }
    }
    return '';
  };

  const categoryTag = getSportCategory();

  const handleClick = (e) => {
    e.preventDefault();
    if (onOpenEvent) {
      onOpenEvent(event);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer spatial-folder-container transition-all duration-500 transform hover:-translate-y-2 select-none"
    >
      {/* ─── PHYSICAL FOLDER TAB ROW (TOP) ─── */}
      <div className="flex items-end justify-between px-1">
        {/* Physical Top Folder Tab */}
        <div className={`spatial-folder-tab px-5 py-2 border-t border-l rounded-tl-2xl flex items-center gap-2 shadow-xl backdrop-blur-xl transition-colors ${
          isDark 
            ? 'bg-[#141724] border-white/15 text-slate-200' 
            : 'bg-slate-100 border-slate-300 text-slate-800'
        }`}>
          <Folder className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <span className="text-[10px] font-black tracking-widest uppercase font-spatial-sans">
            FOLDER // {archiveIndex}
          </span>
        </div>

        {/* Dynamic Category/Sport Tag on Top Right */}
        {categoryTag && (
          <span className={`text-[11px] font-bold tracking-wider font-spatial-sans pb-1.5 uppercase ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {categoryTag}
          </span>
        )}
      </div>

      {/* ─── MAIN FOLDER BODY ─── */}
      <div className={`rounded-b-3xl rounded-tr-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-500 ${
        isDark ? 'spatial-glass-card-dark' : 'spatial-glass-card-light'
      }`}>
        
        {/* Subtle Ambient Radial Glow on Hover */}
        <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDark 
            ? 'bg-indigo-500/10 group-hover:bg-indigo-500/20' 
            : 'bg-blue-500/5 group-hover:bg-blue-500/15'
        }`} />

        {/* Top Dynamic Media Badges */}
        <div className="flex items-center justify-between relative z-10 mb-2">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-bold ${
              isDark 
                ? 'bg-white/5 border-white/10 text-slate-300' 
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <ImageIcon className={`w-3 h-3 ${isDark ? 'text-sky-400' : 'text-blue-500'}`} />
              <span>{photosCount} Photos</span>
            </span>

            {videosCount > 0 && (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-bold ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-slate-300' 
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <Video className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <span>{videosCount} Videos</span>
              </span>
            )}
          </div>

          {/* Dynamic Event Date */}
          {event.event_date && (
            <span className={`flex items-center gap-1 text-[11px] font-bold font-spatial-sans ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{event.event_date}</span>
            </span>
          )}
        </div>

        {/* ─── 3D LANDSCAPE FINE-ART PRINT STACK (WIDE RECTANGLE) ─── */}
        <div className="relative w-full h-52 sm:h-60 flex items-center justify-center my-5">
          {/* Floor Shadow Under Stack */}
          <div className="absolute bottom-1 w-64 sm:w-72 h-8 bg-black/70 blur-xl rounded-full" />

          {/* BACK PRINT */}
          <div className="absolute w-60 h-38 sm:w-72 sm:h-44 md:w-80 md:h-48 fine-art-card-landscape folder-stack-back-landscape bg-slate-950">
            <GoogleDriveImage
              src={card3Url}
              alt={event.event_name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-60 pointer-events-none" />
          </div>

          {/* MIDDLE PRINT */}
          <div className="absolute w-60 h-38 sm:w-72 sm:h-44 md:w-80 md:h-48 fine-art-card-landscape folder-stack-middle-landscape bg-slate-950">
            <GoogleDriveImage
              src={card2Url}
              alt={event.event_name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/15" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-60 pointer-events-none" />
          </div>

          {/* FRONT PRINT */}
          <div className="absolute w-60 h-38 sm:w-72 sm:h-44 md:w-80 md:h-48 fine-art-card-landscape folder-stack-front-landscape bg-slate-950">
            <GoogleDriveImage
              src={card1Url}
              alt={event.event_name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none" />
          </div>
        </div>

        {/* ─── CARD DETAILS & METADATA (PURE DYNAMIC) ─── */}
        <div className="relative z-10 space-y-2.5 pt-1">
          <div>
            {/* Dynamic Event Name */}
            <h3 className={`text-xl sm:text-2xl font-black tracking-wide leading-tight font-spatial-display uppercase transition-colors duration-300 ${
              isDark 
                ? 'text-white group-hover:text-amber-200' 
                : 'text-slate-900 group-hover:text-blue-600'
            }`}>
              {event.event_name}
            </h3>

            {/* Dynamic Event Description (No static fallback) */}
            {event.description && (
              <p className={`text-xs line-clamp-2 mt-1.5 font-spatial-sans font-normal leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {event.description}
              </p>
            )}
          </div>

          {/* Clean Action Footer (No static "Curated by" text) */}
          <div className={`pt-3 border-t flex items-center justify-between ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <span className={`text-[11px] font-semibold tracking-wide ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {photosCount + videosCount} Total Items
            </span>

            <span className={`text-xs font-black tracking-wider flex items-center gap-1 font-spatial-sans uppercase transition-colors ${
              isDark 
                ? 'text-slate-200 group-hover:text-amber-300' 
                : 'text-slate-800 group-hover:text-blue-600'
            }`}>
              View Album <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
