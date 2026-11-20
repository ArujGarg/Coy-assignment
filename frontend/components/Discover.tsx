"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Profile, SwipeDirection, SwipeResult } from "@/lib/types";
import { CardBody, SwipeCard, type CardHandle } from "./SwipeCard";
import { MatchScreen } from "./MatchScreen";
import { MatchesView } from "./MatchesView";

const btn = "pop-btn flex h-16 w-16 items-center justify-center rounded-full text-[28px] font-extrabold disabled:pointer-events-none";

export function Discover() {
  const [queue, setQueue] = useState<Profile[] | null>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [justMatched, setJustMatched] = useState<Profile | null>(null);
  const [view, setView] = useState<"swipe" | "matches">("swipe");
  const [error, setError] = useState<string | null>(null);
  const card = useRef<CardHandle>(null);

  const flash = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  }, []);

  const load = useCallback(async () => {
    const [f, m] = await Promise.all([fetch("/api/feed").then((r) => r.json()), fetch("/api/matches").then((r) => r.json())]);
    setQueue(f.profiles);
    setMatches(m.matches);
  }, []);

  useEffect(() => {
    load().catch(() => setError("couldn't load profiles. refresh to retry"));
  }, [load]);

  // Demo helper: wipe swipes/matches on the server, then reload the feed.
  const resetDemo = async () => {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      await load();
      setView("swipe");
    } catch {
      flash("couldn't reset the demo");
    }
  };

  // Optimistic: drop the card right away, reconcile with the server response.
  const onSwiped = useCallback(
    async (profile: Profile, direction: SwipeDirection) => {
      setQueue((q) => q && q.filter((p) => p.id !== profile.id));
      try {
        const res = await fetch("/api/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: profile.id, direction }),
        });
        if (!res.ok) throw new Error();
        const { matched, match }: SwipeResult = await res.json();
        if (matched && match) {
          setJustMatched(match);
          setMatches((m) => [match, ...m.filter((x) => x.id !== match.id)]);
        }
      } catch {
        setQueue((q) => q && [profile, ...q]); // roll back
        flash("swipe didn't save. try again");
      }
    },
    [flash]
  );

  const top = queue?.[0];
  const canSwipe = view === "swipe" && !!top && !justMatched;

  useEffect(() => {
    if (!canSwipe) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") card.current?.swipe("like");
      if (e.key === "ArrowLeft") card.current?.swipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSwipe]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-2 pt-1">
        <h2 className="text-[22px]">{view === "swipe" ? "discover" : "matches"}</h2>
        <button
          onClick={() => setView(view === "swipe" ? "matches" : "swipe")}
          className="rounded-full border-2 border-line bg-soft px-3.5 py-1.5 text-[13px] font-extrabold"
        >
          {view === "swipe" ? `💘 matches (${matches.length})` : "← back"}
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {view === "matches" ? (
          <MatchesView matches={matches} onReset={resetDemo} />
        ) : queue === null ? (
          <p className="pt-24 text-center font-semibold text-muted">{error ?? "finding people… ✨"}</p>
        ) : !top ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <div className="text-5xl">🤫</div>
            <h2 className="text-[26px]">you&apos;ve seen everyone</h2>
            <p className="text-muted">check back soon. new people show up all the time.</p>
            <button onClick={resetDemo} className="pop-btn mt-4 rounded-full bg-pink px-6 py-3 text-[15px] font-extrabold text-white">
              ↺ start over
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="relative mx-5 mb-4 mt-1 min-h-0 flex-1">
              {queue[1] && (
                <div className="pop absolute inset-0 flex scale-[0.95] flex-col overflow-hidden bg-white opacity-90" aria-hidden>
                  <CardBody profile={queue[1]} />
                </div>
              )}
              <SwipeCard key={top.id} ref={card} profile={top} onSwiped={(d) => onSwiped(top, d)} />
            </div>
            <div className="flex justify-center gap-8 pb-4">
              <button aria-label="pass" onClick={() => card.current?.swipe("pass")} className={`${btn} bg-white text-danger`}>
                ✕
              </button>
              <button aria-label="like" onClick={() => card.current?.swipe("like")} className={`${btn} bg-pink text-white`}>
                ♥
              </button>
            </div>
          </div>
        )}
      </div>

      {error && queue !== null && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-yellow px-4 py-2 text-sm font-bold">{error}</div>
      )}
      <AnimatePresence>
        {justMatched && (
          <MatchScreen
            match={justMatched}
            onClose={() => setJustMatched(null)}
            onViewMatches={() => {
              setJustMatched(null);
              setView("matches");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
