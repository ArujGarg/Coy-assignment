import { beforeEach, describe, expect, it } from "vitest";
import { createLocalDb, type DB } from "../src/db";
import { getFeed, getMatches, swipe, SwipeError } from "../src/matching";
import { seed } from "../src/seed";
import { ME } from "../src/types";

let db: DB;
const likers = async () => (await db.like.findMany()).map((r) => r.likerId);
const nonLiker = async () => {
  const l = await likers();
  return (await getFeed(db, ME)).find((p) => !l.includes(p.id))!;
};

beforeEach(async () => {
  db = await createLocalDb(); // in-memory Postgres, schema from the Prisma migrations
  await seed(db);
});

describe("seed", () => {
  it("has 30+ profiles and 8-10 who liked me", async () => {
    expect((await getFeed(db, ME)).length).toBeGreaterThanOrEqual(30);
    const n = (await likers()).length;
    expect(n).toBeGreaterThanOrEqual(8);
    expect(n).toBeLessThanOrEqual(10);
  });
});

describe("swipe", () => {
  it("does not match when only I like them", async () => {
    expect(await swipe(db, ME, (await nonLiker()).id, "like")).toEqual({ matched: false });
    expect(await getMatches(db, ME)).toHaveLength(0);
  });

  it("does not match when I pass on someone who liked me", async () => {
    expect(await swipe(db, ME, (await likers())[0], "pass")).toEqual({ matched: false });
    expect(await getMatches(db, ME)).toHaveLength(0);
  });

  it("matches when it is mutual", async () => {
    const id = (await likers())[0];
    const res = await swipe(db, ME, id, "like");
    expect(res.matched).toBe(true);
    expect(res.match?.id).toBe(id);
    expect((await getMatches(db, ME)).map((p) => p.id)).toEqual([id]);
  });

  it("is idempotent: repeat swipes return the same result and never duplicate", async () => {
    const id = (await likers())[0];
    const first = await swipe(db, ME, id, "like");
    expect(await swipe(db, ME, id, "like")).toEqual(first);
    // a later, different swipe can't rewrite history either
    expect(await swipe(db, ME, id, "pass")).toEqual(first);
    expect(await getMatches(db, ME)).toHaveLength(1);
    expect(await db.swipe.count({ where: { targetId: id } })).toBe(1);
  });

  it("rejects unknown targets and self-swipes", async () => {
    await expect(swipe(db, ME, "nope", "like")).rejects.toThrow(SwipeError);
    await expect(swipe(db, ME, ME, "like")).rejects.toThrow(SwipeError);
  });
});

describe("feed", () => {
  it("excludes anything already swiped (like or pass)", async () => {
    const [a, b] = await getFeed(db, ME);
    await swipe(db, ME, a.id, "like");
    await swipe(db, ME, b.id, "pass");
    const ids = (await getFeed(db, ME)).map((p) => p.id);
    expect(ids).not.toContain(a.id);
    expect(ids).not.toContain(b.id);
  });

  it("is stable between calls", async () => {
    expect(await getFeed(db, ME)).toEqual(await getFeed(db, ME));
  });

  it("never leaks who liked me", async () => {
    const l = await likers();
    const feed = await getFeed(db, ME);
    const likedMe = feed.filter((p) => l.includes(p.id));
    const others = feed.filter((p) => !l.includes(p.id));
    expect(likedMe.length).toBeGreaterThan(0);

    // same exact set of fields for everyone, none of them like-related
    const keys = Object.keys(others[0]).sort();
    for (const p of likedMe) expect(Object.keys(p).sort()).toEqual(keys);
    expect(JSON.stringify(feed)).not.toMatch(/like/i);

    // and liked-me profiles aren't clustered at the front of the feed
    expect(feed.slice(0, 10).filter((p) => l.includes(p.id)).length).toBeLessThan(10);
  });

  it("a non-matching like/pass response reveals nothing about likers", async () => {
    const pass = await swipe(db, ME, (await likers())[0], "pass");
    const miss = await swipe(db, ME, (await nonLiker()).id, "like");
    expect(pass).toEqual(miss);
  });
});
