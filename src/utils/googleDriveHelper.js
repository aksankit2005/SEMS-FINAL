/**
 * Utility functions for Google Drive URL parsing, direct media embedding,
 * and direct file downloading.
 */

// Extracts Google Drive File ID from multiple sharing URL formats
export const extractGoogleDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Format 1: drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  // Format 2: drive.google.com/open?id=FILE_ID or id=FILE_ID
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  // Format 3: drive.google.com/uc?id=FILE_ID or export=view&id=FILE_ID
  const ucMatch = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  return null;
};

// Converts any media URL into a high-res display image / preview thumbnail
export const getMediaPreviewUrl = (url, mediaType = 'image') => {
  if (!url) return 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80';

  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    // 100% visible Google Drive thumbnail API endpoint (bypasses CORS & hotlinking blocks)
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  }

  return url;
};

// Secondary fallback URL for Google Drive images if thumbnail fails
export const getGoogleDriveFallbackUrl = (url) => {
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }
  return url;
};

// Generates high-res video poster thumbnail for Google Drive & Cloudinary videos
export const getVideoThumbnailUrl = (url, fallbackCover = null) => {
  if (fallbackCover) return fallbackCover;
  if (!url) return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80';

  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  }

  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/so_0/').replace(/\.[^/.]+$/, '.jpg');
  }

  return url;
};

// Generates embed URL for Google Drive videos (or direct video sources)
export const getVideoEmbedUrl = (url) => {
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  return url;
};

// Generates direct download link for Google Drive or direct files
export const getMediaDownloadUrl = (url) => {
  if (!url) return '#';
  const driveId = extractGoogleDriveId(url);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
  }
  return url;
};

// Triggers direct browser download for images and videos
export const triggerMediaDownload = async (url, filename = 'download') => {
  try {
    const downloadUrl = getMediaDownloadUrl(url);

    // If it's a direct Google Drive link, open direct download endpoint in blank target or anchor
    const driveId = extractGoogleDriveId(url);
    if (driveId) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // For direct image/video blob downloads
    const response = await fetch(downloadUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Network response failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err) {
    console.warn('Fallback download method triggered due to CORS:', err);
    // Fallback: open URL directly in a new window/tab for browser native download
    window.open(getMediaDownloadUrl(url), '_blank');
    return true;
  }
};
