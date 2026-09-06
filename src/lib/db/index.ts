import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const rawUrl =
  process.env.DATABASE_URL ||
  (process.env.VERCEL ? '' : 'postgresql://yogayjain@localhost:5432/aagam');

const isLocalhostDb = /localhost|127\.0\.0\.1/i.test(rawUrl);
const connectionString = process.env.VERCEL && isLocalhostDb ? '' : rawUrl;

const pool = connectionString
  ? new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 10_000 })
  : null;

export const db = pool ? drizzle(pool, { schema }) : (null as unknown as ReturnType<typeof drizzle>);
export const dbAvailable = Boolean(pool);
export { schema };
export type Database = typeof db;
