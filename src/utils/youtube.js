/**
 * Extract YouTube Video ID from standard YouTube URLs, shortlinks, or live stream links.
 * Examples:
 * https://www.youtube.com/watch?v=VIDEO_ID
 * https://youtu.be/VIDEO_ID
 * https://www.youtube.com/live/VIDEO_ID
 * https://www.youtube.com/embed/VIDEO_ID
 */
export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If it does not contain http / slashes / dots, check for raw 11-char video ID
  if (!trimmed.includes('/') && !trimmed.includes('.') && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Check standard YouTube patterns
  const ytMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return ytMatch[1];
  }

  // URL object parsing with strict domain check
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host === 'youtube-nocookie.com';
    if (!isYouTubeHost) return null;

    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && /^[a-zA-Z0-9_-]{11}$/.test(lastSegment)) {
      return lastSegment;
    }
  } catch (e) {}

  return null;
};

export const getYouTubeEmbedUrl = (videoId, autoplay = true, allowNativeFullscreen = false) => {
  if (!videoId) return null;
  const cleanId = extractYouTubeVideoId(videoId) || videoId;
  return `https://www.youtube.com/embed/${cleanId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&fs=${allowNativeFullscreen ? 1 : 0}`;
};
