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
  // Check if raw 11-character video ID was passed directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // Fallback query parameter parsing for ?v=...
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const vParam = parsed.searchParams.get('v');
    if (vParam && vParam.length === 11) {
      return vParam;
    }
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && lastSegment.length === 11) {
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
