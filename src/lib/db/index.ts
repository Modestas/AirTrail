import {
  CamelCasePlugin,
  Kysely,
  PostgresDialect,
  type RawBuilder,
  sql,
} from 'kysely';
import pg from 'pg';

import type { DB } from './schema';

import { env } from '$env/dynamic/private';

const isLocal = env.POSTGRES_PRISMA_URL?.includes('localhost');
const sslConfig = isLocal
  ? false
  : env.SUPABASE_SSL_CERT
    ? { ca: env.SUPABASE_SSL_CERT.replace(/\\n/g, '\n'), rejectUnauthorized: true }
    : { rejectUnauthorized: false };

export const pool = new pg.Pool({
  connectionString: env.POSTGRES_PRISMA_URL,
  ssl: sslConfig,
});
const dialect = new PostgresDialect({ pool });

export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()],
});

export function json<T>(obj: T): RawBuilder<T> {
  return sql`${JSON.stringify(obj)}`;
}
