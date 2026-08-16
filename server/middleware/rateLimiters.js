import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login attempts per 15 min per IP
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated generous limiter for public read-only endpoints (spectator browsing & live scoring sync)
export const publicReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests/min per IP to comfortably handle spectator views & live updates
  message: { message: 'Too many requests on public spectator endpoints. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter for mutations, coordinator/admin operations, and submissions
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests/min per IP
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
