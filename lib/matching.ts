import type { DB } from "./db";
import type { Profile, SwipeDirection, SwipeResult } from "./types";

// Explicit column list: only public profile fields ever leave the DB layer.
const COLS = "p.id, p.name, p.age, p.photo, p.bio, p.city, p.interests";

export class SwipeError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Profiles `userId` hasn't swiped on, in a stable (pre-shuffled) order. Carries no like info. */
export function getFeed(db: DB, userId: string): Promise<Profile[]> {
  return db.query<Profile>(
    `SELECT ${COLS} FROM profiles p
     WHERE p.id != $1
       AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.user_id = $1 AND s.target_id = p.id)
     ORDER BY p.sort_order`,
    [userId]
  );
}

/** Mutual matches only, newest first. */
export function getMatches(db: DB, userId: string): Promise<Profile[]> {
  return db.query<Profile>(
    `SELECT ${COLS} FROM matches m JOIN profiles p ON p.id = m.other_id
     WHERE m.user_id = $1 ORDER BY m.created_at DESC`,
    [userId]
  );
}

async function matchFor(db: DB, userId: string, targetId: string): Promise<Profile | undefined> {
  const [row] = await db.query<Profile>(
    `SELECT ${COLS} FROM matches m JOIN profiles p ON p.id = m.other_id WHERE m.user_id = $1 AND m.other_id = $2`,
    [userId, targetId]
  );
  return row;
}

/**
 * Record a swipe. Idempotent: swiping the same target again returns the original outcome
 * and never changes state. A match needs BOTH sides to have liked, and is created in the
 * same transaction as the swipe so we can't end up with half-written state.
 */
export async function swipe(db: DB, userId: string, targetId: string, direction: SwipeDirection): Promise<SwipeResult> {
  if (userId === targetId) throw new SwipeError("cannot swipe on yourself", 400);

  return db.transaction(async (tx) => {
    const target = await tx.query("SELECT 1 FROM profiles WHERE id = $1", [targetId]);
    if (target.length === 0) throw new SwipeError("profile not found", 404);

    const inserted = await tx.query(
      "INSERT INTO swipes (user_id, target_id, direction) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING 1",
      [userId, targetId, direction]
    );

    if (inserted.length > 0 && direction === "like") {
      const theyLikedMe = await tx.query("SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2", [targetId, userId]);
      if (theyLikedMe.length > 0) {
        await tx.query("INSERT INTO matches (user_id, other_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, targetId]);
      }
    }

    const match = await matchFor(tx, userId, targetId);
    return match ? { matched: true, match } : { matched: false };
  });
}
