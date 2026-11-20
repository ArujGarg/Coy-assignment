import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { SEED_VERSION, seed } from "./seed";

export type DB = PrismaClient;

/**
 * Embedded Postgres (PGlite) client, used for local dev without a DATABASE_URL and for tests.
 * The schema is applied from the same Prisma migration files that `prisma migrate deploy` runs in production.
 * Pass no `dataDir` for an in-memory database.
 */
export async function createLocalDb(dataDir?: string): Promise<DB> {
  const [{ PGlite }, { PrismaPGlite }] = await Promise.all([import("@electric-sql/pglite"), import("pglite-prisma-adapter")]);
  if (dataDir) fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  const pg = new PGlite(dataDir);

  const [{ exists }] = (await pg.query("SELECT to_regclass('public.profiles') IS NOT NULL AS exists")).rows as { exists: boolean }[];
  if (!exists) {
    const dir = path.join(process.cwd(), "prisma", "migrations");
    for (const name of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, name, "migration.sql");
      if (fs.existsSync(file)) await pg.exec(fs.readFileSync(file, "utf8"));
    }
  }
  return new PrismaClient({ adapter: new PrismaPGlite(pg) });
}

function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) return Promise.resolve(new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) })); // serverless: 1 connection per instance
  return createLocalDb(path.join(process.cwd(), "data", "pglite"));
}

/** Connects, and seeds on first run and whenever SEED_VERSION changes. Called once at server start. */
export async function getDb(): Promise<DB> {
  const db = await connect();
  const version = await db.meta.findUnique({ where: { key: "seed_version" } });
  if (version?.value !== SEED_VERSION) await seed(db);
  return db;
}
