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

function buildPoolConfig() {
  const connectionString = env.POSTGRES_PRISMA_URL;
  if (!connectionString) return { connectionString };

  // Strip sslmode from the URL so pg doesn't override our ssl config
  const url = new URL(connectionString);
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  url.searchParams.delete('sslmode');

  if (isLocal) {
    return { connectionString: url.toString() };
  }

  const ssl = env.SUPABASE_SSL_CERT
    ? { ca: env.SUPABASE_SSL_CERT.replace(/\\n/g, '\n'), rejectUnauthorized: true }
    : { rejectUnauthorized: false };

  return { connectionString: url.toString(), ssl };
}

export const pool = new pg.Pool(buildPoolConfig());
const dialect = new PostgresDialect({ pool });

export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()],
});

export function json<T>(obj: T): RawBuilder<T> {
  return sql`${JSON.stringify(obj)}`;
}
