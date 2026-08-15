import app from '../server/server.js';
import { initDatabaseSchema } from '../server/config/dbInit.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDatabaseSchema();
      isDbInitialized = true;
    } catch (err) {
      console.error('Lazy DB Init Warning:', err.message);
    }
  }
  return app(req, res);
}
