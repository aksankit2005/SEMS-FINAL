import 'dotenv/config';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('🔴 [DATABASE CONFIG ERROR] DATABASE_URL environment variable is missing!');
}

const isLocal = databaseUrl ? (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) : false;

// Strip sslmode query param so node-pg honors { rejectUnauthorized: false } without certificate chain errors
const sanitizedUrl = databaseUrl ? databaseUrl.replace(/([?&])sslmode=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '') : databaseUrl;

const dbConfig = {
  connectionString: sanitizedUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(dbConfig);
pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]:', err.message);
});
const prismaAdapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter: prismaAdapter });

// Helper to execute SQL query with fallback
export const queryDb = async (text, params) => {
  if (!databaseUrl) return null;
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database Query Error:', err.message);
    return null;
  }
};

