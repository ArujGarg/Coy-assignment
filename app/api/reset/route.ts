import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seed } from "@/lib/seed";

export const dynamic = "force-dynamic";

// Dev-only: wipe swipes/matches and re-seed, handy for demos.
export function GET() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "not found" }, { status: 404 });
  seed(getDb());
  return NextResponse.json({ ok: true });
}
