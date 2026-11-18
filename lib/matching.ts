import type { DB } from "./db";
import type { Profile, SwipeDirection, SwipeResult } from "./types";

type Row = Omit<Profile, "interests"> & { interests: string };

// Explicit column list: only public profile fields ever leave the DB layer.
const COLS = "p.id, p.name, p.age, p.photo, p.bio, p.city, p.interests";
const toProfile = (r: Row): Profile => ({ ...r, interests: JSON.parse(r.interests) });

export class SwipeError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Profiles `userId` hasn't swiped on, in a stable (pre-shuffled) order. Carries no like info. */
export function getFeed(db: DB, userId: string): Profile[] {
  const rows = db
    .prepare(
      `SELECT ${COLS} FROM profiles p
       WHERE p.id != @userId
         AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.user_id = @userId AND s.target_id = p.id)
       ORDER BY p.position`
    )
    .all({ userId }) as Row[];
  return rows.map(toProfile);
}

/** Mutual matches only, newest first. */
export function getMatches(db: DB, userId: string): Profile[] {
  const rows = db
    .prepare(
      `SELECT ${COLS} FROM matches m JOIN profiles p ON p.id = m.other_id
       WHERE m.user_id = ? ORDER BY m.created_at DESC, m.rowid DESC`
    )
    .all(userId) as Row[];
  return rows.map(toProfile);
}

function matchFor(db: DB, userId: string, targetId: string): Profile | undefined {
  const row = db
    .prepare(`SELECT ${COLS} FROM matches m JOIN profiles p ON p.id = m.other_id WHERE m.user_id = ? AND m.other_id = ?`)
    .get(userId, targetId) as Row | undefined;
  return row && toProfile(row);
}

/**
 * Record a swipe. Idempotent: swiping the same target again returns the original outcome
 * and never changes state. A match needs BOTH sides to have liked, and is created in the
 * same transaction as the swipe so we can't end up with half-written state.
 */
export function swipe(db: DB, userId: string, targetId: string, direction: SwipeDirection): SwipeResult {
  if (userId === targetId) throw new SwipeError("cannot swipe on yourself", 400);

  return db.transaction((): SwipeResult => {
    const target = db.prepare("SELECT 1 FROM profiles WHERE id = ?").get(targetId);
    if (!target) throw new SwipeError("profile not found", 404);

    const inserted = db
      .prepare("INSERT OR IGNORE INTO swipes (user_id, target_id, direction) VALUES (?, ?, ?)")
      .run(userId, targetId, direction).changes;

    if (inserted && direction === "like") {
      const theyLikedMe = db.prepare("SELECT 1 FROM likes WHERE liker_id = ? AND liked_id = ?").get(targetId, userId);
      if (theyLikedMe) {
        db.prepare("INSERT OR IGNORE INTO matches (user_id, other_id) VALUES (?, ?)").run(userId, targetId);
      }
    }

    const match = matchFor(db, userId, targetId);
    return match ? { matched: true, match } : { matched: false };
  })();
}
