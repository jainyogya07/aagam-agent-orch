// ============================================================
// Database Client — Agent Resource Exchange
// ============================================================

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yogayjain@localhost:5432/aagam',
});

export const db = drizzle(pool, { schema });
export { schema };
export type Database = typeof db;
