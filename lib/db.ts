import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./seed";

export type DB = Database.Database;

// Schema notes:
//  - swipes:  what "me" did to others (like/pass). UNIQUE => a profile can only be swiped once.
//  - likes:   others who already liked "me". Private: no query ever returns this table directly.
//  - matches: created only when both sides liked. UNIQUE => no duplicates.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  age       INTEGER NOT NULL,
  photo     TEXT NOT NULL,
  bio       TEXT NOT NULL,
  city      TEXT NOT NULL,
  interests TEXT NOT NULL,
  position  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS swipes (
  user_id    TEXT NOT NULL,
  target_id  TEXT NOT NULL REFERENCES profiles(id),
  direction  TEXT NOT NULL CHECK (direction IN ('like','pass')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, target_id)
);
CREATE TABLE IF NOT EXISTS likes (
  liker_id TEXT NOT NULL REFERENCES profiles(id),
  liked_id TEXT NOT NULL,
  UNIQUE (liker_id, liked_id)
);
CREATE TABLE IF NOT EXISTS matches (
  user_id    TEXT NOT NULL,
  other_id   TEXT NOT NULL REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, other_id)
);
`;

export function createDb(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

const g = globalThis as unknown as { __coyDb?: DB };

/** Shared connection (survives Next.js dev hot reloads). Seeds on first run. */
export function getDb(): DB {
  if (!g.__coyDb) {
    g.__coyDb = createDb(process.env.DB_PATH ?? path.join(process.cwd(), "data", "coy.db"));
    const { n } = g.__coyDb.prepare("SELECT COUNT(*) AS n FROM profiles").get() as { n: number };
    if (n === 0) seed(g.__coyDb);
  }
  return g.__coyDb;
}
