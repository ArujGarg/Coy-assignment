import path from "node:path";
import { seed } from "./seed";

/** Minimal async Postgres interface so the logic runs on Neon (prod) or PGlite (dev/tests). */
export interface DB {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<R>(fn: (tx: DB) => Promise<R>): Promise<R>;
}

// Schema notes:
//  - swipes:  what "me" did to others (like/pass). UNIQUE => a profile can only be swiped once.
//  - likes:   others who already liked "me". Private: no query ever returns this table directly.
//  - matches: created only when both sides liked. UNIQUE => no duplicates.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  age        INTEGER NOT NULL,
  photo      TEXT NOT NULL,
  bio        TEXT NOT NULL,
  city       TEXT NOT NULL,
  interests  JSONB NOT NULL,
  sort_order INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS swipes (
  user_id    TEXT NOT NULL,
  target_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction  TEXT NOT NULL CHECK (direction IN ('like','pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_id)
);
CREATE TABLE IF NOT EXISTS likes (
  liker_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id TEXT NOT NULL,
  UNIQUE (liker_id, liked_id)
);
CREATE TABLE IF NOT EXISTS matches (
  user_id    TEXT NOT NULL,
  other_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, other_id)
);
`;

/** Create tables if missing (one statement per query: PGlite's extended protocol rejects batches). */
export async function migrate(db: DB) {
  for (const stmt of SCHEMA.split(";").map((x) => x.trim()).filter(Boolean)) await db.query(stmt);
}

type PgLike = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  transaction?: <R>(fn: (tx: PgLike) => Promise<R>) => Promise<R>;
};

function wrap(c: PgLike, transaction: DB["transaction"]): DB {
  return { query: async <T>(sql: string, params?: unknown[]) => (await c.query(sql, params)).rows as T[], transaction };
}

/** Adapter over an embedded PGlite instance (used for local dev without DATABASE_URL, and tests). */
export function fromPglite(pg: PgLike): DB {
  const make = (c: PgLike): DB => wrap(c, (fn) => pg.transaction!((tx) => fn(make(tx))));
  return make(pg);
}

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 1 }); // serverless: one connection per instance
    const make = (c: { query: PgLike["query"] }): DB =>
      wrap(c, async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const out = await fn(make(client));
          await client.query("COMMIT");
          return out;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      });
    return make(pool);
  }
  const { PGlite } = await import("@electric-sql/pglite");
  return fromPglite(new PGlite(path.join(process.cwd(), "data", "pglite")) as unknown as PgLike);
}

const g = globalThis as unknown as { __coyDb?: Promise<DB> };

/** Shared connection (survives Next.js dev hot reloads). Creates the schema and seeds on first run. */
export function getDb(): Promise<DB> {
  g.__coyDb ??= (async () => {
    const db = await connect();
    await migrate(db);
    const [{ n }] = await db.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM profiles");
    if (n === 0) await seed(db);
    return db;
  })().catch((e) => {
    g.__coyDb = undefined; // allow retry after a failed connect
    throw e;
  });
  return g.__coyDb;
}
