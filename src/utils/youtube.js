/**
 * Extract YouTube Video ID from standard YouTube URLs, shortlinks, or live stream links.
 * Examples:
 * https://www.youtube.com/watch?v=VIDEO_ID
 * https://youtu.be/VIDEO_ID
 * https://www.youtube.com/live/VIDEO_ID
 * https://www.youtube.com/embed/VIDEO_ID
 */
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|live\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
};

export const getYouTubeEmbedUrl = (videoId, autoplay = true) => {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&fs=0`;
};
