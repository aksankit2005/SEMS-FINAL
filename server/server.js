import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { envConfig } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

import adminRoutes from './routes/adminRoutes.js';
import prRoutes from './routes/prRoutes.js';
import collegeHeadRoutes from './routes/collegeHeadRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { initDatabaseSchema } from './config/dbInit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
app.set('trust proxy', 1);

// ─── SECURITY HEADERS (Helmet.js) ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ─── COMPRESSION ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ────────────────────────────────────────────────────────────────────
const parseOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://sems-final.vercel.app',
  ];
  if (!envConfig.allowedOrigins) return defaults;
  const envOrigins = envConfig.allowedOrigins.split(',')
    .map(o => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return Array.from(new Set([...defaults, ...envOrigins]));
};

const allowedOrigins = parseOrigins();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    if (envConfig.nodeEnv !== 'production') {
      console.warn(`[CORS Warning] Origin '${origin}' allowed in development mode.`);
      return callback(null, true);
    }
    console.error(`[CORS Error] Origin '${origin}' blocked by CORS policy.`);
    return callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.options('*', cors());

// ─── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api', adminRoutes);
app.use('/api', prRoutes);
app.use('/api', collegeHeadRoutes);
app.use('/api', coordinatorRoutes);
app.use('/api', publicRoutes);

// ─── STATIC ASSETS & SPA SERVING (Production Full-Stack) ─────────────────────
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────
app.use('/api/*', notFoundHandler);
app.use(globalErrorHandler);

// ─── PROCESS CRASH GUARDS ────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message);
  process.exit(1);
});

// ─── START SERVER / EXPORT ───────────────────────────────────────────────────
if (process.env.VERCEL !== '1') {
  app.listen(envConfig.port, async () => {
    console.log(`🚀 SEMS API Server running on port ${envConfig.port}`);
    console.log(`🔒 NODE_ENV: ${envConfig.nodeEnv}`);
    await initDatabaseSchema();
  });
}

export default app;

