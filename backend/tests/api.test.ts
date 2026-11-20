import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { createLocalDb } from "../src/db";
import { seed } from "../src/seed";

let api: ReturnType<typeof request>;

beforeEach(async () => {
  const db = await createLocalDb(); // in-memory Postgres
  await seed(db);
  api = request(createApp(db));
});

const swipe = (body: unknown) => api.post("/api/swipe").send(body as object);

describe("express API", () => {
  it("GET /api/feed returns profiles with only public fields", async () => {
    const res = await api.get("/api/feed").expect(200);
    expect(res.body.profiles.length).toBeGreaterThanOrEqual(30);
    expect(Object.keys(res.body.profiles[0]).sort()).toEqual(["age", "bio", "city", "id", "interests", "name", "photo"]);
  });

  it("POST /api/swipe validates the body", async () => {
    await swipe({ targetId: "p01", direction: "maybe" }).expect(400);
    await swipe({}).expect(400);
    await api.post("/api/swipe").set("Content-Type", "application/json").send("{not json").expect(400);
  });

  it("POST /api/swipe returns 404 for an unknown profile", async () => {
    await swipe({ targetId: "nope", direction: "like" }).expect(404);
  });

  it("a mutual like matches, shows up in /api/matches, and leaves the feed", async () => {
    const res = await swipe({ targetId: "p01", direction: "like" }).expect(200); // p01 is seeded as having liked me
    expect(res.body).toMatchObject({ matched: true, match: { id: "p01" } });

    const matches = await api.get("/api/matches").expect(200);
    expect(matches.body.matches.map((p: { id: string }) => p.id)).toEqual(["p01"]);

    const feed = await api.get("/api/feed").expect(200);
    expect(feed.body.profiles.map((p: { id: string }) => p.id)).not.toContain("p01");
  });

  it("repeat swipes are idempotent", async () => {
    const first = await swipe({ targetId: "p01", direction: "like" });
    const again = await swipe({ targetId: "p01", direction: "pass" });
    expect(again.body).toEqual(first.body);
  });

  it("POST /api/reset (used by the UI button) re-seeds too", async () => {
    await swipe({ targetId: "p01", direction: "like" });
    await api.post("/api/reset").expect(200);
    expect((await api.get("/api/matches")).body.matches).toEqual([]);
    expect((await api.get("/api/feed")).body.profiles.length).toBeGreaterThanOrEqual(30);
  });

  it("GET /api/reset re-seeds (outside production)", async () => {
    await swipe({ targetId: "p01", direction: "like" });
    await api.get("/api/reset").expect(200);
    const matches = await api.get("/api/matches");
    expect(matches.body.matches).toEqual([]);
  });
});
