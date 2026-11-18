import type { DB } from "./db";
import type { Profile, SwipeDirection, SwipeResult } from "./types";

// Explicit field list: only public profile fields ever leave the DB layer.
const PUBLIC = { id: true, name: true, age: true, photo: true, bio: true, city: true, interests: true } as const;

export class SwipeError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Profiles `userId` hasn't swiped on, in a stable (pre-shuffled) order. Carries no like info. */
export function getFeed(db: DB, userId: string): Promise<Profile[]> {
  return db.profile.findMany({
    where: { id: { not: userId }, swipesReceived: { none: { userId } } },
    orderBy: { sortOrder: "asc" },
    select: PUBLIC,
  });
}

/** Mutual matches only, newest first. */
export async function getMatches(db: DB, userId: string): Promise<Profile[]> {
  const rows = await db.match.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { other: { select: PUBLIC } },
  });
  return rows.map((r) => r.other);
}

/**
 * Record a swipe. Idempotent: swiping the same target again returns the original outcome
 * and never changes state. A match needs BOTH sides to have liked, and is created in the
 * same transaction as the swipe so we can't end up with half-written state.
 */
export async function swipe(db: DB, userId: string, targetId: string, direction: SwipeDirection): Promise<SwipeResult> {
  if (userId === targetId) throw new SwipeError("cannot swipe on yourself", 400);

  return db.$transaction(async (tx) => {
    const target = await tx.profile.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) throw new SwipeError("profile not found", 404);

    // skipDuplicates => a repeat swipe inserts nothing (count 0) instead of failing
    const { count } = await tx.swipe.createMany({ data: [{ userId, targetId, direction }], skipDuplicates: true });

    if (count > 0 && direction === "like") {
      const theyLikedMe = await tx.like.findUnique({ where: { likerId_likedId: { likerId: targetId, likedId: userId } } });
      if (theyLikedMe) await tx.match.createMany({ data: [{ userId, otherId: targetId }], skipDuplicates: true });
    }

    const match = await tx.match.findUnique({
      where: { userId_otherId: { userId, otherId: targetId } },
      select: { other: { select: PUBLIC } },
    });
    return match ? { matched: true, match: match.other } : { matched: false };
  });
}
