import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seed } from "@/lib/seed";

export const dynamic = "force-dynamic";

// Wipe swipes/matches and re-seed, handy for demos. Off in production unless ALLOW_RESET=true.
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_RESET !== "true") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await seed(await getDb());
  return NextResponse.json({ ok: true });
}
