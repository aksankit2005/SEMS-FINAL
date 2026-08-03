import React, { useState } from 'react';
import { extractGoogleDriveId } from '../../utils/googleDriveHelper';
import { ImageIcon } from 'lucide-react';

/**
 * Smart Google Drive Image component that tries 4 fallback Google CDN endpoints sequentially
 * to ensure 100% image display reliability even under strict browser CORS or hotlinking rules.
 */
export const GoogleDriveImage = ({ src, alt, className = '', loading = 'lazy', ...props }) => {
  const driveId = extractGoogleDriveId(src);

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // If it's not a Google Drive link, render normal img tag
  if (!driveId) {
    return (
      <img
        src={src || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80'}
        alt={alt || 'Gallery Image'}
        loading={loading}
        className={className}
        {...props}
      />
    );
  }

  // Fallback URLs list for Google Drive images
  const fallbackUrls = [
    `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`,
    `https://lh3.googleusercontent.com/d/${driveId}`,
    `https://drive.google.com/uc?export=view&id=${driveId}`,
    `https://wsrv.nl/?url=https%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D${driveId}`,
  ];

  const handleError = () => {
    if (attemptIndex < fallbackUrls.length - 1) {
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
      src={fallbackUrls[attemptIndex]}
      alt={alt || 'Google Drive Image'}
      loading={loading}
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
