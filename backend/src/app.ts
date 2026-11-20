import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import type { DB } from "./db";
import { getFeed, getMatches, swipe, SwipeError } from "./matching";
import { seed } from "./seed";
import { ME } from "./types";

export function createApp(db: DB) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Profiles you haven't swiped on.
  app.get("/api/feed", async (_req, res) => {
    res.json({ profiles: await getFeed(db, ME) });
  });

  // Record a like/pass; says whether it created a match.
  app.post("/api/swipe", async (req, res) => {
    const { targetId, direction } = req.body ?? {};
    if (typeof targetId !== "string" || (direction !== "like" && direction !== "pass")) {
      res.status(400).json({ error: 'expected { targetId: string, direction: "like" | "pass" }' });
      return;
    }
    res.json(await swipe(db, ME, targetId, direction));
  });

  // Mutual matches only.
  app.get("/api/matches", async (_req, res) => {
    res.json({ matches: await getMatches(db, ME) });
  });

  // Wipe swipes/matches and re-seed, so a reviewer can try the demo again. Off in production unless ALLOW_RESET=true.
  // POST is what the UI button uses; GET is kept so you can also just open the URL.
  const reset: RequestHandler = async (_req, res) => {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_RESET !== "true") {
      res.status(404).json({ error: "not found" });
      return;
    }
    await seed(db);
    res.json({ ok: true });
  };
  app.get("/api/reset", reset);
  app.post("/api/reset", reset);

  // Express 5 sends errors thrown in async handlers here.
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = err instanceof SwipeError ? err.status : (err.status ?? 500); // body-parser errors carry status 400
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? "internal error" : err.message });
  };
  app.use(onError);

  return app;
}
