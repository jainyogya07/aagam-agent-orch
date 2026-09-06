import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.VERCEL ? '' : 'postgresql://yogayjain@localhost:5432/aagam');

const pool = connectionString
  ? new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 10_000 })
  : null;

export const db = pool ? drizzle(pool, { schema }) : (null as unknown as ReturnType<typeof drizzle>);
export const dbAvailable = Boolean(pool);
export { schema };
export type Database = typeof db;
