import React, { useState } from 'react';
import { Image, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_DATA } from '../data/galleryData';

export const GalleryPage = () => {
  const [selectedCat, setSelectedCat] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const categories = ['All', 'Cricket', 'Football', 'Basketball', 'Badminton', 'Chess', 'Athletics', 'Ceremony'];

  const filteredPhotos = GALLERY_DATA.filter((p) =>
    selectedCat === 'All' ? true : p.category === selectedCat
  );

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setLightboxIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
            <Image className="w-4 h-4 text-orange-500" /> Championship Photo Memories
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Event <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Gallery</span>
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            High-definition sports photography capturing high-stakes action, award ceremonies, and unforgettable moments.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCat === c
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Masonry / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setLightboxIndex(index)}
              className="group relative h-72 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-soft cursor-pointer"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase">
                  {photo.category}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <h3 className="font-extrabold text-base tracking-tight">{photo.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-1">{photo.caption}</p>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-3 rounded-full bg-blue-600 text-white shadow-2xl">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-3 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 text-white rounded-full bg-slate-900/80 border border-slate-800 hover:bg-blue-600 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 p-3 text-white rounded-full bg-slate-900/80 border border-slate-800 hover:bg-blue-600 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full text-center space-y-4">
            <img
              src={filteredPhotos[lightboxIndex].image}
              alt={filteredPhotos[lightboxIndex].title}
              className="max-h-[70vh] mx-auto rounded-3xl border-2 border-slate-800 object-contain shadow-2xl"
            />
            <div className="text-white space-y-1">
              <h3 className="text-xl font-bold">{filteredPhotos[lightboxIndex].title}</h3>
              <p className="text-xs text-slate-400">{filteredPhotos[lightboxIndex].caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
