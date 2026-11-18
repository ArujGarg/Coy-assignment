# Coy SDE Intern Assignment: Part B Build Brief

Read `Coy_SDE_Intern_Assignment.pdf` in this folder first. This file is the implementation plan. Implement it fully.

Build a standalone app for the Coy SDE Intern assignment (Part B: "Discover" tab). It will be a public GitHub repo, so keep it clean with a good README.

## Stack
- Next.js (App Router) + TypeScript, Tailwind, Framer Motion for swipe
- Next.js API routes for the backend
- SQLite via better-sqlite3 (file DB, persists across reloads)
- Single hardcoded logged-in user (id "me"). No auth.
- Mobile-first: design for 375px, center a max-w-[440px] column on desktop. Use dvh not vh.

## App shell
- Bottom tab bar with two tabs: "Home" (blank placeholder, leave empty) and "Discover" (all the work).
- Header: "coy" wordmark in heavy weight with a pink dot after it (like the real app).

## Theme (match app.getcoy.com exactly)
Font: "Bricolage Grotesque" (Google Font via next/font), fallback system-ui. Headings weight 800 with tight negative letter-spacing (~ -0.035em, e.g. 30px h1 = -1.05px). Body 16px.

CSS variables:
```
--bg #fff; --soft #f6f4fa; --line #ece9f2; --text #15121d; --muted #6d6979
--pink #ff3d81; --pink-strong #d81e63; --pink-soft #ffe4ef
--yellow #ffe45c; --lilac #e7e0ff; --mint #cbf4e0; --sky #d7ecff; --peach #ffe1cf
--ok #0e8f48; --danger #d92d3a
--edge: 2px solid var(--text); --pop: 3px 3px 0 var(--text); --radius: 20px
```

Style language = neo-brutalist "pop":
- Featured cards: pastel fill (lilac/mint/peach/sky), 2px solid #15121d border, hard offset shadow 3px 3px 0 #15121d, radius 20px.
- Secondary cards/buttons: white, 2px solid var(--line), radius 18px.
- Primary button: pink fill (#ff3d81), dark 2px border, hard shadow, bold text, pill shape.
- Dashed 2px border for "add" style affordances; round icon buttons with var(--soft) fill.
- Playful emoji in headings/empty states (e.g. 🤫). Friendly, lowercase-leaning, short copy.

Apply to Discover:
- Profile card: white or pastel bg, 2px dark border, hard pop shadow, 20px radius, photo on top, name+age in 800 weight, bio in muted, interests as small pill chips in pastel colors (rotate lilac/mint/peach/sky/yellow).
- Swipe feedback: "LIKE" stamp in --ok green and "NOPE" stamp in --danger red, bordered stamps that rotate slightly and fade in with drag distance.
- Action buttons (desktop + mobile): round pass (X) and like (heart, pink) with dark border + pop shadow, press = translate(3px,3px) and shadow removed.
- "It's a match!" screen: full-screen pink/yellow with big 800-weight heading, both profile photos, "Keep swiping" button.
- Matches view: list of cards in the same pastel/edge style.
- Empty state: emoji + "You've seen everyone" + short line.

## Data
- Seed at least 30 mock profiles: name, age, photo (picsum/pravatar placeholders), short bio, city or college, interests[].
- Seed ~8-10 of them as having already liked "me" (stored in a likes table) so matches can happen in the demo.

## API (all persist in SQLite)
- `GET /api/feed`: profiles "me" hasn't swiped on. MUST NOT include any field hinting who liked me (no likedMe flag, nothing in payload). Shuffle or stable order.
- `POST /api/swipe` `{ targetId, direction: "like"|"pass" }`: idempotent (UNIQUE(user,target) constraint, repeat swipe returns existing result). Returns `{ matched: boolean, match?: profile }`. Match only if target already liked me AND I like them. Create match in a transaction, no duplicates.
- `GET /api/matches`: mutual matches only.
- Also add a dev-only `GET /api/reset` to re-seed for demos.

## Privacy rule (core promise)
Never reveal who liked the user unless mutual. Passes are never revealed. A swiped profile never reappears.

## UI behavior
- One card at a time, stack preview of next card behind it.
- Drag right = like, left = pass on mobile (touch + mouse), with rotation + stamp. Buttons on desktop, arrow keys too.
- Optimistic UI; show match screen immediately when API returns matched: true.
- Reload keeps state (feed excludes swiped, matches persist).

## Tests
Jest/Vitest tests on the match logic: no match if one-sided, match on mutual, idempotent repeat swipe, feed excludes swiped, feed never leaks like info.

## Deliverables
README with setup, API docs, privacy decisions, and screenshots. Keep code minimal and readable.
