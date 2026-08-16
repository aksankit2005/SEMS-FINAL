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

const dbConfig = {
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(dbConfig);
const prismaAdapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter: prismaAdapter });

// Helper to execute SQL query with fallback
export const queryDb = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('Database Query Error:', err.message);
    return null;
  }
};

