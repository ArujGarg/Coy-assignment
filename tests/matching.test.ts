import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type DB } from "../lib/db";
import { getFeed, getMatches, swipe, SwipeError } from "../lib/matching";
import { seed } from "../lib/seed";
import { ME } from "../lib/types";

let db: DB;
const likers = () => (db.prepare("SELECT liker_id FROM likes").all() as { liker_id: string }[]).map((r) => r.liker_id);
const nonLiker = () => getFeed(db, ME).find((p) => !likers().includes(p.id))!;

beforeEach(() => {
  db = createDb(":memory:");
  seed(db);
});

describe("seed", () => {
  it("has 30+ profiles and 8-10 who liked me", () => {
    expect(getFeed(db, ME).length).toBeGreaterThanOrEqual(30);
    expect(likers().length).toBeGreaterThanOrEqual(8);
    expect(likers().length).toBeLessThanOrEqual(10);
  });
});

describe("swipe", () => {
  it("does not match when only I like them", () => {
    const res = swipe(db, ME, nonLiker().id, "like");
    expect(res).toEqual({ matched: false });
    expect(getMatches(db, ME)).toHaveLength(0);
  });

  it("does not match when I pass on someone who liked me", () => {
    expect(swipe(db, ME, likers()[0], "pass")).toEqual({ matched: false });
    expect(getMatches(db, ME)).toHaveLength(0);
  });

  it("matches when it is mutual", () => {
    const id = likers()[0];
    const res = swipe(db, ME, id, "like");
    expect(res.matched).toBe(true);
    expect(res.match?.id).toBe(id);
    expect(getMatches(db, ME).map((p) => p.id)).toEqual([id]);
  });

  it("is idempotent: repeat swipes return the same result and never duplicate", () => {
    const id = likers()[0];
    const first = swipe(db, ME, id, "like");
    expect(swipe(db, ME, id, "like")).toEqual(first);
    // a later, different swipe can't rewrite history either
    expect(swipe(db, ME, id, "pass")).toEqual(first);
    expect(getMatches(db, ME)).toHaveLength(1);
    expect(db.prepare("SELECT COUNT(*) n FROM swipes WHERE target_id = ?").get(id)).toEqual({ n: 1 });
  });

  it("rejects unknown targets and self-swipes", () => {
    expect(() => swipe(db, ME, "nope", "like")).toThrow(SwipeError);
    expect(() => swipe(db, ME, ME, "like")).toThrow(SwipeError);
  });
});

describe("feed", () => {
  it("excludes anything already swiped (like or pass)", () => {
    const [a, b] = getFeed(db, ME);
    swipe(db, ME, a.id, "like");
    swipe(db, ME, b.id, "pass");
    const ids = getFeed(db, ME).map((p) => p.id);
    expect(ids).not.toContain(a.id);
    expect(ids).not.toContain(b.id);
  });

  it("is stable between calls", () => {
    expect(getFeed(db, ME)).toEqual(getFeed(db, ME));
  });

  it("never leaks who liked me", () => {
    const feed = getFeed(db, ME);
    const likedMe = feed.filter((p) => likers().includes(p.id));
    const others = feed.filter((p) => !likers().includes(p.id));
    expect(likedMe.length).toBeGreaterThan(0);

    // same exact set of fields for everyone, none of them like-related
    const keys = Object.keys(others[0]).sort();
    for (const p of likedMe) expect(Object.keys(p).sort()).toEqual(keys);
    expect(JSON.stringify(feed)).not.toMatch(/like/i);

    // and liked-me profiles aren't clustered at the front of the feed
    const firstTen = feed.slice(0, 10).filter((p) => likers().includes(p.id)).length;
    expect(firstTen).toBeLessThan(10);
  });

  it("a non-matching like/pass response reveals nothing about likers", () => {
    const pass = swipe(db, ME, likers()[0], "pass");
    const miss = swipe(db, ME, nonLiker().id, "like");
    expect(pass).toEqual(miss);
  });
});
