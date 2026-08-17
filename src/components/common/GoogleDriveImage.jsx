import React, { useState, useEffect } from 'react';
import { extractGoogleDriveId } from '../../utils/googleDriveHelper';
import { extractYouTubeVideoId } from '../../utils/youtube';
import { ImageIcon } from 'lucide-react';

/**
 * Smart Media Image component that handles:
 * 1. YouTube video thumbnail generation & multi-CDN fallback
 * 2. Google Drive image direct viewing with 4 CDN fallback endpoints
 * 3. Standard Cloudinary / Web images with graceful error handling
 */
export const GoogleDriveImage = ({ src, alt, className = '', loading = 'lazy', ...props }) => {
  const driveId = extractGoogleDriveId(src);
  const ytId = extractYouTubeVideoId(src);

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setAttemptIndex(0);
    setHasFailedAll(false);
  }, [src]);

  // Case 1: YouTube Video Thumbnail
  if (ytId) {
    const youtubeThumbnails = [
      `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
    ];

    const handleYtError = () => {
      if (attemptIndex < youtubeThumbnails.length - 1) {
        setAttemptIndex((prev) => prev + 1);
      } else {
        setHasFailedAll(true);
      }
    };

    if (hasFailedAll) {
      return (
        <div className={`flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-400 text-center space-y-2 ${className}`}>
          <ImageIcon className="w-8 h-8 opacity-40 text-red-500" />
          <p className="text-[11px] font-bold text-red-400">YouTube Video</p>
        </div>
      );
    }

    return (
      <img
        src={youtubeThumbnails[attemptIndex]}
        alt={alt || 'YouTube Video Cover'}
        loading={loading}
        onError={handleYtError}
        className={className}
        {...props}
      />
    );
  }

  // Case 2: Google Drive Image with 4 CDN Fallbacks
  if (driveId) {
    const driveFallbacks = [
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`,
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
      `https://wsrv.nl/?url=https%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D${driveId}`,
    ];

    const handleDriveError = () => {
      if (attemptIndex < driveFallbacks.length - 1) {
        setAttemptIndex((prev) => prev + 1);
      } else {
        setHasFailedAll(true);
      }
    };

    if (hasFailedAll) {
      return (
        <div className={`flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-400 text-center space-y-2 ${className}`}>
          <ImageIcon className="w-8 h-8 opacity-40" />
          <p className="text-[11px] font-extrabold text-rose-400">Google Drive Permission Required</p>
          <p className="text-[10px] text-slate-400 max-w-[200px]">
            Set Google Drive file sharing to "Anyone with the link".
          </p>
        </div>
      );
    }

    return (
      <img
        src={driveFallbacks[attemptIndex]}
        alt={alt || 'Google Drive Image'}
        loading={loading}
        onError={handleDriveError}
        className={className}
        {...props}
      />
    );
  }

  // Case 3: Standard Image URL (Cloudinary / Unsplash / Direct)
  return (
    <img
      src={src || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80'}
      alt={alt || 'Gallery Image'}
      loading={loading}
      className={className}
      onError={(e) => {
        if (!e.target.src.includes('unsplash.com')) {
          e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80';
        }
      }}
      {...props}
    />
  );
};
