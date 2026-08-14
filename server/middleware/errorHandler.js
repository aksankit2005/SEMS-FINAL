// 404 catch-all handler for unknown API routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Global error handler
// eslint-disable-next-line no-unused-vars
export const globalErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload too large (max 1MB).' });
  }
  console.error('[Server Error]', err.message);

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    message: 'Internal server error.',
    ...(isDev && { error: err.message }),
  });
};
