import app from '../server/server.js';
import { initDatabaseSchema } from '../server/config/dbInit.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  // Only execute dynamic schema init in non-production environments to prevent cold start latency & DDL locks
  if (!isDbInitialized && process.env.NODE_ENV !== 'production') {
    try {
      await initDatabaseSchema();
      isDbInitialized = true;
    } catch (err) {
      console.warn('Lazy DB Init Warning:', err.message);
    }
  }
  return app(req, res);
}
